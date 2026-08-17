"use client";

import { useEffect, useRef, useState } from "react";
import { answerHash } from "@/lib/feedback";
import { answerToText } from "@/lib/answers";
import type { PaanoAnswer } from "@/lib/answers";
import {
  saveAnswer,
  unsaveAnswer,
  isSaved as checkSaved,
  getSavedAnswers,
} from "@/lib/storage";
import { shareText } from "@/lib/share";

/**
 * AnswerCard — structured answer display, ibang layout per category.
 * May transit timeline, interactive cooking checklist, at quick actions.
 */

const CATEGORY_META = {
  cooking: {
    label: "Lutong Bahay",
    badge: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    bar: "from-amber-500 via-orange-500 to-amber-600",
    tint: "bg-amber-500/5",
    border: "border-amber-500/20",
    accentText: "text-amber-400",
  },
  commute: {
    label: "Commute",
    badge: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
    bar: "from-sky-500 via-cyan-500 to-blue-600",
    tint: "bg-sky-500/5",
    border: "border-sky-500/20",
    accentText: "text-sky-400",
  },
  diy: {
    label: "Gawa-Bahay",
    badge: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    bar: "from-emerald-500 via-teal-500 to-green-600",
    tint: "bg-emerald-500/5",
    border: "border-emerald-500/20",
    accentText: "text-emerald-400",
  },
  first_aid: {
    label: "First Aid",
    badge: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
    bar: "from-rose-500 via-red-500 to-pink-600",
    tint: "bg-rose-500/5",
    border: "border-rose-500/20",
    accentText: "text-rose-400",
  },
  docs: {
    label: "Docs Guide",
    badge: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
    bar: "from-violet-500 via-purple-500 to-indigo-600",
    tint: "bg-violet-500/5",
    border: "border-violet-500/20",
    accentText: "text-violet-400",
  },
  generic: {
    label: "Gabay",
    badge: "bg-zinc-700/40 text-zinc-300 ring-zinc-700/50",
    bar: "from-orange-500 to-zinc-600",
    tint: "bg-zinc-800/30",
    border: "border-zinc-800",
    accentText: "text-orange-400",
  },
} as const;

const CONFIDENCE_LABEL = {
  high: "Mataas ang kumpiyansa — na-cross-check o official process",
  medium: "Katamtaman — tantiya o maaaring magbago",
  low: "Mababa — i-verify sa opisyal na source",
} as const;

const MODE_LABELS: Record<string, string> = {
  jeepney: "Jeepney",
  bus: "Bus",
  p2p: "P2P Bus",
  lrt: "LRT",
  mrt: "MRT",
  tricycle: "Tricycle",
  uv: "UV Express",
  ferry: "Pasig Ferry",
  walk: "Lakad",
};

export function AnswerCard({
  answer,
  question,
}: {
  answer: PaanoAnswer;
  question?: string;
}) {
  const meta = CATEGORY_META[answer.category];
  const spec = answer.category_specific;
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(() => (question ? checkSaved(question) : false));
  const [shared, setShared] = useState(false);
  const [vote, setVote] = useState<boolean | null>(null);
  const [correction, setCorrection] = useState("");
  const [showCorrection, setShowCorrection] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [flagCount, setFlagCount] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const hash = useRef(answerHash(answer));

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2200);
  };

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
      showToast("Kopyado sa clipboard!");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  function toggleSave() {
    if (!question) return;
    if (saved) {
      const items = getSavedAnswers().filter((s) => s.question === question);
      items.forEach((s) => unsaveAnswer(s.id));
      setSaved(false);
      showToast("Inalis sa saved items");
    } else {
      saveAnswer({
        question,
        answer,
        category: answer.category,
        title: answer.title,
      });
      setSaved(true);
      showToast("Na-save sa 'Saved' tab!");
    }
  }

  async function shareAnswer() {
    const text = `PAANO — ${answer.title}\n\n${answerToText(answer)}\n\n— via PAANO (https://paano.ph)`;
    const result = await shareText(answer.title, text);
    if (result === "copied") {
      setShared(true);
      showToast("Na-copy ang link para ma-share!");
      setTimeout(() => setShared(false), 1800);
    } else if (result === "shared") {
      showToast("Matagumpay na na-share!");
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
      className={`relative animate-fade-up overflow-hidden rounded-2xl border bg-zinc-900/80 shadow-lg backdrop-blur-md transition-all duration-200 hover:border-opacity-50 ${meta.border}`}
    >
      {/* Category accent bar */}
      <div aria-hidden className={`h-1.5 w-full bg-gradient-to-r ${meta.bar}`} />

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="animate-slide-down absolute top-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-orange-500 px-3.5 py-1 text-xs font-bold text-zinc-950 shadow-lg">
          {toastMsg}
        </div>
      )}

      <div className="p-3.5 sm:p-5">
        <header className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0 flex-1">
            <span
              className={`mb-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${meta.badge}`}
            >
              {meta.label}
            </span>
            <h3 className="text-balance text-base font-bold leading-snug text-white sm:text-lg">
              {answer.title}
            </h3>
          </div>
          <div className="flex shrink-0 flex-row items-center gap-1.5 sm:flex-col sm:items-end">
            <ConfidenceBadge confidence={answer.confidence} />
            <div className="flex items-center gap-1">
              <button
                onClick={() => void copyAnswer()}
                title="Kopyahin ang buong sagot"
                aria-label="Kopyahin ang sagot"
                className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 text-[10px] font-medium text-zinc-300 transition-all duration-150 hover:bg-zinc-700 hover:text-white active:scale-95 focus-ring"
              >
                {copied ? (
                  <>
                    <svg
                      className="h-3 w-3 text-emerald-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path className="check-draw" d="M5 13l4 4L19 7" />
                    </svg>
                    Kopyado!
                  </>
                ) : (
                  <>
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Kopyahin
                  </>
                )}
              </button>
              {question && (
                <button
                  onClick={toggleSave}
                  title={saved ? "Alisin sa saved" : "I-save ang sagot"}
                  aria-label={saved ? "Alisin sa saved" : "I-save ang sagot"}
                  className={`inline-flex items-center justify-center rounded-full p-1.5 transition-all duration-150 active:scale-95 focus-ring ${
                    saved
                      ? "bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/40"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill={saved ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => void shareAnswer()}
                title="I-share ang sagot"
                aria-label="I-share ang sagot"
                className="inline-flex items-center justify-center rounded-full bg-zinc-800 p-1.5 text-zinc-400 transition-all duration-150 hover:bg-zinc-700 hover:text-zinc-200 active:scale-95 focus-ring"
              >
                {shared ? (
                  <svg
                    className="h-3.5 w-3.5 text-emerald-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path className="check-draw" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </header>

        {answer.summary && (
          <p className="mb-3 text-sm leading-relaxed text-zinc-300">
            {answer.summary}
          </p>
        )}

        {/* Category specific layout */}
        {spec?.category === "commute" && (
          <CommuteSection spec={spec} steps={answer.steps} tint={meta.tint} />
        )}
        {spec?.category === "cooking" && (
          <CookingSection spec={spec} tint={meta.tint} border={meta.border} />
        )}
        {spec?.category === "diy" && <DiySection spec={spec} tint={meta.tint} />}
        {spec?.category === "first_aid" && (
          <FirstAidSection spec={spec} tint={meta.tint} />
        )}
        {spec?.category === "docs" && <DocsSection spec={spec} tint={meta.tint} />}
        {spec?.category === "generic" && spec.note && (
          <p className="mb-3 text-sm italic text-zinc-400">{spec.note}</p>
        )}

        {/* Generic Steps (for non-commute categories) */}
        {answer.category !== "commute" && answer.steps.length > 0 && (
          <StepsList steps={answer.steps} />
        )}

        {answer.disclaimer && (
          <p
            className={`mt-3 rounded-xl border px-3 py-2 text-xs leading-relaxed text-amber-200 ${meta.tint} ${meta.border}`}
          >
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
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            {answer.official_link.label}
          </a>
        )}

        {flagCount > 0 && (
          <p className="mt-3 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs font-medium text-orange-200">
            May {flagCount} nagsabing i-verify ang sagot na ito — may correction ang
            komunidad. I-double check bago kumilos.
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
    <div className="mt-4 border-t border-zinc-800/80 pt-3">
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

function ConfidenceBadge({
  confidence,
}: {
  confidence: PaanoAnswer["confidence"];
}) {
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
      {confidence === "high"
        ? "Verified"
        : confidence === "medium"
        ? "Tantiya"
        : "I-verify"}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   VISUAL TRANSIT TIMELINE COMPONENT (Commute Section)
   ────────────────────────────────────────────────────────────────────────── */

function CommuteSection({
  spec,
  steps,
  tint,
}: {
  spec: Extract<PaanoAnswer["category_specific"], { category: "commute" }>;
  steps: string[];
  tint: string;
}) {
  return (
    <div className="space-y-3">
      {/* Overview Cards */}
      <div className={`rounded-xl border p-2.5 sm:p-3 ${tint} ${CATEGORY_META.commute.border}`}>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {spec.modes.map((m) => (
            <span
              key={m}
              className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-sky-200"
            >
              {MODE_LABELS[m] ?? m}
            </span>
          ))}
        </div>
        {spec.route_names.length > 0 && (
          <p className="mb-2.5 text-xs font-semibold text-sky-300">
            Ruta: {spec.route_names.join(" · ")}
          </p>
        )}
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl border border-sky-500/10 bg-zinc-950/60 p-2 sm:p-2.5">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Oras ng Byahe
            </dt>
            <dd className="text-base font-extrabold text-sky-200">
              ~{spec.time_range.min}–{spec.time_range.max} min
            </dd>
          </div>
          <div className="rounded-xl border border-sky-500/10 bg-zinc-950/60 p-2 sm:p-2.5">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Pamasahe (Est.)
            </dt>
            <dd className="text-base font-extrabold text-emerald-300">
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

      {/* Interactive Visual Transit Timeline */}
      {steps.length > 0 && (
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 sm:p-4">
          <h4 className="mb-3 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-sky-400">
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="12 8 8 12 12 16 12 8" />
            </svg>
            Hakbang sa Biyahe (Transit Route Timeline)
          </h4>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-sky-500 before:via-cyan-500 before:to-emerald-500">
            {steps.map((step, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === steps.length - 1;

              return (
                <div key={idx} className="relative animate-fade-up" style={{ animationDelay: `${idx * 40}ms` }}>
                  {/* Step node dot */}
                  <span
                    className={`absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ring-4 ring-zinc-950 ${
                      isFirst
                        ? "bg-sky-500 text-zinc-950"
                        : isLast
                        ? "bg-emerald-500 text-zinc-950"
                        : "bg-zinc-800 text-sky-300"
                    }`}
                  >
                    {isLast ? "✓" : idx + 1}
                  </span>

                  <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-2.5 sm:p-3 hover:border-sky-500/30 transition-colors">
                    <p className="text-xs sm:text-sm font-medium leading-relaxed text-zinc-200">
                      {step}
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

/* ──────────────────────────────────────────────────────────────────────────
   INTERACTIVE COOKING & INGREDIENT CHECKLIST
   ────────────────────────────────────────────────────────────────────────── */

function CookingSection({
  spec,
  tint,
  border,
}: {
  spec: Extract<PaanoAnswer["category_specific"], { category: "cooking" }>;
  tint: string;
  border: string;
}) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [portionScale, setPortionScale] = useState<number>(1); // 1x, 1.5x, 2x

  const toggleCheck = (item: string) => {
    setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const totalIngredients = spec.ingredients.length;
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <SectionTitle>
          Sangkap Checklist{" "}
          {spec.servings && (
            <span className="normal-case text-zinc-400">
              · Base recipe ({spec.servings})
            </span>
          )}
        </SectionTitle>

        {/* Portion scaling pills */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold text-zinc-500 mr-1">Dami:</span>
          {[
            { label: "1x", mult: 1 },
            { label: "1.5x", mult: 1.5 },
            { label: "2x (Handaan)", mult: 2 },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => setPortionScale(s.mult)}
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-all ${
                portionScale === s.mult
                  ? "bg-amber-500 text-zinc-950 ring-1 ring-amber-400"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress tracker */}
      {totalIngredients > 0 && (
        <div className="mb-2.5 flex items-center justify-between rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">
          <span>
            Pantry Ready: {checkedCount} of {totalIngredients} sangkap
          </span>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${(checkedCount / totalIngredients) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Interactive checklist */}
      <ul
        className={`space-y-1.5 rounded-xl border p-2.5 text-sm text-zinc-200 sm:p-3 ${tint} ${border}`}
      >
        {spec.ingredients.map((ing, i) => {
          const isChecked = !!checkedItems[ing.item];
          return (
            <li
              key={i}
              onClick={() => toggleCheck(ing.item)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg p-1.5 transition-colors ${
                isChecked ? "bg-amber-500/10 text-zinc-400" : "hover:bg-zinc-800/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                    isChecked
                      ? "border-amber-500 bg-amber-500 text-zinc-950 font-bold text-[10px]"
                      : "border-zinc-700 bg-zinc-900"
                  }`}
                >
                  {isChecked ? "✓" : ""}
                </span>
                <span className={isChecked ? "line-through text-zinc-500" : ""}>
                  {ing.item}
                </span>
              </div>
              {ing.amount && (
                <span className="shrink-0 font-medium text-amber-400 text-xs">
                  {portionScale !== 1
                    ? `${ing.amount} (×${portionScale})`
                    : ing.amount}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {spec.tips.length > 0 && (
        <>
          <SectionTitle>Luto Tips ni Tita / Kuya</SectionTitle>
          <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-300">
            {spec.tips.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span className="text-balance leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function DiySection({
  spec,
  tint,
}: {
  spec: Extract<PaanoAnswer["category_specific"], { category: "diy" }>;
  tint: string;
}) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
      {spec.tools.length > 0 && (
        <div
          className={`rounded-xl border p-2.5 sm:p-3 ${tint} ${CATEGORY_META.diy.border}`}
        >
          <SectionTitle>Tools na Kailangan</SectionTitle>
          <ul className="space-y-1 text-xs sm:text-sm text-zinc-300">
            {spec.tools.map((t, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
      {spec.materials.length > 0 && (
        <div
          className={`rounded-xl border p-2.5 sm:p-3 ${tint} ${CATEGORY_META.diy.border}`}
        >
          <SectionTitle>Materyales / Pyesa</SectionTitle>
          <ul className="space-y-1 text-xs sm:text-sm text-zinc-300">
            {spec.materials.map((m, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}
      {spec.safety_warning && (
        <div className="col-span-full rounded-xl border border-amber-500/40 bg-amber-950/20 p-2.5 text-xs text-amber-200">
          <span className="font-bold">Paalala sa Kaligtasan:</span>{" "}
          {spec.safety_warning}
        </div>
      )}
    </div>
  );
}

function FirstAidSection({
  spec,
  tint,
}: {
  spec: Extract<PaanoAnswer["category_specific"], { category: "first_aid" }>;
  tint: string;
}) {
  return (
    <div
      className={`rounded-xl border p-2.5 sm:p-3 ${tint} ${CATEGORY_META.first_aid.border}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase text-rose-300">
          Severity: {spec.severity}
        </span>
      </div>
      {spec.don_t_list && spec.don_t_list.length > 0 && (
        <div className="mb-3 rounded-lg bg-rose-950/40 p-2 text-xs text-rose-200">
          <p className="font-bold">HUWAG GAGAWIN:</p>
          <ul className="list-inside list-disc space-y-0.5">
            {spec.don_t_list.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs font-semibold text-rose-300">
        Kailan dapat pumunta sa doktor:
      </p>
      <p className="mt-0.5 text-xs leading-relaxed text-zinc-300">
        {spec.see_doctor_threshold}
      </p>
    </div>
  );
}

function DocsSection({
  spec,
  tint,
}: {
  spec: Extract<PaanoAnswer["category_specific"], { category: "docs" }>;
  tint: string;
}) {
  return (
    <div
      className={`space-y-3 rounded-xl border p-2.5 sm:p-3 ${tint} ${CATEGORY_META.docs.border}`}
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase text-violet-300">
          Ahensya: {spec.agency}
        </span>
        {spec.last_verified && (
          <span className="text-[10px] text-zinc-400">
            Na-verify: {spec.last_verified}
          </span>
        )}
      </div>
      {spec.requirements.length > 0 && (
        <div>
          <SectionTitle>Mga Kailangang Dalhin</SectionTitle>
          <ul className="list-inside list-disc space-y-1 text-xs text-zinc-300">
            {spec.requirements.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
      {spec.fees.length > 0 && (
        <div>
          <SectionTitle>Bayarin (Fees)</SectionTitle>
          <dl className="space-y-1 text-xs">
            {spec.fees.map((f, i) => (
              <div key={i} className="flex justify-between border-b border-zinc-800 pb-1">
                <dt className="text-zinc-300">{f.item}</dt>
                <dd className="font-bold text-violet-300">{f.amount}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

function StepsList({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-3 space-y-2 border-t border-zinc-800/80 pt-3 sm:mt-4 sm:pt-4">
      {steps.map((step, i) => (
        <li
          key={i}
          className="animate-fade-up flex gap-2 text-xs sm:text-sm leading-relaxed text-zinc-200 sm:gap-2.5"
          style={{ animationDelay: `${i * 40}ms` }}
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
    <h4 className="mb-2 mt-3 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
      {children}
    </h4>
  );
}
