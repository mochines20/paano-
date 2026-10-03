import { describe, expect, it } from "vitest";
import { findCuratedRecipe, isRecipeRequest } from "./recipes";

describe("curated cooking recipes", () => {
  it("returns a complete sinigang recipe without an LLM call", () => {
    const answer = findCuratedRecipe("Paano magluto ng sinigang na baboy para sa 4 tao?");
    expect(answer?.category_specific?.category).toBe("cooking");
    if (answer?.category_specific?.category === "cooking") {
      expect(answer.category_specific.ingredients.length).toBeGreaterThan(3);
      expect(answer.category_specific.servings).toBe("4 tao");
    }
  });

  it("keeps the tomato variant separate from classic adobo", () => {
    const answer = findCuratedRecipe("Paano magluto ng pork adobo with kamatis?");
    expect(answer?.title).toBe("Pork Adobo sa Kamatis");
    if (answer?.category_specific?.category === "cooking") {
      expect(answer.category_specific.ingredients.some((item) => item.item === "kamatis")).toBe(true);
      expect(answer.category_specific.servings).toBe("4 tao");
    }
  });

  it("does not mislabel unrelated cooking questions", () => {
    expect(findCuratedRecipe("Paano magluto ng adobong kangkong?")).toBeNull();
  });

  it("does not force a recipe when a dish is only mentioned", () => {
    expect(isRecipeRequest("Ano ang ibig sabihin ng adobo?")).toBe(false);
    expect(findCuratedRecipe("Hindi ako mahilig sa adobo.")).toBeNull();
  });
});
