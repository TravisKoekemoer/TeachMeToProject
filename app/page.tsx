import { BarChart3, BrainCircuit, Filter, Sparkles } from "lucide-react";

import { ClusterList } from "../src/components/dashboard/cluster-list";
import { FiltersBar } from "../src/components/dashboard/filters-bar";
import { RecipeGrid } from "../src/components/dashboard/recipe-grid";
import { SignalTable } from "../src/components/dashboard/signal-table";
import { SummaryCard } from "../src/components/dashboard/summary-card";
import { getDashboardData, normalizeDashboardFilters } from "../src/lib/db/dashboard";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const filters = normalizeDashboardFilters(resolvedSearchParams);
  const data = await getDashboardData(filters);

  return (
    <main className="space-y-8">
      <section className="grid gap-6 rounded-[2rem] border border-white/60 bg-white/55 p-6 shadow-soft backdrop-blur lg:grid-cols-[1.6fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.34em] text-dusk/65">TeachMeGTM internal MVP</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl leading-tight text-ink">TeachMeGTM</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink/72">
            Ingest mock X signals, run a cheap keyword gate, classify buyer intent with an LLM layer, cluster the
            strongest patterns, and produce audience recipes for manual X campaign setup.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Mock X ingestion",
                copy: "Provider abstraction keeps v1 on seed data while leaving room for a live feed later.",
                icon: Filter
              },
              {
                title: "Hybrid scoring",
                copy: "Rules trim spend first, then classification enriches only viable candidate posts.",
                icon: BrainCircuit
              },
              {
                title: "Cluster output",
                copy: "Relevant analyses group into audience themes by sport, user type, and lead posture.",
                icon: BarChart3
              },
              {
                title: "Audience recipes",
                copy: "Each cluster gets a suggested landing page, ad angle, CTA, and targeting inputs.",
                icon: Sparkles
              }
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/70 bg-canvas/70 p-4">
                <item.icon className="h-5 w-5 text-sea" />
                <p className="mt-3 font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-ink/68">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] bg-dusk p-6 text-canvas">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-canvas/60">MVP operating notes</p>
          <h2 className="mt-3 font-display text-3xl">Fast local workflow, small surface area</h2>
          <p className="mt-3 text-sm leading-6 text-canvas/72">
            This dashboard stays read-only in the browser. Mock signal refreshes happen from local seed data, while the
            UI focuses on browsing signals, clusters, and recipes without extra control flow.
          </p>

          <div className="mt-8 space-y-3 rounded-3xl bg-white/8 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-canvas/55">Current v1 constraints</p>
            <ul className="space-y-2 text-sm text-canvas/75">
              <li>No auth or CRM connections</li>
              <li>No X Ads API launch flow</li>
              <li>No posting, outreach, or multi-platform ingestion</li>
              <li>Only mock X provider in v1</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Signals"
          value={data.summary.totalSignals.toString()}
          caption="Stored raw mock X posts."
        />
        <SummaryCard
          label="Candidates"
          value={data.summary.candidateSignals.toString()}
          caption="Matched by the rule prefilter."
        />
        <SummaryCard
          label="Relevant"
          value={data.summary.relevantSignals.toString()}
          caption="High-confidence buying or booking signals."
        />
        <SummaryCard
          label="Clusters"
          value={data.summary.clusterCount.toString()}
          caption="Audience themes generated from analyses."
        />
        <SummaryCard
          label="Recipes"
          value={data.summary.recipeCount.toString()}
          caption="Manual X audience recommendations available."
        />
      </section>

      <FiltersBar filters={filters} />

      <section className="grid items-start gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <SignalTable signals={data.signals} />
        <div className="space-y-6">
          <ClusterList clusters={data.clusters} />
          <RecipeGrid recipes={data.recipes} />
        </div>
      </section>
    </main>
  );
}
