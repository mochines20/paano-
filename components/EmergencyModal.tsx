"use client";

import { useState } from "react";

export interface Hotline {
  id: string;
  name: string;
  agency: string;
  number: string;
  category: "all" | "medical" | "police" | "traffic" | "mental" | "poison";
  description: string;
  tollFree?: boolean;
}

export const HOTLINES: Hotline[] = [
  {
    id: "911",
    name: "National Emergency Hotline",
    agency: "Emergency 911 (PNP / BFP / Medical)",
    number: "911",
    category: "all",
    description: "Pambansang hotline para sa sunog, krimen, rescue, at medical emergencies.",
    tollFree: true,
  },
  {
    id: "red-cross",
    name: "Philippine Red Cross",
    agency: "PRC Emergency Response",
    number: "143",
    category: "medical",
    description: "Ambulansya, first aid, blood requests, at disaster relief.",
    tollFree: false,
  },
  {
    id: "mmda",
    name: "MMDA Metrobase & Road Emergency",
    agency: "Metropolitan Manila Development Authority",
    number: "136",
    category: "traffic",
    description: "Aksidente sa kalsada, towing assistance, baha, at traffic advisory sa Metro Manila. Tumatawag lang para sa Metro Manila.",
    tollFree: true,
  },
  {
    id: "ncmh",
    name: "DOH National Mental Health Crisis Hotline",
    agency: "National Center for Mental Health",
    number: "1553",
    category: "mental",
    description: "24/7 libreng psychiatric at psychological crisis support sa buong bansa.",
    tollFree: true,
  },
  {
    id: "poison",
    name: "PGH National Poison Control Center",
    agency: "UP-PGH Poison Management & Control",
    number: "0285241078",
    category: "poison",
    description: "Tulong sa nalason (kemikal, gamot, kagat ng ahas/insekto, expired na pagkain). Pang-Manila ito; i-verify ang regional poison center kung sakaling nasa probinsya.",
  },
  {
    id: "bfp",
    name: "Bureau of Fire Protection",
    agency: "BFP Central Hotline",
    number: "1342",
    category: "all",
    description: "Sunog, rescue operations, at gas leak emergencies.",
    tollFree: true,
  },
  {
    id: "pnp",
    name: "PNP Police Emergency (Patrol 117)",
    agency: "Philippine National Police",
    number: "117",
    category: "police",
    description: "Pulis assistance, krimen, at peace and order concerns. May text-to-117 support sa ilang lugar.",
  },
  {
    id: "coast-guard",
    name: "Philippine Coast Guard",
    agency: "PCG Search and Rescue",
    number: "0285278481",
    category: "all",
    description: "Maritime rescue, baha sa baybayin, at sea travel emergencies.",
  },
];

function formatHotlineNumber(raw: string): string {
  // 3-digit short codes: 911, 143, 136, 117, 1553, 1342
  if (raw.length <= 4) return raw;
  // PGH / Coast Guard style: 0285241078 -> 02 8524 1078
  if (raw.startsWith("02") && raw.length === 10) {
    return `${raw.slice(0, 2)} ${raw.slice(2, 6)} ${raw.slice(6)}`;
  }
  return raw;
}

export function EmergencyModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<Hotline["category"]>("all");
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filtered = HOTLINES.filter((h) => {
    const matchesCategory = filter === "all" || h.category === filter;
    const matchesSearch =
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.agency.toLowerCase().includes(search.toLowerCase()) ||
      h.description.toLowerCase().includes(search.toLowerCase()) ||
      h.number.includes(search);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#021B30]/70 p-3 backdrop-blur-md sm:p-4 animate-fade-up">
      <div className="glass-strong relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border-rose-400/30 shadow-2xl shadow-rose-950/40">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-900/40 via-rose-800/30 to-transparent p-4 border-b border-rose-400/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40">
                <svg
                  className="h-5 w-5 animate-pulse-dot"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
              <div>
                <h2 className="text-base font-black text-white sm:text-lg">
                  🚨 Saklolo — Emergency Hotlines
                </h2>
                <p className="text-[11px] font-medium text-rose-300">
                  One-tap dial sa mga opisyal na ahensya sa Pilipinas
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Isara ang emergency hotlines"
              className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 backdrop-blur hover:bg-white/10 hover:text-white active:scale-95 transition-colors focus-ring"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "Lahat" },
              { id: "medical", label: "🚑 Medikal" },
              { id: "police", label: "👮 Pulis" },
              { id: "traffic", label: "🚗 Trapiko (MMDA)" },
              { id: "mental", label: "🧠 Mental Health" },
              { id: "poison", label: "🧪 Lason (PGH)" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as Hotline["category"])}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-all ${
                  filter === tab.id
                    ? "bg-rose-500 text-zinc-950 shadow-md shadow-rose-500/20"
                    : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 backdrop-blur"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search input */}
        <div className="p-3 border-b border-white/10 bg-white/5 backdrop-blur">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Maghanap ng ahensya o emergency (hal. 'sunog', 'ambulansya', 'lason')..."
            className="w-full rounded-xl border border-white/10 bg-[#021B30]/40 px-3.5 py-2 text-xs text-white placeholder:text-slate-400 outline-none backdrop-blur focus:border-rose-400"
          />
        </div>

        {/* Hotlines List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500">
              Walang nahanap na hotline para sa iyong search.
            </div>
          ) : (
            <>
              {/* Highlighted 911 banner (only when not filtered out) */}
              {filtered.some((h) => h.id === "911") && (
                <a
                  href="tel:911"
                  className="flex items-center justify-between gap-3 rounded-2xl border-2 border-rose-500 bg-gradient-to-r from-rose-600/30 to-red-700/20 p-4 shadow-lg shadow-rose-900/30 transition-all hover:from-rose-600/40 active:scale-[0.99] focus-ring"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🚨</span>
                      <h3 className="text-base font-black text-white">911 — National Emergency</h3>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.2 text-[9px] font-extrabold text-emerald-300">
                        TOLL-FREE
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-rose-100 leading-relaxed">
                      Sunog, krimen, rescue, o medical emergency? I-tap para tumawag agad sa 911.
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-rose-600/30">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Tawag 911
                  </span>
                </a>
              )}

              {filtered
                .filter((h) => h.id !== "911")
                .map((hotline) => (
                  <div
                    key={hotline.id}
                    className="glass-card flex items-center justify-between gap-3 rounded-2xl p-3.5 transition-all hover:border-rose-400/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{hotline.name}</h3>
                        {hotline.tollFree && (
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.2 text-[9px] font-extrabold text-emerald-300">
                            TOLL-FREE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-rose-300 font-medium">{hotline.agency}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-400 leading-relaxed">
                        {hotline.description}
                      </p>
                    </div>

                    <a
                      href={`tel:${hotline.number}`}
                      className="flex shrink-0 items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-rose-600/30 transition-all hover:bg-rose-500 active:scale-95 focus-ring"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      Tawagan ({formatHotlineNumber(hotline.number)})
                    </a>
                  </div>
                ))}
            </>
          )}
        </div>

        {/* Footer tips + disclaimers */}
        <div className="space-y-2 bg-[#021B30]/40 p-3 border-t border-white/10 backdrop-blur">
          <p className="text-center text-[10px] text-zinc-400">
            Tip sa pagtawag: Sabihin agad ang iyong <span className="text-zinc-200 font-bold">lokasyon</span> at <span className="text-zinc-200 font-bold">kung may nasugatan</span> bago magpaliwanag.
          </p>
          <ul className="space-y-1 text-[9px] leading-relaxed text-zinc-500">
            <li>• Gumamit lamang ng emergency services para sa tunay na emergency.</li>
            <li>• Maaaring mag-iba ang routing at availability ng numero depende sa lokasyon; i-verify sa inyong LGU.</li>
            <li>• Para sa medical emergency, tumawag sa 911 o magtungo sa pinakamalapit na emergency room.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
