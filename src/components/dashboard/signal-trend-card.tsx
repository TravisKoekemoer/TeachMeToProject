import { format, subDays } from "date-fns";

import type { DashboardSignalListItem } from "../../lib/types";

function buildTrendPoints(signals: DashboardSignalListItem[]) {
  return Array.from({ length: 7 }).map((_, index) => {
    const date = subDays(new Date(), 6 - index);
    const label = format(date, "EEE");
    const count = signals.filter((signal) => format(signal.createdAt, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")).length;

    return {
      label,
      count
    };
  });
}

export function SignalTrendCard({ signals }: { signals: DashboardSignalListItem[] }) {
  const trend = buildTrendPoints(signals);
  const peak = Math.max(...trend.map((point) => point.count), 1);
  const highIntentCount = signals.filter((signal) => (signal.analysis?.leadIntentScore ?? 0) >= 0.75).length;
  const highIntentShare = signals.length ? Math.round((highIntentCount / signals.length) * 100) : 0;

  return (
    <article className="rounded-[1.75rem] border border-stone-300/80 bg-white/88 p-5 shadow-soft backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dusk/65">Signal trend</p>
          <h2 className="mt-2 font-display text-3xl text-ink">Last 7 days</h2>
        </div>
        <div className="rounded-full border border-sea/20 bg-sea/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-sea">
          {highIntentShare}% high intent
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 items-end gap-3">
        {trend.map((point) => (
          <div key={point.label} className="space-y-2 text-center">
            <div className="flex h-28 items-end justify-center rounded-2xl border border-stone-200/90 bg-stone-100/90 px-2 py-2">
              <div
                className="w-full rounded-xl bg-[linear-gradient(180deg,rgba(13,118,101,0.82)_0%,rgba(33,70,88,0.95)_100%)]"
                style={{ height: `${Math.max((point.count / peak) * 100, point.count > 0 ? 16 : 6)}%` }}
              />
            </div>
            <p className="text-lg font-semibold text-ink">{point.count}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-dusk/60">{point.label}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm leading-6 text-ink/66">
        A quick view of filtered signals in the current result set. Higher bars usually mean the dashboard has more raw demand to cluster and convert into recipes.
      </p>
    </article>
  );
}
