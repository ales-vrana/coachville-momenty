import fs from "node:fs";
import path from "node:path";
import type {
  Collection,
  Episode,
  Guest,
  Moment,
  MomentView,
  Salesperson,
  Strength,
  Topic,
  Transcript,
  Utterance,
  Workshop,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

function readJson<T>(rel: string): T {
  const file = path.join(DATA_DIR, rel);
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function readDir<T>(rel: string): T[] {
  const dir = path.join(DATA_DIR, rel);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as T);
}

export interface SiteConfig {
  siteName: string;
  tagline: string;
  baseUrl: string;
  publishing: {
    minMomentsPerTopic: number;
    minGuestsPerTopic: number;
    requireExternalVerifyLink: boolean;
    requireAdmission: boolean;
    note?: string;
  };
  community: {
    coachesTotal: number;
    coachesWithStrongProof: number;
    coachesWithoutStrongProof: number;
    writtenProofs: number;
    hardBusinessProofs: number;
    sentence: string;
  };
  links: { coachReviews: string; clientReferences: string; questionsPage: string };
  footer: { operator: string; consentNote: string };
  partnerVideo: { vimeoId: string; vimeoHash?: string; title: string; note: string };
  contactCta: { heading: string; text: string; button: string; url: string };
}

// ---------- základní načtení ----------

export const site: SiteConfig = readJson<SiteConfig>("site.json");

export function getTopics(): Topic[] {
  return readJson<Topic[]>("topics.json").sort((a, b) => a.order - b.order);
}

export function getGuests(): Guest[] {
  return readDir<Guest>("guests");
}

export function getEpisodes(): Episode[] {
  return readDir<Episode>("episodes");
}

export function getTranscript(episodeSlug: string): Transcript | null {
  const file = path.join(DATA_DIR, "transcripts", `${episodeSlug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as Transcript;
}

export function getRawMoments(): Moment[] {
  return readDir<Moment[]>("moments").flat();
}

export function getCollections(): Collection[] {
  return readJson<Collection[]>("collections.json");
}

export function getWorkshops(): Workshop[] {
  const today = new Date().toISOString().slice(0, 10);
  return readJson<Workshop[]>("workshops.json")
    .filter((w) => w.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getNextWorkshop(): Workshop | null {
  return getWorkshops()[0] ?? null;
}

export function getSalespeople(): Salesperson[] {
  return readJson<Salesperson[]>("salespeople.json");
}

// ---------- pomocné ----------

export function strengthOf(m: Moment): Strength {
  const n = m.proofElements.length;
  if (n >= 4) return "silný";
  if (n === 3) return "střední";
  return "slabý";
}

const COACHVILLE_DOMAINS = ["coachville", "zivotjakohra"];

export function hasExternalVerifyLink(g: Guest): boolean {
  return g.verifyLinks.some(
    (l) => !COACHVILLE_DOMAINS.some((d) => l.url.toLowerCase().includes(d))
  );
}

export function guestIsPublishable(g: Guest): boolean {
  if (g.consentStatus !== "granted" || !g.consentScope.moments) return false;
  if (site.publishing.requireExternalVerifyLink && !hasExternalVerifyLink(g)) return false;
  return true;
}

export function formatTime(s: number): string {
  const total = Math.max(0, Math.floor(s));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? h + ":" : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

export function formatDuration(s: number): string {
  const total = Math.max(1, Math.round(s));
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function formatDateCz(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m) return iso;
  return d ? `${d}. ${m}. ${y}` : `${m}/${y}`;
}

export function phaseLabel(g: Guest): string {
  const parts: string[] = [];
  if (g.monthsInTraining) parts.push(`${g.monthsInTraining}. měsíc od startu`);
  else if (g.phaseAtRecording && g.phaseAtRecording !== "neuvedeno") parts.push(g.phaseAtRecording);
  return parts.join(", ");
}

export function whereLabel(g: Guest): string {
  if (g.city && g.consentScope.name) return g.regionType !== "neuvedeno" ? `${g.city} (${g.regionType})` : g.city;
  return g.regionType !== "neuvedeno" ? g.regionType : "";
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// ---------- odvozené pohledy ----------

let cache: MomentView[] | null = null;

export function getMomentViews(): MomentView[] {
  if (cache) return cache;
  const topics = getTopics();
  const topicById = new Map(topics.map((t) => [t.id, t]));
  const guests = new Map(getGuests().map((g) => [g.slug, g]));
  const episodes = new Map(getEpisodes().map((e) => [e.slug, e]));
  const transcripts = new Map<string, Transcript | null>();

  const views: MomentView[] = [];
  for (const m of getRawMoments()) {
    if (m.status !== "published") continue;
    const ep = episodes.get(m.episode);
    const g = guests.get(m.guest);
    if (!ep || !g) continue;
    if (ep.status !== "published") continue;
    if (!guestIsPublishable(g)) continue;
    if (!transcripts.has(ep.slug)) transcripts.set(ep.slug, getTranscript(ep.slug));
    const tr = transcripts.get(ep.slug);
    if (!tr) continue;
    const utts = tr.utterances.slice(m.startUtt, m.endUtt + 1);
    if (utts.length === 0) continue;
    const start = utts[0].t;
    const after = tr.utterances[m.endUtt + 1];
    const end = after ? after.t : ep.durationS ?? start + 90;
    const primaryTopic = topicById.get(m.topics[0]);
    if (!primaryTopic) continue;
    const secondaryTopics = m.topics
      .slice(1)
      .map((id) => topicById.get(id))
      .filter((t): t is Topic => Boolean(t));
    views.push({
      ...m,
      start,
      end,
      durationS: Math.max(1, end - start),
      utterances: utts,
      guestData: g,
      episodeData: ep,
      strength: strengthOf(m),
      primaryTopic,
      secondaryTopics,
    });
  }
  cache = views;
  return views;
}

export function getMoment(id: string): MomentView | null {
  return getMomentViews().find((m) => m.id === id) ?? null;
}

const STRENGTH_RANK: Record<Strength, number> = { silný: 0, střední: 1, slabý: 2 };

export function getMomentsForTopic(topicId: string): MomentView[] {
  const topic = getTopics().find((t) => t.id === topicId);
  const all = getMomentViews().filter((m) => m.topics.includes(topicId));
  all.sort((a, b) => {
    const pa = a.topics[0] === topicId ? 0 : 1;
    const pb = b.topics[0] === topicId ? 0 : 1;
    if (pa !== pb) return pa - pb;
    const sa = STRENGTH_RANK[a.strength];
    const sb = STRENGTH_RANK[b.strength];
    if (sa !== sb) return sa - sb;
    return b.episodeData.recordedAt.localeCompare(a.episodeData.recordedAt);
  });
  if (topic?.featuredMomentId) {
    const idx = all.findIndex((m) => m.id === topic.featuredMomentId);
    if (idx > 0) {
      const [f] = all.splice(idx, 1);
      all.unshift(f);
    }
  }
  return all;
}

export interface TopicStats {
  topic: Topic;
  moments: number;
  guests: number;
  published: boolean;
}

export function getTopicStats(): TopicStats[] {
  const { minMomentsPerTopic, minGuestsPerTopic } = site.publishing;
  return getTopics().map((topic) => {
    const ms = getMomentViews().filter((m) => m.topics.includes(topic.id));
    const guests = new Set(ms.map((m) => m.guest)).size;
    return {
      topic,
      moments: ms.length,
      guests,
      published: !topic.hidden && ms.length >= minMomentsPerTopic && guests >= minGuestsPerTopic,
    };
  });
}

export function getPublishedTopics(): TopicStats[] {
  return getTopicStats().filter((t) => t.published);
}

export function getNextMoment(current: MomentView): MomentView | null {
  const list = getMomentsForTopic(current.topics[0]);
  const idx = list.findIndex((m) => m.id === current.id);
  if (idx === -1) return list[0] ?? null;
  return list[(idx + 1) % list.length] && list.length > 1 ? list[(idx + 1) % list.length] : null;
}

export function getRelatedMoments(current: MomentView, limit = 5): MomentView[] {
  return getMomentsForTopic(current.topics[0])
    .filter((m) => m.id !== current.id)
    .slice(0, limit);
}

export function getGuest(slug: string): Guest | null {
  return getGuests().find((g) => g.slug === slug) ?? null;
}

export function getEpisode(slug: string): Episode | null {
  return getEpisodes().find((e) => e.slug === slug) ?? null;
}

export function getMomentsForGuest(slug: string): MomentView[] {
  return getMomentViews().filter((m) => m.guest === slug);
}

export function getMomentsForEpisode(slug: string): MomentView[] {
  return getMomentViews()
    .filter((m) => m.episode === slug)
    .sort((a, b) => a.start - b.start);
}

export function getPublishedGuests(): Guest[] {
  const withMoments = new Set(getMomentViews().map((m) => m.guest));
  return getGuests().filter((g) => guestIsPublishable(g) && withMoments.has(g.slug));
}

export function getPublishedEpisodes(): Episode[] {
  const withMoments = new Set(getMomentViews().map((m) => m.episode));
  return getEpisodes().filter((e) => e.status === "published" && withMoments.has(e.slug));
}

export interface Denominator {
  hosts: number;
  moments: number;
  episodes: number;
}

export function getDenominator(): Denominator {
  return {
    hosts: getPublishedGuests().length,
    moments: getMomentViews().length,
    episodes: getPublishedEpisodes().length,
  };
}

/** Agregát pro řádek „Kolik to stálo je“ na stránce tématu. */
export function getCostLine(moments: MomentView[]): string | null {
  const hours = moments.map((m) => m.hoursPerWeek).filter((h): h is number => typeof h === "number");
  const months = moments.map((m) => m.monthsFromStart).filter((h): h is number => typeof h === "number");
  const parts: string[] = [];
  if (hours.length) {
    const a = Math.min(...hours);
    const b = Math.max(...hours);
    parts.push(a === b ? `${a} h týdně` : `${a} až ${b} h týdně`);
  }
  if (months.length) {
    const a = Math.min(...months);
    const b = Math.max(...months);
    parts.push(a === b ? `mluví o ${a}. měsíci od startu` : `mluví o ${a}. až ${b}. měsíci od startu`);
  }
  return parts.length ? parts.join(", ") : null;
}

export function getUtteranceText(u: Utterance[]): string {
  return u.map((x) => x.text).join(" ");
}
