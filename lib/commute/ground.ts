import {
  loadGtfs,
  findRoutesBetween,
  findRoutesTo,
  estimateRouteKm,
} from "@/lib/commute/gtfs";
import { estimateFareBand, estimateFareBandForModes, FARE_SOURCE } from "@/lib/commute/fares";
import type { PaanoAnswer } from "@/lib/answers";

/**
 * Commute grounding — dinidikit ang totoong datos (GTFS routes + LTFRB
 * fare formulas) sa tanong bago pumunta sa LLM, para hindi puro haka-haka
 * ang sagot ng modelo.
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
];

export function isCommuteQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return INTENT_KEYWORDS.some((k) => q.includes(k));
}

/** Separator words sa pagitan ng origin at destination. */
const SEP_RE =
  /\b(papuntang|papunta|puntang|patungo|hanggang|pa?punta|to)\b/i;

function extractPlaces(question: string): { origin?: string; dest?: string } {
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

    const index = await loadGtfs();
    if (!index) return null;

    const { origin, dest } = extractPlaces(question);
    if (!origin && !dest) return null;

    const routes =
      origin && dest
        ? findRoutesBetween(index, origin, dest)
        : dest
          ? findRoutesTo(index, dest)
          : [];
    const km = origin && dest ? estimateRouteKm(index, origin, dest) : null;
    const fareBand = km !== null ? estimateFareBand(km) : null;

    const routeNames = [...new Set(routes.slice(0, 5).map((r) => r.displayName))].slice(0, 3);
    if (routeNames.length === 0 && !km) return null;

    const parts: string[] = [];
    parts.push("[Commute data reference — gamitin ito kung tugma sa tanong:");
    if (routeNames.length > 0) {
      parts.push(`candidate routes: ${routeNames.join("; ")}`);
    }
    if (km !== null) {
      parts.push(`estimated distance: ~${km} km`);
      if (fareBand) {
        parts.push(
          `LTFRB fare estimate: ₱${fareBand.min}–₱${fareBand.max} (trad jeepney ₱14 + ₱2.00/km, modern jeepney ₱17 + ₱2.40/km, ordinary bus ₱15 + ₱2.49/km)`,
        );
      }
    }
    parts.push(
      `Source: ${FARE_SOURCE} Huwag mag-imbento ng ibang ruta o presyo; kung hindi tugma ang data, sabihin na tantiya lang ang sagot.]`,
    );

    return { context: parts.join(" "), routes: routeNames, km, fareBand };
  } catch {
    return null;
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
  if (g.routes.length > 0 && next.route_names.length === 0) {
    next = { ...next, route_names: g.routes };
  }
  // Fare band batay sa MGA MODE na sinabi ng modelo (hal. jeepney lang →
  // ₱14–₱17 base; bus lang → ₱15–₱18 base) — mas precise kaysa lahat-ng-mode.
  const fareBand =
    g.km !== null
      ? estimateFareBandForModes(g.km, next.modes) ?? g.fareBand
      : g.fareBand;
  if (fareBand) {
    next = {
      ...next,
      fare_range: { min: fareBand.min, max: fareBand.max, currency: "PHP" },
      fare_notes: next.fare_notes
        ? `${next.fare_notes} · Tinantiya mula sa ${FARE_SOURCE}`
        : `Tinantiya mula sa ${FARE_SOURCE}`,
    };
  }
  return { ...answer, category_specific: next };
}
