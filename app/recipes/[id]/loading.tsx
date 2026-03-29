export default function RecipeLoading() {
  return (
    <main className="space-y-8 animate-pulse">
      <div className="skeleton h-10 w-40 rounded-full" />
      <section className="grid gap-6 lg:grid-cols-[0.96fr_1.04fr]">
        <div className="skeleton h-[36rem] rounded-[2rem]" />
        <div className="skeleton h-[36rem] rounded-[2rem]" />
      </section>
      <div className="skeleton h-[22rem] rounded-[2rem]" />
    </main>
  );
}
