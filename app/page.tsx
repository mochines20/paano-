import { AskInput } from "@/components/AskInput";
import { StickyAsk } from "@/components/StickyAsk";
import { HomeFeatures } from "@/components/HomeFeatures";

const TRUST_PILLS = [
  "Praktikal, hindi trivia",
  "May tantiyang presyo",
  "May source kapag kailangan",
];

export default function Home() {
  return (
    <main className="relative flex-1 overflow-hidden">
      <StickyAsk />

      {/* Hero + trust pills — ang nag-iisang CTA */}
      <section className="relative z-10 mx-auto max-w-3xl px-4 pb-8 pt-6 text-center sm:pt-12">
        <h1
          className="animate-fade-up text-balance text-3xl font-black leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          style={{ animationDelay: "60ms" }}
        >
          Praktikal na sagot sa{" "}
          <span className="text-accent">“paano”</span>
          <br className="hidden sm:block" /> ng araw-araw.
        </h1>

        <p
          className="animate-fade-up mx-auto mt-4 max-w-lg text-sm leading-relaxed text-body sm:mt-6 sm:text-base"
          style={{ animationDelay: "120ms" }}
        >
          Para sa commute, lutong bahay, gawaing bahay, first aid, at government
          guides — Taglish, step-by-step, at may source kapag kailangan.
        </p>

        <div
          id="hero-ask"
          className="animate-fade-up mx-auto mt-5 max-w-xl sm:mt-6"
          style={{ animationDelay: "180ms" }}
        >
          <AskInput />
          <p className="mt-2 text-[11px] text-muted">
            Mag-type ng tanong o pindutin ang mga halimbawa sa ibaba para simulan.
          </p>
        </div>

        <div
          className="animate-fade-up mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5"
          style={{ animationDelay: "240ms" }}
        >
          {TRUST_PILLS.map((pill) => (
            <span
              key={pill}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted sm:text-xs"
            >
              <svg
                className="h-3 w-3 shrink-0 text-accent"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              {pill}
            </span>
          ))}
        </div>
      </section>

      {/* Interactive features: trending chips + clickable category cards + commute form */}
      <HomeFeatures />
    </main>
  );
}
