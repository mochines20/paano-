import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * GET /api/trending — top questions (30 araw) mula sa question_logs.
 * Ito ang "Popular paano" surface: chips sa chat empty state.
 * Graceful: [] kung walang Supabase o walang data.
 */

export const runtime = "nodejs";

export async function GET() {
  const db = getSupabase();
  if (!db) return NextResponse.json({ trending: [] });

  try {
    const { data, error } = await db
      .from("question_logs")
      .select("question, category")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(500);

    if (error) return NextResponse.json({ trending: [] });

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      const q = (row.question as string)?.trim().toLowerCase();
      if (!q || q.length < 5) continue;
      counts.set(q, (counts.get(q) ?? 0) + 1);
    }

    const trending = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      // I-capitalize para sa display
      .map(([q]) => q.charAt(0).toUpperCase() + q.slice(1));

    return NextResponse.json({ trending });
  } catch {
    return NextResponse.json({ trending: [] });
  }
}
