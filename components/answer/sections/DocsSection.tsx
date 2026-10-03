import { useMemo, useState } from "react";
import { SectionTitle } from "@/components/answer/SectionTitle";
import { CATEGORY_META } from "@/components/answer/meta";
import { IconClipboardCheck } from "@/components/icons";
import type { PaanoAnswer } from "@/lib/answers";

type DocsSpec = Extract<PaanoAnswer["category_specific"], { category: "docs" }>;

function docsChecklistKey(spec: { agency: string; requirements: string[] }): string {
  // Stable per-document scope: agency + sorted requirements signature.
  // Hindi nag-share ang state sa magkaibang dokumento.
  const sig = [...spec.requirements].sort().join("||").slice(0, 200);
  return `paano:docs-checklist:${spec.agency}:${sig}`;
}

/** Docs section — interactive "Handa na ba ako?" requirements checklist + fees. */
export function DocsSection({
  spec,
  tint,
}: {
  spec: DocsSpec;
  tint: string;
}) {
  const storageKey = useMemo(() => docsChecklistKey(spec), [spec]);

  const [checkedReqs, setCheckedReqs] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });

  const toggleReq = (r: string) => {
    setCheckedReqs((prev) => {
      const next = { ...prev, [r]: !prev[r] };
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  };

  const onReqKey = (r: string) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleReq(r);
    }
  };

  const resetChecklist = () => {
    setCheckedReqs({});
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* storage unavailable */
    }
  };

  const totalReqs = spec.requirements.length;
  const checkedCount = Object.values(checkedReqs).filter(Boolean).length;
  const isAllReady = totalReqs > 0 && checkedCount === totalReqs;

  return (
    <div className={`space-y-3 rounded-xl border p-2.5 sm:p-3.5 ${tint} ${CATEGORY_META.docs.border}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="max-w-full break-words rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase text-blue-700 dark:text-blue-300">
          Ahensya: {spec.agency}
        </span>
        {spec.last_verified && (
          <span className="shrink-0 text-[11px] text-muted">Na-verify: {spec.last_verified}</span>
        )}
      </div>

      {/* Interactive requirements checklist */}
      {totalReqs > 0 && (
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <SectionTitle className="mb-0 mt-0 flex items-center gap-1.5">
              <IconClipboardCheck className="h-3.5 w-3.5" />
              Checklist: Handa na ba ako?
            </SectionTitle>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                isAllReady
                  ? "bg-emerald-500 text-white"
                  : "bg-blue-500/20 text-blue-700 dark:text-blue-300"
              }`}
            >
              {checkedCount} of {totalReqs} Handa
            </span>
          </div>

          <div
            className="mb-2.5 h-1.5 w-full overflow-hidden rounded-full bg-panel-strong"
            role="progressbar"
            aria-valuenow={checkedCount}
            aria-valuemin={0}
            aria-valuemax={totalReqs}
            aria-label="Progress ng requirements checklist"
          >
            <div
              className={`h-full transition-all duration-300 ${
                isAllReady ? "bg-emerald-500" : "bg-blue-500"
              }`}
              style={{ width: `${(checkedCount / totalReqs) * 100}%` }}
            />
          </div>

          {isAllReady ? (
            <div className="animate-slide-down mb-3 flex items-start gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-xs text-emerald-800 dark:text-emerald-300">
              <IconClipboardCheck className="mt-px h-4 w-4 shrink-0" />
              <span>
                <span className="font-bold">Kumpleto na ang requirements mo!</span> Pwede ka
                nang magtungo sa ahensya o mag-book ng appointment.
              </span>
            </div>
          ) : (
            <p className="mb-2 text-[11px] text-muted">
              I-check ang mga dokumentong hawak mo na para malaman kung ano pa ang kulang:
            </p>
          )}

          <ul className="space-y-1.5 text-xs text-body">
            {spec.requirements.map((r, i) => {
              const isChecked = !!checkedReqs[r];
              return (
                <li
                  key={i}
                  role="checkbox"
                  aria-checked={isChecked}
                  tabIndex={0}
                  onClick={() => toggleReq(r)}
                  onKeyDown={onReqKey(r)}
                  aria-label={`${isChecked ? "Handa na" : "Wala pa"}: ${r}`}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-2 transition-all ${
                    isChecked
                      ? "border-emerald-500/40 bg-emerald-500/10 text-muted"
                      : "border-line bg-panel backdrop-blur hover:bg-panel-strong text-body"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      isChecked ? "border-emerald-500 bg-emerald-500 text-white" : "border-line-strong bg-deep"
                    }`}
                    aria-hidden
                  >
                    {isChecked ? (
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </span>
                  <span className={isChecked ? "line-through" : ""}>{r}</span>
                </li>
              );
            })}
          </ul>

          {checkedCount > 0 && (
            <button
              onClick={resetChecklist}
              className="mt-2 text-[11px] font-semibold text-muted underline hover:text-body focus-ring"
            >
              I-reset ang checklist
            </button>
          )}

          <p className="mt-2 text-[11px] italic text-muted">
            Tandaan: maaaring magbago ang mga requirements at bayarin. I-verify sa opisyal na
            ahensya bago magtungo.
          </p>
        </div>
      )}

      {spec.fees.length > 0 && (
        <div className="mt-3">
          <SectionTitle>Bayarin (Official Fees)</SectionTitle>
          <dl className="space-y-1 text-xs">
            {spec.fees.map((f, i) => (
              <div key={i} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2 border-b border-line pb-1">
                <dt className="min-w-0 break-words text-body">{f.item}</dt>
                <dd className="max-w-[45%] break-words text-right font-bold text-blue-700 dark:text-blue-300">{f.amount}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
