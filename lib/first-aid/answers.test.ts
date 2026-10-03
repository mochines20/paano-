import { describe, expect, it } from "vitest";
import { findCuratedFirstAid } from "@/lib/first-aid/answers";

describe("curated first-aid answers", () => {
  it("returns complete, cautious burn guidance", () => {
    const answer = findCuratedFirstAid("Ano ang gagawin sa minor burn sa kamay?");

    expect(answer?.category).toBe("first_aid");
    expect(answer?.steps.length).toBeGreaterThanOrEqual(4);
    const spec = answer?.category_specific;
    expect(spec?.category).toBe("first_aid");
    if (spec?.category === "first_aid") {
      expect(spec.do_list.length).toBeGreaterThan(0);
      expect(spec.don_t_list.join(" ")).toMatch(/yelo|toothpaste/i);
    }
    expect(answer?.official_link?.url).toContain("nhs.uk/conditions/burns-and-scalds");
  });

  it("does not hijack unrelated questions", () => {
    expect(findCuratedFirstAid("Paano kumuha ng NBI clearance?")).toBeNull();
  });
});
