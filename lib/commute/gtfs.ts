import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

/**
 * Magaan na GTFS reader — routes.txt, stops.txt, trips.txt, stop_times.txt
 * mula sa data/gtfs/ (i-download via `npm run gtfs:download`).
 *
 * Ginagamit para sa:
 *  - stop lookup ayon sa pangalan (hal. "cubao")
 *  - route discovery: anong ruta ang dumadaan sa origin AT destination
 *  - rough distance estimate (haversine × detour factor) para sa fare
 *
 * Lazy-loaded at naka-cache sa memory. Kung wala ang data, bumalik ang
 * null — at babalik ang app sa pure-LLM na commute answers.
 */

const GTFS_DIR = path.join(process.cwd(), "data", "gtfs");

export interface GtfsRoute {
  routeId: string;
  shortName: string;
  longName: string;
  agencyId: string;
  type: number;
  displayName: string;
  /** "metro" o pangalan ng siyudad (data/gtfs/provincial/<city>). */
  feedId: string;
}

export interface GtfsStop {
  stopId: string;
  name: string;
  lat: number;
  lon: number;
}

export interface GtfsIndex {
  stops: GtfsStop[];
  routes: GtfsRoute[];
  /** stopId → Set(routeId) — aling ruta ang dumadaan sa stop */
  stopToRoutes: Map<string, Set<string>>;
}

let cached: GtfsIndex | null | undefined;

export async function loadGtfs(): Promise<GtfsIndex | null> {
  if (cached !== undefined) return cached;
  cached = await buildIndex().catch(() => null);
  return cached;
}

/** Test/debug helper lang — i-reset ang cache. */
export function resetGtfsCache(): void {
  cached = undefined;
}

interface FeedSpec {
  id: string;
  dir: string;
}

/** data/gtfs/ = Metro Manila; data/gtfs/provincial/<city>/ = karagdagang
 * mga siyudad (i-drop lang ang GTFS files — auto-detect). */
async function listFeeds(): Promise<FeedSpec[]> {
  const feeds: FeedSpec[] = [{ id: "metro", dir: GTFS_DIR }];
  try {
    const provincialDir = path.join(GTFS_DIR, "provincial");
    const entries = await readdir(provincialDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        feeds.push({ id: entry.name, dir: path.join(provincialDir, entry.name) });
      }
    }
  } catch {
    /* walang provincial dir */
  }
  return feeds;
}

async function buildIndex(): Promise<GtfsIndex | null> {
  const feeds = await listFeeds();

  const routes: GtfsRoute[] = [];
  const stops: GtfsStop[] = [];
  const stopToRoutes = new Map<string, Set<string>>();
  let anyLoaded = false;

  for (const feed of feeds) {
    const [routesRaw, stopsRaw, tripsRaw, stopTimesRaw] = await Promise.all([
      readFile(path.join(feed.dir, "routes.txt"), "utf8"),
      readFile(path.join(feed.dir, "stops.txt"), "utf8"),
      readFile(path.join(feed.dir, "trips.txt"), "utf8"),
      readFile(path.join(feed.dir, "stop_times.txt"), "utf8"),
    ]).catch(() => [null, null, null, null]);

    // Ang metro feed ang required; ang provincial ay optional (skip kung sira).
    if (!routesRaw || !stopsRaw || !tripsRaw || !stopTimesRaw) {
      if (feed.id === "metro") return null;
      continue;
    }
    anyLoaded = true;

    const prefix = `${feed.id}:`;
    const feedRoutes = parseCsv(routesRaw).map((row) => {
      const routeId = prefix + (row.route_id ?? "");
      const longName = row.route_long_name ?? "";
      const shortName = row.route_short_name ?? "";
      return {
        routeId,
        shortName,
        longName,
        agencyId: row.agency_id ?? "",
        type: Number(row.route_type) || 3,
        // Iwasan ang duplicate kapag ang longName ay naglalaman na ng shortName
        // (kadalasan sa LTFRB: short="Cubao - Quiapo via Aurora", long="...desc...").
        displayName:
          longName && shortName && longName.toLowerCase().includes(shortName.toLowerCase())
            ? shortName
            : [shortName, longName].filter(Boolean).join(" — "),
        feedId: feed.id,
      };
    });
    routes.push(...feedRoutes);

    const feedStops = parseCsv(stopsRaw).map((row) => ({
      stopId: prefix + (row.stop_id ?? ""),
      name: row.stop_name ?? "",
      lat: Number(row.stop_lat) || 0,
      lon: Number(row.stop_lon) || 0,
    }));
    stops.push(...feedStops);

    // tripId → routeId (prefixed)
    const tripRoutes = new Map<string, string>();
    for (const row of parseCsv(tripsRaw)) {
      if (row.trip_id) tripRoutes.set(prefix + row.trip_id, prefix + (row.route_id ?? ""));
    }

    // stopId → Set(routeId)
    for (const row of parseCsv(stopTimesRaw)) {
      if (!row.stop_id || !row.trip_id) continue;
      const routeId = tripRoutes.get(prefix + row.trip_id);
      if (!routeId) continue;
      const stopId = prefix + row.stop_id;
      let set = stopToRoutes.get(stopId);
      if (!set) {
        set = new Set();
        stopToRoutes.set(stopId, set);
      }
      set.add(routeId);
    }
  }

  if (!anyLoaded) return null;
  return { stops, routes, stopToRoutes };
}

/* ------------------------------------------------------------------ */
/* Lookup helpers                                                      */
/* ------------------------------------------------------------------ */

/**
 * Landmark aliases — mga lugar na wala sa literal na pangalan ng stop
 * (hal. walang stop na "Intramuros"), pero may mga stop sa paligid nila.
 */
const PLACE_ALIASES: Record<string, string[]> = {
  intramuros: ["padre burgos", "manila city hall", "arroceros"],
  quiapo: ["quezon blvd", "plaza miranda"],
  divisoria: ["recto", "tutuban"],
  ayala: ["ayala avenue", "ayala mrt", "ayala lrt"],
  bgc: ["bonifacio global city", "global city", "fort bonifacio"],
  moa: ["mall of asia", "seaside"],
  makati: ["makati ave", "ayala"],
};

/** I-expand ang query kasama ang mga alias nito. */
export function expandPlaceQuery(query: string): string[] {
  const q = query.toLowerCase().trim();
  const base = [q];
  for (const [key, aliases] of Object.entries(PLACE_ALIASES)) {
    if (q.includes(key)) base.push(...aliases);
  }
  return [...new Set(base)];
}

/** I-split ang query sa tokens (lowercase, alphanumeric lang). */
function tokens(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/** Hanapin ang stops na tumutugma sa LAHAT ng tokens ng isang query. */
export function findStops(index: GtfsIndex, query: string, limit = 10): GtfsStop[] {
  const q = tokens(query);
  if (q.length === 0) return [];
  return index.stops
    .filter((s) => {
      const name = s.name.toLowerCase();
      return q.every((t) => name.includes(t));
    })
    .sort((a, b) => a.name.length - b.name.length)
    .slice(0, limit);
}

/** Tulad ng findStops, pero sinusubukan din ang landmark aliases. */
export function findStopsExpanded(
  index: GtfsIndex,
  query: string,
  limit = 10,
): GtfsStop[] {
  const seen = new Set<string>();
  const out: GtfsStop[] = [];
  for (const q of expandPlaceQuery(query)) {
    for (const stop of findStops(index, q, limit)) {
      if (!seen.has(stop.stopId)) {
        seen.add(stop.stopId);
        out.push(stop);
      }
    }
  }
  return out.slice(0, limit);
}

/**
 * Hanapin ang mga rutang dumadaan sa parehong origin at destination.
 * Dalawang heuristics:
 *  1. GTFS: routes na may stops na tumutugma sa origin AND sa destination
 *  2. Pangalan: routes na ang route_long_name ay may laman ng parehong tokens
 */
export function findRoutesBetween(
  index: GtfsIndex,
  originQuery: string,
  destQuery: string,
  limit = 5,
): GtfsRoute[] {
  const originStops = findStopsExpanded(index, originQuery, 15);
  const destStops = findStopsExpanded(index, destQuery, 15);

  const candidates = new Map<string, GtfsRoute>();

  // Pangalan lang ng ruta ang totoong filter: sa LTFRB, ang
  // route_short_name ay ang registered endpoints (hal. "Cubao - Quiapo
  // via Aurora Blvd"). Ang mga ruta mula sa shared-stop matching na HINDI
  // may pangalang naglalaman ng parehong lugar ay malamang na mahabang
  // EDSA/provincial routes na dumadaan lang sa paligid — huwag i-suggest.
  const o = tokens(originQuery);
  const d = tokens(destQuery);
  const nameMatches = (route: GtfsRoute) => {
    if (o.length === 0 || d.length === 0) return false;
    const name = route.displayName.toLowerCase();
    return o.every((t) => name.includes(t)) && d.every((t) => name.includes(t));
  };

  // Heuristic 1: shared GTFS routes (may name corroboration)
  if (originStops.length > 0 && destStops.length > 0) {
    const shared = new Set<string>();
    for (const s of originStops) {
      for (const r of index.stopToRoutes.get(s.stopId) ?? []) shared.add(r);
    }
    const destRouteIds = new Set<string>();
    for (const s of destStops) {
      for (const r of index.stopToRoutes.get(s.stopId) ?? []) destRouteIds.add(r);
    }
    for (const routeId of shared) {
      if (destRouteIds.has(routeId)) {
        const route = index.routes.find((r) => r.routeId === routeId);
        if (route && nameMatches(route)) candidates.set(routeId, route);
      }
    }
  }

  // Heuristic 2: pangalan ng ruta mismo sa buong routes table
  if (candidates.size < 3) {
    for (const route of index.routes) {
      if (nameMatches(route)) candidates.set(route.routeId, route);
      if (candidates.size >= limit) break;
    }
  }

  return [...candidates.values()].slice(0, limit);
}

/** Dest-only: mga rutang may laman ang pangalan ng destination (hal.
 * "paano magcommute papuntang Quiapo" → "Ayala Quiapo via Kamagong Taft"). */
export function findRoutesTo(index: GtfsIndex, destQuery: string, limit = 3): GtfsRoute[] {
  const d = tokens(destQuery);
  if (d.length === 0) return [];
  const out: GtfsRoute[] = [];
  for (const route of index.routes) {
    const name = route.displayName.toLowerCase();
    if (d.every((t) => name.includes(t))) out.push(route);
    if (out.length >= limit) break;
  }
  return out;
}

/** Rough distance (km) sa pagitan ng pinakamalapit na origin/dest stop pair,
 * na may detour factor para sa mga lansangan. Null kung walang coordinates. */
export function estimateRouteKm(
  index: GtfsIndex,
  originQuery: string,
  destQuery: string,
): number | null {
  // Canonical stop per side (pinakamaikling pangalan = pinaka-karaniwan,
  // hal. "Ayala MRT" bago "Ayala Blvd, Manila") — para hindi ma-hijack ng
  // ibang lugar na may parehong pangalan.
  const [origin] = findStopsExpanded(index, originQuery, 1);
  const [dest] = findStopsExpanded(index, destQuery, 1);
  if (!origin || !dest) return null;

  const straight = haversineKm(origin.lat, origin.lon, dest.lat, dest.lon);
  if (!Number.isFinite(straight) || straight <= 0) return null;
  // Detour factor 1.2: tantiya lang ito. Na-calibrate laban sa halimbawa ng
  // LTFRB chairman (Cubao→Divisoria ≈ ₱26 modern jeepney ≈ 7.7km).
  return Math.max(1, Math.round(straight * 1.2 * 10) / 10);
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/* ------------------------------------------------------------------ */
/* CSV parser (may suporta sa quoted fields)                           */
/* ------------------------------------------------------------------ */

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const header = parseCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length !== header.length) continue;
    const row: Record<string, string> = {};
    for (let j = 0; j < header.length; j++) row[header[j]] = values[j] ?? "";
    rows.push(row);
  }
  return rows;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}
