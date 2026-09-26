import Link from "next/link";
import GuestMark from "@/components/GuestMark";
import Denominator, { plural } from "@/components/Denominator";
import {
  credentialLongLabel,
  getDenominator,
  getPublishedGuests,
  guestTitle,
  getPublishedTopics,
  phaseLabel,
  site,
  whereLabel,
} from "@/lib/data";
import type { TopicGroup } from "@/lib/types";
import { guestUrl, topicUrl } from "@/lib/urls";

const GROUPS: TopicGroup[] = ["Klienti a peníze", "Já a moje schopnosti", "Důvěra ke škole", "Riziko a rozhodnutí"];

export default function Home() {
  const topics = getPublishedTopics();
  const guests = getPublishedGuests();
  const d = getDenominator();

  return (
    <div className="space-y-10">
      {/* Kontaktní výzva nahoře pod menu (přesun 26. 9. 2026 na přání Aleše); na desktopu text vlevo, tlačítko vpravo. */}
      <section className="flex flex-col gap-4 rounded-2xl bg-navy p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="max-w-2xl">
          <h2 className="text-xl text-white sm:text-2xl">{site.contactCta.heading}</h2>
          <p className="mt-1 text-sm text-white/85 sm:text-base">{site.contactCta.text}</p>
        </div>
        <a href={site.contactCta.url} className="btn-primary shrink-0" target="_blank" rel="noopener">
          {site.contactCta.button} ↗
        </a>
      </section>

      <section className="max-w-3xl">
        <p className="eyebrow mb-2">Momenty ze studia v CoachVille</p>
        <h1 className="text-3xl leading-tight sm:text-4xl">Rozhovory se studenty a absolventy CoachVille</h1>
        <p className="mt-3 text-lg text-muted">
          Vyberte si několik momentů, které vás zajímají, anebo si přehrajte celý rozhovor se studentem, jehož sdílení vás
          zaujalo. S kýmkoliv z nich se můžete spojit.
        </p>
      </section>

      <section id="temata" className="space-y-6">
        <h2 className="text-xl">Co si právě teď říkáte?</h2>
        {topics.length === 0 && (
          <p className="text-muted">Zatím tu nejsou žádná publikovaná témata. Přidejte první rozhovor.</p>
        )}
        {GROUPS.map((group) => {
          const items = topics.filter((t) => t.topic.group === group);
          if (!items.length) return null;
          return (
            <div key={group}>
              <h3 className="eyebrow mb-2">{group}</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {items.map(({ topic, moments, guests: g }) => (
                  <li key={topic.id}>
                    <Link
                      href={topicUrl(topic.id)}
                      className="card flex items-center justify-between gap-3 border-l-4 border-l-teal p-4 no-underline transition hover:-translate-y-px hover:shadow-md"
                    >
                      <span className="font-semibold leading-snug text-navy">{topic.label}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {moments} {plural(moments, "moment", "momenty", "momentů")} / {g} {plural(g, "člověk", "lidé", "lidí")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      {guests.length > 0 && (
        <section id="hoste" className="space-y-3">
          <h2 className="text-xl">Kdo tu mluví</h2>
          {/* Dva sloupce a vyšší řádek, aby byl odznak ICF (72 px) čitelný. Bez certifikace kolečko s iniciálami. */}
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {guests.map((g) => (
              <li key={g.slug}>
                <Link href={guestUrl(g.slug)} className="card flex items-center gap-4 p-4 no-underline transition hover:-translate-y-px hover:shadow-md">
                  <GuestMark g={g} size={72} />
                  <span className="min-w-0">
                    <span className="block font-semibold text-navy">{guestTitle(g)}</span>
                    {g.credential && <span className="block text-xs text-muted">Dosažená certifikace: {credentialLongLabel(g.credential)}</span>}
                    <span className="block truncate text-sm text-muted">
                      Předtím {g.priorProfessionText}
                      {whereLabel(g) ? `, ${whereLabel(g)}` : ""}
                      {phaseLabel(g) ? ` · ${phaseLabel(g)}` : ""}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-5 sm:p-8">
        <Denominator d={d} />
        <p className="mt-3 text-sm text-muted">
          Tohle není reklama a není to místo, kde se platí za výcvik. Když po dvou momentech budete chtít vědět, jestli je to pro vás,
          je tu workshop za 300 Kč. A když ne, nic se neděje.{" "}
          <Link href="/pro-partnera" className="btn-link">
            Stránka pro partnera, který to má platit
          </Link>
          .
        </p>
      </section>

    </div>
  );
}

export const metadata = { title: `${site.siteName} ze studia v CoachVille · rozhovory se studenty a absolventy` };
