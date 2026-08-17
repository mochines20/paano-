"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MODE_OPTIONS = [
  { id: "jeep", label: "Jeep", emoji: "🚐" },
  { id: "bus", label: "Bus", emoji: "🚌" },
  { id: "lrt_mrt", label: "LRT/MRT", emoji: "🚆" },
  { id: "p2p", label: "P2P Bus", emoji: "🚍" },
  { id: "uv", label: "UV Express", emoji: "🕐" },
  { id: "tricycle", label: "Tricycle", emoji: "🛺" },
  { id: "walk", label: "Lakad", emoji: "🚶" },
] as const;

const POPULAR_DESTINATIONS = [
  "SM Megamall",
  "Intramuros",
  "NAIA Terminal 3",
  "UP Diliman",
  "SM Mall of Asia",
  "Quiapo Church",
  "St. Luke's BGC",
  "DFA Megamall",
];

/**
 * CommuteForm — structured From/To form para sa commute queries.
 * Hindi freetext — may fields, mode selector, at popular destinations.
 * On submit, constructs a natural language query at redirects to /paano.
 */
export function CommuteForm({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedModes, setSelectedModes] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleMode = (modeId: string) => {
    setSelectedModes((prev) =>
      prev.includes(modeId) ? prev.filter((m) => m !== modeId) : [...prev, modeId],
    );
  };

  const canSubmit = from.trim() && to.trim();

  function handleSubmit() {
    if (!canSubmit) return;
    const modeLabels = selectedModes
      .map((id) => MODE_OPTIONS.find((m) => m.id === id)?.label)
      .filter(Boolean);
    const modeText =
      modeLabels.length > 0
        ? ` gamit ang ${modeLabels.join(", ")}`
        : "";
    const query = `Paano pumunta mula ${from.trim()} papuntang ${to.trim()}${modeText}?`;
    router.push(`/paano?q=${encodeURIComponent(query)}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#021B30]/70 p-0 backdrop-blur-md sm:items-center sm:p-4 animate-fade-up"
      onClick={onClose}
    >
      <div
        className="glass-strong relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border-[#FBE77A]/20 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-sky-900/40 to-transparent p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-500/15 text-lg">
              🚌
            </span>
            <div>
              <h2 className="text-base font-black text-white sm:text-lg">
                Commute Planner
              </h2>
              <p className="text-[11px] text-slate-400">
                Ilagay ang origin at destination — bahala na si PAANO sa ruta.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Isara ang commute form"
            className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 backdrop-blur hover:bg-white/10 active:scale-95 transition-colors focus-ring"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {/* From field */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-sky-300">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-[10px]">A</span>
              Galing (From)
            </label>
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="Hal. Cubao, Katipunan, SM North"
              maxLength={200}
              className="w-full rounded-xl border border-white/10 bg-[#021B30]/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none backdrop-blur focus:border-sky-400/50 focus-ring"
            />
          </div>

          {/* To field */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#FBE77A]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FBE77A]/20 text-[10px]">B</span>
              Papunta (To)
            </label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Hal. SM Megamall, Intramuros, NAIA"
              maxLength={200}
              className="w-full rounded-xl border border-white/10 bg-[#021B30]/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none backdrop-blur focus:border-[#FBE77A]/50 focus-ring"
            />
          </div>

          {/* Popular destinations quick-fill for "To" */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Mga sikat na destinasyon (i-tap para sa &lsquo;To&rsquo;)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_DESTINATIONS.map((dest) => (
                <button
                  key={dest}
                  onClick={() => setTo(dest)}
                  className={`glass-pill rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur transition-all active:scale-95 focus-ring ${
                    to === dest
                      ? "border-[#FBE77A]/40 text-[#FBE77A]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {dest}
                </button>
              ))}
            </div>
          </div>

          {/* Mode selector */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Sasakyan (opsyonal — i-leave blank para sa best route)
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {MODE_OPTIONS.map((mode) => {
                const isSelected = selectedModes.includes(mode.id);
                return (
                  <button
                    key={mode.id}
                    onClick={() => toggleMode(mode.id)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center backdrop-blur transition-all active:scale-95 focus-ring ${
                      isSelected
                        ? "border-sky-400/50 bg-sky-500/15 text-sky-200"
                        : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-base">{mode.emoji}</span>
                    <span className="text-[10px] font-semibold">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer with submit */}
        <div className="border-t border-white/10 bg-[#021B30]/40 p-3 backdrop-blur sm:p-4">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FBE77A] py-3 text-sm font-black text-[#0A2540] shadow-lg shadow-[#FBE77A]/20 transition-all hover:bg-[#FFE98A] active:scale-95 focus-ring disabled:opacity-40 sm:py-3.5"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Hanapin ang Ruta
          </button>
          {!canSubmit && (
            <p className="mt-1.5 text-center text-[10px] text-slate-500">
              Punan ang &lsquo;Galing&rsquo; at &lsquo;Papunta&rsquo; para mag-search.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
