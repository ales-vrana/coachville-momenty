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
    try {
      if (window.self !== window.top) document.documentElement.classList.add("embed");
    } catch {
      // přístup k window.top může u cizí domény vyhodit chybu = jsme v iframe
      document.documentElement.classList.add("embed");
    }
  }, []);
  return null;
}
