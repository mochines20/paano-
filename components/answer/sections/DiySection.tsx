import { SectionTitle } from "@/components/answer/SectionTitle";
import { CATEGORY_META } from "@/components/answer/meta";
import { IconAlert } from "@/components/icons";
import type { PaanoAnswer } from "@/lib/answers";

type DiySpec = Extract<PaanoAnswer["category_specific"], { category: "diy" }>;

export function DiySection({
  spec,
  tint,
}: {
  spec: DiySpec;
  tint: string;
}) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
      {spec.tools.length > 0 && (
        <div className={`rounded-xl border p-2.5 sm:p-3 ${tint} ${CATEGORY_META.diy.border}`}>
          <SectionTitle>Tools na Kailangan</SectionTitle>
          <ul className="space-y-1 text-xs text-body sm:text-sm">
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
        <div className={`rounded-xl border p-2.5 sm:p-3 ${tint} ${CATEGORY_META.diy.border}`}>
          <SectionTitle>Materyales / Pyesa</SectionTitle>
          <ul className="space-y-1 text-xs text-body sm:text-sm">
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
        <div className="col-span-full flex items-start gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-200">
          <IconAlert className="mt-px h-3.5 w-3.5 shrink-0" />
          <span>
            <span className="font-bold">Paalala sa Kaligtasan:</span>{" "}
            {spec.safety_warning}
          </span>
        </div>
      )}
    </div>
  );
}
