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
}[] = [
  {
    key: "commute",
    icon: IconCommute,
    title: "Commute",
    text: "Jeep, bus, LRT — ruta, pamasahe, at oras.",
    opensCommuteForm: true,
  },
  {
    key: "cooking",
    icon: IconCooking,
    title: "Lutong Bahay",
    text: "Recipe mula sa palengke, may scaling para sa 10 tao.",
    query: "Paano magluto ng chicken adobo para sa 4 na tao?",
  },
  {
    key: "diy",
    icon: IconDiy,
    title: "Gawa-Bahay",
    text: "Tumutulong gripo, stained na damit — hakbang-hakbang.",
    query: "Paano ayusin ang tumutulong gripo?",
  },
  {
    key: "first_aid",
    icon: IconFirstAid,
    title: "First Aid",
    text: "Household scenarios, may 'pumunta sa doktor' threshold.",
    query: "Ano ang gagawin sa heat rash ng bata?",
  },
  {
    key: "docs",
    icon: IconDocs,
    title: "Docs Guide",
    text: "Requirements at fees sa Taglish, link sa opisyal na site.",
    query: "Paano kumuha ng NBI clearance?",
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
        <div className="animate-fade-up mt-4" style={{ animationDelay: "200ms" }}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            🔥 Pinapagtanungan ngayon
          </p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {trending.map((s) => (
              <button
                key={s}
                onClick={() => router.push(`/paano?q=${encodeURIComponent(s)}`)}
                className="glass-pill rounded-full px-3 py-1.5 text-[11px] font-medium text-slate-300 backdrop-blur transition-all duration-150 hover:border-[#FBE77A]/40 hover:text-[#FBE77A] active:scale-95 focus-ring sm:text-xs"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feature cards — clickable, glassmorphism */}
      <section className="relative z-10 mx-auto max-w-3xl px-4 pb-16 sm:pb-20">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-5">
          {CATEGORIES.map((f, i) => (
            <button
              key={f.key}
              onClick={() => handleCategoryClick(f)}
              className="glass-card group animate-fade-up flex flex-col gap-2 rounded-2xl p-3 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[#FBE77A]/40 hover:shadow-lg hover:shadow-[#FBE77A]/10 active:scale-[0.98] focus-ring sm:gap-3 sm:p-4"
              style={{ animationDelay: `${280 + i * 70}ms` }}
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3 sm:h-10 sm:w-10">
                <f.icon className="h-5 w-5 text-[#FBE77A]" />
              </span>
              <h2 className="text-xs font-bold text-zinc-100 sm:text-sm">{f.title}</h2>
              <p className="text-[11px] leading-relaxed text-slate-400 sm:text-xs">{f.text}</p>
              {f.opensCommuteForm && (
                <span className="mt-auto inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-sky-300">
                  Buksan ang form →
                </span>
              )}
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
