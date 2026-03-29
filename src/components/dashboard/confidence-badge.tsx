import { cn } from "../../lib/utils";

type ConfidenceBadgeProps = {
  score: number | null | undefined;
  kind?: "intent" | "confidence";
  size?: "sm" | "md";
};

function getTier(score: number, kind: NonNullable<ConfidenceBadgeProps["kind"]>) {
  if (score >= 0.75) {
    return {
      label: kind === "confidence" ? "High confidence" : "High intent",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
      dot: "bg-emerald-500"
    };
  }

  if (score >= 0.5) {
    return {
      label: kind === "confidence" ? "Medium confidence" : "Medium intent",
      tone: "border-amber-200 bg-amber-50 text-amber-900",
      dot: "bg-amber-500"
    };
  }

  return {
    label: kind === "confidence" ? "Low confidence" : "Low intent",
    tone: "border-stone-200 bg-stone-100 text-stone-700",
    dot: "bg-stone-400"
  };
}

export function ConfidenceBadge({ score, kind = "intent", size = "md" }: ConfidenceBadgeProps) {
  const value = score ?? 0;
  const tier = getTier(value, kind);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 max-w-full items-center gap-2 rounded-full border font-semibold tracking-[0.02em]",
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
        tier.tone
      )}
    >
      <span className={cn("h-2 w-2 shrink-0 rounded-full", tier.dot)} />
      <span className="truncate">{tier.label}</span>
      <span className="shrink-0 opacity-70">{Math.round(value * 100)}%</span>
    </span>
  );
}
