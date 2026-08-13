import Link from "next/link";

const PILLARS = [
  {
    key: "commute",
    tag: "Flagship",
    title: "Commute",
    text: "Jeepney, bus, LRT, tricycle — ruta, pamasahe, at oras ng byahe na alam ng lokal, hindi lang ng Google Maps.",
    color: "bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-100",
  },
  {
    key: "cooking",
    tag: "Lutong Bahay",
    title: "Lutong Bahay",
    text: "Recipe na may sangkap na nabibili sa palengke o sari-sari store, may scaling para sa 10 tao o buong barkada.",
    color: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100",
  },
  {
    key: "diy",
    tag: "Gawa-Bahay",
    title: "Gawa-Bahay",
    text: "Tumutulong gripo, stained na damit, sirang ilaw — hakbang-hakbang na ayos na kayang gawin ng sinuman.",
    color: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100",
  },
];

const SECONDARY = [
  {
    key: "first_aid",
    title: "First Aid (bahay)",
    text: "Karaniwang household scenarios lang — may malinaw na 'kung lumala, pumunta sa doktor' threshold. Hindi kami doktor.",
    color: "bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-100",
  },
  {
    key: "docs",
    title: "Docs Guide",
    text: "Plain-language requirements at fees — na may link papunta sa opisyal na eGovPH o ahensya. Hindi kami transaksyon.",
    color: "bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-100",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pb-10 pt-16 text-center sm:pt-24">
        <span className="mb-4 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
          Taglish · Hyper-local · Praktikal
        </span>
        <h1 className="text-4xl font-black leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Ang praktikal na <span className="text-amber-500">“paano”</span>
          <br />
          para sa buhay sa Pilipinas.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg">
          Commute, lutong bahay, gawa-bahay — sinasagot na parang tita o kuya na
          ginawa na ito: Taglish, step-by-step, at kung hindi sigurado, ituturo
          ka sa opisyal na source.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/paano"
            className="w-full rounded-full bg-amber-500 px-8 py-3.5 text-base font-bold text-zinc-950 transition-colors hover:bg-amber-400 sm:w-auto"
          >
            Itanong ngayon
          </Link>
          <Link
            href="#kung-ano"
            className="w-full rounded-full border border-zinc-300 px-8 py-3.5 text-base font-semibold text-zinc-700 transition-colors hover:border-zinc-500 sm:w-auto dark:border-zinc-700 dark:text-zinc-300"
          >
            Ano ang kaya nito
          </Link>
        </div>
      </section>

      {/* Pillars */}
      <section id="kung-ano" className="mx-auto max-w-3xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {PILLARS.map((p) => (
            <article key={p.key} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <span className={`mb-3 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${p.color}`}>
                {p.tag}
              </span>
              <h2 className="mb-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">{p.title}</h2>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{p.text}</p>
            </article>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {SECONDARY.map((s) => (
            <article key={s.key} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <span className={`mb-3 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${s.color}`}>
                {s.title}
              </span>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{s.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Bakit ka magtitiwala?
          </h2>
          <ul className="space-y-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            <li>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Scoped, hindi generic.</span>{" "}
              Hindi trivia — commute, lutong bahay, at gawa-bahay lang ang malalim na sagot.
            </li>
            <li>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Range, hindi eksaktong numero.</span>{" "}
              Ang pamasahe at fees ay maaaring magbago — lagi naming sinasabi kung tantiya lang.
            </li>
            <li>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Health at docs = redirection.</span>{" "}
              Hindi kami doktor o ahensya. Kung hindi sigurado, tuturo ka namin sa opisyal na source.
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 py-10 text-center">
        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
          May gagawin ka ba ngayon?
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Tanong lang — sagot agad sa Taglish.
        </p>
        <Link
          href="/paano"
          className="mt-5 inline-block rounded-full bg-amber-500 px-8 py-3.5 text-base font-bold text-zinc-950 transition-colors hover:bg-amber-400"
        >
          Itanong sa PAANO
        </Link>
      </section>
    </main>
  );
}
