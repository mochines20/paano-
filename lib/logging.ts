import { getSupabase } from "@/lib/supabase";

/**
 * Per-IP question logging (Sprint 1 scope).
 *
 * Naka-log sa Supabase table na `question_logs` (tingnan ang
 * supabase/schema.sql). Kapag walang Supabase env, tahimik na nag-skip —
 * hindi dapat ma-block ang feature dahil lang sa kulang ang config.
 * This doubles as the seed data source for the "popular paano" lists.
 */

export interface QuestionLog {
  question: string;
  category: string;
  confidence: string;
  client_ip: string | null;
  repaired: boolean;
  raw: string | null;
  created_at?: string;
}

export async function logQuestion(entry: QuestionLog): Promise<void> {
  const db = getSupabase();
  if (!db) return;
  try {
    await db.from("question_logs").insert({
      question: entry.question.slice(0, 500),
      category: entry.category,
      confidence: entry.confidence,
      client_ip: entry.client_ip,
      repaired: entry.repaired,
      raw: entry.raw ? entry.raw.slice(0, 8000) : null,
    });
  } catch {
    // Logging is best-effort; never fail the request because of it.
  }
}
