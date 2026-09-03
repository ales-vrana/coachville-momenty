import Link from "next/link";
import InlineMomentPlayer from "./InlineMomentPlayer";
import { formatDuration, formatTime, phaseLabel, whereLabel } from "@/lib/data";
import type { MomentView } from "@/lib/types";
import { episodeUrl, guestUrl, momentUrl } from "@/lib/urls";

/**
 * Karta momentu ve výpisu: video první (jeden klik = přehrání přímo v kartě), text vedle nebo pod ním.
 * layout "row": video vlevo (stránka tématu, jeden sloupec). layout "stack": video nahoře (dvousloupcové mřížky).
 */
export default function MomentCard({
  m,
  refParam,
  showTopic = false,
  index,
  layout = "stack",
}: {
  m: MomentView;
  refParam?: string;
  showTopic?: boolean;
  index?: number;
  layout?: "row" | "stack";
}) {
  const g = m.guestData;
  const ep = m.episodeData;
  const where = whereLabel(g);
  const phase = phaseLabel(g);
  const first = typeof index === "number" && index === 0;
  const row = layout === "row";
  const href = momentUrl(m.id, refParam);

  return (
    <article className={`card overflow-hidden ${row ? "sm:grid sm:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]" : ""}`}>
      <div className={row ? "bg-navy-deep" : ""}>
        <InlineMomentPlayer
          momentId={m.id}
          vimeoId={ep.vimeoId}
          vimeoHash={ep.vimeoHash || undefined}
          thumbnailUrl={ep.thumbnailUrl}
          guestName={g.displayName}
          durationLabel={formatDuration(m.durationS)}
          startLabel={formatTime(m.start)}
          start={m.start}
          end={m.end}
          momentHref={href}
          fullHref={episodeUrl(ep.slug, m.start)}
          badge={first ? "Začněte tady" : undefined}
          emphasis={first}
        />
      </div>
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <p className={`font-semibold leading-snug text-ink ${first && row ? "text-lg" : "text-[16px]"}`}>{m.summary}</p>
        <p className="text-sm text-muted">
          <Link href={guestUrl(g.slug)} className="font-semibold text-navy no-underline hover:underline">
            {g.displayName}
          </Link>
          , předtím {g.priorProfessionText}
          {where ? `, ${where}` : ""}
          {phase ? ` · ${phase}` : ""}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          {m.hasNumber && <span className="chip chip-number">s číslem</span>}
          {m.isAdmission && <span className="chip chip-admission">přiznání</span>}
          {m.strength === "slabý" && <span className="chip">názor</span>}
          {showTopic && <span className="chip">{m.primaryTopic.label}</span>}
          <Link href={href} className="btn-link ml-auto">
            Číst přepis <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
