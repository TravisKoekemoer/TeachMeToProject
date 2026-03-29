import type { DashboardFilters } from "../../lib/db/dashboard";

const sports = [
  { label: "All sports", value: "all" },
  { label: "Tennis", value: "tennis" },
  { label: "Golf", value: "golf" },
  { label: "Pickleball", value: "pickleball" }
];

const statuses = [
  { label: "All statuses", value: "all" },
  { label: "Relevant", value: "RELEVANT" },
  { label: "Possible", value: "POSSIBLE" },
  { label: "Irrelevant", value: "IRRELEVANT" },
  { label: "Filtered out", value: "FILTERED_OUT" }
];

const scoreBands = [
  { label: "Any score", value: "all" },
  { label: "High", value: "high" },
  { label: "Medium+", value: "medium" },
  { label: "Low+", value: "low" }
];

const windows = [
  { label: "All dates", value: "all" },
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" }
];

type FiltersBarProps = {
  filters: DashboardFilters;
  resultCount: number;
};

function activeFilterCount(filters: DashboardFilters) {
  return [filters.sport, filters.status, filters.score, filters.days].filter((value, index) => {
    const defaults: Array<DashboardFilters[keyof DashboardFilters]> = ["all", "all", "all", "all"];
    return value !== defaults[index];
  }).length;
}

export function FiltersBar({ filters, resultCount }: FiltersBarProps) {
  const activeCount = activeFilterCount(filters);

  return (
    <form action="/" method="get" className="overflow-hidden rounded-[1.9rem] border border-stone-300/80 bg-white/92 shadow-soft backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-300/90 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dusk/65">Filter panel</p>
          <h2 className="mt-2 font-display text-3xl text-ink">Refine the signal set</h2>
          <p className="mt-2 text-sm leading-6 text-ink/66">
            Narrow the dashboard to the signals and audience themes that matter right now.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
          <span className="rounded-full bg-ink px-3 py-2 text-canvas">{resultCount} signals shown</span>
          <span className="rounded-full border border-stone-300 bg-stone-100 px-3 py-2 text-dusk/75">{activeCount} active filters</span>
        </div>
      </div>

      <div className="grid gap-4 bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(244,242,237,0.95)_100%)] p-6 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-dusk/70">Sport</span>
          <select
            defaultValue={filters.sport}
            name="sport"
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
          >
            {sports.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-dusk/70">Status</span>
          <select
            defaultValue={filters.status}
            name="status"
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
          >
            {statuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-dusk/70">Lead score</span>
          <select
            defaultValue={filters.score}
            name="score"
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
          >
            {scoreBands.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-dusk/70">Date window</span>
          <select
            defaultValue={filters.days}
            name="days"
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
          >
            {windows.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-3">
          <button
            type="submit"
            className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-canvas transition hover:bg-dusk lg:w-auto"
          >
            Apply filters
          </button>
          <a
            href="/?sport=all&status=all&score=all&days=all"
            className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-ink/80 transition hover:border-sea hover:text-sea"
          >
            Reset
          </a>
        </div>
      </div>
    </form>
  );
}
