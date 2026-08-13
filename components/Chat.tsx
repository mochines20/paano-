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
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoSentRef = useRef(false);

  // Galing sa landing page (?q=...): i-prefill at auto-send ng isang beses.
  useEffect(() => {
    if (initialQuestion && !autoSentRef.current) {
      autoSentRef.current = true;
      void send(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
  };

  const push = (msg: UiMessage) => {
    setMessages((prev) => [...prev, msg]);
    scrollToBottom();
  };

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;

    const userMsg: UiMessage = { id: nextId++, role: "user", content: question };
    setInput("");
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
        body: JSON.stringify({ messages: history }),
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
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="mx-auto max-w-xl">
            <h2 className="text-lg font-bold text-zinc-50">
              Ano ang gagawin mo ngayon?
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-zinc-400">
              Tanong sa Taglish — commute, lutong bahay, gawa-bahay, first aid,
              o requirements ng government documents. Sagot na parang tita o kuya
              na ginawa na ito.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-orange-500/60 hover:text-orange-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-zinc-100 px-4 py-2.5 text-sm text-zinc-900">
                {m.content}
              </p>
            </div>
          ) : (
            <div key={m.id} className="space-y-2">
              {m.answer && <AnswerCard answer={m.answer} />}
              {m.error && (
                <div className="rounded-2xl border border-red-900/50 bg-red-950/40 px-4 py-3">
                  <p className="text-sm text-red-200">{m.error}</p>
                  {m.retryQuestion && (
                    <button
                      onClick={() => void send(m.retryQuestion!)}
                      className="mt-2 rounded-full bg-red-900/60 px-3 py-1 text-xs font-semibold text-red-100 transition-colors hover:bg-red-800/60"
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
                      className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:border-orange-500/60 hover:text-orange-300"
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
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-500 [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-500 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-500 [animation-delay:300ms]" />
            </span>
            Nag-iisip ang PAANO…
          </div>
        )}
      </div>

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
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="shrink-0 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-orange-400 disabled:opacity-40"
          >
            Itanong
          </button>
        </div>
        <p className="mx-auto mt-2 max-w-2xl text-center text-[10px] leading-relaxed text-zinc-500">
          Ang PAANO ay hindi doktor, abogado, o opisyal na ahensya. Para sa health,
          fees, at legal na usapin, i-verify sa opisyal na source. Ang mga sagot ay
          maaaring magbago — laging i-double check bago kumilos.
        </p>
      </form>
    </div>
  );
}
