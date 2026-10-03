"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ComponentType } from "react";
import {
  IconCommute,
  IconJeepney,
  IconBus,
  IconTrain,
  IconVan,
  IconTricycle,
  IconWalk,
} from "@/components/icons";

const MODE_OPTIONS: {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { id: "jeep", label: "Jeep", icon: IconJeepney },
  { id: "bus", label: "Bus", icon: IconBus },
  { id: "lrt_mrt", label: "LRT/MRT", icon: IconTrain },
  { id: "p2p", label: "P2P Bus", icon: IconBus },
  { id: "uv", label: "UV Express", icon: IconVan },
  { id: "tricycle", label: "Tricycle", icon: IconTricycle },
  { id: "walk", label: "Lakad", icon: IconWalk },
];

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

  // Escape-to-close para sa desktop accessibility
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-deep/70 p-0 backdrop-blur-md sm:items-center sm:p-4 animate-fade-up"
      onClick={onClose}
    >
      <div
        className="glass-strong relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border-accent/20 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Commute planner"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-surface p-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-500/15">
              <IconCommute className="h-5 w-5 text-sky-600 dark:text-sky-300" />
            </span>
            <div className="min-w-0">
              <h2 className="break-words text-base font-black text-foreground sm:text-lg">
                Commute Planner
              </h2>
              <p className="text-[11px] text-muted">
                Ilagay ang origin at destination — bahala na si PAANO sa ruta.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Isara ang commute form"
            className="shrink-0 rounded-full border border-line bg-panel p-2 text-body backdrop-blur transition-colors hover:bg-panel-strong active:scale-95 focus-ring"
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
            <label htmlFor="paano-from" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-[11px]">A</span>
              Galing (From)
            </label>
            <input
              id="paano-from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="Hal. Cubao, Katipunan, SM North"
              maxLength={200}
              className="w-full rounded-xl border border-line bg-deep/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted outline-none backdrop-blur focus:border-sky-400/50 focus-ring"
            />
          </div>

          {/* To field */}
          <div>
            <label htmlFor="paano-to" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-accent">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-[11px]">B</span>
              Papunta (To)
            </label>
            <input
              id="paano-to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Hal. SM Megamall, Intramuros, NAIA"
              maxLength={200}
              className="w-full rounded-xl border border-line bg-deep/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted outline-none backdrop-blur focus:border-accent/50 focus-ring"
            />
          </div>

          {/* Popular destinations quick-fill for "To" */}
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Mga sikat na destinasyon (i-tap para sa &lsquo;To&rsquo;)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_DESTINATIONS.map((dest) => (
                <button
                  key={dest}
                  onClick={() => setTo(dest)}
                  className={`glass-pill rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur transition-all active:scale-95 focus-ring ${
                    to === dest
                      ? "border-accent/40 text-accent"
                      : "text-muted hover:text-body"
                  }`}
                >
                  {dest}
                </button>
              ))}
            </div>
          </div>

          {/* Mode selector */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Sasakyan (opsyonal — i-leave blank para sa best route)
            </p>
            <div className="grid grid-cols-2 gap-2 min-[360px]:grid-cols-3 sm:grid-cols-4">
              {MODE_OPTIONS.map((mode) => {
                const isSelected = selectedModes.includes(mode.id);
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => toggleMode(mode.id)}
                    aria-pressed={isSelected}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center backdrop-blur transition-all active:scale-95 focus-ring ${
                      isSelected
                        ? "border-sky-400/50 bg-sky-500/15 text-sky-800 dark:text-sky-200"
                        : "border-line bg-panel text-muted hover:bg-panel-strong"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isSelected ? "text-sky-600 dark:text-sky-300" : ""}`} />
                    <span className="text-[11px] font-semibold">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer with submit */}
        <div className="border-t border-line bg-deep/40 p-3 backdrop-blur sm:p-4">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-black text-accent-ink shadow-lg shadow-accent/20 transition-all hover:bg-accent-bright active:scale-95 focus-ring disabled:opacity-40 sm:py-3.5"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            Hanapin ang Ruta
          </button>
          {!canSubmit && (
            <p className="mt-1.5 text-center text-[11px] text-muted">
              Punan ang &lsquo;Galing&rsquo; at &lsquo;Papunta&rsquo; para mag-search.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
