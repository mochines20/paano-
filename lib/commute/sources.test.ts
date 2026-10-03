import { describe, expect, it } from "vitest";
import {
  COMMUTE_SOURCES,
  commuteProvenance,
  orderCommuteSources,
  sourceRef,
} from "@/lib/commute/sources";

describe("commute source registry", () => {
  it("keeps official sources ahead of community and aggregator fallbacks", () => {
    const sources = [
      sourceRef("busmaps")!,
      sourceRef("sakayph-gtfs")!,
      sourceRef("ltfrb-fare-matrix")!,
      sourceRef("pitx-routes")!,
    ];
    expect(orderCommuteSources(sources).map((source) => source.id)).toEqual([
      "ltfrb-fare-matrix",
      "pitx-routes",
      "sakayph-gtfs",
      "busmaps",
    ]);
  });

  it("marks the bundled GTFS as fallback, never official", () => {
    const source = sourceRef("sakayph-gtfs")!;
    expect(source.tier).toBe("community_gtfs");
    expect(source.status).toBe("fallback");
  });

  it("does not produce official provenance for an unverified static snapshot", () => {
    const provenance = commuteProvenance(
      [sourceRef("curated-terminal-snapshot")!, sourceRef("sakayph-gtfs")!],
      "Verify before acting.",
    );
    expect(provenance.status).toBe("needs_review");
    expect(provenance.asOf).toBeNull();
    expect(provenance.note).toContain("Verify");
  });

  it("keeps the five requested source tiers represented", () => {
    const tiers = new Set(COMMUTE_SOURCES.map((source) => source.tier));
    expect(tiers).toEqual(
      new Set([
        "official_government",
        "official_operator",
        "official_lgu",
        "community_gtfs",
        "aggregator",
      ]),
    );
  });
});

