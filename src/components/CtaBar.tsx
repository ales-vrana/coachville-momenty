"use client";

import { useEffect, useState } from "react";
import { setCtaShown } from "@/lib/session";
import { track } from "@/lib/track";
import { useClientUrl, useCtaVisible } from "@/lib/useClient";

interface Props {
  workshop: { date: string; time?: string; price: number; url: string; label?: string } | null;
  threshold?: number;
}

function formatCz(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const days = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"];
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${days[dt.getUTCDay()]} ${d}. ${m}.`;
}

export default function CtaBar({ workshop, threshold = 2 }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const visible = useCtaVisible(threshold);
  const { search } = useClientUrl();
  // Odkaz pro partnera (?ref=partner) nikdy neukazuje nabídku workshopu (F20 zadání).
  const partner = search.get("ref") === "partner";

  useEffect(() => {
    if (visible) setCtaShown();
  }, [visible]);

  if (!workshop || !visible || dismissed || partner) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">Zjistit na workshopu, jestli je to pro mě</p>
          <p className="text-xs text-muted">
            {formatCz(workshop.date)}
            {workshop.time ? ` ${workshop.time}` : ""}, {workshop.price} Kč, 2 h online. Odejdete s odpovědí, i kdyby zněla „ne“.
          </p>
        </div>
        <a
          href={workshop.url}
          onClick={() => track("cta_click", { cta: "workshop" })}
          className="shrink-0 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-deep"
        >
          Rezervovat
        </a>
        <button onClick={() => setDismissed(true)} aria-label="Zavřít" className="shrink-0 rounded-full p-2 text-muted hover:bg-paper-2">
          ×
        </button>
      </div>
    </div>
  );
}
