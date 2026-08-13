import { AskInput } from "@/components/AskInput";
import { StickyAsk } from "@/components/StickyAsk";
import {
  IconCommute,
  IconCooking,
  IconDiy,
  IconFirstAid,
  IconDocs,
} from "@/components/icons";
import type { ComponentType } from "react";

const FEATURES: {
  key: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
}[] = [
  {
    key: "commute",
    icon: IconCommute,
    title: "Commute",
    text: "Jeep, bus, LRT — ruta, pamasahe, at oras na alam ng lokal.",
  },
  {
    key: "cooking",
    icon: IconCooking,
    title: "Lutong Bahay",
    text: "Recipe mula sa palengke, may scaling para sa 10 tao.",
  },
  {
    key: "diy",
    icon: IconDiy,
    title: "Gawa-Bahay",
    text: "Tumutulong gripo, stained na damit — hakbang-hakbang.",
  },
  {
    key: "first_aid",
    icon: IconFirstAid,
    title: "First Aid",
    text: "Household scenarios lang, may “pumunta sa doktor” threshold.",
  },
  {
    key: "docs",
    icon: IconDocs,
    title: "Docs Guide",
    text: "Requirements at fees sa Taglish, link sa opisyal na site.",
  },
];

const TRUST_PILLS = [
  "Scoped, hindi trivia",
  "Tantiya ang presyo",
  "Itinuturo sa opisyal source",
];

export default function Home() {
  return (
    <main className="relative flex-1 overflow-hidden">
      <StickyAsk />

      {/* Decorative background blurs — hidden on mobile para walang overflow */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 hidden h-96 w-96 -translate-x-1/2 rounded-full bg-orange-500/10 blur-3xl sm:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-40 right-0 hidden h-64 w-64 rounded-full bg-pink-500/6 blur-3xl sm:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-40 left-0 hidden h-64 w-64 rounded-full bg-cyan-500/6 blur-3xl sm:block"
        aria-hidden
      />

      {/* Hero + trust pills — ang nag-iisang CTA */}
      <section className="relative z-10 mx-auto max-w-3xl px-4 pb-8 pt-8 text-center sm:pt-16">
        <span
          className="animate-fade-up mb-4 inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300"
          style={{ animationDelay: "0ms" }}
        >
          <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-orange-500" />
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
          className="animate-fade-up mx-auto mt-3 max-w-lg text-sm leading-relaxed text-zinc-400 sm:mt-4 sm:text-base"
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
          <p className="mt-2 text-[11px] text-zinc-500">
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
              className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-[11px] font-medium text-zinc-400 backdrop-blur sm:px-3"
            >
              <svg
                className="h-3 w-3 shrink-0 text-orange-500"
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

      {/* Feature cards — responsive: 2 cols mobile, 3 cols sm, 5 cols md+ */}
      <section className="relative z-10 mx-auto max-w-3xl px-4 pb-16 sm:pb-20">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-5">
          {FEATURES.map((f, i) => (
            <article
              key={f.key}
              className="group animate-fade-up flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3 backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-orange-500/60 hover:bg-zinc-900 hover:shadow-lg hover:shadow-orange-500/10 sm:gap-3 sm:p-4"
              style={{ animationDelay: `${280 + i * 70}ms` }}
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800/80 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3 sm:h-10 sm:w-10">
                <f.icon className="h-5 w-5 text-orange-500" />
              </span>
              <h2 className="text-xs font-bold text-zinc-100 sm:text-sm">{f.title}</h2>
              <p className="text-[11px] leading-relaxed text-zinc-400 sm:text-xs">{f.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
