import type { AnswerProvenance } from "@/lib/answers";

const STATUS: Record<AnswerProvenance["status"], { label: string; className: string }> = {
  official: { label: "Official source", className: "text-emerald-700 dark:text-emerald-300" },
  curated: { label: "Human-reviewed", className: "text-blue-700 dark:text-blue-300" },
  estimate: { label: "Estimate", className: "text-amber-700 dark:text-amber-300" },
  needs_review: { label: "Verify before acting", className: "text-rose-700 dark:text-rose-300" },
};

export function ProvenanceLine({ provenance }: { provenance: AnswerProvenance }) {
  const status = STATUS[provenance.status];
  return (
    <div className="mb-3 flex min-w-0 flex-col gap-1 rounded-xl border border-line bg-panel px-3 py-2 text-[11px] leading-relaxed text-muted sm:flex-row sm:items-start sm:gap-2">
      <span className={`shrink-0 font-bold ${status.className}`}>{status.label}</span>
      <span className="min-w-0 break-words">
        <span className="font-semibold text-body">{provenance.label}</span>
        <span className="mx-1">·</span>
        <span>{provenance.asOf ? `As of ${provenance.asOf}` : "As of: hindi pa verified"}</span>
        <span className="ml-1">— {provenance.note}</span>
        {provenance.url && (
          <a
            href={provenance.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 font-semibold text-accent underline decoration-accent/40 underline-offset-2 hover:text-accent-bright"
          >
            Source
          </a>
        )}
      </span>
    </div>
  );
}
