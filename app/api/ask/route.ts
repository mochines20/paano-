import { NextResponse } from "next/server";
import { isGreetingQuestion, PipelineError, runAnswerPipeline } from "@/lib/pipeline";
import { fallbackAnswer } from "@/lib/answers";
import { logQuestion } from "@/lib/logging";
import { checkRateLimit, peekRemaining } from "@/lib/rate-limit";
import { getCachedAnswer, setCachedAnswer } from "@/lib/cache";
import {
  parseMessages,
  validImage,
  type AskBody,
} from "@/lib/ask-body";

/**
 * POST /api/ask — thin HTTP layer; ang business logic ay nasa
 * lib/pipeline.ts. Dito lang ang: body parsing, validation, logging,
 * at error → HTTP status mapping.
 */

export const runtime = "nodejs";
// Keep the HTTP contract aligned with the Ollama provider's bounded timeout.
export const maxDuration = 60;

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

  const messages = parseMessages(body);
  if (!messages) {
    return NextResponse.json(
      { error: "Walang laman ang tanong. Subukan muli." },
      { status: 400 },
    );
  }

  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const queryText = lastUserMsg?.content;

  // 1. Fast Cache Hit check (kung walang image attachment)
  if (!body.image && queryText && messages.length <= 2 && !isGreetingQuestion(queryText)) {
    const cached = getCachedAnswer(queryText);
    if (cached) {
      // Cache hits don't consume rate limit — peek lang ng remaining para sa UI
      return NextResponse.json({
        answer: cached.answer,
        suggestions: cached.suggestions,
        cached: true,
        remaining: peekRemaining(clientIp ?? "unknown"),
      });
    }
  }

  // Rate limit (cost control — libreng tier): 40 tanong/araw + burst.
  const limit = checkRateLimit(clientIp ?? "unknown");
  if (!limit.ok) {
    const res = NextResponse.json(
      {
        error:
          limit.scope === "daily"
            ? "Narating mo na ang daily limit ng PAANO para ngayon. Balik ka bukas para sa bagong tanong — o i-save ang mga sagot mo para balikan anytime!"
            : "Masyadong mabilis ang pagtatanong. Sandali lang at subukan muli.",
        remaining: limit.remaining,
      },
      { status: 429 },
    );
    if (limit.scope === "burst" && limit.retryAfterMs > 0) {
      res.headers.set("Retry-After", String(Math.ceil(limit.retryAfterMs / 1000)));
    }
    return res;
  }

  const image = validImage(body.image) ? body.image : undefined;
  if (body.image !== undefined && !image) {
    return NextResponse.json(
      { error: "Hindi valid ang larawan. Subukan ang PNG/JPEG hanggang 5MB." },
      { status: 400 },
    );
  }

  try {
    const result = await runAnswerPipeline(messages, { image });
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");

    if (!body.image && queryText && !isGreetingQuestion(queryText)) {
      setCachedAnswer(queryText, result.answer, result.suggestions);
    }

    await logQuestion({
      question: lastUserMsg?.content ?? "(walang user message)",
      category: result.answer.category,
      confidence: result.answer.confidence,
      client_ip: clientIp,
      repaired: result.repaired,
      raw: result.raw,
    });

    return NextResponse.json({
      answer: result.answer,
      suggestions: result.suggestions,
      remaining: limit.remaining,
    });
  } catch (err) {
    if (err instanceof PipelineError) {
      return NextResponse.json(
        {
          error: err.message,
          answer: fallbackAnswer(err.message),
        },
        { status: err.status },
      );
    }

    const message =
      err instanceof Error ? err.message : "May nangyaring mali. Subukan muli.";
    console.error("[/api/ask] unhandled error:", message);
    return NextResponse.json(
      {
        error: "Hindi naka-respond ang AI ngayon. Subukan muli sa ilang sandali.",
        answer: fallbackAnswer("Sandali lang — hindi naka-respond ang AI. Paki-subok muli."),
      },
      { status: 502 },
    );
  }
}
