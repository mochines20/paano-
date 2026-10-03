import type { AnswerProvenance } from "@/lib/answers";

/**
 * Source order for commute answers. Higher-trust sources must win when two
 * sources disagree; lower-trust sources are only for discovery/fallback.
 */
export type CommuteSourceTier =
  | "official_government"
  | "official_operator"
  | "official_lgu"
  | "community_gtfs"
  | "aggregator";

export type CommuteSourceStatus =
  | "official"
  | "curated"
  | "fallback"
  | "needs_review"
  | "stale";

export type CommuteDataType =
  | "fares"
  | "routes"
  | "stops"
  | "schedules"
  | "advisories"
  | "traffic"
  | "geometry";

export interface CommuteSource {
  id: string;
  name: string;
  authority: string;
  tier: CommuteSourceTier;
  priority: number;
  url: string;
  dataTypes: CommuteDataType[];
  refresh: "event" | "daily" | "weekly" | "monthly";
  lastVerified: string | null;
  status: CommuteSourceStatus;
  note: string;
}

/**
 * Allowlist of sources that may be named by the commute grounding layer.
 *
 * The registry deliberately distinguishes official sources from the static
 * snapshots currently bundled with the app. A URL being official does not
 * automatically make the app's cached copy live or verified.
 */
export const COMMUTE_SOURCES: CommuteSource[] = [
  {
    id: "ltfrb-fare-matrix",
    name: "LTFRB fare matrices and advisories",
    authority: "Land Transportation Franchising and Regulatory Board",
    tier: "official_government",
    priority: 1,
    url: "https://ltfrb.gov.ph/",
    dataTypes: ["fares", "routes", "advisories"],
    refresh: "event",
    lastVerified: null,
    status: "needs_review",
    note: "Official authority. A machine-readable live fare feed is not connected yet; verify the displayed matrix before relying on a fare.",
  },
  {
    id: "dotr-mrt3-fares",
    name: "DOTr-MRT3 fares and station information",
    authority: "Department of Transportation / MRT-3",
    tier: "official_government",
    priority: 1,
    url: "https://www.dotrmrt3.gov.ph/citizens-charter",
    dataTypes: ["fares", "stops", "schedules", "advisories"],
    refresh: "event",
    lastVerified: null,
    status: "needs_review",
    note: "Use the latest official fare matrix or Citizen's Charter; rail fares and operating rules can change.",
  },
  {
    id: "lrta-fares",
    name: "LRTA LRT-2 tickets, fares, and operations",
    authority: "Light Rail Transit Authority",
    tier: "official_government",
    priority: 1,
    url: "https://www.lrta.gov.ph/tickets-and-fares/",
    dataTypes: ["fares", "stops", "schedules", "advisories"],
    refresh: "event",
    lastVerified: null,
    status: "needs_review",
    note: "Use the official LRTA page for line-specific fares and service advisories.",
  },
  {
    id: "mmda-advisories",
    name: "MMDA traffic and transport advisories",
    authority: "Metropolitan Manila Development Authority",
    tier: "official_government",
    priority: 1,
    url: "https://mmda.gov.ph/",
    dataTypes: ["traffic", "advisories"],
    refresh: "event",
    lastVerified: null,
    status: "needs_review",
    note: "Use MMDA's verified channels for real-time traffic, road closures, and number-coding advisories.",
  },
  {
    id: "pitx-routes",
    name: "PITX route directory, fares, and schedules",
    authority: "Parañaque Integrated Terminal Exchange",
    tier: "official_operator",
    priority: 2,
    url: "https://www.pitx.ph/",
    dataTypes: ["routes", "fares", "schedules"],
    refresh: "event",
    lastVerified: null,
    status: "needs_review",
    note: "PITX says departure times, frequency, and fares are subject to change; confirm at the terminal or ticket booth.",
  },
  {
    id: "one-ayala-routes",
    name: "One Ayala terminal routes",
    authority: "One Ayala / Ayala Land",
    tier: "official_operator",
    priority: 2,
    url: "https://ayalalandoffices.com.ph/offices/makati/one-ayala",
    dataTypes: ["routes", "fares", "schedules"],
    refresh: "event",
    lastVerified: null,
    status: "needs_review",
    note: "Terminal/operator information is preferred for direct trips, but schedules and fares still need confirmation before departure.",
  },
  {
    id: "bgc-bus-routes",
    name: "BGC Bus route information",
    authority: "Bonifacio Global City / BGC Bus operators",
    tier: "official_operator",
    priority: 2,
    url: "https://bgc.com.ph/faqs/",
    dataTypes: ["routes", "fares", "schedules"],
    refresh: "event",
    lastVerified: null,
    status: "needs_review",
    note: "Use the operator or terminal notice for the latest trip availability and payment rules.",
  },
  {
    id: "official-lgu-transport",
    name: "Local government transport advisories",
    authority: "Relevant city or municipal government",
    tier: "official_lgu",
    priority: 3,
    url: "https://www.gov.ph/",
    dataTypes: ["routes", "fares", "schedules", "advisories", "traffic"],
    refresh: "event",
    lastVerified: null,
    status: "needs_review",
    note: "The exact LGU source depends on the route; do not infer a city ordinance from another city.",
  },
  {
    id: "sakayph-gtfs",
    name: "SakayPH community GTFS",
    authority: "SakayPH / Philippine Transit App Challenge community data",
    tier: "community_gtfs",
    priority: 4,
    url: "https://github.com/sakayph/gtfs",
    dataTypes: ["routes", "stops", "geometry", "schedules"],
    refresh: "weekly",
    lastVerified: null,
    status: "fallback",
    note: "Useful for route discovery and geometry. It is not an official fare or live-operations feed; refresh and verify before acting.",
  },
  {
    id: "transitland",
    name: "Transitland feed registry",
    authority: "Transitland / MobilityData community ecosystem",
    tier: "aggregator",
    priority: 5,
    url: "https://www.transit.land/feeds/f-wdw-manila",
    dataTypes: ["routes", "stops", "geometry", "schedules"],
    refresh: "weekly",
    lastVerified: null,
    status: "fallback",
    note: "Aggregator fallback only. Feed freshness, licensing, and route coverage must be checked per record.",
  },
  {
    id: "busmaps",
    name: "BusMaps route directory",
    authority: "BusMaps",
    tier: "aggregator",
    priority: 5,
    url: "https://busmaps.com/fil/philippines/Philippine-Transit-App-Challenge/metro-manila",
    dataTypes: ["routes", "stops", "geometry", "schedules"],
    refresh: "weekly",
    lastVerified: null,
    status: "fallback",
    note: "Aggregator fallback only; never label its route or fare information as official without primary confirmation.",
  },
  {
    id: "curated-terminal-snapshot",
    name: "PAANO curated terminal snapshot",
    authority: "PAANO data curation",
    tier: "official_operator",
    priority: 2,
  url: "https://www.pitx.ph/",
    dataTypes: ["routes", "fares", "schedules"],
    refresh: "daily",
    lastVerified: null,
    status: "needs_review",
    note: "Bundled route records compiled from terminal/operator references. It is a static snapshot, not a live official feed.",
  },
];

export type CommuteSourceRef = Pick<
  CommuteSource,
  "id" | "name" | "authority" | "tier" | "priority" | "url" | "lastVerified" | "status" | "note"
>;

export function getCommuteSource(id: string): CommuteSource | null {
  return COMMUTE_SOURCES.find((source) => source.id === id) ?? null;
}

export function sourceRef(id: string): CommuteSourceRef | null {
  const source = getCommuteSource(id);
  if (!source) return null;
  const { id: sourceId, name, authority, tier, priority, url, lastVerified, status, note } = source;
  return { id: sourceId, name, authority, tier, priority, url, lastVerified, status, note };
}

export function orderCommuteSources(sources: CommuteSourceRef[]): CommuteSourceRef[] {
  return [...sources].sort((a, b) => a.priority - b.priority);
}

export function commuteProvenance(
  sources: CommuteSourceRef[],
  note: string,
): AnswerProvenance {
  const ordered = orderCommuteSources(sources);
  const primary = ordered[0];
  const hasFallback = ordered.some((source) => source.priority >= 4);
  const status = primary?.status === "official" && !hasFallback ? "official" : "needs_review";
  const sourceNames = ordered.map((source) => source.name).join(" + ");
  return {
    label: sourceNames || "Commute source registry",
    asOf: primary?.lastVerified ?? null,
    status,
    note,
    url: primary?.url ?? "https://ltfrb.gov.ph/",
  };
}
