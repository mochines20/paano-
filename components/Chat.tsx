"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AnswerCard } from "@/components/AnswerCard";
import { answerToText } from "@/lib/answers";
import type { PaanoAnswer } from "@/lib/answers";

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
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} onScroll={onScrollArea} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="mx-auto max-w-xl">
            <div className="mb-3 flex items-center gap-2">
              <span className="animate-float-soft text-orange-500" aria-hidden>
                <svg
                  className="h-7 w-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9.5 9.5h.01M14.5 9.5h.01M8 15c1-1.5 2.5-2 4-2s3 .5 4 2" />
                </svg>
              </span>
              <h2 className="text-lg font-bold text-zinc-50">
                Ano ang gagawin mo ngayon?
              </h2>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-zinc-400">
              Tanong sa Taglish — commute, lutong bahay, gawa-bahay, first aid,
              o requirements ng government documents. Sagot na parang tita o kuya
              na ginawa na ito.
            </p>
            {trending.length > 0 && (
              <>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-orange-400">
                  Pinapagtanungan ngayon
                </p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {trending.map((s) => (
                    <button
                      key={s}
                      onClick={() => void send(s)}
                      className="rounded-full bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-300 ring-1 ring-orange-500/30 transition-all duration-150 hover:bg-orange-500/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="animate-fade-up rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all duration-150 hover:border-orange-500/60 hover:text-orange-300 active:scale-95 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950"
                  style={{ animationDelay: `${100 + SUGGESTIONS.indexOf(s) * 50}ms` }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="animate-fade-up flex justify-end">
              <div className="max-w-[85%] space-y-1.5">
                {m.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.image}
                    alt="Attached"
                    className="h-24 w-24 rounded-xl border border-zinc-700 object-cover"
                  />
                )}
                <p className="rounded-2xl rounded-br-sm bg-zinc-100 px-4 py-2.5 text-sm text-zinc-900">
                  {m.content}
                </p>
              </div>
            </div>
          ) : (
            <div key={m.id} className="animate-fade-up space-y-2">
              {m.answer && <AnswerCard answer={m.answer} />}
              {m.error && (
                <div className="rounded-2xl border border-red-900/50 bg-red-950/40 px-4 py-3">
                  <p className="text-sm text-red-200">{m.error}</p>
                  {m.retryQuestion && (
                    <button
                      onClick={() => void send(m.retryQuestion!)}
                      className="mt-2 rounded-full bg-red-900/60 px-3 py-1 text-xs font-semibold text-red-100 transition-all duration-150 hover:bg-red-800/60 active:scale-95 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950"
                    >
                      Subukan muli
                    </button>
                  )}
                </div>
              )}
              {m.suggestions && m.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {m.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => void send(s)}
                      className="animate-pop rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[11px] font-medium text-zinc-300 transition-all duration-150 hover:border-orange-500/60 hover:text-orange-300 active:scale-95 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ),
        )}

        {loading && (
          <div className="animate-fade-up space-y-2">
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="skeleton mb-3 h-4 w-20 rounded-full" />
              <div className="skeleton mb-2 h-5 w-2/3 rounded-md" />
              <div className="skeleton mb-4 h-3 w-full rounded" />
              <div className="skeleton mb-2 h-3 w-full rounded" />
              <div className="skeleton mb-2 h-3 w-5/6 rounded" />
              <div className="skeleton mb-3 h-3 w-2/3 rounded" />
              <div className="skeleton h-14 w-full rounded-xl" />
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

      {showJump && (
        <div className="relative">
          <button
            onClick={jumpToBottom}
            aria-label="Pumunta sa pinakabagong sagot"
            className="animate-pop absolute -top-12 left-1/2 z-10 -translate-x-1/2 rounded-full border border-zinc-700 bg-zinc-900/95 p-2 text-zinc-300 shadow-lg shadow-black/40 backdrop-blur transition-colors hover:border-orange-500/60 hover:text-orange-300 active:scale-90"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="border-t border-zinc-800 bg-zinc-950/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur"
      >
        <div className="mx-auto flex max-w-2xl gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Hal. "Paano magcommute papuntang Quiapo?"'
            disabled={loading}
            maxLength={1000}
            className="min-w-0 flex-1 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:opacity-60"
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
            className="shrink-0 rounded-full border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm font-semibold text-zinc-300 transition-all duration-150 hover:border-orange-500/60 hover:text-orange-300 active:scale-95 disabled:opacity-40"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </button>
          <button
            type="submit"
            disabled={loading || (!input.trim() && !pendingImage)}
            className="shrink-0 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-zinc-950 transition-all duration-150 hover:bg-orange-400 active:scale-95 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-40"
          >
            Itanong
          </button>
        </div>
        {pendingImage && (
          <div className="mx-auto mt-2 flex max-w-2xl items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingImage}
              alt="Preview"
              className="h-12 w-12 rounded-lg border border-zinc-700 object-cover"
            />
            <span className="text-[11px] text-zinc-500">
              Sangkap photo — sasabihin ng PAANO kung anong ulam ang kaya.
            </span>
            <button
              type="button"
              onClick={() => setPendingImage(null)}
              className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold text-zinc-400 hover:text-zinc-200"
            >
              Alisin
            </button>
          </div>
        )}
        <p className="mx-auto mt-2 max-w-2xl text-center text-[10px] leading-relaxed text-zinc-500">
          Ang PAANO ay hindi doktor, abogado, o opisyal na ahensya. Para sa health,
          fees, at legal na usapin, i-verify sa opisyal na source. Ang mga sagot ay
          maaaring magbago — laging i-double check bago kumilos.
        </p>
      </form>
    </div>
  );
}
