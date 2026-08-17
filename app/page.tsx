import { AskInput } from "@/components/AskInput";
import { StickyAsk } from "@/components/StickyAsk";
import { HomeFeatures } from "@/components/HomeFeatures";

const TRUST_PILLS = [
  "Scoped, hindi trivia",
  "Tantiya ang presyo",
  "Itinuturo sa opisyal source",
];

export default function Home() {
  return (
    <main className="relative flex-1 overflow-hidden">
      <StickyAsk />

      {/* Decorative background blurs — butter yellow + prussian blue glows */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 hidden h-96 w-96 -translate-x-1/2 rounded-full bg-[#FBE77A]/10 blur-3xl sm:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-40 right-0 hidden h-64 w-64 rounded-full bg-[#125070]/25 blur-3xl sm:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-40 left-0 hidden h-64 w-64 rounded-full bg-[#0A3D5C]/25 blur-3xl sm:block"
        aria-hidden
      />

      {/* Hero + trust pills — ang nag-iisang CTA */}
      <section className="relative z-10 mx-auto max-w-3xl px-4 pb-8 pt-8 text-center sm:pt-16">
        <span
          className="animate-fade-up mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#FBE77A]/25 bg-[#FBE77A]/10 px-3 py-1 text-xs font-semibold text-[#FBE77A] backdrop-blur"
          style={{ animationDelay: "0ms" }}
        >
          <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-[#FBE77A]" />
          Taglish · Hyper-local · Praktikal
        </span>

        <h1
          className="animate-fade-up text-balance text-3xl font-black leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl"
          style={{ animationDelay: "60ms" }}
        >
          Ang praktikal na{" "}
          <span className="gradient-text">“paano”</span>
          <br className="hidden sm:block" /> para sa buhay sa Pilipinas.
        </h1>

        <p
          className="animate-fade-up mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-300 sm:mt-4 sm:text-base"
          style={{ animationDelay: "120ms" }}
        >
          Commute, lutong bahay, gawa-bahay — sagot na parang tita o kuya na
          ginawa na ito. Taglish, step-by-step, at laging may opisyal na link
          kung kailangang i-verify.
        </p>

        <div
          id="hero-ask"
          className="animate-fade-up mx-auto mt-6 max-w-xl sm:mt-8"
          style={{ animationDelay: "180ms" }}
        >
          <AskInput />
          <p className="mt-2 text-[11px] text-slate-400">
            I-type o i-tap ang examples para simulan.
          </p>
        </div>

        <div
          className="animate-fade-up mt-4 flex flex-wrap items-center justify-center gap-2"
          style={{ animationDelay: "240ms" }}
        >
          {TRUST_PILLS.map((pill) => (
            <span
              key={pill}
              className="glass-pill flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-slate-300 sm:px-3"
            >
              <svg
                className="h-3 w-3 shrink-0 text-[#FBE77A]"
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
