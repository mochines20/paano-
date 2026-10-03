import { describe, expect, it } from "vitest";
import { scaleAmount } from "./CookingSection";

describe("scaleAmount", () => {
  it("scales a half fraction without producing 2/2", () => {
    expect(scaleAmount("1/2 tasa", 2)).toBe("1 tasa (2x)");
  });

  it("scales a fraction by one and a half", () => {
    expect(scaleAmount("1/2 tasa", 1.5)).toBe("0.8 tasa (1.5x)");
  });
});
