"use client";

/**
 * Viditelné tlačítko pro zvuk přímo přes video (Vimeo na úzkém přehrávači schovává hlasitost do menu).
 * mode "muted": video hraje bez zvuku → velké tlačítko „Zapnout zvuk“.
 * mode "tap": Safari při zapnutí zvuku video zastavil → nápověda klepnout na ▶ ve videu (klepnutí jde skrz do iframu).
 */
export default function SoundButton({ mode, onUnmute }: { mode: "muted" | "tap"; onUnmute: () => void }) {
  if (mode === "tap") {
    return (
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center p-2">
        <span className="rounded-full bg-navy/90 px-3 py-1.5 text-xs font-bold text-white shadow-lg sm:text-sm">
          Zvuk je zapnutý. Klepněte na ▶ ve videu.
        </span>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onUnmute}
      className="absolute left-2 top-2 z-20 inline-flex items-center gap-2 rounded-full bg-teal px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-lg ring-2 ring-white/80 hover:bg-teal-deep sm:left-3 sm:top-3 sm:text-sm"
      aria-label="Zapnout zvuk"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3 9v6h4l5 5V4L7 9H3z" />
        <path d="M16.5 8.5l5 7M21.5 8.5l-5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
      Zapnout zvuk
    </button>
  );
}
