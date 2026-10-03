import type { PaanoAnswer } from "@/lib/answers";

const FIRST_AID_PROVENANCE = {
  label: "Human-reviewed household first-aid guide",
  asOf: "2026-09-30",
  status: "needs_review" as const,
  note:
    "General first-aid information lamang—hindi diagnosis. I-verify sa health professional; tumawag sa 911 kung emergency.",
  url: "https://www.nhs.uk/conditions/burns-and-scalds/",
};

/**
 * Safe, deterministic answers for common household first-aid questions.
 * These stay off the small local model because malformed medical output is
 * higher risk than a slower generic answer.
 */
export function findCuratedFirstAid(question: string): PaanoAnswer | null {
  if (/(?:minor|maliit|light|simpleng)?\s*(?:burn|paso|napaso|scald)/i.test(question)) {
    return {
      category: "first_aid",
      title: "Unang Tulong sa Maliit na Paso",
      summary:
        "Palamigin agad ang paso sa ilalim ng malamig o maligamgam na umaagos na tubig nang 20 minuto. Huwag yelo, toothpaste, langis, o mantikilya.",
      steps: [
        "Ilayo muna ang kamay sa init. Alisin ang singsing, relo, o damit na malapit sa paso—pero huwag piliting tanggalin ang nakadikit sa balat.",
        "Ilagay sa malamig o maligamgam na umaagos na tubig nang 20 minuto. Huwag gumamit ng yelo o sobrang lamig na tubig.",
        "Pagkatapos palamigin, takpan nang maluwag ng malinis na non-stick dressing o cling film na nakapatong lamang—huwag balutin nang mahigpit.",
        "Huwag butasin ang paltos at huwag lagyan ng toothpaste, butter, langis, cream, o ibang home remedy.",
      ],
      confidence: "medium",
      disclaimer:
        "Magpatingin agad kung mas malaki sa palad, malalim o puti/maitim ang balat, may kuryente o kemikal na sangkot, nasa mukha/mata/kamay/kasukasuan, o nahihirapang huminga.",
      official_link: {
        label: "NHS burns and scalds first-aid guide",
        url: "https://www.nhs.uk/conditions/burns-and-scalds/",
      },
      provenance: FIRST_AID_PROVENANCE,
      category_specific: {
        category: "first_aid",
        severity: "mild",
        do_list: [
          "Palamigin sa umaagos na tubig nang 20 minuto.",
          "Alisin ang alahas o damit na malapit sa paso kung hindi nakadikit.",
          "Takpan nang maluwag gamit ang malinis na non-stick dressing o cling film.",
        ],
        don_t_list: [
          "Huwag gumamit ng yelo o sobrang lamig na tubig.",
          "Huwag lagyan ng toothpaste, butter, langis, cream, o ibang home remedy.",
          "Huwag butasin ang paltos o tanggalin ang nakadikit na tela.",
        ],
        see_doctor_threshold:
          "Urgent care kung mas malaki sa palad, malalim/puti/maitim, chemical/electrical, nasa mukha, mata, kamay, malaking kasukasuan, o may hirap sa paghinga.",
      },
    };
  }

  return null;
}
