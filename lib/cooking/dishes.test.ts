import { describe, it, expect } from "vitest";
import { matchDishes } from "@/lib/cooking/dishes";

describe("matchDishes", () => {
  it("ranks Chicken Adobo top for adobo ingredients", () => {
    const dishes = matchDishes(["manok", "toyo", "suka", "bawang", "laurel"], 5);
    expect(dishes.length).toBeGreaterThan(0);
    expect(dishes[0].name).toBe("Chicken Adobo");
  });

  it("matches by substring both directions", () => {
    // Vision models might return "chicken" or "manok" — substring matching
    // ay dapat symmetric (item.includes(k) || k.includes(item)).
    const dishes = matchDishes(["manok"], 3);
    const names = dishes.map((d) => d.name);
    expect(names.some((n) => n.toLowerCase().includes("manok"))).toBe(true);
  });

  it("returns empty for unrelated ingredients", () => {
    const dishes = matchDishes(["plastic", "cable wire"], 5);
    expect(dishes).toHaveLength(0);
  });

  it("respects the limit", () => {
    const dishes = matchDishes(
      ["baboy", "toyo", "suka", "bawang", "kamatis", "sibuyas", "itlog"],
      2,
    );
    expect(dishes.length).toBeLessThanOrEqual(2);
  });
});
