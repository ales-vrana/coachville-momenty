// Stav dokončených momentů v sessionStorage (F8 zadání): CTA se ukáže po dvou dokončených momentech.
const KEY = "momenty_completed";
const SHOWN = "momenty_cta_shown";

export const COMPLETE_EVENT = "momenty:complete";

export function markCompleted(id: string, how: "video" | "read") {
  try {
    const set = new Set<string>(JSON.parse(sessionStorage.getItem(KEY) ?? "[]"));
    const isNew = !set.has(id);
    set.add(id);
    sessionStorage.setItem(KEY, JSON.stringify([...set]));
    window.dispatchEvent(new CustomEvent(COMPLETE_EVENT, { detail: { id, how, count: set.size, isNew } }));
    return set.size;
  } catch {
    return 0;
  }
}

export function completedCount(): number {
  try {
    return (JSON.parse(sessionStorage.getItem(KEY) ?? "[]") as string[]).length;
  } catch {
    return 0;
  }
}

export function ctaShown(): boolean {
  try {
    return sessionStorage.getItem(SHOWN) === "1";
  } catch {
    return false;
  }
}

export function setCtaShown() {
  try {
    sessionStorage.setItem(SHOWN, "1");
  } catch {
    /* ignore */
  }
}
