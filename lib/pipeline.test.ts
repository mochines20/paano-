import { describe, expect, it } from "vitest";
import { runAnswerPipeline } from "./pipeline";

describe("answer pipeline", () => {
  it("uses a clean curated response for greetings", async () => {
    const result = await runAnswerPipeline([{ role: "user", content: "Hello!" }]);

    expect(result.source).toBe("docs-static");
    expect(result.answer.category).toBe("generic");
    expect(result.answer.title).toBe("Kumusta! Ano ang kailangan mo?");
    expect(result.answer.steps).toEqual([]);
    expect(result.answer.disclaimer).toBeNull();
    expect(result.answer.category_specific).toBeNull();
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});
