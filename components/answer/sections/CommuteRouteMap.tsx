"use client";

import { useMemo, useRef, useState } from "react";
import { IconCommute } from "@/components/icons";
import { cleanStepText } from "@/components/answer/formatStepText";

interface RoutePoint {
  label: string;
  kind: "Simula" | "Biyahe" | "Transfer" | "Destinasyon";
}

function labelFromStep(step: string, index: number): string {
  const cleaned = cleanStepText(step)
    .replace(/^\d+[.)]\s*/, "")
    .trim();
  const heading = cleaned.match(/^(.{2,64}?)(?::|\s+[—–-]\s+)/);
  return (heading?.[1] ?? cleaned).trim() || `Hakbang ${index + 1}`;
}

export function buildRoutePoints(
  origin: string,
  destination: string,
  steps: string[],
): RoutePoint[] {
  const stepPoints = steps.map((step, index) => ({
    label: labelFromStep(step, index),
    kind: /transfer|lipat|mag-transfer|pagbaba/i.test(step)
      ? ("Transfer" as const)
      : ("Biyahe" as const),
  }));
  const points: RoutePoint[] = [];
  const start = origin.trim() && origin !== "?" ? origin.trim() : "Simula ng biyahe";
  const end = destination.trim() && destination !== "?" ? destination.trim() : "Destinasyon";

  if (stepPoints.length > 0) {
    points.push({ label: start, kind: "Simula" });
    points.push(...stepPoints);
    points.push({ label: end, kind: "Destinasyon" });
  } else {
    points.push({ label: start, kind: "Simula" }, { label: end, kind: "Destinasyon" });
  }

  return points.filter((point, index) => index === 0 || point.label !== points[index - 1]?.label);
}

export function CommuteRouteMap({
  origin,
  destination,
  steps,
}: {
  origin: string;
  destination: string;
  steps: string[];
}) {
  const points = useMemo(() => buildRoutePoints(origin, destination, steps), [origin, destination, steps]);
  const [currentPoint, setCurrentPoint] = useState(0);
  const lastPoint = points.length - 1;
  const activePoint = Math.min(currentPoint, Math.max(lastPoint, 0));
  const progress = lastPoint > 0 ? Math.round((activePoint / lastPoint) * 100) : 0;
  const nextPoint = points[Math.min(activePoint + 1, lastPoint)];
  const pointRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=transit`;

  const jumpToCurrentPoint = () => {
    pointRefs.current[activePoint]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  };

  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-xl border border-sky-500/30 bg-sky-500/5 p-3 sm:p-4" aria-label="Route map at tracker">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-sky-700 dark:text-sky-300">
            <IconCommute className="h-3.5 w-3.5" />
            Route map at tracker
          </h4>
          <p className="mt-1 text-xs text-muted">I-tap ang bawat point habang umaandar ang biyahe.</p>
        </div>
        <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-[10px] font-bold text-sky-700 dark:text-sky-300">
          Manual tracker
        </span>
      </div>

      <div className="mt-3 rounded-xl border border-line bg-deep/40 p-3">
        <div className="sticky top-2 z-10 -mx-1 rounded-lg border border-line bg-panel px-2.5 py-2 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-muted">
            <span className="min-w-0 truncate">
              Nasa: <span className="text-body">{points[activePoint]?.label}</span>
            </span>
            <span className="shrink-0">Step {activePoint + 1}/{lastPoint + 1} · {progress}%</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-panel-strong">
              <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <button
              type="button"
              onClick={jumpToCurrentPoint}
              className="shrink-0 rounded-full border border-line px-2 py-1 text-[10px] font-extrabold text-body hover:bg-panel-strong focus-ring"
            >
              Jump to current step
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto pb-2" aria-label="Scrollable route points">
          <div className="flex min-w-max items-start px-2">
            {points.map((point, index) => {
              const done = index <= activePoint;
              const active = index === activePoint;
              return (
                <div key={`${point.label}-${index}`} className="flex items-start">
                  <button
                    type="button"
                    onClick={() => setCurrentPoint(index)}
                    ref={(element) => {
                      pointRefs.current[index] = element;
                    }}
                    aria-label={`Itakda ang lokasyon sa ${point.label}`}
                    aria-current={active ? "step" : undefined}
                    title={point.label}
                    className="flex w-36 flex-col items-center gap-1.5 text-center focus-ring sm:w-40"
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-black transition-colors ${
                      active
                        ? "border-sky-300 bg-sky-500 text-white"
                        : done
                          ? "border-emerald-300 bg-emerald-500 text-white"
                          : "border-line-strong bg-panel text-muted"
                    }`}>
                      {done && !active ? "✓" : index + 1}
                    </span>
                    <span className={`max-w-36 whitespace-normal break-words text-[11px] font-bold leading-snug sm:max-w-40 ${active ? "text-sky-700 dark:text-sky-300" : "text-body"}`}>
                      {point.label}
                    </span>
                    <span className="text-[10px] text-muted">{active ? "Ikaw ay narito" : point.kind}</span>
                  </button>
                  {index < lastPoint && (
                    <span className={`mt-4 h-0.5 w-6 shrink-0 sm:w-10 ${index < activePoint ? "bg-emerald-500" : "bg-panel-strong"}`} aria-hidden />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setCurrentPoint(Math.min(activePoint + 1, lastPoint))}
          disabled={activePoint >= lastPoint}
          className="rounded-full bg-sky-500 px-3 py-2 text-xs font-black text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {activePoint >= lastPoint ? "Nakarating na" : `Naabot na: ${nextPoint?.label ?? "susunod na point"}`}
        </button>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-line bg-panel px-3 py-2 text-xs font-bold text-body transition-colors hover:bg-panel-strong"
        >
          Buksan sa Google Maps ↗
        </a>
      </div>
      <p className="mt-2 text-[10px] text-muted">Manual progress ito. Para sa live GPS location at traffic, gamitin ang Google Maps link.</p>
    </section>
  );
}
