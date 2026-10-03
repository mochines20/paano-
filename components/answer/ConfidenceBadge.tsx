import type { PaanoAnswer } from "@/lib/answers";
import { CONFIDENCE_LABEL } from "@/components/answer/meta";

export function ConfidenceBadge({
  confidence,
}: {
  confidence: PaanoAnswer["confidence"];
}) {
  const dot =
    confidence === "high"
      ? "bg-emerald-500"
      : confidence === "medium"
        ? "bg-amber-500"
        : "bg-rose-500";
  const label =
    confidence === "high"
      ? "Kumpiyansa: Mataas"
      : confidence === "medium"
        ? "Tantiya lang"
        : "Kaunti — i-verify";
  return (
    <span
      className="flex items-center gap-1 rounded-full bg-panel px-2 py-1 text-[11px] font-medium text-muted"
      title={CONFIDENCE_LABEL[confidence]}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
