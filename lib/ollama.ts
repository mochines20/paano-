import { normalizeAnswer, parseModelOutput, wrapRawText } from "@/lib/answers";
import type { AskResult, ChatMessage } from "@/lib/answers";

const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_MODEL = "qwen3.5:4b";
const DEFAULT_OLLAMA_VISION_MODEL = "qwen3.5:4b";
const DEFAULT_TEXT_TIMEOUT_MS = 45_000;
const DEFAULT_VISION_TIMEOUT_MS = 55_000;
const OLLAMA_SYSTEM_PROMPT = `Ikaw ay PAANO, praktikal na assistant para sa Pilipinas. Sumagot sa natural na Taglish—huwag generic English—malinaw at maikli. Return ONLY one valid JSON object with exactly these keys: category (cooking|commute|diy|first_aid|docs|generic), title, summary, steps (array of strings), confidence (high|medium|low), disclaimer (string or null), official_link (object {label,url} or null), category_specific (object or null). Para sa cooking, category_specific MUST include at least 3 ingredients na may amount, non-empty servings, at tips. Para sa first_aid, MUST include do_list, don_t_list, at see_doctor_threshold. Huwag mag-imbento ng government fees, routes, medical facts, o official links; kung hindi sigurado, confidence low at sabihin na i-verify. Sa first aid, household-level lang at magbigay ng red-flag threshold. Panatilihing concise ang steps.`;

const PAANO_JSON_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: ["cooking", "commute", "diy", "first_aid", "docs", "generic"] },
    title: { type: "string" },
    summary: { type: "string" },
    steps: { type: "array", items: { type: "string" } },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    disclaimer: { type: ["string", "null"] },
    official_link: {
      type: ["object", "null"],
      properties: { label: { type: "string" }, url: { type: "string" } },
      required: ["label", "url"],
    },
    category_specific: { type: ["object", "null"] },
  },
  required: ["category", "title", "summary", "steps", "confidence", "disclaimer", "official_link", "category_specific"],
} as const;

function baseUrl(): string {
  return (process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL).replace(/\/$/, "");
}

export function ollamaConfigured(): boolean {
  return Boolean(process.env.OLLAMA_BASE_URL);
}

async function complete(
  messages: ChatMessage[],
  systemInstruction: string,
  options?: { imageDataUrl?: string; model?: string; timeoutMs?: number; numCtx?: number; numPredict?: number },
): Promise<string> {
  const model = options?.model || process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;
  const ollamaMessages = [
    { role: "system", content: systemInstruction },
    ...messages.map((message) => ({
      role: message.role === "model" ? "assistant" : "user",
      content: message.content,
      ...(options?.imageDataUrl && message === messages[messages.length - 1]
        ? { images: [options.imageDataUrl.replace(/^data:[^;]+;base64,/, "")] }
        : {}),
    })),
  ];

  const response = await fetch(`${baseUrl()}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Keep the UI from waiting beyond a production-friendly limit when the
    // VPS is offline, overloaded, or unreachable from the app server.
    signal: AbortSignal.timeout(options?.timeoutMs ?? DEFAULT_TEXT_TIMEOUT_MS),
    body: JSON.stringify({
      model,
      messages: ollamaMessages,
      stream: false,
      think: false,
      format: options?.imageDataUrl ? "json" : PAANO_JSON_SCHEMA,
      keep_alive: "5m",
      options: {
        temperature: 0.2,
        num_ctx: options?.numCtx ?? 8192,
        num_predict: options?.numPredict ?? 256,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Ollama API error ${response.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await response.json()) as { message?: { content?: string } };
  return data.message?.content ?? "";
}

export async function askOllama(messages: ChatMessage[]): Promise<AskResult> {
  if (!ollamaConfigured()) {
    throw new Error("OLLAMA_BASE_URL is not set. Ituro ito sa Ollama service ng VPS.");
  }

  // A short context and bounded output are enough for PAANO's structured
  // answers and materially reduce latency on a 4B model.
  const trimmed = messages.slice(-8);
  const raw = await complete(trimmed, OLLAMA_SYSTEM_PROMPT, {
    timeoutMs: DEFAULT_TEXT_TIMEOUT_MS,
    numCtx: 4096,
    numPredict: 192,
  });
  const answer = parseModelOutput(raw) ?? parsePartialAnswer(raw);

  return answer
    ? { answer, raw, repaired: false }
    : { answer: wrapRawText(raw), raw, repaired: raw.length > 0 };
}

/** Recover the useful fields when a small local model is cut off at its
 * output limit before emitting the closing JSON braces. */
function parsePartialAnswer(raw: string) {
  const field = (name: string): string | null => {
    const match = raw.match(new RegExp(`"${name}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`));
    if (!match) return null;
    try {
      return JSON.parse(`"${match[1]}"`);
    } catch {
      return match[1];
    }
  };

  const category = field("category");
  const title = field("title");
  const summary = field("summary");
  const stepsMatch = raw.match(/"steps"\s*:\s*\[([\s\S]*)/);
  const steps = stepsMatch
    ? [...stepsMatch[1].matchAll(/"((?:\\.|[^"\\])*)"/g)].map((match) => {
        try {
          return JSON.parse(`"${match[1]}"`);
        } catch {
          return match[1];
        }
      }).slice(0, 8)
    : [];

  if (!category && !title && !summary && steps.length === 0) return null;
  return normalizeAnswer({
    category: category ?? "generic",
    title: title ?? "Sagot ng PAANO",
    summary: summary ?? "Narito ang praktikal na sagot:",
    steps,
    confidence: "low",
    disclaimer: null,
    official_link: null,
    category_specific: null,
  });
}

export async function askOllamaVision(text: string, imageDataUrl: string): Promise<string> {
  if (!ollamaConfigured()) {
    throw new Error("OLLAMA_BASE_URL is not set. Ituro ito sa Ollama service ng VPS.");
  }

  return complete(
      [{ role: "user", content: "Direktang sagot lang, walang paliwanag. " + text }],
      "Ikaw ay image ingredient detector. Return ONLY JSON: {\"ingredients\":[{\"item\":\"pangalan\",\"qty\":\"dami o null\"}]}",
      {
        imageDataUrl,
        model: process.env.OLLAMA_VISION_MODEL || DEFAULT_OLLAMA_VISION_MODEL,
        timeoutMs: DEFAULT_VISION_TIMEOUT_MS,
        numCtx: 3072,
        numPredict: 80,
      },
  );
}
