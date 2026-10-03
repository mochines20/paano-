import { CATEGORY_META } from "@/components/answer/meta";
import { IconAlert, IconCheckCircle } from "@/components/icons";
import type { PaanoAnswer } from "@/lib/answers";

type FirstAidSpec = Extract<
  PaanoAnswer["category_specific"],
  { category: "first_aid" }
>;

/**
 * First aid section — GAWIN / HUWAG blocks + doctor threshold.
 * Note: dati ay hindi na-render ang do_list mula sa schema; ngayon may
 * "GAWIN" checklist na katabi ng "HUWAG" list.
 */
export function FirstAidSection({
  spec,
  tint,
}: {
  spec: FirstAidSpec;
  tint: string;
}) {
  return (
    <div className={`rounded-xl border p-2.5 sm:p-3 ${tint} ${CATEGORY_META.first_aid.border}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase text-rose-700 dark:text-rose-300">
          Severity: {spec.severity}
        </span>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        {spec.do_list.length > 0 && (
          <div className="rounded-lg bg-emerald-500/10 p-2 text-xs text-emerald-800 dark:text-emerald-200">
            <p className="font-bold">GAWIN:</p>
            <ul className="mt-1 space-y-0.5">
              {spec.do_list.map((d, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <IconCheckCircle className="mt-px h-3 w-3 shrink-0" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {spec.don_t_list.length > 0 && (
          <div className={`rounded-lg bg-rose-500/10 p-2 text-xs text-rose-800 dark:text-rose-200 ${spec.do_list.length === 0 ? "sm:col-span-2" : ""}`}>
            <p className="font-bold">HUWAG GAGAWIN:</p>
            <ul className="mt-1 space-y-0.5">
              {spec.don_t_list.map((d, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <IconAlert className="mt-px h-3 w-3 shrink-0" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
        Kailan dapat pumunta sa doktor:
      </p>
      <p className="mt-0.5 text-xs leading-relaxed text-body">{spec.see_doctor_threshold}</p>
    </div>
  );
}
