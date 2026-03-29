import { notFound } from "next/navigation";

import { ConfidenceBadge } from "../../../src/components/dashboard/confidence-badge";
import { HoverPrefetchLink } from "../../../src/components/dashboard/hover-prefetch-link";
import { getRecipeDetail } from "../../../src/lib/db/dashboard";
import { titleCase } from "../../../src/lib/utils";

export const dynamic = "force-dynamic";

type RecipePageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecipeDetailPage({ params }: RecipePageProps) {
  const resolvedParams = await Promise.resolve(params);
  const recipe = await getRecipeDetail(resolvedParams.id);

  if (!recipe) {
    notFound();
  }

  return (
    <main className="space-y-8">
      <HoverPrefetchLink
        href="/"
        className="inline-flex rounded-full border border-sea/20 bg-white/80 px-3 py-2 text-sm font-semibold text-sea shadow-soft transition hover:border-sea hover:bg-sea hover:text-white"
      >
        Back to dashboard
      </HoverPrefetchLink>

      <section className="grid gap-6 lg:grid-cols-[0.96fr_1.04fr]">
        <article className="rounded-[2rem] border border-white/60 bg-dusk p-6 text-canvas shadow-soft lg:sticky lg:top-6 lg:self-start">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-canvas/58">Audience recipe</p>
              <h1 className="mt-3 font-display text-4xl leading-tight">{recipe.audienceName}</h1>
              <p className="mt-3 text-sm text-canvas/70">{recipe.cluster.name}</p>
            </div>
            <ConfidenceBadge score={recipe.confidenceScore} kind="confidence" />
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
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-canvas/55">Mapped signals</p>
              <p className="mt-2 text-sm">{recipe.cluster.signalCount}</p>
            </div>
          </div>

          <div className="mt-5 rounded-3xl bg-white/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-canvas/55">Suggested landing page</p>
            <p className="mt-2 text-sm">{recipe.suggestedLandingPage}</p>
          </div>

          <div className="mt-5 rounded-3xl bg-white/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-canvas/55">CTA</p>
            <p className="mt-2 text-sm">{recipe.cta}</p>
          </div>

          <div className="mt-5 rounded-3xl bg-white/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-canvas/55">Suggested ad angle</p>
            <p className="mt-2 text-sm leading-7 text-canvas/84">{recipe.adAngle}</p>
          </div>

          <div className="mt-5 rounded-3xl bg-white/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-canvas/55">Cluster summary</p>
            <p className="mt-2 text-sm leading-7 text-canvas/82">{recipe.cluster.summary}</p>
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/60 bg-white/92 p-6 shadow-soft backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dusk/65">Targeting recipe</p>
          <h2 className="mt-2 font-display text-3xl text-ink">Manual setup inputs</h2>
          <p className="mt-2 text-sm leading-6 text-ink/66">
            Use these inputs as the base audience recipe for a manual X campaign review. The structure stays intentionally simple and editable.
          </p>

          <div className="mt-6 space-y-6">
            <section>
              <h3 className="font-display text-2xl text-ink">Keyword targets</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {recipe.keywordTargets.map((keyword) => (
                  <span key={keyword} className="rounded-full bg-highlight/20 px-3 py-2 text-sm font-medium text-amber-900">
                    {keyword}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <h3 className="font-display text-2xl text-ink">Conversation targets</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {recipe.conversationTargets.length ? (
                  recipe.conversationTargets.map((keyword) => (
                    <span key={keyword} className="rounded-full bg-sea/10 px-3 py-2 text-sm font-medium text-sea">
                      {keyword}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-ink/60">No conversation targets were generated for this cluster.</p>
                )}
              </div>
            </section>

            <section>
              <h3 className="font-display text-2xl text-ink">Exclusions</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {recipe.exclusions.map((keyword) => (
                  <span key={keyword} className="rounded-full bg-rose/10 px-3 py-2 text-sm font-medium text-rose">
                    {keyword}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </article>
      </section>

      <section className="rounded-[2rem] border border-white/60 bg-white/92 p-6 shadow-soft backdrop-blur">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dusk/65">Supporting signals</p>
            <h2 className="mt-2 font-display text-3xl text-ink">Posts behind this recipe</h2>
          </div>
          <p className="text-sm text-ink/60">{recipe.cluster.signalCount} mapped signals</p>
        </div>

        {!recipe.cluster.analyses.length ? (
          <div className="mt-5 rounded-3xl border border-stone-200 bg-stone-50 p-5 text-sm text-ink/68">
            No supporting signals are currently attached to this cluster.
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {recipe.cluster.analyses.map((analysis) => (
              <article key={analysis.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">@{analysis.signal.authorHandle}</p>
                    <p className="mt-2 line-clamp-3 text-sm leading-7 text-ink/72">{analysis.signal.postText}</p>
                  </div>
                  <ConfidenceBadge score={analysis.leadIntentScore} kind="intent" size="sm" />
                </div>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-dusk/65">{analysis.relevanceStatus.replaceAll("_", " ")}</p>
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
        )}
      </section>
    </main>
  );
}