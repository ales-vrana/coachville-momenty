import type { Denominator as DenominatorT } from "@/lib/data";

/**
 * Blok „Co za tím je“: tři dlaždice (hosté, rozhovory, momenty).
 * Statistika komunity (300 ze 417 koučů, „Kolik se tím živí, nevíme“) byla 18. 9. 2026 na přání Aleše odstraněna
 * z celého webu; data zůstávají v site.json.community pro případné budoucí použití.
 * compact = jeden řádek pod první kartou tématu (počet momentů a lidí v tématu).
 */
export default function Denominator({
  d,
  topicMoments,
  topicGuests,
  compact = false,
}: {
  d: DenominatorT;
  topicMoments?: number;
  topicGuests?: number;
  compact?: boolean;
}) {
  if (compact) {
    if (typeof topicMoments !== "number") return null;
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-3 text-sm text-ink">
        <span className="font-semibold text-navy">
          {topicMoments} {plural(topicMoments, "moment", "momenty", "momentů")} · {topicGuests}{" "}
          {plural(topicGuests ?? 0, "člověk", "lidé", "lidí")}
        </span>
        <span className="text-muted">
          z {d.hosts} {plural(d.hosts, "hosta", "hostů", "hostů")} a {d.moments} {plural(d.moments, "momentu", "momentů", "momentů")} na
          celém webu
        </span>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow">Zdroj</p>
      <h2 className="mt-1 text-2xl">Co za tím je</h2>
      <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
        <Tile n={d.hosts} label={plural(d.hosts, "host", "hosté", "hostů")} />
        <Tile n={d.episodes} label={plural(d.episodes, "rozhovor", "rozhovory", "rozhovorů")} />
        <Tile n={d.moments} label={plural(d.moments, "moment", "momenty", "momentů")} />
      </div>
      <p className="mt-4 text-sm text-ink">
        Každý moment je nesestříhaný úsek celého rozhovoru. Host ho viděl a schválil, video jede od stejné vteřiny, na kterou
        odkazuje přepis.
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

export function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}
