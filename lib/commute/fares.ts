/**
 * LTFRB fare formulas — configurable constants, HINDI hardcoded na sagot.
 *
 * IMPORTANT: Ang fare hike na na-approve noong March 19, 2026 ay SUSPENDED
 * ni President Marcos dahil sa oil price crisis. Ang current na fares ay
 * ang PRE-HIKE rates. Verified August 2026 laban sa GMA News, Rappler,
 * Philstar, Inquirer, at BusinessWorld:
 *
 * Current effective fares (pre-hike, suspended ang March 2026 increase):
 *   - Traditional jeepney: ₱13 minimum (unang 4km) + ₱1.80/km
 *   - Modern jeepney:      ₱15 minimum (unang 4km) + ₱2.20/km
 *   - City bus (ordinary): ₱13 minimum (unang 5km) + ₱2.25/km
 *   - City bus (aircon):   ₱15 minimum (unang 5km) + ₱2.65/km
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
 * Source: ltfrb.gov.ph, doTr announcements (August 2026) — maaaring magbago.
 */

export const FARE_SOURCE =
  "LTFRB fare matrix (pre-hike rates — SUSPENDED ang March 2026 increase ni President Marcos dahil sa oil price crisis). Source: ltfrb.gov.ph, GMA News, Rappler, Philstar (verified August 2026). Maaaring magbago.";

export const FARE_EFFECTIVE_DATE = "pre-2026-03-19";

export interface FareRule {
  mode: string;
  label: string;
  base: number;
  baseKm: number;
  perKm: number;
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
    base: 13,
    baseKm: 4,
    perKm: 1.8,
  },
  {
    mode: "jeepney",
    label: "Modern jeepney",
    base: 15,
    baseKm: 4,
    perKm: 2.2,
    note: "Modern PUJ — air-conditioned",
  },
  {
    mode: "bus",
    label: "City bus (ordinary)",
    base: 13,
    baseKm: 5,
    perKm: 2.25,
  },
  {
    mode: "bus",
    label: "City bus (aircon)",
    base: 15,
    baseKm: 5,
    perKm: 2.65,
  },
  {
    mode: "bus",
    label: "Provincial bus (ordinary)",
    base: 11,
    baseKm: 5,
    perKm: 1.9,
    note: "Provincial matrix — i-verify sa operator",
  },
  {
    mode: "bus",
    label: "Provincial bus (aircon)",
    base: 11,
    baseKm: 5,
    perKm: 2.1,
    note: "Provincial aircon — i-verify sa operator",
  },
  {
    mode: "bus",
    label: "Provincial bus (deluxe)",
    base: 11,
    baseKm: 5,
    perKm: 2.25,
    note: "Deluxe — i-verify sa operator",
  },
  {
    mode: "bus",
    label: "Provincial bus (super deluxe)",
    base: 11,
    baseKm: 5,
    perKm: 2.35,
    note: "Super deluxe — i-verify sa operator",
  },
  {
    mode: "bus",
    label: "Provincial bus (luxury)",
    base: 11,
    baseKm: 5,
    perKm: 2.9,
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
      ? FARE_RULES.filter((r) => relevantModeSet.has(r.mode))
      : FARE_RULES;

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
