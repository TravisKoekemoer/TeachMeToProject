export default function SignalLoading() {
  return (
    <main className="space-y-6 animate-pulse">
      <div className="h-5 w-32 rounded-full bg-stone-200" />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="h-[28rem] rounded-[2rem] bg-white/80" />
        <div className="h-[28rem] rounded-[2rem] bg-stone-300/70" />
      </div>
      <div className="h-72 rounded-[2rem] bg-white/80" />
    </main>
  );
}

