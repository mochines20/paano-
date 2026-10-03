"use client";

export function CommunityFeedback({
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
      <p className="animate-pop mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400" role="status">
        Salamat! Nakatulong ang feedback mo sa komunidad.
      </p>
    );
  }

  return (
    <div className="mt-4 border-t border-line pt-3">
      {showCorrection ? (
        <div className="space-y-2">
          <label
            htmlFor="paano-correction"
            className="text-xs font-semibold text-muted"
          >
            Ano ang dapat itama? (makakatulong ito sa iba)
          </label>
          <textarea
            id="paano-correction"
            value={correction}
            onChange={(e) => onCorrectionChange(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Hal. 'mas tama ang ₱26 na pamasahe ngayon'"
            className="w-full rounded-xl border border-line-strong bg-deep/60 px-3 py-2 text-xs text-body outline-none backdrop-blur focus:border-accent"
          />
          <div className="flex gap-2">
            <button
              onClick={onCorrectionSubmit}
              className="rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-accent-ink transition-all duration-150 hover:bg-accent-bright active:scale-95 focus-ring"
            >
              Ipadala
            </button>
            <button
              onClick={onCancelCorrection}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-body focus-ring"
            >
              Kanselahin
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[11px] text-muted">
          <span className="mr-1">Nakatulong ba ito?</span>
          <button
            onClick={() => onVote(true)}
            aria-label="Oo, nakatulong"
            aria-pressed={vote === true}
            className={`rounded-full px-2.5 py-1 font-semibold transition-all duration-150 active:scale-90 focus-ring ${
              vote === true
                ? "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/40 dark:text-emerald-300"
                : "bg-panel text-muted hover:bg-panel-strong"
            }`}
          >
            Oo
          </button>
          <button
            onClick={() => onVote(false)}
            aria-label="Hindi nakatulong"
            aria-pressed={vote === false}
            className={`rounded-full px-2.5 py-1 font-semibold transition-all duration-150 active:scale-90 focus-ring ${
              vote === false
                ? "bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/40 dark:text-rose-300"
                : "bg-panel text-muted hover:bg-panel-strong"
            }`}
          >
            Hindi
          </button>
        </div>
      )}
    </div>
  );
}
