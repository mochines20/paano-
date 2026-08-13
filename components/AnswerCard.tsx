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
  { label: string; badge: string; accent: string; bar: string }
> = {
  cooking: { label: "Lutong Bahay", badge: "bg-amber-100 text-amber-800", accent: "border-amber-300", bar: "bg-gradient-to-r from-amber-500 to-orange-400" },
  commute: { label: "Commute", badge: "bg-sky-100 text-sky-800", accent: "border-sky-300", bar: "bg-gradient-to-r from-sky-500 to-cyan-400" },
  diy: { label: "Gawa-Bahay", badge: "bg-emerald-100 text-emerald-800", accent: "border-emerald-300", bar: "bg-gradient-to-r from-emerald-500 to-green-400" },
  first_aid: { label: "First Aid", badge: "bg-rose-100 text-rose-800", accent: "border-rose-300", bar: "bg-gradient-to-r from-rose-500 to-red-400" },
  docs: { label: "Docs Guide", badge: "bg-indigo-100 text-indigo-800", accent: "border-indigo-300", bar: "bg-gradient-to-r from-indigo-500 to-violet-400" },
  generic: { label: "PAANO", badge: "bg-zinc-100 text-zinc-700", accent: "border-zinc-300", bar: "bg-gradient-to-r from-zinc-500 to-zinc-400" },
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
      setTimeout(() => setCopied(false), 1500);
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
    <article
      className={`animate-fade-up overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${meta.accent} dark:bg-zinc-900`}
    >
      <div aria-hidden className={`-mx-4 -mt-4 mb-3 h-1 ${meta.bar}`} />
      <header className="mb-2 flex items-start justify-between gap-2">
        <div>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${meta.badge}`}
          >
            {meta.label}
          </span>
          <h3 className="mt-1.5 text-lg font-bold leading-snug text-zinc-900 dark:text-zinc-100">
            {answer.title}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <ConfidenceBadge confidence={answer.confidence} />
          <button
            onClick={() => void copyAnswer()}
            title="Kopyahin ang sagot"
            aria-label="Kopyahin ang sagot"
            className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-medium text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
          >
            {copied ? "Kopyado!" : "Kopyahin"}
          </button>
        </div>
      </header>

      {answer.summary && (
        <p className="mb-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {answer.summary}
        </p>
      )}

      {spec?.category === "commute" && <CommuteSection spec={spec} />}
      {spec?.category === "cooking" && <CookingSection spec={spec} />}
      {spec?.category === "diy" && <DiySection spec={spec} />}
      {spec?.category === "first_aid" && <FirstAidSection spec={spec} />}
      {spec?.category === "docs" && <DocsSection spec={spec} />}
      {spec?.category === "generic" && spec.note && (
        <p className="mb-3 text-sm italic text-zinc-600 dark:text-zinc-400">{spec.note}</p>
      )}

      {answer.steps.length > 0 && <StepsList steps={answer.steps} />}

      {answer.disclaimer && (
        <p className="mt-3 rounded-lg bg-yellow-50 px-3 py-2 text-xs leading-relaxed text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-100">
          {answer.disclaimer}
        </p>
      )}

      {answer.official_link && (
        <a
          href={answer.official_link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900 dark:text-blue-300"
        >
          {answer.official_link.label}
        </a>
      )}

      {flagCount > 0 && (
        <p className="mt-3 rounded-lg bg-orange-50 px-3 py-2 text-xs font-medium text-orange-900 dark:bg-orange-900/20 dark:text-orange-200">
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
      <p className="animate-pop mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        Salamat! Nakatulong ang feedback mo sa komunidad.
      </p>
    );
  }

  return (
    <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
      {showCorrection ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Ano ang dapat itama? (makakatulong ito sa iba)
          </p>
          <textarea
            value={correction}
            onChange={(e) => onCorrectionChange(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Hal. 'mas tama ang ₱26 na pamasahe ngayon'"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <div className="flex gap-2">
            <button
              onClick={onCorrectionSubmit}
              className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-zinc-950 hover:bg-orange-400"
            >
              Ipadala
            </button>
            <button
              onClick={onCancelCorrection}
              className="rounded-full px-3 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              Kanselahin
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
          <span className="mr-1">Nakatulong ba ito?</span>
          <button
            onClick={() => onVote(true)}
            aria-label="Oo, nakatulong"
            className={`rounded-full px-2.5 py-1 font-semibold transition-colors ${
              vote === true
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            }`}
          >
            Oo
          </button>
          <button
            onClick={() => onVote(false)}
            aria-label="Hindi nakatulong"
            className={`rounded-full px-2.5 py-1 font-semibold transition-colors ${
              vote === false
                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
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
      className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
      title={CONFIDENCE_LABEL[confidence]}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {confidence === "high" ? "Verified" : confidence === "medium" ? "Tantiya" : "I-verify"}
    </span>
  );
}

function StepsList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
            {i + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-1.5 mt-4 text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
      {children}
    </h4>
  );
}

function CommuteSection({ spec }: { spec: Extract<PaanoAnswer["category_specific"], { category: "commute" }> }) {
  return (
    <div className="rounded-xl bg-sky-50 p-3 dark:bg-sky-900/20">
      <div className="mb-2 flex flex-wrap gap-1.5">
        {spec.modes.map((m) => (
          <span
            key={m}
            className="rounded-full bg-sky-600 px-2 py-0.5 text-[11px] font-semibold text-white"
          >
            {MODE_LABELS[m] ?? m}
          </span>
        ))}
      </div>
      {spec.route_names.length > 0 && (
        <p className="mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Sakay: {spec.route_names.join(" · ")}
        </p>
      )}
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-white p-2 dark:bg-zinc-900">
          <dt className="text-[10px] font-semibold uppercase text-zinc-500">Byahe</dt>
          <dd className="font-bold text-zinc-900 dark:text-zinc-100">
            ~{spec.time_range.min}–{spec.time_range.max} min
          </dd>
        </div>
        <div className="rounded-lg bg-white p-2 dark:bg-zinc-900">
          <dt className="text-[10px] font-semibold uppercase text-zinc-500">Pamasahe</dt>
          <dd className="font-bold text-zinc-900 dark:text-zinc-100">
            {spec.fare_range.min === spec.fare_range.max
              ? `₱${spec.fare_range.min}`
              : `₱${spec.fare_range.min}–₱${spec.fare_range.max}`}
          </dd>
        </div>
      </dl>
      {spec.fare_notes && (
        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{spec.fare_notes}</p>
      )}
    </div>
  );
}

function CookingSection({ spec }: { spec: Extract<PaanoAnswer["category_specific"], { category: "cooking" }> }) {
  return (
    <>
      <SectionTitle>Sangkap {spec.servings && <span className="normal-case">· para sa {spec.servings}</span>}</SectionTitle>
      <ul className="space-y-1 text-sm text-zinc-800 dark:text-zinc-200">
        {spec.ingredients.map((ing, i) => (
          <li key={i} className="flex justify-between gap-3 border-b border-dashed border-zinc-200 pb-1 dark:border-zinc-700">
            <span>{ing.item}</span>
            {ing.amount && <span className="shrink-0 font-medium text-zinc-500">{ing.amount}</span>}
          </li>
        ))}
      </ul>
      {spec.tips.length > 0 && (
        <>
          <SectionTitle>Tips</SectionTitle>
          <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            {spec.tips.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function DiySection({ spec }: { spec: Extract<PaanoAnswer["category_specific"], { category: "diy" }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {spec.tools.length > 0 && (
        <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
          <SectionTitle>Mga Kailangan (Tools)</SectionTitle>
          <ul className="space-y-1 text-sm text-zinc-800 dark:text-zinc-200">
            {spec.tools.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-600" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
      {spec.materials.length > 0 && (
        <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
          <SectionTitle>Materials</SectionTitle>
          <ul className="space-y-1 text-sm text-zinc-800 dark:text-zinc-200">
            {spec.materials.map((m, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-600" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}
      {spec.safety_warning && (
        <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-800 dark:bg-red-900/20 dark:text-red-200">
          {spec.safety_warning}
        </p>
      )}
    </div>
  );
}

function FirstAidSection({ spec }: { spec: Extract<PaanoAnswer["category_specific"], { category: "first_aid" }> }) {
  return (
    <div className="rounded-xl bg-rose-50 p-3 dark:bg-rose-900/20">
      <div className="grid gap-3 sm:grid-cols-2">
        {spec.do_list.length > 0 && (
          <div>
            <h4 className="mb-1 text-xs font-bold uppercase text-rose-700 dark:text-rose-300">Gawin</h4>
            <ul className="space-y-1 text-sm text-zinc-800 dark:text-zinc-200">
              {spec.do_list.map((d, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-rose-600" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}
        {spec.don_t_list.length > 0 && (
          <div>
            <h4 className="mb-1 text-xs font-bold uppercase text-rose-700 dark:text-rose-300">Huwag</h4>
            <ul className="space-y-1 text-sm text-zinc-800 dark:text-zinc-200">
              {spec.don_t_list.map((d, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-rose-600" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {spec.see_doctor_threshold && (
        <p className="mt-3 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white">
          Pumunta sa doktor kung: {spec.see_doctor_threshold}
        </p>
      )}
    </div>
  );
}

function DocsSection({ spec }: { spec: Extract<PaanoAnswer["category_specific"], { category: "docs" }> }) {
  return (
    <>
      {spec.prerequisites.length > 0 && (
        <div className="mb-3 rounded-xl bg-indigo-50 p-3 dark:bg-indigo-900/20">
          <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
            Kailangan mo munang makuha
          </h4>
          <ul className="space-y-1 text-sm text-zinc-800 dark:text-zinc-200">
            {spec.prerequisites.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-indigo-600" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
      {spec.alerts.length > 0 && (
        <div className="mb-3 space-y-2">
          {spec.alerts.map((a, i) => (
            <p
              key={i}
              className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:bg-amber-900/20 dark:text-amber-200"
            >
              {a}
            </p>
          ))}
        </div>
      )}
      <SectionTitle>Requirements</SectionTitle>
      <ul className="space-y-1 text-sm text-zinc-800 dark:text-zinc-200">
        {spec.requirements.map((r, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-indigo-600" />
            {r}
          </li>
        ))}
      </ul>
      {spec.fees.length > 0 && (
        <>
          <SectionTitle>Bayarin (maaaring magbago)</SectionTitle>
          <ul className="space-y-1 text-sm text-zinc-800 dark:text-zinc-200">
            {spec.fees.map((f, i) => (
              <li key={i} className="flex justify-between gap-3 border-b border-dashed border-zinc-200 pb-1 dark:border-zinc-700">
                <span>{f.item}</span>
                <span className="shrink-0 font-medium text-zinc-500">{f.amount}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {(spec.processing_time || spec.last_verified) && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {spec.processing_time && <>Processing: {spec.processing_time}. </>}
          Huling nabe-verify: {spec.last_verified}
        </p>
      )}
    </>
  );
}
