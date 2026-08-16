/**
 * localStorage utilities para sa PAANO.
 * Walang auth kailangan — lahat ng saved/history ay local sa device.
 */

const SAVED_KEY = "paano:saved";
const HISTORY_KEY = "paano:history";
const MAX_SAVED = 50;
const MAX_HISTORY = 20;

export interface SavedAnswer {
  id: string;
  question: string;
  answer: unknown;
  savedAt: number;
  category: string;
  title: string;
}

export interface HistoryItem {
  question: string;
  askedAt: number;
}

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded o private mode — huwag mag-crash */
  }
}

/* ---------- Saved answers ---------- */

export function getSavedAnswers(): SavedAnswer[] {
  return safeGet<SavedAnswer[]>(SAVED_KEY, []);
}

export function saveAnswer(item: Omit<SavedAnswer, "id" | "savedAt">): void {
  const saved = getSavedAnswers();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entry: SavedAnswer = { ...item, id, savedAt: Date.now() };
  // Deduplicate by question — palitan ang lumang save ng parehong tanong
  const filtered = saved.filter((s) => s.question !== item.question);
  safeSet(SAVED_KEY, [entry, ...filtered].slice(0, MAX_SAVED));
}

export function unsaveAnswer(id: string): void {
  const saved = getSavedAnswers();
  safeSet(SAVED_KEY, saved.filter((s) => s.id !== id));
}

export function isSaved(question: string): boolean {
  return getSavedAnswers().some((s) => s.question === question);
}

/* ---------- Question history ---------- */

export function getHistory(): HistoryItem[] {
  return safeGet<HistoryItem[]>(HISTORY_KEY, []);
}

export function addToHistory(question: string): void {
  if (!question.trim()) return;
  const history = getHistory();
  const filtered = history.filter(
    (h) => h.question.toLowerCase() !== question.toLowerCase(),
  );
  const entry: HistoryItem = { question, askedAt: Date.now() };
  safeSet(HISTORY_KEY, [entry, ...filtered].slice(0, MAX_HISTORY));
}

export function clearHistory(): void {
  safeSet(HISTORY_KEY, []);
}
