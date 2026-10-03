import { isGreetingQuestion, PipelineError, runAnswerPipeline, type PipelineStage } from "@/lib/pipeline";
import { fallbackAnswer } from "@/lib/answers";
import { logQuestion } from "@/lib/logging";
import { checkRateLimit, peekRemaining } from "@/lib/rate-limit";
import { getCachedAnswer, setCachedAnswer } from "@/lib/cache";
import { parseMessages, validImage, type AskBody } from "@/lib/ask-body";

/**
 * POST /api/ask/stream — NDJSON staged responses para sa mabilis na
 * pakiramdam (perceived latency). Iisang HTTP response na sunod-sunod
 * na JSON lines:
 *
 *   {"type":"stage","stage":"grounding","label":"Hinahanap ang ruta…"}
 *   {"type":"result","answer":{...},"suggestions":[...],"remaining":39}
 *   {"type":"error","error":"...","status":429}
 *
 * Ang /api/ask (plain JSON) ay nananatili para sa compatibility.
 */

export const runtime = "nodejs";
// Keep the stream bounded so an unavailable VPS cannot leave the client
// showing a loading state indefinitely.
export const maxDuration = 60;

const STAGE_LABELS: Record<PipelineStage, string> = {
  grounding: "Hinahanap ang ruta, presyo, o datos…",
  "grounded-commute": "May nahanap na commute data — i-ge-ground ang sagot…",
  "grounded-cooking": "Kinukumpasa ang presyo sa palengke…",
  llm: "Binubuo ang sagot ni PAANO…",
  vision: "Tinitingnan ang litrato…",
};

export async function POST(req: Request) {
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  let body: AskBody;
  try {
    body = (await req.json()) as AskBody;
  } catch {
    return jsonError(400, "Invalid JSON body. Ipadala ang { messages: [...] }.");
  }

  const messages = parseMessages(body);
  if (!messages) {
    return jsonError(400, "Walang laman ang tanong. Subukan muli.");
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      try {
        const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
        const queryText = lastUserMsg?.content;

        // 1. Fast Cache Hit (kung walang image attachment)
        if (!body.image && queryText && messages.length <= 2 && !isGreetingQuestion(queryText)) {
          const cached = getCachedAnswer(queryText);
          if (cached) {
            send({
              type: "result",
              answer: cached.answer,
              suggestions: cached.suggestions,
              cached: true,
              remaining: peekRemaining(clientIp ?? "unknown"),
            });
            return;
          }
        }

        // 2. Rate limit (cost control — libreng tier)
        const limit = checkRateLimit(clientIp ?? "unknown");
        if (!limit.ok) {
          send({
            type: "error",
            status: 429,
            error:
              limit.scope === "daily"
                ? "Narating mo na ang daily limit ng PAANO para ngayon. Balik ka bukas para sa bagong tanong — o i-save ang mga sagot mo para balikan anytime!"
                : "Masyadong mabilis ang pagtatanong. Sandali lang at subukan muli.",
            remaining: limit.remaining,
            retryAfterMs: limit.retryAfterMs,
          });
          return;
        }

        const image = validImage(body.image) ? body.image : undefined;
        if (body.image !== undefined && !image) {
          send({
            type: "error",
            status: 400,
            error: "Hindi valid ang larawan. Subukan ang PNG/JPEG hanggang 5MB.",
          });
          return;
        }

        // 3. Pipeline with stage events
        const result = await runAnswerPipeline(messages, {
          image,
          onStage: (stage) => {
            send({ type: "stage", stage, label: STAGE_LABELS[stage] });
          },
        });

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

        send({
          type: "result",
          answer: result.answer,
          suggestions: result.suggestions,
          remaining: limit.remaining,
        });
      } catch (err) {
        if (err instanceof PipelineError) {
          send({
            type: "error",
            status: err.status,
            error: err.message,
            answer: fallbackAnswer(err.message),
          });
          return;
        }
        const message =
          err instanceof Error ? err.message : "May nangyaring mali. Subukan muli.";
        console.error("[/api/ask/stream] unhandled error:", message);
        send({
          type: "error",
          status: 502,
          error: "Hindi naka-respond ang AI ngayon. Subukan muli sa ilang sandali.",
          answer: fallbackAnswer("Sandali lang — hindi naka-respond ang AI. Paki-subok muli."),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

function jsonError(status: number, error: string): Response {
  return Response.json({ error }, { status });
}
