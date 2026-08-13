"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AnswerCard } from "@/components/AnswerCard";
import { BotAvatar } from "@/components/BotAvatar";
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

interface UiMessage {
  id: number;
  role: "user" | "assistant";
  content?: string;
  answer?: PaanoAnswer;
  suggestions?: string[];
  error?: string;
  /** Para sa retry button: ang tanong na pumalpak. */
  retryQuestion?: string;
  /** Thumbnail ng attached na larawan (image→recipe). */
  image?: string;
}

/** I-resize ang larawan sa max 1024px at i-JPEG (para hindi mabigat). */
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoSentRef = useRef(false);
  /** Kung naka-scroll ang user pataas, huwag i-force ang auto-scroll. */
  const pinnedRef = useRef(true);

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
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }

  async function onPickImage(file: File | undefined) {
    if (!file || loading) return;
    try {
      setPendingImage(await resizeImage(file));
    } catch {
      setPendingImage(null);
    }
  }

  // Trending "paano" questions (Popular paano — mula sa question logs).
  useEffect(() => {
    fetch("/api/trending")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.trending) && d.trending.length > 0) {
          setTrending(d.trending.slice(0, 4));
        }
      })
      .catch(() => {});
  }, []);

  // Galing sa landing page (?q=...): i-prefill at auto-send ng isang beses.
  useEffect(() => {
    if (initialQuestion && !autoSentRef.current) {
      autoSentRef.current = true;
      void send(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  const scrollToBottom = () => {
    if (!pinnedRef.current) return; // may binabasa ang user pataas
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
  };

  const push = (msg: UiMessage) => {
    if (msg.role === "user") pinnedRef.current = true; // sariling tanong — i-pin
    setMessages((prev) => [...prev, msg]);
    scrollToBottom();
  };

  async function send(text: string) {
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

    // History para sa modelo: serialized ang mga sagot ng PAANO para
    // maalala nito ang mga naunang sagot sa follow-up questions.
    const history = [...messages, userMsg]
      .map((m) => {
        if (m.role === "user") return { role: "user" as const, content: m.content! };
        if (m.answer) return { role: "model" as const, content: answerToText(m.answer) };
        return null; // skip error turns — huwag ipasok sa context
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
      push({
        id: nextId++,
        role: "assistant",
        error: "Hindi makakonekta sa server. Tingnan ang iyong koneksyon.",
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

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#050507]">
      <div ref={scrollRef} onScroll={onScrollArea} className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-4">
        {messages.length === 0 && (
          <div className="mx-auto max-w-2xl space-y-6 pt-4">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 shadow-lg shadow-orange-500/10">
                <BotAvatar size={44} showPulse className="rounded-2xl" />
              </div>
              <h2 className="text-xl font-black text-white">
                Ano ang gagawin mo ngayon?
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
                Tanong sa Taglish — commute, lutong bahay, gawa-bahay, first aid,
                o requirements ng government documents.
              </p>
            </div>

            {trending.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-orange-400">
                  Pinapagtanungan ngayon
                </p>
                <div className="flex flex-wrap gap-2">
                  {trending.map((s) => (
                    <button
                      key={s}
                      onClick={() => void send(s)}
                      className="rounded-full bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-300 ring-1 ring-orange-500/30 transition-all duration-150 hover:bg-orange-500/20 active:scale-95 focus-ring"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Simulan sa kategorya
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                {QUICK_CATEGORIES.map((c, i) => (
                  <button
                    key={c.label}
                    onClick={() => void send(c.query)}
                    className="group animate-fade-up flex flex-col items-start gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-left transition-all duration-150 hover:border-orange-500/60 hover:bg-zinc-900 active:scale-[0.98] focus-ring"
                    style={{ animationDelay: `${120 + i * 60}ms` }}
                  >
                    <span className="text-orange-500 transition-transform duration-150 group-hover:scale-110">
                      <c.icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-semibold text-zinc-200">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                O piliin ang halimbawa
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => void send(s)}
                    className="animate-fade-up rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all duration-150 hover:border-orange-500/60 hover:text-orange-300 active:scale-95 focus-ring"
                    style={{ animationDelay: `${100 + SUGGESTIONS.indexOf(s) * 40}ms` }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-2xl space-y-5">
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="animate-fade-up flex justify-end">
                <div className="max-w-[88%] space-y-2 sm:max-w-[80%]">
                  {m.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.image}
                      alt="Attached"
                      className="ml-auto h-28 w-28 rounded-2xl border border-zinc-700 object-cover shadow-md"
                    />
                  )}
                  <div className="flex items-end justify-end gap-2">
                    <p className="rounded-2xl rounded-br-sm bg-orange-500 px-4 py-2.5 text-sm font-medium text-zinc-950 shadow-md shadow-orange-500/20">
                      {m.content}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div key={m.id} className="animate-fade-up space-y-2">
                <div className="flex items-start gap-2.5">
                  <BotAvatar size={28} className="shrink-0" />
                  <div className="flex-1 space-y-2">
                    {m.answer && <AnswerCard answer={m.answer} />}
                    {m.error && (
                      <div className="rounded-2xl border border-red-800/40 bg-red-950/40 p-4">
                        <p className="text-sm text-red-200">{m.error}</p>
                        {m.retryQuestion && (
                          <button
                            onClick={() => void send(m.retryQuestion!)}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-red-900/60 px-3 py-1 text-xs font-semibold text-red-100 transition-all duration-150 hover:bg-red-800/60 active:scale-95 focus-ring"
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
                            className="animate-pop rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 text-[11px] font-medium text-zinc-300 transition-all duration-150 hover:border-orange-500/60 hover:text-orange-300 active:scale-95 focus-ring"
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
            <div className="animate-fade-up flex items-start gap-2.5">
              <BotAvatar size={28} className="shrink-0" />
              <div className="flex-1 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-md">
                <div className="skeleton mb-3 h-4 w-24 rounded-full" />
                <div className="skeleton mb-2 h-5 w-2/3 rounded-md" />
                <div className="skeleton mb-4 h-3 w-full rounded" />
                <div className="skeleton mb-2 h-3 w-full rounded" />
                <div className="skeleton mb-2 h-3 w-5/6 rounded" />
                <div className="skeleton mb-3 h-3 w-2/3 rounded" />
                <div className="skeleton h-16 w-full rounded-xl" />
                <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                  <span className="flex gap-1">
                    <span className="animate-bounce-soft h-1.5 w-1.5 rounded-full bg-orange-500 [animation-delay:0ms]" />
                    <span className="animate-bounce-soft h-1.5 w-1.5 rounded-full bg-orange-500 [animation-delay:160ms]" />
                    <span className="animate-bounce-soft h-1.5 w-1.5 rounded-full bg-orange-500 [animation-delay:320ms]" />
                  </span>
                  Nag-iisip ang PAANO…
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showJump && (
        <div className="relative">
          <button
            onClick={jumpToBottom}
            aria-label="Pumunta sa pinakabagong sagot"
            className="animate-pop absolute -top-12 left-1/2 z-10 -translate-x-1/2 rounded-full border border-zinc-700 bg-zinc-900/95 p-2.5 text-zinc-300 shadow-lg shadow-black/40 backdrop-blur transition-all duration-150 hover:border-orange-500/60 hover:text-orange-300 active:scale-90 focus-ring"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="border-t border-zinc-900 bg-[#050507]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur"
      >
        <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 p-1.5 pl-4 shadow-md shadow-black/30 backdrop-blur focus-within:border-orange-500/60 focus-within:ring-1 focus-within:ring-orange-500/20">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Hal. "Paano magcommute papuntang Quiapo?"'
            disabled={loading}
            maxLength={1000}
            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void onPickImage(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            title="Litrato ng sangkap → anong ulam?"
            aria-label="Mag-attach ng litrato ng sangkap"
            className="shrink-0 rounded-full p-2.5 text-zinc-400 transition-all duration-150 hover:bg-zinc-800 hover:text-orange-300 active:scale-95 focus-ring disabled:opacity-40"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </button>
          <button
            type="submit"
            disabled={loading || (!input.trim() && !pendingImage)}
            className="shrink-0 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-md shadow-orange-500/20 transition-all duration-150 hover:bg-orange-400 active:scale-95 focus-ring disabled:opacity-40"
          >
            Itanong
          </button>
        </div>

        {pendingImage && (
          <div className="mx-auto mt-2 flex max-w-2xl items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingImage}
              alt="Preview"
              className="h-12 w-12 rounded-lg border border-zinc-700 object-cover"
            />
            <span className="text-[11px] text-zinc-400">
              Sangkap photo — sasabihin ng PAANO kung anong ulam ang kaya.
            </span>
            <button
              type="button"
              onClick={() => setPendingImage(null)}
              className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 focus-ring"
            >
              Alisin
            </button>
          </div>
        )}

        <p className="mx-auto mt-2 max-w-2xl text-center text-[10px] leading-relaxed text-zinc-600">
          Ang PAANO ay hindi doktor, abogado, o opisyal na ahensya. Para sa health,
          fees, at legal na usapin, i-verify sa opisyal na source. Ang mga sagot ay
          maaaring magbago — laging i-double check bago kumilos.
        </p>
      </form>
    </div>
  );
}
