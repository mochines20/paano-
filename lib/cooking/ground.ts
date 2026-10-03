import { getPalengkePrices, getPriceProvenance, getPriceSourceNote } from "@/lib/cooking/prices";

/**
 * Cooking grounding — budget/pantry mode, ginagawa nang conversational:
 * "anong ulam sa ₱200, may manok ako?" → idinikit ang palengke prices +
 * budget context sa tanong bago pumunta sa LLM.
 */

export interface CookingGrounding {
  context: string;
  budget: number | null;
  pantryItems: string[];
  priceProvenance?: ReturnType<typeof getPriceProvenance>;
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
const PRICE_REQUEST_RE = /(?:magkano|presyo|budget|gastos|cost|price|₱|php|pesos?|piso)/i;

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

    const budget = BUDGET_RE.exec(question)?.[1]
      ? Number(BUDGET_RE.exec(question)![1])
      : null;

    // Pantry detection: "may manok ako" / "may itlog at toyo" patterns.
    const q = question.toLowerCase();
    const pantryItems = PANTRY_ITEMS.filter((item) =>
      new RegExp(`(?:may|meron|available|gagamitin|natira|tira)\\s+[^.,!?]{0,40}?\\b${item}\\b`, "i").test(q),
    ).slice(0, 6);

    // Recipe-only questions must not receive a market-price list. The small
    // model may copy those reference items into the recipe as if they were
    // ingredients, which produces fabricated answers and costs.
    const needsPriceGrounding = Boolean(budget || PRICE_REQUEST_RE.test(question));
    if (!needsPriceGrounding && pantryItems.length === 0) return null;

    const parts: string[] = [];
    let priceProvenance: CookingGrounding["priceProvenance"];
    if (needsPriceGrounding) {
      const prices = await getPalengkePrices();
      priceProvenance = getPriceProvenance();
      const relevant = pantryItems.length > 0
        ? prices.filter((p) => pantryItems.some((item) => p.item.toLowerCase().includes(item)))
        : prices;
      parts.push("[Palengke price reference — presyo lang ito, hindi listahan ng ingredients:");
      parts.push(
        relevant
          .slice(0, 14)
          .map((p) => `${p.item} ₱${p.pricePerKg}${p.unit ? `/${p.unit}` : "/kg"}`)
          .join(", "),
      );
    }
    if (budget) {
      parts.push(`Budget ng user: ₱${budget} — magmungkahi ng ulam na kasya dito, at i-breakdown ang tantiya ng gastos.`);
    }
    if (pantryItems.length > 0) {
      parts.push(`May pantry ang user: ${pantryItems.join(", ")} — unahin ang mga ulam na gumagamit nito.`);
    }
    if (needsPriceGrounding) {
      parts.push(`${getPriceSourceNote()} Huwag mag-imbento ng presyo na wala sa reference.]`);
    } else {
      parts.push("Gamitin ang pantry items bilang context lamang; huwag magdagdag ng presyo.");
    }

    return { context: parts.join(" "), budget, pantryItems, priceProvenance };
  } catch {
    return null;
  }
}
