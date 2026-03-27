import { format } from "date-fns";

import { HoverPrefetchLink } from "./hover-prefetch-link";
import { ConfidenceBadge } from "./confidence-badge";

type SignalTableProps = {
  signals: Array<{
    id: string;
    authorHandle: string;
    postText: string;
    createdAt: Date;
    matchedRule: string | null;
    analysis: {
      id: string;
      sport: string | null;
      relevanceStatus: string;
      leadIntentScore: number;
      cluster: {
        name: string;
      } | null;
    } | null;
  }>;
};

function statusTone(status: string) {
  switch (status) {
    case "RELEVANT":
      return "text-emerald-700";
    case "POSSIBLE":
      return "text-amber-700";
    case "FILTERED_OUT":
      return "text-stone-500";
    default:
      return "text-rose-700";
  }
}

export function SignalTable({ signals }: SignalTableProps) {
  return (
    <div className="flex h-full min-h-[34rem] flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
        <div>
          <h2 className="font-display text-2xl text-ink">Raw signals</h2>
          <p className="text-sm text-ink/65">{signals.length} filtered signals, ranked from highest lead score to lowest.</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,242,237,0.94)_100%)] [scrollbar-gutter:stable]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-stone-100/95 text-xs uppercase tracking-[0.18em] text-dusk/70 backdrop-blur">
            <tr>
              <th className="sticky top-0 z-10 bg-stone-100/95 px-6 py-3 font-semibold">Signal</th>
              <th className="sticky top-0 z-10 bg-stone-100/95 px-6 py-3 font-semibold">Matched rule</th>
              <th className="sticky top-0 z-10 bg-stone-100/95 px-6 py-3 font-semibold">Analysis</th>
              <th className="sticky top-0 z-10 bg-stone-100/95 px-6 py-3 font-semibold">Cluster</th>
              <th className="sticky top-0 z-10 bg-stone-100/95 px-6 py-3 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="bg-transparent">
            {signals.map((signal) => (
              <tr key={signal.id} className="border-t border-stone-100 align-top transition hover:bg-stone-50/80">
                <td className="px-6 py-4">
                  <p className="font-semibold text-ink">@{signal.authorHandle}</p>
                  <p className="mt-1 max-w-xl text-sm text-ink/72">{signal.postText}</p>
                  <HoverPrefetchLink
                    href={`/signals/${signal.id}`}
                    className="mt-3 inline-flex rounded-full border border-sea/25 bg-sea/5 px-3 py-2 text-sm font-semibold text-sea transition hover:border-sea hover:bg-sea hover:text-white"
                  >
                    View signal
                  </HoverPrefetchLink>
                </td>
                <td className="px-6 py-4 text-ink/72">{signal.matchedRule ?? "No match"}</td>
                <td className="px-6 py-4">
                  {signal.analysis ? (
                    <div className="space-y-2">
                      <p className="font-semibold capitalize text-ink">{signal.analysis.sport ?? "unknown"}</p>
                      <p className={statusTone(signal.analysis.relevanceStatus)}>{signal.analysis.relevanceStatus}</p>
                      <ConfidenceBadge score={signal.analysis.leadIntentScore} />
                    </div>
                  ) : (
                    <p className="text-ink/60">Not processed yet</p>
                  )}
                </td>
                <td className="px-6 py-4 text-ink/72">{signal.analysis?.cluster?.name ?? "Unclustered"}</td>
                <td className="px-6 py-4 text-ink/72">{format(signal.createdAt, "MMM d, yyyy")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
