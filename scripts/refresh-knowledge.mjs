/** Daily candidate importer. Never overwrites live curated data. */
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exitCode = 1;
}
const headers = { apikey: serviceKey ?? "", Authorization: `Bearer ${serviceKey ?? ""}`, "Content-Type": "application/json" };

async function insert(table, payload, prefer = "return=representation") {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, { method: "POST", headers: { ...headers, Prefer: prefer }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(`${table} ${response.status}: ${await response.text()}`);
  return response.json();
}
async function updateRun(id, values) {
  const response = await fetch(`${supabaseUrl}/rest/v1/knowledge_refresh_runs?id=eq.${id}`, { method: "PATCH", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(values) });
  if (!response.ok) throw new Error(`refresh run update ${response.status}: ${await response.text()}`);
}
function priceRecords(data) {
  if (!Array.isArray(data)) return [];
  return data.filter((r) => r && typeof r.item === "string" && Number.isFinite(Number(r.pricePerKg)))
    .map((r) => ({ item: r.item.trim().slice(0, 120), pricePerKg: Number(r.pricePerKg), unit: typeof r.unit === "string" ? r.unit.slice(0, 60) : undefined }))
    .filter((r) => r.item && r.pricePerKg >= 0 && r.pricePerKg <= 100000).slice(0, 500);
}
function routeRecords(data) {
  if (!Array.isArray(data)) return [];
  return data.filter((r) => r && typeof r.origin === "string" && typeof r.destination === "string")
    .map((r) => ({ origin: r.origin.trim().slice(0, 160), destination: r.destination.trim().slice(0, 160), modes: Array.isArray(r.modes) ? r.modes.filter((x) => typeof x === "string").slice(0, 10) : [], fareMin: Number.isFinite(Number(r.fareMin)) ? Number(r.fareMin) : null, fareMax: Number.isFinite(Number(r.fareMax)) ? Number(r.fareMax) : null, timeMin: Number.isFinite(Number(r.timeMin)) ? Number(r.timeMin) : null, timeMax: Number.isFinite(Number(r.timeMax)) ? Number(r.timeMax) : null, fareNotes: typeof r.fareNotes === "string" ? r.fareNotes.slice(0, 500) : null }))
    .filter((r) => r.origin && r.destination).slice(0, 500);
}
async function refresh({ sourceId, url, normalize }) {
  const run = (await insert("knowledge_refresh_runs", { source_id: sourceId, status: "pending", source_url: url ?? "not configured" }))[0];
  if (!url) { await updateRun(run.id, { status: "needs_review", error_message: "No feed URL configured" }); console.log(`${sourceId}: needs_review (no feed URL)`); return; }
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`feed returned HTTP ${response.status}`);
    const records = normalize(await response.json());
    if (!records.length) throw new Error("feed contained no valid records");
    const candidates = await insert("knowledge_candidates", records.map((payload) => ({ source_id: sourceId, refresh_run_id: run.id, payload, status: "pending" })));
    await updateRun(run.id, { status: "needs_review", records_found: candidates.length });
    console.log(`${sourceId}: ${candidates.length} pending candidate(s)`);
  } catch (error) {
    await updateRun(run.id, { status: "failed", error_message: error instanceof Error ? error.message : String(error) });
    console.error(`${sourceId}: failed`, error); process.exitCode = 1;
  }
}
if (supabaseUrl && serviceKey) {
  await refresh({ sourceId: "da-bantay-presyo", url: process.env.DA_PRICE_URL, normalize: priceRecords });
  // Commute feeds are opt-in. Missing feeds become needs_review and never
  // overwrite curated answers, so a partially configured VPS stays safe.
  const commuteFeeds = [
    ["ltfrb-fare-matrix", process.env.LTFRB_FEED_URL],
    ["pitx-routes", process.env.PITX_ROUTES_URL],
    ["one-ayala-routes", process.env.ONE_AYALA_ROUTES_URL],
    ["official-lgu-transport", process.env.LGU_TRANSPORT_FEED_URL],
    ["sakayph-gtfs", process.env.SAKAYPH_GTFS_JSON_URL],
    ["transitland", process.env.TRANSITLAND_ROUTES_URL],
    ["busmaps", process.env.BUSMAPS_ROUTES_URL],
  ];
  for (const [sourceId, url] of commuteFeeds) {
    await refresh({ sourceId, url, normalize: routeRecords });
  }
}
