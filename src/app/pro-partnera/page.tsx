import type { Metadata } from "next";
import Denominator from "@/components/Denominator";
import EpisodePlayer from "@/components/EpisodePlayer";
import { getCollections, getDenominator, site } from "@/lib/data";

export const metadata: Metadata = {
  title: "Pro partnera, který to má platit",
  description: "Fakta místo nadšení: kdo jsou ti lidé, kolik to stálo, co nevyšlo a co se stane, když se to nepovede.",
};

// Otázky pro každou školu (sekce skrytá 3. 9. 2026, seznam ponechán pro případné vrácení).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const QUESTIONS = [
  "Kdo vydává certifikát: škola, nebo nezávislá organizace (ICF) po vlastní zkoušce?",
  "Kolik lidí výcvik dokončí a kolik ne?",
  "Kolik z nich má do půl roku platícího klienta a jak to víte?",
  "Co se stane, když chci skončit v půlce? Kolik zaplatím a kolik dostanu zpět?",
  "Kolik stojí celá cesta, ne jen první stupeň?",
  "Můžu si zavolat s náhodným absolventem, kterého nevyberete vy?",
  "Pro koho to není?",
];

export default function PartnerPage() {
  const col = getCollections().find((c) => c.slug === "pro-partnera");
  const d = getDenominator();

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <h1 className="text-3xl leading-tight">{col?.title ?? "Pro partnera nebo partnerku"}</h1>
        <p className="mt-3 text-lg text-muted">{col?.intro}</p>
      </header>

      <section className="card p-5">
        <Denominator d={d} tiles={false} unknownLine={false} />
        <p className="mt-2 text-sm text-muted">
          Čísla pocházejí z písemných zápisů studentů v komunitě školy, ne z dotazníku spokojenosti. Písemné zkušenosti koučů a
          reference koučovaných klientů jsou k nahlédnutí celé:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={site.links.coachReviews} className="btn-primary" target="_blank" rel="noopener">
            Písemné zkušenosti koučů ↗
          </a>
          <a href={site.links.clientReferences} className="btn-primary" target="_blank" rel="noopener">
            Reference koučovaných klientů ↗
          </a>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <div>
          <p className="eyebrow">Video pro partnery a partnerky</p>
          <h2 className="mt-1 text-xl normal-case">{site.partnerVideo.title}</h2>
          <p className="mt-1 text-muted">{site.partnerVideo.note}</p>
        </div>
        <EpisodePlayer
          vimeoId={site.partnerVideo.vimeoId}
          vimeoHash={site.partnerVideo.vimeoHash}
          title={site.partnerVideo.title}
          chapters={[]}
          momentStarts={[]}
        />
      </section>

      {/* Sekce „Co se stane, když to nepůjde“ (odkaz na Podmínky poctivě) je dočasně skrytá, text stránky není dopsaný. */}
      {/* Sekce „7 otázek pro každou školu“ skrytá na přání (3. 9. 2026); seznam QUESTIONS zůstává v souboru. */}
    </div>
  );
}
