import { askPaano, llmConfigError, llmConfigured } from "@/lib/llm";
import {
  applyCommuteGrounding,
  groundCommuteQuestion,
  isCommuteQuestion,
} from "@/lib/commute/ground";
import {
  docGuideToAnswer,
  findDocGuide,
  suggestedDocQuestions,
} from "@/lib/docs/service";
import { groundCookingQuestion } from "@/lib/cooking/ground";
import { findCuratedRecipe, isRecipeRequest } from "@/lib/cooking/recipes";
import { findCuratedFirstAid } from "@/lib/first-aid/answers";
import { matchDishes } from "@/lib/cooking/dishes";
import { askPaanoVision } from "@/lib/llm";
import { extractJsonObject, fallbackAnswer } from "@/lib/answers";
import type { ChatMessage, PaanoAnswer } from "@/lib/answers";
import { validateGeneratedAnswer } from "@/lib/safety";

/**
 * Answer pipeline — ang business logic ng /api/ask, hiwalay sa HTTP layer.
 *
 * Flow:
 *  1. Static docs guide (human-reviewed, walang LLM call, walang API key)
 *  2. Commute grounding (GTFS routes + LTFRB fares) → LLM
 *  3. LLM structured answer
 *  4. Suggestions para sa follow-up chips
 */

export type AnswerSource = "docs-static" | "llm";

/** Mga yugto ng pipeline — para sa staged/streaming UX sa client. */
export type PipelineStage =
  | "grounding"
  | "grounded-commute"
  | "grounded-cooking"
  | "llm"
  | "vision";

export interface PipelineResult {
  answer: PaanoAnswer;
  source: AnswerSource;
  suggestions: string[];
  repaired: boolean;
  raw: string | null;
}

/** May HTTP status na error — para malaman ng route kung anong ibabalik. */
export class PipelineError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "PipelineError";
  }
}

const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  commute: [
    "Ano ang pinakamabilis na ruta?",
    "Magkano kung student ang pamasahe?",
    "Paano kung rush hour?",
  ],
  cooking: ["Paano kung para sa 20 tao?", "Anong ulam ang pwedeng kasama nito?"],
  diy: ["Ano ang kailangan kong bilhin sa hardware?", "Paano maiiwasan na maulit ito?"],
  first_aid: ["Paano maiiwasan ang ganitong klaseng paso o kagat?"],
};

function hasMalformedFirstAidShape(answer: PaanoAnswer): boolean {
  if (answer.category !== "first_aid") return false;
  const spec = answer.category_specific;
  if (spec?.category !== "first_aid") return true;
  const leakedFields = /^(?:category|confidence|high|medium|low|disclaimer|official_link|category_specific)\s*:?$/i;
  return (
    spec.do_list.length === 0 ||
    spec.don_t_list.length === 0 ||
    !spec.see_doctor_threshold.trim() ||
    answer.steps.some((step) => leakedFields.test(step.trim()))
  );
}

function unvalidatedFirstAidFallback(): PaanoAnswer {
  return {
    category: "first_aid",
    title: "Kailangan ng Mas Malinaw na Detalye",
    summary:
      "Hindi ma-validate nang maayos ang nabuong first-aid instruction, kaya hindi muna ito dapat sundin.",
    steps: [
      "Huwag munang sundin ang naunang medical instruction kung hindi malinaw ang kondisyon o pinsala.",
      "Kung may hirap sa paghinga, malakas na pagdurugo, pagkawala ng malay, o mabilis na paglala, tumawag sa 911 o pumunta sa emergency room.",
      "Ilarawan ang eksaktong nangyari, lokasyon ng pinsala, edad ng pasyente, at mga sintomas para makapagbigay ng mas ligtas na gabay.",
    ],
    confidence: "low",
    disclaimer:
      "General information lamang—hindi diagnosis. Kailangan ng health professional para sa seryoso o hindi malinaw na sintomas.",
    official_link: { label: "DOH Philippines", url: "https://doh.gov.ph/" },
    category_specific: {
      category: "first_aid",
      severity: "mild",
      do_list: ["Tumawag sa 911 o magpatingin kung may emergency red flags."],
      don_t_list: ["Huwag sundin ang hindi malinaw o hindi ma-validate na medical instruction."],
      see_doctor_threshold:
        "Magpatingin agad kapag may hirap sa paghinga, malakas na pagdurugo, pagkawala ng malay, o mabilis na paglala.",
    },
  };
}

/** Build contextual follow-up suggestions based on the actual answer.
 * Hinahanap ang keywords sa title/summary para mas relevant ang chips.
 * Fallback sa category defaults kung walang match. */
function contextualSuggestions(answer: PaanoAnswer): string[] {
  const text = `${answer.title} ${answer.summary}`.toLowerCase();
  const spec = answer.category_specific;

  // Commute: kung may specific origin/destination, gamitin sa suggestion
  if (answer.category === "commute" && spec?.category === "commute") {
    const dest = spec.destination;
    const origin = spec.origin;
    if (dest && dest !== "?") {
      return [
        `May P2P bus ba papuntang ${dest}?`,
        `Paano kung galing ${origin && origin !== "?" ? origin : "iba"} sa rush hour?`,
        `Anong oras ang pinakamabilis papuntang ${dest}?`,
      ].slice(0, 3);
    }
    return CATEGORY_SUGGESTIONS.commute;
  }

  // Cooking: kung may dish name, gamitin sa variation suggestions
  if (answer.category === "cooking" && spec?.category === "cooking") {
    const dish = answer.title.toLowerCase();
    if (dish.includes("adobo")) {
      return [
        "Pwede bang pork adobo naman?",
        "Paano ang adobo sa gata?",
        "Anong side dish ang bagay sa adobo?",
      ];
    }
    if (dish.includes("sinigang")) {
      return [
        "Paano ang sinigang na isda?",
        "Anong iba pang sampalok alternatibo?",
        "Paano kung mas maasim ang gusto?",
      ];
    }
    if (dish.includes("pancit") || dish.includes("pansit")) {
      return [
        "Paano ang pancit canton na bilog?",
        "Anong ulam ang bagay sa pancit?",
        "Paano kung vegetarian ang pancit?",
      ];
    }
    if (spec.servings && spec.servings.includes("10")) {
      return ["Paano kung para sa 20 tao?", "Anong ulam ang pwedeng kasama nito?"];
    }
    return CATEGORY_SUGGESTIONS.cooking;
  }

  // Docs: kung may agency, i-suggest ang related documents
  if (answer.category === "docs" && spec?.category === "docs") {
    const agency = spec.agency.toLowerCase();
    if (agency.includes("nbi")) {
      return ["Paano kung may hit ako sa NBI?", "Saan ang nearest NBI branch sa akin?"];
    }
    if (agency.includes("passport") || agency.includes("dfa")) {
      return ["Magkano ang rush processing ng passport?", "Anong valid IDs ang tatanggapin?"];
    }
    if (agency.includes("lto") || agency.includes("driver")) {
      return ["Paano kung expired na ng 2 taon?", "Anong requirements sa student permit?"];
    }
    if (agency.includes("sss")) {
      return ["Paano mag-apply ng SSS ID online?", "Anong benefits ng SSS member?"];
    }
    return ["Paano kung nawala ang resibo?", "Saan ang nearest branch?"];
  }

  // First aid: kung may specific condition, i-suggest prevention
  if (answer.category === "first_aid" && spec?.category === "first_aid") {
    if (text.includes("burn") || text.includes("paso")) {
      return ["Paano maiiwasan ang paso sa kusina?", "Anong first aid kit dapat meron sa bahay?"];
    }
    if (text.includes("cut") || text.includes("gasgas") || text.includes("sugat")) {
      return ["Paano malulagnat ang sugat?", "Kailan kailangan ng tetanus shot?"];
    }
    if (text.includes("insect") || text.includes("kagat") || text.includes("lamok")) {
      return ["Paano maiiwasan ang dengue?", "Anong anti-mosquito na effective?"];
    }
    return CATEGORY_SUGGESTIONS.first_aid;
  }

  // DIY: kung may specific problem, i-suggest prevention
  if (answer.category === "diy") {
    if (text.includes("gripo") || text.includes("tulo")) {
      return ["Paano maiiwasan na masira ang gripo?", "Anong tools dapat meron sa bahay?"];
    }
    if (text.includes("ilaw") || text.includes("light")) {
      return ["Ligtas ba ang DIY electrical?", "Kailan dapat tawagin ang electrician?"];
    }
    return CATEGORY_SUGGESTIONS.diy;
  }

  // Generic: kung may topic, i-suggest related paano questions
  if (answer.category === "generic") {
    return [
      "Paano magluto ng mabilis na ulam?",
      "Paano magcommute sa Metro Manila?",
    ];
  }

  return CATEGORY_SUGGESTIONS[answer.category] ?? [];
}

export function isGreetingQuestion(text: string): boolean {
  return /^(?:hi|hello|hey|kumusta|kamusta|magandang\s+(?:umaga|hapon|gabi)|good\s+(?:morning|afternoon|evening))(?:\s+po)?[!,.\s]*$/i.test(
    text.trim(),
  );
}

function greetingAnswer(): PipelineResult {
  const answer: PaanoAnswer = {
    category: "generic",
    title: "Kumusta! Ano ang kailangan mo?",
    summary:
      "Nandito si PAANO para tumulong sa commute, lutong bahay, gawaing bahay, first aid, at government documents.",
    steps: [],
    confidence: "high",
    disclaimer: null,
    official_link: null,
    category_specific: null,
  };
  return {
    answer,
    source: "docs-static",
    suggestions: [
      "Paano magluto ng mabilis na ulam?",
      "Paano magcommute papuntang Quiapo?",
      "Ano ang gagawin sa maliit na paso?",
    ],
    repaired: false,
    raw: null,
  };
}

export async function runAnswerPipeline(
  messages: ChatMessage[],
  opts?: { image?: string; onStage?: (stage: PipelineStage) => void },
): Promise<PipelineResult> {
  const lastUserIndex = [...messages].reverse().findIndex((m) => m.role === "user");
  const lastUser =
    lastUserIndex !== -1 ? messages[messages.length - 1 - lastUserIndex] : undefined;

  // 1. Image → recipe: photo ng ingredients → anong ulam?
  if (opts?.image && lastUser) {
    return handleImageQuestion(lastUser.content, opts.image, opts.onStage);
  }

  // Stable classic recipe: avoid letting price-grounding or a small local
  // model invent ingredients for a basic adobo question.
  if (
    lastUser &&
    isRecipeRequest(lastUser.content) &&
    /\badobo\b/i.test(lastUser.content) &&
    !/gata|spicy|maanghang|kamatis|tomato|sili|kangkong/i.test(lastUser.content)
  ) {
    return classicAdoboAnswer();
  }

  // Safety-critical household task: do not let the small model improvise
  // electrical cleaning instructions (it previously suggested immersing the
  // fan in water). Keep this common task on a reviewed answer path.
  if (lastUser && /(?:electric fan|bentilador)/i.test(lastUser.content) && /(?:linis|linisin|clean)/i.test(lastUser.content)) {
    return electricFanCleaningAnswer();
  }

  // Greetings do not need an LLM answer card. Keeping this deterministic
  // avoids invented steps, confidence metadata, and irrelevant disclaimers.
  if (lastUser && isGreetingQuestion(lastUser.content)) {
    return greetingAnswer();
  }

  // Common first-aid questions use a reviewed, deterministic answer. This
  // prevents a small model from leaking JSON fields or inventing unsafe steps.
  if (lastUser) {
    const curatedFirstAid = findCuratedFirstAid(lastUser.content);
    if (curatedFirstAid) {
      return {
        answer: curatedFirstAid,
        source: "docs-static",
        suggestions: contextualSuggestions(curatedFirstAid),
        repaired: false,
        raw: null,
      };
    }
  }

  // Common recipes use a reviewed local answer for speed and completeness.
  // This prevents a small model from returning a recipe with missing
  // ingredients/servings just because its JSON was technically valid.
  if (lastUser) {
    const curatedRecipe = findCuratedRecipe(lastUser.content);
    if (curatedRecipe) {
      return {
        answer: curatedRecipe,
        source: "docs-static",
        suggestions: contextualSuggestions(curatedRecipe),
        repaired: false,
        raw: null,
      };
    }
  }

  // 2. Static docs guide — commute muna ang priority para hindi ma-flag na
  //    docs ang "papuntang PSA office".
  if (lastUser && !isCommuteQuestion(lastUser.content)) {
    const guide = findDocGuide(lastUser.content);
    if (guide) {
      return {
        answer: docGuideToAnswer(guide),
        source: "docs-static",
        suggestions: suggestedDocQuestions(guide),
        repaired: false,
        raw: null,
      };
    }
  }

  // 3. Mula rito, kailangan na ang LLM.
  if (!llmConfigured()) {
    throw new PipelineError(llmConfigError(), 503);
  }

  // 4. Grounding — commute muna (GTFS + LTFRB fares); kung hindi commute,
  //    cooking (palengke prices + budget/pantry). Hindi puro haka ang sagot.
  let groundedMessages = messages;
  let grounding: {
    commute: Awaited<ReturnType<typeof groundCommuteQuestion>>;
    cooking: Awaited<ReturnType<typeof groundCookingQuestion>>;
  } = { commute: null, cooking: null };

  if (lastUser) {
    opts?.onStage?.("grounding");
    const commute = await groundCommuteQuestion(lastUser.content);
    const cooking = commute ? null : await groundCookingQuestion(lastUser.content);
    grounding = { commute, cooking };
    opts?.onStage?.(
      commute ? "grounded-commute" : cooking ? "grounded-cooking" : "llm",
    );
    const context = commute?.context ?? cooking?.context;
    if (context) {
      groundedMessages = [
        ...messages.slice(0, messages.length - 1 - lastUserIndex),
        { ...lastUser, content: `${lastUser.content}\n\n${context}` },
        ...messages.slice(messages.length - lastUserIndex),
      ];
    }
  }

  // 5. LLM + data override (commute fares/routes).
  opts?.onStage?.("llm");
  const result = await askPaano(groundedMessages);
  const groundedAnswer = grounding.commute
    ? applyCommuteGrounding(result.answer, grounding.commute)
    : result.answer;
  // "High" is reserved for curated/static or externally grounded answers.
  // A free-form local model cannot establish that confidence by itself.
  const answer = groundedAnswer.confidence === "high"
    ? { ...groundedAnswer, confidence: "medium" as const }
    : groundedAnswer;
  let safeAnswer = validateGeneratedAnswer(answer);
  if (hasMalformedFirstAidShape(safeAnswer)) {
    safeAnswer = unvalidatedFirstAidFallback();
  }
  if (safeAnswer.category === "cooking" && safeAnswer.category_specific?.category === "cooking") {
    const incomplete = safeAnswer.category_specific.ingredients.length < 3 || !safeAnswer.category_specific.servings.trim();
    if (incomplete) {
      safeAnswer = {
        ...safeAnswer,
        confidence: "low",
        disclaimer: safeAnswer.disclaimer ?? "Kulang ang structured recipe details. I-verify ang ingredients at servings bago magluto, o itanong ulit nang mas specific.",
      };
    }
  }
  if (grounding.commute && safeAnswer.category === "commute") {
    safeAnswer = {
      ...safeAnswer,
      provenance: grounding.commute.provenance,
    };
  } else if (grounding.cooking?.priceProvenance && safeAnswer.category === "cooking") {
    safeAnswer = { ...safeAnswer, provenance: grounding.cooking.priceProvenance };
  } else if (safeAnswer.category === "first_aid") {
    safeAnswer = {
      ...safeAnswer,
      confidence: safeAnswer.confidence === "high" ? "medium" : safeAnswer.confidence,
      provenance: {
        label: "General household first-aid guidance",
        asOf: null,
        status: "needs_review",
        note: "General information lamang—hindi diagnosis. Para sa emergency o lumalalang sintomas, tumawag sa health professional.",
        url: "https://doh.gov.ph/",
      },
    };
  }

  return {
    answer: safeAnswer,
    source: "llm",
    suggestions: contextualSuggestions(safeAnswer),
    repaired: result.repaired,
    raw: result.raw,
  };
}

function classicAdoboAnswer(): PipelineResult {
  const answer: PaanoAnswer = {
    category: "cooking",
    title: "Paano Magluto ng Adobo",
    summary:
      "Igisa ang bawang, ilagay ang manok o baboy, saka pakuluan sa toyo at suka hanggang lumambot at kumapal ang sauce.",
    steps: [
      "Maghiwa ng 1 ulo ng bawang. Igisa sa 1 kutsarang mantika hanggang mabango.",
      "Ilagay ang 1 kilo manok o baboy at haluin hanggang bahagyang mag-brown.",
      "Idagdag ang 1/2 tasa toyo, 1/2 tasa suka, 1/2 tasa tubig, 2 dahon ng laurel, at 1 kutsaritang paminta.",
      "Pakuluan nang 5 minuto nang hindi hinahalo, saka hinaan ang apoy at lutuin nang 30–45 minuto hanggang malambot.",
      "Tikman at i-adjust ang alat. Kung gusto ng tuyong adobo, pakuluan pa hanggang kumapal ang sauce; ihain kasama ng kanin.",
    ],
    confidence: "high",
    disclaimer: null,
    official_link: null,
    category_specific: {
      category: "cooking",
      ingredients: [
        { item: "manok o baboy", amount: "1 kilo" },
        { item: "toyo", amount: "1/2 tasa" },
        { item: "suka", amount: "1/2 tasa" },
        { item: "bawang", amount: "1 ulo" },
        { item: "dahon ng laurel", amount: "2 dahon" },
        { item: "paminta", amount: "1 kutsarita" },
        { item: "tubig", amount: "1/2 tasa" },
      ],
      servings: "4–6 tao",
      tips: [
        "Huwag haluin agad pagkatapos ilagay ang suka para hindi maging mapait ang sauce.",
        "Suggestion: Pwedeng manok, baboy, o half-and-half kung gusto ng mas malasa.",
      ],
    },
  };
  return { answer, source: "docs-static", suggestions: ["Paano ang pork adobo?", "Paano ang adobo sa gata?"], repaired: false, raw: null };
}

function electricFanCleaningAnswer(): PipelineResult {
  const answer: PaanoAnswer = {
    category: "diy",
    title: "Paano Maglinis ng Electric Fan nang Ligtas",
    summary:
      "I-unplug muna ang electric fan, alisin ang grille at blade kung kaya, at linisin ang mga ito nang hiwalay. Huwag basain o ilubog ang motor at electrical parts.",
    steps: [
      "Patayin at i-unplug ang electric fan bago hawakan o kalasin.",
      "Alisin ang front grille at blade ayon sa manual; kung hindi sigurado, linisin na nakakabit ang parts.",
      "Gumamit ng soft brush o vacuum para sa alikabok sa grille, blade, at likod ng motor.",
      "Punasan ang grille at blade gamit ang bahagyang mamasa-masang tela, pagkatapos ay patuyuin nang lubos.",
      "Huwag mag-spray o magbuhos ng tubig sa motor, switch, cord, o housing. Ibalik ang mga bahagi kapag ganap nang tuyo bago isaksak.",
    ],
    confidence: "high",
    disclaimer: "Kung may amoy sunog, punit na cord, spark, o sobrang init, huwag gamitin; ipasuri sa kwalipikadong technician.",
    official_link: null,
    category_specific: {
      category: "diy",
      tools: ["soft brush o vacuum", "bahagyang mamasa-masang tela"],
      materials: ["malinis na tubig para sa tela lamang"],
      safety_warning: "I-unplug muna. Huwag ilubog o basain ang motor at electrical parts.",
    },
  };
  return { answer, source: "docs-static", suggestions: ["Paano linisin ang aircon filter?", "Kailan ipagawa ang electric fan?"] , repaired: false, raw: null };
}

/**
 * Image → recipe (Sprint 3, narrowed):
 *  1. Vision call: tukuyin ang mga sangkap sa larawan
 *  2. Match sa curated Filipino dish map (hindi free-association)
 *  3. Compose cooking answer na may detected ingredients + dish candidates
 *     + palengke prices
 */
async function handleImageQuestion(
  text: string,
  imageDataUrl: string,
  onStage?: (stage: PipelineStage) => void,
): Promise<PipelineResult> {
  try {
    onStage?.("vision");
    const raw = await askPaanoVision(
      'Tukuyin ang mga sangkap/pagkain na nakikita sa larawan. Return ONLY JSON: {"ingredients":[{"item":"pangalan","qty":"dami o null"}]}',
      imageDataUrl,
    );
    const obj = extractJsonObject(raw, { last: true });
    const data = obj ? (JSON.parse(obj) as { ingredients?: unknown[] }) : null;
    const ingredients = (data?.ingredients ?? [])
      .filter((i) => typeof i === "object" && i !== null)
      .map((i) => String((i as Record<string, unknown>).item ?? "").trim())
      .filter(Boolean)
      .slice(0, 12);

    if (ingredients.length === 0) {
      return {
        answer: fallbackAnswer("Hindi makita ang mga sangkap sa larawan. Subukan ang mas malinaw na litrato, o magtanong sa text."),
        source: "llm",
        suggestions: [],
        repaired: true,
        raw,
      };
    }

    const dishes = matchDishes(ingredients, 5);
    const composed =
      `${text.trim() || "Anong ulam ang pwedeng lutuin sa mga sangkap na ito?"}\n\n` +
      `[Detected ingredients mula sa larawan: ${ingredients.join(", ")}]\n` +
      `[Candidate Filipino dishes (kung tugma): ${dishes.map((d) => d.name).join("; ") || "wala sa listahan — magmungkahi ng iba"}]`;

    onStage?.("llm");
    const result = await askPaano([{ role: "user", content: composed }]);
    const safeAnswer = validateGeneratedAnswer(result.answer);
    return {
      answer: safeAnswer,
      source: "llm",
      suggestions: contextualSuggestions(safeAnswer),
      repaired: result.repaired,
      raw: result.raw,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("API_KEY")) throw new PipelineError(message, 503);
    return {
      answer: fallbackAnswer("Hindi maproseso ang larawan ngayon. Subukan muli sa ilang sandali, o magtanong sa text."),
      source: "llm",
      suggestions: [],
      repaired: true,
      raw: null,
    };
  }
}
