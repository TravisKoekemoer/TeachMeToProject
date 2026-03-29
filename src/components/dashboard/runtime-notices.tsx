import type { RuntimeNotice } from "../../lib/config";
import { cn } from "../../lib/utils";

type RuntimeNoticesProps = {
  notices: RuntimeNotice[];
};

function toneClasses(level: RuntimeNotice["level"]) {
  switch (level) {
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-900";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-900";
    default:
      return "border-sky-200 bg-sky-50 text-sky-900";
  }
}

export function RuntimeNotices({ notices }: RuntimeNoticesProps) {
  if (!notices.length) {
    return null;
  }

  return (
    <section className="grid gap-3">
      {notices.map((notice) => (
        <article
          key={`${notice.level}-${notice.title}`}
          className={cn("rounded-3xl border px-5 py-4 shadow-soft", toneClasses(notice.level))}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">{notice.level}</p>
          <h2 className="mt-2 font-display text-2xl">{notice.title}</h2>
          <p className="mt-2 text-sm leading-6 opacity-85">{notice.message}</p>
        </article>
      ))}
    </section>
  );
}
