export default function DashboardLoading() {
  return (
    <main className="space-y-8 animate-pulse">
      <section className="grid gap-6 rounded-[2rem] border border-white/60 bg-white/55 p-6 lg:grid-cols-[1.6fr_0.9fr]">
        <div className="space-y-4">
          <div className="h-4 w-40 rounded-full bg-stone-200" />
          <div className="h-12 w-2/3 rounded-2xl bg-stone-200" />
          <div className="h-20 w-full rounded-3xl bg-stone-100" />
        </div>
        <div className="rounded-[1.75rem] bg-stone-200/70 p-6">
          <div className="h-10 w-40 rounded-2xl bg-stone-300" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-32 rounded-3xl bg-white/75" />
        ))}
      </section>

      <div className="h-24 rounded-3xl bg-white/75" />
      <div className="h-[28rem] rounded-3xl bg-white/75" />
    </main>
  );
}

