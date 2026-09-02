# Momenty · CoachVille

Web s videodůkazy: nesestříhané rozhovory se studenty a absolventy CoachVille, rozsekané na momenty podle otázek, které si zájemci kladou (kořeny námitek ze sales playbooku). Zadání v2 je v projektu MARKETING SKOLA (`claude/zadani-web-videodukazy-momenty.md`).

Verze 1: **data žijí v repu** (složka `data/`), žádná databáze, žádné AI v aplikaci. Nový podcast = přidat JSON soubory a pushnout; Vercel nasadí sám. Analýza transkriptu na momenty se dělá zatím mimo aplikaci (Claude v Cowork), stránka s nahráním a AI přijde ve v1.1.

## Stack

Next.js 16 (App Router, statické stránky), Tailwind 4, Vimeo Player SDK, TypeScript. Hosting Vercel. Video hraje z Vimea (unlisted videa s hashem).

## Struktura dat

| Soubor | Co je uvnitř |
|---|---|
| `data/site.json` | název, baseUrl, prahy publikace, čísla ze skladu důkazů, patička |
| `data/topics.json` | 20 témat (otázka v první osobě + kód kořene námitky) |
| `data/guests/<slug>.json` | host: jméno, souhlasy, předchozí povolání, město, fáze, ověřovací odkazy, časová osa |
| `data/episodes/<slug>.json` | rozhovor: vimeoId + vimeoHash, datum, tazatel, kapitoly, status |
| `data/transcripts/raw/<slug>.txt` | původní transkript (čas + mluvčí + text) |
| `data/transcripts/<slug>.json` | transkript rozparsovaný na promluvy (generuje skript) |
| `data/moments/<slug>.json` | momenty: rozsah promluv, doslovná citace, shrnutí, témata, prvky důkazu |
| `data/collections.json` | sbírky (Pro partnera, Horní police) |
| `data/workshops.json` | nejbližší workshop pro CTA (datum, cena, odkaz) |
| `data/salespeople.json` | kódy obchodnic do odkazů sad `/v/#m=...&o=kod` |
| `data/inventory-start-coachville.json` | inventář 32 existujících rozhovorů ze start.coachville.cz |
| `content/*.md` | texty stránek Podmínky poctivě a Otázky pro hosty |

Moment se zobrazí jen když: `status: "published"`, epizoda `status: "published"`, host `consentStatus: "granted"`. Téma se zobrazí, když má aspoň `minMomentsPerTopic` momentů od `minGuestsPerTopic` lidí (`data/site.json`, pro ladění nastaveno 1/1, cíl podle zadání 3/2).

## Přidání nového rozhovoru (runbook)

1. **Video na Vimeu.** Z embed kódu vezměte `player.vimeo.com/video/ID?h=HASH`. Pokud je video omezené na domény, přidejte ve Vimeu (Settings → Privacy → Where can this be embedded) doménu webu, např. `coachville-momenty.vercel.app` a `*.vercel.app`.
2. **Host.** Vytvořte `data/guests/<slug>.json` (vzor `jana-ukazkova.json`). Bez `consentStatus: "granted"` se nic nezobrazí. Aspoň jeden ověřovací odkaz mimo domény CoachVille (ICF, ARES, LinkedIn).
3. **Epizoda.** Vytvořte `data/episodes/<slug>.json` (vzor `ukazka.json`), zatím `status: "draft"`.
4. **Transkript.** Uložte `.txt` do `data/transcripts/raw/<slug>.txt` a spusťte
   `npm run parse -- data/transcripts/raw/<slug>.txt <slug>`
   Podporované řádky: `00:28:56 Jméno` (text na dalších řádcích) nebo `[28:56] Jméno: text`.
5. **Momenty.** Vytvořte `data/moments/<slug>.json`. Každý moment: `startUtt`/`endUtt` = indexy promluv z transkriptu, `quote` = doslovný text promluv, `summary` = jedna věta bez žargonu, 1 až 3 `topics`, `proofElements` (číslo, čas, situace, obrat, cena), `isAdmission` + `costText` u přiznání. Pravidla: bez přiznání s cenou se host nezveřejňuje; moment s méně než 3 prvky důkazu dostane štítek „názor“.
6. **Kontrola.** `npm run validate` (spouští se i před buildem, chyba zastaví nasazení).
7. **Publikace.** Nastavte `status: "published"` u epizody i momentů, u tématu případně `featuredMomentId` (první karta), commit + push. Vercel nasadí do 2 minut.

## Odvolání souhlasu

`consentStatus: "revoked"` u hosta → push. Host, jeho stránka i momenty zmizí z buildu. Pak: smazat nebo zamknout video na Vimeu, u sdílených odkazů požádat Facebook Sharing Debugger o re-scrape.

## Odkazy

- Téma: `/tema/<id>` · Moment: `/m/<id>` · Host: `/host/<slug>` · Celý rozhovor: `/podcast/<slug>?t=1834` nebo `?m=<id>`
- Sada pro obchodnice (nic se neukládá): `/v/#m=id1,id2,id3&o=nela`
- Moment z e-mailu: `/m/<id>?ref=email` (video startuje ztlumené s tlačítkem Zapnout zvuk)
- Moment pro partnera: `/m/<id>?ref=partner` (bez nabídky workshopu)

## Lokální vývoj

```bash
npm install
npm run dev        # http://localhost:3000
npm run validate   # kontrola dat
npm run build      # produkční build (spustí validaci)
```

Volitelně `NEXT_PUBLIC_GA_ID` ve Vercel env pro GA4 (bez něj se nic neměří).

## Co je ve v1 a co ne

Ve v1: témata, momenty s přepisem a skokem na čas, zastavení na konci momentu, stránky hostů a rozhovorů, sady pro obchodnice, sbírka Pro partnera, Podmínky poctivě, Otázky pro hosty, OG obrázky, JSON-LD, sitemap, CTA po dvou dokončených momentech.
Není ve v1 (v1.1 a dál): nahrání transkriptu a AI analýza v aplikaci, filtry podobnosti, tagování do ActiveCampaign, ukládání sad a zápis do Pipedrive, klipy pro reklamu, VTT titulky.
