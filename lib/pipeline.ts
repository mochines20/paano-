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
    suggestions: CATEGORY_SUGGESTIONS[answer.category] ?? [],
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
      suggestions: CATEGORY_SUGGESTIONS["cooking"] ?? [],
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
