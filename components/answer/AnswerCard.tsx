"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { findSubstitutesForItems } from "@/lib/substitutes";
import { StepTrackerModal } from "@/components/StepTrackerModal";
import { CATEGORY_META } from "@/components/answer/meta";
import { StepsList } from "@/components/answer/StepsList";
import { BudgetBreakdown } from "@/components/answer/BudgetBreakdown";
import { SubstitutesSection } from "@/components/answer/SubstitutesSection";
import { CommunityFeedback } from "@/components/answer/CommunityFeedback";
import { CommuteSection } from "@/components/answer/sections/CommuteSection";
import { CookingSection } from "@/components/answer/sections/CookingSection";
import { DiySection } from "@/components/answer/sections/DiySection";
import { FirstAidSection } from "@/components/answer/sections/FirstAidSection";
import { DocsSection } from "@/components/answer/sections/DocsSection";
import { ProvenanceLine } from "@/components/answer/ProvenanceLine";
import {
  IconCommute,
  IconCooking,
  IconCheckCircle,
  IconDiy,
} from "@/components/icons";

/**
 * AnswerCard — structured answer display, ibang layout per category.
 * Ang mga category sections ay nasa components/answer/sections/.
 */

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path className="check-draw" d="M5 13l4 4L19 7" />
    </svg>
  );
}

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
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);
  const [vote, setVote] = useState<boolean | null>(null);
  const [correction, setCorrection] = useState("");
  const [showCorrection, setShowCorrection] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [flagCount, setFlagCount] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
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

  // i-set ang saved state mula sa localStorage pagkatapos ng mount
  // (walang localStorage sa server render → iwas hydration mismatch)
  useEffect(() => {
    if (question) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaved(checkSaved(question));
    }
  }, [question]);

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
    const text = `PAANO — ${answer.title}\n\n${answerToText(answer)}`;
    // Generate shareable URL — /paano?q=<question> auto-asks sa pagbukas
    const origin = typeof window !== "undefined" ? window.location.origin : "https://paano.ph";
    const shareUrl = question
      ? `${origin}/paano?q=${encodeURIComponent(question)}`
      : origin;
    const result = await shareText(answer.title, text, shareUrl);
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

  // ── Mga relevant na substitute para sa cooking/diy answers ──────
  const relevantSubstitutes = useMemo(() => {
    if (spec?.category === "cooking") {
      const items = spec.ingredients.map((i) => i.item);
      return findSubstitutesForItems(items, "cooking");
    }
    if (spec?.category === "diy") {
      const items = [...spec.tools, ...spec.materials];
      return findSubstitutesForItems(items, "diy");
    }
    return [];
  }, [spec]);

  // Step tracker CTA copy + icon per category
  const tracker =
    answer.category === "cooking"
      ? {
          prompt: "Gusto mo bang magluto nang sabay sa gabay?",
          cta: "Simulan ang Luto",
          icon: <IconCooking className="h-3.5 w-3.5" />,
        }
      : answer.category === "commute"
        ? {
            prompt: "Handa na bang bumiyahe?",
            cta: "Biyahe Tracker",
            icon: <IconCommute className="h-3.5 w-3.5" />,
          }
        : {
            prompt: "Nais mo bang subaybayan hakbang-hakbang?",
            cta: "Step Tracker",
            icon: <IconDiy className="h-3.5 w-3.5" />,
          };

  return (
    <article
      className={`animate-fade-up h-fit min-w-0 w-full max-w-full self-start overflow-hidden rounded-2xl border border-line bg-surface shadow-lg backdrop-blur-xl transition-all duration-200 ${answer.category === "commute" ? "ring-1 ring-sky-500/10" : meta.border}`}
    >
      {/* Category accent bar */}
      <div aria-hidden className={`h-1.5 w-full ${meta.bar}`} />

      {/* Floating toast (role=status para mabasa ng screen readers) */}
      <div aria-live="polite">
        {toastMsg && (
          <div
            role="status"
            className="animate-slide-down absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full bg-accent px-3.5 py-1 text-xs font-bold text-accent-ink shadow-lg"
          >
            {toastMsg}
          </div>
        )}
      </div>

      <div className="p-3.5 sm:p-5">
        <header className="mb-3">
          <span
            className={`mb-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${meta.badge}`}
          >
            {meta.label}
          </span>
          <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <h3 className="min-w-0 flex-1 break-words text-pretty text-base font-bold leading-snug text-foreground sm:text-lg">
              {answer.title}
            </h3>
            <div className="flex w-full shrink-0 flex-wrap items-center justify-start gap-1.5 sm:w-auto sm:justify-end sm:self-start">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => void copyAnswer()}
                  title="Kopyahin ang buong sagot"
                  aria-label="Kopyahin ang sagot"
                  className="inline-flex items-center gap-1 rounded-full bg-panel px-2.5 py-1 text-[11px] font-medium text-body transition-all duration-150 hover:bg-panel-strong hover:text-foreground active:scale-95 focus-ring"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="h-3 w-3 text-emerald-500" />
                      Kopyado!
                    </>
                  ) : (
                    <>
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
                    aria-pressed={saved}
                    className={`inline-flex items-center justify-center rounded-full p-1.5 transition-all duration-150 active:scale-95 focus-ring ${
                      saved
                        ? "bg-accent/20 text-accent ring-1 ring-accent/40"
                        : "bg-panel text-muted hover:bg-panel-strong hover:text-body"
                    }`}
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" height="14" width="14" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => void shareAnswer()}
                  title="I-share ang sagot"
                  aria-label="I-share ang sagot"
                  className="inline-flex items-center justify-center rounded-full bg-panel p-1.5 text-muted transition-all duration-150 hover:bg-panel-strong hover:text-body active:scale-95 focus-ring"
                >
                  {shared ? (
                    <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {answer.summary && (
          <p className="mb-3 text-sm leading-relaxed text-body">{answer.summary}</p>
        )}

        {answer.provenance && <ProvenanceLine provenance={answer.provenance} />}

        {/* ── Magkano Aabutin? Budget Breakdown Card ────────────── */}
        <BudgetBreakdown answer={answer} />

        {/* ── Category Specific Content ────────────────────────── */}
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
          <p className="mb-3 text-sm italic text-muted">{spec.note}</p>
        )}

        {/* ── Diskarte & Pamalit (Substitutes Drawer) ──────────── */}
        {relevantSubstitutes.length > 0 && (
          <SubstitutesSection substitutes={relevantSubstitutes} />
        )}

        {/* ── Fullscreen Step Tracker Launch Banner ───────────── */}
        {answer.steps.length > 0 && (
          <div className="mt-4 flex flex-col items-stretch gap-2 rounded-2xl border border-accent/30 bg-accent/10 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold text-accent">{tracker.prompt}</p>
              <p className="text-[11px] text-muted">
                Fullscreen mode · Mananatiling naka-on ang screen
              </p>
            </div>
            <button
              onClick={() => setIsTrackerOpen(true)}
              className="flex w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-accent-strong px-3.5 py-1.5 text-xs font-black text-accent-ink shadow-md shadow-accent/30 transition-all hover:bg-accent-bright active:scale-95 focus-ring sm:w-auto"
            >
              {tracker.icon}
              {tracker.cta}
            </button>
          </div>
        )}

        {/* Generic steps (para sa non-commute categories) */}
        {answer.category !== "commute" && answer.steps.length > 0 && (
          <StepsList steps={answer.steps} />
        )}

        {answer.official_link && (
          <a
            href={answer.official_link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-accent transition-colors hover:text-accent-bright focus-ring"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            {answer.official_link.label}
          </a>
        )}

        {answer.disclaimer && (
          <p className="mt-4 border-t border-line pt-2 text-[10px] leading-relaxed text-muted">
            <span className="font-semibold">Paalala:</span> {answer.disclaimer}
          </p>
        )}

        {flagCount > 0 && (
          <p className="mt-3 flex items-start gap-1.5 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-medium text-accent-bright">
            <IconCheckCircle className="mt-px h-3.5 w-3.5 shrink-0" />
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

      {/* Fullscreen Step Tracker Modal */}
      <StepTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        title={answer.title}
        steps={answer.steps}
        category={answer.category}
      />
    </article>
  );
}
