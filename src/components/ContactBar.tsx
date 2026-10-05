import TrackLink from "@/components/TrackLink";
import { site } from "@/lib/data";

/**
 * Kontaktní lišta „Chcete to probrat telefonicky?“ (4. 10. 2026 na přání Aleše).
 * Je součástí přilepené hlavičky v layout.tsx, takže je vidět na každé stránce i při scrollování.
 * Mobil: jen nadpis a malé tlačítko (jeden řádek, ~44 px). Desktop: nadpis, krátký text a tlačítko v jednom řádku.
 */
export default function ContactBar() {
  const c = site.contactCta;
  return (
    <div className="bg-navy text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-1 sm:gap-6 sm:py-2.5">
        <div className="min-w-0">
          <p className="text-[12px] font-bold uppercase leading-tight tracking-wide text-white sm:text-base">{c.heading}</p>
          <p className="hidden text-sm leading-snug text-white/85 lg:block">{c.text}</p>
        </div>
        <TrackLink
          href={c.url}
          event="cta_click"
          params={{ target: "call", placement: "top_bar" }}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-teal px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white no-underline shadow-sm transition hover:bg-teal-deep sm:px-5 sm:py-2.5 sm:text-sm"
          aria-label={c.button}
        >
          <span className="sm:hidden">{c.buttonShort ?? c.button} ↗</span>
          <span className="hidden sm:inline">{c.button} ↗</span>
        </TrackLink>
      </div>
    </div>
  );
}
