import { describe, expect, it } from "vitest";
import { cleanStepText } from "./formatStepText";

describe("cleanStepText", () => {
  it("removes raw bold markdown markers from displayed steps", () => {
    expect(cleanStepText("**Mula Alabang VTX:** Hanapin ang terminal.")).toBe(
      "Mula Alabang VTX: Hanapin ang terminal.",
    );
  });
});
