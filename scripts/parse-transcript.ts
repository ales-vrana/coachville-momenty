/**
 * Parser transkriptu .txt → data/transcripts/<slug>.json
 *
 * Podporované formáty řádků:
 *   00:28:56 Speaker 1            (tl;dv: čas + mluvčí na řádku, text na dalších řádcích)
 *   00:28:56 Jana Nováková
 *   [00:28:56] Jana: text promluvy (čas, mluvčí a text na jednom řádku)
 *   28:56 CoachVille: text
 *
 * Použití:  npx tsx scripts/parse-transcript.ts data/transcripts/raw/<slug>.txt <slug> [--interviewer "CoachVille"]
 */
import fs from "node:fs";
import path from "node:path";

interface Utterance {
  i: number;
  t: number;
  speaker: string;
  text: string;
}

const TIME_RE = /^\s*\[?(\d{1,2}):(\d{2})(?::(\d{2}))?\]?\s*(.*)$/;

function toSeconds(a: string, b: string, c?: string): number {
  if (c !== undefined) return Number(a) * 3600 + Number(b) * 60 + Number(c);
  return Number(a) * 60 + Number(b);
}

function looksLikeSpeaker(s: string): boolean {
  const words = s.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 4) return false;
  if (/[.!?…]$/.test(s.trim())) return false;
  return true;
}

export function parseTranscript(raw: string): Utterance[] {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  const out: Utterance[] = [];
  let current: Utterance | null = null;
  let lastSpeaker = "neznámý";

  for (const line of lines) {
    const m = line.match(TIME_RE);
    if (m) {
      const t = toSeconds(m[1], m[2], m[3]);
      const rest = (m[4] ?? "").trim();
      let speaker = lastSpeaker;
      let text = "";
      const colon = rest.indexOf(":");
      if (colon > 0 && looksLikeSpeaker(rest.slice(0, colon))) {
        speaker = rest.slice(0, colon).trim();
        text = rest.slice(colon + 1).trim();
      } else if (rest && looksLikeSpeaker(rest)) {
        speaker = rest;
      } else {
        text = rest;
      }
      lastSpeaker = speaker;
      current = { i: out.length, t, speaker, text };
      out.push(current);
      continue;
    }
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (!current) {
      current = { i: out.length, t: 0, speaker: lastSpeaker, text: trimmed };
      out.push(current);
    } else {
      current.text = current.text ? `${current.text} ${trimmed}` : trimmed;
    }
  }
  return out.filter((u) => u.text.length > 0).map((u, i) => ({ ...u, i }));
}

function main() {
  const [, , input, slug, ...rest] = process.argv;
  if (!input || !slug) {
    console.error("Použití: npx tsx scripts/parse-transcript.ts <soubor.txt> <episode-slug>");
    process.exit(1);
  }
  const raw = fs.readFileSync(input, "utf8");
  const utterances = parseTranscript(raw);
  const speakers = new Map<string, number>();
  for (const u of utterances) speakers.set(u.speaker, (speakers.get(u.speaker) ?? 0) + 1);
  const outFile = path.join(process.cwd(), "data", "transcripts", `${slug}.json`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify({ episode: slug, utterances }, null, 2));
  const last = utterances[utterances.length - 1];
  console.log(`OK: ${utterances.length} promluv, mluvčí: ${[...speakers.entries()].map(([s, n]) => `${s} (${n})`).join(", ")}`);
  console.log(`Poslední promluva začíná v ${last ? last.t : 0} s. Zapsáno: ${outFile}`);
  if (rest.length) console.log("Ignorované argumenty:", rest.join(" "));
}

if (process.argv[1] && process.argv[1].endsWith("parse-transcript.ts")) main();
