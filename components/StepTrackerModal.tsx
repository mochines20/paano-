"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";

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
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  if (!isOpen || steps.length === 0) return null;

  const isCooking = category === "cooking";
  const isCommute = category === "commute";
  const modeTitle = isCooking
    ? "👨‍🍳 Cook Mode Active"
    : isCommute
    ? "🚌 Biyahe Tracker Active"
    : "🛠️ Step Tracker Active";

  const toggleStepDone = (index: number) => {
    setCompletedSteps((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#021B30] text-white animate-fade-up">
      {/* Top App Bar */}
      <header className="flex items-center justify-between border-b border-white/10 bg-[#021B30]/80 px-4 py-3 backdrop-blur-xl backdrop-saturate-150">
        <div className="flex items-center gap-2.5">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              isCooking
                ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40"
                : isCommute
                ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/40"
                : "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
            }`}
          >
            {modeTitle}
          </span>
          {wakeLockActive && (
            <span className="hidden items-center gap-1 text-[10px] font-semibold text-emerald-400 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Naka-on ang screen (No sleep)
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          aria-label="Isara ang step tracker"
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 backdrop-blur hover:bg-white/10 hover:text-white transition-colors active:scale-95 focus-ring"
        >
          Tapusin (Exit) ✕
        </button>
      </header>

      {/* Main Large Step Viewer */}
      <main className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-6 sm:px-8 sm:py-10 max-w-3xl mx-auto w-full">
        <div>
          {/* Progress Indicator */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">
              HAKBANG {currentStep + 1} NG {steps.length}
            </span>
            <span className="text-xs font-bold text-orange-400">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% tapos
            </span>
          </div>

          <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full transition-all duration-300 ${
                isCooking
                  ? "bg-amber-500"
                  : isCommute
                  ? "bg-sky-500"
                  : "bg-orange-500"
              }`}
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <h2 className="mb-3 text-sm font-semibold text-zinc-400">{title}</h2>

          {/* Large Step Text Card */}
          <div
            className={`rounded-3xl border p-6 sm:p-8 shadow-2xl transition-all ${
              completedSteps[currentStep]
                ? "border-emerald-500/40 bg-emerald-950/20"
                : "border-white/10 bg-white/5 backdrop-blur"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FBE77A] text-base font-black text-[#0A2540] shadow-md">
                {currentStep + 1}
              </span>
              <button
                onClick={() => toggleStepDone(currentStep)}
                className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all ${
                  completedSteps[currentStep]
                    ? "bg-emerald-500 text-[#0A2540]"
                    : "bg-white/5 text-slate-400 hover:text-slate-200"
                }`}
              >
                {completedSteps[currentStep] ? "✓ Tapos na" : "Mark as done"}
              </button>
            </div>

            <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold leading-snug text-zinc-100 text-balance">
              {steps[currentStep]}
            </p>
          </div>

          {/* Smart Step Timer Box */}
          {activeTimerSeconds !== null && (
            <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-wrap items-center justify-between gap-3 animate-slide-down">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">⏱️</span>
                <div>
                  <p className="text-xs font-bold text-amber-300">Step Cooking / Transit Timer</p>
                  <p className="text-2xl font-black text-amber-400 tracking-wider">
                    {formatTimer(activeTimerSeconds)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  className={`rounded-full px-4 py-2 text-xs font-black transition-all ${
                    timerRunning
                      ? "bg-rose-500 text-white hover:bg-rose-600"
                      : "bg-amber-500 text-[#0A2540] hover:bg-amber-400 shadow-md shadow-amber-500/20"
                  }`}
                >
                  {timerRunning ? "Pause" : activeTimerSeconds === 0 ? "Ulitin" : "Simulan ang Timer"}
                </button>
                <button
                  onClick={() =>
                    setCustomTimerSeconds((prev) => ((prev ?? defaultStepSeconds ?? 0) + 60))
                  }
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 backdrop-blur hover:bg-white/10"
                >
                  +1 min
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Step Navigation Bar */}
        <div className="mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => goToStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-4 text-sm font-bold text-slate-300 backdrop-blur transition-all hover:bg-white/10 disabled:opacity-30 active:scale-98"
            >
              ← Naunang Hakbang
            </button>

            {currentStep === steps.length - 1 ? (
              <button
                onClick={onClose}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-black text-[#0A2540] shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-400 active:scale-98"
              >
                Tapos na ang Lahat! ✓
              </button>
            ) : (
              <button
                onClick={() => goToStep(Math.min(steps.length - 1, currentStep + 1))}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#FBE77A] py-4 text-sm font-black text-[#0A2540] shadow-lg shadow-[#FBE77A]/30 transition-all hover:bg-[#FFE98A] active:scale-98"
              >
                Susunod na Hakbang →
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
                className={`h-2.5 rounded-full transition-all ${
                  idx === currentStep
                    ? "w-8 bg-orange-500"
                    : completedSteps[idx]
                    ? "w-2.5 bg-emerald-500"
                    : "w-2.5 bg-white/10 hover:bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
