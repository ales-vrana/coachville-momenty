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

/** Společné volby Vimeo přehrávače. start/end v sekundách: přehrávač začne na start_time a zastaví na end_time
 *  už při načtení iframu, takže se nečeká na setCurrentTime (v Safari to blokovalo přehrávání i desítky sekund). */
export function vimeoOptions(
  vimeoId: string,
  vimeoHash: string | undefined,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    responsive: true,
    byline: false,
    portrait: false,
    title: false,
    dnt: true,
    playsinline: true,
    pip: false,
    ...extra,
  };
  return vimeoHash ? { ...base, url: `https://vimeo.com/${vimeoId}/${vimeoHash}` } : { ...base, id: Number(vimeoId) };
}

/** Čekání s limitem: když se přehrávač neozve, iframe se přesto ukáže a uživatel vidí jeho vlastní ovládání. */
export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([p, new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms))]);
}

/** Bezpečnostní pojistka: pokud přehrávač start_time nerespektoval, přeskočí na start až po rozjetí videa. */
export function ensureStart(p: { getCurrentTime(): Promise<number>; setCurrentTime(t: number): Promise<number> }, start: number) {
  p.getCurrentTime()
    .then((t) => {
      if (Math.abs(t - start) > 2) return p.setCurrentTime(start);
    })
    .catch(() => undefined);
}
