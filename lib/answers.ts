/**
 * Structured answer types + robust parsing of the model's JSON output.
 *
 * Kapag nag-return ang modelo ng invalid o kulang na JSON, may repair
 * pipeline tayo: strip markdown fences → extract balanced {...} → validate
 * → kung talagang sira, i-wrap as a generic text answer (never crash).
 */

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
  return v
    .map((x) => asString(x))
    .filter((x): x is string => x !== null)
    .slice(0, 30);
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
  switch (category) {
    case "cooking":
      base.category_specific = {
        category: "cooking",
        ingredients: Array.isArray(s.ingredients)
          ? (s.ingredients as unknown[])
              .filter((i) => typeof i === "object" && i !== null)
              .map((i) => {
                const it = i as Record<string, unknown>;
                return { item: asString(it.item) ?? "?", amount: asString(it.amount) };
              })
              .slice(0, 30)
          : [],
        servings: asString(s.servings) ?? "",
        tips: asStringArray(s.tips),
      };
      break;
    case "commute": {
      const tr = (typeof s.time_range === "object" && s.time_range !== null
        ? s.time_range
        : {}) as Record<string, unknown>;
      const fr = (typeof s.fare_range === "object" && s.fare_range !== null
        ? s.fare_range
        : {}) as Record<string, unknown>;
      base.category_specific = {
        category: "commute",
        origin: asString(s.origin) ?? "?",
        destination: asString(s.destination) ?? "?",
        modes: asStringArray(s.modes),
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
        fare_notes: asString(s.fare_notes),
      };
      break;
    }
    case "diy":
      base.category_specific = {
        category: "diy",
        tools: asStringArray(s.tools),
        materials: asStringArray(s.materials),
        safety_warning: asString(s.safety_warning),
      };
      break;
    case "first_aid":
      base.category_specific = {
        category: "first_aid",
        severity: s.severity === "moderate" ? "moderate" : "mild",
        do_list: asStringArray(s.do_list),
        don_t_list: asStringArray(s.don_t_list),
        see_doctor_threshold: asString(s.see_doctor_threshold) ?? "",
      };
      break;
    case "docs":
      base.category_specific = {
        category: "docs",
        agency: asString(s.agency) ?? "?",
        requirements: asStringArray(s.requirements),
        fees: Array.isArray(s.fees)
          ? (s.fees as unknown[])
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
        processing_time: asString(s.processing_time),
        last_verified: asString(s.last_verified) ?? "hindi pa nabe-verify",
      };
      break;
    case "generic":
      base.category_specific = { category: "generic", note: asString(s.note) ?? "" };
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
 * 3. kung lahat pumalpak, return null — the API route will produce a
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
