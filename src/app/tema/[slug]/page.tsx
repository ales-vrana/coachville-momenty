import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CtaBar from "@/components/CtaBar";
import Denominator from "@/components/Denominator";
import MomentCard from "@/components/MomentCard";
import { getCostLine, getDenominator, getMomentsForTopic, getNextWorkshop, getTopics, site } from "@/lib/data";

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
  const RELATED_SAMPLE = 7;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href="/#temata" className="underline">
          Témata
        </Link>{" "}
        · {topic.group}
      </nav>
      <header className="max-w-3xl">
        <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{topic.label}</h1>
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
        <div className="space-y-4">
          {moments.slice(0, RELATED_SAMPLE).map((m, i) => (
            <div key={m.id} className="space-y-4">
              <MomentCard m={m} index={i} />
              {i === 0 && (
                <div className="px-1">
                  <Denominator d={d} topicMoments={moments.length} topicGuests={guests} compact />
                </div>
              )}
            </div>
          ))}
          {moments.length > RELATED_SAMPLE && (
            <p className="text-sm text-muted">
              Dalších {moments.length - RELATED_SAMPLE} momentů najdete u jednotlivých hostů.
            </p>
          )}
        </div>
      )}

      <section className="card p-5">
        <h2 className="font-semibold">Co byste potřeboval/a slyšet, abyste se rozhodl/a, ať už jakkoliv?</h2>
        <p className="mt-1 text-sm text-muted">
          Napište mi to. Čtu každou odpověď a podle nich natáčím další rozhovory.
        </p>
        <a
          href={`mailto:ales@coachville.cz?subject=${encodeURIComponent(`Co bych potřeboval/a slyšet: ${topic.label}`)}`}
          className="mt-3 inline-block rounded-full border border-line bg-white px-4 py-2 text-sm font-medium hover:bg-paper-2"
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
