import { GoogleGenAI } from "@google/genai";
import { DEFAULT_GEMINI_MODEL, PAANO_SYSTEM_PROMPT } from "@/lib/prompts/system-prompt";
import { normalizeAnswer, parseModelOutput } from "@/lib/answers";
import type { PaanoAnswer } from "@/lib/answers";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export interface AskResult {
  answer: PaanoAnswer;
  raw: string;
  repaired: boolean;
}

const MODEL = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Core ask: call Gemini with the PAANO system prompt + conversation,
 * then parse the JSON response. Throws on API-level failures so the route
 * can map them to a clean HTTP error. */
export async function askPaano(messages: ChatMessage[]): Promise<AskResult> {
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
    if (retry) {
      answer = retry;
    }
  }

  if (!answer) {
    // Last resort: wrap the raw text as a generic answer so the UI
    // still shows something useful instead of a blank card.
    answer = {
      category: "generic",
      title: "Sagot (raw)",
      summary:
        "Hindi ma-parse ng PAANO ang structured na sagot. Narito ang direktang tugon ng modelo:",
      steps: splitIntoSteps(raw),
      confidence: "low",
      disclaimer: null,
      official_link: null,
      category_specific: null,
    };
  }

  return { answer, raw, repaired: answer.category === "generic" && raw.length > 0 };
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

function splitIntoSteps(text: string): string[] {
  return text
    .split(/\n+/)
    .map((l) => l.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((l) => l.length > 0)
    .slice(0, 20);
}

/** Build a fallback answer without calling the model (used for hard errors). */
export function fallbackAnswer(message: string): PaanoAnswer {
  return {
    category: "generic",
    title: "Sandali lang…",
    summary: message,
    steps: [],
    confidence: "low",
    disclaimer: null,
    official_link: null,
    category_specific: null,
  };
}

export { normalizeAnswer };
