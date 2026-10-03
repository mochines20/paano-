import type { PaanoAnswer } from "@/lib/answers";

interface CacheEntry {
  answer: PaanoAnswer;
  suggestions?: string[];
  expiresAt: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 500;
// Bump when answer rules/grounding change so an older unsafe answer cannot
// survive a long-lived process or deployment that reuses the module cache.
const CACHE_VERSION = "v4";

const responseCache = new Map<string, CacheEntry>();

export function normalizeQueryKey(query: string): string {
  const normalized = query
    .toLowerCase()
    .trim()
    .replace(/[?.,!/\\;:'"()[\]{}]/g, "")
    .replace(/\s+/g, " ");
  return normalized ? `${CACHE_VERSION}:${normalized}` : "";
}

export function getCachedAnswer(
  query: string,
): { answer: PaanoAnswer; suggestions?: string[] } | null {
  const key = normalizeQueryKey(query);
  if (!key) return null;

  const entry = responseCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    responseCache.delete(key);
    return null;
  }

  return { answer: entry.answer, suggestions: entry.suggestions };
}

export function setCachedAnswer(
  query: string,
  answer: PaanoAnswer,
  suggestions?: string[],
): void {
  const key = normalizeQueryKey(query);
  if (!key || answer.confidence === "low") return; // Huwag i-cache ang low-confidence o errors

  if (responseCache.size >= MAX_CACHE_SIZE) {
    // Purge earliest 20%
    const keys = Array.from(responseCache.keys());
    for (let i = 0; i < Math.floor(MAX_CACHE_SIZE * 0.2); i++) {
      responseCache.delete(keys[i]);
    }
  }

  responseCache.set(key, {
    answer,
    suggestions,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}
