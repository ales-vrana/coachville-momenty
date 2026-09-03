import { site, type Denominator as DenominatorT } from "@/lib/data";

/**
 * Blok „Co za tím je“: tři dlaždice (hosté, rozhovory, momenty) a proporční pruh 300 / 117 ze 417 koučů.
 * Poctivost: „117 zatím ne“ i „Kolik se tím živí, nevíme“ zůstávají stejně velké jako zbytek.
 * compact = jeden řádek pod první kartou tématu.
 */
export default function Denominator({
  d,
  topicMoments,
  topicGuests,
  compact = false,
  tiles = true,
  unknownLine = true,
}: {
  d: DenominatorT;
  topicMoments?: number;
  topicGuests?: number;
  compact?: boolean;
  tiles?: boolean; // dlaždice hosté / rozhovory / momenty
  unknownLine?: boolean; // věta „Kolik se tím živí, nevíme.“
}) {
  const c = site.community;
  const strongPct = Math.round((c.coachesWithStrongProof / c.coachesTotal) * 100);
  const nonePct = 100 - strongPct;

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-3 text-sm text-ink">
        {typeof topicMoments === "number" && (
          <span className="font-semibold text-navy">
            {topicMoments} {plural(topicMoments, "moment", "momenty", "momentů")} · {topicGuests}{" "}
            {plural(topicGuests ?? 0, "člověk", "lidé", "lidí")}
          </span>
        )}
        <Bar strongPct={strongPct} nonePct={nonePct} className="h-1.5 w-24" />
        <span className="text-muted">
          {c.coachesWithStrongProof} z {c.coachesTotal} koučů v komunitě popsalo silný důkaz, {c.coachesWithoutStrongProof} zatím ne. Kolik
          se tím živí, nevíme.
        </span>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow">Zdroj</p>
      <h2 className="mt-1 text-2xl">Co za tím je</h2>
      {tiles && (
        <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
          <Tile n={d.hosts} label={plural(d.hosts, "host", "hosté", "hostů")} />
          <Tile n={d.episodes} label={plural(d.episodes, "rozhovor", "rozhovory", "rozhovorů")} />
          <Tile n={d.moments} label={plural(d.moments, "moment", "momenty", "momentů")} />
        </div>
      )}
      <div className={tiles ? "mt-8" : "mt-5"}>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-navy">{c.coachesTotal} koučů v komunitě</p>
          <p className="text-xs text-muted">stav k září 2026</p>
        </div>
        <Bar strongPct={strongPct} nonePct={nonePct} className="mt-2 h-3 w-full" />
        <div className="mt-2 grid gap-2 text-sm text-ink sm:grid-cols-2">
          <p className="flex items-start gap-2">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-teal" aria-hidden="true" />
            <span>
              <strong className="text-navy">{c.coachesWithStrongProof}</strong> popsalo aspoň jeden silný důkaz (platba, získaný klient,
              domluvená ukázka)
            </span>
          </p>
          <p className="flex items-start gap-2 sm:justify-end">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#cfcbc2]" aria-hidden="true" />
            <span>
              <strong className="text-navy">{c.coachesWithoutStrongProof}</strong> zatím ne
            </span>
          </p>
        </div>
      </div>
      <p className="mt-4 border-t border-line pt-3 text-sm text-ink">
        {unknownLine ? "Kolik se tím živí, nevíme. " : ""}Písemné důkazy: {c.writtenProofs.toLocaleString("cs-CZ")} záznamů, z toho {c.hardBusinessProofs}{" "}
        tvrdých obchodních.
      </p>
    </div>
  );
}

function Tile({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-xl bg-paper p-4 sm:p-5">
      <p className="text-3xl font-semibold tabular-nums text-navy sm:text-4xl">{n}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

function Bar({ strongPct, nonePct, className }: { strongPct: number; nonePct: number; className: string }) {
  return (
    <div
      className={`flex shrink-0 overflow-hidden rounded-full bg-white ${className}`}
      role="img"
      aria-label={`${strongPct} % koučů popsalo silný důkaz, ${nonePct} % zatím ne`}
    >
      <span className="h-full bg-teal" style={{ width: `${strongPct}%` }} />
      <span className="h-full w-0.5 bg-white" aria-hidden="true" />
      <span className="h-full flex-1 bg-[#cfcbc2]" />
    </div>
  );
}

export function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}
