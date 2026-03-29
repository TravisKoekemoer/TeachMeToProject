import { cn } from "../../lib/utils";

type SummaryCardProps = {
  label: string;
  value: string;
  caption: string;
  tone?: "neutral" | "sea" | "dusk" | "highlight";
};

function toneClasses(tone: NonNullable<SummaryCardProps["tone"]>) {
  switch (tone) {
    case "sea":
      return "border-sea/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(226,245,240,0.96)_100%)] text-sea";
    case "dusk":
      return "border-dusk/22 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(232,239,244,0.96)_100%)] text-dusk";
    case "highlight":
      return "border-highlight/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255,241,226,0.96)_100%)] text-amber-900";
    default:
      return "border-stone-300/80 bg-white/88 text-ink";
  }
}

export function SummaryCard({ label, value, caption, tone = "neutral" }: SummaryCardProps) {
  return (
    <article className={cn("rounded-3xl border p-5 shadow-soft backdrop-blur", toneClasses(tone))}>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-current/70">
        <span className="h-2 w-2 rounded-full bg-current/60" />
        <span>{label}</span>
      </div>
      <p className="mt-4 font-display text-4xl text-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-ink/68">{caption}</p>
    </article>
  );
}
