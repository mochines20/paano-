/**
 * Source registry for grounded answers.
 *
 * This is intentionally metadata, not a dump of web pages. Answers should
 * use the linked official source and show its as-of date; stale sources must
 * be rechecked before being promoted to high-confidence guidance.
 */

export type KnowledgeSourceType = "official" | "primary" | "secondary";

export interface KnowledgeSource {
  id: string;
  category: "docs" | "health" | "commute" | "prices" | "model";
  title: string;
  authority: string;
  url: string;
  type: KnowledgeSourceType;
  supports: string[];
  lastChecked: string;
  refreshDays: number;
  status: "verified" | "needs_review";
  notes: string;
}

export const KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  {
    id: "psa-certificate-prices-2026-02",
    category: "docs",
    title: "PSA Serbilis fees and request channels",
    authority: "Philippine Statistics Authority",
    url: "https://psa.gov.ph/content/public-advisory-101",
    type: "official",
    supports: ["psa birth certificate", "psa marriage certificate", "psa death certificate", "cenomar", "cenodeath", "certificate fees"],
    lastChecked: "2026-09-30",
    refreshDays: 30,
    status: "verified",
    notes: "Official advisory published 2026-02-20; fees may change, so recheck before presenting as current.",
  },
  {
    id: "psa-birth-certificate",
    category: "docs",
    title: "Birth certificate official information",
    authority: "Philippine Statistics Authority",
    url: "https://psa.gov.ph/birth-certificate",
    type: "official",
    supports: ["psa birth certificate requirements", "psa request channels"],
    lastChecked: "2026-09-30",
    refreshDays: 60,
    status: "verified",
    notes: "Use this page to confirm eligibility, request channels, and identity requirements.",
  },
  {
    id: "philsys-2025-charter",
    category: "docs",
    title: "PhilSys Registry Office 2025 Citizens Charter",
    authority: "Philippine Statistics Authority / PhilSys",
    url: "https://psa.gov.ph/system/files/citizens-charter/5-PSA-2025-Citizens-Charter-Philippine-Identification-System-Registry%20Office-External-Services.pdf",
    type: "official",
    supports: ["national id registration", "philsys requirements", "national id registration process"],
    lastChecked: "2026-08-30",
    refreshDays: 90,
    status: "verified",
    notes: "Use the charter for registration requirements; confirm current registration-center availability separately.",
  },
  {
    id: "dfa-2025-charter",
    category: "docs",
    title: "DFA Citizens Charter 2025",
    authority: "Department of Foreign Affairs",
    url: "https://dfa.gov.ph/images/2025/transparency/DFA_Citizens_Charter_2025_1st_Edition_1.pdf",
    type: "official",
    supports: ["passport application", "passport renewal", "passport requirements", "passport fees"],
    lastChecked: "2026-08-30",
    refreshDays: 60,
    status: "verified",
    notes: "The appointment portal and DFA office advisories take precedence for live slots and operational changes.",
  },
  {
    id: "lto-student-permit-charter",
    category: "docs",
    title: "LTO Student Permit Citizens Charter",
    authority: "Land Transportation Office",
    url: "https://lto.gov.ph/wp-content/uploads/2023/09/1-CC2024-SP.pdf",
    type: "official",
    supports: ["student permit", "theoretical driving course", "lto permit requirements"],
    lastChecked: "2026-08-30",
    refreshDays: 60,
    status: "verified",
    notes: "Use the latest LTO/LTMS notice if requirements or fee schedules conflict with this charter.",
  },
  {
    id: "psa-digital-national-id",
    category: "docs",
    title: "Digital National ID and accepted formats",
    authority: "Philippine Statistics Authority",
    url: "https://rsso06.psa.gov.ph/content/digital-national-id",
    type: "official",
    supports: ["digital national id", "national id authentication", "national id validity"],
    lastChecked: "2026-08-30",
    refreshDays: 90,
    status: "verified",
    notes: "Do not ask users to pay for first registration; authenticity should be checked through official channels.",
  },
  {
    id: "dfa-passport-appointment",
    category: "docs",
    title: "DFA Online Passport Appointment System",
    authority: "Department of Foreign Affairs – Office of Consular Affairs",
    url: "https://passport.gov.ph/appointment/individual/site",
    type: "official",
    supports: ["passport appointment", "passport application", "passport renewal"],
    lastChecked: "2026-09-30",
    refreshDays: 30,
    status: "verified",
    notes: "Use the official passport.gov.ph appointment system; availability and fees can vary by site and date.",
  },
  {
    id: "nbi-clearance-portal",
    category: "docs",
    title: "NBI Clearance Online Registration and Application",
    authority: "National Bureau of Investigation",
    url: "https://clearance.nbi.gov.ph/",
    type: "official",
    supports: ["nbi clearance", "nbi online renewal", "first-time job seeker clearance"],
    lastChecked: "2026-09-30",
    refreshDays: 30,
    status: "verified",
    notes: "Use clearance.nbi.gov.ph for the application; do not use unofficial fixer links.",
  },
  {
    id: "doh-health-advisories",
    category: "health",
    title: "Philippine Health Advisories",
    authority: "Department of Health",
    url: "https://armm.doh.gov.ph/images/HealthProgram_ICON/Philippine-Health-Advisories.pdf",
    type: "official",
    supports: ["first aid", "health safety"],
    lastChecked: "2026-08-30",
    refreshDays: 30,
    status: "needs_review",
    notes: "This is an older advisory compilation. Use only for conservative general guidance and escalate emergencies to professionals.",
  },
  {
    id: "da-bantay-presyo",
    category: "prices",
    title: "DA Bantay Presyo / market price feed",
    authority: "Department of Agriculture",
    url: "https://www.da.gov.ph/category/bantay-presyo/",
    type: "official",
    supports: ["food prices", "market prices", "recipe budget"],
    lastChecked: "2026-08-30",
    refreshDays: 1,
    status: "needs_review",
    notes: "No live feed is configured in the app yet. Never present fallback estimates as current official prices.",
  },
  {
    id: "ltfrb-fare-feed",
    category: "commute",
    title: "LTFRB fare and public transport advisories",
    authority: "Land Transportation Franchising and Regulatory Board",
    url: "https://ltfrb.gov.ph/",
    type: "official",
    supports: ["commute fares", "public transport advisories"],
    lastChecked: "2026-09-30",
    refreshDays: 1,
    status: "needs_review",
    notes: "The app now uses a source-priority registry, but no live LTFRB fare feed is connected. Do not call static route data live or official; verify the latest fare matrix before travel.",
  },
];

export function getKnowledgeSource(id: string): KnowledgeSource | null {
  return KNOWLEDGE_SOURCES.find((source) => source.id === id) ?? null;
}

export function sourceAgeDays(lastChecked: string, now = Date.now()): number | null {
  const checkedAt = Date.parse(`${lastChecked}T00:00:00Z`);
  if (!Number.isFinite(checkedAt)) return null;
  return Math.max(0, Math.floor((now - checkedAt) / 86_400_000));
}

export function isSourceFresh(source: KnowledgeSource, now = Date.now()): boolean {
  const age = sourceAgeDays(source.lastChecked, now);
  return source.status === "verified" && age !== null && age <= source.refreshDays;
}
