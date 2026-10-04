import {
  loadGtfs,
  findRoutesBetween,
  findRoutesTo,
  estimateRouteKm,
} from "@/lib/commute/gtfs";
import {
  estimateFareBand,
  estimateFareBandForModes,
  FARE_SOURCE,
  nonFormulaModeContext,
} from "@/lib/commute/fares";
import {
  buildTerminalContext,
  findMultiLegRoutes,
  findTerminalRoutes,
} from "@/lib/commute/terminals";
import type { AnswerProvenance, PaanoAnswer } from "@/lib/answers";
import {
  commuteProvenance,
  orderCommuteSources,
  sourceRef,
  type CommuteSourceRef,
} from "@/lib/commute/sources";

/**
 * Commute grounding — dinidikit ang source-prioritized datos (terminal
 * snapshots, community GTFS, at LTFRB estimates) sa tanong bago pumunta sa
 * LLM, para hindi puro haka-haka ang sagot ng modelo.
 *
 * Ang result ay:
 *  - context: text na ia-append sa user message (LLM grounding)
 *  - routes / km / fareBand: structured data para i-override ang sagot
 *    pagkatapos i-parse (data-verified fare at route names)
 */

export interface CommuteGrounding {
  context: string;
  routes: string[];
  km: number | null;
  fareBand: { min: number; max: number } | null;
  fareBasis: "terminal" | "ltfrb_estimate" | null;
  sources: CommuteSourceRef[];
  provenance: AnswerProvenance;
}

function noMatchCommuteGrounding(origin: string, dest: string): CommuteGrounding {
  return {
    context: `[Commute data reference — walang matching route na nahanap para sa ${origin} → ${dest} sa kasalukuyang grounded dataset. Huwag mag-imbento ng station, operator, fare, o schedule; humingi ng mas eksaktong landmark o ituro sa user na i-verify sa official source.]`,
    routes: [],
    km: null,
    fareBand: null,
    fareBasis: null,
    sources: [],
    provenance: commuteProvenance(
      [],
      "Walang matching route sa kasalukuyang grounded dataset; hindi dapat hulaan ang exact transfer, fare, o schedule.",
    ),
  };
}

const INTENT_KEYWORDS = [
  "commute",
  "papunta",
  "puntang",
  "pumunta",
  "makapunta",
  "sakay",
  "jeep",
  "bus",
  "lrt",
  "mrt",
  "tricycle",
  "trangkahe",
  "biyahe",
  "byahe",
  "p2p",
  "uv express",
  "van",
  "terminal",
];

export function isCommuteQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return INTENT_KEYWORDS.some((k) => q.includes(k));
}

/** Separator words sa pagitan ng origin at destination. */
const SEP_RE =
  /\b(papuntang|papunta|puntang|patungo|hanggang|pa?punta|to)\b/i;

/** Exported para sa unit tests — place extraction mula sa tanong. */
export function extractPlaces(question: string): { origin?: string; dest?: string } {
  let origin: string | undefined;
  let dest: string | undefined;

  // "mula X [papuntang] Y" — origin = text pagkatapos ng mula/galing/from
  const mula = question.match(/(?:mula|galing|from)\s+([^,;.?!]+)/i);
  if (mula) {
    const rest = mula[1].trim();
    const sepIdx = rest.search(SEP_RE);
    if (sepIdx === -1) {
      origin = rest;
    } else {
      origin = rest.slice(0, sepIdx).trim();
      dest = rest.slice(sepIdx).replace(SEP_RE, "").trim();
    }
  }

  // "papuntang Y" / "papunta sa Y" / "to Y" nang walang mula
  if (!dest) {
    const d = question.match(
      /(?:papunta(?:ng)?|puntang|patungo|hanggang|to)\s+(?:sa\s+)?([^,;.?!]+)/i,
    );
    if (d) dest = d[1].trim();
  }

  // "paano pumunta sa Y" / "paano makapunta sa Y" / "paano magcommute sa Y"
  if (!dest) {
    const d2 = question.match(
      /(?:pumunta|makapunta|magcommute)\s+(?:sa\s+|papunta(?:ng)?\s+)?([^,;.?!]+)/i,
    );
    if (d2) dest = d2[1].trim();
  }

  return {
    origin: origin && origin.length > 1 ? origin : undefined,
    dest: dest && dest.length > 1 ? dest : undefined,
  };
}

/**
 * Bumalik ang grounding para sa commute question, o null kung:
 *  - hindi commute ang tanong, o
 *  - walang GTFS data (data/gtfs/), o
 *  - walang mahanap na kapaki-pakinabang na datos.
 * Hindi dapat mag-throw — grounding lang ito, hindi critical path.
 */
export async function groundCommuteQuestion(
  question: string,
): Promise<CommuteGrounding | null> {
  try {
    if (!isCommuteQuestion(question)) return null;

    const { origin, dest } = extractPlaces(question);
    if (!origin && !dest) return null;

    const parts: string[] = [];
    let routeNames: string[] = [];
    let km: number | null = null;
    let fareBand: { min: number; max: number } | null = null;
    let fareBasis: CommuteGrounding["fareBasis"] = null;
    const sources: CommuteSourceRef[] = [];
    let terminalMatched = false;

    // ── 1. Terminal/operator snapshot (priority over community GTFS) ──
    if (origin && dest) {
      const terminalContext = buildTerminalContext(origin, dest);
      if (terminalContext) {
        parts.push(terminalContext);
        terminalMatched = true;
        const terminalSource = sourceRef("curated-terminal-snapshot");
        if (terminalSource) sources.push(terminalSource);

        const direct = findTerminalRoutes(origin, dest);
        const multiLeg = direct.length > 0 ? [] : findMultiLegRoutes(origin, dest);
        const directFares = direct.slice(0, 3).map((route) => route.fare);
        const multiLegFares = multiLeg
          .slice(0, 3)
          .map((legs) => legs.reduce((sum, leg) => sum + leg.fare, 0));
        const fixedFares = [...directFares, ...multiLegFares];
        if (fixedFares.length > 0) {
          fareBand = { min: Math.min(...fixedFares), max: Math.max(...fixedFares) };
          fareBasis = "terminal";
        }

        const terminalNames = direct.length > 0
          ? direct.slice(0, 3).map((route) => `${route.operator} → ${route.destination}`)
          : multiLeg.slice(0, 2).map((legs) => legs.map((leg) => leg.operator).join(" + "));
        routeNames = [...new Set(terminalNames)].slice(0, 3);
      }
    }

    // ── 2. Community GTFS (route discovery/geometry fallback) ──
    const index = await loadGtfs();
    if (index) {
      const routes =
        origin && dest
          ? findRoutesBetween(index, origin, dest)
          : dest
            ? findRoutesTo(index, dest)
            : [];
      km = origin && dest ? estimateRouteKm(index, origin, dest) : null;
      const gtfsRouteNames = [...new Set(routes.slice(0, 5).map((r) => r.displayName))].slice(0, 3);
      routeNames = [...new Set([...routeNames, ...gtfsRouteNames])].slice(0, 5);

      if (!terminalMatched && km !== null) {
        fareBand = estimateFareBand(km);
        fareBasis = "ltfrb_estimate";
      }

      if (gtfsRouteNames.length > 0 || km) {
        const gtfsSource = sourceRef("sakayph-gtfs");
        if (gtfsSource) sources.push(gtfsSource);
        parts.push("[Commute data reference — gamitin ito kung tugma sa tanong:");
        if (gtfsRouteNames.length > 0) {
          parts.push(`candidate routes: ${gtfsRouteNames.join("; ")}`);
        }
        if (km !== null) {
          parts.push(`estimated distance: ~${km} km`);
          if (fareBand && !terminalMatched) {
            parts.push(
              `LTFRB fare estimate: ₱${fareBand.min}–₱${fareBand.max}. Ito ay formula-based estimate, hindi fixed fare ng operator.`,
            );
          }
        }
        parts.push(
          `Source: SakayPH community GTFS (${gtfsSource?.url ?? "source registry"}). Huwag tawaging official o live ang data; kung hindi tugma, sabihin na fallback/tantiya lang.]`,
        );
      }
    }

    // May origin at destination pero walang na-match na trusted route. Huwag
    // ibalik sa free-form model ang buong desisyon dahil puwede itong gumawa
    // ng mukhang eksaktong transfer/fare mula sa training memory. Ibalik ang
    // explicit no-match grounding para ma-activate ang safe fallback.
    if (parts.length === 0 && origin && dest) {
      return noMatchCommuteGrounding(origin, dest);
    }

    if (parts.length === 0) return null;

    const orderedSources = orderCommuteSources(sources);
    return {
      context: [
        `[Commute source priority: official government > official terminal/operator > LGU > community GTFS > aggregator. Primary source: ${orderedSources[0]?.name ?? "none"}. Fallback data must never be presented as official.]`,
        ...parts,
      ].join(" "),
      routes: routeNames,
      km,
      fareBand,
      fareBasis,
      sources: orderedSources,
      provenance: commuteProvenance(
        orderedSources,
        terminalMatched
          ? "Static terminal/operator snapshot used for route and fixed-fare guidance. Confirm fare, schedule, and availability before departure."
          : "Community GTFS used for route discovery and distance only. Fare is a formula-based estimate; verify with LTFRB/operator before departure.",
      ),
    };
  } catch {
    // Kahit unavailable ang optional GTFS file, panatilihing safe ang
    // behavior para sa may kumpletong origin + destination.
    const { origin, dest } = extractPlaces(question);
    return origin && dest ? noMatchCommuteGrounding(origin, dest) : null;
  }
}

/**
 * I-override ang commute answer gamit ang data-grounded values:
 *  - route_names mula sa GTFS (kung wala pang laman)
 *  - fare_range mula sa LTFRB formula (mas bago kaysa training data ng model)
 *  - fare_notes na may citation
 */
export function applyCommuteGrounding(
  answer: PaanoAnswer,
  g: CommuteGrounding,
): PaanoAnswer {
  if (answer.category !== "commute") return answer;
  const spec = answer.category_specific;
  if (!spec || spec.category !== "commute") return answer;

  let next = { ...spec };
  if (g.routes.length > 0) {
    next = { ...next, route_names: g.routes };
  }
  // VTX/Alabang is a useful destination label, but it is not one guaranteed
  // curbside stop. Keep the answer useful while making the uncertainty visible
  // instead of allowing the model to imply an exact drop-off point.
  if (
    !next.destination_note &&
    /\bvtx\b|starmall\s+alabang|alabang/i.test(next.destination)
  ) {
    next = {
      ...next,
      destination_note:
        "Confirm exact VTX Alabang drop-off point with the driver/operator; nearby Alabang stops may use different names.",
    };
  }
  // Fare band batay sa MGA MODE na sinabi ng modelo (hal. jeepney lang →
  // ₱13–₱15 base; bus lang → ₱13–₱15 base) — mas precise kaysa lahat-ng-mode.
  // P2P, UV Express, at tricycle ay HINDI kasama dahil walang per-km formula.
  const fareBand =
    g.fareBasis === "terminal"
      ? g.fareBand
      : g.km !== null
      ? estimateFareBandForModes(g.km, next.modes) ?? g.fareBand
      : g.fareBand;
  if (fareBand) {
    const nonFormula = nonFormulaModeContext(next.modes);
    const fareNote = g.fareBasis === "terminal"
      ? `Fixed fare mula sa curated terminal snapshot; i-verify sa operator bago bumiyahe.${nonFormula ? ` ${nonFormula}` : ""}`
      : nonFormula
        ? `Tinantiya mula sa ${FARE_SOURCE}. ${nonFormula}`
        : `Tinantiya mula sa ${FARE_SOURCE}`;
    next = {
      ...next,
      fare_range: { min: fareBand.min, max: fareBand.max, currency: "PHP" },
      fare_notes: next.fare_notes
        ? `${next.fare_notes} · ${fareNote}`
        : fareNote,
    };
  }
  const groundedAnswer: PaanoAnswer = {
    ...answer,
    category_specific: next,
    provenance: g.provenance,
    official_link:
      answer.official_link ??
      (g.provenance.url
        ? { label: g.provenance.label, url: g.provenance.url }
        : null),
  };

  // A fallback hit—or no grounded hit at all—is not enough evidence for a
  // safe step-by-step commute answer. Keep the model from turning an
  // unverified guess into a precise-sounding MRT/jeep transfer.
  const onlyDistanceFallback =
    g.routes.length === 0 &&
    (g.sources.some((source) => source.id === "sakayph-gtfs") ||
      (g.fareBasis === null && g.sources.length === 0));
  if (onlyDistanceFallback) {
    return {
      ...groundedAnswer,
      confidence: "low",
      title: groundedAnswer.title || "Kailangan ng mas eksaktong ruta",
      summary:
        "Wala akong nahanap na matching route sa grounded commute data para sa origin at destination na ito. Ayokong manghula ng station o transfer.",
      steps: [
        "Ibigay ang mas eksaktong origin at destination, kasama ang barangay o pinakamalapit na landmark.",
        "I-verify ang aktuwal na ruta, fare, at service status sa operator o official transport source bago bumiyahe.",
      ],
      disclaimer:
        "Walang candidate route na na-verify sa source data; ang sagot na ito ay hindi dapat gamiting exact navigation instruction.",
      // Do not render a zero-valued fare/time card or a route tracker when
      // there is no verified route to track. The provenance line remains
      // visible through the normal answer-card fallback.
      category_specific: null,
    };
  }

  return groundedAnswer;
}
