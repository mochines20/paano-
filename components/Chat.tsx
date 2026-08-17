"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AnswerCard } from "@/components/AnswerCard";
import { BotAvatar } from "@/components/BotAvatar";
import { useVoiceInput } from "@/components/useVoiceInput";
import {
  IconCommute,
  IconCooking,
  IconDiy,
  IconFirstAid,
  IconDocs,
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
  image?: string;
}

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

let nextId = 1;

export function Chat({ initialQuestion }: { initialQuestion?: string }) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState<string[]>([]);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [showJump, setShowJump] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [tab, setTab] = useState<"chat" | "saved" | "history">("chat");
  const [savedAnswers, setSavedAnswers] = useState<SavedAnswer[]>(() => getSavedAnswers());
  const [history, setHistory] = useState<HistoryItem[]>(() => getHistory());
  const [rotatingIndex, setRotatingIndex] = useState(0);
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
    } catch {
      setPendingImage(null);
    }
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

  async function send(text: string, retries = 0) {
    const question = text.trim();
    const image = pendingImage;
    if ((!question && !image) || loading) return;

    const userMsg: UiMessage = {
      id: nextId++,
      role: "user",
      content: question || "Ano ang ulam sa mga ito?",
      image: image ?? undefined,
    };
    setInput("");
    setPendingImage(null);
    push(userMsg);
    setLoading(true);
    addToHistory(question || userMsg.content || "");

    const history = [...messages, userMsg]
      .map((m) => {
        if (m.role === "user") return { role: "user" as const, content: m.content! };
        if (m.answer) return { role: "model" as const, content: answerToText(m.answer) };
        return null;
      })
      .filter((m): m is { role: "user" | "model"; content: string } => m !== null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, image: image ?? undefined }),
      });
      const data = await res.json();

      if (!res.ok || !data.answer) {
        // Auto-retry kapag 503 (service unavailable) at hindi pa max retries
        if (res.status === 503 && retries < 1) {
          setTimeout(() => void send(question, retries + 1), 1500);
          return;
        }
        push({
          id: nextId++,
          role: "assistant",
          error: data.error ?? "May nangyaring mali. Subukan muli.",
          retryQuestion: question,
        });
        return;
      }
      push({
        id: nextId++,
        role: "assistant",
        answer: data.answer as PaanoAnswer,
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : undefined,
      });
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
      });
    } finally {
      setLoading(false);
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

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#021B30]">
      {/* Offline banner */}
      {!isOnline && (
        <div className="animate-slide-down flex items-center justify-center gap-2 border-b border-amber-400/20 bg-amber-500/10 px-4 py-1.5 text-center text-[11px] font-medium text-amber-200 backdrop-blur">
          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
          </svg>
          Walang koneksyon — offline mode. May mga saved na sagot ka pa rin.
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-white/10 px-2.5 pt-2 sm:px-4">
        {([
          { key: "chat", label: "Chat" },
          { key: "saved", label: `Saved${savedAnswers.length > 0 ? ` (${savedAnswers.length})` : ""}` },
          { key: "history", label: `Recent${history.length > 0 ? ` (${history.length})` : ""}` },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              if (t.key === "saved") setSavedAnswers(getSavedAnswers());
              if (t.key === "history") setHistory(getHistory());
            }}
            className={`relative rounded-t-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
              tab === t.key
                ? "text-[#FBE77A]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#FBE77A]" />
            )}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div ref={scrollRef} onScroll={onScrollArea} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-4 sm:px-4 sm:py-5">
        {/* SAVED TAB */}
        {tab === "saved" && (
          <div className="mx-auto max-w-2xl space-y-3">
            <h2 className="text-lg font-black text-white sm:text-xl">Naka-save na Sagot</h2>
            {savedAnswers.length === 0 ? (
              <div className="glass-card rounded-2xl p-6 text-center">
                <p className="text-sm text-slate-400">
                  Wala pang naka-save na sagot. I-tap ang bookmark icon sa sagot para i-save.
                </p>
              </div>
            ) : (
              savedAnswers.map((s) => (
                <div key={s.id} className="glass-card rounded-2xl p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-[#FBE77A]">{s.question}</p>
                      <h3 className="mt-0.5 text-sm font-bold text-white">{s.title}</h3>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {new Date(s.savedAt).toLocaleDateString("fil-PH", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => {
                          setTab("chat");
                          void send(s.question);
                        }}
                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-slate-200 backdrop-blur transition-colors hover:bg-white/10 focus-ring"
                      >
                        Buksan
                      </button>
                      <button
                        onClick={() => removeSaved(s.id)}
                        aria-label="Alisin sa saved"
                        className="rounded-full border border-white/10 bg-white/5 p-1.5 text-slate-400 backdrop-blur transition-colors hover:bg-rose-500/20 hover:text-rose-300 focus-ring"
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
            <h2 className="text-lg font-black text-white sm:text-xl">Mga Naunang Tanong</h2>
            {history.length === 0 ? (
              <div className="glass-card rounded-2xl p-6 text-center">
                <p className="text-sm text-slate-400">
                  Wala pang history. Magtanong na sa PAANO!
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setTab("chat");
                      void send(h.question);
                    }}
                    className="glass-card flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-150 hover:border-[#FBE77A]/40 active:scale-[0.98] focus-ring"
                  >
                    <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                    </svg>
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{h.question}</span>
                    <span className="shrink-0 text-[10px] text-slate-500">
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
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#FBE77A]/25 bg-[#FBE77A]/10 shadow-lg shadow-[#FBE77A]/10 backdrop-blur sm:mb-4 sm:h-14 sm:w-14">
                    <BotAvatar size={36} showPulse className="rounded-2xl sm:size-11" />
                  </div>
                  <h2 className="text-lg font-black text-white sm:text-xl">
                    Ano ang gagawin mo ngayon?
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-300">
                    Tanong sa Taglish — commute, lutong bahay, gawa-bahay, first aid,
                    o requirements ng government documents.
                  </p>
                </div>

                {/* Rotating example */}
                <div className="text-center">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Subukan ito
                  </p>
                  <button
                    onClick={() => void send(ROTATING_EXAMPLES[rotatingIndex])}
                    className="animate-fade-up inline-block max-w-full truncate rounded-full border border-[#FBE77A]/30 bg-[#FBE77A]/10 px-4 py-2 text-sm font-medium text-[#FBE77A] backdrop-blur transition-all duration-200 hover:bg-[#FBE77A]/20 active:scale-95 focus-ring"
                    key={rotatingIndex}
                  >
                    {ROTATING_EXAMPLES[rotatingIndex]}
                  </button>
                </div>

                {trending.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#FBE77A]">
                      Pinapagtanungan ngayon
                    </p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {trending.map((s) => (
                        <button
                          key={s}
                          onClick={() => void send(s)}
                          className="rounded-full bg-[#FBE77A]/10 px-2.5 py-1.5 text-[11px] font-medium text-[#FBE77A] ring-1 ring-[#FBE77A]/30 backdrop-blur transition-all duration-150 hover:bg-[#FBE77A]/20 active:scale-95 focus-ring sm:px-3 sm:text-xs"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Simulan sa kategorya
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 sm:gap-2">
                    {QUICK_CATEGORIES.map((c, i) => (
                      <button
                        key={c.label}
                        onClick={() => void send(c.query)}
                        className="glass-card group animate-fade-up flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-center transition-all duration-150 hover:border-[#FBE77A]/40 active:scale-[0.98] focus-ring sm:flex-row sm:items-start sm:text-left sm:p-3"
                        style={{ animationDelay: `${120 + i * 60}ms` }}
                      >
                        <span className="text-[#FBE77A] transition-transform duration-150 group-hover:scale-110">
                          <c.icon className="h-5 w-5" />
                        </span>
                        <span className="text-[11px] font-semibold text-slate-200 sm:text-xs">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    O piliin ang halimbawa
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => void send(s)}
                        className="glass-pill animate-fade-up rounded-full px-2.5 py-1.5 text-[11px] font-medium text-slate-300 backdrop-blur transition-all duration-150 hover:border-[#FBE77A]/40 hover:text-[#FBE77A] active:scale-95 focus-ring sm:px-3 sm:text-xs"
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
                          className="ml-auto h-24 w-24 rounded-2xl border border-white/15 object-cover shadow-md sm:h-28 sm:w-28"
                        />
                      )}
                      <div className="flex items-end justify-end gap-2">
                        <p className="rounded-2xl rounded-br-sm bg-[#FBE77A] px-3.5 py-2 text-sm font-medium text-[#0A2540] shadow-md shadow-[#FBE77A]/20 sm:px-4 sm:py-2.5">
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
                            <p className="text-sm text-rose-200">{m.error}</p>
                            {m.retryQuestion && (
                              <button
                                onClick={() => void send(m.retryQuestion!)}
                                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-rose-500/30 px-3 py-1 text-xs font-semibold text-rose-100 backdrop-blur transition-all duration-150 hover:bg-rose-500/40 active:scale-95 focus-ring"
                              >
                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                  <path d="M4 4v6h6M20 20v-6h-6M4 10a9 9 0 0 1 14-3.5l3-3M20 14a9 9 0 0 1-14 3.5l-3 3" />
                                </svg>
                                Subukan muli
                              </button>
                            )}
                          </div>
                        )}
                        {m.suggestions && m.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pl-0.5">
                            {m.suggestions.map((s) => (
                              <button
                                key={s}
                                onClick={() => void send(s)}
                                className="glass-pill animate-pop rounded-full px-3 py-1 text-[11px] font-medium text-slate-300 backdrop-blur transition-all duration-150 hover:border-[#FBE77A]/40 hover:text-[#FBE77A] active:scale-95 focus-ring"
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
                    <div className="skeleton mb-4 h-3 w-full rounded" />
                    <div className="skeleton mb-2 h-3 w-full rounded" />
                    <div className="skeleton mb-2 h-3 w-5/6 rounded" />
                    <div className="skeleton mb-3 h-3 w-2/3 rounded" />
                    <div className="skeleton h-16 w-full rounded-xl" />
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                      <span className="flex gap-1">
                        <span className="animate-bounce-soft h-1.5 w-1.5 rounded-full bg-[#FBE77A] [animation-delay:0ms]" />
                        <span className="animate-bounce-soft h-1.5 w-1.5 rounded-full bg-[#FBE77A] [animation-delay:160ms]" />
                        <span className="animate-bounce-soft h-1.5 w-1.5 rounded-full bg-[#FBE77A] [animation-delay:320ms]" />
                      </span>
                      Nag-iisip ang PAANO…
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
            className="glass-strong animate-pop absolute -top-12 left-1/2 z-10 -translate-x-1/2 rounded-full p-2.5 text-slate-200 shadow-lg backdrop-blur-xl transition-all duration-150 hover:border-[#FBE77A]/40 hover:text-[#FBE77A] active:scale-90 focus-ring"
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
          className="border-t border-white/10 bg-[#021B30]/80 p-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl backdrop-saturate-150 sm:p-3"
        >
          {/* Active Voice Waveform Visualizer */}
          {listening && (
            <div className="animate-slide-down mx-auto mb-2.5 flex max-w-2xl items-center justify-between rounded-2xl border border-[#FBE77A]/40 bg-[#FBE77A]/10 px-4 py-2 text-xs font-semibold text-[#FBE77A] backdrop-blur">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFE98A] opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#FBE77A]" />
                </span>
                <span>Nakikinig si PAANO… Sabihin ang iyong tanong</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="animate-wave-1 w-1 rounded-full bg-[#FBE77A]" />
                <span className="animate-wave-2 w-1 rounded-full bg-[#FBE77A]" />
                <span className="animate-wave-3 w-1 rounded-full bg-[#FBE77A]" />
                <span className="animate-wave-4 w-1 rounded-full bg-[#FBE77A]" />
                <span className="animate-wave-5 w-1 rounded-full bg-[#FBE77A]" />
              </div>
            </div>
          )}

          <div className="mx-auto flex max-w-2xl items-center gap-1.5 rounded-full border border-white/10 bg-white/5 p-1.5 pl-3.5 shadow-lg shadow-[#001525]/30 backdrop-blur-xl backdrop-saturate-150 focus-within:border-[#FBE77A]/50 focus-within:ring-1 focus-within:ring-[#FBE77A]/25 sm:gap-2 sm:pl-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? "Nakikinig…" : 'Hal. "Paano magcommute papuntang Quiapo?"'}
              disabled={loading}
              maxLength={1000}
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-slate-400"
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
                className={`shrink-0 rounded-full p-2 transition-all duration-150 active:scale-95 focus-ring disabled:opacity-40 sm:p-2.5 ${
                  listening
                    ? "bg-[#FBE77A]/20 text-[#FBE77A] animate-pulse-dot"
                    : "text-slate-400 hover:bg-white/10 hover:text-[#FBE77A]"
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
              className="shrink-0 rounded-full p-2 text-slate-400 transition-all duration-150 hover:bg-white/10 hover:text-[#FBE77A] active:scale-95 focus-ring disabled:opacity-40 sm:p-2.5"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            </button>
            <button
              type="submit"
              disabled={loading || (!input.trim() && !pendingImage)}
              className="shrink-0 rounded-full bg-[#FBE77A] px-4 py-2 text-xs font-bold text-[#0A2540] shadow-md shadow-[#FBE77A]/20 transition-all duration-150 hover:bg-[#FFE98A] active:scale-95 focus-ring disabled:opacity-40 sm:px-5 sm:py-2.5 sm:text-sm"
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
                className="h-10 w-10 shrink-0 rounded-lg border border-white/15 object-cover sm:h-12 sm:w-12"
              />
              <span className="min-w-0 flex-1 truncate text-[11px] text-slate-400">
                Sangkap photo — sasabihin ng PAANO kung anong ulam ang kaya.
              </span>
              <button
                type="button"
                onClick={() => setPendingImage(null)}
                className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold text-slate-400 hover:text-slate-200 focus-ring"
              >
                Alisin
              </button>
            </div>
          )}

          <p className="mx-auto mt-2 max-w-2xl text-center text-[10px] leading-relaxed text-slate-500">
            Hindi doktor/abogado/ahensya ang PAANO. I-verify sa opisyal na source
            bago kumilos.
          </p>
        </form>
      )}
    </div>
  );
}
