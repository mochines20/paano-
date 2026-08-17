"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/useTheme";
import { EmergencyModal } from "@/components/EmergencyModal";

/** Sticky header — may active state ang "Itanong" at "Saklolo" hotlines. */
export function Header() {
  const pathname = usePathname();
  const onPaano = pathname.startsWith("/paano");
  const { theme, toggle } = useTheme();
  const [showEmergency, setShowEmergency] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#021B30]/70 backdrop-blur-xl backdrop-saturate-150">
        <nav className="mx-auto flex max-w-3xl items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="flex items-center gap-1 text-lg font-black tracking-tight text-white transition-opacity hover:opacity-90 active:scale-95 sm:text-xl"
            >
              PAANO
              <span className="animate-pulse-dot text-[#FBE77A]">.</span>
            </Link>
            <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-[#FBE77A] backdrop-blur sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FBE77A] animate-pulse-dot" />
              Transit & Hub Grounded
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Saklolo Emergency Button */}
            <button
              onClick={() => setShowEmergency(true)}
              aria-label="Buksan ang Saklolo emergency hotlines"
              title="Saklolo (911 / Red Cross / MMDA / Crisis Hotlines)"
              className="flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-500/15 px-2.5 py-1 text-xs font-bold text-rose-200 backdrop-blur transition-all hover:bg-rose-500/25 active:scale-95 focus-ring sm:px-3 sm:py-1.5"
            >
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping" />
              Saklolo
            </button>

            <button
              onClick={toggle}
              aria-label={theme === "dark" ? "Mag-light mode" : "Mag-dark mode"}
              title={theme === "dark" ? "Mag-light mode" : "Mag-dark mode"}
              suppressHydrationWarning
              className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 backdrop-blur transition-all duration-150 hover:bg-white/10 hover:text-[#FBE77A] active:scale-95 focus-ring sm:p-2.5"
            >
              {theme === "dark" ? (
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
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
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
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <Link
              href="/paano"
              aria-current={onPaano ? "page" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold backdrop-blur transition-all duration-150 active:scale-95 focus-ring sm:px-4 sm:text-sm ${
                onPaano
                  ? "bg-[#FBE77A] text-[#0A2540] shadow-md shadow-[#FBE77A]/20 hover:bg-[#FFE98A]"
                  : "border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
              }`}
            >
              Itanong
            </Link>
          </div>
        </nav>
      </header>

      {/* Emergency Modal */}
      <EmergencyModal
        isOpen={showEmergency}
        onClose={() => setShowEmergency(false)}
      />
    </>
  );
}
