import { useState } from "react";
import { IconAlert, IconArrowRight, IconSwap } from "@/components/icons";
import { findSubstitutesForItems } from "@/lib/substitutes";

/** "Diskarte & Pamalit" — mga substitute sa kulang na sangkap o gamit. */
export function SubstitutesSection({
  substitutes,
}: {
  substitutes: ReturnType<typeof findSubstitutesForItems>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-3 rounded-2xl border border-amber-500/30 bg-deep/40 p-3 backdrop-blur sm:p-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <IconSwap className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <h4 className="text-xs font-bold text-amber-700 dark:text-amber-300">
              Diskarte &amp; Pamalit (Sari-Sari Store &amp; Tool Hacks)
            </h4>
            <p className="text-[11px] text-muted">
              Kulang ang sangkap o gamit? Eto ang puwedeng pamalit.
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          className="rounded-full bg-panel px-2.5 py-1 text-[11px] font-bold text-body transition-colors hover:bg-panel-strong focus-ring"
        >
          {expanded ? "Itago ▲" : `Tingnan (${substitutes.length}) ▼`}
        </button>
      </div>

      {expanded && (
        <div className="animate-slide-down mt-3 space-y-2.5 border-t border-line pt-2">
          {substitutes.some((s) => s.category === "diy") && (
            <p className="flex items-start gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-medium text-rose-700 dark:text-rose-200">
              <IconAlert className="mt-px h-3.5 w-3.5 shrink-0" />
              Babala: Hindi pamalit ang mga DIY hack para sa kuryente, gas, pressure, structural, o sharp tool repairs. Tawag ang lisensyadong tekniko para sa mga ito.
            </p>
          )}
          {substitutes.map((sub) => (
            <div
              key={sub.id}
              className="rounded-xl border border-line bg-panel p-2.5 backdrop-blur"
            >
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                Walang {sub.original}?
              </p>
              <ul className="mt-1 space-y-1 text-xs text-body">
                {sub.substitutes.map((item, idx) => (
                  <li key={idx} className="flex flex-col">
                    <span className="flex items-start gap-1 font-semibold text-foreground">
                      <IconArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                      <span>
                        {item.name}:{" "}
                        <span className="font-normal text-amber-700 dark:text-amber-200">
                          {item.ratioOrHow}
                        </span>
                      </span>
                    </span>
                    {item.note && (
                      <span className="pl-4 text-[11px] italic text-muted">{item.note}</span>
                    )}
                    {item.safety && (
                      <span className="flex items-center gap-1 pl-4 text-[11px] font-medium text-rose-600 dark:text-rose-300">
                        <IconAlert className="h-3 w-3 shrink-0" />
                        {item.safety}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
