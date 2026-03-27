"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

type HoverPrefetchLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
};

export function HoverPrefetchLink({ href, onMouseEnter, onFocus, ...props }: HoverPrefetchLinkProps) {
  const router = useRouter();

  function prefetchRoute() {
    router.prefetch(href);
  }

  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={(event) => {
        prefetchRoute();
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        prefetchRoute();
        onFocus?.(event);
      }}
      {...props}
    />
  );
}
