# PAANO

Ang praktikal na **"paano"** para sa buhay sa Pilipinas — Taglish, hyper-local, at structured na mga sagot para sa **commute**, **lutong bahay**, **gawaing bahay**, **first aid (household-level)**, at **government docs guide**.

Stack: Next.js (App Router) + Tailwind CSS v4 + curated answers, Groq, Gemini (`@google/genai`), Ollama sa VPS, at Supabase (optional logging).

### AI provider chain

With `LLM_PROVIDER=auto`, PAANO uses this order:

1. Curated/static answers for reviewed recipes, first-aid guides, and document guides.
2. Groq `openai/gpt-oss-20b` for fast structured text answers.
3. Gemini Flash-Lite for difficult/sensitive text when `GEMINI_API_KEY` is configured.
4. Ollama/Qwen 3.5 4B on the VPS as the local fallback.

For image questions, the order is Gemini vision → explicitly configured Groq vision
model → Ollama/Qwen vision. The normal Groq GPT-OSS text model is never used as a
vision model.

## Sprint status

| Sprint | Status |
| --- | --- |
| 0 — Setup (repo, env, system prompt) | Done |
| 1 — Core Q&A engine (`/paano`, `/api/ask`, per-IP logging) | Done |
| 2 — Structured answer templates + AnswerCard per category | Done |
| 3 — Image recognition (photo ng sangkap → ulam) | Done |
| 4 — Commute data + community layer (thumbs/corrections) | Done |
| 5 — First aid + docs static cards | Done |
| 6 — Rate limits + hardening (auth/accounts = future) | Partial |

## Beyond the original plan

- **Community verification (ang moat)** — 👍/👎 + free-text correction sa bawat
  sagot → Supabase `answer_feedback`; "may nagsabing i-verify" badge kapag may
  correction ang komunidad.
- **Budget/pantry cooking** — "anong ulam sa ₱200, may manok ako?" na may
  palengke price grounding (DA Bantay Presyo; fallback table kung walang URL).
- **Provincial GTFS** — auto-detect ng `data/gtfs/provincial/<city>/` feeds
  (i-drop lang ang GTFS files). Tandaan: ang PARASOL repo ay may mga placeholder
  na walang laman — walang usable na public provincial feed pa.
- **Popular paano** — trending chips sa chat empty state (mula sa question logs).
- **PWA** — installable, offline app shell, Web Share Target (i-share ang text
  papunta sa /paano?q=).
- **Rate limits** — 15 tanong/araw + 5/min bawat IP (in-memory; Redis kapag
  nag-scale).

## Setup

1. `npm install`
2. Kopyahin ang template at punan:
   ```bash
   cp .env.example .env.local   # (Windows: copy .env.example .env.local)
   ```
   - `LLM_PROVIDER=auto` — recommended provider chain; set `groq`, `gemini`, o `ollama` only for debugging
   - `GROQ_API_KEY` + `GROQ_MODEL=openai/gpt-oss-20b` — fast structured text provider
   - `GEMINI_API_KEY` + `GEMINI_MODEL=gemini-2.5-flash` — difficult text and image fallback
   - `OLLAMA_BASE_URL` + `OLLAMA_MODEL=qwen3.5:4b` — local/VPS fallback and vision
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
  api/ask/route.ts    Thin HTTP layer: validation + rate limit + logging
  api/feedback/       Community thumbs/corrections + correction counts
  api/trending/       Top "paano" questions (30 araw) para sa chips
components/
  AskInput.tsx        Ang nag-iisang CTA (hero + sticky)
  StickyAsk.tsx       Persistent ask bar kapag naka-scroll na
  Chat.tsx            Client chat UI (multi-turn, follow-ups, image upload)
  AnswerCard.tsx      Structured card + community feedback + copy
  PwaRegister.tsx     Service worker registration (production)
  icons.tsx           Line icons ng feature cards
lib/
  pipeline.ts         Business logic: image→recipe → docs-static →
                      commute/cooking grounding → LLM → suggestions.
  prompts/system-prompt.ts   PAANO Taglish system prompt (fallback/disclaimer rules)
  answers.ts          Answer types + JSON parse/validate/repair + answerToText
  llm.ts              Provider chain + text/vision fallback dispatcher
  gemini.ts           Gemini text + vision provider (JSON mode, retry)
  ollama.ts           Ollama VPS provider + vision
  groq.ts             Groq provider (OpenAI-compatible structured text + optional vision)
  rate-limit.ts       Per-IP limiter (15/araw + 5/min burst)
  feedback.ts         Community feedback (answer hash → Supabase)
  commute/fares.ts    LTFRB fare formulas (configurable constants, cited)
  commute/sources.ts  Commute source registry, priority, freshness, and provenance
  commute/gtfs.ts     GTFS reader (metro + provincial) + stop/route lookup
  commute/ground.ts   Commute grounding: GTFS routes + fare → LLM context
  cooking/prices.ts   Palengke prices (DA Bantay Presyo o fallback table)
  cooking/ground.ts   Budget/pantry cooking grounding
  cooking/dishes.ts   Curated Filipino dish map (image→recipe matching)
  docs/data.ts        Human-reviewed doc guides (PSA, LTO, DFA, NBI, PhilSys)
  docs/service.ts     Doc matching + DocGuide → structured answer + follow-ups
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
- **Provincial**: i-drop ang GTFS files sa `data/gtfs/provincial/<city>/` —
  auto-detect ng loader. Babala: ang PARASOL/safetravelph repo ay may mga
  placeholder files na WALANG laman — wala pang usable na public provincial
  feed; handa na ang infrastructure, kulang ang data.
- **Fares**: LTFRB fare formula bilang configurable, needs-review constants sa
  `lib/commute/fares.ts`. Ang reported 2026-09-28 Metro Manila estimate ay:
  traditional jeepney ₱14 (unang 4km) + ₱2.00/km; modern jeepney ₱17 (unang 4km)
  + ₱2.40/km; ordinary bus ₱15 (unang 5km) + ₱2.49/km; aircon bus ₱18 (unang 5km)
  + ₱2.98/km. Source of truth ang latest official matrix sa ltfrb.gov.ph.
  P2P, UV Express, at tricycle ay non-formula (fixed route fares / LGU-set).
- Ang grounding (`lib/commute/ground.ts`) ay sumusunod sa priority na official
  government → official terminal/operator → official LGU → community GTFS →
  aggregator. Ang terminal/operator snapshot ay inuuna sa matching fixed fares;
  ang community GTFS ay route discovery/distance fallback lamang. Bawat sagot ay
  may source metadata, status, at verification note; hindi tinatawag na official
  o live ang static/fallback data.

### Commute source priority

1. Official government: [LTFRB](https://ltfrb.gov.ph/), [DOTr-MRT3](https://www.dotrmrt3.gov.ph/citizens-charter), [LRTA](https://www.lrta.gov.ph/tickets-and-fares/), at [MMDA](https://mmda.gov.ph/).
2. Official terminal/operator: [PITX](https://www.pitx.ph/), [One Ayala](https://ayalalandoffices.com.ph/offices/makati/one-ayala), at BGC Bus/operator notices.
3. Official LGU transport and traffic advisories para sa partikular na lungsod.
4. Community GTFS gaya ng [SakayPH GTFS](https://github.com/sakayph/gtfs) para sa route discovery at geometry.
5. Aggregators gaya ng [Transitland](https://www.transit.land/feeds/f-wdw-manila) at [BusMaps](https://busmaps.com/fil/philippines/Philippine-Transit-App-Challenge/metro-manila) bilang fallback lamang.

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
