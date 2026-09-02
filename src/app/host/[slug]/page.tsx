import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import MomentCard from "@/components/MomentCard";
import {
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
        <Avatar name={g.displayName} photo={g.consentScope.photo ? g.photo : undefined} size={72} />
        <div>
          <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{g.displayName}</h1>
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
          <h2 className="text-xs uppercase tracking-wide text-muted">Časová osa</h2>
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
          <h2 className="text-xs uppercase tracking-wide text-muted">Ověřte si to sami</h2>
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
          {g.contactAllowed && g.contactUrl && (
            <a href={g.contactUrl} className="mt-3 inline-block rounded-full border border-line bg-white px-4 py-2 text-sm font-medium hover:bg-paper-2">
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
          <h2 className="font-semibold">{ms[0].primaryTopic.label}</h2>
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
