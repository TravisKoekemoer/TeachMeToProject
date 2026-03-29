# TeachMeGTM

TeachMeGTM is an internal Next.js dashboard for reviewing mock X intent signals for TeachMe.To, classifying them into structured demand signals, clustering them into audience themes, and generating manual X audience recipes.

This is intentionally a small MVP:

- no auth
- no outbound ad execution
- no X Ads API integration
- no CRM sync
- no multi-platform ingestion
- mock X ingestion only in v1

## Stack

- Next.js 15 App Router with TypeScript
- Tailwind CSS
- Prisma ORM
- Neon Postgres
- OpenAI API for optional live classification and recipe generation

## Product flow

1. Load mock X posts from the mock provider.
2. Store raw posts as `Signal` rows.
3. Run a cheap rule prefilter.
4. Classify matched signals into `SignalAnalysis` rows.
5. Build deterministic `AudienceCluster` rows from relevant analyses.
6. Generate one `AudienceRecipe` per cluster.
7. Render everything in the internal dashboard.

## Architecture

### Next.js monolith shape

- `app/page.tsx`
  Dashboard page with summary cards, filters, raw signals, clusters, recipes, and runtime notices.
- `app/signals/[id]/page.tsx`
  Signal detail page.
- `app/recipes/[id]/page.tsx`
  Recipe detail page.
- `app/error.tsx` and `app/not-found.tsx`
  Friendly failure states for server errors and stale links.

### Runtime + config

- `src/lib/config.ts`
  Central runtime configuration and environment validation.
- `src/lib/openai.ts`
  OpenAI client setup driven by runtime config.

### Ingestion + pipeline

- `src/lib/providers/x/*`
  Clean X ingestion abstraction. v1 only uses `MockXIngestionProvider`.
- `src/lib/pipeline/run-intent-engine.ts`
  Main orchestration file for rules, ingestion, analysis, clustering, and recipe creation.
- `src/lib/scoring/rule-prefilter.ts`
  Cheap keyword gate.
- `src/lib/scoring/classifier.ts`
  Hybrid classification: heuristic baseline plus optional OpenAI enrichment.
- `src/lib/scoring/fallback-analysis.ts`
  Deterministic local scoring used in mock mode and failure fallback paths.
- `src/lib/pipeline/clustering.ts`
  Deterministic cluster builder.
- `src/lib/pipeline/recipe-generator.ts`
  Audience recipe generation with mock-safe fallback behavior.

### Persistence + view models

- `prisma/schema.prisma`
  Database models.
- `prisma/seed.ts`
  Resets and repopulates the dashboard.
- `src/lib/db/dashboard.ts`
  Typed dashboard and detail loaders used by the UI.
- `src/lib/types.ts`
  Shared domain and UI view-model types.

## Mock mode vs live mode

TeachMeGTM is designed to work locally without any live X credentials.

### Mock mode

Use mock mode for the default setup:

```env
MOCK_OPENAI_MODE="true"
X_PROVIDER_MODE="mock"
OPENAI_API_KEY=""
```

In this mode:

- X ingestion uses the seeded mock provider
- signal classification uses deterministic heuristics
- recipe generation uses deterministic fallback recipes
- the app is fully runnable without paid API calls

### Live OpenAI mode

If you want live classification and recipe generation:

```env
MOCK_OPENAI_MODE="false"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4.1-mini"
```

In this mode:

- the rule prefilter still decides which signals deserve model spend
- OpenAI classifies matched signals
- the result is blended with the heuristic scorer to keep scores stable
- OpenAI also generates the audience recipe copy

## Environment setup

Copy `.env.example` to `.env` and fill in the database values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4.1-mini"
MOCK_OPENAI_MODE="true"
X_PROVIDER_MODE="mock"
```

Notes:

- `DIRECT_URL` is the preferred runtime connection for this internal Neon setup and is also used by Prisma CLI.
- `DATABASE_URL` can stay set as a fallback, but the app now prefers `DIRECT_URL` for stability in local development.
- `X_PROVIDER_MODE` must stay `mock` in v1.
- If `MOCK_OPENAI_MODE="false"` but no `OPENAI_API_KEY` is present, the app falls back to mock scoring and shows a runtime warning in the UI.

## Local development

1. Install Node.js 20+.
2. Copy `.env.example` to `.env`.
3. Fill in your Neon database URLs.
4. From the project root, run:

```bash
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Reseeding the dashboard

To rebuild the dashboard data from the mock provider:

```bash
npx prisma db seed
```

That will:

- replace seeded rules
- reload the mock X posts
- rerun signal analysis
- rebuild clusters
- regenerate recipes

## Error handling

TeachMeGTM now handles these cases explicitly:

- invalid environment variables via runtime notices from `src/lib/config.ts`
- missing database configuration without crashing the dashboard page
- empty dashboard results with friendly empty states in the UI
- failed OpenAI scoring by storing heuristic fallback analyses instead
- failed recipe generation by storing fallback recipes instead
- stale signal and recipe links via `app/not-found.tsx`

## Seed data

The mock seed data includes 210 posts across:

- tennis
- golf
- pickleball

It intentionally mixes:

- urgent booking intent
- strong buyer intent
- parent and youth coaching intent
- general improvement intent
- mid-intent comparison and pricing signals
- weak intent
- low-match keyword chatter
- irrelevant noise

The distribution is intentionally skewed toward Phoenix and Scottsdale so the cluster geography is easier to see in the dashboard.

## Troubleshooting

### Prisma cannot find `schema.prisma`

Run commands from the project root, not from a parent folder.

### The dashboard shows zeros everywhere

Usually one of these is true:

- `.env` is missing or invalid
- the database schema has not been applied
- the seed script has not been run yet

### Detail pages show not found after reseeding

Refresh the dashboard and reopen the record from the current list. Seed runs rebuild the derived data set.

### Live scoring is not happening

Check:

- `MOCK_OPENAI_MODE="false"`
- `OPENAI_API_KEY` is set
- the dashboard is using freshly seeded data after the env change
