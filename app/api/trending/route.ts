import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * GET /api/trending — top questions (30 araw) mula sa question_logs.
 * Ito ang "Popular paano" surface: chips sa chat empty state.
 * Graceful: kung walang Supabase o walang real data, magbigay ng curated
 * seed questions para hindi malungkot ang landing page ng bagong deployment.
 */

export const runtime = "nodejs";

/** Curated "popular paano" — fallback kapag walang Supabase data pa.
 * Ito ang mga pinaka-common na practical questions ng Pinoy. */
const SEED_TRENDING = [
  "Paano magluto ng adobo para sa 10 tao?",
  "Paano pumunta sa SM Megamall galing Cubao?",
  "Paano kumuha ng NBI clearance?",
  "Paano mag-apply ng passport?",
  "Paano magluto ng sinigang na baboy?",
  "Paano pumunta sa NAIA Terminal 3?",
  "Paano mag-renew ng driver's license?",
  "Paano gumawa ng simpleng first aid kit?",
];

export async function GET() {
  const db = getSupabase();
  if (!db) return NextResponse.json({ trending: SEED_TRENDING });

  try {
    const { data, error } = await db
      .from("question_logs")
      .select("question, category")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(500);

    if (error) return NextResponse.json({ trending: SEED_TRENDING });

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      const q = (row.question as string)?.trim().toLowerCase();
      if (!q || q.length < 5) continue;
      counts.set(q, (counts.get(q) ?? 0) + 1);
    }

    // Kung may real data (>= 3 unique questions), gamitin ito.
    // Kung sobrang konti pa (bagong deployment), halo-halo ang seed + real
    // para hindi malungkot ang landing page.
    if (counts.size >= 3) {
      const trending = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([q]) => q.charAt(0).toUpperCase() + q.slice(1));
      return NextResponse.json({ trending });
    }

    // Halo: real questions muna (kung meron), tapos seed para punuin hanggang 8
    const real = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([q]) => q.charAt(0).toUpperCase() + q.slice(1));
    const realLower = new Set(real.map((q) => q.toLowerCase()));
    const seeds = SEED_TRENDING.filter((s) => !realLower.has(s.toLowerCase()));
    const trending = [...real, ...seeds].slice(0, 8);

    return NextResponse.json({ trending });
  } catch {
    return NextResponse.json({ trending: SEED_TRENDING });
  }
}
