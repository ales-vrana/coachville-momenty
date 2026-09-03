import type { Metadata } from "next";
import Denominator from "@/components/Denominator";
import MomentCard from "@/components/MomentCard";
import { getCollections, getDenominator, getMoment, getMomentViews, site } from "@/lib/data";

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
  const curated = (col?.momentIds ?? []).map((id) => getMoment(id)).filter((m): m is NonNullable<typeof m> => Boolean(m));
  const fallback = getMomentViews()
    .filter((m) => m.isAdmission || m.hasNumber)
    .sort((a, b) => Number(b.isAdmission) - Number(a.isAdmission))
    .slice(0, 5);
  const moments = curated.length ? curated : fallback;
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

      <section className="space-y-3">
        <h2 className="text-xl">Momenty s čísly a s tím, co nevyšlo</h2>
        {moments.length === 0 ? (
          <p className="text-muted">Zatím doplňujeme.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {moments.map((m) => (
              <MomentCard key={m.id} m={m} refParam="partner" showTopic />
            ))}
          </div>
        )}
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
