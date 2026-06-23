# Metoda v2 — kurs angielskiego B2→C1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Podnieść kurs angielskiego z oceny 4− na 4+/5 przez drobniejsze działy, twardo egzekwowany recykling (aktywne wydobycie), grubą drugą połowę i warstwę QA — najpierw narzędzia i reguły, potem regeneracja M1 do checkpointu.

**Architecture:** Dwa repozytoria git. (1) Skill `~/.claude/skills/angielski-rozdzial/` (własny git) trzyma reguły metody (`METODA-C1.md`), workflow (`SKILL.md`), montaż audio (`assemble-audio.js`) i NOWY deterministyczny checker recyklingu (`check-recykling.js`). (2) Repo kursu `~/angielski/` (git `main`) trzyma rejestr (`slownik.json`), syllabus (`PROGRAM.md`), działy (`NN-mKdN-slug/rozdzial.md` + PDF + `grupa-N.mp3`) i manifest (`content.json`, generowany z dysku przez `tools/generate.js`). Tryby audio (PL→EN, EN→PL, słuchanka, EN-only) JUŻ istnieją w `assemble-audio.js` — weryfikujemy, nie budujemy.

**Tech Stack:** Node.js (CommonJS w skillu, ESM w `tools/generate.js`), `node:assert` do testów (wzorzec: `test-assemble-audio.js`), `ffmpeg` do audio, OpenAI `gpt-4o-mini-tts` (głosy nova/alloy), `make-pdf` skill, agenci-recenzenci (Task tool, model Opus).

## Global Constraints

- **Audio = wyłącznie OpenAI TTS.** PL = `nova`, EN = `alloy`. Tryby słuchanka/en-only: tylko `alloy`. **ElevenLabs ZAKAZANY** poza świadomym opt-in (`ELEVEN_TTS=1`); kod już domyślnie wyłącza. Nie zmieniaj domyślnej ścieżki na ElevenLabs.
- **Model agentów: Opus** (`opus`) dla każdego subagenta/recenzenta. „opus only".
- **Wariant języka:** General American. Sufit rejestru: neutralna amerykańszczyzna, bez slangu na siłę, ≤1–2 „(luźno)"/grupa.
- **Wierność PL↔EN:** ogólność↔konkretność musi się zgadzać (reguła „someone vs parents").
- **Kontrakt parsera audio (NIENARUSZALNY):** tabele `| polski | angielski |`, nagłówki dokładnie `## Grupa N`, jedna grupa = jeden `grupa-N.mp3`, sekcja `## Nowe słowa i struktury` poza audio, markery `<!-- mode: ... -->` pod nagłówkiem grupy. Surowy `|` w treści escapuj `\|`.
- **Schemat `slownik.json`:** tylko `{id, pl, en, typ, intro, review[]}` — bez nowych pól. Długość `review[]` JEST budżetem powrotów.
- **Numeracja folderów:** globalna 2-cyfrowa (`01`–`55`) + slug `mKdN` (np. `03-m1d3-...`). `generate.js` wymaga prefiksu `^\d{2}-`.
- **Commity:** osobno per repo (`git -C <dir>`). Częste, małe.

---

## File Structure

**Tworzone:**
- `~/.claude/skills/angielski-rozdzial/check-recykling.js` — deterministyczny licznik powrotów.
- `~/.claude/skills/angielski-rozdzial/test-check-recykling.js` — testy checkera.

**Modyfikowane (skill):**
- `~/.claude/skills/angielski-rozdzial/assemble-audio.js` — idempotencja (skip-jeśli-mp3-istnieje), dostrojenie pauzy słuchanki.
- `~/.claude/skills/angielski-rozdzial/test-assemble-audio.js` — testy idempotencji.
- `~/.claude/skills/angielski-rozdzial/METODA-C1.md` — reguły v2.
- `~/.claude/skills/angielski-rozdzial/SKILL.md` — workflow v2 (11 działów, checker, fix nieaktualnego tekstu audio).

**Modyfikowane (kurs):**
- `~/angielski/slownik.json` — `review[]` przeliczone na siatkę 11-działową, rozszerzone do budżetu.
- `~/angielski/PROGRAM.md` — 30→55, 6→11, mapa M1.
- `~/angielski/content.json` — regenerowany z dysku (`node tools/generate.js`).
- `~/angielski/01..06-*` — **skasowane** (stary M1).
- `~/angielski/01..11-m1*` — **nowy** M1 (generowany).

---

## Task 1: Deterministyczny checker recyklingu (`check-recykling.js`)

Najważniejsze narzędzie — zamienia „obietnicę w slowniku" w twardy, obiektywny warunek. Czyta `slownik.json`, dla zadanego działu zbiera wyrażenia z `intro`==dział lub `review[]`∋dział, i sprawdza, czy faktycznie są w `rozdzial.md`. Reużywa `parseChapter` z `assemble-audio.js`.

**Files:**
- Create: `~/.claude/skills/angielski-rozdzial/check-recykling.js`
- Test: `~/.claude/skills/angielski-rozdzial/test-check-recykling.js`

**Interfaces:**
- Consumes: `parseChapter(md)` z `./assemble-audio` (zwraca `[{n, pairs:[{pl,en}], mode}]`).
- Produces: `keywords(en) -> string[]`, `lineHasAll(lineWords, kws) -> bool`, `countOccurrences(groups, kws) -> {lines, groups}`, `check(mdPath, dzialId, slownikPath) -> [{id, en, isIntro, lines, groupsHit, present, clustered}]`. CLI: `node check-recykling.js <rozdzial.md> <dzial-id> [--slownik <path>]`, exit 1 gdy brak wymaganego powrotu, 0 gdy PASS.

- [ ] **Step 1: Write the failing test**

Create `~/.claude/skills/angielski-rozdzial/test-check-recykling.js`:

```js
const assert = require('assert');
const { keywords, lineHasAll, countOccurrences, check } = require('./check-recykling');
const fs = require('fs');
const os = require('os');
const path = require('path');

let passed = 0;
function ok(cond, msg) { assert.ok(cond, msg); console.log('  ✓', msg); passed++; }

// --- keywords: drop "to"/articles/copula/light-verbs/possessives, keep particles ---
assert.deepStrictEqual(keywords('to be on the fence (about)'), ['on', 'fence']);
ok(true, 'keywords: "to be on the fence (about)" -> [on, fence]');
assert.deepStrictEqual(keywords('to head back / to head home'), ['head', 'back']);
ok(true, 'keywords: first "/" variant only -> [head, back]');
assert.deepStrictEqual(keywords('to have mixed feelings (about)'), ['mixed', 'feelings']);
ok(true, 'keywords: drops light verb "have" -> [mixed, feelings]');

// --- lineHasAll: 3-char stem prefix match, all keywords in one line ---
ok(lineHasAll('i am on the fence about it'.split(' '), ['on', 'fence']), 'lineHasAll: present');
ok(lineHasAll('we are wrapping up the project'.split(' '), ['wrap', 'up']), 'lineHasAll: conjugated (wrapping~wrap)');
ok(!lineHasAll('i love this city'.split(' '), ['on', 'fence']), 'lineHasAll: absent -> false');

// --- countOccurrences across groups ---
const groups = [
  { n: 1, pairs: [{ pl: 'x', en: "I'm on the fence." }, { pl: 'y', en: 'I love it.' }] },
  { n: 2, pairs: [{ pl: 'z', en: 'Still on the fence about Kraków.' }] },
];
const c = countOccurrences(groups, ['on', 'fence']);
ok(c.lines === 2 && c.groups === 2, 'countOccurrences: 2 linie w 2 grupach');

// --- check(): missing expression -> not present; intro -> flagged isIntro ---
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chk-'));
const md = `# T\n\n## Grupa 1\n| polski | angielski |\n|---|---|\n| Waham się. | I'm on the fence. |\n| Domykam. | I'm wrapping up. |\n`;
const mdPath = path.join(tmp, 'rozdzial.md');
fs.writeFileSync(mdPath, md);
const slownik = { wyrazenia: [
  { id: 'on-the-fence', en: 'to be on the fence (about)', intro: 'm1-d3', review: ['m1-d4'] },
  { id: 'wrap-up', en: 'to wrap up', intro: 'm1-d1', review: ['m1-d3'] },
  { id: 'sleep-on-it', en: 'to sleep on it', intro: 'm1-d2', review: ['m1-d3'] },
] };
const slownikPath = path.join(tmp, 'slownik.json');
fs.writeFileSync(slownikPath, JSON.stringify(slownik));
const res = check(mdPath, 'm1-d3', slownikPath);
const byId = Object.fromEntries(res.map((r) => [r.id, r]));
ok(byId['on-the-fence'].isIntro === true, 'check: on-the-fence oznaczone jako INTRO w m1-d3');
ok(byId['wrap-up'].present === true, 'check: wrap-up (review) obecne');
ok(byId['sleep-on-it'].present === false, 'check: sleep-on-it (review) BRAK — wykryte');

console.log(`\n${passed} assertions passed`);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node ~/.claude/skills/angielski-rozdzial/test-check-recykling.js`
Expected: FAIL — `Cannot find module './check-recykling'`.

- [ ] **Step 3: Write minimal implementation**

Create `~/.claude/skills/angielski-rozdzial/check-recykling.js`:

```js
'use strict';
// Deterministyczny checker recyklingu. Sprawdza, czy wyrażenia, które wg
// slownik.json MAJĄ wrócić w danym dziale (intro==dział lub review[]∋dział),
// faktycznie są w rozdzial.md. Hybryda ze skryptem zdejmuje subiektywność
// z recenzenta C (który dalej ocenia: wydobycie vs ekspozycja, rotacja partnera).
// Ograniczenie: prefiks 3-znakowy nie łapie czasowników nieregularnych
// (go↔went) — recenzent C jest backstopem.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { parseChapter } = require('./assemble-audio');

// Słowa-funkcyjne, które NIE przeżywają odmiany/użycia (drop). Przyimki i
// partykuły (on/up/out/back/over/off/in/with/for) ZOSTAJĄ — pojawiają się w użyciu.
const DROP = new Set(['to', 'a', 'an', 'the', 'be', 'is', 'are', 'am', 'was', 'were',
  'been', 'being', 'have', 'has', 'had', 'get', 'gets', 'got', 'getting',
  'my', 'your', 'his', 'her', 'our', 'their', 'its', 'it']);

function words(s) {
  return s.toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z\s]/g, ' ')
    .split(/\s+/).filter(Boolean);
}

// Klucze z pola `en` (pierwszy wariant przed "/"), bez słów-funkcyjnych.
function keywords(en) {
  const firstVariant = en.split('/')[0];
  return words(firstVariant).filter((w) => !DROP.has(w));
}

const stem = (w) => w.slice(0, 3);

// Wszystkie klucze obecne w JEDNEJ linii (prefiks 3-znakowy w obie strony)?
function lineHasAll(lineWords, kws) {
  return kws.every((kw) => {
    const s = stem(kw);
    return lineWords.some((w) => w.startsWith(s) || s.startsWith(w.slice(0, 3)));
  });
}

function countOccurrences(groups, kws) {
  let lines = 0;
  const groupsHit = new Set();
  for (const g of groups) {
    for (const pair of g.pairs) {
      const lw = words(pair.en + ' ' + pair.pl);
      if (lineHasAll(lw, kws)) { lines++; groupsHit.add(g.n); }
    }
  }
  return { lines, groups: groupsHit.size };
}

function check(mdPath, dzialId, slownikPath) {
  const groups = parseChapter(fs.readFileSync(mdPath, 'utf8'));
  const slownik = JSON.parse(fs.readFileSync(slownikPath, 'utf8'));
  const expected = slownik.wyrazenia.filter(
    (e) => e.intro === dzialId || (e.review || []).includes(dzialId));
  return expected.map((e) => {
    const kws = keywords(e.en);
    const { lines, groups: gh } = countOccurrences(groups, kws);
    return { id: e.id, en: e.en, isIntro: e.intro === dzialId, kws,
      lines, groupsHit: gh, present: lines > 0, clustered: gh === 1 && lines > 2 };
  });
}

function main() {
  const args = process.argv.slice(2);
  const [mdPath, dzialId] = args;
  const sIdx = args.indexOf('--slownik');
  const slownikPath = sIdx >= 0 ? args[sIdx + 1]
    : path.join(os.homedir(), 'angielski', 'slownik.json');
  if (!mdPath || !dzialId) {
    console.error('usage: node check-recykling.js <rozdzial.md> <dzial-id> [--slownik <path>]');
    process.exit(2);
  }
  const res = check(mdPath, dzialId, slownikPath);
  console.log(`Recykling w ${dzialId}: ${res.length} wymaganych wyrażeń`);
  for (const r of res) {
    const tag = r.isIntro ? 'INTRO' : (r.present ? 'OK' : 'BRAK');
    console.log(`  [${tag}] ${r.id} (${r.en}) — ${r.lines} linii / ${r.groupsHit} grup`);
  }
  const clustered = res.filter((r) => r.clustered);
  if (clustered.length) console.log('UWAGA klaster (>2 w 1 grupie): ' + clustered.map((r) => r.id).join(', '));
  const missing = res.filter((r) => !r.present && !r.isIntro);
  if (missing.length) { console.error(`FAIL: brak powrotów: ${missing.map((m) => m.id).join(', ')}`); process.exit(1); }
  console.log('PASS: wszystkie zaplanowane powroty obecne.');
}

module.exports = { keywords, stem, lineHasAll, countOccurrences, check };
if (require.main === module) main();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node ~/.claude/skills/angielski-rozdzial/test-check-recykling.js`
Expected: PASS — `13 assertions passed`.

- [ ] **Step 5: Commit (repo skilla)**

```bash
git -C ~/.claude/skills/angielski-rozdzial add check-recykling.js test-check-recykling.js
git -C ~/.claude/skills/angielski-rozdzial commit -m "feat: deterministyczny checker recyklingu (check-recykling.js)"
```

---

## Task 2: Idempotencja audio (skip-jeśli-mp3-istnieje)

Regeneracja ~55 działów × ~100 wywołań TTS = tysiące zapytań. Bez idempotencji każde uruchomienie liczy wszystko od nowa. Dodajemy flagę: jeśli `grupa-N.mp3` istnieje, pomiń (chyba że `--force`).

**Files:**
- Modify: `~/.claude/skills/angielski-rozdzial/assemble-audio.js:187-210` (funkcja `main`)
- Test: `~/.claude/skills/angielski-rozdzial/test-assemble-audio.js` (dopisz blok)

**Interfaces:**
- Consumes: istniejące `assembleGroup`, `parseChapter`.
- Produces: `shouldSkip(outPath, force) -> bool` (eksport z assemble-audio.js); CLI flaga `--force`.

- [ ] **Step 1: Write the failing test**

Dopisz na końcu `test-assemble-audio.js` (przed ostatnim async IIFE lub po nim — przed `console.log` sumy przenieś licznik; najprościej: dodaj przed linią `// --- assembleGroup guard`):

```js
// --- shouldSkip: idempotencja audio ---
const { shouldSkip } = require('./assemble-audio');
const fs2 = require('fs'); const path2 = require('path'); const os2 = require('os');
const td = fs2.mkdtempSync(path2.join(os2.tmpdir(), 'idem-'));
const existing = path2.join(td, 'grupa-1.mp3'); fs2.writeFileSync(existing, 'x');
ok(shouldSkip(existing, false) === true, 'shouldSkip: istniejący mp3 bez --force -> pomiń');
ok(shouldSkip(existing, true) === false, 'shouldSkip: --force -> regeneruj mimo istnienia');
ok(shouldSkip(path2.join(td, 'grupa-2.mp3'), false) === false, 'shouldSkip: brak pliku -> generuj');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node ~/.claude/skills/angielski-rozdzial/test-assemble-audio.js`
Expected: FAIL — `shouldSkip is not a function`.

- [ ] **Step 3: Write minimal implementation**

W `assemble-audio.js` dodaj funkcję (po `concatFiles`, przed `assembleGroup`):

```js
function shouldSkip(outPath, force) {
  return !force && fs.existsSync(outPath);
}
```

W `main()` odczytaj flagę i użyj jej w pętli. Zmień:

```js
  const sufIdx = args.indexOf('--suffix');
  const suffix = sufIdx >= 0 ? (args[sufIdx + 1] || '') : '';
```
na:
```js
  const sufIdx = args.indexOf('--suffix');
  const suffix = sufIdx >= 0 ? (args[sufIdx + 1] || '') : '';
  const force = args.includes('--force');
```

oraz w pętli `for (const g of groups)` na początku ciała dodaj:

```js
    const out = path.join(outDir, `grupa-${g.n}${suffix}.mp3`);
    if (shouldSkip(out, force)) { console.log(`Grupa ${g.n} — istnieje, pomijam (--force by nadpisać)`); continue; }
```
(usuń zduplikowaną deklarację `const out = ...` niżej, jeśli powstanie — `out` ma być policzone raz).

Dodaj `shouldSkip` do `module.exports`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node ~/.claude/skills/angielski-rozdzial/test-assemble-audio.js`
Expected: PASS — suma asercji wzrosła o 3 (np. `26 assertions passed`).

- [ ] **Step 5: Commit**

```bash
git -C ~/.claude/skills/angielski-rozdzial add assemble-audio.js test-assemble-audio.js
git -C ~/.claude/skills/angielski-rozdzial commit -m "feat: idempotencja audio (skip-jeśli-istnieje, --force)"
```

---

## Task 3: Weryfikacja i dostrojenie pauzy słuchanki

Tryby audio już istnieją; tu tylko potwierdzamy działanie i wydłużamy zbyt krótką (0.8 s) pauzę słuchanki, żeby długie zdania miały oddech.

**Files:**
- Modify: `~/.claude/skills/angielski-rozdzial/assemble-audio.js:150-155` (gałąź `sluchanka`)

- [ ] **Step 1: Potwierdź istniejące tryby**

Run: `node ~/.claude/skills/angielski-rozdzial/test-assemble-audio.js`
Expected: PASS (potwierdza `normalizeMode` → sluchanka/en-only/en2pl/pl2en).

- [ ] **Step 2: Wydłuż pauzę słuchanki proporcjonalnie do zdania**

W gałęzi `if (mode === 'sluchanka')` zmień:
```js
      makeSilence(0.8, gap);
```
na:
```js
      makeSilence(Math.min(2.5, Math.max(0.9, silenceDuration(pair.en) * 0.35)), gap);
```
(krótka, ale skalowana do długości zdania — oddech między zdaniami narracji).

- [ ] **Step 3: Smoke-test montażu jednej grupy słuchanki (jeśli jest klucz)**

Run (opcjonalnie, wymaga `OPENAI_API_KEY`): `node ~/.claude/skills/angielski-rozdzial/assemble-audio.js ~/angielski/05-m1d5-ostatnie-dwa-tygodnie/rozdzial.md --only 1 --suffix -test`
Expected: powstaje `grupa-1-test.mp3` > 10 kB; odsłuchaj oddech między zdaniami. Posprzątaj plik testowy.

- [ ] **Step 4: Commit**

```bash
git -C ~/.claude/skills/angielski-rozdzial add assemble-audio.js
git -C ~/.claude/skills/angielski-rozdzial commit -m "tune: skalowana pauza w trybie słuchanki"
```

---

## Task 4: Reguły metody v2 (`METODA-C1.md`)

Przepisz reguły z v1.5 na v2. To dokument — „testem" jest brak sprzeczności liczbowych (grep) i kompletność change-listy.

**Files:**
- Modify: `~/.claude/skills/angielski-rozdzial/METODA-C1.md`

- [ ] **Step 1: Zmień liczby struktury (6→11, 3–4→2–3)**

- Sekcja 3 / linia „Domyślnie 6 działów na minikurs (Etap I zwykle rozbity na 2 działy)." → „Domyślnie ~11 działów na minikurs: Etap I = 4 działy, II = 2, III = 3, IV = 1, V = 1. (Liczba do potwierdzenia po walidacji M1.)"
- Tabela §3.1 — zaktualizuj kolumnę „Dział": I→1–4, II→5–6, III→7–9, IV→10, V→11.
- Zasada 2 i checklist: „3–4 nowe wyrażenia/dział" → „2–3 nowe wyrażenia/dział (~10 rdzeniowych/minikurs)".
- Słuchanka „~150–250 słów" → „~400–600 słów, 2–3 sceny (= 2–3 grupy/mp3)".

- [ ] **Step 2: Harmonogram → interwały rozszerzające + budżet z review[]**

W §3.2 zamień „Domyślny harmonogram powrotów: +1, +3, +6 działów" na:
„**Interwały rozszerzające** (nie sztywne): pierwszy powrót +2 działy, potem rosnąco (+2, +4, +8…), oraz obowiązkowo Etap II, III, IV, V bieżącego minikursu i Etap I–III następnego. **Długość `review[]` JEST budżetem:** rdzeniowe wyrażenie ≥10 wpisów, gramatyka ≥6. Klocki wprowadzone późno (d3–d4) dobijają budżet w następnym minikursie."

- [ ] **Step 3: Dodaj nową regułę „Wydobycie ≠ ekspozycja"**

Dodaj podsekcję w §2 (lub §3.2):
„**Aktywne wydobycie > ekspozycja (kluczowe).** Większość powrotów musi być wierszem PL→EN, w którym STARY klocek jest CELEM produkcji (polski wyzwalacz wymusza dokładnie ten klocek jako jedyną trudną rzecz), a nie tłem obok nowego materiału. Próg: ≥5 aktywnych wydobyć na rdzeniowy klocek w programie. Recenzent C ocenia: wydobycie czy ekspozycja."

- [ ] **Step 4: Dodaj quick-checki, kontrakt kolumn per-tryb, warstwę wymowy**

- „**Quick-check:** od działu 3 każdy dział Etapu I/III kończy się grupą 2–3 par EN-only (pytanie EN → odpowiedź EN) recyklingującą wcześniejsze klocki — testowanie rozproszone. Marker `<!-- mode: EN-only -->`."
- „**Kontrakt kolumn per-tryb:** w `en-only` kolumna 1 = pytanie po ANGIELSKU (recenzent wierności PL↔EN POMIJA takie grupy/działy); w `słuchanka` kolumna 1 = PL tylko do PDF. Surowy `|` escapuj `\|`."
- „**Warstwa wymowy/błędów (lekka):** w `## Nowe słowa i struktury` dla każdego działu dopisz akcent wyrazowy + 1–2 pułapki wymowy trudnych słów oraz 1–2 typowe błędy Polaka (np. brak „the", kalka „make a decision")."

- [ ] **Step 5: Dodaj precedencję recenzentów i sprostowanie audio**

- „**Precedencja recenzentów przy konflikcie:** wierność > poprawność > naturalność > preferencja. Max 3 iteracje poprawek, potem dział idzie do checkpointu z listą spornych uwag."
- W §8 zmień ostatni akapit „Tryby etapów II/IV/V ... do wdrożenia" na: „Tryby `en2pl`, `sluchanka`, `en-only` SĄ zaimplementowane w `assemble-audio.js` (`normalizeMode` + gałęzie). Działają. Hybryda QA: `check-recykling.js` (skrypt) + recenzent C (jakość)."

- [ ] **Step 6: Walidacja spójności (grep)**

Run: `grep -nE '6 działów|3–4 nowe|150–250|\+1, \+3, \+6' ~/.claude/skills/angielski-rozdzial/METODA-C1.md`
Expected: brak trafień (wszystkie stare liczby przepisane). Jeśli coś zostało — popraw.

- [ ] **Step 7: Commit**

```bash
git -C ~/.claude/skills/angielski-rozdzial add METODA-C1.md
git -C ~/.claude/skills/angielski-rozdzial commit -m "feat: METODA-C1 v2 (11 działów, wydobycie>ekspozycja, quick-checki, interwały rozszerzające)"
```

---

## Task 5: Przeliczenie `slownik.json` na siatkę 11-działową

Przepisz `review[]` każdego wpisu ze starej siatki 6-działowej na nową 11-działową i rozszerz do budżetu (rdzeniowe ≥10, gramatyka ≥6). Bez nowych pól. Walidacja: JSON parsuje się + checker z Taska 1 nie zgłasza absurdów.

**Files:**
- Modify: `~/angielski/slownik.json`
- Test (ad hoc): `node -e` sanity + `check-recykling.js`

**Interfaces:**
- Consumes: nowa numeracja działów M1 (m1-d1 … m1-d11) wg mapy z Taska 7.
- Produces: `slownik.json`, na którym opiera się każda generacja działu.

- [ ] **Step 1: Ustal nowe `intro` dla klocków M1 (mapowanie stare→nowe)**

Rozłóż ~10 rdzeniowych klocków M1 na działy Etapu I (1–4), po 2–3:
- d1: `wrap-up`, `head-back`, `for-good`
- d2: `mixed-feelings`, `on-the-fence`, `move-back-in-parents`
- d3: `figure-out`, `go-out-on-my-own`
- d4: `talk-it-over`, `sleep-on-it`, `second-guess`
- Gramatyka (cleft/inwersje/mixed-cond/turns-out): `intro` = m1-d7 lub m1-d8 (Etap III).

- [ ] **Step 2: Przelicz `review[]` na interwały rozszerzające (≥10 rdzeniowe)**

Dla każdego klocka rdzeniowego ustaw `review[]` = działy wg +2/+4/+8 od `intro`, plus obowiązkowo Etap II–V M1 i Etap I–III następnego minikursu. Przykład `wrap-up` (intro m1-d1):
```json
"review": ["m1-d3","m1-d5","m1-d6","m1-d7","m1-d9","m1-d10","m1-d11","m2-d1","m2-d3","m2-d5"]
```
(10 wpisów = budżet ≥10). Klocki wprowadzone później (d3–d4) mają mniej wpisów w M1, więcej w m2 (dobicie budżetu). Gramatyka ≥6 wpisów. **Uwaga:** żadna „dziura" > ~4 działy bez powrotu.

- [ ] **Step 3: Sanity-check JSON i długości budżetu**

Run:
```bash
node -e "const s=require('/Users/krzysztofkilian/angielski/slownik.json'); const core=s.wyrazenia.filter(w=>w.typ!=='gramatyka'); const bad=core.filter(w=>(w.review||[]).length<10); console.log('rdzeniowych:',core.length,'| z budżetem <10:',bad.map(w=>w.id)); const g=s.wyrazenia.filter(w=>w.typ==='gramatyka').filter(w=>(w.review||[]).length<6); console.log('gramatyka <6:',g.map(w=>w.id));"
```
Expected: `z budżetem <10: []` i `gramatyka <6: []`. Jeśli nie — uzupełnij `review[]`.

- [ ] **Step 4: Commit**

```bash
git -C ~/angielski add slownik.json
git -C ~/angielski commit -m "feat: slownik.json — review[] na siatce 11-działowej, budżet ≥10/≥6"
```

---

## Task 6: Workflow skilla v2 (`SKILL.md`)

Zsynchronizuj instrukcję generatora z metodą v2: 11 działów, checker w Kroku 1, recenzenci dostają `slownik.json`+`METODA-C1.md`, popraw NIEAKTUALNY tekst o trybach audio.

**Files:**
- Modify: `~/.claude/skills/angielski-rozdzial/SKILL.md`

- [ ] **Step 1: Popraw nieaktualny tekst o audio (linie 159–161)**

Zamień akapit „Dla działów Etap II/IV/V tryby audio ... (osobny krok; do czasu wdrożenia te działy zostają w trybie domyślnym lub bez audio)." na:
„Tryby `EN→PL`/`słuchanka`/`EN-only` SĄ obsługiwane przez `assemble-audio.js` (markery `<!-- mode: ... -->`). Audio dla wszystkich etapów generuje się normalnie."

- [ ] **Step 2: Zaktualizuj harmonogram w Workflow rejestru (linia 44)**

Zamień „(+1, +3, +6 działów oraz Etap II/III ...)" na „(interwały rozszerzające +2/+4/+8 oraz Etap II–V tego minikursu i Etap I–III następnego; `review[]` ≥10 rdzeniowe / ≥6 gramatyka)".

- [ ] **Step 3: Wzmocnij Krok 1 (checker + materiały dla recenzentów)**

W „### Krok 1" dodaj przed listą recenzentów:
„**1a. Skrypt-checker (obowiązkowy, przed recenzentami):** `node ~/.claude/skills/angielski-rozdzial/check-recykling.js <ścieżka>/rozdzial.md <mK-dN>`. Jeśli FAIL (brak zaplanowanych powrotów) — popraw dział, zanim wyślesz recenzentów."
Do opisu Recenzenta C dopisz: „Dostaje w prompcie treść `slownik.json` i `METODA-C1.md` §5–§6. Ocenia: wydobycie vs ekspozycja, rotacja partnera kolokacyjnego. Grupy `en-only` POMIJA w kontroli wierności PL↔EN (lewa kolumna = pytanie EN)."
Dodaj: „**Bezpiecznik:** max 3 iteracje; precedencja wierność > poprawność > naturalność > preferencja; potem checkpoint."

- [ ] **Step 4: Zaktualizuj liczby działów (Tryb A, linia 19)**

„dla każdego minikursu 6 działów" → „~11 działów (I:4, II:2, III:3, IV:1, V:1)".

- [ ] **Step 5: Commit**

```bash
git -C ~/.claude/skills/angielski-rozdzial add SKILL.md
git -C ~/.claude/skills/angielski-rozdzial commit -m "feat: SKILL.md v2 (11 działów, checker w Kroku 1, fix nieaktualnego audio)"
```

---

## Task 7: Syllabus v2 (`PROGRAM.md`)

Przepisz mapę programu: 30→~55 działów, 6→11/minikurs, pełna mapa M1 (11 działów), zdejmij status „GOTOWE 01–06".

**Files:**
- Modify: `~/angielski/PROGRAM.md`

- [ ] **Step 1: Globalne liczby**

- „5 odcinków po 6 działów = 5 minikursów × 6 działów = 30 działów" → „5 minikursów × ~11 działów = ~55 działów".
- Tabela metody (Etap | Dział) — zaktualizuj zakresy działów: I→1–4, II→5–6, III→7–9, IV→10, V→11.
- „minikurs = 6 działów na jeden temat" → „minikurs = ~11 działów".

- [ ] **Step 2: Przepisz rozkład M1 na 11 działów**

Zastąp sekcję „4. MINIKURS 1" rozkładem 11-działowym wg mapy z Taska 5 Step 1 (d1–d4 = Etap I z 2–3 klockami każdy; d5–d6 = Etap II; d7–d9 = Etap III + gramatyka; d10 = słuchanka 2–3 sceny; d11 = egzamin). Dla d3, d4, d8 dopisz „+ quick-check (2–3 EN-only)".

- [ ] **Step 3: Status**

W sekcji „Status" zmień „Generacja Minikursu 1 (działy 01–06) GOTOWE" → „Stary M1 (01–06) DO SKASOWANIA; nowy M1 (01–11) wg metody v2 — w realizacji". Zaznacz „[ ] checkpoint po d1–3 + próbka drugiej połowy".

- [ ] **Step 4: Commit**

```bash
git -C ~/angielski add PROGRAM.md
git -C ~/angielski commit -m "feat: PROGRAM.md v2 (55 działów, mapa M1 na 11 działów)"
```

---

## Task 8: Skasowanie starego M1 i regeneracja manifestu

Krzysiek nie chce starego M1. Kasujemy foldery 01–06; `content.json` przebuduje się z dysku.

**Files:**
- Delete: `~/angielski/01..06-m1*` (6 folderów)
- Modify (auto): `~/angielski/content.json`

- [ ] **Step 1: Potwierdź, co kasujesz**

Run: `ls -d ~/angielski/0[1-6]-m1* && echo "--- powyższe 6 folderów do skasowania ---"`
Expected: lista 6 folderów starego M1. (Są w git — odwracalne.)

- [ ] **Step 2: Skasuj foldery**

```bash
rm -rf ~/angielski/01-m1d1-domykanie-i-powrot ~/angielski/02-m1d2-gdzie-zamieszkac ~/angielski/03-m1d3-przegadac-z-jakiem ~/angielski/04-m1d4-wszystko-naraz ~/angielski/05-m1d5-ostatnie-dwa-tygodnie ~/angielski/06-m1d6-so-whats-next
```

- [ ] **Step 3: Przebuduj manifest**

Run: `node ~/angielski/tools/generate.js`
Expected: `content.json: 0 rozdziałów, 0 plików audio` (stary M1 zniknął; nowy jeszcze nie istnieje).

- [ ] **Step 4: Commit**

```bash
git -C ~/angielski add -A
git -C ~/angielski commit -m "chore: skasuj stary M1 (01-06) — regeneracja wg metody v2"
```

---

## Task 9: Procedura generacji działu (recepta — referencyjna dla Tasków 10–13, 15–16)

To nie zadanie z commitem — to **recepta**, którą wykonują wszystkie taski generacyjne. Każdy dział:

1. **Przygotuj kontekst:** odczytaj `slownik.json` → wyrażenia z `intro`==dział i `review[]`∋dział. Odczytaj `METODA-C1.md` (reguły) i etap działu z `PROGRAM.md`.
2. **Napisz `rozdzial.md`** w `~/angielski/NN-mKdN-slug/` wg metody: 2–3 nowe klocki × 8–12 zdań (Etap I), drabinka rosnąca, kontrast B2→C1, partner kolokacyjny rotowany, recykling jako **aktywne wydobycie** (PL→EN, stary klocek = cel), grupa-splot na końcu, od d3 quick-check (`<!-- mode: EN-only -->`). Markery trybu dla Etapu II/IV/V. Escapuj `\|`.
3. **Skrypt-checker (bramka obiektywna):** `node ~/.claude/skills/angielski-rozdzial/check-recykling.js <ścieżka>/rozdzial.md mK-dN`. FAIL → popraw, powtórz.
4. **Trzej recenzenci Opus** (Task tool, `model: opus`, równolegle): A (poprawność+US), B (naturalność+rejestr+poziom), C (wierność+wydobycie+rotacja; dostaje slownik+METODA; pomija wierność w grupach `en-only`). Napraw BŁĄD/ZMIEŃ. Max 3 iteracje, precedencja wierność>poprawność>naturalność>preferencja.
5. **PDF:** skill `make-pdf` → `/tmp/rozdzial.pdf` → skopiuj do folderu działu jako `rozdzial.pdf`.
6. **Audio:** `node ~/.claude/skills/angielski-rozdzial/assemble-audio.js <ścieżka>/rozdzial.md` (idempotentne; `--force` przy zmianie treści).
7. **Manifest:** `node ~/angielski/tools/generate.js`.
8. **Commit** (repo kursu): `git -C ~/angielski add NN-mKdN-slug content.json && git -C ~/angielski commit -m "feat: M1 dział N — <temat>"`.

---

## Task 10: Wygeneruj M1 dział 1 (Etap I, fundament)

**Files:**
- Create: `~/angielski/01-m1d1-<slug>/rozdzial.md` (+ `rozdzial.pdf`, `grupa-*.mp3`)
- Modify: `~/angielski/content.json`

**Interfaces:**
- Consumes: `slownik.json` (klocki d1: `wrap-up`, `head-back`, `for-good`), `METODA-C1.md`, `check-recykling.js`.
- Produces: pierwszy nowy dział — wzorzec jakości dla checkpointu.

- [ ] **Step 1:** Wykonaj **Procedurę (Task 9)** dla `m1-d1`, temat „Domykanie i powrót" (3 klocki: wrap up / head back / for good). Brak recyklingu (pierwszy dział) — checker zgłosi tylko INTRO.
- [ ] **Step 2:** Checker: `node .../check-recykling.js ~/angielski/01-m1d1-*/rozdzial.md m1-d1` → wszystkie INTRO, PASS.
- [ ] **Step 3:** Recenzenci (3× Opus) → napraw → PDF → audio → `generate.js`.
- [ ] **Step 4: Commit** wg Procedury krok 8.

---

## Task 11: Wygeneruj M1 dział 2 (Etap I + pierwszy recykling)

**Files:** Create `~/angielski/02-m1d2-<slug>/...`; Modify `content.json`.

- [ ] **Step 1:** Procedura dla `m1-d2` (klocki: mixed-feelings, on-the-fence, move-back-in-parents). Recykling d1 jako **aktywne wydobycie** (PL→EN, gdzie wrap-up/head-back/for-good są celem). Otwarte wiersze produkcyjne.
- [ ] **Step 2:** Checker: `node .../check-recykling.js ~/angielski/02-*/rozdzial.md m1-d2` → wrap-up/head-back/for-good obecne (wg ich `review[]`), PASS.
- [ ] **Step 3:** Recenzenci → napraw → PDF → audio → `generate.js`.
- [ ] **Step 4: Commit.**

---

## Task 12: Wygeneruj M1 dział 3 (Etap I + quick-check)

**Files:** Create `~/angielski/03-m1d3-<slug>/...`; Modify `content.json`.

- [ ] **Step 1:** Procedura dla `m1-d3` (klocki: figure-out, go-out-on-my-own). Recykling d1–d2 (wydobycie). **Pierwszy quick-check:** ostatnia grupa `<!-- mode: EN-only -->`, 2–3 pytania o klocki z d1–d2.
- [ ] **Step 2:** Checker `m1-d3` → PASS. Zweryfikuj, że grupa quick-check ma marker en-only i że recenzent C ją pominie w wierności.
- [ ] **Step 3:** Recenzenci → napraw → PDF → audio → `generate.js`.
- [ ] **Step 4: Commit.**

---

## Task 13: Próbka drugiej połowy (składanie + słuchanka + egzamin na klockach d1–d3)

Żeby checkpoint ocenił właśnie to, co robi różnicę 4→4+. Mini-próbki, nie pełne działy.

**Files:** Create `~/angielski/_probka-druga-polowa/rozdzial.md` (tymczasowy, poza numeracją — `generate.js` go zignoruje, bo nie pasuje do `^\d{2}-`) + jego audio.

- [ ] **Step 1:** Napisz `rozdzial.md` z 3 grupami zbudowanymi WYŁĄCZNIE na klockach z d1–d3:
  - Grupa 1 (Etap III, składanie): splot 2–3 klocków + 1 struktura C1 (cleft/inwersja).
  - Grupa 2 `<!-- mode: słuchanka -->`: 1 scena narracji (~8–12 zdań).
  - Grupa 3 `<!-- mode: EN-only -->`: 3 pytania egzaminacyjne + wzorcowe odpowiedzi.
- [ ] **Step 2:** Audio: `node .../assemble-audio.js ~/angielski/_probka-druga-polowa/rozdzial.md` (3 tryby naraz — weryfikuje też tryby w praktyce).
- [ ] **Step 3:** PDF (make-pdf) dla próbki.
- [ ] **Step 4: Commit** (lub trzymaj lokalnie do checkpointu): `git -C ~/angielski add _probka-druga-polowa && git -C ~/angielski commit -m "chore: próbka drugiej połowy do checkpointu"`.

---

## Task 14: CHECKPOINT — walidacja Krzyśka (jedyna bramka zawracająca metodę)

- [ ] **Step 1:** Pokaż Krzyśkowi: działy 1–3 (md + PDF + audio) + próbkę drugiej połowy.
- [ ] **Step 2: Mierzalne pytanie:** „Weź 2 klocki z d1 i policz, ile razy wróciły w d2–3 i czy za każdym razem w innym połączeniu." (Dokładnie oś, która dała 4−.)
- [ ] **Step 3:** Zbierz werdykt:
  - **≥4+** → przejdź do Taska 15 (działy 4–11).
  - **<4+** → wypisz konkretne braki, popraw `METODA-C1.md`/`slownik.json`, **regeneruj działy 1–3** (`--force` na audio), powtórz checkpoint.
  - Krzysiek może oznaczyć klocki „już umiem" → zdegraduj je w `slownik.json` do roli partnera (krótsze `review[]`), budżet uwolniony na trudne.
- [ ] **Step 4:** Po akceptacji: skasuj `_probka-druga-polowa` (`rm -rf` + commit), bo nie należy do numeracji kursu.

---

## Task 15 (po checkpoincie): Wygeneruj M1 działy 4–11

Powtórz **Procedurę (Task 9)** dla każdego działu. Jeden dział = jeden commit = jedna jednostka recenzji.

- [ ] **d4** (`04-m1d4`): Etap I, klocki talk-it-over/sleep-on-it/second-guess; recykling d1–3; quick-check.
- [ ] **d5** (`05-m1d5`): Etap II `<!-- mode: EN→PL -->`; powtórka konwersacyjna; recykling całego Etapu I.
- [ ] **d6** (`06-m1d6`): Etap II; swobodne wymiany + mini-narracja (rozgrzewka słuchanki).
- [ ] **d7** (`07-m1d7`): Etap III; składanie 2–3 klocków + gramatyka C1 (intro klocków gramatycznych); przeplatanie typów.
- [ ] **d8** (`08-m1d8`): Etap III; trudniejsze sploty + quick-check.
- [ ] **d9** (`09-m1d9`): Etap III; pełne splatanie minikursu.
- [ ] **d10** (`10-m1d10`): Etap IV `<!-- mode: słuchanka -->`; 2–3 sceny (~400–600 słów); checker potwierdza obecność wszystkich klocków M1.
- [ ] **d11** (`11-m1d11`): Etap V `<!-- mode: EN-only -->`; egzamin 3 grupy.
- [ ] **Po d11:** `node tools/generate.js`; sprawdź apkę lokalnie (otwórz `index.html`), że M1 ma 11 działów z audio i działa routing `#/c/<id>`.

---

## Task 16 (po walidacji całego M1): Finalizuj i generuj M2–M5

- [ ] **Step 1:** Potwierdź z Krzyśkiem, czy „11 działów" zostaje wzorcem (lub koryguj).
- [ ] **Step 2:** Dla M2–M5 uzupełnij `slownik.json` (wyrażenia ze szkiców → pełne wpisy z `intro`/`review[]` na siatce 11-działowej, budżet ≥10/≥6) i `PROGRAM.md` (mapy minikursów). Recykling międzyminikursowy: `review[]` klocków M1 sięga w m2–m5.
- [ ] **Step 3:** Generuj minikurs po minikursie **Procedurą (Task 9)**. Numeracja folderów globalna: M2 = 12–22, M3 = 23–33, M4 = 34–44, M5 = 45–55.
- [ ] **Step 4:** Oszacuj koszt audio przed każdą falą: `liczba_par × ~2–4 wywołań TTS × cena gpt-4o-mini-tts`; idempotencja (`shouldSkip`) chroni przed podwójną generacją.

---

## Self-Review (wykonane przy pisaniu planu)

**Spec coverage:** struktura 11-działowa (Task 7,10–15) ✓; silnik recyklingu + budżet (Task 1,5) ✓; wydobycie≠ekspozycja (Task 4,9) ✓; quick-checki (Task 4,12) ✓; gruba słuchanka/egzamin (Task 4,15 d10–d11) ✓; warstwa wymowy (Task 4) ✓; QA recenzenci + precedencja + checker (Task 1,6,9) ✓; tryby audio = weryfikacja (Task 3) ✓; skasowanie starego M1 (Task 8) ✓; plan generacji M1-first + checkpoint (Task 10–14) ✓; M2–M5 (Task 16) ✓; reguła OpenAI/zero-ElevenLabs (Global Constraints) ✓; przeliczenie review[] 6→11 (Task 5) ✓; przepisanie PROGRAM/METODA liczb (Task 4,7) ✓.

**Placeholder scan:** brak „TBD/TODO"; kod checkera i idempotencji kompletny; rewrite'y dokumentów mają konkretne old→new.

**Type consistency:** `check(mdPath, dzialId, slownikPath)`, `keywords(en)`, `lineHasAll(lineWords, kws)`, `countOccurrences(groups, kws)`, `shouldSkip(outPath, force)` — spójne między Task 1/2 a testami i Procedurą (Task 9). `parseChapter` reużyte z eksportu `assemble-audio.js`.

**Znane ograniczenie:** checker (prefiks 3-znakowy) nie łapie czasowników nieregularnych (go↔went) — świadomie; recenzent C jest backstopem (udokumentowane w `check-recykling.js`).
