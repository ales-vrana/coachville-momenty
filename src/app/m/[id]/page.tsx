import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import GuestMark from "@/components/GuestMark";
import CtaBar from "@/components/CtaBar";
import MomentCard from "@/components/MomentCard";
import MomentPlayer from "@/components/MomentPlayer";
import ShareMenu from "@/components/ShareMenu";
import TrackLink from "@/components/TrackLink";
import {
  credentialLongLabel,
  guestTitle,
  formatDateCz,
  formatDuration,
  formatTime,
  getDenominator,
  getMoment,
  getMomentViews,
  getNextMoment,
  getNextWorkshop,
  getRelatedMoments,
  hasExternalVerifyLink,
  initials,
  phaseLabel,
  site,
  whereLabel,
} from "@/lib/data";
import { episodeUrl, guestUrl, topicUrl } from "@/lib/urls";

export function generateStaticParams() {
  return getMomentViews().map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const m = getMoment(id);
  if (!m) return {};
  const g = m.guestData;
  const desc = `${g.priorProfessionText}${whereLabel(g) ? `, ${whereLabel(g)}` : ""}${
    phaseLabel(g) ? `, ${phaseLabel(g)}` : ""
  }, ${formatDuration(m.durationS)} z nesestříhaného rozhovoru`;
  return {
    title: `${g.displayName}: ${m.summary}`,
    description: desc,
    openGraph: { title: m.summary, description: `${g.displayName}, ${desc}`, type: "video.other" },
    alternates: { canonical: `/m/${m.id}` },
  };
}

export default async function MomentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = getMoment(id);
  if (!m) notFound();
  const g = m.guestData;
  const ep = m.episodeData;
  const next = getNextMoment(m);
  const related = getRelatedMoments(m, 5);
  const d = getDenominator();
  const workshop = getNextWorkshop();
  const verify = g.verifyLinks.filter((l) => hasExternalVerifyLink({ ...g, verifyLinks: [l] }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: `${g.displayName}: ${m.summary}`,
    description: m.summary,
    uploadDate: ep.recordedAt,
    thumbnailUrl: ep.thumbnailUrl ? [ep.thumbnailUrl] : undefined,
    embedUrl: `https://player.vimeo.com/video/${ep.vimeoId}`,
    hasPart: {
      "@type": "Clip",
      name: m.summary,
      startOffset: Math.floor(m.start),
      endOffset: Math.ceil(m.end),
      url: `${site.baseUrl}/m/${m.id}`,
    },
  };

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <span className="eyebrow">Moment</span> <span className="mx-1">·</span>{" "}
        <Link href={topicUrl(m.primaryTopic.id)} className="btn-link">
          {m.primaryTopic.label}
        </Link>
      </nav>

      <header className="flex items-start gap-3">
        <GuestMark g={g} size={64} />
        <div className="min-w-0">
          <h1 className="text-lg font-semibold normal-case leading-snug sm:text-xl">{m.summary}</h1>
          {g.credential && (
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gold">Dosažená certifikace: {credentialLongLabel(g.credential)}</p>
          )}
          <p className="mt-1 text-sm text-muted">
            <Link href={guestUrl(g.slug)} className="font-semibold text-navy underline">
              {guestTitle(g)}
            </Link>
            , předtím {g.priorProfessionText}
            {whereLabel(g) ? `, ${whereLabel(g)}` : ""}. {phaseLabel(g) ? `${phaseLabel(g)} v době natáčení` : ""}
            {g.phaseNow ? `, dnes ${g.phaseNow}${g.phaseNowDate ? ` (${formatDateCz(g.phaseNowDate)})` : ""}` : ""}.
          </p>
        </div>
      </header>

      {/* Fakta nad tlačítky (F15, F16) */}
      <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="text-muted">Ptá se</dt>
          <dd>
            {ep.interviewerName}, {ep.interviewerRole}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted">Natočeno</dt>
          <dd>
            {formatDateCz(ep.recordedAt)}, úsek {formatTime(m.start)} až {formatTime(m.end)}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted">Odměna</dt>
          <dd>
            {g.rewardReceived ? "host dostal za rozhovor odměnu" : "host nedostal za rozhovor odměnu"}
            {g.worksForSchool ? ", pracuje pro školu" : ", nepracuje pro školu"}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted">Co je ACC / PCC</dt>
          <dd>credential, který uděluje ICF po vlastní zkoušce; škola připravuje, nezkouší</dd>
        </div>
      </dl>
      <p className="text-sm text-muted">
        <span className="font-medium text-ink">1 z {d.hosts} hostů</span> na tomto webu, {d.moments} momentů z {d.episodes} rozhovorů.
      </p>

      <MomentPlayer
        momentId={m.id}
        vimeoId={ep.vimeoId}
        vimeoHash={ep.vimeoHash}
        thumbnailUrl={ep.thumbnailUrl}
        guestName={g.displayName}
        initialsText={initials(g.displayName)}
        start={m.start}
        end={m.end}
        startLabel={formatTime(m.start)}
        utterances={m.utterances}
        next={
          next
            ? { id: next.id, guestName: next.guestData.displayName, durationLabel: formatDuration(next.durationS), summary: next.summary }
            : null
        }
        fullUrl={episodeUrl(ep.slug, m.start)}
      />

      <div className="flex flex-wrap gap-1.5">
        {m.hasNumber && <span className="chip chip-number">s číslem{m.numberText ? `: ${m.numberText}` : ""}</span>}
        {m.isAdmission && <span className="chip chip-admission">přiznání{m.costText ? `: ${m.costText}` : ""}</span>}
        {typeof m.monthsFromStart === "number" && <span className="chip">{m.monthsFromStart}. měsíc od startu</span>}
        {typeof m.hoursPerWeek === "number" && <span className="chip">{m.hoursPerWeek} h týdně</span>}
      </div>

      <section className="card space-y-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            {next && (
              <Link href={`/m/${next.id}`} className="btn-primary">
                Další moment k tomuto tématu
              </Link>
            )}
            <Link href={episodeUrl(ep.slug, m.start)} className="btn-secondary">
              Celý rozhovor od {formatTime(m.start)}
            </Link>
          </div>
          {/* Další krok s CoachVille: ukázková lekce a krátký telefonát (site.json.nextSteps, UTM coachville-momenty). */}
          <div className="flex flex-col items-start gap-1.5 sm:items-end">
            <p className="eyebrow">{site.nextSteps.eyebrow}</p>
            <TrackLink
              href={site.nextSteps.workshop.url}
              event="cta_click"
              params={{ target: "workshop", moment_id: m.id, placement: "moment_page" }}
              className="btn-link"
            >
              {site.nextSteps.workshop.label} <span aria-hidden="true">↗</span>
            </TrackLink>
            <TrackLink
              href={site.nextSteps.call.url}
              event="cta_click"
              params={{ target: "call", moment_id: m.id, placement: "moment_page" }}
              className="btn-link"
            >
              {site.nextSteps.call.label} <span aria-hidden="true">↗</span>
            </TrackLink>
          </div>
        </div>
        <div>
          <p className="eyebrow">Ověřte si to sami</p>
          {verify.length > 0 ? (
            <ul className="mt-1 flex flex-wrap gap-2 text-sm">
              {verify.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener" className="underline">
                    {l.label ?? l.type}
                  </a>
                </li>
              ))}
              {g.contactAllowed && g.contactUrl && (
                <li>
                  <a href={g.contactUrl} className="underline">
                    Napište {g.displayName.split(" ")[0]}
                  </a>
                </li>
              )}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted">Ověřovací odkaz mimo web CoachVille doplňujeme.</p>
          )}
        </div>
        <div>
          <p className="eyebrow">Sdílet</p>
          <div className="mt-1">
            <ShareMenu momentId={m.id} baseUrl={site.baseUrl} guestName={g.displayName} summary={m.summary} />
          </div>
        </div>
        {m.secondaryTopics.length > 0 && (
          <p className="text-sm text-muted">
            Mluví také o:{" "}
            {m.secondaryTopics.map((t, i) => (
              <span key={t.id}>
                {i > 0 && ", "}
                <Link href={topicUrl(t.id)} className="underline">
                  {t.label}
                </Link>
              </span>
            ))}
          </p>
        )}
      </section>

      {related.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base">Další momenty k otázce „{m.primaryTopic.label}“</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <MomentCard key={r.id} m={r} />
            ))}
          </div>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CtaBar workshop={workshop} />
    </div>
  );
}
