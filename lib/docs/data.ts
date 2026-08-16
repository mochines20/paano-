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
  {
    id: "sss-membership",
    title: "SSS Membership Registration",
    agency: "SSS",
    summary:
      "Magrehistro bilang SSS member (employed, self-employed, o voluntary) — pwede online sa My.SSS portal o sa kahit anumang SSS branch. Libre ang registration; kailangan lang ng PSA birth certificate at valid ID.",
    keywords: [
      "sss",
      "sss registration",
      "sss member",
      "sss membership",
      "magregister sa sss",
      "sss online",
      "my sss",
      "social security system",
      "sss number",
    ],
    steps: [
      "Pumunta sa opisyal na SSS website (sss.gov.ph) at i-click ang 'Member' tab, o diretso sa My.SSS portal para mag-rehistro online.",
      "Piliin ang membership category: Employed, Self-Employed, Voluntary, Non-Working Spouse, o OFW.",
      "Punan ang online registration form: personal info, birthdate, address, at beneficiary details.",
      "I-upload o dalhin ang requirements: PSA birth certificate at valid government ID.",
      "Kung employed, i-coordinate sa employer para sa Employer ID (ER) at R-1A submission; kung self-employed/voluntary, magbayad ng monthly contribution sa SSS branch, accredited bank, o online payment partner.",
      "Kunin ang SSS Number at CRN (Common Reference Number) — ito ang gagamitin sa lahat ng SSS transactions.",
    ],
    requirements: [
      "PSA birth certificate (original + photocopy)",
      "1–2 valid government IDs",
      "Accomplished SSS Personal Record form (E-1) kung sa branch",
      "Proof of income o source of funds kung self-employed/voluntary",
      "UMID card kung mayroon na (para sa CRN linking)",
    ],
    fees: [
      { item: "SSS Membership registration", amount: "Libre — walang bayad ang pag-rehistro", updated: "2025-01" },
      { item: "Monthly contribution (self-employed/voluntary)", amount: "₱3,000–₱19,750 salary bracket → minimum contribution ~₱570 (2024 MSC table)", updated: "2025-01" },
    ],
    processing_time: "Online registration: instant SSS number; branch: same-day kung kumpleto ang documents",
    official_link: { label: "SSS Official Website", url: "https://www.sss.gov.ph" },
    prerequisites: ["psa-certificate"],
    usedAsIdFor: ["sss-umid-id", "philsys-national-id"],
    alerts: [
      "Huwag magbayad sa fixer — libre lang ang registration; ang contribution ang dapat bayaran, hindi ang pag-rehistro mismo.",
      "Kung self-employed, kailangan mong patuloy na magbayad ng contribution para maging active ang membership at ma-claim ang benefits.",
    ],
    lastVerified: "2025-01-15",
  },
  {
    id: "sss-umid-id",
    title: "SSS UMID ID Application",
    agency: "SSS",
    summary:
      "Ang UMID (Unified Multi-Purpose ID) ay ang opisyal na ID card ng SSS — pwede ring gamitin bilang valid ID sa iba't ibang transactions. Kailangan muna ang SSS number bago mag-apply.",
    keywords: [
      "umid",
      "umid id",
      "umid card",
      "sss umid",
      "sss id",
      "sss id card",
      "unified multi-purpose id",
      "umid application",
    ],
    steps: [
      "Siguraduhing may SSS number ka na at active ang membership (may kahit isang posted contribution).",
      "Pumunta sa SSS branch o UMID Enrollment Center — hindi lahat ng branch ay may UMID capture facility, kaya tawagan muna o i-check online.",
      "I-fill out ang UMID ID Application Form (U-6) — available sa branch o sa My.SSS portal.",
      "Magpa-capture ng biometrics: fingerprints, photo, at signature sa SSS ID Capture Station.",
      "Magbayad ng UMID ID fee sa branch (cash o authorized payment channel).",
      "Hintayin ang delivery ng UMID card via PHLPost — dadating sa registered address, kaya siguraduhing tama ang address na nasa SSS record.",
    ],
    requirements: [
      "SSS Number (prerequisite — kailangan muna mag-register sa SSS)",
      "2 valid government IDs",
      "Accomplished UMID Application Form (U-6)",
      "PSA birth certificate kung first-time ID applicant",
      "Bayad: ₱300 (replacement); libre ang first-time issuance para sa mga qualified na first-time applicants",
    ],
    fees: [
      { item: "UMID ID — first-time issuance", amount: "Libre (para sa qualified first-time applicants)", updated: "2025-01" },
      { item: "UMID ID — replacement (lost/damaged)", amount: "₱300", updated: "2025-01" },
    ],
    processing_time: "Biometrics capture: same-day sa branch; card delivery: 30–60 working days via PHLPost",
    official_link: { label: "SSS UMID Information", url: "https://www.sss.gov.ph" },
    prerequisites: ["sss-membership"],
    usedAsIdFor: ["philsys-national-id", "passport", "nbi-clearance"],
    alerts: [
      "Hindi lahat ng SSS branch ay may UMID capture facility — tawagan muna bago pumunta para hindi sayang ang biyahe.",
      "Kung nawala ang UMID, kailangan ng Affidavit of Loss bago mag-apply ng replacement.",
      "Siguraduhing tama at updated ang address sa SSS record — doon ipadadala ang card via PHLPost.",
    ],
    lastVerified: "2025-01-15",
  },
  {
    id: "philhealth-registration",
    title: "PhilHealth Member Registration",
    agency: "PhilHealth",
    summary:
      "Magrehistro bilang PhilHealth member — libre ang registration at kailangan lang ng PSA birth certificate at valid ID. Pwede online sa PhilHealth portal o sa kahit anumang PhilHealth Local Health Insurance Office (LHIO).",
    keywords: [
      "philhealth",
      "philhealth registration",
      "philhealth member",
      "philhealth id",
      "magregister sa philhealth",
      "philhealth number",
      "philhealth online",
    ],
    steps: [
      "Pumunta sa PhilHealth website (philhealth.gov.ph) para sa online registration, o diretso sa pinakamalapit na PhilHealth LHIO/branch.",
      "Piliin ang membership category: Direct Member (Employed), Self-Employed, Individually Paying, Sponsored, o Senior Citizen.",
      "Punan ang PhilHealth Member Registration Form (PMRF) — available online o sa branch.",
      "I-submit ang requirements: PSA birth certificate at valid government ID.",
      "Kunin ang PhilHealth Identification Number (PIN) at Member Data Record (MDR) — ito ang proof of membership.",
      "Kung employed, i-coordinate sa HR para sa employer contribution remittance; kung self-employed, magbayad ng quarterly premium sa accredited banks o PhilHealth payment partners.",
    ],
    requirements: [
      "PSA birth certificate (original + photocopy)",
      "1–2 valid government IDs",
      "Accomplished PMRF (PhilHealth Member Registration Form)",
      "Proof of income kung self-employed/individually paying",
    ],
    fees: [
      { item: "PhilHealth Member registration", amount: "Libre — walang bayad ang pag-rehistro", updated: "2025-01" },
      { item: "Monthly premium (self-employed/individually paying)", amount: "₱500/month (2024 premium rate, ₱30,000 floor)", updated: "2025-01" },
    ],
    processing_time: "Online: instant PIN generation; branch: same-day kung kumpleto ang documents",
    official_link: { label: "PhilHealth Official Website", url: "https://www.philhealth.gov.ph" },
    prerequisites: ["psa-certificate"],
    usedAsIdFor: ["philsys-national-id"],
    alerts: [
      "Libre ang registration — huwag magbayad sa fixer o sa sinumang nangangako ng 'fast track'.",
      "Kailangan ng at least 3 months na posted contributions (within 6 months) para ma-avail ang inpatient benefits — hindi pwedeng gamitin agad pagkatapos mag-register.",
    ],
    lastVerified: "2025-01-15",
  },
  {
    id: "pagibig-membership",
    title: "Pag-IBIG Membership Registration",
    agency: "Pag-IBIG Fund",
    summary:
      "Magrehistro bilang Pag-IBIG Fund member — libre ang registration at required para sa housing loan, short-term loan, at provident benefits. Pwede online sa Virtual Pag-IBIG o sa kahit anumang Pag-IBIG branch.",
    keywords: [
      "pag-ibig",
      "pagibig",
      "pag ibig",
      "pag-ibig registration",
      "pag-ibig member",
      "pag-ibig membership",
      "magregister sa pagibig",
      "pag-ibig id",
      "pag-ibig number",
      "virtual pag-ibig",
      "hdmf",
    ],
    steps: [
      "Pumunta sa Virtual Pag-IBIG portal (virtualpagibig.pagibigfund.gov.ph) o diretso sa pinakamalapit na Pag-IBIG branch.",
      "Kung online: i-click ang 'Create Account' at piliin ang membership type (Employed, Self-Employed, Voluntary, o OFW).",
      "Punan ang Membership Registration/Records Form (MRF) — personal info, birthdate, address, at beneficiary.",
      "I-submit ang requirements: PSA birth certificate at valid government ID.",
      "Kunin ang Pag-IBIG Membership ID (MID) Number — dadating via SMS o email kung online, o sa branch kung walk-in.",
      "Kung employed, i-coordinate sa HR para sa monthly contribution remittance; kung self-employed/voluntary, magbayad sa accredited banks, partner outlets, o via Virtual Pag-IBIG.",
    ],
    requirements: [
      "PSA birth certificate (original + photocopy)",
      "1–2 valid government IDs",
      "Accomplished Membership Registration/Records Form (MRF)",
      "Proof of income kung self-employed/voluntary",
    ],
    fees: [
      { item: "Pag-IBIG Membership registration", amount: "Libre — walang bayad ang pag-rehistro", updated: "2025-01" },
      { item: "Monthly contribution (self-employed/voluntary)", amount: "₱100/month (mandatory minimum; pwedeng taasan para sa mas malaking benefits)", updated: "2025-01" },
    ],
    processing_time: "Online: instant MID Number generation; branch: same-day kung kumpleto ang documents",
    official_link: { label: "Pag-IBIG Fund Official Website", url: "https://www.pagibigfund.gov.ph" },
    prerequisites: ["psa-certificate"],
    usedAsIdFor: ["philsys-national-id"],
    alerts: [
      "Libre ang registration — huwag magbayad sa fixer.",
      "Kailangan ng at least 24 months na contributions para ma-avail ang housing loan; kailangan ng at least 1 year para sa short-term loan.",
      "Pwede ring gamitin ang Pag-IBIG MID Number bilang valid ID reference sa ibang transactions.",
    ],
    lastVerified: "2025-01-15",
  },
  {
    id: "passport-renewal",
    title: "Philippine Passport Renewal (DFA)",
    agency: "DFA",
    summary:
      "Mag-renew ng expired o malapit nang mag-expire na passport — appointment-only pa rin, at pwede online sa DFA portal. Dalhin ang lumang passport at valid ID; may expedited option para sa mas mabilis na release.",
    keywords: [
      "passport renewal",
      "renew passport",
      "passport expire",
      "expired passport",
      "dfa renewal",
      "passport renew",
      "renew passport online",
      "passport application renewal",
    ],
    steps: [
      "Mag-book ng appointment online sa opisyal na DFA passport portal (passport.gov.ph) — appointment-only pa rin; walang walk-in except Courtesy Lane.",
      "Piliin ang 'Renewal' na application type at punan ang online form gamit ang details ng lumang passport.",
      "Magbayad ng processing fee sa payment center (regular o expedited) — kailangan ito bago ma-confirm ang appointment.",
      "Ihanda: lumang passport (original), 1–2 valid government IDs, accomplished application form na may barcode, at printed appointment confirmation.",
      "Pumunta nang eksakto sa appointment date/time sa DFA office para sa biometrics — personal appearance ay mandatory.",
      "Bayaran ang passport fee sa counter kung hindi pa nabayaran, kunin ang claim stub, at hintayin ang release (regular 12 working days, expedited 6 working days).",
    ],
    requirements: [
      "Lumang passport (original — ire-return sa iyo pagkatapos i-cancel)",
      "1–2 valid government IDs",
      "Accomplished application form na may barcode",
      "Printed appointment confirmation",
    ],
    fees: [
      { item: "Passport renewal — regular processing", amount: "₱950 (12 working days)", updated: "2025-01" },
      { item: "Passport renewal — expedited processing", amount: "₱1,200 (6 working days)", updated: "2025-01" },
      { item: "Passport renewal — courtesy lane (senior, PWD, pregnant, OFW)", amount: "₱1,200 (expedited rate, walang appointment)", updated: "2025-01" },
    ],
    processing_time: "Regular: 12 working days; Expedited: 6 working days — pick up sa DFA office o door-to-door delivery",
    official_link: { label: "DFA Passport Portal", url: "https://www.passport.gov.ph" },
    prerequisites: ["passport"],
    usedAsIdFor: [],
    alerts: [
      "Huwag dumiretso nang walang appointment — walk-in ay hindi na tinatanggap (except Courtesy Lane para sa senior, PWD, pregnant, o OFW).",
      "Kung nawala ang lumang passport, kailangan ng Affidavit of Loss at ituturing na 'new application' ang proseso, hindi renewal.",
      "Siguraduhing hindi sira o basa ang lumang passport — kung sira, maaaring hingin ang PSA birth certificate bilang additional requirement.",
    ],
    lastVerified: "2025-01-15",
  },
  {
    id: "lto-drivers-license-application",
    title: "LTO Driver's License Application (Professional & Non-Professional)",
    agency: "LTO",
    summary:
      "Mag-apply ng driver's license (non-pro o professional) pagkatapos hawakan ang Student Permit sa kinakailangang panahon. Kailangan ang Practical Driving Course, written exam, at driving test — ₱585 ang license fee.",
    keywords: [
      "driver's license application",
      "drivers license application",
      "apply driver license",
      "professional license",
      "pro license",
      "professional driver's license",
      "lto license application",
      "mag apply ng lisensya",
      "new driver's license",
    ],
    steps: [
      "Siguraduhing hawak mo ang Student Permit sa kinakailangang panahon: at least 1 month para sa non-pro, 3 months para sa professional (kung may existing non-pro).",
      "Mag-log in sa LTMS portal (portal.lto.gov.ph) at i-apply ang license — pipili ng appointment, license type, at magbabayad ng initial fee.",
      "Kumpletuhin ang Practical Driving Course (PDC) sa LTO-accredited driving center — electronic ang submission ng school sa LTO.",
      "Pumunta sa LTO sa appointment date para sa written exam at driving test — kailangan pumasa sa pareho.",
      "Kung pumasa, magpakuha ng photo at biometrics, at bayaran ang license fee (₱585).",
      "I-claim ang lisensya — same-day release kung kumpleto at pumasa.",
    ],
    requirements: [
      "Student Permit (hawak sa kinakailangang panahon)",
      "PDC completion certificate (electronic submission ng accredited school)",
      "Valid government ID",
      "PSA birth certificate (o LCR-authenticated)",
      "TIN kung employed",
      "Medical certificate from LTO-accredited clinic (may electronic transmission sa LTO)",
      "Passing score sa written exam at driving test",
    ],
    fees: [
      { item: "Driver's License fee (non-pro o professional)", amount: "₱585 (per LTO fee schedule)", updated: "2025-01" },
      { item: "Practical Driving Course (PDC)", amount: "Nag-iiba-iba depende sa accredited driving center", updated: null },
      { item: "Medical certificate", amount: "₱450–₱600 (LTO-accredited clinic)", updated: "2025-01" },
    ],
    processing_time: "Same-day release kung pumasa sa written at driving test at kumpleto ang requirements",
    official_link: { label: "LTO LTMS Portal", url: "https://portal.lto.gov.ph" },
    prerequisites: ["lto-student-permit"],
    usedAsIdFor: ["philsys-national-id", "passport", "nbi-clearance"],
    alerts: [
      "Kailangan ng medical certificate mula sa LTO-accredited clinic — may electronic transmission sa LTO, kaya hindi na kailangang dalhin ang hard copy.",
      "Ang professional license ay para sa mga magdadrive ng commercial vehicle (PUV, truck, etc.) — kailangan ng existing non-pro license at 3 months na hawak ito bago mag-apply.",
      "Ang mga fee na makikita online ay nag-iiba-iba depende sa source/year — ituring na 'as of 2025' at i-verify sa LTO mismo.",
    ],
    lastVerified: "2025-01-15",
  },
  {
    id: "lto-license-renewal",
    title: "LTO Driver's License Renewal",
    agency: "LTO",
    summary:
      "Mag-renew ng expired o malapit nang mag-expire na driver's license — pwede sa LTO office o sa License Renewal Centers (malls). Kailangan ng medical certificate at valid ID; ₱585.20 ang renewal fee.",
    keywords: [
      "license renewal",
      "renew driver's license",
      "renew lisensya",
      "lto renewal",
      "driver's license renewal",
      "lisensya renewal",
      "renew license lto",
      "license renew",
    ],
    steps: [
      "Siguraduhing hindi pa 2 years ang pagka-expire ng license — kung 2 years na, kailangan ng written exam at driving test ulit (treated as new application).",
      "Mag-log in sa LTMS portal (portal.lto.gov.ph) at i-apply ang renewal — pipili ng appointment at LTO office o License Renewal Center.",
      "Kumuha ng medical certificate mula sa LTO-accredited clinic — may electronic transmission sa LTO, kaya hindi na kailangang dalhin ang hard copy.",
      "Pumunta sa LTO office o renewal center sa appointment date — dalhin ang lumang license at valid ID.",
      "Magpakuha ng photo at biometrics, at bayaran ang renewal fee (₱585.20).",
      "I-claim ang renewed license — same-day release kung kumpleto.",
    ],
    requirements: [
      "Lumang/expired driver's license (o Affidavit of Loss kung nawala)",
      "1 valid government ID",
      "Medical certificate from LTO-accredited clinic (electronic transmission sa LTO)",
      "Kung 2+ years expired: written exam at driving test (treated as new application)",
    ],
    fees: [
      { item: "Driver's License renewal fee", amount: "₱585.20 (per LTO fee schedule)", updated: "2025-01" },
      { item: "Medical certificate", amount: "₱450–₱600 (LTO-accredited clinic)", updated: "2025-01" },
      { item: "Affidavit of Loss (kung nawala ang license)", amount: "₱100–₱200 (notary fee)", updated: "2025-01" },
    ],
    processing_time: "Same-day release kung kumpleto ang requirements at hindi 2+ years expired",
    official_link: { label: "LTO LTMS Portal", url: "https://portal.lto.gov.ph" },
    prerequisites: ["lto-nonpro-license"],
    usedAsIdFor: ["philsys-national-id", "passport", "nbi-clearance"],
    alerts: [
      "Kung 2 years na ang pagka-expire ng license, kailangan ng written exam at driving test ulit — hindi na simpleng renewal ang proseso.",
      "Maraming License Renewal Centers sa malls (SM, Robinsons, ayon sa LTO partnership) — mas mabilis at mas kaunting tao kaysa sa main LTO office.",
      "Kailangan ng medical certificate bago pumunta sa LTO — walang medical, walang renewal.",
      "Ang mga fee na makikita online ay nag-iiba-iba depende sa source/year — ituring na 'as of 2025' at i-verify sa LTO mismo.",
    ],
    lastVerified: "2025-01-15",
  },
  {
    id: "barangay-clearance",
    title: "Barangay Clearance",
    agency: "Barangay / LGU",
    summary:
      "Magkuha ng Barangay Clearance — proof of residency at good standing sa barangay. Mura at mabilis: ₱20–₱50 lang, at same-day release sa Barangay Hall. Kailangan para sa maraming transactions (job application, business permit, etc.).",
    keywords: [
      "barangay clearance",
      "barangay certificate",
      "clearance ng barangay",
      "barangay id",
      "residency certificate",
      "certificate of residency",
      "barangay hall",
      "barangay document",
    ],
    steps: [
      "Pumunta sa Barangay Hall ng barangay kung saan ka nakatira — walk-in lang, walang appointment.",
      "Pumunta sa Clearance/Records section at humingi ng Barangay Clearance application form.",
      "Punan ang form: buong pangalan, address, purpose ng clearance, at petsa.",
      "I-submit ang form kasama ang valid ID at proof of residency (utility bill, lease contract, o certificate ng barangay kung first time).",
      "Magbayad ng clearance fee sa Barangay Treasury (₱20–₱50, depende sa barangay).",
      "I-claim ang Barangay Clearance — same-day release, kadalasan within 15–30 minutes.",
    ],
    requirements: [
      "1 valid government ID (o anumang ID na may picture at address)",
      "Proof of residency: utility bill, lease contract, o barangay certification kung first time",
      "Accomplished Barangay Clearance application form",
      "Bayad: ₱20–₱50 (depende sa barangay)",
    ],
    fees: [
      { item: "Barangay Clearance fee", amount: "₱20–₱50 (depende sa barangay)", updated: "2025-01" },
      { item: "First-time job seeker (RA 11261)", amount: "Libre — kailangan lang ng certification na first-time job seeker", updated: "2025-01" },
    ],
    processing_time: "Same-day release (15–30 minutes kung walang problema)",
    official_link: { label: "Barangay Hall (local LGU)", url: "https://www.gov.ph" },
    prerequisites: [],
    usedAsIdFor: ["nbi-clearance", "philsys-national-id"],
    alerts: [
      "Libre ang Barangay Clearance para sa first-time job seekers sa ilalim ng RA 11261 — kailangan lang ng certification mula sa barangay na first-time job seeker ka.",
      "Kailangan ng Barangay Clearance para sa maraming transactions: business permit, police clearance, NBI clearance, at job applications — kaya magdala ng extra copies.",
      "Siguraduhing tama ang address na nakasaad sa ID at proof of residency — kung hindi tugma, maaaring hingin ng barangay ang karagdagang proof.",
    ],
    lastVerified: "2025-01-15",
  },
];

export const DOC_TITLES: Record<string, string> = Object.fromEntries(
  DOC_GUIDES.map((g) => [g.id, g.title]),
);
