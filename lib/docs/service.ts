import { DOC_GUIDES, DOC_TITLES } from "@/lib/docs/data";
import type { DocGuide } from "@/lib/docs/data";
import type { PaanoAnswer } from "@/lib/answers";

/**
 * Docs service — static, human-reviewed guides.
 * Ang LLM ay HINDI gumagawa ng fees/requirements dito; ito ang source.
 */

const DISCLAIMER =
  "Human-reviewed guide (huling na-verify 2026-08-13). Maaaring magbago ang mga bayarin at proseso — i-verify sa opisyal na site bago kumilos.";

/** Hanapin ang best-matching doc guide. Mas mahaba/mas specific ang keyword
 * = mas mataas ang score. Bumalik ang null kung walang tugma. */
export function findDocGuide(question: string): DocGuide | null {
  const q = question.toLowerCase();

  let best: { guide: DocGuide; score: number } | null = null;
  for (const guide of DOC_GUIDES) {
    let score = 0;
    for (const kw of guide.keywords) {
      if (q.includes(kw.toLowerCase())) score += kw.length;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { guide, score };
    }
  }
  return best?.guide ?? null;
}

/** Paano magtanong tungkol sa bawat doc (para sa follow-up chips). */
const DOC_ASK: Record<string, string> = {
  "psa-certificate": "Paano kumuha ng PSA birth certificate?",
  "lto-student-permit": "Paano kumuha ng student permit?",
  "lto-nonpro-license": "Paano kumuha ng driver's license?",
  passport: "Paano kumuha ng passport?",
  "nbi-clearance": "Paano kumuha ng NBI clearance?",
  "philsys-national-id": "Paano kumuha ng National ID?",
};

/**
 * Follow-up questions mula sa dependency graph — prerequisites at
 * usedAsIdFor, para makita ng user ang "kailangan mo munang makuha ito"
 * at ang "ano pa ang kayang i-validate nito".
 */
export function suggestedDocQuestions(guide: DocGuide): string[] {
  const ids = [...guide.prerequisites, ...guide.usedAsIdFor];
  const questions = [...new Set(ids)]
    .map((id) => DOC_ASK[id])
    .filter((q): q is string => Boolean(q))
    .slice(0, 3);
  if (questions.length < 2) questions.push("Ano ang susunod na kailangan kong makuha?");
  return questions;
}

/** I-convert ang DocGuide papunta sa structured PaanoAnswer para sa card. */
export function docGuideToAnswer(guide: DocGuide): PaanoAnswer {
  return {
    category: "docs",
    title: guide.title,
    summary: guide.summary,
    steps: guide.steps,
    confidence: "high",
    disclaimer: DISCLAIMER,
    official_link: guide.official_link,
    category_specific: {
      category: "docs",
      agency: guide.agency,
      requirements: guide.requirements,
      fees: guide.fees,
      processing_time: guide.processing_time,
      last_verified: guide.lastVerified,
      prerequisites: guide.prerequisites.map((id) => DOC_TITLES[id] ?? id),
      alerts: guide.alerts,
    },
  };
}
