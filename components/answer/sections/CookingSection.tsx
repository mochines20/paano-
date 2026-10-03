import { useState } from "react";
import { SectionTitle } from "@/components/answer/SectionTitle";
import type { PaanoAnswer } from "@/lib/answers";

type CookingSpec = Extract<
  PaanoAnswer["category_specific"],
  { category: "cooking" }
>;

/**
 * Numeric scaling ng amount string: "1.5 tasa" ×2 → "3 tasa (×2)".
 * Bumalik ng null kung walang numero na pwedeng i-scale.
 */
export function scaleAmount(amount: string, mult: number): string | null {
  if (mult === 1) return null;
  const m = amount.match(/(\d+\s*\/\s*\d+|\d+(?:\.\d+)?)/);
  if (!m) return null;
  const token = m[1].replace(/\s+/g, "");
  const scaledValue = token.includes("/")
    ? (() => {
        const [numerator, denominator] = token.split("/").map(Number);
        return denominator ? numerator / denominator : Number.NaN;
      })()
    : Number(token);
  if (!Number.isFinite(scaledValue)) return null;
  const scaled = scaledValue * mult;
  const pretty = Number.isInteger(scaled)
    ? String(scaled)
    : String(Math.round(scaled * 10) / 10);
  return `${amount.replace(m[1], pretty)} (${mult}x)`;
}

function baseServingCount(servings: string): number {
  const firstNumber = servings.match(/\d+/)?.[0];
  const parsed = firstNumber ? Number(firstNumber) : 4;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 4;
}

/** Cooking section — interactive ingredient checklist + portion scaler + tips. */
export function CookingSection({
  spec,
  tint,
  border,
}: {
  spec: CookingSpec;
  tint: string;
  border: string;
}) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [portionScale, setPortionScale] = useState<number>(1);
  const basePeople = baseServingCount(spec.servings);
  const portionOptions = [
    { label: `${Math.max(1, Math.round(basePeople * 0.5))} tao`, mult: 0.5 },
    { label: `${basePeople} tao`, mult: 1 },
    { label: `${Math.round(basePeople * 1.5)} tao`, mult: 1.5 },
    { label: `${basePeople * 2} tao`, mult: 2 },
  ];

  const toggleCheck = (item: string) => {
    setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const onCheckKey = (item: string) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleCheck(item);
    }
  };

  const totalIngredients = spec.ingredients.length;
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <>
      <div className="mb-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SectionTitle>Sangkap Checklist</SectionTitle>
          <p className="mt-0.5 text-[11px] text-muted">Piliin kung ilang tao ang kakain.</p>
        </div>

        <div className="flex flex-wrap items-center justify-start gap-1 self-start sm:justify-end sm:self-auto">
          <span className="mr-1 text-[11px] font-semibold text-muted">Dami ng kakain:</span>
          {portionOptions.map((s) => (
            <button
              key={s.label}
              onClick={() => setPortionScale(s.mult)}
              aria-pressed={portionScale === s.mult}
              aria-label={`Ipakita ang sangkap para sa ${s.label}`}
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold transition-all focus-ring ${
                portionScale === s.mult
                  ? "bg-blue-600 text-white ring-1 ring-blue-500"
                  : "bg-panel text-muted hover:bg-panel-strong"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {totalIngredients > 0 && (
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs text-blue-700 dark:text-blue-300">
          <span className="min-w-0">
            Pantry Ready: {checkedCount} of {totalIngredients} sangkap
          </span>
          <div
            className="h-1.5 w-24 overflow-hidden rounded-full bg-panel-strong"
            role="progressbar"
            aria-valuenow={checkedCount}
            aria-valuemin={0}
            aria-valuemax={totalIngredients}
            aria-label="Progress ng checklist"
          >
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(checkedCount / totalIngredients) * 100}%` }}
            />
          </div>
        </div>
      )}

      <ul
        className={`space-y-1.5 rounded-xl border p-2.5 text-sm text-body sm:p-3 ${tint} ${border}`}
      >
        {spec.ingredients.map((ing, i) => {
          const isChecked = !!checkedItems[ing.item];
          return (
            <li
              key={i}
              role="checkbox"
              aria-checked={isChecked}
              tabIndex={0}
              onClick={() => toggleCheck(ing.item)}
              onKeyDown={onCheckKey(ing.item)}
              aria-label={`${isChecked ? "Mayroon na" : "Wala pa"}: ${ing.item}`}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg p-1.5 transition-colors ${
                isChecked ? "bg-blue-500/10 text-muted" : "hover:bg-panel"
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                    isChecked ? "border-blue-500 bg-blue-500 text-white" : "border-line-strong bg-deep/60"
                  }`}
                  aria-hidden
                >
                  {isChecked ? (
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : null}
                </span>
                <span className={`min-w-0 break-words ${isChecked ? "line-through" : ""}`}>{ing.item}</span>
              </div>
              {ing.amount && (
                <span className="max-w-[42%] shrink-0 break-words text-right text-xs font-medium text-blue-700 dark:text-blue-300">
                  {scaleAmount(ing.amount, portionScale) ?? ing.amount}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {spec.tips.length > 0 && (
        <>
          <SectionTitle>Luto Tips ni Tita / Kuya</SectionTitle>
          <ul className="space-y-1.5 text-xs text-body sm:text-sm">
            {spec.tips.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <span className="text-balance leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
