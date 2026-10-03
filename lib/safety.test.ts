import { describe, expect, it } from "vitest";
import { validateGeneratedAnswer } from "./safety";
import type { PaanoAnswer } from "./answers";

const answer = (steps: string[]): PaanoAnswer => ({
  category: "diy",
  title: "Test answer",
  summary: "Test summary",
  steps,
  confidence: "high",
  disclaimer: null,
  official_link: null,
  category_specific: {
    category: "diy",
    tools: [],
    materials: [],
    safety_warning: null,
  },
});

describe("generated-answer safety gate", () => {
  it("blocks immersing an electrical appliance in water", () => {
    const result = validateGeneratedAnswer(answer(["Isama ang electric fan sa kontena ng tubig."]));
    expect(result.confidence).toBe("low");
    expect(result.summary).toContain("delikadong instruction");
  });

  it("keeps a normal answer unchanged", () => {
    const original = answer(["I-unplug muna ang electric fan at gumamit ng soft brush."]);
    expect(validateGeneratedAnswer(original)).toBe(original);
  });

  it("updates legacy 117 references to 911 for fire answers", () => {
    const result = validateGeneratedAnswer({
      ...answer(["Tumawag agad sa 117 kapag malaki na ang sunog."]),
      title: "Ano ang gagawin sa sunog?",
    });
    expect(result.steps[0]).toContain("911");
    expect(result.steps[0]).not.toContain("117");
  });
});
