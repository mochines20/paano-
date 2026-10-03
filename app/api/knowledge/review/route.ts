import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const token = process.env.KNOWLEDGE_REVIEW_TOKEN;
  return Boolean(token && req.headers.get("authorization") === `Bearer ${token}`);
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Review database is not configured" }, { status: 503 });
  const { data, error } = await db.from("knowledge_candidates").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: "Could not load review queue" }, { status: 500 });
  return NextResponse.json({ candidates: data ?? [] });
}

export async function PATCH(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Review database is not configured" }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { id?: number; status?: string; reviewerNote?: string } | null;
  if (!body?.id || !["approved", "rejected"].includes(body.status ?? "")) return NextResponse.json({ error: "Expected id and status=approved|rejected" }, { status: 400 });
  const { data, error } = await db.from("knowledge_candidates").update({ status: body.status, reviewer_note: body.reviewerNote?.slice(0, 1000) ?? null, reviewed_at: new Date().toISOString() }).eq("id", body.id).eq("status", "pending").select("*").single();
  if (error) return NextResponse.json({ error: "Candidate not found or already reviewed" }, { status: 404 });
  return NextResponse.json({ candidate: data });
}
