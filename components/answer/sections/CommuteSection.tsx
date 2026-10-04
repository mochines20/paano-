"use client";

import { useState } from "react";
import { CATEGORY_META, MODE_LABELS } from "@/components/answer/meta";
import type { PaanoAnswer } from "@/lib/answers";
import type { AnswerProvenance } from "@/lib/answers";
import { IconCommute } from "@/components/icons";
import { cleanStepText } from "@/components/answer/formatStepText";
import { CommuteRouteMap } from "@/components/answer/sections/CommuteRouteMap";

type CommuteSpec = Extract<
  PaanoAnswer["category_specific"],
  { category: "commute" }
>;

/** Commute section — overview badges + transit timeline na may stops. */
export function CommuteSection({
  spec,
  steps,
  tint,
  provenance,
}: {
  spec: CommuteSpec;
  steps: string[];
  tint: string;
  provenance?: AnswerProvenance | null;
}) {
  const [view, setView] = useState<"route" | "timeline">("route");
  const destinationNote =
    spec.destination_note ??
    (/\bvtx\b|starmall\s+alabang|alabang/i.test(spec.destination)
      ? "Confirm exact VTX Alabang drop-off point with the driver/operator; nearby Alabang stops may use different names."
      : null);

  return (
    <div className="space-y-3">
      {/* Overview badges */}
      <div className={`rounded-xl border p-2.5 sm:p-3 ${tint} ${CATEGORY_META.commute.border}`}>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {spec.modes.map((m) => (
            <span
              key={m}
              className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800 dark:text-sky-200"
            >
              {MODE_LABELS[m] ?? m}
            </span>
          ))}
        </div>
        {spec.route_names.length > 0 && (
          <p className="mb-2.5 text-xs font-semibold text-sky-700 dark:text-sky-300">
            Ruta: {spec.route_names.join(" · ")}
          </p>
        )}
        <dl className="grid grid-cols-1 gap-2 text-sm min-[360px]:grid-cols-2">
          <div className="min-w-0 rounded-xl border border-sky-500/10 bg-deep/40 p-2 backdrop-blur sm:p-2.5">
            <dt className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Oras ng Byahe
            </dt>
            <dd className="break-words text-base font-extrabold text-sky-800 dark:text-sky-200">
              ~{spec.time_range.min}–{spec.time_range.max} min
            </dd>
          </div>
          <div className="min-w-0 rounded-xl border border-sky-500/10 bg-deep/40 p-2 backdrop-blur sm:p-2.5">
            <dt className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Pamasahe (Est.)
            </dt>
            <dd className="break-words text-base font-extrabold text-emerald-700 dark:text-emerald-300">
              {spec.fare_range.min === spec.fare_range.max
                ? `₱${spec.fare_range.min}`
                : `₱${spec.fare_range.min}–₱${spec.fare_range.max}`}
            </dd>
          </div>
        </dl>
        {spec.fare_notes && <p className="mt-2 text-xs text-muted">{spec.fare_notes}</p>}

        <div className="mt-3 rounded-xl border border-line bg-panel px-3 py-2.5 text-[11px] leading-relaxed text-muted">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-extrabold uppercase tracking-wider text-body">Source</span>
            <span className="min-w-0 break-words">
              {provenance?.label ?? "Commute source registry (unverified)"}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-extrabold uppercase tracking-wider text-body">As of</span>
            <span>{provenance?.asOf ?? "Hindi pa verified"}</span>
          </div>
          {provenance?.note && <p className="mt-1">{provenance.note}</p>}
          {provenance?.url && (
            <a
              href={provenance.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block font-bold text-accent underline decoration-accent/40 underline-offset-2 hover:text-accent-bright"
            >
              Buksan ang source ↗
            </a>
          )}
        </div>

        {destinationNote && (
          <div className="mt-3 flex gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-900 dark:text-amber-100">
            <span aria-hidden className="mt-0.5 shrink-0 font-black">!</span>
            <p>
              <strong>Confirm destination:</strong> {destinationNote}
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-line bg-deep/20 p-1.5" role="tablist" aria-label="Commute views">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            role="tab"
            aria-selected={view === "route"}
            onClick={() => setView("route")}
            className={`rounded-lg px-2.5 py-2 text-xs font-extrabold transition-colors focus-ring ${
              view === "route"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-muted hover:bg-panel hover:text-body"
            }`}
          >
            Route map / tracker
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "timeline"}
            onClick={() => setView("timeline")}
            className={`rounded-lg px-2.5 py-2 text-xs font-extrabold transition-colors focus-ring ${
              view === "timeline"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-muted hover:bg-panel hover:text-body"
            }`}
          >
            Transit timeline
          </button>
        </div>
      </div>

      {view === "route" && (
        <CommuteRouteMap
          origin={spec.origin}
          destination={spec.destination}
          steps={steps}
        />
      )}

      {/* Interactive visual transit timeline */}
      {view === "timeline" && steps.length > 0 && (
        <div className="mt-4 rounded-xl border border-line bg-deep/30 p-3 backdrop-blur sm:p-4">
          <h4 className="mb-3 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            <IconCommute className="h-3.5 w-3.5" />
            Hakbang sa Biyahe (Transit Route Timeline)
          </h4>

          <div className="relative space-y-4 pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-3 before:w-0.5 before:bg-sky-500">
            {steps.map((step, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === steps.length - 1;
              const displayStep = cleanStepText(step);

              return (
                <div
                  key={idx}
                  className="animate-fade-up relative"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <span
                    className={`absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ring-4 ring-deep ${
                      isFirst
                        ? "bg-sky-500 text-white"
                        : isLast
                          ? "bg-emerald-500 text-white"
                          : "bg-panel text-sky-700 dark:text-sky-300"
                    }`}
                    aria-hidden
                  >
                    {isLast ? "✓" : idx + 1}
                  </span>

                  <div className="rounded-xl border border-line bg-panel p-2.5 backdrop-blur transition-colors hover:border-sky-500/30 sm:p-3">
                    <p className="text-xs font-medium leading-relaxed text-body sm:text-sm">
                      {displayStep}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
