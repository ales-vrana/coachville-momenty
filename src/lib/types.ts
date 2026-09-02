// Datový model webu Momenty (viz zadání v2, kapitola 7).
// V1: data žijí jako JSON soubory ve složce /data a načítají se při buildu.

export type ObjectionCode =
  | "TR1" | "TR2" | "TR4"
  | "C1" | "C2" | "C3" | "C4"
  | "S1" | "S5" | "S7" | "S8"
  | "E2" | "P3" | "P6" | "R7" | "THINK";

export type TopicGroup =
  | "Klienti a peníze"
  | "Já a moje schopnosti"
  | "Důvěra ke škole"
  | "Riziko a rozhodnutí";

export interface Topic {
  id: string; // slug
  label: string; // otázka v první osobě, jazyk zájemce
  group: TopicGroup;
  codes: ObjectionCode[]; // interní kódy kořenů námitek
  description?: string; // pro redakci a LLM: co sem patří
  order: number;
  featuredMomentId?: string; // ruční výběr první karty
  ctaText?: string;
}

export type ConsentStatus = "none" | "requested" | "granted" | "revoked";
export type NameMode = "full" | "initial" | "pseudonym";
export type Phase =
  | "rozhoduji se"
  | "v ACC výcviku"
  | "ACC"
  | "v PCC výcviku"
  | "PCC"
  | "profesionální kouč bez credentialu"
  | "neuvedeno";
export type RegionType = "velkoměsto" | "krajské město" | "malé město" | "venkov" | "neuvedeno";
export type AgeBand = "do 35" | "35 až 49" | "50+" | "neuvedeno";
export type ProfessionCat =
  | "školství"
  | "zdravotnictví, péče a sociální služby"
  | "úřad a administrativa"
  | "manažer / vedoucí"
  | "OSVČ a podnikání"
  | "HR a personalistika"
  | "IT a technika"
  | "rodičovská, jiné"
  | "neuvedeno";

export interface VerifyLink {
  type: "ICF" | "ARES" | "LinkedIn" | "web" | "jiné";
  url: string;
  label?: string;
}

export interface TimelinePoint {
  label: string; // např. "Start výcviku"
  text: string; // např. "září 2024, financování na splátky"
}

export interface Guest {
  slug: string;
  displayName: string; // podle nameMode, už hotové zobrazení
  nameMode: NameMode;
  photo?: string; // /public cesta nebo URL; když chybí, avatar s iniciálami
  consentStatus: ConsentStatus;
  consentScope: {
    moments: boolean;
    name: boolean;
    photo: boolean;
    contact: boolean;
    amounts: boolean;
    ads: boolean;
  };
  consentDate?: string;
  phaseAtRecording: Phase;
  monthsInTraining?: number; // v době natáčení
  phaseNow?: Phase;
  phaseNowDate?: string;
  priorProfessionText: string; // "učitelka ZŠ"
  priorProfessionCat: ProfessionCat;
  city?: string; // "Kadaň" (jen se souhlasem)
  regionType: RegionType;
  ageBand?: AgeBand;
  gender?: "žena" | "muž";
  verifyLinks: VerifyLink[]; // aspoň jeden mimo domény CoachVille
  contactAllowed: boolean;
  contactUrl?: string; // mailto: nebo URL
  rewardReceived: boolean; // dostal za rozhovor odměnu
  worksForSchool: boolean;
  timeline: TimelinePoint[];
}

export interface Chapter {
  t: number; // sekundy
  title: string;
}

export interface Episode {
  slug: string;
  title: string;
  guestSlugs: string[];
  vimeoId: string;
  vimeoHash?: string; // u unlisted videí část za lomítkem
  vimeoUrl: string;
  thumbnailUrl?: string;
  recordedAt: string; // YYYY-MM-DD
  durationS?: number;
  interviewerName: string;
  interviewerRole: string; // "zakladatel CoachVille" / "absolvent"
  format: "rozhovor" | "panel";
  status: "draft" | "review" | "published" | "unpublished";
  chapters: Chapter[];
  transcriptFile: string; // data/transcripts/<slug>.json
}

export interface Utterance {
  i: number; // index promluvy
  t: number; // start v sekundách
  speaker: string; // jméno mluvčího podle transkriptu
  text: string;
}

export interface Transcript {
  episode: string;
  utterances: Utterance[];
}

export type ProofElement = "číslo" | "čas" | "situace" | "obrat" | "cena";
export type Strength = "silný" | "střední" | "slabý";

export interface Moment {
  id: string; // 5 znaků
  episode: string; // episode slug
  guest: string; // guest slug
  startUtt: number; // index první promluvy
  endUtt: number; // index poslední promluvy (včetně)
  quote: string; // doslovně z transkriptu (spojené promluvy hosta)
  summary: string; // jedna věta bez žargonu, píše redaktor
  proofElements: ProofElement[];
  evidenceLevel: 2 | 3 | 4 | 5 | 7;
  hasNumber: boolean;
  numberText?: string;
  isAdmission: boolean;
  costText?: string; // povinné u přiznání
  monthsFromStart?: number;
  hoursPerWeek?: number;
  topics: string[]; // 1 až 3 topic id, první je primární
  thirdPartyName: boolean;
  status: "candidate" | "approved" | "rejected" | "published" | "unpublished";
  editorNote?: string;
}

export interface Collection {
  slug: string;
  title: string;
  intro: string;
  audience: "zájemce" | "partner" | "obchodnice";
  momentIds: string[];
  sendWhen?: string;
  status: "draft" | "published";
}

export interface Workshop {
  date: string; // YYYY-MM-DD
  time?: string;
  price: number;
  url: string;
  label?: string;
}

export interface Salesperson {
  code: string; // krátký kód do URL sady, např. "nela"
  name: string;
  email?: string;
  sms?: string;
}

// Odvozené objekty pro rendering
export interface MomentView extends Moment {
  start: number;
  end: number;
  durationS: number;
  utterances: Utterance[];
  guestData: Guest;
  episodeData: Episode;
  strength: Strength;
  primaryTopic: Topic;
  secondaryTopics: Topic[];
}
