import { parseModelOutput, wrapRawText } from "@/lib/answers";
import type { AskResult, ChatMessage } from "@/lib/answers";
import { PAANO_SYSTEM_PROMPT } from "@/lib/prompts/system-prompt";

/**
 * Groq provider (OpenAI-compatible API) — mura/fast, alternative kay Gemini.
 * Piliin sa pamamagitan ng LLM_PROVIDER=groq (tingnan ang .env.example).
 *
 * Tandaan: json_object mode ng Groq ay nangangailangan ng:
 *  - "JSON" sa prompt (nasa PAANO_SYSTEM_PROMPT na)
 *  - explicit max_tokens (kung hindi, maaaring maputol bago makumpleto)
 */

const GROQ_BASE = "https://api.groq.com/openai/v1";
const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";

export function groqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

async function complete(
  messages: ChatMessage[],
  model: string,
  systemInstruction: string,
  temperature: number,
): Promise<string> {
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: 3000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemInstruction },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Groq API error ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

export async function askGroq(messages: ChatMessage[]): Promise<AskResult> {
  if (!groqConfigured()) {
    throw new Error(
      "GROQ_API_KEY is not set. Kopyahin ang .env.example papunta sa .env.local at ilagay ang iyong API key.",
    );
  }

  const model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
  const trimmed = messages.slice(-12);

  let raw = await complete(trimmed, model, PAANO_SYSTEM_PROMPT, 0.4);
  let answer = parseModelOutput(raw);

  // Isang retry kapag sira ang JSON — mas mahigpit na reminder.
  if (!answer) {
    raw = await complete(
      trimmed,
      model,
      `${PAANO_SYSTEM_PROMPT}\n\nCritical: return ONLY the JSON object described above. No markdown fences, no commentary, nothing else.`,
      0.2,
    );
    answer = parseModelOutput(raw);
  }

  if (!answer) {
    return { answer: wrapRawText(raw), raw, repaired: raw.length > 0 };
  }

  return { answer, raw, repaired: false };
}
