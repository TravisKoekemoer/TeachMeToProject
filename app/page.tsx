import { BarChart3, BrainCircuit, Filter, Sparkles } from "lucide-react";

import { ClusterList } from "../src/components/dashboard/cluster-list";
import { FiltersBar } from "../src/components/dashboard/filters-bar";
import { RecipeGrid } from "../src/components/dashboard/recipe-grid";
import { RuntimeNotices } from "../src/components/dashboard/runtime-notices";
import { SignalTable } from "../src/components/dashboard/signal-table";
import { SignalTrendCard } from "../src/components/dashboard/signal-trend-card";
import { SummaryCard } from "../src/components/dashboard/summary-card";
import { getAppRuntimeConfig, hasBlockingEnvironmentErrors } from "../src/lib/config";
import { createEmptyDashboardData, getDashboardData, normalizeDashboardFilters } from "../src/lib/db/dashboard";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const filters = normalizeDashboardFilters(resolvedSearchParams);
  const runtimeConfig = getAppRuntimeConfig();
  const notices = [...runtimeConfig.notices];
  let data = createEmptyDashboardData();

  if (!hasBlockingEnvironmentErrors()) {
    try {
      data = await getDashboardData(filters);
    } catch {
      notices.push({
        level: "error",
        title: "Dashboard load failed",
        message:
          "TeachMeGTM could not load dashboard data from the database. Check your Neon connection URLs, confirm the schema is applied, and rerun the seed script."
      });
    }
  }

  const llmStatusLabel = runtimeConfig.llmMode === "live" ? `Live OpenAI: ${runtimeConfig.openAiModel}` : "Mock scoring mode";
  const providerStatusLabel = runtimeConfig.xProviderMode === "mock" ? "Mock X provider" : runtimeConfig.xProviderMode;

  return (
    <main className="space-y-8">
      <section className="grid gap-6 rounded-[2rem] border border-white/70 bg-white/72 p-6 shadow-soft backdrop-blur lg:grid-cols-[1.55fr_0.95fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.34em] text-dusk/65">TeachMeGTM internal MVP</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl leading-tight text-ink">Intent-to-audience operations in one place</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink/72">
            Review mock X signals, filter for buying behavior, surface the strongest clusters, and turn them into audience recipes for manual GTM execution.
          </p>

          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-dusk/72">
            <span className="rounded-full bg-white/78 px-3 py-2">{providerStatusLabel}</span>
            <span className="rounded-full bg-white/78 px-3 py-2">{llmStatusLabel}</span>
            <span className="rounded-full bg-white/78 px-3 py-2">{data.signals.length} signals in view</span>
          </div>

          <div className="mt-4 rounded-3xl border border-white/75 bg-canvas/72 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dusk/60">How the LLM is used</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">
              The LLM only touches rule-matched signals. It scores lead intent, urgency, commercial fit, and audience traits, then drafts the audience recipe details for each cluster.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Mock X ingestion",
                copy: "Seeded posts keep v1 reliable in local development while the provider boundary stays ready for a future live feed.",
                icon: Filter
              },
              {
                title: "Hybrid scoring",
                copy: "Rules reduce noise first, then the LLM classifies matched signals and helps draft the audience recipe output.",
                icon: BrainCircuit
              },
              {
                title: "Cluster output",
                copy: "Signals group into audience themes with enough structure to spot promising demand pockets quickly.",
                icon: BarChart3
              },
              {
                title: "Audience recipes",
                copy: "Every cluster leads to a concrete landing page, ad angle, CTA, and targeting setup recommendation.",
                icon: Sparkles
              }
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/75 bg-canvas/82 p-4">
                <item.icon className="h-5 w-5 text-sea" />
                <p className="mt-3 font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-ink/68">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] bg-dusk p-6 text-canvas">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-canvas/60">Operating notes</p>
          <h2 className="mt-3 font-display text-3xl">Built for a fast internal review loop</h2>
          <p className="mt-3 text-sm leading-6 text-canvas/74">
            This dashboard stays read-only in the browser. Seed the mock provider, browse the demand picture, and move from raw signal to recommended audience without extra control paths.
          </p>

          <div className="mt-6 rounded-3xl bg-white/8 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-canvas/55">Recommended review flow</p>
            <ul className="mt-3 space-y-2 text-sm text-canvas/78">
              <li>Start with the filter panel to narrow the signal set to the strongest buying patterns.</li>
              <li>Check which audience clusters are concentrating the most promising demand.</li>
              <li>Open the recipe details and use them as a manual GTM starting point, not an auto-launch step.</li>
            </ul>
          </div>

          <div className="mt-8 grid gap-3 rounded-3xl bg-white/8 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-canvas/55">What this helps with</p>
              <ul className="mt-3 space-y-2 text-sm text-canvas/78">
                <li>Spot strong intent quickly</li>
                <li>Understand where demand is clustering</li>
                <li>Review recipe suggestions before manual launch</li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-canvas/55">Still out of scope</p>
              <ul className="mt-3 space-y-2 text-sm text-canvas/78">
                <li>No auth or CRM sync</li>
                <li>No X Ads API launch flow</li>
                <li>No posting or multi-platform ingestion</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <RuntimeNotices notices={notices} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Signals" value={data.summary.totalSignals.toString()} caption="Stored raw mock X posts." tone="neutral" />
        <SummaryCard label="Candidates" value={data.summary.candidateSignals.toString()} caption="Matched by the rule prefilter." tone="highlight" />
        <SummaryCard label="Relevant" value={data.summary.relevantSignals.toString()} caption="High-confidence buying or booking signals." tone="sea" />
        <SummaryCard label="Clusters" value={data.summary.clusterCount.toString()} caption="Audience themes generated from analyses." tone="dusk" />
        <SummaryCard label="Recipes" value={data.summary.recipeCount.toString()} caption="Manual X audience recommendations available." tone="neutral" />
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <FiltersBar filters={filters} resultCount={data.signals.length} />
          <SignalTable signals={data.signals} />
        </div>

        <div className="min-w-0 space-y-6">
          <SignalTrendCard signals={data.signals} />
          <ClusterList clusters={data.clusters} />
          <RecipeGrid recipes={data.recipes} />
        </div>
      </section>
    </main>
  );
}