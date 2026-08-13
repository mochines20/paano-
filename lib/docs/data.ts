/**
 * Human-reviewed document guides (Sprint 5) — STATIC content, hindi
 * ginagawang libre ng LLM. I-review/refresh ang mga ito nang manu-mano
 * sa isang schedule (lalo na ang fees at requirements).
 *
 * Modelado bilang maliit na dependency graph: ang `prerequisites` ay
 * tumutukoy sa ibang doc id, para masabi ng PAANO ang "kailangan mo munang
 * makuha ito" imbes na maglista lang ng mga hakbang.
 *
 * Last verified: 2026-08-13
 */

export interface DocFee {
  item: string;
  amount: string;
  updated: string | null;
}

export interface DocGuide {
  id: string;
  title: string;
  agency: string;
  summary: string;
  /** Keywords para sa pag-match ng tanong (mas mahaba = mas specific). */
  keywords: string[];
  steps: string[];
  requirements: string[];
  fees: DocFee[];
  processing_time: string | null;
  official_link: { label: string; url: string };
  /** Doc ids na dapat meron ka muna. */
  prerequisites: string[];
  /** Anong mga dokumento ang pwedeng i-validate nito (graph reverse edge). */
  usedAsIdFor: string[];
  /** Proactive warnings — ang mga bagay na hindi sinasabi ng ibang guides. */
  alerts: string[];
  lastVerified: string;
}

export const DOC_GUIDES: DocGuide[] = [
  {
    id: "psa-certificate",
    title: "PSA Certificate (Birth / Marriage / Death / CENOMAR)",
    agency: "PSA",
    summary:
      "Humingi ng opisyal na kopya ng birth, marriage, o death certificate online sa psahelpline.ph — ₱365 per copy na kasama na ang processing at door-to-door delivery.",
    keywords: [
      "birth certificate",
      "birth cert",
      "certificate of live birth",
      "marriage certificate",
      "marriage cert",
      "death certificate",
      "cenomar",
      "ceno death",
      "psa",
      "birth registry",
      "live birth",
      "psa certificate",
      "psa online",
    ],
    steps: [
      "Pumunta sa psahelpline.ph (ang opisyal na authorized online channel ng PSA) — may mga look-alike site, kaya i-cross-check ang 'official PSA authorized' na wording.",
      "Piliin ang uri ng certificate: Birth, Marriage, Death, CENOMAR (no-marriage-record), o CENODEATH.",
      "Punan ang request form: buong pangalan, petsa ng kapanganakan, lugar ng kapanganakan/kasal.",
      "Magbayad online — credit/debit card, e-wallet, over-the-counter, o partner outlets.",
      "Hintayin ang door-to-door delivery: Metro Manila kadalasang next-day pagkatapos i-release ng PSA; provincial, mas matagal.",
    ],
    requirements: [
      "Details ng registrant: buong pangalan, petsa ng kapanganakan, lugar ng kapanganakan/kasal",
      "Bayad: ₱365 per copy (kasama na ang processing at delivery)",
    ],
    fees: [
      {
        item: "PSA Certificate (birth/marriage/death) — SECPA delivery",
        amount: "₱365 per copy (kasama na ang processing + delivery)",
        updated: "2026-08",
      },
      {
        item: "PSA E-Certificate (digital copy)",
        amount: "₱290 — pinakamabilis; nangangailangan ng identity verification",
        updated: "2026-08",
      },
      {
        item: "PSA SECPA pickup",
        amount: "₱335 (pickup sa National Book Store / Robinsons branches)",
        updated: "2026-08",
      },
      {
        item: "CENOMAR / CENODEATH",
        amount: "₱420 per copy",
        updated: "2026-08",
      },
    ],
    processing_time:
      "Metro Manila: kadalasang next-day pagkatapos i-release ng PSA; provincial: 3–8 working days",
    official_link: {
      label: "PSA Helpline (opisyal)",
      url: "https://psahelpline.ph",
    },
    prerequisites: [],
    usedAsIdFor: ["passport", "nbi-clearance", "lto-student-permit", "philsys-national-id"],
    alerts: [
      "Posting period: ang bagong-registered birth/marriage ay kailangang ma-post muna bago ma-request online — humigit-kumulang 2–4 na buwan kung sa Metro Manila naregister, hindi bababa sa 6 na buwan kung sa probinsya (batay sa transmittal date sa PSA).",
      "May mga pekeng/klon na PSA site — pumunta lang sa psahelpline.ph at hanapin ang 'official PSA authorized' na wording.",
      "Pwedeng magtalaga ng ibang tao para tumanggap ng delivery sa pamamagitan ng online Letter of Authorization (LOA).",
    ],
    lastVerified: "2026-08-13",
  },
  {
    id: "lto-student-permit",
    title: "LTO Student Permit",
    agency: "LTO",
    summary:
      "Ang unang hakbang para sa lisensya: magrehistro sa LTMS portal, kumpletuhin ang 15-hour TDC sa accredited school, tapos pumunta sa LTO para sa exam at biometrics (₱150 para sa permit mismo).",
    keywords: [
      "student permit",
      "student's permit",
      "students permit",
      "lto permit",
      "theoretical driving course",
      "tdc",
      "paano magdrive",
    ],
    steps: [
      "Magrehistro ng LTMS account sa portal.lto.gov.ph — hindi ka makakapasok sa LTO office para sa bagong license kung wala nito; doon ka rin mag-apply, pipili ng appointment, at magbabayad ng initial fee.",
      "Kumpletuhin ang mandatory 15-hour Theoretical Driving Course (TDC) sa LTO-accredited school — electronic ang submission ng school sa LTO; walang certificate, walang application.",
      "Ihanda ang mga requirements: valid gov ID, PSA birth certificate (o LCR-authenticated), TIN kung employed, parental consent kung minor.",
      "Pumunta sa LTO para sa exam/encoding, bayaran ang student permit fee (₱150), at magpakuha ng biometrics.",
      "I-claim ang permit.",
    ],
    requirements: [
      "Valid government ID",
      "PSA birth certificate (o LCR-authenticated)",
      "TIN kung employed",
      "Parental consent kung minor",
      "Certificate of completion ng 15-hour TDC (electronic submission ng school)",
    ],
    fees: [
      { item: "Student permit fee", amount: "₱150 (per LTO fee schedule)", updated: "2026-08" },
      { item: "15-hour TDC", amount: "Nag-iiba-iba depende sa accredited school", updated: null },
    ],
    processing_time: "Sa araw ng appointment (exam + encoding + biometrics)",
    official_link: { label: "LTO LTMS Portal", url: "https://portal.lto.gov.ph" },
    prerequisites: ["psa-certificate"],
    usedAsIdFor: ["passport", "nbi-clearance", "philsys-national-id"],
    alerts: [
      "Ang mga fee na makikita online ay nag-iiba-iba depende sa source/year — ituring na 'as of 2026' at i-verify sa LTO mismo.",
    ],
    lastVerified: "2026-08-13",
  },
  {
    id: "lto-nonpro-license",
    title: "LTO Non-Professional Driver's License",
    agency: "LTO",
    summary:
      "Pagkatapos hawakan ang Student Permit sa kinakailangang panahon: kumpletuhin ang Practical Driving Course, pumasa sa written exam at driving test, at bayaran ang license fee (₱585).",
    keywords: [
      "driver's license",
      "drivers license",
      "driver license",
      "non-professional",
      "non professional",
      "nonpro",
      "non-pro",
      "lisensya",
      "practical driving course",
      "pdc",
      "magrenew ng license",
      "renew license",
    ],
    steps: [
      "Siguraduhing hawak mo ang Student Permit sa kinakailangang panahon bago mag-apply.",
      "Kumpletuhin ang Practical Driving Course (PDC) sa LTO-accredited driving center.",
      "Pumasa sa LTO written exam, tapos sa aktwal na driving test.",
      "Bayaran ang license fee (₱585 per LTO schedule), at magpakuha ng photo at biometrics.",
      "I-claim ang lisensya.",
    ],
    requirements: [
      "Student Permit (hawak sa kinakailangang panahon)",
      "PDC completion certificate",
      "Passing score sa written exam at driving test",
    ],
    fees: [
      { item: "Non-Professional license fee", amount: "₱585 (per LTO fee schedule)", updated: "2026-08" },
      { item: "Practical Driving Course", amount: "Nag-iiba-iba depende sa accredited center", updated: null },
    ],
    processing_time: "Pagkatapos pumasa sa written exam at driving test",
    official_link: { label: "LTO LTMS Portal", url: "https://portal.lto.gov.ph" },
    prerequisites: ["lto-student-permit"],
    usedAsIdFor: [],
    alerts: [
      "Ang mga fee na makikita online ay nag-iiba-iba depende sa source/year — ituring na 'as of 2026' at i-verify sa LTO mismo.",
    ],
    lastVerified: "2026-08-13",
  },
  {
    id: "passport",
    title: "Philippine Passport (DFA)",
    agency: "DFA",
    summary:
      "Appointment-only na ang pagkuha ng passport: mag-book sa opisyal na DFA portal, dalhin ang PSA birth certificate at valid ID, at pumunta sa eksaktong appointment para sa biometrics.",
    keywords: ["passport", "dfa"],
    steps: [
      "Mag-book ng appointment online sa opisyal na DFA portal — appointment-only na; hindi tinatanggap ang walk-in (except special Courtesy Lane cases).",
      "Bayaran ang appointment fee sa payment center kapag nag-book.",
      "Ihanda: PSA birth certificate (SECPA, original + photocopy), 1 valid government ID (mas safe ang 2), accomplished application form na may barcode, at printed appointment confirmation.",
      "Pumunta nang eksakto sa appointment date/time para sa biometrics — digital photo at fingerprints ang kukunan, at personal appearance ay mandatory para sa lahat.",
      "Bayaran ang passport fee sa counter, kunin ang claim stub, at hintayin ang release (regular vs expedite ang processing time).",
    ],
    requirements: [
      "PSA birth certificate (SECPA — original + photocopy)",
      "Valid government ID (2 mas safe)",
      "Accomplished application form na may barcode",
      "Printed appointment confirmation",
    ],
    fees: [
      { item: "Appointment fee", amount: "Bayaran sa booking (payment center)", updated: null },
      { item: "Passport fee", amount: "As of booking sa DFA portal (regular vs expedite)", updated: "2026-08" },
    ],
    processing_time: "Regular vs expedite — itinakda sa claim stub",
    official_link: { label: "DFA Passport Portal", url: "https://www.dfa.gov.ph" },
    prerequisites: ["psa-certificate"],
    usedAsIdFor: [],
    alerts: [
      "Huwag dumiretso nang walang appointment — walk-in ay hindi na tinatanggap (except Courtesy Lane).",
    ],
    lastVerified: "2026-08-13",
  },
  {
    id: "nbi-clearance",
    title: "NBI Clearance",
    agency: "NBI",
    summary:
      "Mag-apply sa opisyal na NBI portal, pumili ng branch at appointment slot, magbayad online, tapos pumunta sa branch para sa biometrics — same-day release kung walang 'hit'.",
    keywords: ["nbi clearance", "nbi", "clearance ng nbi"],
    steps: [
      "Magrehistro o mag-login sa opisyal na NBI clearance portal.",
      "Punan ang personal info: pangalan, birthdate, civil status, address, at purpose.",
      "Kung 2014 o mas bago ang huling clearance mo, pwede kang mag-renew online nang hindi inuulit ang buong profile — mag-login gamit ang lumang NBI ID number, kumpirmahin ang details, at piliin ang branch visit o delivery. Kung first time o pre-2014 ang huli, mag-apply bilang new.",
      "Pumili ng ID, branch, at appointment slot; magbayad online (GCash, bank, o over-the-counter).",
      "Pumunta sa branch sa iyong slot para sa biometrics at photo capture.",
      "Pagkatapos ng biometrics, malalaman mo agad kung same-day ang release, o kung may 'hit' (name-match flag) na kailangan ng karagdagang verification.",
    ],
    requirements: [
      "Valid ID na pipiliin sa portal",
      "Lumang NBI ID number kung nagre-renew (2014 o mas bago)",
    ],
    fees: [
      { item: "NBI Clearance fee", amount: "Ayon sa portal (GCash/bank/OTC) — maaaring magbago", updated: "2026-08" },
      { item: "First-time job seeker (RA 11261)", amount: "Libre — sa pamamagitan ng hiwalay na portal, hindi sa regular", updated: "2026-08" },
    ],
    processing_time: "Same-day release kung walang 'hit'; kung may hit, may verification",
    official_link: { label: "NBI Clearance Portal", url: "https://nbi.gov.ph" },
    prerequisites: ["psa-certificate"],
    usedAsIdFor: [],
    alerts: [
      "First-time job seekers: libre ang isang clearance sa ilalim ng RA 11261, PERO dapat mag-register sa hiwalay na portal ng programa, hindi sa regular.",
    ],
    lastVerified: "2026-08-13",
  },
  {
    id: "philsys-national-id",
    title: "PhilSys National ID",
    agency: "PSA / PhilSys",
    summary:
      "Walk-in na ang proseso — isinara ng PSA ang online Step 1 pre-registration portal noong 2023. Pumunta sa anumang PhilSys Registration Center dala ang PSA birth certificate; libre ang lahat.",
    keywords: [
      "national id",
      "national i.d",
      "national identification",
      "philsys",
      "phil sys",
      "phil-id",
      "phil id",
      "philid",
      "national id card",
      "id system",
    ],
    steps: [
      "Diretso sa anumang PhilSys Registration Center (PSA offices, mall booths, barangay centers, o mobile 'National ID on Wheels'/'on Boat' para sa remote areas) — walk-in na ang proseso, first-come first-served.",
      "Dalhin ang supporting documents — isang primary document lang ang sapat (PSA birth certificate, passport, driver's license, o UMID); secondary ID kung kailangan.",
      "I-validate ang demographic data at i-capture ang biometrics sa parehong visit: fingerprints, iris scan, at front-facing photo.",
      "Kunin ang transaction slip na may Transaction Reference Number (TRN) — ito ang gamit sa pag-track ng delivery at sa ePhilID (digital copy).",
    ],
    requirements: [
      "Isang primary document (hal. PSA birth certificate, passport, driver's license, UMID)",
      "Secondary document kung kailangan",
    ],
    fees: [
      { item: "First registration", amount: "Libre — walang lehitimong bayad", updated: "2026-08" },
    ],
    processing_time: "TRN slip sa parehong araw; ePhilID/digital copy — mas mabilis; physical card via PHLPost (weeks)",
    official_link: { label: "PhilSys", url: "https://philsys.gov.ph" },
    prerequisites: ["psa-certificate"],
    usedAsIdFor: [],
    alerts: [
      "Maraming online guides ang outdated — ang online Step 1 pre-registration portal (register.philsys.gov.ph) ay isinara noong 2023; walk-in na ang proseso. Kung may site na humihingi ng online appointment para sa bagong registration, malamang na luma ang info na iyon.",
      "Libre ang first registration — huwag magbayad sa sinumang maniningil.",
    ],
    lastVerified: "2026-08-13",
  },
];

export const DOC_TITLES: Record<string, string> = Object.fromEntries(
  DOC_GUIDES.map((g) => [g.id, g.title]),
);
