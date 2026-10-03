import { IconPeso } from "@/components/icons";
import type { PaanoAnswer } from "@/lib/answers";

/**
 * "Magkano Aabutin?" — budget breakdown card per category.
 * Commute: one-way + round-trip mula sa grounded fare range.
 * Cooking: tinatayang gastos mula sa ₱ amounts sa ingredients.
 */
export function BudgetBreakdown({ answer }: { answer: PaanoAnswer }) {
  const spec = answer.category_specific;

  if (spec?.category === "commute") {
    if (!answer.provenance) return null;
    const min = spec.fare_range.min;
    const max = spec.fare_range.max;
    const roundMin = min * 2;
    const roundMax = max * 2;

    return (
      <div className="mb-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 sm:p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-1.5">
            <IconPeso className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Magkano Aabutin? (Pamasahe)
            </h4>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
            {answer.provenance.status === "needs_review" ? "Verify source" : "Grounded estimate"}
          </span>
        </div>

        <div className="mt-2.5 grid grid-cols-1 gap-2 text-center min-[360px]:grid-cols-2">
          <div className="rounded-xl border border-emerald-500/20 bg-deep/40 p-2 backdrop-blur">
            <p className="text-[11px] font-semibold text-muted">Isang Pasahe (One-Way)</p>
            <p className="text-base font-black text-emerald-700 dark:text-emerald-300">
              {min === max ? `₱${min}` : `₱${min} – ₱${max}`}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-deep/40 p-2 backdrop-blur">
            <p className="text-[11px] font-semibold text-muted">Balikan (Round-Trip)</p>
            <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {roundMin === roundMax ? `₱${roundMin}` : `₱${roundMin} – ₱${roundMax}`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (spec?.category === "cooking") {
    if (!answer.provenance) return null;
    // Kabuuan ng mga ₱ amounts sa ingredients (integer at may comma support)
    let estimatedTotal = 0;
    spec.ingredients.forEach((ing) => {
      const match = ing.amount?.match(/₱\s?([\d,]+(?:\.\d+)?)/);
      if (match) {
        estimatedTotal += parseFloat(match[1].replace(/,/g, ""));
      }
    });

    if (estimatedTotal > 0) {
      const rounded = Math.round(estimatedTotal);
      return (
        <div className="mb-3 flex flex-col items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <IconPeso className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                Tinatayang Gastos sa Palengke
              </p>
              <p className="text-[11px] text-muted">
                {answer.provenance?.status === "estimate"
                  ? "Fallback market estimate"
                  : answer.provenance?.status === "needs_review"
                    ? "Price feed — verify muna"
                    : "Market price reference"} para sa {spec.servings || "4-6 pax"}
              </p>
            </div>
          </div>
          <span className="shrink-0 text-base font-black text-amber-600 dark:text-amber-400 sm:text-right">
            ≈ ₱{rounded}–₱{Math.round(rounded * 1.2)}
          </span>
        </div>
      );
    }
  }

  return null;
}
