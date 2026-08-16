"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/useTheme";

/** Sticky header — may active state ang "Itanong" kapag nasa /paano. */
export function Header() {
  const pathname = usePathname();
  const onPaano = pathname.startsWith("/paano");
  const { theme, toggle } = useTheme();

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
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={toggle}
            aria-label={theme === "dark" ? "Mag-light mode" : "Mag-dark mode"}
            title={theme === "dark" ? "Mag-light mode" : "Mag-dark mode"}
            suppressHydrationWarning
            className="rounded-full bg-zinc-800 p-2 text-zinc-400 transition-all duration-150 hover:bg-zinc-700 hover:text-orange-300 active:scale-95 focus-ring sm:p-2.5"
          >
            {theme === "dark" ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
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
        </div>
      </nav>
    </header>
  );
}
