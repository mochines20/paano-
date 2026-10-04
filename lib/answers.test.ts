import { describe, it, expect } from "vitest";
import {
  extractJsonObject,
  extractJsonObjects,
  normalizeAnswer,
  parseModelOutput,
  fallbackAnswer,
  wrapRawText,
  answerToText,
} from "@/lib/answers";

describe("extractJsonObjects / extractJsonObject", () => {
  it("extracts balanced objects and skips prose", () => {
    const text = 'Narito ang sagot: {"a":1} sana nakatulong';
    expect(extractJsonObject(text)).toBe('{"a":1}');
  });

  it("strips markdown fences", () => {
    const text = '```json\n{"ok":true}\n```';
    expect(extractJsonObject(text)).toBe('{"ok":true}');
  });

  it("ignores braces inside strings", () => {
    const text = '{"summary":"may literal na { at } dito"}';
    expect(extractJsonObject(text)).toBe(text);
  });

  it("last:true picks the final object (thinking-block models)", () => {
    const text = '{"schema":"echo"} x {"final":true}';
    expect(extractJsonObject(text, { last: true })).toBe('{"final":true}');
    expect(extractJsonObject(text)).toBe('{"schema":"echo"}');
  });

  it("returns null when there is no object", () => {
    expect(extractJsonObject("walang JSON dito")).toBeNull();
    expect(extractJsonObjects("{ broken")).toEqual([]);
  });
});

describe("normalizeAnswer", () => {
  it("preserves evidence metadata for visible freshness labels", () => {
    const a = normalizeAnswer({
      category: "generic",
      title: "Test",
      summary: "Reference",
      steps: [],
      confidence: "medium",
      disclaimer: null,
      official_link: null,
      provenance: {
        label: "NCR fallback estimate",
        asOf: "2026-08-30",
        status: "estimate",
        note: "Tantya lamang",
        url: "https://www.da.gov.ph/category/bantay-presyo/",
      },
      category_specific: { category: "generic", note: "" },
    });
    expect(a?.provenance?.asOf).toBe("2026-08-30");
    expect(a?.provenance?.status).toBe("estimate");
  });

  it("maps a valid commute answer with nested category_specific", () => {
    const a = normalizeAnswer({
      category: "commute",
      title: "Cubao → Intramuros",
      summary: "Jeep tapos LRT.",
      steps: ["Sakay ng jeep", "Baba sa Carriedo"],
      confidence: "high",
      disclaimer: null,
      official_link: { label: "LTFRB", url: "https://ltfrb.gov.ph" },
      category_specific: {
        commute: {
          origin: "Cubao",
          destination: "Intramuros",
          modes: ["jeepney", "lrt"],
          route_names: ["Cubao-Divisoria"],
          time_range: { min: 30, max: 45, unit: "min" },
          fare_range: { min: 13, max: 30, currency: "PHP" },
          fare_notes: "student discount",
        },
      },
    });
    expect(a?.category).toBe("commute");
    expect(a?.category_specific?.category).toBe("commute");
    if (a?.category_specific?.category === "commute") {
      expect(a.category_specific.fare_range.min).toBe(13);
      expect(a.category_specific.modes).toHaveLength(2);
    }
  });

  it("accepts flat category_specific shape defensively", () => {
    const a = normalizeAnswer({
      category: "diy",
      title: "Ayusin ang gripo",
      summary: "",
      steps: [],
      confidence: "medium",
      category_specific: { tools: ["wrench"], materials: ["teyp"], safety_warning: null },
    });
    expect(a?.category_specific?.category).toBe("diy");
    if (a?.category_specific?.category === "diy") {
      expect(a.category_specific.tools).toEqual(["wrench"]);
    }
  });

  it("falls back to generic for unknown categories and bad confidence", () => {
    const a = normalizeAnswer({ category: "space_travel", confidence: "galactic" });
    expect(a?.category).toBe("generic");
    expect(a?.confidence).toBe("medium");
  });

  it("blocks javascript: URLs on official_link (XSS)", () => {
    const a = normalizeAnswer({
      category: "generic",
      official_link: { label: "sneaky", url: "javascript:alert(1)" },
    });
    expect(a?.official_link).toBeNull();
  });

  it("dedupes string arrays", () => {
    const a = normalizeAnswer({
      category: "commute",
      category_specific: { modes: ["bus", "bus", "jeepney"] },
    });
    if (a?.category_specific?.category === "commute") {
      expect(a.category_specific.modes).toEqual(["bus", "jeepney"]);
    } else {
      throw new Error("expected commute specific");
    }
  });

  it("removes leaked metadata from steps and moves disclaimer below the answer", () => {
    const a = normalizeAnswer({
      category: "first_aid",
      title: "Unang Tulong",
      steps: [
        "Unang hakbang",
        "confidence",
        "high",
        "source",
        "https://example.com/guide",
        "disclaimer",
        "Magpatingin kung lumala.",
      ],
      category_specific: {
        severity: "mild",
        do_list: ["Palamigin ang paso"],
        don_t_list: ["Huwag lagyan ng yelo"],
        see_doctor_threshold: "Kung malala, magpatingin.",
      },
    });
    expect(a?.steps).toEqual(["Unang hakbang"]);
    expect(a?.disclaimer).toBe("Magpatingin kung lumala.");
  });
});

describe("parseModelOutput", () => {
  it("parses valid JSON output", () => {
    const a = parseModelOutput('{"category":"cooking","title":"Adobo"}');
    expect(a?.title).toBe("Adobo");
  });

  it("returns null on garbage", () => {
    expect(parseModelOutput("hindi ako JSON")).toBeNull();
  });
});

describe("fallback/wrap helpers", () => {
  it("fallbackAnswer produces a low-confidence generic card", () => {
    const a = fallbackAnswer("nag-error");
    expect(a.confidence).toBe("low");
    expect(a.summary).toBe("nag-error");
    expect(a.steps).toHaveLength(0);
  });

  it("wrapRawText converts raw text into steps", () => {
    const a = wrapRawText("Una, gawin ito.\nPangalawa, iyan.");
    expect(a.steps.length).toBe(2);
    expect(a.confidence).toBe("low");
  });

  it("does not expose malformed JSON metadata as user-facing steps", () => {
    const a = wrapRawText(
      '{"category":"commute","title":"Route","steps":["Sakay"],"confidence":"high"',
    );
    expect(a.title).toBe("Hindi mabuo ang sagot");
    expect(a.steps).toEqual([]);
    expect(a.summary).not.toContain("confidence");
  });
});

describe("answerToText", () => {
  it("includes fare/time/route lines for commute answers", () => {
    const base = fallbackAnswer("x");
    const a = normalizeAnswer({
      ...base,
      category: "commute",
      category_specific: {
        commute: {
          origin: "A",
          destination: "B",
          modes: ["bus"],
          route_names: ["Alabang-BGC"],
          time_range: { min: 40, max: 55, unit: "min" },
          fare_range: { min: 52, max: 52, currency: "PHP" },
          fare_notes: null,
        },
      },
    })!;
    const text = answerToText(a);
    expect(text).toContain("~40–55 min");
    expect(text).toContain("₱52–₱52");
    expect(text).toContain("Alabang-BGC");
  });

  it("includes prerequisites and fees for docs answers", () => {
    const base = fallbackAnswer("x");
    const a = normalizeAnswer({
      ...base,
      category: "docs",
      category_specific: {
        docs: {
          agency: "NBI",
          requirements: ["valid ID"],
          fees: [{ item: "Clearance", amount: "₱130", updated: null }],
          processing_time: null,
          last_verified: "2026-08-13",
          prerequisites: ["PSA Birth Certificate"],
          alerts: [],
        },
      },
    })!;
    const text = answerToText(a);
    expect(text).toContain("Prerequisite: PSA Birth Certificate");
    expect(text).toContain("Clearance — ₱130");
  });
});
