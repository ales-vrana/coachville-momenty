import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EpisodePlayer from "@/components/EpisodePlayer";
import MomentCard from "@/components/MomentCard";
import { formatDateCz, formatTime, getEpisode, getGuest, getMomentsForEpisode, getPublishedEpisodes, site } from "@/lib/data";
import { guestUrl } from "@/lib/urls";

export function generateStaticParams() {
  return getPublishedEpisodes().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const ep = getEpisode(slug);
  if (!ep) return {};
  return { title: ep.title, description: `Celý nesestříhaný rozhovor, natočeno ${formatDateCz(ep.recordedAt)}.` };
}

export default async function EpisodePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ep = getEpisode(slug);
  if (!ep || ep.status !== "published") notFound();
  const moments = getMomentsForEpisode(ep.slug);
  const guests = ep.guestSlugs.map((s) => getGuest(s)).filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: ep.title,
    description: `Nesestříhaný rozhovor, ${moments.length} označených momentů.`,
    uploadDate: ep.recordedAt,
    duration: ep.durationS ? `PT${Math.round(ep.durationS)}S` : undefined,
    thumbnailUrl: ep.thumbnailUrl ? [ep.thumbnailUrl] : undefined,
    embedUrl: `https://player.vimeo.com/video/${ep.vimeoId}`,
    hasPart: moments.map((m) => ({
      "@type": "Clip",
      name: m.summary,
      startOffset: Math.floor(m.start),
      endOffset: Math.ceil(m.end),
      url: `${site.baseUrl}/m/${m.id}`,
    })),
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Celý nesestříhaný rozhovor · natočeno {formatDateCz(ep.recordedAt)}</p>
        <h1 className="mt-1 text-2xl normal-case leading-tight sm:text-3xl">{ep.title}</h1>
        <p className="mt-1 text-sm text-muted">
          Ptá se {ep.interviewerName}, {ep.interviewerRole}.{" "}
          {guests.map((g, i) => (
            <span key={g!.slug}>
              {i > 0 && ", "}
              <Link href={guestUrl(g!.slug)} className="underline">
                {g!.displayName}
              </Link>
            </span>
          ))}
          .
        </p>
      </header>

      <EpisodePlayer
        vimeoId={ep.vimeoId}
        vimeoHash={ep.vimeoHash}
        thumbnailUrl={ep.thumbnailUrl}
        title={ep.title}
        chapters={ep.chapters}
        momentStarts={moments.map((m) => ({ id: m.id, start: m.start }))}
      />

      <section className="space-y-3">
        <h2 className="text-base">Momenty z tohoto rozhovoru ({moments.length})</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {moments.map((m) => (
            <div key={m.id}>
              <p className="mb-1 text-xs text-muted">
                {formatTime(m.start)} až {formatTime(m.end)}
              </p>
              <MomentCard m={m} showTopic />
            </div>
          ))}
        </div>
      </section>

      <p className="text-sm text-muted">
        Celý přepis nezveřejňujeme, protože hosté v rozhovorech zmiňují své klienty. Na webu jsou jen doslovné úseky, které host schválil.
      </p>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
