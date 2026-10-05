"use client";

import { useSyncExternalStore } from "react";
import { prefersDirectTap } from "@/lib/playerRegistry";

const noop = () => () => undefined;

/** true na iPhonu/iPadu a v Safari (viz prefersDirectTap); na serveru false, bez setState v efektu. */
export function useDirectTap(): boolean {
  return useSyncExternalStore(noop, prefersDirectTap, () => false);
}
