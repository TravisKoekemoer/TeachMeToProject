import { cn } from "../../lib/utils";

import type { DashboardClusterListItem } from "../../lib/types";

import { ConfidenceBadge } from "./confidence-badge";
import { HoverPrefetchLink } from "./hover-prefetch-link";

type ClusterListProps = {
  clusters: DashboardClusterListItem[];
};

function isPromisingCluster(cluster: DashboardClusterListItem) {
  return cluster.confidenceScore >= 0.75 || (cluster.confidenceScore >= 0.68 && cluster.signalCount >= 5);
}

export function ClusterList({ clusters }: ClusterListProps) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dusk/65">Audience clusters</p>
        <h2 className="mt-2 font-display text-3xl text-ink">Where demand is stacking up</h2>
        <p className="mt-2 text-sm leading-6 text-ink/66">Clusters group the best signal pockets into GTM-ready audience themes, with stronger ones visually elevated first.</p>
      </div>

      {!clusters.length ? (
        <article className="rounded-3xl border border-stone-300/80 bg-white/90 p-6 shadow-soft backdrop-blur">
          <h3 className="font-display text-3xl text-ink">No audience clusters yet</h3>
          <p className="mt-3 text-sm leading-6 text-ink/68">
            Clusters appear after the analysis stage finds relevant or possible signals. If the dashboard is empty, seed the mock data first.
          </p>
        </article>
      ) : (
        <div className="grid gap-4">
          {clusters.map((cluster) => {
            const promising = isPromisingCluster(cluster);

            return (
              <article
                key={cluster.id}
                className={cn(
                  "rounded-[1.75rem] border p-6 shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl",
                  promising
                    ? "border-sea/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(228,245,240,0.94)_100%)]"
                    : "border-stone-300/80 bg-white/90"
                )}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-stone-300/70 bg-dusk/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-dusk/78">
                        {cluster.sport}
                      </span>
                      {promising ? (
                        <span className="rounded-full border border-sea/25 bg-sea px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                          Promising audience
                        </span>
                      ) : null}
                    </div>
                    <div className="shrink-0">
                      <ConfidenceBadge score={cluster.confidenceScore} kind="confidence" size="sm" />
                    </div>
                  </div>

                  <h3 className="font-display text-[2rem] leading-tight text-ink">{cluster.name}</h3>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink/58">
                  <span className="rounded-full border border-stone-200/90 bg-white/80 px-3 py-1">{cluster.geoScope}</span>
                  <span className="rounded-full border border-stone-200/90 bg-white/80 px-3 py-1">{cluster.audienceType.replaceAll("_", " ")}</span>
                  <span className="rounded-full border border-stone-200/90 bg-white/80 px-3 py-1">{cluster.signalCount} signals</span>
                </div>

                <p className="mt-4 text-sm leading-6 text-ink/72">{cluster.summary}</p>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-dusk/60">Recipe status</p>
                    <p className="mt-1 text-sm text-ink/66">{cluster.recipe ? cluster.recipe.audienceName : "Recipe pending"}</p>
                  </div>
                  {cluster.recipe ? (
                    <HoverPrefetchLink
                      href={`/recipes/${cluster.recipe.id}`}
                      className={cn(
                        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition",
                        promising
                          ? "bg-sea text-white hover:bg-dusk"
                          : "border border-sea/25 bg-sea/5 text-sea hover:border-sea hover:bg-sea hover:text-white"
                      )}
                    >
                      View recipe
                    </HoverPrefetchLink>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
