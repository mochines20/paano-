import { NextResponse } from "next/server";
import { askPaano, llmConfigError, llmConfigured } from "@/lib/llm";
import { fallbackAnswer } from "@/lib/answers";
import type { ChatMessage } from "@/lib/answers";
import { logQuestion } from "@/lib/logging";
import {
  applyCommuteGrounding,
  groundCommuteQuestion,
  isCommuteQuestion,
} from "@/lib/commute/ground";
import { docGuideToAnswer, findDocGuide } from "@/lib/docs/service";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_MESSAGES = 12;
const MAX_QUESTION_LENGTH = 1000;

interface AskBody {
  messages: { role: string; content: string }[];
}

export async function POST(req: Request) {
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  let body: AskBody;
  try {
    body = (await req.json()) as AskBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body. Ipadala ang { messages: [...] }." },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: "Walang laman ang tanong. Subukan muli." },
      { status: 400 },
    );
  }

  const messages: ChatMessage[] = body.messages
    .slice(-MAX_MESSAGES)
    .map(
      (m): ChatMessage => ({
        role: m.role === "model" ? "model" : "user",
        content: String(m.content).slice(0, MAX_QUESTION_LENGTH),
      }),
    )
    .filter((m) => m.content.trim().length > 0);

  if (messages.length === 0) {
    return NextResponse.json(
      { error: "Walang laman ang tanong. Subukan muli." },
      { status: 400 },
    );
  }

  try {
    const lastUserIndex = [...messages].reverse().findIndex((m) => m.role === "user");
    const lastUser =
      lastUserIndex !== -1 ? messages[messages.length - 1 - lastUserIndex] : undefined;

    // Static docs guide (human-reviewed) — walang LLM call, zero cost.
    // Commute muna ang may priority para hindi ma-flag na docs ang
    // "papuntang PSA office".
    if (lastUser && !isCommuteQuestion(lastUser.content)) {
      const docGuide = findDocGuide(lastUser.content);
      if (docGuide) {
        const answer = docGuideToAnswer(docGuide);
        await logQuestion({
          question: lastUser.content,
          category: "docs",
          confidence: answer.confidence,
          client_ip: clientIp,
          repaired: false,
          raw: null,
        });
        return NextResponse.json({ answer });
      }
    }

    // LLM na ang kailangan dito (docs guides ay static at libre — hindi
    // umaasa sa API key).
    if (!llmConfigured()) {
      return NextResponse.json(
        { error: llmConfigError() },
        { status: 503 },
      );
    }

    // Commute grounding: kung commute ang tanong, i-append ang GTFS routes
    // + LTFRB fare data sa huling user message (hindi puro haka ang sagot).
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

    const result = await askPaano(groundedMessages);
    const answer = grounding
      ? applyCommuteGrounding(result.answer, grounding)
      : result.answer;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");

    await logQuestion({
      question: lastUserMsg?.content ?? "(walang user message)",
      category: answer.category,
      confidence: answer.confidence,
      client_ip: clientIp,
      repaired: result.repaired,
      raw: result.raw,
    });

    return NextResponse.json({ answer });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "May nangyaring mali. Subukan muli.";
    // Config problem ba o provider outage? Distinguish para sa malinaw na UX.
    const isConfig = message.includes("API_KEY");
    return NextResponse.json(
      {
        error: isConfig
          ? message
          : "Hindi naka-respond ang AI ngayon. Subukan muli sa ilang sandali.",
        answer: fallbackAnswer(
          isConfig
            ? message
            : "Sandali lang — hindi naka-respond ang AI. Paki-subok muli.",
        ),
      },
      { status: isConfig ? 503 : 502 },
    );
  }
}
