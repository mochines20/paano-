/**
 * LTFRB fare formulas — configurable constants, HINDI hardcoded na sagot.
 *
 * Batay sa LTFRB fare matrix, epektibo Marso 19, 2026:
 *   - Modern jeepney: ₱17 minimum (unang 1km) + ₱2.30 kada kasunod na km
 *   - Ordinary bus:   ₱15 minimum (unang 5km) + ₱2.49 kada kasunod na km
 * Source: ltfrb.gov.ph — maaaring magbago; laging i-verify bago sumakay.
 */

export const FARE_SOURCE =
  "LTFRB fare matrix (epektibo Marso 19, 2026) — ltfrb.gov.ph. Maaaring magbago.";

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
    label: "Modern jeepney",
    base: 17,
    baseKm: 1,
    perKm: 2.3,
    note: "Traditional jeepneys: ₱13–₱15 minimum depende sa LGU",
  },
  {
    mode: "bus",
    label: "Ordinary bus",
    base: 15,
    baseKm: 5,
    perKm: 2.49,
  },
];

export function fareRuleFor(mode: string): FareRule | undefined {
  return FARE_RULES.find((r) => r.mode === mode);
}

/**
 * Estimated fare gamit ang LTFRB formula: base + perKm × (km − baseKm).
 * Bumalik ang rounded peso value, o null kung walang alam na formula
 * para sa mode na iyon.
 */
export function estimateFare(mode: string, km: number): number | null {
  const rule = fareRuleFor(mode);
  if (!rule) return null;
  if (km <= rule.baseKm) return Math.round(rule.base);
  return Math.round(rule.base + rule.perKm * (km - rule.baseKm));
}

/** Band ng fare para sa parehong jeepney at bus (depende sa mode ng sasakyan). */
export function estimateFareBand(km: number): {
  min: number;
  max: number;
} | null {
  const jeepney = estimateFare("jeepney", km);
  const bus = estimateFare("bus", km);
  if (jeepney === null && bus === null) return null;
  const values = [jeepney, bus].filter((v): v is number => v !== null);
  return { min: Math.min(...values), max: Math.max(...values) };
}
