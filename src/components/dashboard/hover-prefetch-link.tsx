"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentPropsWithoutRef } from "react";

type HoverPrefetchLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & {
  href: string;
};

export function HoverPrefetchLink({ href, onMouseEnter, onFocus, onTouchStart, prefetch = false, ...props }: HoverPrefetchLinkProps) {
  const router = useRouter();

  const warmRoute = () => {
    router.prefetch(href);
  };

  return (
    <Link
      {...props}
      href={href}
      prefetch={prefetch}
      onMouseEnter={(event) => {
        warmRoute();
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        warmRoute();
        onFocus?.(event);
      }}
      onTouchStart={(event) => {
        warmRoute();
        onTouchStart?.(event);
      }}
    />
  );
}
