/**
 * Validátor dat: npx tsx scripts/validate.ts
 * Kontroluje momenty proti transkriptům, taxonomii a redakčním pravidlům ze zadání v2.
 * Chyby = build by neměl proběhnout. Varování = redakce má vědět.
 */
import fs from "node:fs";
import path from "node:path";

const DATA = path.join(process.cwd(), "data");
const readJson = (p: string) => JSON.parse(fs.readFileSync(p, "utf8"));
const readDir = (dir: string) =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".json"))
        .map((f) => readJson(path.join(dir, f)))
    : [];

const errors: string[] = [];
const warnings: string[] = [];

const site = readJson(path.join(DATA, "site.json"));
const topics = readJson(path.join(DATA, "topics.json")) as { id: string; codes?: string[] }[];
const rootCodes = new Set((readJson(path.join(DATA, "roots.json")).roots as { code: string }[]).map((r) => r.code));
for (const t of topics) for (const c of t.codes ?? []) if (!rootCodes.has(c)) errors.push(`téma ${t.id}: neznámý kód kořene ${c} (viz data/roots.json)`);
const topicIds = new Set(topics.map((t) => t.id));
const guests = readDir(path.join(DATA, "guests")) as Record<string, unknown>[];
const episodes = readDir(path.join(DATA, "episodes")) as Record<string, unknown>[];
const moments = (readDir(path.join(DATA, "moments")) as unknown[][]).flat() as Record<string, unknown>[];

const guestBySlug = new Map(guests.map((g) => [g.slug as string, g]));
const episodeBySlug = new Map(episodes.map((e) => [e.slug as string, e]));

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

const ids = new Set<string>();
const admissionsByGuest = new Map<string, number>();

for (const m of moments) {
  const id = String(m.id);
  const where = `moment ${id}`;
  if (ids.has(id)) errors.push(`${where}: duplicitní id`);
  ids.add(id);
  if (!/^[a-z0-9]{5}$/.test(id)) warnings.push(`${where}: id má mít 5 znaků a-z0-9`);

  const ep = episodeBySlug.get(String(m.episode));
  const g = guestBySlug.get(String(m.guest));
  if (!ep) errors.push(`${where}: neznámá epizoda ${m.episode}`);
  if (!g) errors.push(`${where}: neznámý host ${m.guest}`);

  const topicsOf = (m.topics as string[]) ?? [];
  if (topicsOf.length < 1 || topicsOf.length > 3) errors.push(`${where}: 1 až 3 témata, má ${topicsOf.length}`);
  for (const t of topicsOf) if (!topicIds.has(t)) errors.push(`${where}: neznámé téma ${t}`);

  if (m.isAdmission && !m.costText) errors.push(`${where}: přiznání bez pojmenované ceny (costText)`);
  if (m.isAdmission) admissionsByGuest.set(String(m.guest), (admissionsByGuest.get(String(m.guest)) ?? 0) + 1);

  const pe = (m.proofElements as string[]) ?? [];
  if (m.status === "published" && pe.length < 3) warnings.push(`${where}: publikován s ${pe.length} prvky důkazu (štítek názor)`);
  if (m.hasNumber && !m.numberText) warnings.push(`${where}: hasNumber bez numberText`);

  if (ep) {
    const trFile = path.join(DATA, "transcripts", `${ep.slug}.json`);
    if (!fs.existsSync(trFile)) {
      errors.push(`${where}: chybí transkript ${trFile}`);
    } else {
      const tr = readJson(trFile) as { utterances: { i: number; t: number; speaker: string; text: string }[] };
      const s = Number(m.startUtt);
      const e = Number(m.endUtt);
      if (!(s >= 0 && e >= s && e < tr.utterances.length)) {
        errors.push(`${where}: startUtt/endUtt mimo rozsah (0..${tr.utterances.length - 1})`);
      } else {
        const utts = tr.utterances.slice(s, e + 1);
        const joined = norm(utts.map((u) => u.text).join(" "));
        const q = norm(String(m.quote ?? ""));
        if (!q) errors.push(`${where}: prázdná citace`);
        else if (!joined.includes(q)) errors.push(`${where}: citace není doslovný podřetězec promluv ${s}..${e}`);
        const start = utts[0].t;
        const after = tr.utterances[e + 1];
        const end = after ? after.t : Number(ep.durationS ?? start + 90);
        const dur = end - start;
        if (dur < 20 || dur > 240) warnings.push(`${where}: délka ${Math.round(dur)} s mimo 20 až 240 s`);
        const speakers = new Set(utts.map((u) => u.speaker));
        if (speakers.size > 1) warnings.push(`${where}: úsek obsahuje víc mluvčích (${[...speakers].join(", ")})`);
      }
    }
  }
}

for (const g of guests) {
  const slug = String(g.slug);
  const links = (g.verifyLinks as { url: string }[]) ?? [];
  const external = links.some((l) => !/coachville|zivotjakohra/i.test(l.url));
  if (g.consentStatus === "granted") {
    if (!external) {
      (site.publishing.requireExternalVerifyLink ? errors : warnings).push(`host ${slug}: chybí ověřovací odkaz mimo domény CoachVille`);
    }
    if (!admissionsByGuest.get(slug)) {
      (site.publishing.requireAdmission ? errors : warnings).push(`host ${slug}: nemá žádný moment s přiznáním (téma co-bylo-tezsi nebo koho-bych-odradil)`);
    }
  }
}

for (const e of episodes) {
  for (const gs of (e.guestSlugs as string[]) ?? []) {
    if (!guestBySlug.has(gs)) errors.push(`epizoda ${e.slug}: neznámý host ${gs}`);
  }
  if (!e.vimeoId) errors.push(`epizoda ${e.slug}: chybí vimeoId`);
}

console.log(`Momenty: ${moments.length}, hosté: ${guests.length}, epizody: ${episodes.length}, témata: ${topics.length}`);
for (const w of warnings) console.log(`VAROVÁNÍ  ${w}`);
for (const e of errors) console.log(`CHYBA     ${e}`);
if (errors.length) {
  console.log(`\n${errors.length} chyb, ${warnings.length} varování.`);
  process.exit(1);
}
console.log(`\nOK, 0 chyb, ${warnings.length} varování.`);
