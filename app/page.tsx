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

      {/* Decorative background blurs */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-orange-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-40 right-0 h-64 w-64 rounded-full bg-pink-500/6 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-40 left-0 h-64 w-64 rounded-full bg-cyan-500/6 blur-3xl"
        aria-hidden
      />

      {/* Hero + trust pills — ang nag-iisang CTA */}
      <section className="relative z-10 mx-auto max-w-3xl px-4 pb-8 pt-10 text-center sm:pt-16">
        <span
          className="animate-fade-up mb-4 inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300"
          style={{ animationDelay: "0ms" }}
        >
          <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-orange-500" />
          Taglish · Hyper-local · Praktikal
        </span>

        <h1
          className="animate-fade-up text-balance text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl"
          style={{ animationDelay: "60ms" }}
        >
          Ang praktikal na{" "}
          <span className="gradient-text">“paano”</span>
          <br className="hidden sm:block" /> para sa buhay sa Pilipinas.
        </h1>

        <p
          className="animate-fade-up mx-auto mt-4 max-w-lg text-base leading-relaxed text-zinc-400"
          style={{ animationDelay: "120ms" }}
        >
          Commute, lutong bahay, gawa-bahay — sagot na parang tita o kuya na
          ginawa na ito. Taglish, step-by-step, at laging may opisyal na link
          kung kailangang i-verify.
        </p>

        <div
          id="hero-ask"
          className="animate-fade-up mx-auto mt-8 max-w-xl"
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
              className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-[11px] font-medium text-zinc-400 backdrop-blur"
            >
              <svg
                className="h-3 w-3 text-orange-500"
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

      {/* Feature cards — pare-parehong laki, 5-col desktop / 1-col mobile */}
      <section className="relative z-10 mx-auto max-w-3xl px-4 pb-20">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {FEATURES.map((f, i) => (
            <article
              key={f.key}
              className="group animate-fade-up flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-orange-500/60 hover:bg-zinc-900 hover:shadow-lg hover:shadow-orange-500/10"
              style={{ animationDelay: `${280 + i * 70}ms` }}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/80 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3">
                <f.icon className="h-5 w-5 text-orange-500" />
              </span>
              <h2 className="text-sm font-bold text-zinc-100">{f.title}</h2>
              <p className="text-xs leading-relaxed text-zinc-400">{f.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
