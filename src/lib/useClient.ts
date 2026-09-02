"use client";

import { useMemo, useSyncExternalStore } from "react";
import { COMPLETE_EVENT, completedCount, ctaShown } from "./session";

const noop = () => () => {};

/** true až po hydrataci na klientovi (na serveru false). */
export function useMounted(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false
  );
}

function subscribeUrl(cb: () => void) {
  window.addEventListener("hashchange", cb);
  window.addEventListener("popstate", cb);
  return () => {
    window.removeEventListener("hashchange", cb);
    window.removeEventListener("popstate", cb);
  };
}

/** Aktuální search + hash z adresy (stránky zůstávají statické, parametry čteme až v prohlížeči). */
export function useClientUrl(): { search: URLSearchParams; hash: URLSearchParams; mounted: boolean } {
  const raw = useSyncExternalStore(
    subscribeUrl,
    () => `${window.location.search}\n${window.location.hash}`,
    () => "\n"
  );
  const mounted = useMounted();
  return useMemo(() => {
    const [search, hash] = raw.split("\n");
    return {
      search: new URLSearchParams(search ?? ""),
      hash: new URLSearchParams((hash ?? "").replace(/^#/, "")),
      mounted,
    };
  }, [raw, mounted]);
}

function subscribeComplete(cb: () => void) {
  window.addEventListener(COMPLETE_EVENT, cb);
  return () => window.removeEventListener(COMPLETE_EVENT, cb);
}

/** true, když má být vidět CTA (dokončené momenty >= práh, nebo už bylo zobrazeno v této session). */
export function useCtaVisible(threshold: number): boolean {
  return useSyncExternalStore(
    subscribeComplete,
    () => ctaShown() || completedCount() >= threshold,
    () => false
  );
}
