"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AnswerCard } from "@/components/answer/AnswerCard";
import { BotAvatar } from "@/components/BotAvatar";
import { useVoiceInput } from "@/components/useVoiceInput";
import {
  IconCommute,
  IconCooking,
  IconDiy,
  IconFirstAid,
  IconDocs,
  IconFlame,
} from "@/components/icons";
import { answerToText } from "@/lib/answers";
import type { PaanoAnswer } from "@/lib/answers";
import type { ComponentType } from "react";
import {
  addToHistory,
  getHistory,
  getSavedAnswers,
  unsaveAnswer,
  type SavedAnswer,
  type HistoryItem,
} from "@/lib/storage";

interface UiMessage {
  id: number;
  role: "user" | "assistant";
  content?: string;
  answer?: PaanoAnswer;
  suggestions?: string[];
  error?: string;
  retryQuestion?: string;
  /** Nakaimbak na image para sa manual retry (para hindi mawala). */
  retryImage?: string;
  image?: string;
}

/** Mga event mula sa /api/ask/stream (NDJSON). */
type StreamEvent =
  | { type: "stage"; stage: string; label?: string }
  | {
      type: "result";
      answer: PaanoAnswer;
      suggestions?: string[];
      remaining?: number;
      cached?: boolean;
    }
  | { type: "error"; error: string; status?: number; remaining?: number };

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("invalid image"));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

const SUGGESTIONS = [
  "Paano magcommute mula Cubao papuntang Intramuros?",
  "Paano magluto ng chicken adobo para sa 10 tao?",
  "Paano ayusin ang tumutulong gripo?",
  "Paano kumuha ng NBI clearance?",
  "Ano ang gagawin sa heat rash ng bata?",
];

const ROTATING_EXAMPLES = [
  "Paano magluto ng sinigang na baboy?",
  "Paano magcommute mula Cubao papuntang Intramuros?",
  "Paano kumuha ng NBI clearance?",
  "Paano ayusin ang tumutulong gripo?",
  "Anong ulam sa ₱200, may manok ako?",
  "Paano mag-apply ng SSS membership?",
  "Ano ang gagawin sa heat rash ng bata?",
  "Paano magluto ng adobong kangkong?",
];

const QUICK_CATEGORIES: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  query: string;
}[] = [
  { label: "Commute", icon: IconCommute, query: "Paano magcommute mula Cubao papuntang Intramuros?" },
  { label: "Luto", icon: IconCooking, query: "Paano magluto ng chicken adobo para sa 10 tao?" },
  { label: "Gawa-bahay", icon: IconDiy, query: "Paano ayusin ang tumutulong gripo?" },
  { label: "Docs", icon: IconDocs, query: "Paano kumuha ng NBI clearance?" },
  { label: "First Aid", icon: IconFirstAid, query: "Ano ang gagawin sa heat rash ng bata?" },
];

const TABS = [
  { key: "chat", label: "Chat" },
  { key: "saved", label: "Saved" },
  { key: "history", label: "Recent" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

let nextId = 1;

export function Chat({ initialQuestion }: { initialQuestion?: string }) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stageLabel, setStageLabel] = useState("Nag-iisip ang PAANO…");
  const [trending, setTrending] = useState<string[]>([]);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [showJump, setShowJump] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [tab, setTab] = useState<TabKey>("chat");
  const [savedAnswers, setSavedAnswers] = useState<SavedAnswer[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [rotatingIndex, setRotatingIndex] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [inputNotice, setInputNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoSentRef = useRef(false);
  const pinnedRef = useRef(true);
  const { listening, supported: voiceSupported, startListening, stopListening } = useVoiceInput();

  // Online/offline detection — i-check sa mount at sa events
  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    // Initial check sa microtask para hindi cascading render warning
    Promise.resolve().then(update);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // Load saved/recent mula sa localStorage pagkatapos ng mount para
  // iwas hydration mismatch (walang localStorage sa server render).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedAnswers(getSavedAnswers());
    setHistory(getHistory());
  }, []);

  // Rotating examples sa empty state
  useEffect(() => {
    if (messages.length > 0 || tab !== "chat") return;
    const interval = setInterval(() => {
      setRotatingIndex((i) => (i + 1) % ROTATING_EXAMPLES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [messages.length, tab]);

  function onScrollArea() {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    pinnedRef.current = distance < 80;
    setShowJump(!pinnedRef.current && messages.length > 0);
  }

  function jumpToBottom() {
    pinnedRef.current = true;
    setShowJump(false);
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }

  async function onPickImage(file: File | undefined) {
    if (!file || loading) return;
    try {
      setPendingImage(await resizeImage(file));
      setInputNotice(null);
    } catch {
      setPendingImage(null);
      setInputNotice("Hindi mabasa ang larawan. Gumamit ng malinaw na JPG o PNG hanggang 5MB.");
    }
  }

  function startNewChat() {
    if (loading) return;
    setMessages([]);
    setInput("");
    setPendingImage(null);
    setInputNotice(null);
    setTab("chat");
    setShowJump(false);
    pinnedRef.current = true;
    scrollRef.current?.scrollTo({ top: 0 });
  }

  useEffect(() => {
    fetch("/api/trending")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.trending) && d.trending.length > 0) setTrending(d.trending.slice(0, 4));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initialQuestion && !autoSentRef.current) {
      autoSentRef.current = true;
      void send(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  const scrollToBottom = () => {
    if (!pinnedRef.current) return;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
  };

  const push = (msg: UiMessage) => {
    if (msg.role === "user") pinnedRef.current = true;
    setMessages((prev) => [...prev, msg]);
    scrollToBottom();
  };

  /**
   * send — tumatawag sa /api/ask/stream (NDJSON staged events).
   * Walang auto-retry: ang 503 ay config error lang (walang silbi ang
   * pag-ulit) at ang auto-retry ay nagko-consume ng quota nang doble.
   * Ang manual na "Subukan muli" ang humahawak ng transient failures,
   * at dinadala nito ang orihinal na image kung meron.
   */
  async function send(text: string, retryImage?: string) {
    const question = text.trim();
    const img = pendingImage ?? retryImage ?? null;
    if ((!question && !img) || loading) return;

    const userMsg: UiMessage = {
      id: nextId++,
      role: "user",
      content: question || "Ano ang ulam sa mga ito?",
      image: img ?? undefined,
    };
    setInput("");
    setPendingImage(null);
    push(userMsg);
    setLoading(true);
    setStageLabel("Nag-iisip ang PAANO…");
    addToHistory(question || userMsg.content || "");

    const chatHistory = [...messages, userMsg]
      .map((m) => {
        if (m.role === "user") return { role: "user" as const, content: m.content! };
        if (m.answer) return { role: "model" as const, content: answerToText(m.answer) };
        return null;
      })
      .filter((m): m is { role: "user" | "model"; content: string } => m !== null);

    let gotResult = false;

    const handleEvent = (evt: StreamEvent) => {
      if (evt.type === "stage") {
        setStageLabel(evt.label ?? "Nag-iisip ang PAANO…");
        return;
      }
      if (evt.type === "result") {
        gotResult = true;
        if (typeof evt.remaining === "number") setRemaining(evt.remaining);
        push({
          id: nextId++,
          role: "assistant",
          answer: evt.answer,
          suggestions: Array.isArray(evt.suggestions) ? evt.suggestions : undefined,
        });
        return;
      }
      if (evt.status === 429 && typeof evt.remaining === "number") {
        setRemaining(evt.remaining);
      }
      push({
        id: nextId++,
        role: "assistant",
        error: evt.error,
        retryQuestion: question,
        retryImage: img ?? undefined,
      });
    };

    try {
      const res = await fetch("/api/ask/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory, image: img ?? undefined }),
      });

      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string; remaining?: number }
          | null;
        if (typeof data?.remaining === "number") setRemaining(data.remaining);
        push({
          id: nextId++,
          role: "assistant",
          error:
            data?.error ??
            (res.status === 503
              ? "Wala pang naka-set na API key sa server. Tingnan ang .env.local."
              : "May nangyaring mali. Subukan muli."),
          retryQuestion: question,
          retryImage: img ?? undefined,
        });
        return;
      }

      // Basahin ang NDJSON stream nang line-by-line
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let streamDone = false;

      while (!streamDone) {
        const { value, done } = await reader.read();
        streamDone = done;
        if (value) {
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              handleEvent(JSON.parse(line) as StreamEvent);
            } catch {
              /* skip malformed line */
            }
          }
        }
      }
      if (buf.trim()) {
        try {
          handleEvent(JSON.parse(buf) as StreamEvent);
        } catch {
          /* ignore */
        }
      }

      if (!gotResult) {
        // Stream natapos nang walang result — huwag mag-iwan ng
        // nakakaduling "nag-iisip" state.
        push({
          id: nextId++,
          role: "assistant",
          error: "Hindi natuloy ang sagot. Subukan muli.",
          retryQuestion: question,
          retryImage: img ?? undefined,
        });
      }
    } catch {
      // Network error — kung offline, ibang mensahe
      const offlineMsg = !navigator.onLine
        ? "Walang koneksyon. Tingnan ang internet mo at subukan muli."
        : "Hindi makakonekta sa server. Tingnan ang iyong koneksyon.";
      push({
        id: nextId++,
        role: "assistant",
        error: offlineMsg,
        retryQuestion: question,
        retryImage: img ?? undefined,
      });
    } finally {
      setLoading(false);
      setStageLabel("Nag-iisip ang PAANO…");
      scrollToBottom();
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  function toggleVoice() {
    if (listening) {
      stopListening();
      return;
    }
    startListening((text, isFinal) => {
      setInput(text);
      if (isFinal) {
        // Auto-send kapag final result
        setTimeout(() => {
          if (text.trim()) void send(text);
        }, 300);
      }
    });
  }

  function removeSaved(id: string) {
    unsaveAnswer(id);
    setSavedAnswers(getSavedAnswers());
  }

  function selectTab(key: TabKey) {
    setTab(key);
    if (key === "saved") setSavedAnswers(getSavedAnswers());
    if (key === "history") setHistory(getHistory());
  }

  function onTabKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const nextKey = TABS[(index + dir + TABS.length) % TABS.length].key;
    selectTab(nextKey);
    document.getElementById(`paano-tab-${nextKey}`)?.focus();
  }

  const savedCount = savedAnswers.length > 0 ? ` (${savedAnswers.length})` : "";
  const historyCount = history.length > 0 ? ` (${history.length})` : "";

  return (
    <div className="flex h-full min-h-0 flex-col bg-deep">
      {/* Offline banner */}
      {!isOnline && (
        <div
          role="status"
          className="animate-slide-down flex items-center justify-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-center text-[11px] font-medium text-amber-800 backdrop-blur dark:text-amber-200"
        >
          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
          </svg>
          Walang koneksyon — offline mode. May mga saved na sagot ka pa rin.
        </div>
      )}

      {/* Tab bar */}
      <div
        className="flex min-w-0 items-center gap-1 overflow-x-auto border-b border-line px-2.5 pt-2 sm:px-4"
        role="tablist"
        aria-label="Mga tab ng PAANO"
      >
        {TABS.map((t, i) => {
          const count =
            t.key === "saved" ? savedCount : t.key === "history" ? historyCount : "";
          return (
            <button
              key={t.key}
              id={`paano-tab-${t.key}`}
              role="tab"
              aria-selected={tab === t.key}
              aria-controls="paano-tab-panel"
              tabIndex={tab === t.key ? 0 : -1}
              onKeyDown={(e) => onTabKeyDown(e, i)}
              onClick={() => selectTab(t.key)}
              className={`relative shrink-0 whitespace-nowrap rounded-t-lg px-3 py-2 text-xs font-semibold transition-colors focus-ring sm:text-sm ${
                tab === t.key
                  ? "text-accent"
                  : "text-muted hover:text-body"
              }`}
            >
              {t.label}
              {count}
              {tab === t.key && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
        {messages.length > 0 && (
          <button
            type="button"
            onClick={startNewChat}
            disabled={loading}
            className="ml-auto mb-1 shrink-0 whitespace-nowrap rounded-full border border-line bg-panel px-2.5 py-1.5 text-[11px] font-semibold text-body transition-colors hover:bg-panel-strong hover:text-accent disabled:cursor-not-allowed disabled:opacity-50 focus-ring sm:px-3 sm:text-xs"
          >
            + Bagong tanong
          </button>
        )}
      </div>

      {/* Content area */}
      <div
        ref={scrollRef}
        onScroll={onScrollArea}
        id="paano-tab-panel"
        role="tabpanel"
        aria-labelledby={`paano-tab-${tab}`}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-4 sm:px-4 sm:py-5"
      >
        {/* SAVED TAB */}
        {tab === "saved" && (
          <div className="mx-auto max-w-2xl space-y-3">
            <h2 className="text-lg font-black text-foreground sm:text-xl">Naka-save na Sagot</h2>
            {savedAnswers.length === 0 ? (
              <div className="glass-card rounded-2xl p-6 text-center">
                <p className="text-sm text-muted">
                  Wala pang naka-save na sagot. I-tap ang bookmark icon sa sagot para i-save.
                </p>
              </div>
            ) : (
              savedAnswers.map((s) => (
                  <div key={s.id} className="glass-card min-w-0 rounded-2xl p-3.5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-accent">{s.question}</p>
                      <h3 className="mt-0.5 text-sm font-bold text-foreground">{s.title}</h3>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {new Date(s.savedAt).toLocaleDateString("fil-PH", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1 self-end sm:self-auto">
                      <button
                        onClick={() => {
                          selectTab("chat");
                          void send(s.question);
                        }}
                        className="rounded-full border border-line bg-panel px-2.5 py-1 text-[11px] font-semibold text-body backdrop-blur transition-colors hover:bg-panel-strong focus-ring"
                      >
                        Buksan
                      </button>
                      <button
                        onClick={() => removeSaved(s.id)}
                        aria-label="Alisin sa saved"
                        className="rounded-full border border-line bg-panel p-1.5 text-muted backdrop-blur transition-colors hover:bg-rose-500/20 hover:text-rose-600 focus-ring dark:hover:text-rose-300"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === "history" && (
          <div className="mx-auto max-w-2xl space-y-3">
            <h2 className="text-lg font-black text-foreground sm:text-xl">Mga Naunang Tanong</h2>
            {history.length === 0 ? (
              <div className="glass-card rounded-2xl p-6 text-center">
                <p className="text-sm text-muted">
                  Wala pang history. Magtanong na sa PAANO!
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      selectTab("chat");
                      void send(h.question);
                    }}
                    className="glass-card flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-150 hover:border-accent/40 active:scale-[0.98] focus-ring"
                  >
                    <svg className="h-4 w-4 shrink-0 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                    </svg>
                    <span className="min-w-0 flex-1 truncate text-sm text-body">{h.question}</span>
                    <span className="shrink-0 text-[11px] text-muted">
                      {new Date(h.askedAt).toLocaleDateString("fil-PH", { month: "short", day: "numeric" })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHAT TAB */}
        {tab === "chat" && (
          <>
            {messages.length === 0 && (
              <div className="mx-auto max-w-2xl space-y-5 pt-2 sm:space-y-6 sm:pt-4">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/25 bg-accent/10 shadow-lg shadow-accent/10 backdrop-blur sm:mb-4 sm:h-14 sm:w-14">
                    <BotAvatar size={36} showPulse className="rounded-2xl sm:size-11" />
                  </div>
                  <h2 className="text-lg font-black text-foreground sm:text-xl">
                    Ano ang gagawin mo ngayon?
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-body">
                    Magtanong sa Taglish tungkol sa commute, lutong bahay,
                    gawaing bahay, first aid, o government documents.
                  </p>
                </div>

                {/* Rotating example */}
                <div className="text-center">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Subukan ito
                  </p>
                  <button
                    onClick={() => void send(ROTATING_EXAMPLES[rotatingIndex])}
                    className="animate-fade-up inline-block max-w-full truncate rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-accent backdrop-blur transition-all duration-200 hover:bg-accent/20 active:scale-95 focus-ring"
                    key={rotatingIndex}
                  >
                    {ROTATING_EXAMPLES[rotatingIndex]}
                  </button>
                </div>

                {trending.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
                      <IconFlame className="h-3.5 w-3.5" aria-hidden />
                      Pinapagtanungan ngayon
                    </p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {trending.map((s) => (
                        <button
                          key={s}
                          onClick={() => void send(s)}
                          className="rounded-full bg-accent/10 px-2.5 py-1.5 text-[11px] font-medium text-accent ring-1 ring-accent/30 backdrop-blur transition-all duration-150 hover:bg-accent/20 active:scale-95 focus-ring sm:px-3 sm:text-xs"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Simulan sa kategorya
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 sm:gap-2">
                    {QUICK_CATEGORIES.map((c, i) => (
                      <button
                        key={c.label}
                        onClick={() => void send(c.query)}
                        className="glass-card group animate-fade-up flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-center transition-all duration-150 hover:border-accent/40 active:scale-[0.98] focus-ring sm:flex-row sm:items-start sm:text-left sm:p-3"
                        style={{ animationDelay: `${120 + i * 60}ms` }}
                      >
                        <span className="text-accent transition-transform duration-150 group-hover:scale-110">
                          <c.icon className="h-5 w-5" />
                        </span>
                        <span className="text-[11px] font-semibold text-body sm:text-xs">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    O piliin ang halimbawa
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => void send(s)}
                        className="glass-pill animate-fade-up rounded-full px-2.5 py-1.5 text-[11px] font-medium text-body backdrop-blur transition-all duration-150 hover:border-accent/40 hover:text-accent active:scale-95 focus-ring sm:px-3 sm:text-xs"
                        style={{ animationDelay: `${100 + SUGGESTIONS.indexOf(s) * 40}ms` }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mx-auto max-w-2xl space-y-4 sm:space-y-5">
              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="animate-fade-up flex justify-end">
                    <div className="max-w-[90%] space-y-2 sm:max-w-[80%]">
                      {m.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.image}
                          alt="Attached"
                          className="ml-auto h-24 w-24 rounded-2xl border border-line-strong object-cover shadow-md sm:h-28 sm:w-28"
                        />
                      )}
                      <div className="flex items-end justify-end gap-2">
                        <p className="rounded-2xl rounded-br-sm bg-accent px-3.5 py-2 text-sm font-medium text-accent-ink shadow-md shadow-accent/20 sm:px-4 sm:py-2.5">
                          {m.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="animate-fade-up space-y-2">
                    <div className="flex items-start gap-2 sm:gap-2.5">
                      <BotAvatar size={24} className="shrink-0 sm:size-7" />
                      <div className="min-w-0 flex-1 space-y-2">
                        {m.answer && <AnswerCard answer={m.answer} question={m.content} />}
                        {m.error && (
                          <div className="glass-card rounded-2xl border-rose-400/30 bg-rose-500/10 p-4">
                            <p className="text-sm text-rose-800 dark:text-rose-200">{m.error}</p>
                            {m.retryQuestion && (
                              <button
                                onClick={() => void send(m.retryQuestion!, m.retryImage)}
                                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-rose-500/30 px-3 py-1 text-xs font-semibold text-rose-900 backdrop-blur transition-all duration-150 hover:bg-rose-500/40 focus-ring dark:text-rose-100"
                              >
                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                  <path d="M4 4v6h6M20 20v-6h-6M4 10a9 9 0 0 1 14-3.5l3-3M20 14a9 9 0 0 1-14 3.5l-3 3" />
                                </svg>
                                Subukan muli
                              </button>
                            )}
                            {/* Alternative suggestions para hindi ma-frustrate ang user */}
                            {m.retryQuestion && (
                              <div className="mt-3 border-t border-rose-400/20 pt-3">
                                <p className="mb-2 text-[11px] font-medium text-rose-700 dark:text-rose-300/80">
                                  O subukan ang isa pa:
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {SUGGESTIONS.slice(0, 3).map((s) => (
                                    <button
                                      key={s}
                                      onClick={() => void send(s)}
                                      className="rounded-full bg-panel px-2.5 py-1 text-[11px] font-medium text-body ring-1 ring-line-strong backdrop-blur transition-all duration-150 hover:bg-panel-strong hover:text-accent active:scale-95 focus-ring"
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {m.suggestions && m.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pl-0.5">
                            {m.suggestions.map((s) => (
                              <button
                                key={s}
                                onClick={() => void send(s)}
                                className="glass-pill animate-pop rounded-full px-3 py-1 text-[11px] font-medium text-body backdrop-blur transition-all duration-150 hover:border-accent/40 hover:text-accent active:scale-95 focus-ring"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ),
              )}

              {loading && (
                <div className="animate-fade-up flex items-start gap-2 sm:gap-2.5">
                  <BotAvatar size={24} className="shrink-0 sm:size-7" />
                  <div className="glass-card min-w-0 flex-1 overflow-hidden rounded-2xl p-3.5 shadow-md sm:p-4">
                    <div className="skeleton mb-3 h-4 w-24 rounded-full" />
                    <div className="skeleton mb-2 h-5 w-2/3 rounded-md" />
                    <div className="skeleton mb-2 h-3 w-full rounded" />
                    <div className="skeleton mb-2 h-3 w-full rounded" />
                    <div className="skeleton mb-3 h-3 w-5/6 rounded" />
                    <div className="skeleton h-16 w-full rounded-xl" />
                    <div
                      className="mt-3 flex items-center gap-2 text-xs text-muted"
                      role="status"
                      aria-live="polite"
                    >
                      <span className="flex gap-1">
                        <span className="animate-bounce-soft h-1.5 w-1.5 rounded-full bg-accent [animation-delay:0ms]" />
                        <span className="animate-bounce-soft h-1.5 w-1.5 rounded-full bg-accent [animation-delay:160ms]" />
                        <span className="animate-bounce-soft h-1.5 w-1.5 rounded-full bg-accent [animation-delay:320ms]" />
                      </span>
                      {stageLabel}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showJump && tab === "chat" && (
        <div className="relative">
          <button
            onClick={jumpToBottom}
            aria-label="Pumunta sa pinakabagong sagot"
            className="glass-strong animate-pop absolute -top-12 left-1/2 z-10 -translate-x-1/2 rounded-full p-2.5 text-body shadow-lg backdrop-blur-xl transition-all duration-150 hover:border-accent/40 hover:text-accent active:scale-90 focus-ring"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* Input bar — chat tab only */}
      {tab === "chat" && (
        <form
          onSubmit={onSubmit}
          className="border-t border-line p-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-3"
        >
          {/* Active Voice Waveform Visualizer */}
          {listening && (
            <div className="animate-slide-down mx-auto mb-2.5 flex max-w-2xl items-center justify-between rounded-2xl border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent backdrop-blur">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
                </span>
                <span>Nakikinig si PAANO… Sabihin ang iyong tanong</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="animate-wave-1 w-1 rounded-full bg-accent" />
                <span className="animate-wave-2 w-1 rounded-full bg-accent" />
                <span className="animate-wave-3 w-1 rounded-full bg-accent" />
                <span className="animate-wave-4 w-1 rounded-full bg-accent" />
                <span className="animate-wave-5 w-1 rounded-full bg-accent" />
              </div>
            </div>
          )}

          <div className="mx-auto flex max-w-2xl items-center gap-1.5 rounded-full border border-line bg-surface p-1.5 pl-3.5 shadow-lg shadow-black/20 backdrop-blur-xl backdrop-saturate-150 focus-within:border-accent sm:gap-2 sm:pl-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? "Nakikinig…" : 'Hal. "Paano magcommute papuntang Quiapo?"'}
              disabled={loading}
              maxLength={1000}
              aria-label="Itanong sa PAANO"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-body/70"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onPickImage(e.target.files?.[0])}
            />
            {/* Voice input button */}
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                disabled={loading}
                title="Voice input"
                aria-label="Voice input"
                aria-pressed={listening}
                className={`shrink-0 rounded-full p-2 transition-all duration-150 active:scale-95 focus-ring disabled:opacity-60 sm:p-2.5 ${
                  listening
                    ? "bg-accent/20 text-accent"
                    : "text-foreground/70 hover:bg-panel-strong hover:text-accent"
                }`}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              title="Litrato ng sangkap → anong ulam?"
              aria-label="Mag-attach ng litrato ng sangkap"
              className="shrink-0 rounded-full p-2 text-foreground/70 transition-all duration-150 hover:bg-panel-strong hover:text-accent active:scale-95 focus-ring disabled:opacity-60 sm:p-2.5"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            </button>
            <button
              type="submit"
              disabled={loading || (!input.trim() && !pendingImage)}
              className="shrink-0 rounded-full bg-accent-strong px-4 py-2 text-xs font-bold text-accent-ink shadow-md shadow-accent/30 transition-all duration-150 hover:bg-accent-bright active:scale-95 focus-ring disabled:cursor-not-allowed sm:px-5 sm:py-2.5 sm:text-sm"
            >
              Itanong
            </button>
          </div>

          {pendingImage && (
            <div className="glass-card mx-auto mt-2 flex max-w-2xl items-center gap-2 rounded-xl p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingImage}
                alt="Preview"
                className="h-10 w-10 shrink-0 rounded-lg border border-line-strong object-cover sm:h-12 sm:w-12"
              />
              <span className="min-w-0 flex-1 truncate text-[11px] text-muted">
                Sangkap photo — sasabihin ng PAANO kung anong ulam ang kaya.
              </span>
              <button
                type="button"
                onClick={() => setPendingImage(null)}
                className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold text-muted hover:text-body focus-ring"
              >
                Alisin
              </button>
            </div>
          )}

          {inputNotice && (
            <p className="mx-auto mt-2 max-w-2xl text-center text-[11px] font-medium text-rose-700 dark:text-rose-300" role="alert">
              {inputNotice}
            </p>
          )}

          <p className="mx-auto mt-2 max-w-2xl text-center text-[11px] leading-relaxed text-muted">
            Hindi doktor/abogado/ahensya ang PAANO. I-verify sa opisyal na source
            bago kumilos.
            {remaining !== null && remaining <= 10 && remaining > 0 && (
              <span className="ml-1 text-amber-600 dark:text-amber-400">· {remaining} tanong pa para ngayong araw</span>
            )}
            {remaining === 0 && (
              <span className="ml-1 text-amber-600 dark:text-amber-400">· Naabot na ang daily limit. Balik bukas!</span>
            )}
          </p>
        </form>
      )}
    </div>
  );
}
