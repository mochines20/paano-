# PAANO

Ang praktikal na **"paano"** para sa buhay sa Pilipinas — Taglish, hyper-local, at structured na mga sagot para sa **commute**, **lutong bahay**, **gawa-bahay**, **first aid (household-level)**, at **government docs guide**.

Stack: Next.js (App Router) + Tailwind CSS v4 + Gemini (`@google/genai`) **o** Groq (OpenAI-compatible, pinili sa `LLM_PROVIDER`) + Supabase (optional logging).

## Sprint status

| Sprint | Status |
| --- | --- |
| 0 — Setup (repo, env, system prompt) | Done |
| 1 — Core Q&A engine (`/paano`, `/api/ask`, per-IP logging) | Done |
| 2 — Structured answer templates + AnswerCard per category | Done |
| 3 — Image recognition | Next |
| 4 — Commute data + community layer | Next |
| 5 — First aid + docs static cards | Next |
| 6 — Monetization + hardening | Next |

## Setup

1. `npm install`
2. Kopyahin ang template at punan:
   ```bash
   cp .env.example .env.local   # (Windows: copy .env.example .env.local)
   ```
   - `GEMINI_API_KEY` **o** `GROQ_API_KEY` — kahit isa ang kailangan
   - `LLM_PROVIDER` — `gemini` (default) o `groq`
   - `SUPABASE_URL` / `SUPABASE_ANON_KEY` — optional sa dev; para sa question logging
3. Supabase (optional): i-run ang `supabase/schema.sql` sa SQL editor.
4. GTFS commute data (optional pero recommended): `npm run gtfs:download`
   — i-download ang Metro Manila GTFS (sakayph/gtfs, ang base data ng
   Sakay.ph) papunta sa `data/gtfs/` (gitignored). Kung wala ito, babalik
   sa pure-LLM ang commute answers.
5. `npm run dev` → http://localhost:3000

## Structure

```
app/
  page.tsx            Landing page (dark, isang CTA: ask input)
  paano/page.tsx      Chat page (kumukuha ng ?q= para i-auto-ask)
  api/ask/route.ts    POST — LLM + commute grounding + structured parse + logging
components/
  AskInput.tsx        Ang nag-iisang CTA (hero + sticky)
  StickyAsk.tsx       Persistent ask bar kapag naka-scroll na
  Chat.tsx            Client chat UI (history, loading, suggestions)
  AnswerCard.tsx      Structured answer card, ibang layout per category
  icons.tsx           Line icons ng feature cards
lib/
  prompts/system-prompt.ts   PAANO Taglish system prompt (fallback/disclaimer rules)
  answers.ts          Answer types + JSON parse/validate/repair
  llm.ts              Provider dispatcher (LLM_PROVIDER env)
  gemini.ts           Gemini provider (JSON mode, retry, graceful fallback)
  groq.ts             Groq provider (OpenAI-compatible, json_object mode)
  commute/fares.ts    LTFRB fare formulas (configurable constants, cited)
  commute/gtfs.ts     GTFS reader + stop/route lookup (data/gtfs/)
  commute/ground.ts   Commute grounding: GTFS routes + fare → LLM context
  docs/data.ts        Human-reviewed doc guides (PSA, LTO, DFA, NBI, PhilSys)
  docs/service.ts     Doc matching + DocGuide → structured answer
  supabase.ts         Supabase client (graceful kung walang config)
  logging.ts          Per-IP question logging (best-effort)
scripts/
  download-gtfs.mjs   I-download ang Metro Manila GTFS (npm run gtfs:download)
supabase/schema.sql   Tables para sa question logs (+ future feedback/routes)
```

## Trust rules (hindi pwedeng tanggalin)

- Health: household-level first aid lang; laging may "kung lumala, pumunta sa doktor" threshold.
- Government fees/requirements: ranges lang; laging may link sa opisyal na source; hinahanap ang `last_verified`.
- Kapag hindi sigurado ang modelo → `confidence: "low"` + redirect sa opisyal na source. Bawal mag-imbento.

## Commute data

- **Routes**: Metro Manila GTFS mula sa [sakayph/gtfs](https://github.com/sakayph/gtfs)
  (ang base data ng Sakay.ph; Philippine Transit App Challenge). I-download via
  `npm run gtfs:download` papunta sa `data/gtfs/` (gitignored). Lazy-loaded at
  naka-cache sa memory ng server.
- **Fares**: LTFRB fare formula bilang configurable constants sa
  `lib/commute/fares.ts` (epektibo 2026-03-19): modern jeepney ₱17 (unang 1km)
  + ₱2.30/km; ordinary bus ₱15 (unang 5km) + ₱2.49/km. Source: ltfrb.gov.ph.
- Ang grounding (`lib/commute/ground.ts`) ay nag-a-append ng GTFS route names +
  LTFRB fare estimate sa user message bago tawagin ang LLM, at ino-override ang
  `fare_range`/`route_names` ng sagot gamit ang datos — laging may citation at
  "i-verify bago sumakay" note. Kung walang data/gtfs, pure-LLM ang sagot.

## Docs guides (human-reviewed, static)

Static guides para sa: PSA Certificate (birth/marriage/death/CENOMAR), LTO
Student Permit, LTO Non-Professional License, DFA Passport, NBI Clearance,
PhilSys National ID. Huling na-verify: 2026-08-13.

- **Walang LLM call** — ang mga docs questions na tugma sa `lib/docs/data.ts`
  ay sinasagot ng static card (libre at mabilis); ang LLM ay para lang sa
  docs questions na wala sa listahan.
- **Dependency graph** — bawat doc ay may `prerequisites` (doc ids), para
  masabi ng PAANO ang "kailangan mo munang makuha ito" (hal. PSA Birth Cert
  → Student Permit → Non-Pro License; PSA → Passport/NBI/PhilSys).
- **Proactive alerts** — mga bagay na madalas makaligtaan ng ibang guides:
  PSA posting period (2–4 buwan Metro Manila / 6+ buwan probinsya), PhilSys
  walk-in na simula 2026 (wala nang online pre-reg), libre ang National ID,
  RA 11261 free NBI para sa first-time job seekers (hiwalay na portal), atbp.
- **Review schedule** — i-refresh ang fees/requirements nang manu-mano (lalo
  na ang NBI at LTO fees na nagbabago) at i-update ang `lastVerified`. Huwag
  hayaan ang LLM na gumawa ng fees/requirements para sa mga ito.

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint
