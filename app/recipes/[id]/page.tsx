import { notFound } from "next/navigation";

import { HoverPrefetchLink } from "../../../src/components/dashboard/hover-prefetch-link";
import { ConfidenceBadge } from "../../../src/components/dashboard/confidence-badge";
import { getRecipeDetail } from "../../../src/lib/db/dashboard";
import { titleCase } from "../../../src/lib/utils";

export const revalidate = 10;

type RecipePageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function RecipeDetailPage({ params }: RecipePageProps) {
  const resolvedParams = await Promise.resolve(params);
  const recipe = await getRecipeDetail(resolvedParams.id);

  if (!recipe) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <HoverPrefetchLink href="/" className="inline-flex text-sm font-semibold text-sea hover:text-dusk">
        Back to dashboard
      </HoverPrefetchLink>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[2rem] border border-white/60 bg-dusk p-6 text-canvas shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-canvas/58">Audience recipe</p>
              <h1 className="mt-3 font-display text-4xl">{recipe.audienceName}</h1>
              <p className="mt-2 text-sm text-canvas/70">{recipe.cluster.name}</p>
            </div>
            <ConfidenceBadge score={recipe.confidenceScore} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-canvas/55">Target sport</p>
              <p className="mt-2 text-sm">{titleCase(recipe.targetSport)}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-canvas/55">Target location</p>
              <p className="mt-2 text-sm">{recipe.targetLocation}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-canvas/55">Audience type</p>
              <p className="mt-2 text-sm">{titleCase(recipe.targetUserType)}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-canvas/55">CTA</p>
              <p className="mt-2 text-sm">{recipe.cta}</p>
            </div>
          </div>

          <div className="mt-5 rounded-3xl bg-white/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-canvas/55">Suggested landing page</p>
            <p className="mt-2 text-sm">{recipe.suggestedLandingPage}</p>
          </div>

          <div className="mt-5 rounded-3xl bg-white/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-canvas/55">Suggested ad angle</p>
            <p className="mt-2 text-sm leading-7 text-canvas/82">{recipe.adAngle}</p>
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dusk/65">Targeting recipe</p>

          <div className="mt-5 space-y-5">
            <div>
              <h2 className="font-display text-2xl text-ink">Keyword targets</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {recipe.keywordTargets.map((keyword) => (
                  <span key={keyword} className="rounded-full bg-highlight/25 px-3 py-2 text-sm font-medium text-ink">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl text-ink">Conversation targets</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {recipe.conversationTargets.map((keyword) => (
                  <span key={keyword} className="rounded-full bg-sea/10 px-3 py-2 text-sm font-medium text-sea">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl text-ink">Exclusions</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {recipe.exclusions.map((keyword) => (
                  <span key={keyword} className="rounded-full bg-rose/10 px-3 py-2 text-sm font-medium text-rose">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-stone-200 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dusk/65">Cluster summary</p>
              <p className="mt-3 text-sm leading-7 text-ink/72">{recipe.cluster.summary}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-soft">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dusk/65">Supporting signals</p>
            <h2 className="mt-2 font-display text-3xl text-ink">Posts behind this recipe</h2>
          </div>
          <p className="text-sm text-ink/60">{recipe.cluster._count.analyses} mapped signals</p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {recipe.cluster.analyses.map((analysis) => (
            <article key={analysis.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm font-semibold text-ink">@{analysis.signal.authorHandle}</p>
              <p className="mt-2 text-sm leading-7 text-ink/72">{analysis.signal.postText}</p>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-dusk/65">
                  {analysis.relevanceStatus} / {Math.round(analysis.leadIntentScore * 100)}%
                </p>
                <HoverPrefetchLink
                  href={`/signals/${analysis.signal.id}`}
                  className="rounded-full border border-sea/20 bg-sea/5 px-3 py-2 text-sm font-semibold text-sea transition hover:border-sea hover:bg-sea hover:text-white"
                >
                  Open signal
                </HoverPrefetchLink>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
