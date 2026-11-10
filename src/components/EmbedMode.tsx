"use client";

import { useEffect } from "react";

/**
 * Režim „vloženo do jiné stránky“ (např. lekce 7.1 přípravného kurzu na start.coachville.eu).
 * Když web běží uvnitř <iframe>, přidá na <html> třídu `embed`; CSS v globals.css pak schová
 * hlavičku, kontaktní lištu, patičku a spodní CTA lištu, takže vložený obsah začíná od „Momenty ze studia“.
 * Pro běžné návštěvníky (mimo iframe) se nic nemění.
 */
export default function EmbedMode() {
  useEffect(() => {
    let embedded = false;
    try {
      embedded = window.self !== window.top;
    } catch {
      // přístup k window.top může u cizí domény vyhodit chybu = jsme v iframe
      embedded = true;
    }
    if (!embedded) return;
    document.documentElement.classList.add("embed");
    // Téma vložené jako samostatná lekce kurzu (?lekce=1): nadpis a drobečkovou navigaci už ukazuje kurz, tady je schováme.
    if (new URLSearchParams(window.location.search).get("lekce") === "1") document.documentElement.classList.add("embed-lesson");
  }, []);
  return null;
}
