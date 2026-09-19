"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { track } from "@/lib/track";

/** Odkaz s GA událostí při kliknutí (karta momentu je serverová komponenta, proto samostatná client komponenta). */
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
  return (
    <Link href={href} className={className} aria-label={ariaLabel} onClick={() => track(event, params)}>
      {children}
    </Link>
  );
}
