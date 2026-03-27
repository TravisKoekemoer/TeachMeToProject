import Link from "next/link";

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
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "All dates", value: "all" }
];

type FiltersBarProps = {
  filters: DashboardFilters;
};

export function FiltersBar({ filters }: FiltersBarProps) {
  return (
    <form
      action="/"
      method="get"
      className="grid gap-4 rounded-3xl border border-white/60 bg-white/85 p-5 shadow-soft backdrop-blur lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]"
    >
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-dusk/70">Sport</span>
        <select
          defaultValue={filters.sport}
          name="sport"
          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
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
          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
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
          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
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
          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
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
        <Link
          href="/"
          prefetch={false}
          className="rounded-2xl border border-stone-200 px-4 py-3 text-sm font-semibold text-ink/80 transition hover:border-sea hover:text-sea"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
