import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import GuestMark from "@/components/GuestMark";
import MomentCard from "@/components/MomentCard";
import {
  credentialLongLabel,
  guestTitle,
  formatDateCz,
  getEpisodes,
  getGuest,
  getMomentsForGuest,
  getPublishedGuests,
  guestIsPublishable,
  hasExternalVerifyLink,
  phaseLabel,
  whereLabel,
} from "@/lib/data";
import { episodeUrl } from "@/lib/urls";

export function generateStaticParams() {
  return getPublishedGuests().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuest(slug);
  if (!g) return {};
  return { title: g.displayName, description: `Předtím ${g.priorProfessionText}. Momenty z rozhovoru a ověřovací odkazy.` };
}

export default async function GuestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuest(slug);
  if (!g || !guestIsPublishable(g)) notFound();
  const moments = getMomentsForGuest(g.slug);
  if (moments.length === 0) notFound();
  const episodes = getEpisodes().filter((e) => e.guestSlugs.includes(g.slug) && e.status === "published");
  const byTopic = new Map<string, typeof moments>();
  for (const m of moments) {
    const key = m.primaryTopic.id;
    byTopic.set(key, [...(byTopic.get(key) ?? []), m]);
  }
  const verify = g.verifyLinks.filter((l) => hasExternalVerifyLink({ ...g, verifyLinks: [l] }));

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-4">
        <GuestMark g={g} size={88} />
        <div>
          <h1 className="text-2xl leading-tight sm:text-3xl">{guestTitle(g)}</h1>
          {g.credential && (
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gold">Dosažená certifikace: {credentialLongLabel(g.credential)}</p>
          )}
          <p className="mt-1 text-muted">
            Předtím {g.priorProfessionText}
            {whereLabel(g) ? `, ${whereLabel(g)}` : ""}
            {g.ageBand && g.ageBand !== "neuvedeno" ? `, ${g.ageBand}` : ""}.
            {phaseLabel(g) ? ` ${phaseLabel(g)} v době natáčení` : ""}
            {g.phaseNow ? `, dnes ${g.phaseNow}${g.phaseNowDate ? ` (${formatDateCz(g.phaseNowDate)})` : ""}` : ""}.
          </p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="card p-5">
          <h2 className="eyebrow">Časová osa</h2>
          {g.timeline.length ? (
            <ol className="mt-2 space-y-2">
              {g.timeline.map((p, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="w-28 shrink-0 font-medium">{p.label}</span>
                  <span className="text-muted">{p.text}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-sm text-muted">Doplňujeme.</p>
          )}
        </section>
        <section className="card p-5">
          <h2 className="eyebrow">Ověřte si to sami</h2>
          {verify.length ? (
            <ul className="mt-2 space-y-1 text-sm">
              {verify.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener" className="underline">
                    {l.label ?? l.type}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">Ověřovací odkaz mimo web CoachVille doplňujeme.</p>
          )}
          {g.contactAllowed && g.consentScope.contact && g.phones && g.phones.length > 0 && (
            <div className="mt-4">
              <h3 className="eyebrow">Zeptejte se studenta přímo, kontakt:</h3>
              <p className="mt-1 text-base font-medium text-dark">
                {g.phones.map((ph, i) => (
                  <span key={ph}>
                    {i > 0 && " / "}
                    <a href={`tel:${ph.replace(/\s+/g, "")}`} className="no-underline text-dark hover:underline">
                      {ph}
                    </a>
                  </span>
                ))}
              </p>
            </div>
          )}
          {g.contactAllowed && g.contactUrl && (
            <a href={g.contactUrl} className="btn-secondary mt-3">
              Napsat {g.displayName.split(" ")[0]}
            </a>
          )}
          <p className="mt-3 text-xs text-muted">
            {g.rewardReceived ? "Host dostal za rozhovor odměnu." : "Host nedostal za rozhovor odměnu."}{" "}
            {g.worksForSchool ? "Pracuje pro školu." : "Nepracuje pro školu."}
          </p>
          {episodes.length > 0 && (
            <p className="mt-3 text-sm">
              {episodes.map((e) => (
                <Link key={e.slug} href={episodeUrl(e.slug)} className="underline">
                  Celý rozhovor ({formatDateCz(e.recordedAt)})
                </Link>
              ))}
            </p>
          )}
        </section>
      </div>

      {[...byTopic.entries()].map(([topicId, ms]) => (
        <section key={topicId} className="space-y-3">
          <h2 className="text-base">{ms[0].primaryTopic.label}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {ms.map((m) => (
              <MomentCard key={m.id} m={m} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
