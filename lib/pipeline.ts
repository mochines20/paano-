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
): Promise<PipelineResult> {
  const lastUserIndex = [...messages].reverse().findIndex((m) => m.role === "user");
  const lastUser =
    lastUserIndex !== -1 ? messages[messages.length - 1 - lastUserIndex] : undefined;

  // 1. Static docs guide — commute muna ang priority para hindi ma-flag na
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

  // 2. Mula rito, kailangan na ang LLM.
  if (!llmConfigured()) {
    throw new PipelineError(llmConfigError(), 503);
  }

  // 3. Commute grounding — i-append ang GTFS routes + LTFRB fare data sa
  //    huling user message (hindi puro haka ang sagot).
  let groundedMessages = messages;
  let grounding = null;
  if (lastUser) {
    grounding = await groundCommuteQuestion(lastUser.content);
    if (grounding) {
      groundedMessages = [
        ...messages.slice(0, messages.length - 1 - lastUserIndex),
        { ...lastUser, content: `${lastUser.content}\n\n${grounding.context}` },
        ...messages.slice(messages.length - lastUserIndex),
      ];
    }
  }

  // 4. LLM + data override.
  const result = await askPaano(groundedMessages);
  const answer = grounding
    ? applyCommuteGrounding(result.answer, grounding)
    : result.answer;

  return {
    answer,
    source: "llm",
    suggestions: CATEGORY_SUGGESTIONS[answer.category] ?? [],
    repaired: result.repaired,
    raw: result.raw,
  };
}
