import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 py-16">
      <section className="rounded-[2rem] border border-white/60 bg-white/90 p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-dusk/65">Not found</p>
        <h1 className="mt-4 font-display text-5xl text-ink">That signal or recipe is not available.</h1>
        <p className="mt-4 text-base leading-7 text-ink/72">
          The record may have been removed during a fresh seed run, or the URL may be stale. Return to the dashboard and reopen it from the current list.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full border border-sea/25 bg-sea/5 px-4 py-2 text-sm font-semibold text-sea transition hover:border-sea hover:bg-sea hover:text-white"
        >
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
