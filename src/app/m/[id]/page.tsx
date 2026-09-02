import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import CtaBar from "@/components/CtaBar";
import MomentCard from "@/components/MomentCard";
import MomentPlayer from "@/components/MomentPlayer";
import ShareMenu from "@/components/ShareMenu";
import {
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
        <Link href={topicUrl(m.primaryTopic.id)} className="underline">
          {m.primaryTopic.label}
        </Link>
      </nav>

      <header className="flex items-start gap-3">
        <Avatar name={g.displayName} photo={g.consentScope.photo ? g.photo : undefined} size={56} />
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-snug sm:text-2xl">{m.summary}</h1>
          <p className="mt-1 text-sm text-muted">
            <Link href={guestUrl(g.slug)} className="font-medium text-ink underline">
              {g.displayName}
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
        <span className="font-medium text-ink">1 z {d.hosts} hostů.</span> {site.community.sentence}
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
        {m.hasNumber && <span className="chip">s číslem{m.numberText ? `: ${m.numberText}` : ""}</span>}
        {m.isAdmission && <span className="chip border-warn/30 text-warn">přiznání{m.costText ? `: ${m.costText}` : ""}</span>}
        {typeof m.monthsFromStart === "number" && <span className="chip">{m.monthsFromStart}. měsíc od startu</span>}
        {typeof m.hoursPerWeek === "number" && <span className="chip">{m.hoursPerWeek} h týdně</span>}
      </div>

      <section className="card space-y-3 p-5">
        <div className="flex flex-wrap gap-2 text-sm">
          {next && (
            <Link href={`/m/${next.id}`} className="rounded-full bg-ink px-4 py-2 font-medium text-white hover:bg-black">
              Další moment k tomuto tématu
            </Link>
          )}
          <Link href={episodeUrl(ep.slug, m.start)} className="rounded-full border border-line bg-white px-4 py-2 hover:bg-paper-2">
            Celý rozhovor od {formatTime(m.start)}
          </Link>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Ověřte si to sami</p>
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
          <p className="text-xs uppercase tracking-wide text-muted">Sdílet</p>
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
          <h2 className="font-semibold">Další momenty k otázce „{m.primaryTopic.label}“</h2>
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
