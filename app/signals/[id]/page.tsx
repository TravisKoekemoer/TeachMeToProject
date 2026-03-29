import { format } from "date-fns";
import { notFound } from "next/navigation";

import { ConfidenceBadge } from "../../../src/components/dashboard/confidence-badge";
import { HoverPrefetchLink } from "../../../src/components/dashboard/hover-prefetch-link";
import { getSignalDetail } from "../../../src/lib/db/dashboard";
import { cn, titleCase } from "../../../src/lib/utils";

export const dynamic = "force-dynamic";

type SignalPageProps = {
  params: Promise<{ id: string }>;
};

function statusClasses(status: string) {
  switch (status) {
    case "RELEVANT":
      return "bg-emerald-50 text-emerald-800";
    case "POSSIBLE":
      return "bg-amber-50 text-amber-900";
    case "FILTERED_OUT":
      return "bg-stone-100 text-stone-600";
    default:
      return "bg-rose-50 text-rose-800";
  }
}

export default async function SignalDetailPage({ params }: SignalPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const signal = await getSignalDetail(resolvedParams.id);

  if (!signal) {
    notFound();
  }

  const linkedRecipeHref = signal.analysis?.cluster?.recipe ? `/recipes/${signal.analysis.cluster.recipe.id}` : null;

  return (
    <main className="space-y-8">
      <HoverPrefetchLink
        href="/"
        className="inline-flex rounded-full border border-sea/20 bg-white/80 px-3 py-2 text-sm font-semibold text-sea shadow-soft transition hover:border-sea hover:bg-sea hover:text-white"
      >
        Back to dashboard
      </HoverPrefetchLink>

      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <article className="rounded-[2rem] border border-white/60 bg-white/92 p-6 shadow-soft backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dusk/65">Signal detail</p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl text-ink">@{signal.authorHandle}</h1>
              <p className="mt-2 text-sm text-ink/60">{format(signal.createdAt, "MMMM d, yyyy 'at' h:mm a")}</p>
            </div>
            {signal.analysis ? <ConfidenceBadge score={signal.analysis.leadIntentScore} kind="intent" /> : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
            <span className="rounded-full bg-stone-100 px-3 py-1 text-dusk/72">{signal.matchedRule ?? "No matched rule"}</span>
            {signal.analysis?.sport ? (
              <span className="rounded-full bg-sea/8 px-3 py-1 text-sea">{titleCase(signal.analysis.sport)}</span>
            ) : null}
            {signal.analysis ? (
              <span className={cn("rounded-full px-3 py-1", statusClasses(signal.analysis.relevanceStatus))}>
                {signal.analysis.relevanceStatus.replaceAll("_", " ")}
              </span>
            ) : null}
          </div>

          <div className="mt-6 rounded-[1.75rem] bg-stone-100/90 p-5">
            <p className="text-sm leading-8 text-ink">{signal.postText}</p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-stone-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dusk/65">Audience type</p>
              <p className="mt-2 text-sm text-ink">{titleCase(signal.analysis?.userType ?? "unknown")}</p>
            </div>
            <div className="rounded-3xl border border-stone-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dusk/65">Location</p>
              <p className="mt-2 text-sm text-ink">
                {[signal.analysis?.city, signal.analysis?.state, signal.analysis?.country].filter(Boolean).join(", ") || "Unknown"}
              </p>
            </div>
            <div className="rounded-3xl border border-stone-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dusk/65">Skill level</p>
              <p className="mt-2 text-sm text-ink">{titleCase(signal.analysis?.skillLevel ?? "unknown")}</p>
            </div>
            <div className="rounded-3xl border border-stone-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dusk/65">Source URL</p>
              <a
                href={signal.postUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex text-sm font-semibold text-sea hover:text-dusk"
              >
                Open mock X URL
              </a>
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/60 bg-dusk p-6 text-canvas shadow-soft lg:sticky lg:top-6 lg:self-start">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-canvas/60">Analysis panel</p>
              <h2 className="mt-2 font-display text-3xl">How this signal was scored</h2>
            </div>
            {signal.analysis ? <ConfidenceBadge score={signal.analysis.leadIntentScore} kind="intent" /> : null}
          </div>

          {signal.analysis ? (
            <div className="mt-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    label: "Lead intent",
                    value: signal.analysis.leadIntentScore,
                    copy: "How strongly the post reads like someone ready to find instruction."
                  },
                  {
                    label: "Urgency",
                    value: signal.analysis.urgencyScore,
                    copy: "How soon the person seems to want to act or book."
                  },
                  {
                    label: "Commercial fit",
                    value: signal.analysis.commercialRelevanceScore,
                    copy: "How compatible the post is with paid coaching or lessons."
                  }
                ].map((metric) => (
                  <div key={metric.label} className="rounded-3xl bg-white/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-canvas/55">{metric.label}</p>
                    <p className="mt-2 text-2xl font-semibold">{Math.round(metric.value * 100)}%</p>
                    <p className="mt-2 text-xs leading-5 text-canvas/72">{metric.copy}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-canvas/55">Sentiment</p>
                <p className="mt-2 text-sm">{titleCase(signal.analysis.sentiment ?? "unknown")}</p>
              </div>

              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-canvas/55">Explanation</p>
                <p className="mt-2 text-sm leading-7 text-canvas/82">{signal.analysis.explanation}</p>
              </div>

              {linkedRecipeHref ? (
                <HoverPrefetchLink
                  href={linkedRecipeHref}
                  className="inline-flex rounded-full bg-highlight px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white"
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

      <section className="rounded-[2rem] border border-white/60 bg-white/92 p-6 shadow-soft backdrop-blur">
        <details>
          <summary className="cursor-pointer list-none text-sm font-semibold uppercase tracking-[0.18em] text-dusk/68">
            Raw payload
          </summary>
          <pre className="mt-4 overflow-x-auto rounded-3xl bg-stone-950 p-5 text-sm leading-6 text-stone-100">
            {JSON.stringify(signal.rawJson, null, 2)}
          </pre>
        </details>
      </section>
    </main>
  );
}