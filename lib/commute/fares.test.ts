import { describe, it, expect } from "vitest";
import {
  estimateFare,
  estimateFareBand,
  estimateFareBandForModes,
  nonFormulaModeContext,
  FARE_RULES,
} from "@/lib/commute/fares";

describe("estimateFare", () => {
  it("returns base fare within the base km", () => {
    const jeep = FARE_RULES[0]; // ₱14 unang 4km
    expect(estimateFare(jeep, 1)).toBe(14);
    expect(estimateFare(jeep, 4)).toBe(14);
  });

  it("adds per-km beyond the base km", () => {
    const jeep = FARE_RULES[0]; // ₱14 + ₱2/km
    // 5km → 14 + 2 * 1 = 16
    expect(estimateFare(jeep, 5)).toBe(16);
    // 10km → 14 + 2 * 6 = 26
    expect(estimateFare(jeep, 10)).toBe(26);
  });

  it("rounds to the nearest peso", () => {
    const airconBus = FARE_RULES.find((r) => r.label === "City bus (aircon)")!;
    // 18 base (5km) + 2.98/km; 7.2km → 18 + 2.98*2.2 = 24.56 → 25
    expect(estimateFare(airconBus, 7.2)).toBe(25);
  });
});

describe("estimateFareBand", () => {
  it("uses current Metro Manila jeepney/bus estimates", () => {
    // Generic Metro Manila estimate: traditional jeepney ₱14 to aircon bus ₱18.
    // Provincial rules are intentionally excluded from this generic band.
    expect(estimateFareBand(3)).toEqual({ min: 14, max: 18 });
  });

  it("widens with distance across all formula modes", () => {
    const band = estimateFareBand(20);
    expect(band).not.toBeNull();
    expect(band!.min).toBeLessThan(band!.max);
    // Metro estimate uses ordinary city bus through aircon bus rules.
    expect(band!.min).toBeLessThanOrEqual(band!.max);
    expect(band!.max).toBeGreaterThan(40);
  });

  it("returns null only when there are no rules", () => {
    // All-modes band always has rules, so never null.
    expect(estimateFareBand(10)).not.toBeNull();
  });
});

describe("estimateFareBandForModes", () => {
  it("narrows to jeepney-only fares when modes=[jeepney]", () => {
    const band = estimateFareBandForModes(10, ["jeepney"]);
    // trad: 14+2*6=26 ; modern: 17+2.4*6=31.4→31
    expect(band).toEqual({ min: 26, max: 31 });
  });

  it("excludes non-formula modes from the band math", () => {
    const withP2P = estimateFareBandForModes(10, ["jeepney", "p2p", "tricycle"]);
    expect(withP2P).toEqual({ min: 26, max: 31 });
  });

  it("falls back to all modes for empty/unknown mode lists", () => {
    const unknown = estimateFareBandForModes(3, ["helicopter"]);
    expect(unknown).toEqual(estimateFareBand(3));
  });
});

describe("nonFormulaModeContext", () => {
  it("describes P2P and tricycle when present", () => {
    const ctx = nonFormulaModeContext(["p2p", "tricycle"]) ?? "";
    expect(ctx).toContain("P2P bus");
    expect(ctx).toContain("Tricycle");
  });

  it("returns null for formula-only modes", () => {
    expect(nonFormulaModeContext(["jeepney", "bus"])).toBeNull();
    expect(nonFormulaModeContext([])).toBeNull();
  });
});
