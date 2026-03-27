import { cn } from "../../lib/utils";

type ConfidenceBadgeProps = {
  score: number | null | undefined;
};

export function ConfidenceBadge({ score }: ConfidenceBadgeProps) {
  const value = score ?? 0;
  const tone =
    value >= 0.75
      ? "bg-emerald-100 text-emerald-800"
      : value >= 0.5
        ? "bg-amber-100 text-amber-900"
        : "bg-stone-200 text-stone-700";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
        tone
      )}
    >
      {Math.round(value * 100)}% confidence
    </span>
  );
}

