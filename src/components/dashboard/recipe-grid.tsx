import { HoverPrefetchLink } from "./hover-prefetch-link";
import { ConfidenceBadge } from "./confidence-badge";

type RecipeGridProps = {
  recipes: Array<{
    id: string;
    audienceName: string;
    targetSport: string;
    targetLocation: string;
    targetUserType: string;
    suggestedLandingPage: string;
    adAngle: string;
    cta: string;
    confidenceScore: number;
    cluster: {
      name: string;
    };
  }>;
};

export function RecipeGrid({ recipes }: RecipeGridProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl text-ink">Audience recipes</h2>
        <p className="text-sm text-ink/65">Manual X audience recommendations generated from the current cluster set.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {recipes.map((recipe) => (
          <article
            key={recipe.id}
            className="rounded-3xl border border-dusk/10 bg-dusk px-5 py-5 text-canvas shadow-soft transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-canvas/60">{recipe.targetSport}</p>
                <h3 className="mt-2 font-display text-2xl">{recipe.audienceName}</h3>
              </div>
              <ConfidenceBadge score={recipe.confidenceScore} />
            </div>

            <p className="mt-3 text-sm text-canvas/70">{recipe.cluster.name}</p>
            <p className="mt-4 text-sm leading-6 text-canvas/85">{recipe.adAngle}</p>

            <div className="mt-5 space-y-2 text-sm">
              <p>
                <span className="font-semibold text-canvas">Landing page:</span> {recipe.suggestedLandingPage}
              </p>
              <p>
                <span className="font-semibold text-canvas">Target:</span> {recipe.targetLocation} / {recipe.targetUserType.replaceAll("_", " ")}
              </p>
              <p>
                <span className="font-semibold text-canvas">CTA:</span> {recipe.cta}
              </p>
            </div>

            <HoverPrefetchLink
              href={`/recipes/${recipe.id}`}
              className="mt-5 inline-flex rounded-full border border-highlight/30 bg-highlight/10 px-3 py-2 text-sm font-semibold text-highlight transition hover:bg-highlight hover:text-ink"
            >
              Open detail view
            </HoverPrefetchLink>
          </article>
        ))}
      </div>
    </section>
  );
}
