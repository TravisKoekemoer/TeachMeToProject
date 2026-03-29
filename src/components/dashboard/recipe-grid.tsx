import type { DashboardRecipeListItem } from "../../lib/types";

import { ConfidenceBadge } from "./confidence-badge";
import { HoverPrefetchLink } from "./hover-prefetch-link";

type RecipeGridProps = {
  recipes: DashboardRecipeListItem[];
};

export function RecipeGrid({ recipes }: RecipeGridProps) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dusk/65">Audience recipes</p>
        <h2 className="mt-2 font-display text-3xl text-ink">Recommended audience setups</h2>
        <p className="mt-2 text-sm leading-6 text-ink/66">Each recipe turns a cluster into a concrete targeting recommendation with a landing page, angle, CTA, and audience inputs.</p>
      </div>

      {!recipes.length ? (
        <article className="rounded-3xl border border-dusk/22 bg-dusk px-6 py-6 text-canvas shadow-soft">
          <h3 className="font-display text-3xl">No audience recipes yet</h3>
          <p className="mt-3 text-sm leading-6 text-canvas/78">
            Recipes are created after clusters are available. In mock mode, the app can still generate fallback recipes without any live X credentials.
          </p>
        </article>
      ) : (
        <div className="grid gap-4">
          {recipes.map((recipe) => (
            <article
              key={recipe.id}
              className="rounded-[1.75rem] border border-stone-300/80 bg-white/92 p-6 shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-highlight/25 bg-highlight/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-900">
                      {recipe.targetSport}
                    </span>
                    <span className="rounded-full border border-stone-300/70 bg-dusk/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-dusk/78">
                      {recipe.targetUserType.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="shrink-0">
                    <ConfidenceBadge score={recipe.confidenceScore} kind="confidence" size="sm" />
                  </div>
                </div>

                <h3 className="font-display text-[2rem] leading-tight text-ink">{recipe.audienceName}</h3>
              </div>

              <p className="mt-3 text-sm font-semibold text-dusk/70">{recipe.cluster.name}</p>
              <p className="mt-4 text-sm leading-6 text-ink/76">{recipe.adAngle}</p>

              <div className="mt-5 grid gap-3 rounded-3xl border border-stone-200/90 bg-stone-50 p-4 text-sm text-ink/78">
                <p>
                  <span className="font-semibold text-ink">Landing page:</span> {recipe.suggestedLandingPage}
                </p>
                <p>
                  <span className="font-semibold text-ink">Target market:</span> {recipe.targetLocation}
                </p>
                <p>
                  <span className="font-semibold text-ink">CTA:</span> {recipe.cta}
                </p>
              </div>

              <HoverPrefetchLink
                href={`/recipes/${recipe.id}`}
                className="mt-5 inline-flex rounded-full bg-ink px-3 py-2 text-sm font-semibold text-canvas transition hover:bg-dusk"
              >
                Open detail view
              </HoverPrefetchLink>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
