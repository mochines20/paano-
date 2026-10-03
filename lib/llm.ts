import { askGemini, askGeminiVision, geminiConfigured } from "@/lib/gemini";
import { askGroq, askGroqVision, groqConfigured } from "@/lib/groq";
import { askOllama, ollamaConfigured } from "@/lib/ollama";
import type { AskResult, ChatMessage } from "@/lib/answers";

/**
 * LLM dispatcher.
 *
 * Default chain:
 *  1. Groq GPT-OSS 20B para sa mabilis na structured text
 *  2. Gemini Flash-Lite para sa mas mahirap/sensitive na text
 *  3. Ollama/Qwen sa VPS bilang local fallback
 *
 * LLM_PROVIDER can still force a provider for debugging, but "auto" (the
 * recommended production value) uses the chain above and falls through when
 * a provider is unavailable or returns malformed structured output.
 */

export function llmConfigured(): boolean {
  return ollamaConfigured() || geminiConfigured() || groqConfigured();
}

export function llmConfigError(): string {
  if (llmConfigured()) return "";
  return (
    "Wala pang naka-configure na AI. Itakda ang OLLAMA_BASE_URL (VPS), " +
    "GEMINI_API_KEY, o GROQ_API_KEY sa .env.local."
  );
}

function isComplexQuestion(messages: ChatMessage[]): boolean {
  const text = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join(" ")
    .toLowerCase();

  return /(?:first aid|medical|health|doctor|hospital|gamot|symptom|paso|burn|legal|government|gobyerno|requirements?|bayad|fee|official|verify|i-verify|presyo|pamasahe|fare|schedule|route)/i.test(
    text,
  );
}

type TextProvider = "groq" | "gemini" | "ollama";

function configuredProviders(): TextProvider[] {
  const providers: TextProvider[] = [];
  if (groqConfigured()) providers.push("groq");
  if (geminiConfigured()) providers.push("gemini");
  if (ollamaConfigured()) providers.push("ollama");
  return providers;
}

async function askTextProvider(provider: TextProvider, messages: ChatMessage[]): Promise<AskResult> {
  if (provider === "groq") return askGroq(messages);
  if (provider === "gemini") return askGemini(messages);
  return askOllama(messages);
}

export async function askPaano(messages: ChatMessage[]): Promise<AskResult> {
  const configured = configuredProviders();
  if (configured.length === 0) {
    throw new Error(llmConfigError());
  }

  const forced = process.env.LLM_PROVIDER?.toLowerCase() as TextProvider | "auto" | undefined;
  const preferred: TextProvider[] = isComplexQuestion(messages)
    ? ["gemini", "groq", "ollama"]
    : ["groq", "gemini", "ollama"];

  // A named provider is useful for local debugging. In auto mode, use the
  // production order and let the rest of the chain recover from failures.
  const order: TextProvider[] = forced && forced !== "auto"
    ? [forced, ...preferred.filter((provider) => provider !== forced)]
    : preferred;
  const candidates = order.filter((provider, index) => configured.includes(provider) && order.indexOf(provider) === index);

  let lastResult: AskResult | null = null;
  const failures: string[] = [];

  for (const provider of candidates) {
    try {
      const result = await askTextProvider(provider, messages);
      lastResult = result;

      // A repaired/raw answer is a signal that this provider did not honor
      // the contract. Try the next provider before showing it to the user.
      if (!result.repaired && result.answer.title !== "Sagot (raw)") {
        return result;
      }
      failures.push(`${provider}: malformed structured output`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown provider error";
      failures.push(`${provider}: ${message.slice(0, 180)}`);
    }
  }

  if (lastResult) return lastResult;
  throw new Error(`Walang AI provider na nakapag-respond. ${failures.join(" | ")}`);
}

/** Image path: Gemini first, then an explicitly configured Groq vision model,
 * then local Qwen/Ollama. The normal Groq GPT-OSS text model is not a vision
 * model, so it is never silently used for image requests. */
export async function askPaanoVision(text: string, imageDataUrl: string): Promise<string> {
  const failures: string[] = [];

  if (geminiConfigured()) {
    try {
      return await askGeminiVision(text, imageDataUrl);
    } catch (error) {
      failures.push(`gemini: ${error instanceof Error ? error.message.slice(0, 160) : "error"}`);
    }
  }

  if (groqConfigured() && process.env.GROQ_VISION_MODEL?.trim()) {
    try {
      return await askGroqVision(text, imageDataUrl);
    } catch (error) {
      failures.push(`groq-vision: ${error instanceof Error ? error.message.slice(0, 160) : "error"}`);
    }
  }

  if (ollamaConfigured()) {
    try {
      const { askOllamaVision } = await import("@/lib/ollama");
      return await askOllamaVision(text, imageDataUrl);
    } catch (error) {
      failures.push(`ollama: ${error instanceof Error ? error.message.slice(0, 160) : "error"}`);
    }
  }

  throw new Error(`Walang vision provider na nakapag-respond. ${failures.join(" | ")}`);
}
