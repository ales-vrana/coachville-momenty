"use client";

import { Children, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { track } from "@/lib/track";

export interface MomentListItem {
  id: string;
  cat: string; // priorProfessionCat hosta
  hasNumber: boolean;
  isAdmission: boolean;
}

const CAT_LABEL: Record<string, string> = {
  "manažer / vedoucí": "Manažer/ka",
  "HR a personalistika": "HR",
  "OSVČ a podnikání": "OSVČ",
  "školství": "Školství",
  "úřad a administrativa": "Úřad",
  "IT a technika": "IT",
  "zdravotnictví, péče a sociální služby": "Zdravotnictví a péče",
  "rodičovská, jiné": "Rodičovská, jiné",
};

function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

const INITIAL = 7;
const STEP = 10;

/**
 * Výpis momentů tématu: všechny karty jsou v HTML (server), na klientu se jen skrývají.
 * Načítání 7 → +10 → vše, rychlé filtry (předtím, s číslem, přiznání), počítadlo, uzávěrka s dalším tématem.
 */
export default function MomentList({
  items,
  children,
  afterFirst,
  nextTopic,
  totalLabel,
}: {
  items: MomentListItem[];
  children: ReactNode; // karty ve stejném pořadí jako items
  afterFirst?: ReactNode; // blok pod první kartou (Denominator)
  nextTopic?: { href: string; label: string } | null;
  totalLabel: string; // „76 momentů“
}) {
  const cards = Children.toArray(children);
  const [cat, setCat] = useState<string | null>(null);
  const [proof, setProof] = useState<"number" | "admission" | null>(null);
  const [shown, setShown] = useState(INITIAL);
  const focusRef = useRef<HTMLDivElement>(null);
  const [focusPos, setFocusPos] = useState<number | null>(null);

  const catOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of items) {
      if (!CAT_LABEL[it.cat]) continue;
      counts.set(it.cat, (counts.get(it.cat) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const visibleIdx = useMemo(
    () =>
      items
        .map((it, i) => ({ it, i }))
        .filter(({ it }) => (cat ? it.cat === cat : true))
        .filter(({ it }) => (proof === "number" ? it.hasNumber : proof === "admission" ? it.isAdmission : true))
        .map(({ i }) => i),
    [items, cat, proof]
  );

  const total = visibleIdx.length;
  const listed = visibleIdx.slice(0, shown);
  const remaining = total - listed.length;
  const filtered = cat !== null || proof !== null;

  function reset() {
    setShown(INITIAL);
    setFocusPos(null);
  }

  function loadMore() {
    const next = shown === INITIAL ? shown + STEP : total;
    setFocusPos(shown);
    setShown(next);
    track("moments_load_more", { shown: next, total });
  }

  useEffect(() => {
    if (focusPos === null) return;
    focusRef.current?.focus({ preventScroll: true });
  }, [focusPos, shown]);

  const hasCounts = items.filter((i) => i.hasNumber).length;
  const admCounts = items.filter((i) => i.isAdmission).length;

  return (
    <div className="space-y-4">
      {(catOptions.length > 1 || hasCounts > 0 || admCounts > 0) && (
        <div id="filtry" className="space-y-2 scroll-mt-20" role="group" aria-label="Rychlé filtry">
          {catOptions.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm">
              <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">Předtím</span>
              <FilterChip active={cat === null} onClick={() => { setCat(null); reset(); }}>
                Všichni
              </FilterChip>
              {catOptions.map(([c, n]) => (
                <FilterChip key={c} active={cat === c} onClick={() => { setCat(cat === c ? null : c); reset(); }}>
                  {CAT_LABEL[c]} <span className="opacity-60">{n}</span>
                </FilterChip>
              ))}
            </div>
          )}
          {(hasCounts > 0 || admCounts > 0) && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm">
              <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">Důkaz</span>
              {hasCounts > 0 && (
                <FilterChip active={proof === "number"} onClick={() => { setProof(proof === "number" ? null : "number"); reset(); }}>
                  S číslem <span className="opacity-60">{hasCounts}</span>
                </FilterChip>
              )}
              {admCounts > 0 && (
                <FilterChip active={proof === "admission"} onClick={() => { setProof(proof === "admission" ? null : "admission"); reset(); }}>
                  Přiznání <span className="opacity-60">{admCounts}</span>
                </FilterChip>
              )}
            </div>
          )}
        </div>
      )}

      {total === 0 ? (
        <p className="card p-5 text-sm text-muted">
          Této kombinaci neodpovídá žádný moment.{" "}
          <button onClick={() => { setCat(null); setProof(null); reset(); }} className="btn-link">
            Zrušit filtry
          </button>
        </p>
      ) : (
        <div className="space-y-4">
          {/* Všechny karty zůstávají v HTML (SEO), nezobrazené mají atribut hidden. */}
          {items.map((it, idx) => {
            const pos = listed.indexOf(idx);
            const visible = pos !== -1;
            return (
              <div key={it.id} className="space-y-4" hidden={!visible}>
                <div ref={visible && pos === focusPos ? focusRef : undefined} tabIndex={-1} className="outline-none">
                  {cards[idx]}
                </div>
                {visible && pos === 0 && !filtered && afterFirst}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-sm text-muted" aria-live="polite">
        Zobrazeno {listed.length} z {total} {plural(total, "momentu", "momentů", "momentů")}
        {filtered ? " (filtr)" : ""}.
        {shown > INITIAL && (
          <>
            {" "}
            <a href="#filtry" className="btn-link">
              Zpět k filtrům ↑
            </a>
          </>
        )}
      </p>

      {remaining > 0 ? (
        <button onClick={loadMore} className="btn-navy w-full sm:w-auto">
          {shown === INITIAL && remaining > STEP
            ? `Zobrazit dalších ${STEP}`
            : `Zobrazit ${remaining === 1 ? "poslední moment" : `všech ${remaining} zbývajících`}`}
        </button>
      ) : (
        total > 0 && (
          <div className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <p className="text-muted">
              {filtered ? "To jsou všechny momenty pro tento filtr." : `To je všech ${totalLabel} k této otázce.`}
            </p>
            {nextTopic && (
              <Link href={nextTopic.href} className="btn-link">
                Další téma: {nextTopic.label} <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        )
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${
        active ? "border-navy bg-navy text-white" : "border-line bg-white text-navy hover:border-teal hover:bg-teal-soft"
      }`}
    >
      {children}
    </button>
  );
}
