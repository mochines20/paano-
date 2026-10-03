import { cleanStepText } from "@/components/answer/formatStepText";

export function StepsList({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-3 space-y-2 border-t border-line pt-3 sm:mt-4 sm:pt-4">
      {steps.map((step, i) => (
        <li
          key={i}
          className="animate-fade-up flex gap-2 text-xs leading-relaxed text-body sm:gap-2.5 sm:text-sm"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-[11px] font-bold text-foreground ring-1 ring-line transition-transform duration-150 hover:scale-110">
            {i + 1}
          </span>
          <span className="break-words text-pretty">{cleanStepText(step)}</span>
        </li>
      ))}
    </ol>
  );
}
