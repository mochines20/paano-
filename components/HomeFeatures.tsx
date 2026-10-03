"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CommuteForm } from "@/components/CommuteForm";
import {
  IconCommute,
  IconCooking,
  IconDiy,
  IconFirstAid,
  IconDocs,
  IconFlame,
} from "@/components/icons";
import type { ComponentType } from "react";

const CATEGORIES: {
  key: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
  /** Curated query — kung walang special flow, i-redirect sa /paano?q= */
  query?: string;
  /** Kung true, buksan ang CommuteForm modal imbes na redirect */
  opensCommuteForm?: boolean;
  /** Per-category tint para hindi mag-blur ang mga icons */
  iconBg: string;
  iconText: string;
}[] = [
  {
    key: "commute",
    icon: IconCommute,
    title: "Commute",
    text: "Jeep, bus, LRT — ruta, pamasahe, at oras.",
    opensCommuteForm: true,
    iconBg: "bg-sky-500/15",
    iconText: "text-sky-600 dark:text-sky-300",
  },
  {
    key: "cooking",
    icon: IconCooking,
    title: "Lutong Bahay",
    text: "Recipe mula sa palengke, may scaling para sa 10 tao.",
    query: "Paano magluto ng chicken adobo para sa 4 na tao?",
    iconBg: "bg-blue-500/15",
    iconText: "text-blue-700 dark:text-blue-300",
  },
  {
    key: "diy",
    icon: IconDiy,
    title: "Gawaing Bahay",
    text: "Tumutulong gripo, stained na damit — hakbang-hakbang.",
    query: "Paano ayusin ang tumutulong gripo?",
    iconBg: "bg-emerald-500/15",
    iconText: "text-emerald-600 dark:text-emerald-300",
  },
  {
    key: "first_aid",
    icon: IconFirstAid,
    title: "First Aid",
    text: "Household scenarios, may 'pumunta sa doktor' threshold.",
    query: "Ano ang gagawin sa heat rash ng bata?",
    iconBg: "bg-rose-500/15",
    iconText: "text-rose-600 dark:text-rose-300",
  },
  {
    key: "docs",
    icon: IconDocs,
    title: "Docs Guide",
    text: "Requirements at fees sa Taglish, link sa opisyal na site.",
    query: "Paano kumuha ng NBI clearance?",
    iconBg: "bg-blue-500/15",
    iconText: "text-blue-700 dark:text-blue-300",
  },
];

/**
 * HomeFeatures — client-side interactive layer para sa landing page.
 * Handles: clickable category cards, CommuteForm modal, at trending chips.
 */
export function HomeFeatures() {
  const router = useRouter();
  const [commuteFormOpen, setCommuteFormOpen] = useState(false);
  const [trending, setTrending] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/trending")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.trending) && d.trending.length > 0) {
          setTrending(d.trending.slice(0, 6));
        }
      })
      .catch(() => {});
  }, []);

  function handleCategoryClick(cat: (typeof CATEGORIES)[number]) {
    if (cat.opensCommuteForm) {
      setCommuteFormOpen(true);
    } else if (cat.query) {
      router.push(`/paano?q=${encodeURIComponent(cat.query)}`);
    }
  }

  return (
    <>
      {/* Trending chips — sa ilalim ng search bar */}
      {trending.length > 0 && (
        <div
          className="animate-fade-up relative z-10 mx-auto mt-6 max-w-3xl border-t border-line px-4 pt-5"
          style={{ animationDelay: "200ms" }}
        >
          <p className="mb-2 flex items-center justify-center gap-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
            <IconFlame className="h-3.5 w-3.5 text-accent" aria-hidden />
            Pinapagtanungan ngayon
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
            {trending.map((s) => (
              <button
                key={s}
                onClick={() => router.push(`/paano?q=${encodeURIComponent(s)}`)}
                className="glass-pill rounded-full px-3 py-1.5 text-[11px] font-medium text-body backdrop-blur transition-all duration-150 hover:border-accent/40 hover:text-accent active:scale-95 focus-ring sm:text-xs"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feature cards — clickable, glassmorphism */}
      <section className="relative z-10 mx-auto max-w-3xl px-4 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-5">
          {CATEGORIES.map((f, i) => (
            <button
              key={f.key}
              onClick={() => handleCategoryClick(f)}
              className="group animate-fade-up min-w-0 flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3 text-left shadow-lg transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/10 active:scale-[0.98] focus-ring sm:gap-3 sm:p-4"
              style={{ animationDelay: `${280 + i * 70}ms` }}
            >
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line ${f.iconBg} transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3 sm:h-10 sm:w-10`}>
                <f.icon className={`h-5 w-5 ${f.iconText}`} />
              </span>
              <h2 className="text-xs font-bold text-foreground sm:text-sm">{f.title}</h2>
              <p className="text-[11px] leading-relaxed text-muted sm:text-xs">{f.text}</p>
              <span className={`mt-auto inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide ${f.iconText}`}>
                {f.opensCommuteForm ? "Buksan ang form" : "Magtanong"} →
              </span>
            </button>
          ))}
        </div>
      </section>

      <CommuteForm
        isOpen={commuteFormOpen}
        onClose={() => setCommuteFormOpen(false)}
      />
    </>
  );
}
