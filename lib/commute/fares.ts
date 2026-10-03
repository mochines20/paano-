/**
 * LTFRB fare formulas — configurable constants, HINDI hardcoded na sagot.
 *
 * IMPORTANT: May bagong PUV fare adjustment na iniulat na effective
 * 2026-09-28. Ang official LTFRB matrix ang final authority, pero wala pang
 * live machine-readable LTFRB feed na konektado sa app. Kaya ang rules sa
 * file na ito ay structured estimate lamang at laging may needs_review label.
 *
 * Reported 2026-09-28 Metro Manila rates used for estimation:
 *   - Traditional jeepney: ₱14 minimum (unang 4km) + ₱2.00/km
 *   - Modern jeepney:      ₱17 minimum (unang 4km) + ₱2.40/km
 *   - City bus (ordinary): ₱15 minimum (unang 5km) + ₱2.49/km
 *   - City bus (aircon):   ₱18 minimum (unang 5km) + ₱2.98/km
 *   - Provincial bus (ordinary): ₱11 minimum (unang 5km) + ₱1.90/km
 *   - Provincial bus (aircon):   ₱11 minimum (unang 5km) + ₱2.10/km
 *   - Provincial bus (deluxe):   ₱11 minimum (unang 5km) + ₱2.25/km
 *   - Provincial bus (super deluxe): ₱11 minimum (unang 5km) + ₱2.35/km
 *   - Provincial bus (luxury):    ₱11 minimum (unang 5km) + ₱2.90/km
 *   - Airport taxi:        ₱115 flagdown (unang 500m)
 *   - TNVS:                ₱65 sedan / ₱75 AUV / ₱55 hatchback / ₱165 premium
 *
 * NON-FORMULA modes (walang per-km LTFRB formula — fixed route fares):
 *   - P2P bus:       Fixed per route (hal. Ortigas→Makati ₱60, NAIA→Clark ₱400)
 *   - UV Express:    Fixed per route, set ng operator na may LTFRB approval
 *   - Tricycle:      Set ng LGU/barangay ordinance (₱20–₱50 per ride, varies)
 *
 * Source: LTFRB official site + 2026-09-28 public fare-adjustment reports.
 * I-verify ang exact matrix sa https://ltfrb.gov.ph/ bago bumiyahe.
 */

export const FARE_SOURCE =
  "LTFRB fare estimate based on the reported 2026-09-28 adjustment; needs review against the latest official fare matrix. Verify at ltfrb.gov.ph before travel.";

export const FARE_EFFECTIVE_DATE = "2026-09-28";
export const FARE_STATUS = "needs_review" as const;
export const FARE_SOURCE_URL = "https://ltfrb.gov.ph/";

export interface FareRule {
  mode: string;
  label: string;
  base: number;
  baseKm: number;
  perKm: number;
  scope?: "metro" | "provincial";
  note?: string;
}

/**
 * Mga mode na may LTFRB per-km formula — jeepney at bus lang.
 * P2P, UV Express, at tricycle ay HINDI dito dahil walang per-km formula
 * ang kanilang pricing.
 */
export const FARE_RULES: FareRule[] = [
  {
    mode: "jeepney",
    label: "Traditional jeepney",
    base: 14,
    baseKm: 4,
    perKm: 2,
    scope: "metro",
  },
  {
    mode: "jeepney",
    label: "Modern jeepney",
    base: 17,
    baseKm: 4,
    perKm: 2.4,
    scope: "metro",
    note: "Modern PUJ — air-conditioned",
  },
  {
    mode: "bus",
    label: "City bus (ordinary)",
    base: 15,
    baseKm: 5,
    perKm: 2.49,
    scope: "metro",
  },
  {
    mode: "bus",
    label: "City bus (aircon)",
    base: 18,
    baseKm: 5,
    perKm: 2.98,
    scope: "metro",
  },
  {
    mode: "bus",
    label: "Provincial bus (ordinary)",
    base: 11,
    baseKm: 5,
    perKm: 1.9,
    scope: "provincial",
    note: "Provincial matrix — i-verify sa operator",
  },
  {
    mode: "bus",
    label: "Provincial bus (aircon)",
    base: 11,
    baseKm: 5,
    perKm: 2.1,
    scope: "provincial",
    note: "Provincial aircon — i-verify sa operator",
  },
  {
    mode: "bus",
    label: "Provincial bus (deluxe)",
    base: 11,
    baseKm: 5,
    perKm: 2.25,
    scope: "provincial",
    note: "Deluxe — i-verify sa operator",
  },
  {
    mode: "bus",
    label: "Provincial bus (super deluxe)",
    base: 11,
    baseKm: 5,
    perKm: 2.35,
    scope: "provincial",
    note: "Super deluxe — i-verify sa operator",
  },
  {
    mode: "bus",
    label: "Provincial bus (luxury)",
    base: 11,
    baseKm: 5,
    perKm: 2.9,
    scope: "provincial",
    note: "Luxury class — i-verify sa operator",
  },
];

/**
 * Mga mode na WALANG per-km formula — fixed route fares o LGU-set.
 * Ginagamit para sa context lang, hindi para sa fare band calculation.
 */
export interface NonFormulaMode {
  mode: string;
  label: string;
  note: string;
  typicalRange: string;
}

export const NON_FORMULA_MODES: NonFormulaMode[] = [
  {
    mode: "p2p",
    label: "P2P bus (point-to-point)",
    note: "Fixed fare per route — walang per-km formula. Presyo ay depende sa route at operator.",
    typicalRange: "₱50–₱500 (hal. Ortigas→Makati ₱60, NAIA→Clark ₱400)",
  },
  {
    mode: "uv",
    label: "UV Express",
    note: "Fixed fare per route — set ng operator na may LTFRB approval. Walang standard per-km formula.",
    typicalRange: "₱25–₱150+ depende sa route",
  },
  {
    mode: "tricycle",
    label: "Tricycle",
    note: "Set ng LGU/barangay ordinance — hindi LTFRB. Presyo ay iba-iba per bayan/lungsod.",
    typicalRange: "₱20–₱50 per ride (₱30 sa Dagupan, ₱20 sa Moncada Tarlac, etc.)",
  },
];

/**
 * Estimated fare gamit ang LTFRB formula: base + perKm × (km − baseKm).
 * Bumalik ang rounded peso value.
 */
export function estimateFare(rule: FareRule, km: number): number {
  if (km <= rule.baseKm) return Math.round(rule.base);
  return Math.round(rule.base + rule.perKm * (km - rule.baseKm));
}

/**
 * Band ng fare para sa mga mode na sinabi ng modelo (hal. may "jeepney"
 * at "bus" sa modes → kasama ang traditional+modern jeepney at
 * ordinary+aircon bus). Pag walang modes, lahat ng formula-based rule
 * ang gagamitin. HINDI kasama ang P2P, UV Express, at tricycle dahil
 * walang per-km formula ang mga ito.
 */
export function estimateFareBandForModes(
  km: number,
  modes: string[],
): { min: number; max: number } | null {
  const known = new Set(modes);
  // Filter sa formula-based modes lang (jeepney, bus)
  const formulaModes = new Set(FARE_RULES.map((r) => r.mode));
  const relevantModeSet = new Set([...known].filter((m) => formulaModes.has(m)));
  const rules =
    relevantModeSet.size > 0
      ? FARE_RULES.filter(
          (r) =>
            relevantModeSet.has(r.mode) &&
            // A generic "bus"/"jeepney" answer in Metro Manila must not
            // accidentally widen its fare with provincial rules.
            (r.scope ?? "metro") === "metro",
        )
      : FARE_RULES.filter((r) => (r.scope ?? "metro") === "metro");

  const values = rules.map((r) => estimateFare(r, km));
  if (values.length === 0) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}

/** Band ng fare para sa jeepney at bus (compatibility helper). */
export function estimateFareBand(km: number): { min: number; max: number } | null {
  return estimateFareBandForModes(km, ["jeepney", "bus"]);
}

/**
 * Context text para sa non-formula modes (P2P, UV Express, tricycle)
 * na sinabi ng modelo. Bumalik ng null kung walang relevant na mode.
 */
export function nonFormulaModeContext(modes: string[]): string | null {
  const known = new Set(modes);
  const found = NON_FORMULA_MODES.filter((m) => known.has(m.mode));
  if (found.length === 0) return null;
  return found
    .map((m) => `${m.label}: ${m.note} Typical: ${m.typicalRange}`)
    .join("; ");
}
