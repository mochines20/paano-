/**
 * Per-IP rate limiter — in-memory (sapat para sa single instance;
 * kailangan ng Redis-based kapag nag-multi-instance na).
 *
 * Dalawang antas:
 *  - DAILY: libreng tier cap (default 15 tanong/araw bawat IP)
 *  - BURST: 5 requests/min para protektahan ang LLM endpoints sa abuse
 *
 * Configurable via env: PAANO_DAILY_LIMIT, PAANO_BURST_LIMIT
 */

interface Bucket {
  daily: { day: string; count: number };
  burst: { windowStart: number; count: number };
}

const buckets = new Map<string, Bucket>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface RateLimitResult {
  ok: boolean;
  /** Natitirang daily allowance (kapag ok). */
  remaining: number;
  /** Millisecond bago pwedeng sumubok ulit (kapag burst-limited). */
  retryAfterMs: number;
  scope: "daily" | "burst";
}

const DAILY_LIMIT = Number(process.env.PAANO_DAILY_LIMIT) || 40;
const BURST_LIMIT = Number(process.env.PAANO_BURST_LIMIT) || 8;
const BURST_WINDOW_MS = 60_000;

export function checkRateLimit(ip: string): RateLimitResult {
  const key = ip || "unknown";
  let bucket = buckets.get(key);
  const now = Date.now();

  if (!bucket) {
    bucket = { daily: { day: todayKey(), count: 0 }, burst: { windowStart: now, count: 0 } };
    buckets.set(key, bucket);
  }

  // Daily reset
  if (bucket.daily.day !== todayKey()) {
    bucket.daily = { day: todayKey(), count: 0 };
  }

  // Burst reset
  if (now - bucket.burst.windowStart >= BURST_WINDOW_MS) {
    bucket.burst = { windowStart: now, count: 0 };
  }

  if (bucket.daily.count >= DAILY_LIMIT) {
    return { ok: false, remaining: 0, retryAfterMs: 0, scope: "daily" };
  }
  if (bucket.burst.count >= BURST_LIMIT) {
    return {
      ok: false,
      remaining: Math.max(0, DAILY_LIMIT - bucket.daily.count),
      retryAfterMs: BURST_WINDOW_MS - (now - bucket.burst.windowStart),
      scope: "burst",
    };
  }

  bucket.daily.count++;
  bucket.burst.count++;
  return {
    ok: true,
    remaining: DAILY_LIMIT - bucket.daily.count,
    retryAfterMs: 0,
    scope: "burst",
  };
}

/** Para sa tests/debug. */
export function resetRateLimits(): void {
  buckets.clear();
}

/** Peek lang ng remaining count — HUWAG mag-increment. Para sa cache hits
 * na gusto lang mag-report ng remaining sa UI hindi nagco-consume ng quota. */
export function peekRemaining(ip: string): number {
  const key = ip || "unknown";
  const bucket = buckets.get(key);
  if (!bucket || bucket.daily.day !== todayKey()) return DAILY_LIMIT;
  return Math.max(0, DAILY_LIMIT - bucket.daily.count);
}
