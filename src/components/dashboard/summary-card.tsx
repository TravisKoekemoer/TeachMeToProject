type SummaryCardProps = {
  label: string;
  value: string;
  caption: string;
};

export function SummaryCard({ label, value, caption }: SummaryCardProps) {
  return (
    <article className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-soft backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-dusk/70">{label}</p>
      <p className="mt-3 font-display text-4xl text-ink">{value}</p>
      <p className="mt-2 text-sm text-ink/70">{caption}</p>
    </article>
  );
}

