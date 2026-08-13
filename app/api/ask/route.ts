import { NextResponse } from "next/server";
import { askPaano, llmConfigError, llmConfigured } from "@/lib/llm";
import { fallbackAnswer } from "@/lib/answers";
import type { ChatMessage } from "@/lib/answers";
import { logQuestion } from "@/lib/logging";

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
    const result = await askPaano(messages);
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");

    await logQuestion({
      question: lastUserMsg?.content ?? "(walang user message)",
      category: result.answer.category,
      confidence: result.answer.confidence,
      client_ip: clientIp,
      repaired: result.repaired,
      raw: result.raw,
    });

    return NextResponse.json({ answer: result.answer });
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
