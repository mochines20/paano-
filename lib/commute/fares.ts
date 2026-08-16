/**
 * LTFRB fare formulas — configurable constants, HINDI hardcoded na sagot.
 *
 * Batay sa LTFRB fare matrix na epektibo Marso 19, 2026 (provisional,
 * naging permanente noong Hunyo 2026). Na-verify laban sa GMA News,
 * Rappler, Philstar, at SPOT.ph coverage:
 *
 *   - Traditional jeepney: ₱14 minimum (unang 4km) + ₱2.00/km
 *   - Modern jeepney:      ₱17 minimum (unang 4km) + ₱2.40/km
 *   - City bus (ordinary): ₱15 minimum (unang 5km) + ₱2.49/km
 *   - City bus (aircon):   ₱18 minimum (unang 5km) + ₱2.98/km
 *   - Provincial bus:      ₱12 minimum + ₱2.20/km (matrix — i-verify)
 *   - Airport taxi:        ₱115 flagdown (unang 500m)
 *   - TNVS:                ₱65 sedan / ₱75 AUV / ₱55 hatchback / ₱165 premium
 *
 * Source: ltfrb.gov.ph — maaaring magbago; laging i-verify bago sumakay.
 */

export const FARE_SOURCE =
  "LTFRB fare matrix (epektibo Marso 19, 2026, permanente noong Hunyo) — ltfrb.gov.ph. Maaaring magbago.";

export const FARE_EFFECTIVE_DATE = "2026-03-19";

export interface FareRule {
  mode: string;
  label: string;
  base: number;
  baseKm: number;
  perKm: number;
  note?: string;
}

export const FARE_RULES: FareRule[] = [
  {
    mode: "jeepney",
    label: "Traditional jeepney",
    base: 14,
    baseKm: 4,
    perKm: 2.0,
  },
  {
    mode: "jeepney",
    label: "Modern jeepney",
    base: 17,
    baseKm: 4,
    perKm: 2.4,
    note: "Minibus — air-conditioned",
  },
  {
    mode: "bus",
    label: "City bus (ordinary)",
    base: 15,
    baseKm: 5,
    perKm: 2.49,
  },
  {
    mode: "bus",
    label: "City bus (aircon)",
    base: 18,
    baseKm: 5,
    perKm: 2.98,
  },
  {
    mode: "bus",
    label: "Provincial bus (ordinary)",
    base: 12,
    baseKm: 5,
    perKm: 2.2,
    note: "Provincial matrix — i-verify sa operator",
  },
  {
    mode: "bus",
    label: "Provincial bus (aircon)",
    base: 16,
    baseKm: 5,
    perKm: 2.65,
    note: "Provincial aircon — i-verify sa operator",
  },
  {
    mode: "p2p",
    label: "P2P bus (point-to-point, aircon)",
    base: 50,
    baseKm: 5,
    perKm: 3.5,
    note: "Premium express bus — walang stop, may WiFi. Presyo ay may range depende sa route.",
  },
  {
    mode: "uv",
    label: "UV Express",
    base: 25,
    baseKm: 4,
    perKm: 2.5,
    note: "Shared van — depende sa route at lulan. Sagot lang kung sakto.",
  },
  {
    mode: "tricycle",
    label: "Tricycle (per ride)",
    base: 20,
    baseKm: 1,
    perKm: 10,
    note: "Presyo ay depende sa barangay fare matrix — mag-ask sa driver bago sumakay.",
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
 * ordinary+aircon bus). Pag walang modes, lahat ng rule ang gagamitin.
 */
export function estimateFareBandForModes(
  km: number,
  modes: string[],
): { min: number; max: number } | null {
  const known = new Set(modes);
  const rules = FARE_RULES.filter((r) => known.has(r.mode));
  const applicable = rules.length > 0 ? rules : FARE_RULES;

  const values = applicable.map((r) => estimateFare(r, km));
  if (values.length === 0) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}

/** Band ng fare para sa parehong jeepney at bus (compatibility helper). */
export function estimateFareBand(km: number): { min: number; max: number } | null {
  return estimateFareBandForModes(km, ["jeepney", "bus", "p2p", "uv", "tricycle"]);
}
