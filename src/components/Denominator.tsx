import { site, type Denominator as DenominatorT } from "@/lib/data";

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
  const c = site.community;
  const lead =
    typeof topicMoments === "number"
      ? `${topicMoments} ${plural(topicMoments, "moment", "momenty", "momentů")} od ${topicGuests} ${plural(
          topicGuests ?? 0,
          "člověka",
          "lidí",
          "lidí"
        )} z ${d.hosts} ${plural(d.hosts, "hosta", "hostů", "hostů")}.`
      : `${d.hosts} ${plural(d.hosts, "host", "hosté", "hostů")}, ${d.moments} ${plural(
          d.moments,
          "moment",
          "momenty",
          "momentů"
        )}, ${d.episodes} ${plural(d.episodes, "rozhovor", "rozhovory", "rozhovorů")}.`;
  return (
    <p className={`${compact ? "text-sm" : "text-[15px]"} leading-relaxed text-muted`}>
      <span className="font-medium text-ink">{lead}</span> {c.sentence}{" "}
      {!compact && (
        <>
          Písemné důkazy: {c.writtenProofs.toLocaleString("cs-CZ")} záznamů od {c.coachesTotal} koučů, z toho{" "}
          {c.hardBusinessProofs} tvrdých obchodních.
        </>
      )}
    </p>
  );
}

export function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}
