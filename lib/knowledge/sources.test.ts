import { describe, expect, it } from "vitest";
import { getKnowledgeSource, isSourceFresh, sourceAgeDays } from "./sources";

describe("knowledge source registry", () => {
  it("contains the official PSA 2026 fee source", () => {
    const source = getKnowledgeSource("psa-certificate-prices-2026-02");
    expect(source?.url).toContain("public-advisory-101");
    expect(source?.status).toBe("verified");
  });

  it("calculates source age deterministically", () => {
    expect(sourceAgeDays("2026-08-30", Date.parse("2026-08-30T12:00:00Z"))).toBe(0);
    expect(sourceAgeDays("2026-08-01", Date.parse("2026-08-30T12:00:00Z"))).toBe(29);
  });

  it("does not treat a needs-review source as fresh", () => {
    const source = getKnowledgeSource("da-bantay-presyo");
    expect(source).not.toBeNull();
    expect(isSourceFresh(source!, Date.parse("2026-08-30T12:00:00Z"))).toBe(false);
  });
});
