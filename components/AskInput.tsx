"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

/**
 * Ang NAG-IISANG CTA ng landing page: isang ask input.
 * Submit → redirect sa /paano?q=<tanong>, kung saan awtomatikong
 * itatanong at sasagutin ang tanong.
 */
export function AskInput({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    router.push(`/paano?q=${encodeURIComponent(q)}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`group flex w-full items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 p-1.5 shadow-lg shadow-black/20 backdrop-blur transition-all duration-200 focus-within:border-orange-500 focus-within:shadow-orange-500/20 ${compact ? "" : "pl-5"}`}
      role="search"
    >
      <span className="pl-1 text-zinc-500 transition-colors duration-200 group-focus-within:text-orange-400" aria-hidden>
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ano ang gagawin mo? Hal. “paano magcommute papuntang Quiapo”"
        aria-label="Itanong sa PAANO"
        maxLength={1000}
        className={`min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500 ${compact ? "px-2 py-1.5" : "py-2.5"}`}
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="shrink-0 rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-zinc-950 transition-all duration-150 hover:bg-orange-400 active:scale-95 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:opacity-40"
      >
        Itanong
      </button>
    </form>
  );
}
