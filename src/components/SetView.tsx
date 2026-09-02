"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { track } from "@/lib/track";
import { useClientUrl } from "@/lib/useClient";

export interface SetMoment {
  id: string;
  guestName: string;
  prior: string;
  where: string;
  phase: string;
  summary: string;
  duration: string;
  topic: string;
}

interface Salesperson {
  code: string;
  name: string;
  email?: string;
  sms?: string;
}

export default function SetView({ moments, salespeople }: { moments: SetMoment[]; salespeople: Salesperson[] }) {
  const { hash, mounted } = useClientUrl();
  const ids = useMemo(() => (hash.get("m") ?? "").split(",").filter(Boolean).slice(0, 3), [hash]);
  const ownerCode = hash.get("o");
  const owner = salespeople.find((s) => s.code === ownerCode) ?? null;
  const parsed = mounted;

  useEffect(() => {
    if (ids.length) track("set_open", { set_size: ids.length, owner: ownerCode ?? "" });
  }, [ids, ownerCode]);

  const selected = ids.map((id) => moments.find((m) => m.id === id)).filter((m): m is SetMoment => Boolean(m));

  if (!parsed) return <p className="text-muted">Načítám…</p>;

  if (selected.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Vybrané momenty</h1>
        <p className="text-muted">
          Tento odkaz neobsahuje žádné momenty. Správný tvar je <code>/v/#m=id1,id2,id3&amp;o=kod</code>.
        </p>
        <Link href="/#temata" className="underline">
          Zpět na témata
        </Link>
      </div>
    );
  }

  const ownerFirst = owner?.name ?? "Kolegyně z CoachVille";

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted">Vybrané momenty</p>
        <h1 className="text-2xl font-bold leading-tight">
          {ownerFirst} vám vybral{owner?.name?.endsWith("a") ? "a" : ""} {selected.length === 1 ? "1 moment" : `${selected.length} momenty`} k tomu, co jste spolu
          řešili.
        </h1>
        <p className="mt-1 text-muted">Každý má pár minut. Můžete číst i poslouchat.</p>
      </header>
      <ol className="space-y-4">
        {selected.map((m, i) => (
          <li key={m.id} className="card p-5">
            <p className="text-xs uppercase tracking-wide text-muted">
              {i + 1} / {selected.length} · {m.topic}
            </p>
            <p className="mt-1 font-semibold">
              {m.guestName} <span className="font-normal text-muted">· {m.duration}</span>
            </p>
            <p className="text-sm text-muted">
              Předtím {m.prior}
              {m.where ? `, ${m.where}` : ""}
              {m.phase ? ` · ${m.phase}` : ""}
            </p>
            <p className="mt-2 text-[17px] leading-snug">{m.summary}</p>
            <Link href={`/m/${m.id}`} className="mt-3 inline-block rounded-full bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-black">
              Otevřít moment
            </Link>
          </li>
        ))}
      </ol>
      <section className="card p-5">
        <h2 className="font-semibold">Až to uvidíte, napište jednu věc: co vám tam chybělo?</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {owner?.email && (
            <a href={`mailto:${owner.email}?subject=${encodeURIComponent("Co mi v momentech chybělo")}`} className="rounded-full bg-accent px-4 py-2 font-medium text-white hover:bg-accent-deep">
              Odpovědět {owner.name}
            </a>
          )}
          {owner?.sms && (
            <a href={`sms:${owner.sms}`} className="rounded-full border border-line bg-white px-4 py-2 hover:bg-paper-2">
              Napsat SMS
            </a>
          )}
          <Link href="/#temata" className="rounded-full border border-line bg-white px-4 py-2 hover:bg-paper-2">
            Chcete víc k tématu?
          </Link>
        </div>
      </section>
    </div>
  );
}
