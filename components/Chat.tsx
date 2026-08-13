"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { AnswerCard } from "@/components/AnswerCard";
import type { PaanoAnswer } from "@/lib/answers";

interface UiMessage {
  id: number;
  role: "user" | "assistant";
  content?: string;
  answer?: PaanoAnswer;
  error?: string;
}

const SUGGESTIONS = [
  "Paano magcommute mula Cubao papuntang Intramuros?",
  "Paano magluto ng chicken adobo para sa 10 tao?",
  "Paano ayusin ang tumutulong gripo?",
  "Paano kumuha ng NBI clearance?",
  "Ano ang gagawin sa heat rash ng bata?",
];

let nextId = 1;

export function Chat() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

    // Build conversation history for the model (user + assistant text only).
    const history = [...messages, userMsg]
      .filter((m) => m.content)
      .map((m) => ({ role: m.role === "user" ? "user" : "model", content: m.content! }));

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
        });
        return;
      }
      push({ id: nextId++, role: "assistant", answer: data.answer as PaanoAnswer });
    } catch {
      push({
        id: nextId++,
        role: "assistant",
        error: "Hindi makakonekta sa server. Tingnan ang iyong koneksyon.",
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
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-6"
      >
        {messages.length === 0 && (
          <div className="mx-auto max-w-xl">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Ano ang gagawin mo ngayon?
            </h2>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Tanong sa Taglish — commute, lutong bahay, gawa-bahay, first aid,
              o requirements ng government documents. Sagot na parang tita o kuya
              na ginawa na ito.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-amber-500 hover:text-amber-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-amber-400 dark:hover:text-amber-300"
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
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-zinc-900 px-4 py-2.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
                {m.content}
              </p>
            </div>
          ) : (
            <div key={m.id} className="flex flex-col gap-2">
              {m.answer && <AnswerCard answer={m.answer} />}
              {m.error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200">
                  {m.error}
                </div>
              )}
            </div>
          ),
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-500 [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-500 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-500 [animation-delay:300ms]" />
            </span>
            Nag-iisip ang PAANO…
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="border-t border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-2xl gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Hal. "Paano magcommute papuntang Quiapo?"'
            disabled={loading}
            maxLength={1000}
            className="min-w-0 flex-1 rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="shrink-0 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
          >
            Itanong
          </button>
        </div>
        <p className="mx-auto mt-2 max-w-2xl text-center text-[10px] leading-relaxed text-zinc-400 dark:text-zinc-500">
          Ang PAANO ay hindi doktor, abogado, o opisyal na ahensya. Para sa health,
          fees, at legal na usapin, i-verify sa opisyal na source. Ang mga sagot ay
          maaaring magbago — laging i-double check bago kumilos.
        </p>
      </form>
    </div>
  );
}
