import { GoogleGenAI } from "@google/genai";
import { DEFAULT_GEMINI_MODEL, PAANO_SYSTEM_PROMPT } from "@/lib/prompts/system-prompt";
import { parseModelOutput, wrapRawText } from "@/lib/answers";
import type { AskResult, ChatMessage, PaanoAnswer } from "@/lib/answers";

const MODEL = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Gemini provider: call with the PAANO system prompt + conversation,
 * JSON mode, then parse. Throws on API-level failures so the route can
 * map them to a clean HTTP error. */
export async function askGemini(messages: ChatMessage[]): Promise<AskResult> {
  if (!geminiConfigured()) {
    throw new Error(
      "GEMINI_API_KEY is not set. Kopyahin ang .env.example papunta sa .env.local at ilagay ang iyong API key.",
    );
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const trimmed = messages.slice(-12); // keep recent context only

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: trimmed.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
    config: {
      systemInstruction: PAANO_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      temperature: 0.4,
      maxOutputTokens: 2048,
    },
  });

  const raw = response.text ?? "";

  // Structured parse; kapag sira, humingi ng isang retry bago sumuko.
  let answer = parseModelOutput(raw);
  if (!answer) {
    const retry = await retryStructured(ai, trimmed);
    if (retry) answer = retry;
  }

  if (!answer) {
    return { answer: wrapRawText(raw), raw, repaired: raw.length > 0 };
  }

  return { answer, raw, repaired: false };
}

async function retryStructured(
  ai: GoogleGenAI,
  messages: ChatMessage[],
): Promise<PaanoAnswer | null> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        ...messages.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
        {
          role: "model",
          parts: [
            {
              text: "Important: return ONLY valid JSON matching the schema. No markdown, no fences, no extra text.",
            },
          ],
        },
      ],
      config: {
        systemInstruction: PAANO_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    });
    return parseModelOutput(response.text ?? "");
  } catch {
    return null;
  }
}
