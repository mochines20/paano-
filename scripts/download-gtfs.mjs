#!/usr/bin/env node
/**
 * I-download ang Metro Manila GTFS data (sakayph/gtfs — ang base data ng
 * Sakay.ph app mismo, mula sa Philippine Transit App Challenge).
 *
 * Usage: npm run gtfs:download   (o: node scripts/download-gtfs.mjs --force)
 *
 * Mga file ay naka-save sa data/gtfs/ (gitignored — ~5MB).
 * Source: https://github.com/sakayph/gtfs (master branch, raw files)
 */

import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FILES = [
  "agency.txt",
  "calendar.txt",
  "feed_info.txt",
  "frequencies.txt",
  "routes.txt",
  "shapes.txt",
  "stop_times.txt",
  "stops.txt",
  "trips.txt",
];

const BASE = "https://raw.githubusercontent.com/sakayph/gtfs/master";
const OUT_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "data",
  "gtfs",
);

const force = process.argv.includes("--force");

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const { loadGtfs } = await import("../lib/commute/gtfs.ts");

  for (const file of FILES) {
    const dest = path.join(OUT_DIR, file);
    if (!force) {
      try {
        const info = await stat(dest);
        if (info.size > 0) {
          console.log(`skip ${file} (${(info.size / 1024).toFixed(0)}KB) — gamitin ang --force para i-refresh`);
          continue;
        }
      } catch {
        /* wala pa — i-download */
      }
    }
    const res = await fetch(`${BASE}/${file}`);
    if (!res.ok) throw new Error(`Failed ${file}: HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(dest, buf);
    console.log(`downloaded ${file} (${(buf.length / 1024).toFixed(0)}KB)`);
  }

  try {
    const idx = await loadGtfs();
    if (idx) {
      console.log(
        `OK — ${idx.stops.length.toLocaleString()} stops, ${idx.routes.length.toLocaleString()} routes, ` +
          `${idx.stopToRoutes.size.toLocaleString()} stops na may ruta.`,
      );
    }
  } catch (err) {
    console.error("Babala: hindi ma-load ang bagong data:", err);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
