"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Sticky header — may active state ang "Itanong" kapag nasa /paano. */
export function Header() {
  const pathname = usePathname();
  const onPaano = pathname.startsWith("/paano");

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-900/80 bg-[#050507]/85 backdrop-blur">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3">
        <Link
          href="/"
          className="flex items-center gap-1 text-lg font-black tracking-tight text-white transition-opacity hover:opacity-90 active:scale-95 sm:text-xl"
        >
          PAANO
          <span className="animate-pulse-dot text-orange-500">.</span>
        </Link>
        <Link
          href="/paano"
          aria-current={onPaano ? "page" : undefined}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95 focus-ring sm:px-4 sm:text-sm ${
            onPaano
              ? "bg-orange-500 text-zinc-950 hover:bg-orange-400"
              : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
          }`}
        >
          Itanong
        </Link>
      </nav>
    </header>
  );
}
