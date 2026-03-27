# TeachMeGTM

TeachMeGTM is a small internal Next.js dashboard for TeachMeGTM. It ingests mock X posts, applies a cheap keyword gate, classifies likely buyer intent, clusters those analyses into audience themes, and generates manual X ad audience recipes.

## Stack

- Next.js 15 with TypeScript and App Router
- Tailwind CSS
- Prisma ORM
- Neon Postgres
- OpenAI API for classification and recipe generation
- Mock X provider abstraction for v1

## What v1 does

1. Loads 210 realistic mock X posts across tennis, golf, and pickleball.
2. Stores raw signals in Postgres.
3. Runs a rule-based prefilter using seeded rules.
4. Classifies candidate signals into structured analysis fields.
5. Clusters relevant signals into audience themes.
6. Generates recommended audience recipes.
7. Displays everything in a clean internal dashboard.

## Architecture

### App shape

- `app/page.tsx`
  Main dashboard with summary cards, filter controls, raw signal table, cluster list, and recipe list.
- `app/signals/[id]/page.tsx`
  Signal detail page with raw payload and analysis detail.
- `app/recipes/[id]/page.tsx`
  Recipe detail page with targeting inputs, ad angle, CTA, and supporting signals.
- `app/actions.ts`
  Server action to rerun the full mock ingestion and analysis pipeline.

### Domain + persistence

- `prisma/schema.prisma`
  Models for `Signal`, `SignalAnalysis`, `AudienceCluster`, `AudienceRecipe`, and `Rule`.
- `prisma/migrations/20260326150000_init/migration.sql`
  Initial Postgres schema.
- `prisma/seed.ts`
  Resets the database and runs the full pipeline so the dashboard is populated immediately.

### Pipeline

- `src/lib/providers/x`
  Provider abstraction. v1 only ships `MockXSignalProvider`, but the interface is ready for a future live X provider.
- `src/lib/scoring/rule-prefilter.ts`
  Cheap keyword/rule matching that decides which signals deserve LLM spend.
- `src/lib/scoring/classifier.ts`
  OpenAI-backed signal classification with a heuristic prior blended into the final score so live outputs stay calibrated instead of collapsing into extreme buckets. If `MOCK_OPENAI_MODE=true` or no API key is present, the app falls back to deterministic local heuristics so local development still works.
- `src/lib/pipeline/clustering.ts`
  Groups relevant analyses into pragmatic audience themes by sport and user type.
- `src/lib/pipeline/recipe-generator.ts`
  Produces audience recipes with keyword targets, conversation targets, exclusions, landing page, ad angle, and CTA.
- `src/lib/pipeline/run-intent-engine.ts`
  Orchestrates the whole flow end-to-end.

## Scoring logic

### 1. Rule prefilter

The first-pass filter reads seeded rules from `src/data/seed-rules.ts` and checks each post for sport-specific phrases like:

- `tennis lessons`
- `golf instructor`
- `pickleball coach`
- `junior tennis`
- `golf clinic`

Only matched signals move into LLM classification. Non-matching posts are still stored and receive a `FILTERED_OUT` analysis record so the dashboard can show noise alongside relevant signals.

### 2. Classification

Candidate signals are classified into:

- sport
- geography
- user type
- skill level
- lead intent score
- urgency score
- commercial relevance score
- sentiment
- relevance status
- explanation

The classification shape is normalized before it is written to Prisma. In live mode, the final numeric scores are a blend of the OpenAI response and the deterministic heuristic scorer so posts land on a wider, more stable range than raw model output alone.

### 3. Clustering

Relevant and possible signals are grouped deterministically by:

- sport
- inferred audience type

Each cluster gets:

- a theme name
- geo scope
- summary
- confidence score

### 4. Audience recipe generation

Each cluster generates one audience recipe with:

- audience name
- target sport
- target location
- target user type
- keyword targets
- conversation targets
- exclusions
- suggested landing page
- ad angle
- CTA
- confidence score

## Local setup

### Prerequisites

- Node.js 20+
- A Neon Postgres database
- An OpenAI API key if you want real LLM classification and recipe generation

### Environment

Copy `.env.example` to `.env` and fill in:

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4.1-mini"
MOCK_OPENAI_MODE="true"
```

Notes:

- Set `MOCK_OPENAI_MODE="false"` to force live OpenAI classification and recipe generation.
- Leave `MOCK_OPENAI_MODE="true"` if you want the app to stay runnable without paid API calls during setup.

### Install and run

```bash
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Refresh seeded data

To rebuild the dashboard data from the mock provider, rerun:

```bash
npx prisma db seed
```

## Seed data

The mock data includes:

- strong buyer intent
- urgent booking intent
- mid-intent comparison and pricing signals
- weak improvement intent
- low-intent keyword matches
- irrelevant noise
- adult beginner signals
- parent/youth signals
- general improvement signals

Sports covered in v1:

- tennis
- golf
- pickleball

## Project structure

```text
app/
  actions.ts
  layout.tsx
  page.tsx
  recipes/[id]/page.tsx
  signals/[id]/page.tsx
prisma/
  schema.prisma
  seed.ts
src/
  components/dashboard/*
  data/mock-signals.ts
  data/seed-rules.ts
  lib/db/dashboard.ts
  lib/openai.ts
  lib/pipeline/*
  lib/providers/x/*
  lib/scoring/*
```

## Assumptions

- v1 supports only TeachMeGTM internal users, so there is no auth layer.
- v1 does not launch ads or talk to the X Ads API.
- Suggested landing pages are internal recommendations, not generated routes.
- One audience recipe is generated per cluster for a simple, reviewable MVP.
- The local fallback mode exists only to make setup lightweight; live OpenAI should be used when evaluating real classification quality.
