export default function DashboardLoading() {
  return (
    <main className="space-y-8 animate-pulse">
      <section className="grid gap-6 rounded-[2rem] border border-white/60 bg-white/55 p-6 lg:grid-cols-[1.55fr_0.95fr]">
        <div className="space-y-4">
          <div className="skeleton h-4 w-40 rounded-full" />
          <div className="skeleton h-14 w-4/5 rounded-3xl" />
          <div className="skeleton h-24 w-full rounded-[1.75rem]" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton h-36 rounded-3xl" />
            ))}
          </div>
        </div>
        <div className="skeleton rounded-[1.75rem] p-6" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="skeleton h-36 rounded-3xl" />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="skeleton h-72 rounded-3xl" />
        <div className="skeleton h-72 rounded-3xl" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="skeleton h-[42rem] rounded-[1.9rem]" />
        <div className="space-y-6">
          <div className="skeleton h-[24rem] rounded-[1.75rem]" />
          <div className="skeleton h-[20rem] rounded-[1.75rem]" />
        </div>
      </section>
    </main>
  );
}
