/**
 * Structured answer types + robust parsing of the model's JSON output.
 *
 * Kapag nag-return ang modelo ng invalid o kulang na JSON, may repair
 * pipeline tayo: strip markdown fences → extract balanced {...} → validate
 * → kung talagang sira, i-wrap as a generic text answer (never crash).
 */

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export interface AskResult {
  answer: PaanoAnswer;
  raw: string;
  repaired: boolean;
}

export type AnswerCategory =
  | "cooking"
  | "commute"
  | "diy"
  | "first_aid"
  | "docs"
  | "generic";

export type Confidence = "high" | "medium" | "low";

export interface OfficialLink {
  label: string;
  url: string;
}

export interface TimeRange {
  min: number;
  max: number;
  unit: "min" | "hr";
}

export interface FareRange {
  min: number;
  max: number;
  currency: "PHP";
}

export interface CookingSpecific {
  category: "cooking";
  ingredients: { item: string; amount: string | null }[];
  servings: string;
  tips: string[];
}

export interface CommuteSpecific {
  category: "commute";
  origin: string;
  destination: string;
  modes: string[];
  route_names: string[];
  time_range: TimeRange;
  fare_range: FareRange;
  fare_notes: string | null;
}

export interface DiySpecific {
  category: "diy";
  tools: string[];
  materials: string[];
  safety_warning: string | null;
}

export interface FirstAidSpecific {
  category: "first_aid";
  severity: "mild" | "moderate";
  do_list: string[];
  don_t_list: string[];
  see_doctor_threshold: string;
}

export interface DocsSpecific {
  category: "docs";
  agency: string;
  requirements: string[];
  fees: { item: string; amount: string; updated: string | null }[];
  processing_time: string | null;
  last_verified: string;
  prerequisites: string[];
  alerts: string[];
}

export interface GenericSpecific {
  category: "generic";
  note: string;
}

export type CategorySpecific =
  | CookingSpecific
  | CommuteSpecific
  | DiySpecific
  | FirstAidSpecific
  | DocsSpecific
  | GenericSpecific;

export interface PaanoAnswer {
  category: AnswerCategory;
  title: string;
  summary: string;
  steps: string[];
  confidence: Confidence;
  disclaimer: string | null;
  official_link: OfficialLink | null;
  category_specific: CategorySpecific | null;
}

/* ------------------------------------------------------------------ */
/* Parsing helpers                                                     */
/* ------------------------------------------------------------------ */

const CATEGORIES: AnswerCategory[] = [
  "cooking",
  "commute",
  "diy",
  "first_aid",
  "docs",
  "generic",
];

const CONFIDENCES: Confidence[] = ["high", "medium", "low"];

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  // Dedupe — para hindi magkaroon ng duplicate keys sa UI (hal. dalawang
  // "bus" sa modes na inilabas ng modelo).
  return [
    ...new Set(
      v
        .map((x) => asString(x))
        .filter((x): x is string => x !== null),
    ),
  ].slice(0, 30);
}

function asNumber(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Extract the first balanced {...} JSON object from a string, tolerating
 * markdown fences and stray text. Returns null if no object found. */
export function extractJsonObject(text: string): string | null {
  let clean = text.trim();
  // Strip ```json ... ``` fences
  clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = clean.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < clean.length; i++) {
    const ch = clean[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return clean.slice(start, i + 1);
    }
  }
  return null;
}

/** Validate/normalize raw parsed JSON into a PaanoAnswer. Falls back to a
 * generic answer when the shape is broken — the UI never sees raw garbage. */
export function normalizeAnswer(raw: unknown): PaanoAnswer | null {
  if (typeof raw !== "object" || raw === null) return null;

  const r = raw as Record<string, unknown>;
  const category = CATEGORIES.includes(r.category as AnswerCategory)
    ? (r.category as AnswerCategory)
    : "generic";
  const confidence = CONFIDENCES.includes(r.confidence as Confidence)
    ? (r.confidence as Confidence)
    : "medium";

  const base: PaanoAnswer = {
    category,
    title: asString(r.title) ?? "Paano nga ba?",
    summary: asString(r.summary) ?? "",
    steps: asStringArray(r.steps),
    confidence,
    disclaimer: asString(r.disclaimer),
    official_link: normalizeLink(r.official_link),
    category_specific: null,
  };

  const spec = r.category_specific;
  if (typeof spec !== "object" || spec === null) return base;

  const s = spec as Record<string, unknown>;
  // Dalawang posibleng hugis ang sinusuportahan:
  //   nested: { commute: { origin: ... } }   ← kung ano ang inilalarawan ng prompt
  //   flat:   { origin: ... }                ← defensive, kung ganito lumabas
  const nested = (s[category] as unknown) ?? null;
  const src =
    typeof nested === "object" && nested !== null
      ? (nested as Record<string, unknown>)
      : s;

  switch (category) {
    case "cooking":
      base.category_specific = {
        category: "cooking",
        ingredients: Array.isArray(src.ingredients)
          ? (src.ingredients as unknown[])
              .filter((i) => typeof i === "object" && i !== null)
              .map((i) => {
                const it = i as Record<string, unknown>;
                return { item: asString(it.item) ?? "?", amount: asString(it.amount) };
              })
              .slice(0, 30)
          : [],
        servings: asString(src.servings) ?? "",
        tips: asStringArray(src.tips),
      };
      break;
    case "commute": {
      const tr = (typeof src.time_range === "object" && src.time_range !== null
        ? src.time_range
        : {}) as Record<string, unknown>;
      const fr = (typeof src.fare_range === "object" && src.fare_range !== null
        ? src.fare_range
        : {}) as Record<string, unknown>;
      base.category_specific = {
        category: "commute",
        origin: asString(src.origin) ?? "?",
        destination: asString(src.destination) ?? "?",
        modes: asStringArray(src.modes),
        route_names: asStringArray(src.route_names),
        time_range: {
          min: asNumber(tr.min) ?? 0,
          max: asNumber(tr.max) ?? 0,
          unit: tr.unit === "hr" ? "hr" : "min",
        },
        fare_range: {
          min: asNumber(fr.min) ?? 0,
          max: asNumber(fr.max) ?? 0,
          currency: "PHP",
        },
        fare_notes: asString(src.fare_notes),
      };
      break;
    }
    case "diy":
      base.category_specific = {
        category: "diy",
        tools: asStringArray(src.tools),
        materials: asStringArray(src.materials),
        safety_warning: asString(src.safety_warning),
      };
      break;
    case "first_aid":
      base.category_specific = {
        category: "first_aid",
        severity: src.severity === "moderate" ? "moderate" : "mild",
        do_list: asStringArray(src.do_list),
        don_t_list: asStringArray(src.don_t_list),
        see_doctor_threshold: asString(src.see_doctor_threshold) ?? "",
      };
      break;
    case "docs":
      base.category_specific = {
        category: "docs",
        agency: asString(src.agency) ?? "?",
        requirements: asStringArray(src.requirements),
        fees: Array.isArray(src.fees)
          ? (src.fees as unknown[])
              .filter((f) => typeof f === "object" && f !== null)
              .map((f) => {
                const it = f as Record<string, unknown>;
                return {
                  item: asString(it.item) ?? "?",
                  amount: asString(it.amount) ?? "?",
                  updated: asString(it.updated),
                };
              })
              .slice(0, 20)
          : [],
        processing_time: asString(src.processing_time),
        last_verified: asString(src.last_verified) ?? "hindi pa nabe-verify",
        prerequisites: asStringArray(src.prerequisites),
        alerts: asStringArray(src.alerts),
      };
      break;
    case "generic":
      base.category_specific = { category: "generic", note: asString(src.note) ?? "" };
      break;
  }
  return base;
}

function normalizeLink(v: unknown): OfficialLink | null {
  if (typeof v !== "object" || v === null) return null;
  const url = asString((v as Record<string, unknown>).url);
  if (!url) return null;
  let safeUrl: string;
  try {
    const parsed = new URL(url);
    // http/https lang — i-block ang javascript:, data:, at iba pa
    // (XSS risk kapag nirender sa <a href>).
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    safeUrl = parsed.href;
  } catch {
    return null;
  }
  return {
    url: safeUrl,
    label: asString((v as Record<string, unknown>).label) ?? safeUrl,
  };
}

/** Parse raw model output into a PaanoAnswer with graceful degradation:
 * 1. try extract + parse as JSON
 * 2. validate/normalize
 * 3. kung lahat pumalpak, return null — the provider wrapper produces a
 *    human-readable fallback from the raw text. */
export function parseModelOutput(rawText: string): PaanoAnswer | null {
  const obj = extractJsonObject(rawText);
  if (!obj) return null;
  try {
    return normalizeAnswer(JSON.parse(obj));
  } catch {
    return null;
  }
}

/** Last-resort answer kapag sira talaga ang model output — para may
 * maipakita pa rin ang UI imbes na blank card. */
export function wrapRawText(raw: string): PaanoAnswer {
  return {
    category: "generic",
    title: "Sagot (raw)",
    summary:
      "Hindi ma-parse ng PAANO ang structured na sagot. Narito ang direktang tugon ng modelo:",
    steps: raw
      .split(/\n+/)
      .map((l) => l.replace(/^[-*•\d.)\s]+/, "").trim())
      .filter((l) => l.length > 0)
      .slice(0, 20),
    confidence: "low",
    disclaimer: null,
    official_link: null,
    category_specific: null,
  };
}

/**
 * I-serialize ang answer bilang text para sa chat history — para maalala
 * ng modelo ang mga naunang sagot sa follow-up questions. Ito ang pumupuno
 * sa dating bug kung saan nawawala ang assistant answers sa context.
 */
export function answerToText(a: PaanoAnswer): string {
  const lines: string[] = [
    `[Sagot ng PAANO — ${a.category}] ${a.title}. ${a.summary}`,
  ];
  const spec = a.category_specific;
  if (spec?.category === "commute") {
    lines.push(
      `Byahe: ~${spec.time_range.min}–${spec.time_range.max} min. ` +
        `Pamasahe: ₱${spec.fare_range.min}–₱${spec.fare_range.max}.`,
    );
    if (spec.route_names.length > 0) {
      lines.push(`Ruta: ${spec.route_names.join(", ")}.`);
    }
    if (spec.fare_notes) lines.push(`Tandaan sa pamasahe: ${spec.fare_notes}`);
  }
  if (spec?.category === "docs") {
    if (spec.prerequisites.length > 0) {
      lines.push(`Prerequisite: ${spec.prerequisites.join(", ")}.`);
    }
    if (spec.alerts.length > 0) lines.push(`Alerts: ${spec.alerts.join(" ")}`);
    if (spec.fees.length > 0) {
      lines.push(`Bayarin: ${spec.fees.map((f) => `${f.item} — ${f.amount}`).join("; ")}.`);
    }
  }
  if (a.steps.length > 0) {
    lines.push("Steps: " + a.steps.map((s, i) => `${i + 1}. ${s}`).join(" "));
  }
  if (a.disclaimer) lines.push(`Disclaimer: ${a.disclaimer}`);
  if (a.official_link) {
    lines.push(`Opisyal na source: ${a.official_link.label} (${a.official_link.url})`);
  }
  return lines.join("\n");
}

/** Fallback answer nang walang tawag sa modelo (para sa hard errors). */
export function fallbackAnswer(message: string): PaanoAnswer {
  return {
    category: "generic",
    title: "Sandali lang…",
    summary: message,
    steps: [],
    confidence: "low",
    disclaimer: null,
    official_link: null,
    category_specific: null,
  };
}
