import type { ChatMessage } from "@/lib/answers";

/**
 * Shared request validation para sa /api/ask at /api/ask/stream.
 * Nakahiwalay mula sa route files para walang duplicate validation logic
 * (ang Next.js route files ay dapat handlers lang ang export).
 */

export const MAX_MESSAGES = 12;
export const MAX_QUESTION_LENGTH = 1000;

export interface AskBody {
  messages: { role: string; content: string }[];
  image?: string;
}

/** Validate ang image data URL (image→recipe). Max ~5MB base64. */
export function validImage(image: unknown): image is string {
  return (
    typeof image === "string" &&
    /^data:image\/(png|jpe?g|webp|heic);base64,[A-Za-z0-9+/=]+$/.test(image) &&
    image.length <= 5_000_000
  );
}

/** Parse + sanitize ang messages array. Bumalik ng null kung sira ang body. */
export function parseMessages(body: AskBody): ChatMessage[] | null {
  if (!Array.isArray(body.messages) || body.messages.length === 0) return null;

  const messages = body.messages
    .slice(-MAX_MESSAGES)
    .map(
      (m): ChatMessage => ({
        role: m.role === "model" ? "model" : "user",
        content: String(m.content).slice(0, MAX_QUESTION_LENGTH),
      }),
    )
    .filter((m) => m.content.trim().length > 0);

  return messages.length > 0 ? messages : null;
}
