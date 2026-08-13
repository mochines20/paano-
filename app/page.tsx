import { AskInput } from "@/components/AskInput";
import { StickyAsk } from "@/components/StickyAsk";
import {
  IconCommute,
  IconCooking,
  IconDiy,
  IconFirstAid,
  IconDocs,
} from "@/components/icons";

const FEATURES = [
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
      <section className="mx-auto max-w-3xl px-4 pb-8 pt-10 text-center sm:pt-14">
        <span className="mb-3 inline-block rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-orange-400 ring-1 ring-zinc-800">
          Taglish · Hyper-local · Praktikal
        </span>
        <h1 className="text-3xl font-black leading-tight tracking-tight text-zinc-50 sm:text-5xl">
          Ang praktikal na <span className="text-orange-500">“paano”</span>
          <br className="hidden sm:block" /> para sa buhay sa Pilipinas.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Commute, lutong bahay, gawa-bahay — sagot na parang tita o kuya na
          ginawa na ito: Taglish, step-by-step, at kung hindi sigurado,
          ituturo ka sa opisyal na source.
        </p>

        <div id="hero-ask" className="mx-auto mt-6 max-w-xl">
          <AskInput />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {TRUST_PILLS.map((pill) => (
            <span
              key={pill}
              className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] font-medium text-zinc-400"
            >
              <span className="h-1 w-1 rounded-full bg-orange-500" />
              {pill}
            </span>
          ))}
        </div>
      </section>

      {/* Feature cards — pare-parehong laki, 5-col desktop / 1-col mobile */}
      <section className="mx-auto max-w-3xl px-4 pb-12">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {FEATURES.map((f) => (
            <article
              key={f.key}
              className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-orange-500/50"
            >
              <f.icon className="h-6 w-6 text-orange-500" />
              <h2 className="text-sm font-bold text-zinc-100">{f.title}</h2>
              <p className="text-xs leading-relaxed text-zinc-400">{f.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
