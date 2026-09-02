import Link from "next/link";
import Avatar from "./Avatar";
import { formatDuration, phaseLabel, whereLabel } from "@/lib/data";
import type { MomentView } from "@/lib/types";
import { momentUrl } from "@/lib/urls";

export default function MomentCard({
  m,
  refParam,
  showTopic = false,
  index,
}: {
  m: MomentView;
  refParam?: string;
  showTopic?: boolean;
  index?: number;
}) {
  const g = m.guestData;
  const where = whereLabel(g);
  const phase = phaseLabel(g);
  return (
    <article className="card overflow-hidden">
      <Link href={momentUrl(m.id, refParam)} className="block p-4 transition hover:bg-paper-2/60 sm:p-5">
        <div className="flex items-start gap-3">
          <Avatar name={g.displayName} photo={g.consentScope.photo ? g.photo : undefined} size={48} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-semibold">{g.displayName}</span>
              <span className="text-sm text-muted">{formatDuration(m.durationS)}</span>
              {typeof index === "number" && index === 0 && (
                <span className="chip border-accent/30 bg-accent-soft text-accent-deep">Začněte tady</span>
              )}
            </div>
            <p className="text-sm text-muted">
              Předtím: {g.priorProfessionText}
              {where ? `, ${where}` : ""}
              {phase ? ` · ${phase}` : ""}
            </p>
          </div>
        </div>
        <p className="mt-3 text-[17px] leading-snug">{m.summary}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {m.hasNumber && <span className="chip">s číslem</span>}
          {m.isAdmission && <span className="chip border-warn/30 text-warn">přiznání</span>}
          {m.strength === "slabý" && <span className="chip">názor</span>}
          {showTopic && <span className="chip">{m.primaryTopic.label}</span>}
        </div>
        <div className="mt-4 flex gap-2 text-sm font-medium">
          <span className="rounded-full bg-ink px-4 py-2 text-white">Číst</span>
          <span className="rounded-full bg-paper-2 px-4 py-2">Přehrát</span>
        </div>
      </Link>
    </article>
  );
}
