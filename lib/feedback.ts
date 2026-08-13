import { getSupabase } from "@/lib/supabase";
import type { PaanoAnswer } from "@/lib/answers";

/**
 * Community verification layer (feature #7 — ang moat).
 *
 * Ang bawat answer ay may stable hash; ang thumbs/corrections ay
 * naka-log sa Supabase `answer_feedback` (tingnan ang supabase/schema.sql)
 * na may status pending → manual review bago maging "community-corrected".
 *
 * Graceful kapag walang Supabase: tahimik na no-op, hindi nag-crash.
 */

/** Stable hash ng answer content (djb2) — hindi kailangan ng crypto. */
export function answerHash(answer: PaanoAnswer): string {
  const text = [
    answer.category,
    answer.title,
    answer.summary,
    answer.steps.join("|"),
    answer.disclaimer ?? "",
    answer.official_link?.url ?? "",
  ].join("\n");
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  }
  return `h${(h >>> 0).toString(36)}`;
}

export interface FeedbackInput {
  answerHash: string;
  helpful: boolean | null;
  correction: string | null;
  clientIp: string | null;
}

export async function submitFeedback(input: FeedbackInput): Promise<void> {
  const db = getSupabase();
  if (!db) return;
  try {
    await db.from("answer_feedback").insert({
      answer_hash: input.answerHash,
      helpful: input.helpful,
      correction: input.correction ? input.correction.slice(0, 2000) : null,
      client_ip: input.clientIp,
      status: "pending",
    });
  } catch {
    // best-effort
  }
}

/**
 * Bilang ng corrections/flag ng komunidad para sa isang sagot.
 * 0 kung walang Supabase o walang feedback — para sa "i-verify" badge.
 */
export async function getCorrectionCount(answerHash: string): Promise<number> {
  const db = getSupabase();
  if (!db) return 0;
  try {
    const { count, error } = await db
      .from("answer_feedback")
      .select("id", { count: "exact", head: true })
      .eq("answer_hash", answerHash)
      .not("correction", "is", null);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
