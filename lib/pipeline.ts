import { askPaano, llmConfigError, llmConfigured } from "@/lib/llm";
import {
  applyCommuteGrounding,
  groundCommuteQuestion,
  isCommuteQuestion,
} from "@/lib/commute/ground";
import {
  docGuideToAnswer,
  findDocGuide,
  suggestedDocQuestions,
} from "@/lib/docs/service";
import { groundCookingQuestion } from "@/lib/cooking/ground";
import { matchDishes } from "@/lib/cooking/dishes";
import { getPalengkePrices, PRICE_SOURCE_NOTE } from "@/lib/cooking/prices";
import { askGroqVision } from "@/lib/groq";
import { extractJsonObject, fallbackAnswer } from "@/lib/answers";
import type { ChatMessage, PaanoAnswer } from "@/lib/answers";

/**
 * Answer pipeline — ang business logic ng /api/ask, hiwalay sa HTTP layer.
 *
 * Flow:
 *  1. Static docs guide (human-reviewed, walang LLM call, walang API key)
 *  2. Commute grounding (GTFS routes + LTFRB fares) → LLM
 *  3. LLM structured answer
 *  4. Suggestions para sa follow-up chips
 */

export type AnswerSource = "docs-static" | "llm";

export interface PipelineResult {
  answer: PaanoAnswer;
  source: AnswerSource;
  suggestions: string[];
  repaired: boolean;
  raw: string | null;
}

/** May HTTP status na error — para malaman ng route kung anong ibabalik. */
export class PipelineError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "PipelineError";
  }
}

const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  commute: [
    "Ano ang pinakamabilis na ruta?",
    "Magkano kung student ang pamasahe?",
    "Paano kung rush hour?",
  ],
  cooking: ["Paano kung para sa 20 tao?", "Anong ulam ang pwedeng kasama nito?"],
  diy: ["Ano ang kailangan kong bilhin sa hardware?", "Paano maiiwasan na maulit ito?"],
  first_aid: ["Paano maiiwasan ang ganitong klaseng paso o kagat?"],
};

/** Build contextual follow-up suggestions based on the actual answer.
 * Hinahanap ang keywords sa title/summary para mas relevant ang chips.
 * Fallback sa category defaults kung walang match. */
function contextualSuggestions(answer: PaanoAnswer): string[] {
  const text = `${answer.title} ${answer.summary}`.toLowerCase();
  const spec = answer.category_specific;

  // Commute: kung may specific origin/destination, gamitin sa suggestion
  if (answer.category === "commute" && spec?.category === "commute") {
    const dest = spec.destination;
    const origin = spec.origin;
    if (dest && dest !== "?") {
      return [
        `May P2P bus ba papuntang ${dest}?`,
        `Paano kung galing ${origin && origin !== "?" ? origin : "iba"} sa rush hour?`,
        `Anong oras ang pinakamabilis papuntang ${dest}?`,
      ].slice(0, 3);
    }
    return CATEGORY_SUGGESTIONS.commute;
  }

  // Cooking: kung may dish name, gamitin sa variation suggestions
  if (answer.category === "cooking" && spec?.category === "cooking") {
    const dish = answer.title.toLowerCase();
    if (dish.includes("adobo")) {
      return [
        "Pwede bang pork adobo naman?",
        "Paano ang adobo sa gata?",
        "Anong side dish ang bagay sa adobo?",
      ];
    }
    if (dish.includes("sinigang")) {
      return [
        "Paano ang sinigang na isda?",
        "Anong iba pang sampalok alternatibo?",
        "Paano kung mas maasim ang gusto?",
      ];
    }
    if (dish.includes("pancit") || dish.includes("pansit")) {
      return [
        "Paano ang pancit canton na bilog?",
        "Anong ulam ang bagay sa pancit?",
        "Paano kung vegetarian ang pancit?",
      ];
    }
    if (spec.servings && spec.servings.includes("10")) {
      return ["Paano kung para sa 20 tao?", "Anong ulam ang pwedeng kasama nito?"];
    }
    return CATEGORY_SUGGESTIONS.cooking;
  }

  // Docs: kung may agency, i-suggest ang related documents
  if (answer.category === "docs" && spec?.category === "docs") {
    const agency = spec.agency.toLowerCase();
    if (agency.includes("nbi")) {
      return ["Paano kung may hit ako sa NBI?", "Saan ang nearest NBI branch sa akin?"];
    }
    if (agency.includes("passport") || agency.includes("dfa")) {
      return ["Magkano ang rush processing ng passport?", "Anong valid IDs ang tatanggapin?"];
    }
    if (agency.includes("lto") || agency.includes("driver")) {
      return ["Paano kung expired na ng 2 taon?", "Anong requirements sa student permit?"];
    }
    if (agency.includes("sss")) {
      return ["Paano mag-apply ng SSS ID online?", "Anong benefits ng SSS member?"];
    }
    return ["Paano kung nawala ang resibo?", "Saan ang nearest branch?"];
  }

  // First aid: kung may specific condition, i-suggest prevention
  if (answer.category === "first_aid" && spec?.category === "first_aid") {
    if (text.includes("burn") || text.includes("paso")) {
      return ["Paano maiiwasan ang paso sa kusina?", "Anong first aid kit dapat meron sa bahay?"];
    }
    if (text.includes("cut") || text.includes("gasgas") || text.includes("sugat")) {
      return ["Paano malulagnat ang sugat?", "Kailan kailangan ng tetanus shot?"];
    }
    if (text.includes("insect") || text.includes("kagat") || text.includes("lamok")) {
      return ["Paano maiiwasan ang dengue?", "Anong anti-mosquito na effective?"];
    }
    return CATEGORY_SUGGESTIONS.first_aid;
  }

  // DIY: kung may specific problem, i-suggest prevention
  if (answer.category === "diy") {
    if (text.includes("gripo") || text.includes("tulo")) {
      return ["Paano maiiwasan na masira ang gripo?", "Anong tools dapat meron sa bahay?"];
    }
    if (text.includes("ilaw") || text.includes("light")) {
      return ["Ligtas ba ang DIY electrical?", "Kailan dapat tawagin ang electrician?"];
    }
    return CATEGORY_SUGGESTIONS.diy;
  }

  // Generic: kung may topic, i-suggest related paano questions
  if (answer.category === "generic") {
    return [
      "Paano magluto ng mabilis na ulam?",
      "Paano magcommute sa Metro Manila?",
    ];
  }

  return CATEGORY_SUGGESTIONS[answer.category] ?? [];
}

export async function runAnswerPipeline(
  messages: ChatMessage[],
  opts?: { image?: string },
): Promise<PipelineResult> {
  const lastUserIndex = [...messages].reverse().findIndex((m) => m.role === "user");
  const lastUser =
    lastUserIndex !== -1 ? messages[messages.length - 1 - lastUserIndex] : undefined;

  // 1. Image → recipe: photo ng ingredients → anong ulam?
  if (opts?.image && lastUser) {
    return handleImageQuestion(lastUser.content, opts.image);
  }

  // 2. Static docs guide — commute muna ang priority para hindi ma-flag na
  //    docs ang "papuntang PSA office".
  if (lastUser && !isCommuteQuestion(lastUser.content)) {
    const guide = findDocGuide(lastUser.content);
    if (guide) {
      return {
        answer: docGuideToAnswer(guide),
        source: "docs-static",
        suggestions: suggestedDocQuestions(guide),
        repaired: false,
        raw: null,
      };
    }
  }

  // 3. Mula rito, kailangan na ang LLM.
  if (!llmConfigured()) {
    throw new PipelineError(llmConfigError(), 503);
  }

  // 4. Grounding — commute muna (GTFS + LTFRB fares); kung hindi commute,
  //    cooking (palengke prices + budget/pantry). Hindi puro haka ang sagot.
  let groundedMessages = messages;
  let grounding: {
    commute: Awaited<ReturnType<typeof groundCommuteQuestion>>;
    cooking: Awaited<ReturnType<typeof groundCookingQuestion>>;
  } = { commute: null, cooking: null };

  if (lastUser) {
    const commute = await groundCommuteQuestion(lastUser.content);
    const cooking = commute ? null : await groundCookingQuestion(lastUser.content);
    grounding = { commute, cooking };
    const context = commute?.context ?? cooking?.context;
    if (context) {
      groundedMessages = [
        ...messages.slice(0, messages.length - 1 - lastUserIndex),
        { ...lastUser, content: `${lastUser.content}\n\n${context}` },
        ...messages.slice(messages.length - lastUserIndex),
      ];
    }
  }

  // 5. LLM + data override (commute fares/routes).
  const result = await askPaano(groundedMessages);
  const answer = grounding.commute
    ? applyCommuteGrounding(result.answer, grounding.commute)
    : result.answer;

  return {
    answer,
    source: "llm",
    suggestions: contextualSuggestions(answer),
    repaired: result.repaired,
    raw: result.raw,
  };
}

/**
 * Image → recipe (Sprint 3, narrowed):
 *  1. Vision call: tukuyin ang mga sangkap sa larawan
 *  2. Match sa curated Filipino dish map (hindi free-association)
 *  3. Compose cooking answer na may detected ingredients + dish candidates
 *     + palengke prices
 */
async function handleImageQuestion(text: string, imageDataUrl: string): Promise<PipelineResult> {
  try {
    const raw = await askGroqVision(
      'Tukuyin ang mga sangkap/pagkain na nakikita sa larawan. Return ONLY JSON: {"ingredients":[{"item":"pangalan","qty":"dami o null"}]}',
      imageDataUrl,
    );
    const obj = extractJsonObject(raw, { last: true });
    const data = obj ? (JSON.parse(obj) as { ingredients?: unknown[] }) : null;
    const ingredients = (data?.ingredients ?? [])
      .filter((i) => typeof i === "object" && i !== null)
      .map((i) => String((i as Record<string, unknown>).item ?? "").trim())
      .filter(Boolean)
      .slice(0, 12);

    if (ingredients.length === 0) {
      return {
        answer: fallbackAnswer("Hindi makita ang mga sangkap sa larawan. Subukan ang mas malinaw na litrato, o magtanong sa text."),
        source: "llm",
        suggestions: [],
        repaired: true,
        raw,
      };
    }

    const dishes = matchDishes(ingredients, 5);
    const prices = await getPalengkePrices();
    const priceText = prices
      .slice(0, 10)
      .map((p) => `${p.item} ₱${p.pricePerKg}/kg`)
      .join(", ");

    const composed =
      `${text.trim() || "Anong ulam ang pwedeng lutuin sa mga sangkap na ito?"}\n\n` +
      `[Detected ingredients mula sa larawan: ${ingredients.join(", ")}]\n` +
      `[Candidate Filipino dishes (kung tugma): ${dishes.map((d) => d.name).join("; ") || "wala sa listahan — magmungkahi ng iba"}]\n` +
      `[${PRICE_SOURCE_NOTE} ${priceText}]`;

    const result = await askPaano([{ role: "user", content: composed }]);
    return {
      answer: result.answer,
      source: "llm",
      suggestions: contextualSuggestions(result.answer),
      repaired: result.repaired,
      raw: result.raw,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("API_KEY")) throw new PipelineError(message, 503);
    return {
      answer: fallbackAnswer("Hindi maproseso ang larawan ngayon. Subukan muli sa ilang sandali, o magtanong sa text."),
      source: "llm",
      suggestions: [],
      repaired: true,
      raw: null,
    };
  }
}
