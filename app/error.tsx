"use client";

import Link from "next/link";
import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-3xl space-y-6 py-16">
      <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">Internal dashboard error</p>
        <h1 className="mt-4 font-display text-5xl text-rose-950">TeachMeGTM hit a server-side problem.</h1>
        <p className="mt-4 text-base leading-7 text-rose-900/80">
          Try the page again. If this keeps happening, confirm the database is reachable and that the mock data has been seeded.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-800"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:border-rose-500"
          >
            Back to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
