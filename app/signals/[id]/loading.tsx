export default function SignalLoading() {
  return (
    <main className="space-y-8 animate-pulse">
      <div className="skeleton h-10 w-40 rounded-full" />
      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="skeleton h-[34rem] rounded-[2rem]" />
        <div className="skeleton h-[34rem] rounded-[2rem]" />
      </section>
      <div className="skeleton h-24 rounded-[2rem]" />
    </main>
  );
}
