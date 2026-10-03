import type { PaanoAnswer } from "@/lib/answers";

/**
 * Lightweight post-generation safety gate. This is intentionally conservative
 * for household/electrical/chemical instructions: if a generated answer
 * contains a clearly dangerous action, do not show it to the user.
 */
export function validateGeneratedAnswer(answer: PaanoAnswer): PaanoAnswer {
  const text = [answer.title, answer.summary, ...answer.steps].join(" ").toLowerCase();

  const dangerousPatterns = [
    /(?:ilubog|ibabad|buhusan|basain|isawsaw).{0,60}(?:electric|electrical|motor|saksakan|appliance|fan|bentilador)/i,
    /(?:electric|electrical|motor|saksakan|appliance|fan|bentilador).{0,60}(?:ilubog|ibabad|buhusan|basain|isawsaw)/i,
    /(?:isama|ilagay|ipasok).{0,60}(?:electric|electrical|motor|fan|bentilador).{0,60}(?:tubig|water)/i,
    /(?:tubig|water).{0,60}(?:electric|electrical|motor|fan|bentilador)/i,
    /(?:paghaluin|ihalo|mix).{0,50}(?:bleach|chlorine).{0,50}(?:ammonia|suka|acid)/i,
    /(?:ammonia|bleach|chlorine).{0,50}(?:paghaluin|ihalo|mix)/i,
    /(?:sindihan|lighter|posporo|apoy).{0,50}(?:gas leak|tagas ng gas|amoy gas)/i,
  ];

  if (dangerousPatterns.some((pattern) => pattern.test(text))) {
    return {
      category: "diy",
      title: "Hindi ligtas ang nabuong instruction",
      summary:
        "May nakitang posibleng delikadong instruction sa AI answer kaya hindi ito ipinakita. Huwag basain ang electrical parts, paghaluin ang bleach at ibang kemikal, o magsindi kapag may amoy gas.",
      steps: [
        "Itigil muna ang gagawin at ilayo ang sarili sa kuryente, kemikal, o pinagmumulan ng gas.",
        "Para sa electrical appliance, i-unplug ito at huwag gamitin kung may spark, amoy sunog, o sirang cord.",
        "Para sa kemikal o tagas ng gas, lumabas sa lugar at tumawag sa emergency services kung may panganib.",
      ],
      confidence: "low",
      disclaimer: "I-verify ang safety procedure sa manual o kwalipikadong technician bago kumilos.",
      official_link: null,
      category_specific: {
        category: "diy",
        tools: [],
        materials: [],
        safety_warning: "Huwag sundin ang na-block na instruction.",
      },
    };
  }

  // Unified 911 is the nationwide emergency number. Correct legacy 117
  // references in generated fire answers before they reach the user.
  if (/(sunog|apoy|nasusunog|nag-aapoy|fire)/i.test(text) && /\b117\b/.test(text)) {
    const replaceHotline = (value: string | null): string | null =>
      value?.replace(/\b117\b/g, "911") ?? value;

    return {
      ...answer,
      title: replaceHotline(answer.title) ?? answer.title,
      summary: replaceHotline(answer.summary) ?? answer.summary,
      steps: answer.steps.map((step) => replaceHotline(step) ?? step),
      disclaimer: replaceHotline(answer.disclaimer),
    };
  }

  return answer;
}
