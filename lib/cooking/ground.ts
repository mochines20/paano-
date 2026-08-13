import { getPalengkePrices, PRICE_SOURCE_NOTE } from "@/lib/cooking/prices";

/**
 * Cooking grounding — budget/pantry mode, ginagawa nang conversational:
 * "anong ulam sa ₱200, may manok ako?" → idinikit ang palengke prices +
 * budget context sa tanong bago pumunta sa LLM.
 */

export interface CookingGrounding {
  context: string;
  budget: number | null;
  pantryItems: string[];
}

const COOKING_KEYWORDS = [
  "ulam",
  "luto",
  "lutuin",
  "magluto",
  "recipe",
  "adobo",
  "sinigang",
  "tinola",
  "pancit",
  "ginisa",
  "kare-kare",
  "nilaga",
  "tocino",
  "tapa",
  "menudo",
  "afritada",
  "kaldereta",
  "bicol",
  "pinakbet",
  "paksiw",
  "pritong",
  "inihaw",
  "ulam ko",
  "pangkain",
  "kainin",
  "ulam na",
];

const BUDGET_RE = /(?:₱|php|pesos?|piso)\s*(\d{2,5})/i;

const PANTRY_ITEMS = [
  "manok",
  "baboy",
  "baka",
  "isda",
  "galunggong",
  "tilapia",
  "itlog",
  "toyo",
  "suka",
  "bawang",
  "sibuyas",
  "kamatis",
  "patatas",
  "kanin",
  "bigas",
  "repolyo",
  "kangkong",
  "sitaw",
  "talong",
  "mantika",
  "gata",
  "giniling",
];

export function isCookingQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return COOKING_KEYWORDS.some((k) => q.includes(k));
}

export async function groundCookingQuestion(
  question: string,
): Promise<CookingGrounding | null> {
  try {
    if (!isCookingQuestion(question)) return null;

    const prices = await getPalengkePrices();
    const budget = BUDGET_RE.exec(question)?.[1]
      ? Number(BUDGET_RE.exec(question)![1])
      : null;

    // Pantry detection: "may manok ako" / "may itlog at toyo" patterns.
    const q = question.toLowerCase();
    const pantryItems = PANTRY_ITEMS.filter((item) =>
      new RegExp(`(?:may|meron|available|gagamitin|natira|tira)\\s+[^.,!?]{0,40}?\\b${item}\\b`, "i").test(q),
    ).slice(0, 6);

    const parts: string[] = [];
    parts.push("[Palengke price reference — gamitin ito kung tugma:");
    parts.push(
      prices
        .slice(0, 14)
        .map((p) => `${p.item} ₱${p.pricePerKg}${p.unit ? `/${p.unit}` : "/kg"}`)
        .join(", "),
    );
    if (budget) {
      parts.push(`Budget ng user: ₱${budget} — magmungkahi ng ulam na kasya dito, at i-breakdown ang tantiya ng gastos.`);
    }
    if (pantryItems.length > 0) {
      parts.push(`May pantry ang user: ${pantryItems.join(", ")} — unahin ang mga ulam na gumagamit nito.`);
    }
    parts.push(`${PRICE_SOURCE_NOTE} Huwag mag-imbento ng presyo na wala sa reference.]`);

    return { context: parts.join(" "), budget, pantryItems };
  } catch {
    return null;
  }
}
