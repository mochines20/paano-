# PAANO knowledge sources

Use the source registry in `lib/knowledge/sources.ts` as the allowlist for
grounded content. Each data point added to a curated answer should record:

- the official/primary source URL;
- the date it was checked;
- the source type and authority;
- a refresh interval appropriate to the data (daily for prices/fares,
  30–90 days for stable requirements);
- an explicit `needs_review` status when no live official feed is connected.

Do not train or prompt the model with unsourced search snippets. For changing
fees, fares, schedules, government requirements, and health guidance, show an
`as of` date and link the source. Fallback estimates must be labeled as
estimates and must never be presented as current official data.

## Daily refresh

Run `npm run knowledge:refresh` once per day from a protected VPS cron or CI
runner. It accepts JSON feeds through `DA_PRICE_URL`, `LTFRB_FEED_URL`, and
the optional commute feed variables (`PITX_ROUTES_URL`, `ONE_AYALA_ROUTES_URL`,
`LGU_TRANSPORT_FEED_URL`, `SAKAYPH_GTFS_JSON_URL`, `TRANSITLAND_ROUTES_URL`,
`BUSMAPS_ROUTES_URL`). It validates the shape and inserts candidates into Supabase after running
`supabase/knowledge-refresh.sql`. Missing or unavailable feeds are recorded as
`needs_review`; they do not overwrite the app's current data.

Review candidates through the protected `/api/knowledge/review` endpoint using
`KNOWLEDGE_REVIEW_TOKEN`. Approval is recorded for auditability; a separate
human-reviewed promotion step is still required before updating live curated
answers.

Example VPS schedule: `deploy/knowledge-refresh.cron.example`. Store
`SUPABASE_SERVICE_ROLE_KEY` only in the VPS environment, never in
`.env.local` shipped to the browser or in source control.
