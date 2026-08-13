import { askGemini, geminiConfigured } from "@/lib/gemini";
import { askGroq, groqConfigured } from "@/lib/groq";
import type { AskResult, ChatMessage } from "@/lib/answers";

/**
 * LLM dispatcher — pinipili kung Gemini o Groq ang gagamitin:
 *  - LLM_PROVIDER=groq   → Groq
 *  - LLM_PROVIDER=gemini → Gemini
 *  - walang set           → Gemini kung naka-configure, kung hindi ay Groq.
 */

export function llmConfigured(): boolean {
  return geminiConfigured() || groqConfigured();
}

export function llmConfigError(): string {
  if (llmConfigured()) return "";
  return (
    "Wala pang naka-set na API key. Tingnan ang .env.example — kailangan ang " +
    "GEMINI_API_KEY o GROQ_API_KEY (at i-copy sa .env.local)."
  );
}

export async function askPaano(messages: ChatMessage[]): Promise<AskResult> {
  const provider = process.env.LLM_PROVIDER?.toLowerCase();

  if (provider === "groq") return askGroq(messages);
  if (provider === "gemini") return askGemini(messages);

  // Auto-detect: Gemini muna kung naka-set; kung wala, Groq.
  if (geminiConfigured()) return askGemini(messages);
  return askGroq(messages);
}
