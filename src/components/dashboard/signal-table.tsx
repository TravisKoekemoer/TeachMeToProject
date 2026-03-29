import { format } from "date-fns";
import type { ReactNode } from "react";

import type { DashboardSignalListItem } from "../../lib/types";
import { cn, titleCase } from "../../lib/utils";

import { ConfidenceBadge } from "./confidence-badge";
import { HoverPrefetchLink } from "./hover-prefetch-link";

type SignalTableProps = {
  signals: DashboardSignalListItem[];
};

function statusClasses(status: string) {
  switch (status) {
    case "RELEVANT":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "POSSIBLE":
      return "bg-amber-50 text-amber-900 ring-amber-200";
    case "FILTERED_OUT":
      return "bg-stone-100 text-stone-600 ring-stone-300";
    default:
      return "bg-rose-50 text-rose-800 ring-rose-200";
  }
}

function formatSignalDate(date: Date) {
  return format(date, "MMM d, yyyy / EEE / h:mm a");
}

function MetaCard({
  label,
  children,
  className
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[1.35rem] border border-stone-200 bg-white/92 p-4", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dusk/62">{label}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function SignalTable({ signals }: SignalTableProps) {
  return (
    <div className="flex h-full min-h-[38rem] flex-col overflow-hidden rounded-[1.9rem] border border-stone-300 bg-white/96 shadow-soft backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-300 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dusk/65">Raw signals</p>
          <h2 className="mt-2 font-display text-3xl text-ink">Filtered signal queue</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/66">
            All matching rows stay ranked from the strongest lead score to the weakest so the best opportunities stay near the top.
          </p>
        </div>
        <div className="rounded-full border border-stone-300 bg-stone-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-dusk/72">
          {signals.length} rows
        </div>
      </div>

      {!signals.length ? (
        <div className="flex flex-1 items-center justify-center bg-[linear-gradient(180deg,rgba(252,250,245,0.98)_0%,rgba(241,237,229,0.94)_100%)] px-8 text-center">
          <div className="max-w-md space-y-3">
            <h3 className="font-display text-3xl text-ink">No signals match these filters</h3>
            <p className="text-sm leading-6 text-ink/68">
              Try widening the sport, status, score, or date filters. If you have not seeded the project yet, run the seed script to load the mock X data.
            </p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto bg-[linear-gradient(180deg,rgba(251,249,244,0.99)_0%,rgba(239,233,223,0.96)_100%)] px-6 py-4">
          <div className="space-y-4">
            {signals.map((signal, index) => {
              const formattedDate = formatSignalDate(signal.createdAt);

              return (
                <article
                  key={signal.id}
                  className={cn(
                    "rounded-[1.7rem] border border-stone-200 bg-white/84 p-5 shadow-[0_8px_24px_rgba(16,35,28,0.04)] transition",
                    index % 2 === 0 ? "bg-white/88" : "bg-stone-50/88",
                    "hover:border-stone-300 hover:bg-white"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-stone-300/80 bg-dusk/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-dusk/75">
                          @{signal.authorHandle}
                        </span>
                        {signal.analysis?.sport ? (
                          <span className="rounded-full border border-sea/20 bg-sea/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-sea">
                            {titleCase(signal.analysis.sport)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="shrink-0 rounded-[1.2rem] border border-stone-200 bg-stone-50/95 px-4 py-3 text-right sm:min-w-[21rem]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dusk/62">Date</p>
                      <p className="mt-2 whitespace-nowrap text-sm font-semibold tabular-nums text-ink/82">{formattedDate}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,0.92fr)_minmax(0,0.95fr)_minmax(0,1.05fr)]">
                    <MetaCard label="Signal" className="min-w-0">
                      <p className="break-words text-sm leading-7 text-ink/80">{signal.postText}</p>
                      <div className="mt-4">
                        <HoverPrefetchLink
                          href={`/signals/${signal.id}`}
                          className="inline-flex rounded-full border border-sea/25 bg-sea/5 px-3 py-2 text-sm font-semibold text-sea transition hover:border-sea hover:bg-sea hover:text-white"
                        >
                          View signal
                        </HoverPrefetchLink>
                      </div>
                    </MetaCard>

                    <MetaCard label="Intent">
                      {signal.analysis ? (
                        <div className="space-y-3">
                          <ConfidenceBadge score={signal.analysis.leadIntentScore} kind="intent" size="sm" />
                          <span
                            className={cn(
                              "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ring-1 ring-inset",
                              statusClasses(signal.analysis.relevanceStatus)
                            )}
                          >
                            {signal.analysis.relevanceStatus.replaceAll("_", " ")}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-ink/60">Not processed yet</p>
                      )}
                    </MetaCard>

                    <MetaCard label="Rule">
                      <p className="break-words text-sm font-semibold leading-7 text-ink/78">{signal.matchedRule ?? "No match"}</p>
                    </MetaCard>

                    <MetaCard label="Cluster">
                      <p className="break-words text-sm font-semibold leading-7 text-ink/78">{signal.analysis?.cluster?.name ?? "Unclustered"}</p>
                    </MetaCard>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}