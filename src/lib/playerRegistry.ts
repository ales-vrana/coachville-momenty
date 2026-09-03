// V jednu chvíli hraje jen jeden moment (výpis tématu, hosta, další momenty).
// Modulový registr bez React kontextu: karty jsou samostatné client komponenty.
let active: { id: string; stop: () => void } | null = null;

export function claimPlayer(id: string, stop: () => void) {
  if (active && active.id !== id) active.stop();
  active = { id, stop };
}

export function releasePlayer(id: string) {
  if (active?.id === id) active = null;
}

let sdkPromise: Promise<typeof import("@vimeo/player")> | null = null;

/** Předběžné načtení Vimeo SDK (na hover/focus fasády), aby první klik startoval bez čekání. */
export function preloadVimeoSdk() {
  if (!sdkPromise) sdkPromise = import("@vimeo/player");
  return sdkPromise;
}
