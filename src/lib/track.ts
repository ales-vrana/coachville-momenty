// Minimální analytika: bez NEXT_PUBLIC_GA_ID se nic neposílá.
type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function track(event: string, params: Params = {}) {
  if (typeof window === "undefined") return;
  if (window.gtag) window.gtag("event", event, params);
  else if (process.env.NODE_ENV !== "production") console.debug("[track]", event, params);
}
