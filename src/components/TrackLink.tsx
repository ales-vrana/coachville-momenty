"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { track } from "@/lib/track";

/** Odkaz s GA událostí při kliknutí (serverové stránky nemají onClick). Externí URL (http…) se otevírá v novém tabu. */
export default function TrackLink({
  href,
  event,
  params,
  className,
  children,
  "aria-label": ariaLabel,
}: {
  href: string;
  event: string;
  params?: Record<string, string | number | boolean>;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  const external = /^https?:\/\//.test(href);
  if (external) {
    return (
      <a href={href} className={className} aria-label={ariaLabel} target="_blank" rel="noopener" onClick={() => track(event, params)}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} aria-label={ariaLabel} onClick={() => track(event, params)}>
      {children}
    </Link>
  );
}
