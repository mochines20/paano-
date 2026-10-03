import { describe, expect, it } from "vitest";
import { getPalengkePrices, getPriceProvenance } from "./prices";

describe("cooking price provenance", () => {
  it("labels the default table as an estimate with a reference date", async () => {
    const prices = await getPalengkePrices();
    expect(prices.length).toBeGreaterThan(0);
    const provenance = getPriceProvenance();
    expect(provenance.status).toBe("estimate");
    expect(provenance.asOf).toBe("2026-08-30");
  });
});
