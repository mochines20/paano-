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
4. `npm run dev` → http://localhost:3000

## Structure

```
app/
  page.tsx            Landing page (3 pillars + trust section)
  paano/page.tsx      Chat page
  api/ask/route.ts    POST — Gemini + structured JSON parse + logging
components/
  Chat.tsx            Client chat UI (history, loading, suggestions)
  AnswerCard.tsx      Structured answer card, ibang layout per category
lib/
  prompts/system-prompt.ts   PAANO Taglish system prompt (fallback/disclaimer rules)
  answers.ts          Answer types + JSON parse/validate/repair
  gemini.ts           Gemini provider (JSON mode, retry, graceful fallback)
  groq.ts             Groq provider (OpenAI-compatible, json_object mode)
  llm.ts              Provider dispatcher (LLM_PROVIDER env)
  supabase.ts         Supabase client (graceful kung walang config)
  logging.ts          Per-IP question logging (best-effort)
supabase/schema.sql   Tables para sa question logs (+ future feedback/routes)
```

## Trust rules (hindi pwedeng tanggalin)

- Health: household-level first aid lang; laging may "kung lumala, pumunta sa doktor" threshold.
- Government fees/requirements: ranges lang; laging may link sa opisyal na source; hinahanap ang `last_verified`.
- Kapag hindi sigurado ang modelo → `confidence: "low"` + redirect sa opisyal na source. Bawal mag-imbento.

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint
