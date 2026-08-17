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
      className={`group flex w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/5 p-1.5 shadow-lg shadow-[#001525]/30 backdrop-blur-xl backdrop-saturate-150 transition-all duration-200 focus-within:border-[#FBE77A]/50 focus-within:ring-1 focus-within:ring-[#FBE77A]/25 sm:gap-2 ${compact ? "pl-3.5" : "pl-4 sm:pl-5"}`}
      role="search"
    >
      <span className="pl-0.5 text-slate-400 transition-colors duration-200 group-focus-within:text-[#FBE77A] sm:pl-1" aria-hidden>
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
        placeholder="Ano ang gagawin mo?"
        aria-label="Itanong sa PAANO"
        maxLength={1000}
        className={`min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-slate-400 ${compact ? "px-1.5 py-1.5 sm:px-2" : "py-2.5"}`}
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="shrink-0 rounded-full bg-[#FBE77A] px-3.5 py-2 text-xs font-bold text-[#0A2540] shadow-md shadow-[#FBE77A]/20 transition-all duration-150 hover:bg-[#FFE98A] active:scale-95 focus-ring disabled:opacity-40 sm:px-4 sm:text-sm"
      >
        Itanong
      </button>
    </form>
  );
}
