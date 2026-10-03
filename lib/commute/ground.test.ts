import { describe, it, expect } from "vitest";
import { extractPlaces } from "@/lib/commute/ground";

describe("extractPlaces", () => {
  it("parses 'mula X papuntang Y'", () => {
    const { origin, dest } = extractPlaces("Paano magcommute mula Cubao papuntang Intramuros?");
    expect(origin?.toLowerCase()).toContain("cubao");
    expect(dest?.toLowerCase()).toContain("intramuros");
  });

  it("parses destination-only questions", () => {
    const { origin, dest } = extractPlaces("Paano pumunta sa Quiapo church?");
    expect(origin).toBeUndefined();
    expect(dest?.toLowerCase()).toContain("quiapo");
  });

  it("parses 'papuntang' without 'mula' (no origin)", () => {
    const { dest } = extractPlaces("Paano papuntang SM Megamall?");
    expect(dest).toBeTruthy();
  });

  it("handles 'galing X hanggang Y'", () => {
    const { origin, dest } = extractPlaces("galing Alabang hanggang BGC");
    expect(origin?.toLowerCase()).toContain("alabang");
    expect(dest?.toLowerCase()).toContain("bgc");
  });

  it("returns empty for non-place questions", () => {
    const r = extractPlaces("Ano ang first aid sa paso?");
    expect(r.origin).toBeUndefined();
    expect(r.dest).toBeUndefined();
  });
});
