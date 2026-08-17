/**
 * Diskarte & Pamalit (Substitutes) Database
 * Para sa mga pagkakataong kulang ang sangkap sa kusina o gamit sa bahay.
 *
 * Lahat ay nabibili sa karaniwang sari-sari store, palengke, o mahahanap sa bahay.
 */

export interface Substitute {
  id: string;
  original: string;
  category: "cooking" | "diy";
  substitutes: {
    name: string;
    ratioOrHow: string;
    note?: string;
    safety?: string;
  }[];
}

export const SUBSTITUTES: Substitute[] = [
  // ── Cooking Substitutes ──────────────────────────────────────────
  {
    id: "sampalok",
    original: "Sampalok (Tamarind)",
    category: "cooking",
    substitutes: [
      {
        name: "Kalamansi",
        ratioOrHow: "6–8 pirasong kalamansi",
        note: "Palamigin bahagya bago pigain para hindi pumait.",
      },
      {
        name: "Kamias (Iba)",
        ratioOrHow: "5–6 pirasong hinog o hilaw na kamias",
        note: "Pakuluan kasabay ng kamatis at sibuyas.",
      },
      {
        name: "Manggang Hilaw",
        ratioOrHow: "1/2 pirasong hilaw na mangga (hiniwa)",
        note: "Masarap na asim para sa sinigang na isda o hipon.",
      },
      {
        name: "Sinigang Mix Powder",
        ratioOrHow: "1 pack (20g–40g) para sa 1L sabaw",
        note: "Available sa kahit saang sari-sari store (₱15–₱20).",
      },
    ],
  },
  {
    id: "laurel",
    original: "Dahon ng Laurel (Bay Leaf)",
    category: "cooking",
    substitutes: [
      {
        name: "Dagdag na Pamintang Buo at Bawang",
        ratioOrHow: "1/2 kutsaritang pamintang buo + 2 cloves bawang",
        note: "Para makuha ang mabangong earthy aroma ng adobo.",
      },
      {
        name: "Tanglad (Lemongrass)",
        ratioOrHow: "1 tangkay ng pinitpit na tanglad",
        note: "Masarap din sa paksiw at lechon kawali stew.",
      },
    ],
  },
  {
    id: "gata",
    original: "Sariwang Gata (Coconut Milk)",
    category: "cooking",
    substitutes: [
      {
        name: "Gata Powder (Instant)",
        ratioOrHow: "1 sachet (50g) tinunaw sa 1 tasa maligamgam na tubig",
        note: "Mabibili sa sari-sari store (₱25–₱30).",
      },
      {
        name: "Evaporated Milk + Kaunting Mantika",
        ratioOrHow: "1/2 tasa evap + 1 kutsaritang mantika",
        note: "Pampalapot at pampalasa sa ginataang gulay kung gipit.",
      },
    ],
  },
  {
    id: "suka",
    original: "Suka (Vinegar)",
    category: "cooking",
    substitutes: [
      {
        name: "Kalamansi Juice",
        ratioOrHow: "4–5 kutsarang katas ng kalamansi",
        note: "Mas preskong asim para sa bistek o sawsawan.",
      },
      {
        name: "Lemon o Lime",
        ratioOrHow: "3 kutsarang lemon juice",
      },
    ],
  },
  {
    id: "toyo",
    original: "Toyo (Soy Sauce)",
    category: "cooking",
    substitutes: [
      {
        name: "Patis + Asukal",
        ratioOrHow: "1 kutsarang patis + 1/2 kutsaritang asukal na pula",
        note: "May alat at umami na katulad ng toyo.",
      },
      {
        name: "Worcestershire Sauce / Knorr Liquid Seasoning",
        ratioOrHow: "1:1 ratio",
      },
    ],
  },
  {
    id: "sayote",
    original: "Sayote (Chayote)",
    category: "cooking",
    substitutes: [
      {
        name: "Papayang Hilaw",
        ratioOrHow: "1:1 ratio sa tinola",
        note: "Tradisyonal na sangkap sa tinolang manok bago nauso ang sayote.",
      },
      {
        name: "Upo (Bottle Gourd)",
        ratioOrHow: "1:1 ratio",
      },
    ],
  },
  {
    id: "malunggay",
    original: "Dahon ng Malunggay",
    category: "cooking",
    substitutes: [
      {
        name: "Dahon ng Sili",
        ratioOrHow: "1 buwig (dahon lang)",
        note: "May banayad na anghang at sarap sa tinola.",
      },
      {
        name: "Kangkong o Spinach",
        ratioOrHow: "1 tali ng kangkong leaves",
      },
    ],
  },

  // ── DIY / Household Tool Substitutes ──────────────────────────────
  {
    id: "wrench",
    original: "Wrench / Spanner",
    category: "diy",
    substitutes: [
      {
        name: "Lalagyan ng Makapal na Rubber Band + Pliers",
        ratioOrHow: "Balutin ng rubber band ang bolt/nut bago ipitin ng plais",
        note: "Para hindi madulas at hindi ma-gasgas ang metal.",
        safety:
          "Hindi para sa malakas na torke o mainit na tubo. Gumamit ng totoong wrench para sa gas, tubig pressure, o structural bolts.",
      },
      {
        name: "Duct Tape sa Plais Teeth",
        ratioOrHow: "I-tape ang dulo ng plais",
        safety: "Pansamantalang fix lang. Hindi sapat para sa malaking bolt o critical na koneksyon.",
      },
    ],
  },
  {
    id: "funnel",
    original: "Funnel / Embudo",
    category: "diy",
    substitutes: [
      {
        name: "Pinutol na Plastic Bottle (Mineral Water)",
        ratioOrHow: "Gupitin ang itaas na bahagi ng 500ml bote",
        note: "Instant embudo para sa mantika, gasolina, o tubig.",
      },
    ],
  },
  {
    id: "tape-sealant",
    original: "Teflon Tape / Pipe Sealant",
    category: "diy",
    substitutes: [
      {
        name: "Kandila Wax (Candle Wax) Rub",
        ratioOrHow: "Ipahid ang kandila sa thread ng tubo bago ipihit",
        note: "Pansamantalang selyo para sa tumutulong gripo habang walang teflon.",
        safety:
          "Hindi gamitin sa gas line o high-pressure water. Teflon tape lang ang ligtas para sa gas at mainit na tubo.",
      },
    ],
  },
  {
    id: "scrubber",
    original: "Steel Wool / Scrubber",
    category: "diy",
    substitutes: [
      {
        name: "Ginulong Aluminum Foil",
        ratioOrHow: "Lukutin ang foil na parang bola",
        note: "Pantanggal ng sunog at kalawang sa kaldero at ihawan.",
      },
    ],
  },
];

/**
 * Hanapin ang mga kaugnay na pamalit (substitutes) ayon sa sangkap o gamit sa tanong/sagot.
 */
export function findSubstitutesForItems(
  items: string[],
  category?: "cooking" | "diy",
): Substitute[] {
  const queryWords = items.map((i) => i.toLowerCase().trim());
  return SUBSTITUTES.filter((sub) => {
    if (category && sub.category !== category) return false;
    const orig = sub.original.toLowerCase();
    const id = sub.id.toLowerCase();
    return queryWords.some((q) => orig.includes(q) || q.includes(id) || id.includes(q));
  });
}
