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
    <main className="flex-1">
      <StickyAsk />

      {/* Hero + trust pills — ang nag-iisang CTA */}
      <section className="hero-mesh relative mx-auto max-w-3xl px-4 pb-8 pt-10 text-center sm:pt-16">
        <span
          className="animate-fade-up mb-3 inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-orange-400 ring-1 ring-zinc-800"
          style={{ animationDelay: "0ms" }}
        >
          <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-orange-500" />
          Taglish · Hyper-local · Praktikal
        </span>
        <h1
          className="animate-fade-up text-3xl font-black leading-tight tracking-tight text-zinc-50 sm:text-5xl"
          style={{ animationDelay: "60ms" }}
        >
          Ang praktikal na{" "}
          <span className="gradient-text">“paano”</span>
          <br className="hidden sm:block" /> para sa buhay sa Pilipinas.
        </h1>
        <p
          className="animate-fade-up mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base"
          style={{ animationDelay: "120ms" }}
        >
          Commute, lutong bahay, gawa-bahay — sagot na parang tita o kuya na
          ginawa na ito: Taglish, step-by-step, at kung hindi sigurado,
          ituturo ka sa opisyal na source.
        </p>

        <div
          id="hero-ask"
          className="animate-fade-up mx-auto mt-6 max-w-xl"
          style={{ animationDelay: "180ms" }}
        >
          <AskInput />
        </div>

        <div
          className="animate-fade-up mt-3 flex flex-wrap items-center justify-center gap-2"
          style={{ animationDelay: "240ms" }}
        >
          {TRUST_PILLS.map((pill) => (
            <span
              key={pill}
              className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] font-medium text-zinc-400"
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
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {FEATURES.map((f, i) => (
            <article
              key={f.key}
              className="group animate-fade-up flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-orange-500/60 hover:shadow-lg hover:shadow-orange-500/10"
              style={{ animationDelay: `${280 + i * 70}ms` }}
            >
              <span className="transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3">
                <f.icon className="h-6 w-6 text-orange-500" />
              </span>
              <h2 className="text-sm font-bold text-zinc-100">{f.title}</h2>
              <p className="text-xs leading-relaxed text-zinc-400">{f.text}</p>
            </article>
          ))}
        </div>

        {/* Scroll cue — malambot na pointer pababa */}
        <div className="mt-10 flex justify-center">
          <span
            className="animate-float-soft text-zinc-600"
            aria-hidden
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </span>
        </div>
      </section>
    </main>
  );
}
