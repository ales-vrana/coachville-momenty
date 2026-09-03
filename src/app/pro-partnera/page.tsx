import type { Metadata } from "next";
import Denominator from "@/components/Denominator";
import EpisodePlayer from "@/components/EpisodePlayer";
import { getCollections, getDenominator, site } from "@/lib/data";

export const metadata: Metadata = {
  title: "Pro partnera, který to má platit",
  description: "Fakta místo nadšení: kdo jsou ti lidé, kolik to stálo, co nevyšlo a co se stane, když se to nepovede.",
};

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
        <h1 className="text-3xl leading-tight">{col?.title ?? "Pro partnera, který to má platit"}</h1>
        <p className="mt-3 text-lg text-muted">{col?.intro}</p>
      </header>

      <section className="card p-5">
        <Denominator d={d} />
        <p className="mt-2 text-sm text-muted">
          Čísla pocházejí z písemných zápisů studentů v komunitě školy, ne z dotazníku spokojenosti.{" "}
          <a href={site.links.coachReviews} className="underline" target="_blank" rel="noopener">
            Písemné zkušenosti koučů
          </a>{" "}
          a{" "}
          <a href={site.links.clientReferences} className="underline" target="_blank" rel="noopener">
            reference klientů
          </a>{" "}
          jsou k nahlédnutí celé.
        </p>
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
      <section className="card p-5">
        <h2 className="text-xl">7 otázek pro každou školu</h2>
        <p className="mt-1 text-sm text-muted">Položte je nám i komukoliv jinému. Odpovědi CoachVille zveřejníme na stránce Podmínky poctivě, až bude dopsaná.</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          {QUESTIONS.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
