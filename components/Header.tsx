"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Sticky header — may active state ang "Itanong" kapag nasa /paano. */
export function Header() {
  const pathname = usePathname();
  const onPaano = pathname.startsWith("/paano");

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-1 text-xl font-black tracking-tight text-zinc-50 transition-opacity hover:opacity-90 active:scale-95"
        >
          PAANO
          <span className="animate-pulse-dot text-orange-500">.</span>
        </Link>
        <Link
          href="/paano"
          aria-current={onPaano ? "page" : undefined}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-150 active:scale-95 ${
            onPaano
              ? "bg-orange-500 text-zinc-950 hover:bg-orange-400"
              : "bg-zinc-100 text-zinc-900 hover:bg-zinc-300"
          }`}
        >
          Itanong
        </Link>
      </nav>
    </header>
  );
}
