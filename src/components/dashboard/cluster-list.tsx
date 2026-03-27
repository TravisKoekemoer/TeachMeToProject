import Link from "next/link";

import { ConfidenceBadge } from "./confidence-badge";

type ClusterListProps = {
  clusters: Array<{
    id: string;
    name: string;
    sport: string;
    geoScope: string;
    audienceType: string;
    summary: string;
    confidenceScore: number;
    analyses: Array<{ id: string }>;
    recipe: { id: string; audienceName: string } | null;
  }>;
};

export function ClusterList({ clusters }: ClusterListProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl text-ink">Audience clusters</h2>
        <p className="text-sm text-ink/65">Deterministic grouping on top of analyzed signals, ready for recipe generation.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {clusters.map((cluster) => (
          <article
            key={cluster.id}
            className="rounded-3xl border border-white/60 bg-white/90 p-5 shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-dusk/70">{cluster.sport}</p>
                <h3 className="mt-2 font-display text-2xl text-ink">{cluster.name}</h3>
              </div>
              <ConfidenceBadge score={cluster.confidenceScore} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink/55">
              <span className="rounded-full bg-stone-100 px-3 py-1">{cluster.geoScope}</span>
              <span className="rounded-full bg-stone-100 px-3 py-1">{cluster.audienceType.replaceAll("_", " ")}</span>
              <span className="rounded-full bg-stone-100 px-3 py-1">{cluster.analyses.length} signals</span>
            </div>

            <p className="mt-4 text-sm leading-6 text-ink/72">{cluster.summary}</p>

            <div className="mt-5 flex items-center justify-between">
              <p className="text-sm text-ink/60">{cluster.recipe ? cluster.recipe.audienceName : "Recipe pending"}</p>
              {cluster.recipe ? (
                <Link
                  href={`/recipes/${cluster.recipe.id}`}
                  prefetch={false}
                  className="inline-flex rounded-full border border-sea/25 bg-sea/5 px-3 py-2 text-sm font-semibold text-sea transition hover:border-sea hover:bg-sea hover:text-white"
                >
                  View recipe
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
