import type { PaanoAnswer } from "@/lib/answers";

const CURATED_RECIPE_VERSION = "2026-09-30";

function provenance() {
  return {
    label: "PAANO curated recipe",
    asOf: CURATED_RECIPE_VERSION,
    status: "curated" as const,
    note: "Human-reviewed common Filipino recipe; i-adjust ang alat at luto ayon sa sangkap.",
    url: null,
  };
}

/**
 * Guard the curated recipe shortcuts with intent, not a dish-name substring.
 * A user may mention "adobo" while asking about its meaning, history, or a
 * completely different topic; those questions should reach the AI instead
 * of being forced into a recipe card.
 */
export function isRecipeRequest(question: string): boolean {
  const q = question.toLowerCase().trim();
  const hasCookingAction = /\b(?:magluto|luto|lutuin|lulutuin|niluto|recipe|resipe|sangkap|ingredients|ulam|lutong|gumawa)\b/i.test(q);
  const hasFoodSubject = /\b(?:adobo|sinigang|tinola|pancit|pansit|menudo|afritada|kaldereta|kare[- ]?kare|pinakbet|paksiw|manok|chicken|baboy|pork|isda|fish|itlog|egg|kanin|rice)\b/i.test(q);
  return hasCookingAction && hasFoodSubject;
}

export function findCuratedRecipe(question: string): PaanoAnswer | null {
  const q = question.toLowerCase();
  if (!isRecipeRequest(q)) return null;

  if (q.includes("adobo") && (q.includes("kamatis") || q.includes("tomato"))) {
    const meat = q.includes("manok") || q.includes("chicken") ? "manok" : "baboy";
    return {
      category: "cooking",
      title: `${meat === "baboy" ? "Pork" : "Chicken"} Adobo sa Kamatis`,
      summary:
        "Adobong may kamatis na mas malinamnam at bahagyang matamis-asim. Igisa muna ang kamatis para lumabas ang lasa bago pakuluan sa toyo at suka.",
      steps: [
        "Igisa ang bawang at sibuyas sa 1 kutsarang mantika hanggang mabango, saka ilagay ang hiniwang kamatis at lutuin hanggang lumambot.",
        `Ilagay ang 1/2 kilo ${meat} at haluin hanggang bahagyang mag-brown ang labas.`,
        "Idagdag ang 1/4 tasa toyo, 1/4 tasa suka, 1/2 tasa tubig, 2 dahon ng laurel, at 1/2 kutsaritang paminta.",
        "Pakuluan nang 5 minuto nang hindi hinahalo, saka hinaan ang apoy at lutuin nang 30–40 minuto hanggang malambot ang karne.",
        "Tikman at i-adjust ang alat. Kung gusto ng mas malapot na sauce, pakuluan pa nang ilang minuto bago ihain kasama ng kanin.",
      ],
      confidence: "high",
      disclaimer: null,
      official_link: null,
      provenance: provenance(),
      category_specific: {
        category: "cooking",
        ingredients: [
          { item: meat, amount: "1/2 kilo" },
          { item: "kamatis", amount: "3 medium, hiniwa" },
          { item: "bawang", amount: "5 butil, tinadtad" },
          { item: "sibuyas", amount: "1 medium, hiniwa" },
          { item: "toyo", amount: "1/4 tasa" },
          { item: "suka", amount: "1/4 tasa" },
          { item: "tubig", amount: "1/2 tasa" },
          { item: "dahon ng laurel", amount: "2 dahon" },
          { item: "paminta", amount: "1/2 kutsarita" },
          { item: "mantika", amount: "1 kutsara" },
        ],
        servings: "4 tao",
        tips: [
          "Piliin ang hinog pero matigas na kamatis para hindi maging sobrang malabnaw ang sauce.",
          "Kung mas gusto mo ng mas maasim, dagdagan ang suka nang paunti-unti pagkatapos lumambot ang karne.",
        ],
      },
    };
  }

  if (q.includes("sinigang") && (q.includes("baboy") || q.includes("pork"))) {
    return {
      category: "cooking",
      title: "Sinigang na Baboy",
      summary: "Classic na maasim na sabaw gamit ang baboy, sampalok, at gulay. I-adjust ang sampalok at patis ayon sa gusto mong asim at alat.",
      steps: [
        "Pakuluan ang 1.2 litro ng tubig kasama ang sibuyas at kamatis nang 5 minuto.",
        "Ilagay ang baboy at pakuluan hanggang lumambot, mga 45–60 minuto; alisin ang bula sa ibabaw.",
        "Idagdag ang labanos at sitaw, saka lutuin nang 5–7 minuto.",
        "Ihalo ang sampalok o sinigang mix paunti-unti. Tikman bago dagdagan para hindi sumobra ang asim.",
        "Idagdag ang talong at okra, saka lutuin nang 4–5 minuto.",
        "Ilagay ang kangkong sa huli, patayin ang apoy, at timplahan ng patis. Ihain habang mainit.",
      ],
      confidence: "high",
      disclaimer: null,
      official_link: null,
      provenance: provenance(),
      category_specific: {
        category: "cooking",
        ingredients: [
          { item: "baboy (liempo o kasim)", amount: "1/2 kilo" },
          { item: "tubig", amount: "1.2 litro" },
          { item: "sibuyas", amount: "1 medium" },
          { item: "kamatis", amount: "2 piraso" },
          { item: "labanos", amount: "1 maliit" },
          { item: "sitaw", amount: "1 tali" },
          { item: "talong at okra", amount: "2–3 piraso bawat isa" },
          { item: "kangkong", amount: "1 tali" },
          { item: "sampalok o sinigang mix", amount: "ayon sa asim na gusto" },
          { item: "patis", amount: "ayon sa panlasa" },
        ],
        servings: "4 tao",
        tips: ["Mas malinamnam kung may buto ang baboy.", "Huwag sosobrahan ang luto ng gulay para hindi malata."],
      },
    };
  }

  if (q.includes("tinola") && (q.includes("manok") || q.includes("chicken"))) {
    return {
      category: "cooking",
      title: "Tinolang Manok",
      summary: "Mabilis at simpleng tinola na may luya, sayote o hilaw na papaya, at malunggay.",
      steps: [
        "Igisa ang bawang, sibuyas, at luya sa 1 kutsarang mantika hanggang mabango.",
        "Ilagay ang manok at haluin hanggang bahagyang mag-brown.",
        "Ibuhos ang 1.2 litro ng tubig at pakuluan hanggang lumambot ang manok, mga 25–35 minuto.",
        "Idagdag ang sayote o hilaw na papaya at patis, saka lutuin nang 8–10 minuto.",
        "Ilagay ang malunggay sa huli, patayin ang apoy, at ihain kasama ng kanin.",
      ],
      confidence: "high",
      disclaimer: null,
      official_link: null,
      provenance: provenance(),
      category_specific: {
        category: "cooking",
        ingredients: [
          { item: "manok", amount: "1/2 kilo" },
          { item: "tubig", amount: "1.2 litro" },
          { item: "luya", amount: "1 thumb-size, hiniwa" },
          { item: "bawang at sibuyas", amount: "3 butil at 1 medium" },
          { item: "sayote o hilaw na papaya", amount: "1 medium" },
          { item: "malunggay", amount: "1–2 tali" },
          { item: "patis", amount: "ayon sa panlasa" },
        ],
        servings: "4 tao",
        tips: ["Igisa muna ang luya para mas lumabas ang aroma.", "Ilagay ang malunggay sa huli para manatiling sariwa."],
      },
    };
  }

  return null;
}
