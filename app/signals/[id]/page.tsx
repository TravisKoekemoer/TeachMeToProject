import { notFound } from "next/navigation";
import { format } from "date-fns";

import { HoverPrefetchLink } from "../../../src/components/dashboard/hover-prefetch-link";
import { ConfidenceBadge } from "../../../src/components/dashboard/confidence-badge";
import { getSignalDetail } from "../../../src/lib/db/dashboard";
import { titleCase } from "../../../src/lib/utils";

export const revalidate = 10;

type SignalPageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function SignalDetailPage({ params }: SignalPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const signal = await getSignalDetail(resolvedParams.id);

  if (!signal) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <HoverPrefetchLink href="/" className="inline-flex text-sm font-semibold text-sea hover:text-dusk">
        Back to dashboard
      </HoverPrefetchLink>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dusk/65">Signal detail</p>
          <h1 className="mt-3 font-display text-4xl text-ink">@{signal.authorHandle}</h1>
          <p className="mt-2 text-sm text-ink/60">{format(signal.createdAt, "MMMM d, yyyy 'at' h:mm a")}</p>

          <div className="mt-6 rounded-3xl bg-stone-100/80 p-5">
            <p className="text-sm leading-7 text-ink">{signal.postText}</p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-stone-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-dusk/65">Matched rule</p>
              <p className="mt-2 text-sm text-ink">{signal.matchedRule ?? "No match"}</p>
            </div>
            <div className="rounded-3xl border border-stone-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-dusk/65">Source URL</p>
              <a href={signal.postUrl} className="mt-2 inline-flex text-sm font-semibold text-sea hover:text-dusk">
                Open mock X URL
              </a>
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/60 bg-dusk p-6 text-canvas shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-canvas/60">Analysis</p>
          {signal.analysis ? (
            <div className="mt-4 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-3xl">{titleCase(signal.analysis.sport ?? "unknown")}</h2>
                  <p className="mt-1 text-sm text-canvas/70">{signal.analysis.relevanceStatus}</p>
                </div>
                <ConfidenceBadge score={signal.analysis.leadIntentScore} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-canvas/55">Audience type</p>
                  <p className="mt-2 text-sm">{titleCase(signal.analysis.userType ?? "unknown")}</p>
                </div>
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-canvas/55">Skill level</p>
                  <p className="mt-2 text-sm">{titleCase(signal.analysis.skillLevel ?? "unknown")}</p>
                </div>
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-canvas/55">Location</p>
                  <p className="mt-2 text-sm">
                    {[signal.analysis.city, signal.analysis.state, signal.analysis.country].filter(Boolean).join(", ") || "Unknown"}
                  </p>
                </div>
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-canvas/55">Sentiment</p>
                  <p className="mt-2 text-sm">{titleCase(signal.analysis.sentiment ?? "unknown")}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-canvas/55">Lead intent</p>
                  <p className="mt-2 text-lg font-semibold">{Math.round(signal.analysis.leadIntentScore * 100)}%</p>
                </div>
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-canvas/55">Urgency</p>
                  <p className="mt-2 text-lg font-semibold">{Math.round(signal.analysis.urgencyScore * 100)}%</p>
                </div>
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-canvas/55">Commercial fit</p>
                  <p className="mt-2 text-lg font-semibold">{Math.round(signal.analysis.commercialRelevanceScore * 100)}%</p>
                </div>
              </div>

              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-canvas/55">Explanation</p>
                <p className="mt-2 text-sm leading-7 text-canvas/80">{signal.analysis.explanation}</p>
              </div>

              {signal.analysis.cluster?.recipe ? (
                <HoverPrefetchLink
                  href={`/recipes/${signal.analysis.cluster.recipe.id}`}
                  className="inline-flex rounded-full border border-highlight/25 bg-highlight/10 px-3 py-2 text-sm font-semibold text-highlight transition hover:bg-highlight hover:text-ink"
                >
                  Open linked recipe
                </HoverPrefetchLink>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-canvas/70">This signal has not been processed yet.</p>
          )}
        </article>
      </section>

      <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dusk/65">Raw JSON</p>
        <pre className="mt-4 overflow-x-auto rounded-3xl bg-stone-950 p-5 text-sm leading-6 text-stone-100">
          {JSON.stringify(signal.rawJson, null, 2)}
        </pre>
      </section>
    </main>
  );
}
