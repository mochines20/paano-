"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  IconCommute,
  IconCooking,
  IconDiy,
  IconTimer,
} from "@/components/icons";
import type { ComponentType } from "react";
import { cleanStepText } from "@/components/answer/formatStepText";

const TRACK_FILL: Record<string, string> = {
  cooking: "bg-blue-500",
  commute: "bg-sky-500",
  diy: "bg-emerald-500",
  first_aid: "bg-rose-500",
  docs: "bg-blue-500",
  generic: "bg-accent",
};

const TRACK_TEXT: Record<string, string> = {
  cooking: "text-blue-700 dark:text-blue-300",
  commute: "text-sky-600 dark:text-sky-300",
  diy: "text-emerald-600 dark:text-emerald-300",
  first_aid: "text-rose-600 dark:text-rose-300",
  docs: "text-blue-700 dark:text-blue-300",
  generic: "text-accent",
};

function extractStepSeconds(text: string): number | null {
  if (!text) return null;
  const minuteMatch = text.match(/(\d+)\s*(?:minuto|min|minute|m\b)/i);
  const hourMatch = text.match(/(\d+)\s*(?:oras|hour|hr|h\b)/i);
  const secondMatch = text.match(/(\d+)\s*(?:segundo|sec|second|s\b)/i);

  if (minuteMatch) return parseInt(minuteMatch[1], 10) * 60;
  if (hourMatch) return parseInt(hourMatch[1], 10) * 3600;
  if (secondMatch) return parseInt(secondMatch[1], 10);
  return null;
}

function StepIcon({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const Icon: ComponentType<{ className?: string }> =
    category === "cooking"
      ? IconCooking
      : category === "commute"
        ? IconCommute
        : IconDiy;
  return <Icon className={className} />;
}

export function StepTrackerModal({
  isOpen,
  onClose,
  title,
  steps,
  category,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  steps: string[];
  category: string;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [customTimerSeconds, setCustomTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-detected default seconds for current step
  const defaultStepSeconds = useMemo(() => {
    return extractStepSeconds(steps[currentStep] || "");
  }, [steps, currentStep]);

  const activeTimerSeconds = customTimerSeconds ?? defaultStepSeconds;

  const goToStep = (newStep: number) => {
    setCurrentStep(newStep);
    setCustomTimerSeconds(null);
    setTimerRunning(false);
  };

  // ── Screen WakeLock API ──────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          const sentinel = await navigator.wakeLock.request("screen");
          if (isMounted) {
            wakeLockRef.current = sentinel;
            setWakeLockActive(true);
          }
        }
      } catch {
        /* WakeLock denied or unavailable */
      }
    }

    void requestWakeLock();

    return () => {
      isMounted = false;
      try {
        wakeLockRef.current?.release();
      } catch {
        /* noop */
      }
      wakeLockRef.current = null;
      setWakeLockActive(false);
    };
  }, [isOpen]);

  // ── Audio Beep Alert (Web Audio API) ─────────────────────────────
  const playAlertSound = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      /* audio unavailable */
    }
  }, []);

  // ── Timer Countdown Logic ─────────────────────────────────────────
  useEffect(() => {
    if (timerRunning && activeTimerSeconds !== null && activeTimerSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setCustomTimerSeconds((prev) => {
          const current = prev ?? defaultStepSeconds ?? 0;
          if (current <= 1) {
            setTimerRunning(false);
            playAlertSound();
            return 0;
          }
          return current - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning, activeTimerSeconds, defaultStepSeconds, playAlertSound]);

  // Escape-to-close para sa desktop accessibility
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen || steps.length === 0) return null;

  const isCooking = category === "cooking";
  const isCommute = category === "commute";
  const modeTitle = isCooking
    ? "Cook Mode Active"
    : isCommute
      ? "Biyahe Tracker Active"
      : "Step Tracker Active";

  const toggleStepDone = (index: number) => {
    setCompletedSteps((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    (
    <div
      className="animate-fade-up fixed inset-0 z-50 flex flex-col bg-deep text-foreground"
      role="dialog"
      aria-modal="true"
      aria-label={modeTitle}
    >
      {/* Top App Bar */}
      <header className="flex items-center justify-between gap-2 border-b border-line bg-deep/80 px-4 py-3 backdrop-blur-xl backdrop-saturate-150">
        <div className="min-w-0 flex items-center gap-2.5">
          <span
            className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
              isCooking
                ? "bg-blue-500/20 text-blue-700 ring-1 ring-blue-500/40 dark:text-blue-300"
                : isCommute
                  ? "bg-sky-500/20 text-sky-700 ring-1 ring-sky-500/40 dark:text-sky-300"
                  : "bg-emerald-500/20 text-emerald-700 ring-1 ring-emerald-500/40 dark:text-emerald-300"
            }`}
          >
            <StepIcon category={category} className="h-3.5 w-3.5" />
            {modeTitle}
          </span>
          {wakeLockActive && (
            <span className="hidden items-center gap-1 text-[11px] font-semibold text-emerald-600 sm:inline-flex dark:text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Naka-on ang screen (No sleep)
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          aria-label="Isara ang step tracker"
          className="rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-bold text-body backdrop-blur transition-colors hover:bg-panel-strong hover:text-foreground active:scale-95 focus-ring"
        >
          Tapusin (Exit)
          <svg viewBox="0 0 24 24" className="ml-1 inline h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </header>

      {/* Main Large Step Viewer */}
      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col justify-start gap-6 overflow-y-auto px-4 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:gap-8 sm:px-8 sm:py-10 sm:pb-10">
        <div>
          {/* Progress Indicator */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-muted">
              HAKBANG {currentStep + 1} NG {steps.length}
            </span>
            <span className={`text-xs font-bold ${TRACK_TEXT[category] ?? "text-accent"}`}>
              {Math.round(((currentStep + 1) / steps.length) * 100)}% tapos
            </span>
          </div>

          <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-panel-strong">
            <div
              className={`h-full transition-all duration-300 ${
                TRACK_FILL[category] ?? "bg-accent"
              }`}
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <h2 className="mb-3 text-sm font-semibold text-muted">{title}</h2>

          {/* Large Step Text Card */}
          <div
            className={`min-w-0 rounded-3xl border p-4 shadow-2xl transition-all sm:p-6 lg:p-8 ${
              completedSteps[currentStep]
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-line bg-panel backdrop-blur"
            }`}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-base font-black text-accent-ink shadow-md">
                {currentStep + 1}
              </span>
              <button
                onClick={() => toggleStepDone(currentStep)}
                aria-pressed={!!completedSteps[currentStep]}
                className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all focus-ring ${
                  completedSteps[currentStep]
                    ? "bg-emerald-500 text-white"
                    : "bg-panel text-muted hover:bg-panel-strong hover:text-body"
                }`}
              >
                {completedSteps[currentStep] ? (
                  <>
                    <svg viewBox="0 0 24 24" className="mr-1 inline h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    Tapos na
                  </>
                ) : (
                  "Mark as done"
                )}
              </button>
            </div>

            <p className="max-w-prose break-words text-lg font-extrabold leading-8 text-body text-pretty sm:text-2xl sm:leading-9 lg:text-3xl lg:leading-10">
              {cleanStepText(steps[currentStep])}
            </p>
          </div>

          {/* Smart Step Timer Box */}
          {activeTimerSeconds !== null && (
            <div className="animate-slide-down mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-center gap-2.5">
                <IconTimer className="h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Step Timer</p>
                  <p className="text-2xl font-black tracking-wider text-amber-600 dark:text-amber-400">
                    {formatTimer(activeTimerSeconds)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  className={`rounded-full px-4 py-2 text-xs font-black transition-all focus-ring ${
                    timerRunning
                      ? "bg-rose-500 text-white hover:bg-rose-600"
                      : "bg-amber-500 text-white shadow-md shadow-amber-500/20 hover:bg-amber-400 dark:text-[#0A2540]"
                  }`}
                >
                  {timerRunning ? "Pause" : activeTimerSeconds === 0 ? "Ulitin" : "Simulan ang Timer"}
                </button>
                <button
                  onClick={() =>
                    setCustomTimerSeconds((prev) => ((prev ?? defaultStepSeconds ?? 0) + 60))
                  }
                  className="rounded-full border border-line bg-panel px-3 py-2 text-xs font-bold text-body backdrop-blur hover:bg-panel-strong focus-ring"
                >
                  +1 min
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Step Navigation Bar */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={() => goToStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex min-w-0 items-center justify-center gap-2 rounded-2xl border border-line bg-panel px-3 py-3 text-center text-sm font-bold leading-tight text-body backdrop-blur transition-all hover:bg-panel-strong active:scale-[0.98] focus-ring disabled:opacity-30 sm:py-4"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Naunang Hakbang
            </button>

            {currentStep === steps.length - 1 ? (
              <button
                onClick={onClose}
                className="flex min-w-0 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-3 py-3 text-center text-sm font-black leading-tight text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-400 active:scale-[0.98] focus-ring sm:py-4"
              >
                Tapos na ang Lahat!
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => goToStep(Math.min(steps.length - 1, currentStep + 1))}
                className="flex min-w-0 items-center justify-center gap-2 rounded-2xl bg-accent px-3 py-3 text-center text-sm font-black leading-tight text-accent-ink shadow-lg shadow-accent/30 transition-all hover:bg-accent-bright active:scale-[0.98] focus-ring sm:py-4"
              >
                Susunod na Hakbang
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Quick jump step dots */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToStep(idx)}
                aria-label={`Pumunta sa hakbang ${idx + 1}`}
                aria-current={idx === currentStep}
                className={`h-2.5 rounded-full transition-all focus-ring ${
                  idx === currentStep
                    ? `w-8 ${TRACK_FILL[category] ?? "bg-accent"}`
                    : completedSteps[idx]
                      ? "w-2.5 bg-emerald-500"
                      : "w-2.5 bg-panel-strong hover:bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
    ),
    document.body,
  );
}
