import { NextResponse } from "next/server";
import { askPaano, llmConfigError, llmConfigured } from "@/lib/llm";
import { fallbackAnswer } from "@/lib/answers";
import type { ChatMessage } from "@/lib/answers";
import { logQuestion } from "@/lib/logging";
import { applyCommuteGrounding, groundCommuteQuestion } from "@/lib/commute/ground";

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

  if (!llmConfigured()) {
    return NextResponse.json(
      { error: llmConfigError() },
      { status: 503 },
    );
  }

  try {
    // Commute grounding: kung commute ang tanong, i-append ang GTFS routes
    // + LTFRB fare data sa huling user message (hindi puro haka ang sagot).
    const lastUserIndex = [...messages].reverse().findIndex((m) => m.role === "user");
    let groundedMessages = messages;
    let grounding = null;
    if (lastUserIndex !== -1) {
      const idx = messages.length - 1 - lastUserIndex;
      const lastUser = messages[idx];
      grounding = await groundCommuteQuestion(lastUser.content);
      if (grounding) {
        groundedMessages = [
          ...messages.slice(0, idx),
          { ...lastUser, content: `${lastUser.content}\n\n${grounding.context}` },
          ...messages.slice(idx + 1),
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
