"use client";

import { useEffect, useRef, useState } from "react";
import { answerHash } from "@/lib/feedback";
import { answerToText } from "@/lib/answers";
import type { PaanoAnswer } from "@/lib/answers";

/**
 * AnswerCard — structured answer display, ibang layout per category.
 * Ito ang nagpaparamdam na tool ang PAANO, hindi chat log.
 */

const CATEGORY_META: Record<
  PaanoAnswer["category"],
  { label: string; badge: string; border: string; bar: string; tint: string }
> = {
  cooking: { label: "Lutong Bahay", badge: "bg-amber-500/15 text-amber-300 ring-amber-500/30", border: "border-amber-500/30", bar: "from-amber-500 to-orange-400", tint: "bg-amber-500/10" },
  commute: { label: "Commute", badge: "bg-sky-500/15 text-sky-300 ring-sky-500/30", border: "border-sky-500/30", bar: "from-sky-500 to-cyan-400", tint: "bg-sky-500/10" },
  diy: { label: "Gawa-Bahay", badge: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30", border: "border-emerald-500/30", bar: "from-emerald-500 to-green-400", tint: "bg-emerald-500/10" },
  first_aid: { label: "First Aid", badge: "bg-rose-500/15 text-rose-300 ring-rose-500/30", border: "border-rose-500/30", bar: "from-rose-500 to-red-400", tint: "bg-rose-500/10" },
  docs: { label: "Docs Guide", badge: "bg-indigo-500/15 text-indigo-300 ring-indigo-500/30", border: "border-indigo-500/30", bar: "from-indigo-500 to-violet-400", tint: "bg-indigo-500/10" },
  generic: { label: "PAANO", badge: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30", border: "border-zinc-500/30", bar: "from-zinc-500 to-zinc-400", tint: "bg-zinc-500/10" },
};

const MODE_LABELS: Record<string, string> = {
  jeepney: "Jeep",
  bus: "Bus",
  lrt: "LRT",
  mrt: "MRT",
  tricycle: "Tricycle",
  uv: "UV",
  ferry: "Ferry",
  walk: "Lakad",
};

const CONFIDENCE_LABEL: Record<PaanoAnswer["confidence"], string> = {
  high: "Mataas ang kumpiyansa",
  medium: "Medyo sigurado — i-verify kung kailangan",
  low: "Hindi sigurado — magtanong sa opisyal na source",
};

export function AnswerCard({ answer }: { answer: PaanoAnswer }) {
  const meta = CATEGORY_META[answer.category];
  const spec = answer.category_specific;
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<boolean | null>(null);
  const [correction, setCorrection] = useState("");
  const [showCorrection, setShowCorrection] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [flagCount, setFlagCount] = useState(0);
  const hash = useRef(answerHash(answer));

  // Community flags: may nagsabing i-verify ba ang sagot na ito?
  useEffect(() => {
    let alive = true;
    fetch(`/api/feedback?hash=${encodeURIComponent(hash.current)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d && typeof d.count === "number") setFlagCount(d.count);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(answerToText(answer));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* hindi available ang clipboard — huwag mag-crash */
    }
  }

  async function submitFeedback(helpful: boolean) {
    setVote(helpful);
    if (helpful) {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerHash: hash.current, helpful: true }),
      });
      setFeedbackDone(true);
    } else {
      setShowCorrection(true);
    }
  }

  async function submitCorrection() {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answerHash: hash.current,
        helpful: false,
        correction: correction.trim() || null,
      }),
    });
    setFeedbackDone(true);
    setShowCorrection(false);
  }

  return (
    <article className={`animate-fade-up overflow-hidden rounded-2xl border bg-zinc-900/70 shadow-md backdrop-blur ${meta.border}`}>
      <div aria-hidden className={`h-1 w-full bg-gradient-to-r ${meta.bar}`} />
      <div className="p-4">
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span
              className={`mb-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${meta.badge}`}
            >
              {meta.label}
            </span>
            <h3 className="text-balance text-lg font-bold leading-snug text-white">
              {answer.title}
            </h3>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <ConfidenceBadge confidence={answer.confidence} />
            <button
              onClick={() => void copyAnswer()}
              title="Kopyahin ang sagot"
              aria-label="Kopyahin ang sagot"
              className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-400 transition-all duration-150 hover:bg-zinc-700 hover:text-zinc-200 active:scale-95 focus-ring"
            >
              {copied ? (
                <>
                  <svg className="h-3 w-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path className="check-draw" d="M5 13l4 4L19 7" />
                  </svg>
                  Kopyado!
                </>
              ) : (
                "Kopyahin"
              )}
            </button>
          </div>
        </header>

        {answer.summary && (
          <p className="mb-3 text-sm leading-relaxed text-zinc-300">
            {answer.summary}
          </p>
        )}

        {spec?.category === "commute" && <CommuteSection spec={spec} tint={meta.tint} />}
        {spec?.category === "cooking" && <CookingSection spec={spec} tint={meta.tint} border={meta.border} />}
        {spec?.category === "diy" && <DiySection spec={spec} tint={meta.tint} />}
        {spec?.category === "first_aid" && <FirstAidSection spec={spec} tint={meta.tint} />}
        {spec?.category === "docs" && <DocsSection spec={spec} tint={meta.tint} />}
        {spec?.category === "generic" && spec.note && (
          <p className="mb-3 text-sm italic text-zinc-400">{spec.note}</p>
        )}

        {answer.steps.length > 0 && <StepsList steps={answer.steps} />}

        {answer.disclaimer && (
          <p className={`mt-3 rounded-xl border px-3 py-2 text-xs leading-relaxed text-amber-200 ${meta.tint} ${meta.border}`}>
            {answer.disclaimer}
          </p>
        )}

        {answer.official_link && (
          <a
            href={answer.official_link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-orange-300 transition-colors hover:text-orange-200"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            {answer.official_link.label}
          </a>
        )}

        {flagCount > 0 && (
          <p className="mt-3 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs font-medium text-orange-200">
            May {flagCount} nagsabing i-verify ang sagot na ito — may correction
            ang komunidad. I-double check bago kumilos.
          </p>
        )}

        <CommunityFeedback
          vote={vote}
          showCorrection={showCorrection}
          correction={correction}
          feedbackDone={feedbackDone}
          onVote={(v) => void submitFeedback(v)}
          onCorrectionChange={setCorrection}
          onCorrectionSubmit={() => void submitCorrection()}
          onCancelCorrection={() => {
            setShowCorrection(false);
            setVote(null);
          }}
        />
      </div>
    </article>
  );
}

function CommunityFeedback({
  vote,
  showCorrection,
  correction,
  feedbackDone,
  onVote,
  onCorrectionChange,
  onCorrectionSubmit,
  onCancelCorrection,
}: {
  vote: boolean | null;
  showCorrection: boolean;
  correction: string;
  feedbackDone: boolean;
  onVote: (v: boolean) => void;
  onCorrectionChange: (v: string) => void;
  onCorrectionSubmit: () => void;
  onCancelCorrection: () => void;
}) {
  if (feedbackDone) {
    return (
      <p className="animate-pop mt-3 text-xs font-medium text-emerald-400">
        Salamat! Nakatulong ang feedback mo sa komunidad.
      </p>
    );
  }

  return (
    <div className="mt-4 border-t border-zinc-800 pt-3">
      {showCorrection ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-400">
            Ano ang dapat itama? (makakatulong ito sa iba)
          </p>
          <textarea
            value={correction}
            onChange={(e) => onCorrectionChange(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Hal. 'mas tama ang ₱26 na pamasahe ngayon'"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-orange-500"
          />
          <div className="flex gap-2">
            <button
              onClick={onCorrectionSubmit}
              className="rounded-full bg-orange-500 px-3 py-1.5 text-xs font-bold text-zinc-950 transition-all duration-150 hover:bg-orange-400 active:scale-95 focus-ring"
            >
              Ipadala
            </button>
            <button
              onClick={onCancelCorrection}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200 focus-ring"
            >
              Kanselahin
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <span className="mr-1">Nakatulong ba ito?</span>
          <button
            onClick={() => onVote(true)}
            aria-label="Oo, nakatulong"
            className={`rounded-full px-2.5 py-1 font-semibold transition-all duration-150 active:scale-90 focus-ring ${
              vote === true
                ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Oo
          </button>
          <button
            onClick={() => onVote(false)}
            aria-label="Hindi nakatulong"
            className={`rounded-full px-2.5 py-1 font-semibold transition-all duration-150 active:scale-90 focus-ring ${
              vote === false
                ? "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/40"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Hindi
          </button>
        </div>
      )}
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: PaanoAnswer["confidence"] }) {
  const dot =
    confidence === "high"
      ? "bg-green-500"
      : confidence === "medium"
        ? "bg-amber-500"
        : "bg-rose-500";
  return (
    <span
      className="flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-400"
      title={CONFIDENCE_LABEL[confidence]}
    >
      <span className={`animate-pulse-dot h-1.5 w-1.5 rounded-full ${dot}`} />
      {confidence === "high" ? "Verified" : confidence === "medium" ? "Tantiya" : "I-verify"}
    </span>
  );
}

function StepsList({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-4 space-y-2 border-t border-zinc-800 pt-4">
      {steps.map((step, i) => (
        <li
          key={i}
          className="animate-fade-up flex gap-2.5 text-sm leading-relaxed text-zinc-200"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-white transition-transform duration-150 hover:scale-110">
            {i + 1}
          </span>
          <span className="text-balance">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
      {children}
    </h4>
  );
}

function CommuteSection({ spec, tint }: { spec: Extract<PaanoAnswer["category_specific"], { category: "commute" }>; tint: string }) {
  return (
    <div className={`rounded-xl border p-3 ${tint} ${CATEGORY_META.commute.border}`}>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {spec.modes.map((m) => (
          <span
            key={m}
            className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[11px] font-semibold text-sky-200"
          >
            {MODE_LABELS[m] ?? m}
          </span>
        ))}
      </div>
      {spec.route_names.length > 0 && (
        <p className="mb-2 text-xs font-medium text-zinc-300">
          Sakay: {spec.route_names.join(" · ")}
        </p>
      )}
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-zinc-950/50 p-2.5">
          <dt className="text-[10px] font-semibold uppercase text-zinc-500">Byahe</dt>
          <dd className="font-bold text-zinc-100">
            ~{spec.time_range.min}–{spec.time_range.max} min
          </dd>
        </div>
        <div className="rounded-xl bg-zinc-950/50 p-2.5">
          <dt className="text-[10px] font-semibold uppercase text-zinc-500">Pamasahe</dt>
          <dd className="font-bold text-zinc-100">
            {spec.fare_range.min === spec.fare_range.max
              ? `₱${spec.fare_range.min}`
              : `₱${spec.fare_range.min}–₱${spec.fare_range.max}`}
          </dd>
        </div>
      </dl>
      {spec.fare_notes && (
        <p className="mt-2 text-xs text-zinc-400">{spec.fare_notes}</p>
      )}
    </div>
  );
}

function CookingSection({ spec, tint, border }: { spec: Extract<PaanoAnswer["category_specific"], { category: "cooking" }>; tint: string; border: string }) {
  return (
    <>
      <SectionTitle>Sangkap {spec.servings && <span className="normal-case">· para sa {spec.servings}</span>}</SectionTitle>
      <ul className={`space-y-1.5 rounded-xl border p-3 text-sm text-zinc-200 ${tint} ${border}`}>
        {spec.ingredients.map((ing, i) => (
          <li key={i} className="flex justify-between gap-3 border-b border-dashed border-zinc-700/60 pb-1.5 last:border-0 last:pb-0">
            <span>{ing.item}</span>
            {ing.amount && <span className="shrink-0 font-medium text-zinc-400">{ing.amount}</span>}
          </li>
        ))}
      </ul>
      {spec.tips.length > 0 && (
        <>
          <SectionTitle>Tips</SectionTitle>
          <ul className="space-y-1 text-sm text-zinc-300">
            {spec.tips.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                <span className="text-balance">{t}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function DiySection({ spec, tint }: { spec: Extract<PaanoAnswer["category_specific"], { category: "diy" }>; tint: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {spec.tools.length > 0 && (
        <div className={`rounded-xl border p-3 ${tint} ${CATEGORY_META.diy.border}`}>
          <SectionTitle>Mga Kailangan (Tools)</SectionTitle>
          <ul className="space-y-1 text-sm text-zinc-200">
            {spec.tools.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                <span className="text-balance">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {spec.materials.length > 0 && (
        <div className={`rounded-xl border p-3 ${tint} ${CATEGORY_META.diy.border}`}>
          <SectionTitle>Materials</SectionTitle>
          <ul className="space-y-1 text-sm text-zinc-200">
            {spec.materials.map((m, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                <span className="text-balance">{m}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {spec.safety_warning && (
        <p className="sm:col-span-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200">
          {spec.safety_warning}
        </p>
      )}
    </div>
  );
}

function FirstAidSection({ spec, tint }: { spec: Extract<PaanoAnswer["category_specific"], { category: "first_aid" }>; tint: string }) {
  return (
    <div className={`rounded-xl border p-3 ${tint} ${CATEGORY_META.first_aid.border}`}>
      <div className="grid gap-3 sm:grid-cols-2">
        {spec.do_list.length > 0 && (
          <div>
            <h4 className="mb-1 text-xs font-bold uppercase text-rose-300">Gawin</h4>
            <ul className="space-y-1 text-sm text-zinc-200">
              {spec.do_list.map((d, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                  <span className="text-balance">{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {spec.don_t_list.length > 0 && (
          <div>
            <h4 className="mb-1 text-xs font-bold uppercase text-rose-300">Huwag</h4>
            <ul className="space-y-1 text-sm text-zinc-200">
              {spec.don_t_list.map((d, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-rose-500" />
                  <span className="text-balance">{d}</span>
              </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {spec.see_doctor_threshold && (
        <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-100">
          Pumunta sa doktor kung: {spec.see_doctor_threshold}
        </p>
      )}
    </div>
  );
}

function DocsSection({ spec, tint }: { spec: Extract<PaanoAnswer["category_specific"], { category: "docs" }>; tint: string }) {
  return (
    <>
      {spec.prerequisites.length > 0 && (
        <div className={`mb-3 rounded-xl border p-3 ${tint} ${CATEGORY_META.docs.border}`}>
          <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-indigo-300">
            Kailangan mo munang makuha
          </h4>
          <ul className="space-y-1 text-sm text-zinc-200">
            {spec.prerequisites.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-indigo-500" />
                <span className="text-balance">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {spec.alerts.length > 0 && (
        <div className="mb-3 space-y-2">
          {spec.alerts.map((a, i) => (
            <p key={i} className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-200">
              {a}
            </p>
          ))}
        </div>
      )}
      <SectionTitle>Requirements</SectionTitle>
      <ul className="space-y-1 text-sm text-zinc-200">
        {spec.requirements.map((r, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-indigo-500" />
            <span className="text-balance">{r}</span>
          </li>
        ))}
      </ul>
      {spec.fees.length > 0 && (
        <>
          <SectionTitle>Bayarin (maaaring magbago)</SectionTitle>
          <ul className="space-y-1 text-sm text-zinc-200">
            {spec.fees.map((f, i) => (
              <li key={i} className="flex justify-between gap-3 border-b border-dashed border-zinc-700/60 pb-1.5 last:border-0 last:pb-0">
                <span className="text-balance">{f.item}</span>
                <span className="shrink-0 font-medium text-zinc-400">{f.amount}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {(spec.processing_time || spec.last_verified) && (
        <p className="mt-2 text-xs text-zinc-500">
          {spec.processing_time && <>Processing: {spec.processing_time}. </>}
          Huling nabe-verify: {spec.last_verified}
        </p>
      )}
    </>
  );
}
