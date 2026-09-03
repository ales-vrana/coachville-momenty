import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CtaBar from "@/components/CtaBar";
import Denominator, { plural } from "@/components/Denominator";
import MomentCard from "@/components/MomentCard";
import MomentList from "@/components/MomentList";
import { getCostLine, getDenominator, getMomentsForTopic, getNextWorkshop, getPublishedTopics, getTopics, site } from "@/lib/data";
import { topicUrl } from "@/lib/urls";

export function generateStaticParams() {
  return getTopics().map((t) => ({ slug: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopics().find((t) => t.id === slug);
  if (!topic) return {};
  return {
    title: topic.label,
    description: `Momenty z rozhovorů se studenty CoachVille k otázce: ${topic.label}`,
  };
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = getTopics().find((t) => t.id === slug);
  if (!topic) notFound();
  const moments = getMomentsForTopic(topic.id);
  const d = getDenominator();
  const guests = new Set(moments.map((m) => m.guest)).size;
  const cost = getCostLine(moments);
  const workshop = getNextWorkshop();
  // Další téma: následující publikované ve stejné skupině, jinak první další v pořadí.
  const published = getPublishedTopics().map((t) => t.topic);
  const pi = published.findIndex((t) => t.id === topic.id);
  const nextTopic =
    published.slice(pi + 1).find((t) => t.group === topic.group) ?? published[pi + 1] ?? published[0] ?? null;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href="/#temata" className="btn-link">
          Témata
        </Link>{" "}
        <span className="mx-1">·</span> <span className="eyebrow">{topic.group}</span>
      </nav>
      <header className="max-w-3xl">
        <h1 className="text-2xl leading-tight sm:text-3xl">{topic.label}</h1>
        {topic.aliases && topic.aliases.length > 0 && (
          <p className="mt-1 text-sm text-muted">Také: {topic.aliases.join(" · ")}</p>
        )}
        {cost && <p className="mt-2 text-sm text-muted">Kolik to stálo je: {cost}.</p>}
      </header>

      {moments.length === 0 ? (
        <p className="card p-5 text-muted">
          K této otázce zatím nemáme žádný moment. Až natočíme, přidáme.{" "}
          <Link href="/#temata" className="underline">
            Zpět na témata
          </Link>
          .
        </p>
      ) : (
        <MomentList
          items={moments.map((m) => ({
            id: m.id,
            cat: m.guestData.priorProfessionCat ?? "neuvedeno",
            hasNumber: m.hasNumber,
            isAdmission: m.isAdmission,
          }))}
          afterFirst={
            <div className="px-1">
              <Denominator d={d} topicMoments={moments.length} topicGuests={guests} compact />
            </div>
          }
          nextTopic={nextTopic && nextTopic.id !== topic.id ? { href: topicUrl(nextTopic.id), label: nextTopic.label } : null}
          totalLabel={`${moments.length} ${plural(moments.length, "moment", "momenty", "momentů")}`}
        >
          {moments.map((m, i) => (
            <MomentCard key={m.id} m={m} index={i} layout="row" />
          ))}
        </MomentList>
      )}

      <section className="card p-5">
        <h2 className="text-base normal-case">Co byste potřeboval/a slyšet, abyste se rozhodl/a, ať už jakkoliv?</h2>
        <p className="mt-1 text-sm text-muted">
          Napište mi to. Čtu každou odpověď a podle nich natáčím další rozhovory.
        </p>
        <a
          href={`mailto:ales@coachville.cz?subject=${encodeURIComponent(`Co bych potřeboval/a slyšet: ${topic.label}`)}`}
          className="btn-secondary mt-3"
        >
          Odpovědět e-mailem
        </a>
      </section>

      <p className="text-xs text-muted">
        {site.siteName} · téma {topic.id}
      </p>
      <CtaBar workshop={workshop} />
    </div>
  );
}
