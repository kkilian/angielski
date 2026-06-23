# Metoda v2 — kurs angielskiego B2→C1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Rewizja 2 (po recenzji 3 agentów):** dodano Task 0 (reconcile repo skilla), licznik WYDOBYĆ w checkerze (`--audit`), naprawiono `const out` (Task 2), twardy STOP na checkpoincie (podział Część A/B), zależności tasków, rozbicie generacji na dział-per-task, back-translation + warstwę wymowy jako bramki.

**Goal:** Podnieść kurs z 4− na 4+/5: drobniejsze działy, recykling egzekwowany SKRYPTEM (obecność powrotów + ≥5 aktywnych WYDOBYĆ/klocek), gruba druga połowa, QA — najpierw narzędzia i reguły, potem regeneracja M1 do checkpointu (twardy STOP), potem reszta.

**Architecture:** Dwa repa git. (1) Skill `~/.claude/skills/angielski-rozdzial/` (własny git): reguły (`METODA-C1.md`), workflow (`SKILL.md`), montaż audio (`assemble-audio.js`), NOWY checker (`check-recykling.js`). (2) Kurs `~/angielski/` (git main): rejestr (`slownik.json`), syllabus (`PROGRAM.md`), działy (`NN-mKdN-slug/`), manifest (`content.json`, generowany z dysku przez `tools/generate.js`). Tryby audio JUŻ istnieją w `assemble-audio.js` — weryfikujemy.

**Tech Stack:** Node.js (CommonJS w skillu, ESM w `tools/generate.js`), `node:assert` (wzorzec `test-assemble-audio.js`), `ffmpeg`, OpenAI `gpt-4o-mini-tts` (nova/alloy), `make-pdf`, recenzenci (Task tool, model Opus).

## Global Constraints

- **Audio = wyłącznie OpenAI TTS.** PL=`nova`, EN=`alloy`. Słuchanka/en-only: tylko `alloy`. **ElevenLabs ZAKAZANY** poza opt-in (`ELEVEN_TTS=1`); kod już domyślnie wyłącza — nie zmieniaj domyślnej ścieżki.
- **Model agentów: Opus** (`model: opus`) dla każdego subagenta/recenzenta.
- **General American**; sufit rejestru (bez slangu na siłę, ≤1–2 „(luźno)"/grupa); wierność PL↔EN (ogólność↔konkretność).
- **Kontrakt parsera (NIENARUSZALNY):** tabele `| polski | angielski |`, nagłówki `## Grupa N`, jedna grupa = jeden `grupa-N.mp3`, `## Nowe słowa i struktury` poza audio, markery `<!-- mode: ... -->`. **Parser ODRZUCA pary z pustą kolumną EN** (`!en → continue`) — w żadnym trybie EN nie może być puste. Surowy `|` escapuj `\|`.
- **Schemat `slownik.json`:** tylko `{id, pl, en, typ, intro, review[]}` (+ ignorowany `status`). Długość `review[]` = budżet powrotów.
- **Numeracja folderów:** globalna 2-cyfrowa (`01`–`55`) + slug `mKdN`. `generate.js` wymaga `^\d{2}-`.
- **Commity:** osobno per repo (`git -C <dir>`). Skill → `~/.claude/skills/angielski-rozdzial`; kurs → `~/angielski`.

## Zależności (TWARDA kolejność — egzekwuj `addBlockedBy`)

```
Task 0 → Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7 → Task 8
(papier+narzędzia)                                                         ↓
                          Task 10 → 11 → 12 → 13 → Task 14 (CHECKPOINT — TWARDY STOP)
                                                              ↓ (dopiero po ludzkim „4+")
                                          === CZĘŚĆ B === Task 15a–h → Task 16
```
**Generacja działu (Task 10+) WYMAGA ukończonych Task 1 (checker), 4 (METODA), 5 (slownik), 6 (SKILL), 7 (PROGRAM), 8 (kasacja).** Inaczej dział powstanie wg starych reguł / na starym slowniku (cichy regres do v1.5) albo skolidują foldery `01-*`.

---

## === CZĘŚĆ A (do checkpointu) ===

## Task 0: Uporządkuj repo skilla (reconcile niezacommitowanych zmian)

Repo skilla startuje z 4 zmodyfikowanymi, niezacommitowanymi plikami (to wczorajszy v1.5: tryby audio, rejestr, dryl). Plan zakłada czysty punkt wyjścia — najpierw to domknij.

**Files:** `~/.claude/skills/angielski-rozdzial/{METODA-C1.md,SKILL.md,assemble-audio.js,test-assemble-audio.js}`

- [ ] **Step 1: Zobacz stan**

Run: `git -C ~/.claude/skills/angielski-rozdzial status && git -C ~/.claude/skills/angielski-rozdzial diff --stat`
Expected: lista zmodyfikowanych plików (v1.5).

- [ ] **Step 2: Potwierdź, że testy przechodzą na obecnym dysku**

Run: `node ~/.claude/skills/angielski-rozdzial/test-assemble-audio.js`
Expected: `N assertions passed`, exit 0 (np. 23). Zapamiętaj N — baseline dla Task 2.

- [ ] **Step 3: Zacommituj jako baseline v1.5**

```bash
git -C ~/.claude/skills/angielski-rozdzial add -A
git -C ~/.claude/skills/angielski-rozdzial commit -m "chore: baseline v1.5 (tryby audio + rejestr) przed metodą v2"
```
Expected: czyste `git status` po commicie. Teraz plan ma czysty start.

---

## Task 1: Checker recyklingu z licznikiem WYDOBYĆ (`check-recykling.js`)

Najważniejsze narzędzie. Dwie bramki: (a) per-dział — czy zaplanowane powroty są obecne; (b) `--audit` — czy każdy klocek ma ≥5 aktywnych WYDOBYĆ w całym minikursie (wydobycie = klocek trafia w EN, NIE w PL, w trybie produkcyjnym pl2en — czyli uczeń produkuje go z polskiego wyzwalacza). To zamienia „aktywne wydobycie" z hasła w warunek.

**Files:**
- Create: `~/.claude/skills/angielski-rozdzial/check-recykling.js`
- Test: `~/.claude/skills/angielski-rozdzial/test-check-recykling.js`

**Interfaces:**
- Consumes: `parseChapter(md)` z `./assemble-audio` → `[{n, pairs:[{pl,en}], mode}]`.
- Produces: `keywords(en)`, `wordMatches(kw,w)`, `lineHasAll(lineWords,kws)`, `isRetrieval(pair,kws,mode)`, `countOccurrences(groups,kws) -> {lines,groups,retrievals}`, `check(mdPath,dzialId,slownikPath)`, `audit(dir,slownikPath)`. CLI: `node check-recykling.js <rozdzial.md> <dzial-id>` (per-dział, exit 1 gdy brak) oraz `node check-recykling.js --audit <dir>` (exit 1 gdy klocek < progu wydobyć).

- [ ] **Step 1: Write the failing test**

Create `~/.claude/skills/angielski-rozdzial/test-check-recykling.js`:

```js
const assert = require('assert');
const { keywords, wordMatches, lineHasAll, isRetrieval, countOccurrences, check } = require('./check-recykling');
const fs = require('fs'); const os = require('os'); const path = require('path');
let passed = 0;
function ok(cond, msg) { assert.ok(cond, msg); console.log('  ✓', msg); passed++; }

// keywords: nawiasy usuwane PRZED split('/'); drop funkcyjnych; zostają partykuły
assert.deepStrictEqual(keywords('to be on the fence (about)'), ['on', 'fence']); ok(true, 'keywords: on the fence');
assert.deepStrictEqual(keywords('to head back / to head home'), ['head', 'back']); ok(true, 'keywords: 1. wariant /');
assert.deepStrictEqual(keywords('to second-guess (myself / a decision)'), ['second', 'guess']); ok(true, 'keywords: "/" wewnątrz () nie psuje');
assert.deepStrictEqual(keywords('to have mixed feelings (about)'), ['mixed', 'feelings']); ok(true, 'keywords: drop light verb have');

// wordMatches: ≤2 dokładne; 3 prefiks-3; ≥4 prefiks-4 (w przód)
ok(wordMatches('on', 'on') && !wordMatches('on', 'only'), 'wordMatches: "on" nie łapie "only"');
ok(wordMatches('wrap', 'wrapping') && wordMatches('fence', 'fence'), 'wordMatches: prefiks ≥4 łapie odmianę');

// lineHasAll
ok(lineHasAll('i am on the fence about it'.split(' '), ['on', 'fence']), 'lineHasAll: obecne');
ok(!lineHasAll('i love this city'.split(' '), ['on', 'fence']), 'lineHasAll: nieobecne -> false');

// isRetrieval: EN trafia, PL nie, tryb pl2en -> wydobycie
ok(isRetrieval({ pl: 'Waham się.', en: "I'm on the fence." }, ['on', 'fence'], 'pl2en') === true, 'isRetrieval: pl2en, klocek w EN nie w PL');
ok(isRetrieval({ pl: "What's next?", en: "I'm on the fence." }, ['on', 'fence'], 'en-only') === false, 'isRetrieval: en-only wykluczone');

// countOccurrences zwraca lines + retrievals
const g = [{ n: 1, mode: 'pl2en', pairs: [{ pl: 'Waham się.', en: "I'm on the fence." }, { pl: 'Lubię to.', en: 'I love it.' }] }];
const c = countOccurrences(g, ['on', 'fence']);
ok(c.lines === 1 && c.retrievals === 1, 'countOccurrences: 1 linia, 1 wydobycie');

// check(): intro flagowane, review obecne/brak
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chk-'));
const md = `# T\n\n## Grupa 1\n| polski | angielski |\n|---|---|\n| Waham się. | I'm on the fence. |\n| Domykam. | I'm wrapping up. |\n`;
const mdPath = path.join(tmp, 'r.md'); fs.writeFileSync(mdPath, md);
const slownik = { wyrazenia: [
  { id: 'on-the-fence', en: 'to be on the fence (about)', typ: 'idiom', intro: 'm1-d2', review: ['m1-d3'] },
  { id: 'wrap-up', en: 'to wrap up', typ: 'phrasal', intro: 'm1-d1', review: ['m1-d2'] },
  { id: 'sleep-on-it', en: 'to sleep on it', typ: 'idiom', intro: 'm1-d1', review: ['m1-d2'] },
] };
const sPath = path.join(tmp, 's.json'); fs.writeFileSync(sPath, JSON.stringify(slownik));
const res = check(mdPath, 'm1-d2', sPath);
const byId = Object.fromEntries(res.map((r) => [r.id, r]));
ok(byId['on-the-fence'].isIntro === true, 'check: on-the-fence INTRO w m1-d2');
ok(byId['wrap-up'].present === true && byId['wrap-up'].retrievals === 1, 'check: wrap-up obecne jako wydobycie');
ok(byId['sleep-on-it'].present === false, 'check: sleep-on-it BRAK wykryte');

console.log(`\n${passed} assertions passed`);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node ~/.claude/skills/angielski-rozdzial/test-check-recykling.js`
Expected: FAIL — `Cannot find module './check-recykling'`.

- [ ] **Step 3: Write minimal implementation**

Create `~/.claude/skills/angielski-rozdzial/check-recykling.js`:

```js
'use strict';
// Deterministyczny checker recyklingu. Per-dział: czy zaplanowane powroty są obecne.
// --audit: czy każdy klocek ma ≥5 aktywnych WYDOBYĆ (klocek w EN, nie w PL, tryb pl2en)
// w całym minikursie. Backstop nadal recenzent C (niuanse, czasowniki nieregularne).
// Ograniczenia matchera (świadome): czasowniki nieregularne (go↔went), 2. wariant po "/",
// rzadkie kolizje prefiksu na 3-znakowych kluczach (for↔forgot) — recenzent C łapie.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { parseChapter } = require('./assemble-audio');

const DROP = new Set(['to', 'a', 'an', 'the', 'be', 'is', 'are', 'am', 'was', 'were',
  'been', 'being', 'have', 'has', 'had', 'get', 'gets', 'got', 'getting',
  'my', 'your', 'his', 'her', 'our', 'their', 'its', 'it']);

function words(s) {
  return s.toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z\s]/g, ' ')
    .split(/\s+/).filter(Boolean);
}
// Nawiasy usuwane PRZED split('/'), żeby "(myself / a decision)" nie ucięło wariantu w środku.
function keywords(en) {
  const firstVariant = en.replace(/\([^)]*\)/g, ' ').split('/')[0];
  return words(firstVariant).filter((w) => !DROP.has(w));
}
// ≤2 znaki -> dokładne słowo (uniknij "on"⊂"only"); 3 -> prefiks-3; ≥4 -> prefiks-4. Tylko w przód.
function wordMatches(kw, w) {
  if (kw.length <= 2) return w === kw;
  return w.startsWith(kw.slice(0, kw.length === 3 ? 3 : 4));
}
function lineHasAll(lineWords, kws) {
  return kws.length > 0 && kws.every((kw) => lineWords.some((w) => wordMatches(kw, w)));
}
// Wydobycie: klocek jest CELEM produkcji — trafia w EN, NIE w PL, tryb produkcyjny.
function isRetrieval(pair, kws, mode) {
  const m = (mode || 'pl2en');
  if (m !== 'pl2en' && m !== 'PL→EN') return false; // wyklucz en-only / sluchanka / en2pl
  return lineHasAll(words(pair.en), kws) && !lineHasAll(words(pair.pl), kws);
}
function countOccurrences(groups, kws) {
  let lines = 0, retrievals = 0; const gh = new Set();
  for (const g of groups) for (const p of g.pairs) {
    if (lineHasAll(words(p.en + ' ' + p.pl), kws)) { lines++; gh.add(g.n); }
    if (isRetrieval(p, kws, g.mode)) retrievals++;
  }
  return { lines, groups: gh.size, retrievals };
}
function check(mdPath, dzialId, slownikPath) {
  const groups = parseChapter(fs.readFileSync(mdPath, 'utf8'));
  const slownik = JSON.parse(fs.readFileSync(slownikPath, 'utf8'));
  const expected = slownik.wyrazenia.filter(
    (e) => e.intro === dzialId || (e.review || []).includes(dzialId));
  return expected.map((e) => {
    const kws = keywords(e.en);
    const o = countOccurrences(groups, kws);
    return { id: e.id, en: e.en, isIntro: e.intro === dzialId, kws,
      lines: o.lines, groupsHit: o.groups, retrievals: o.retrievals,
      present: o.lines > 0, clustered: o.groups === 1 && o.lines > 2 };
  });
}
// Sumuj wydobycia per klocek po WSZYSTKICH działach w katalogu (folder slug zawiera mKdN).
function audit(dir, slownikPath) {
  const slownik = JSON.parse(fs.readFileSync(slownikPath, 'utf8'));
  const byId = Object.fromEntries(slownik.wyrazenia.map((e) => [e.id, e]));
  const totals = {};
  for (const name of fs.readdirSync(dir)) {
    const m = name.match(/m(\d+)d(\d+)/);
    const md = path.join(dir, name, 'rozdzial.md');
    if (!m || !fs.existsSync(md)) continue;
    for (const r of check(md, `m${m[1]}-d${m[2]}`, slownikPath))
      totals[r.id] = (totals[r.id] || 0) + r.retrievals;
  }
  return Object.entries(totals).map(([id, n]) => ({ id, retrievals: n, typ: byId[id] ? byId[id].typ : '?' }));
}
function main() {
  const args = process.argv.slice(2);
  const sIdx = args.indexOf('--slownik');
  const slownikPath = sIdx >= 0 ? args[sIdx + 1] : path.join(os.homedir(), 'angielski', 'slownik.json');
  if (args[0] === '--audit') {
    const res = audit(args[1] || path.join(os.homedir(), 'angielski'), slownikPath);
    let fail = false;
    for (const r of res.sort((a, b) => a.retrievals - b.retrievals)) {
      const min = r.typ === 'gramatyka' ? 3 : 5;
      if (r.retrievals < min) fail = true;
      console.log(`  ${r.retrievals < min ? 'NISKO' : 'OK'} ${r.id}: ${r.retrievals} wydobyć (min ${min})`);
    }
    if (fail) { console.error('FAIL: klocki poniżej progu wydobyć.'); process.exit(1); }
    console.log('PASS: wszystkie klocki ≥ progu wydobyć.'); return;
  }
  const [mdPath, dzialId] = args;
  if (!mdPath || !dzialId) { console.error('usage: node check-recykling.js <rozdzial.md> <dzial-id> | --audit <dir>'); process.exit(2); }
  const res = check(mdPath, dzialId, slownikPath);
  console.log(`Recykling w ${dzialId}: ${res.length} wymaganych`);
  for (const r of res) console.log(`  [${r.isIntro ? 'INTRO' : (r.present ? 'OK' : 'BRAK')}] ${r.id} — ${r.lines} linii / ${r.retrievals} wydobyć`);
  const clustered = res.filter((r) => r.clustered);
  if (clustered.length) console.log('UWAGA klaster: ' + clustered.map((r) => r.id).join(', '));
  const missing = res.filter((r) => !r.present && !r.isIntro);
  if (missing.length) { console.error(`FAIL: brak: ${missing.map((m) => m.id).join(', ')}`); process.exit(1); }
  console.log('PASS.');
}
module.exports = { keywords, wordMatches, lineHasAll, isRetrieval, countOccurrences, check, audit };
if (require.main === module) main();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node ~/.claude/skills/angielski-rozdzial/test-check-recykling.js`
Expected: PASS — kończy się `<N> assertions passed` (N = faktyczna liczba `ok()`), zero wyjątków, exit 0. **Nie hard-koduj N** — liczy się brak wyjątku.

- [ ] **Step 5: Commit**

```bash
git -C ~/.claude/skills/angielski-rozdzial add check-recykling.js test-check-recykling.js
git -C ~/.claude/skills/angielski-rozdzial commit -m "feat: checker recyklingu z licznikiem wydobyć (--audit ≥5/klocek)"
```

---

## Task 2: Idempotencja audio (skip-jeśli-mp3-istnieje)

**Files:**
- Modify: `~/.claude/skills/angielski-rozdzial/assemble-audio.js` (dodaj `shouldSkip`; w `main()` użyj ISTNIEJĄCEJ linii `const out` — NIE twórz drugiej)
- Test: `~/.claude/skills/angielski-rozdzial/test-assemble-audio.js`

**Interfaces:** Produces `shouldSkip(outPath, force) -> bool`; CLI `--force`.

- [ ] **Step 1: Write the failing test** — dopisz w `test-assemble-audio.js` przed blokiem `// --- assembleGroup guard`:

```js
// --- shouldSkip: idempotencja ---
const { shouldSkip } = require('./assemble-audio');
const _fs = require('fs'); const _p = require('path'); const _os = require('os');
const _td = _fs.mkdtempSync(_p.join(_os.tmpdir(), 'idem-'));
const _ex = _p.join(_td, 'grupa-1.mp3'); _fs.writeFileSync(_ex, 'x');
ok(shouldSkip(_ex, false) === true, 'shouldSkip: istniejący bez --force -> pomiń');
ok(shouldSkip(_ex, true) === false, 'shouldSkip: --force -> regeneruj');
ok(shouldSkip(_p.join(_td, 'grupa-2.mp3'), false) === false, 'shouldSkip: brak pliku -> generuj');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node ~/.claude/skills/angielski-rozdzial/test-assemble-audio.js`
Expected: FAIL — `shouldSkip is not a function`.

- [ ] **Step 3: Write minimal implementation**

(a) Dodaj funkcję po `concatFiles`, przed `assembleGroup`:
```js
function shouldSkip(outPath, force) { return !force && fs.existsSync(outPath); }
```
(b) W `main()` dodaj odczyt flagi po linii `const suffix = ...`:
```js
  const force = args.includes('--force');
```
(c) **NIE dodawaj nowej `const out`.** W pętli `for (const g of groups)` jest już (linia ~204) `const out = path.join(outDir, \`grupa-${g.n}${suffix}.mp3\`);`. ZARAZ PO tej istniejącej linii wstaw:
```js
    if (shouldSkip(out, force)) { console.log(`Grupa ${g.n} — istnieje, pomijam (--force by nadpisać)`); continue; }
```
(d) Dodaj `shouldSkip` do `module.exports`.

- [ ] **Step 4: Verify no syntax error, then run test**

Run: `node --check ~/.claude/skills/angielski-rozdzial/assemble-audio.js && node ~/.claude/skills/angielski-rozdzial/test-assemble-audio.js`
Expected: brak `SyntaxError`; PASS, suma = baseline (Task 0 Step 2) + 3.

- [ ] **Step 5: Commit**

```bash
git -C ~/.claude/skills/angielski-rozdzial add assemble-audio.js test-assemble-audio.js
git -C ~/.claude/skills/angielski-rozdzial commit -m "feat: idempotencja audio (skip-jeśli-istnieje, --force)"
```

---

## Task 3: Dostrojenie pauzy słuchanki + sprzątanie workDir

**Files:** Modify `~/.claude/skills/angielski-rozdzial/assemble-audio.js` (gałąź `sluchanka` ~150–155; sprzątanie `workDir` po pętli w `main`).

- [ ] **Step 1:** Potwierdź tryby: `node ~/.claude/skills/angielski-rozdzial/test-assemble-audio.js` → PASS.
- [ ] **Step 2:** W gałęzi `sluchanka` zmień `makeSilence(0.8, gap);` na:
```js
      makeSilence(Math.min(2.5, Math.max(0.9, silenceDuration(pair.en) * 0.35)), gap);
```
- [ ] **Step 3:** Po pętli `for (const g of groups)` w `main()`, przed `console.log('Gotowe.')`, dodaj sprzątanie tmp:
```js
  try { fs.rmSync(workDir, { recursive: true, force: true }); } catch {}
```
- [ ] **Step 4:** `node --check` + test → PASS. Commit:
```bash
git -C ~/.claude/skills/angielski-rozdzial add assemble-audio.js
git -C ~/.claude/skills/angielski-rozdzial commit -m "tune: skalowana pauza słuchanki + sprzątanie workDir"
```

---

## Task 4: Reguły metody v2 (`METODA-C1.md`)

**WYMAGA:** Task 0. **Uwaga edycyjna:** cytuj PEŁNE linie z `**` i polskimi „cudzysłowami" (exact-match); kilka fraz występuje wielokrotnie — zmień KAŻDE wystąpienie.

- [ ] **Step 1: Liczby struktury (wszystkie wystąpienia)**

- `6 działów na minikurs` / `minikurs = 6 działów` → „~11 działów (I:4, II:2, III:3, IV:1, V:1; do potwierdzenia po M1)". Sprawdź też tabelę §3.1 (kolumna „Dział": I→1–4, II→5–6, III→7–9, IV→10, V→11).
- **Wszystkie 3 wystąpienia** `3–4 nowe wyrażenia` (Zasada 2, tabela §3.1, checklist) → „2–3 nowe wyrażenia (~10 rdzeniowych/minikurs)".
- `150–250` (słuchanka) → „~400–600 słów, 2–3 sceny".

- [ ] **Step 2: Harmonogram → interwały rozszerzające (old-string = pełny blok 3-liniowy z `**`)**

Zamień blok zaczynający się „- `review` — działy ... Domyślny harmonogram powrotów:" wraz z linią „**+1, +3, +6 działów** ..." na:
„Interwały rozszerzające: pierwszy powrót +2, potem +4, +8…, oraz obowiązkowo Etap II–V tego minikursu i Etap I–III następnego. **Długość `review[]` = budżet:** rdzeniowe ≥10, gramatyka ≥6. Żadna luka > ~4 działy. Późne klocki dobijają budżet w następnym minikursie."

- [ ] **Step 3: Nowa reguła „Wydobycie ≠ ekspozycja"** (dodaj w §2):
„**Aktywne wydobycie > ekspozycja.** Większość powrotów to wiersz PL→EN, gdzie STARY klocek jest CELEM produkcji (PL wyzwalacz NIE zawiera angielskiego klocka; EN go zawiera). Próg ≥5 wydobyć/rdzeniowy klocek — egzekwuje `check-recykling.js --audit`. Recenzent C ocenia jakość wydobycia i rotację partnera."

- [ ] **Step 4: Quick-checki, kontrakt kolumn, produkcja swobodna, warstwa wymowy** (dodaj):
- „**Quick-check:** od d3 każdy dział Etapu I/III kończy grupą 2–3 par `<!-- mode: EN-only -->` recyklingującą wcześniejsze klocki."
- „**Produkcja swobodna (od d2):** grupa, której polski wyzwalacz wymusza ZŁOŻENIE 2 znanych klocków bez nowego materiału. Kolumna EN ZAWSZE wypełniona (parser jej wymaga) — „otwartość" = uczeń zakrywa EN i produkuje sam; oznacz grupę nagłówkiem `## Grupa N` + komentarzem `<!-- produkcja swobodna -->` (parser ignoruje)."
- „**Kontrakt kolumn per-tryb:** `en-only` → kolumna 1 = pytanie EN (recenzent wierności POMIJA); `słuchanka` → kolumna 1 = PL tylko do PDF. EN nigdy puste. `|` escapuj `\|`."
- „**Warstwa wymowy/błędów:** w `## Nowe słowa i struktury` per dział: akcent wyrazowy + ≥1 pułapka wymowy + ≥1 typowy błąd Polaka. **Egzekwuje Recenzent A.**"

- [ ] **Step 5: Precedencja recenzentów + back-translation + sprostowanie audio**
- „**Precedencja przy konflikcie:** wierność > poprawność > naturalność > preferencja. Max 3 iteracje, potem checkpoint."
- „**Back-translation (recenzent C):** kontroluje WYŁĄCZNIE referent + ogólność/konkretność i brak zmiany znaczenia rdzennego. **Stylistyczny rozjazd polskiego wyzwalacza jest DOZWOLONY** (PL = wyzwalacz produkcji, nie kalka)."
- W §8 zamień „Tryby etapów II/IV/V (do wdrożenia...)" na: „Tryby `en2pl`/`sluchanka`/`en-only` SĄ zaimplementowane (`normalizeMode` + gałęzie). QA: `check-recykling.js` (skrypt) + recenzent C (jakość)."

- [ ] **Step 6: Walidacja (grep — wszystkie stare liczby zniknęły)**

Run: `grep -nE '6 działów|3–4 nowe|150–250|\+1, \+3, \+6' ~/.claude/skills/angielski-rozdzial/METODA-C1.md`
Expected: brak trafień. Jeśli coś zostało — popraw i powtórz.

- [ ] **Step 7: Commit**
```bash
git -C ~/.claude/skills/angielski-rozdzial add METODA-C1.md
git -C ~/.claude/skills/angielski-rozdzial commit -m "feat: METODA-C1 v2 (11 działów, wydobycie>ekspozycja, quick-checki, wymowa, back-translation)"
```

---

## Task 5: `slownik.json` na siatkę 11-działową (intro + review[] + walidacja luk)

**WYMAGA:** Task 0. Bez nowych pól.

- [ ] **Step 1: Ustal nowe `intro` (deterministycznie)** — rozłóż 10 rdzeniowych na Etap I (d1–d4); gramatykę na **d7** (jednoznacznie, NIE „d7 lub d8"):
- d1: `wrap-up`, `head-back`, `for-good`
- d2: `mixed-feelings`, `on-the-fence`, `move-back-in-parents`
- d3: `figure-out`, `go-out-on-my-own`
- d4: `talk-it-over`, `sleep-on-it`, `second-guess`
- d7 (Etap III, intro gramatyki): `mixed-conditional-had`, `not-only-inversion`, `cleft-what`, `turns-out`

- [ ] **Step 2: Przelicz `review[]`** wg interwałów rozszerzających (+2/+4/+8 od intro) + obowiązkowo Etap II–V M1 + Etap I–III m2; rdzeniowe ≥10 wpisów, gramatyka ≥6. Przykład `wrap-up` (intro m1-d1):
```json
"review": ["m1-d3","m1-d5","m1-d6","m1-d7","m1-d9","m1-d10","m1-d11","m2-d1","m2-d3","m2-d6"]
```

- [ ] **Step 3: Walidacja (długość budżetu + maks. luka ≤4 wewnątrz M1)**

Run:
```bash
node -e "const s=require('/Users/krzysztofkilian/angielski/slownik.json');let bad=[];for(const w of s.wyrazenia){if(!String(w.intro).startsWith('m1'))continue;const min=w.typ==='gramatyka'?6:10;if((w.review||[]).length<min)bad.push(w.id+':len');const ds=[w.intro,...(w.review||[])].filter(x=>x.startsWith('m1-d')).map(x=>+x.split('-d')[1]).sort((a,b)=>a-b);for(let i=1;i<ds.length;i++)if(ds[i]-ds[i-1]>4)bad.push(w.id+':luka'+(ds[i]-ds[i-1]));}console.log(bad.length?'FAIL '+bad.join(', '):'PASS');"
```
Expected: `PASS`. Jeśli `FAIL` — uzupełnij review[] / domknij luki.

- [ ] **Step 4: Commit**
```bash
git -C ~/angielski add slownik.json
git -C ~/angielski commit -m "feat: slownik.json — siatka 11-działowa, budżet ≥10/≥6, luki ≤4"
```

---

## Task 6: Workflow skilla v2 (`SKILL.md`)

**WYMAGA:** Task 0.

- [ ] **Step 1:** Zamień akapit (linie ~159–161) „Dla działów Etap II/IV/V tryby audio ... (osobny krok; do czasu wdrożenia ...)" na: „Tryby `EN→PL`/`słuchanka`/`EN-only` SĄ obsługiwane przez `assemble-audio.js` (markery `<!-- mode: ... -->`). Audio generuje się normalnie dla wszystkich etapów."
- [ ] **Step 2:** Workflow rejestru (linia ~44): „(+1, +3, +6 ...)" → „(interwały rozszerzające +2/+4/+8; review[] ≥10 rdzeniowe / ≥6 gramatyka; luki ≤4)".
- [ ] **Step 3:** Krok 1 — dodaj przed recenzentami: „**1a. Checker (obowiązkowy):** `node ~/.claude/skills/angielski-rozdzial/check-recykling.js <ścieżka>/rozdzial.md <mK-dN>` — FAIL → popraw przed recenzentami." Do Recenzenta A dopisz: „sprawdź `## Nowe słowa`: per-klocek akcent + pułapka wymowy + typowy błąd Polaka". Do Recenzenta C: „dostaje treść `slownik.json` + `METODA-C1.md` §5–§6; ocenia wydobycie vs ekspozycja i rotację partnera; grupy `en-only` POMIJA w wierności; **back-translation tylko referent/ogólność, dopuszcza rozjazd stylu PL**." Dodaj: „**Bezpiecznik:** max 3 iteracje; precedencja wierność>poprawność>naturalność>preferencja."
- [ ] **Step 4:** Tryb A (linia ~19): „6 działów" → „~11 działów (I:4, II:2, III:3, IV:1, V:1)". Dodaj do Workflow rejestru krok: „**Dla M2–M5: dopisz/zweryfikuj wpisy klocków w `slownik.json` (intro/review[]) ZANIM generujesz dział.**"
- [ ] **Step 5: Commit**
```bash
git -C ~/.claude/skills/angielski-rozdzial add SKILL.md
git -C ~/.claude/skills/angielski-rozdzial commit -m "feat: SKILL.md v2 (checker 1a, wymowa w recenzencie A, back-translation w C)"
```

---

## Task 7: Syllabus v2 (`PROGRAM.md`)

**WYMAGA:** Task 0.

- [ ] **Step 1:** `5 odcinków po 6 działów ... = 30 działów` → „5 minikursów × ~11 działów = ~55 działów"; `minikurs = 6 działów` → „~11 działów"; tabela metody (Dział): I→1–4, II→5–6, III→7–9, IV→10, V→11.
- [ ] **Step 2:** Przepisz „4. MINIKURS 1" na 11 działów wg mapy z Task 5 Step 1 (d1–d4 Etap I; d5–d6 Etap II; d7–d9 Etap III, gramatyka intro d7; d10 słuchanka 2–3 sceny; d11 egzamin). Dla d3/d4/d8: „+ quick-check".
- [ ] **Step 3:** Status: „Generacja Minikursu 1 (działy 01–06) ... GOTOWE" → „Stary M1 (01–06) SKASOWANY; nowy M1 (01–11) wg v2 — w realizacji; [ ] checkpoint po d1–3 + próbka".
- [ ] **Step 4: Commit**
```bash
git -C ~/angielski add PROGRAM.md
git -C ~/angielski commit -m "feat: PROGRAM.md v2 (55 działów, mapa M1 na 11)"
```

---

## Task 8: Skasuj stary M1 i przebuduj manifest

**WYMAGA:** Task 7 (status zaktualizowany). **Nie deployować między tym taskiem a Task 10+.**

- [ ] **Step 1:** `ls -d ~/angielski/0[1-6]-m1* && echo "6 folderów do skasowania (są w git — odwracalne)"`.
- [ ] **Step 2:**
```bash
rm -rf ~/angielski/01-m1d1-domykanie-i-powrot ~/angielski/02-m1d2-gdzie-zamieszkac ~/angielski/03-m1d3-przegadac-z-jakiem ~/angielski/04-m1d4-wszystko-naraz ~/angielski/05-m1d5-ostatnie-dwa-tygodnie ~/angielski/06-m1d6-so-whats-next
```
- [ ] **Step 3:** `node ~/angielski/tools/generate.js` → `content.json: 0 rozdziałów, 0 plików audio`.
- [ ] **Step 4: Commit**
```bash
git -C ~/angielski add -A
git -C ~/angielski commit -m "chore: skasuj stary M1 (01-06) — regeneracja wg v2"
```

---

## Task 9: Procedura generacji działu (recepta — referencyjna)

Nie task z commitem — recepta dla Tasków 10–13, 15. **WYMAGA: Task 1,4,5,6,7,8 ukończone.** Każdy dział:

1. **Kontekst:** z `slownik.json` zbierz klocki `intro`==dział i `review[]`∋dział. Wczytaj reguły z `METODA-C1.md` i etap z `PROGRAM.md`. (M2–M5: najpierw dopisz klocki do `slownik.json`.)
2. **Napisz `rozdzial.md`** w `~/angielski/NN-mKdN-slug/`: **~4 grupy/dział**; Etap I = 2–3 nowe klocki × 8–12 zdań, drabinka rosnąca, kontrast B2→C1, partner kolokacyjny rotowany; recykling jako **aktywne wydobycie** (PL→EN, stary klocek = cel, PL bez angielskiego klocka); grupa-splot na końcu; od d3 quick-check (2–3 pary `<!-- mode: EN-only -->`); produkcja swobodna od d2 (EN wypełnione, `<!-- produkcja swobodna -->`). Markery trybu dla Etapu II/IV/V. **Warstwa wymowy w `## Nowe słowa`.** Escapuj `\|`. EN nigdy puste.
3. **Checker (bramka obiektywna):** `node ~/.claude/skills/angielski-rozdzial/check-recykling.js <ścieżka>/rozdzial.md mK-dN` → musi być PASS (brak BRAK-ów). Popraw i powtórz.
4. **Trzej recenzenci Opus** (Task tool, `model: opus`, równolegle): A (poprawność+US **+ warstwa wymowy w Nowych słowach**), B (naturalność+rejestr+poziom), C (wierność+wydobycie+rotacja; dostaje slownik+METODA; pomija wierność w `en-only`; **back-translation tylko referent/ogólność, dopuszcza rozjazd stylu PL**). Napraw BŁĄD/ZMIEŃ. **Max 3 iteracje**, precedencja wierność>poprawność>naturalność>preferencja; potem do checkpointu z listą spornych.
5. **PDF:** `make-pdf` → `/tmp/rozdzial.pdf` → skopiuj do folderu działu jako `rozdzial.pdf`.
6. **Audio:** `node ~/.claude/skills/angielski-rozdzial/assemble-audio.js <ścieżka>/rozdzial.md` (idempotentne; `--force` przy zmianie treści).
7. **Manifest:** `node ~/angielski/tools/generate.js`.
8. **Commit (kurs):** `git -C ~/angielski add NN-mKdN-slug content.json && git -C ~/angielski commit -m "feat: M1 dział N — <temat>"`.

---

## Task 10: M1 dział 1 (Etap I, fundament)

**WYMAGA: Task 1,4,5,6,7,8.** Files: Create `~/angielski/01-m1d1-<slug>/...`; Modify `content.json`.

- [ ] **Step 1:** Procedura (Task 9) dla `m1-d1`, temat „Domykanie i powrót" (klocki: wrap-up, head-back, for-good). Brak recyklingu (1. dział).
- [ ] **Step 2:** `node .../check-recykling.js ~/angielski/01-m1d1-*/rozdzial.md m1-d1` → wszystkie INTRO, PASS.
- [ ] **Step 3:** 3 recenzentów (Opus) → napraw → PDF → audio → `generate.js`.
- [ ] **Step 4:** Commit (Procedura krok 8).

## Task 11: M1 dział 2 (Etap I + pierwszy recykling + produkcja swobodna)

Files: Create `~/angielski/02-m1d2-<slug>/...`.

- [ ] **Step 1:** Procedura dla `m1-d2` (klocki: mixed-feelings, on-the-fence, move-back-in-parents). Recykling d1 jako **wydobycie**. Grupa „produkcja swobodna".
- [ ] **Step 2:** `check-recykling.js ... m1-d2` → wrap-up/head-back/for-good obecne (wydobycia ≥1), PASS.
- [ ] **Step 3:** Recenzenci → PDF → audio → `generate.js`. **Step 4:** Commit.

## Task 12: M1 dział 3 (Etap I + pierwszy quick-check)

Files: Create `~/angielski/03-m1d3-<slug>/...`.

- [ ] **Step 1:** Procedura dla `m1-d3` (klocki: figure-out, go-out-on-my-own). Recykling d1–d2. Ostatnia grupa = quick-check (`<!-- mode: EN-only -->`, 2–3 pary).
- [ ] **Step 2:** `check-recykling.js ... m1-d3` → PASS; potwierdź marker en-only w quick-checku.
- [ ] **Step 3:** Recenzenci → PDF → audio → `generate.js`. **Step 4:** Commit.

## Task 13: Próbka drugiej połowy (do checkpointu, w `/tmp`, NIE commitowana)

Żeby checkpoint ocenił składanie/słuchankę/egzamin. Trzymaj w `/tmp/probka-m1/` (poza repo — brak śmieci, brak kolizji z `generate.js`).

- [ ] **Step 1:** Napisz `/tmp/probka-m1/rozdzial.md`, 3 grupy WYŁĄCZNIE na klockach d1–d3: G1 Etap III (splot 2–3 klocków + 1 struktura C1, np. cleft); G2 `<!-- mode: słuchanka -->` (1 scena ~8–12 zdań); G3 `<!-- mode: EN-only -->` (3 pytania + wzorcowe odpowiedzi).
- [ ] **Step 2:** Audio: `node .../assemble-audio.js /tmp/probka-m1/rozdzial.md` (weryfikuje 3 tryby naraz).
- [ ] **Step 3:** PDF (make-pdf) → `/tmp/probka-m1/rozdzial.pdf`. (Brak commita — to materiał oceny, nie kursu.)

## Task 14: 🛑 CHECKPOINT — TWARDY STOP (ludzka bramka)

**Executor: ZATRZYMAJ SIĘ. NIE wykonuj Część B (Task 15+), dopóki Krzysiek nie napisze explicite „checkpoint OK / 4+".**

- [ ] **Step 1:** Pokaż Krzyśkowi: działy 1–3 (md+PDF+audio) + próbkę z `/tmp/probka-m1`.
- [ ] **Step 2: Mierzalne pytanie:** „Weź 2 klocki z d1 i policz, ile razy wróciły w d2–3 i czy za każdym razem w innym połączeniu." Pokaż też `check-recykling.js --audit ~/angielski` (wydobycia per klocek).
- [ ] **Step 3:** Werdykt: **≥4+** → Część B. **<4+** → wypisz braki, popraw `METODA-C1.md`/`slownik.json`, regeneruj d1–3 (`--force` audio), powtórz checkpoint (regeneruj też próbkę).

---

## === CZĘŚĆ B (dopiero po ludzkim „4+") ===

## Task 15: M1 działy 4–11 (każdy = osobny task/commit/recenzja)

Każdy przez Procedurę (Task 9). Wznawialne per dział.

- [ ] **15a — d4** (`04-m1d4`): Etap I; klocki talk-it-over/sleep-on-it/second-guess; recykling d1–3; quick-check. Checker `m1-d4` PASS.
- [ ] **15b — d5** (`05-m1d5`): Etap II `<!-- mode: EN→PL -->`; powtórka konwersacyjna; recykling całego Etapu I. Checker `m1-d5` PASS.
- [ ] **15c — d6** (`06-m1d6`): Etap II; swobodne wymiany + mini-narracja. Checker `m1-d6` PASS.
- [ ] **15d — d7** (`07-m1d7`): Etap III; składanie + **intro klocków gramatycznych** (cleft/inwersje/mixed-cond/turns-out, `intro: m1-d7`); przeplatanie typów. Checker `m1-d7` → gramatyka INTRO, PASS.
- [ ] **15e — d8** (`08-m1d8`): Etap III; trudniejsze sploty + quick-check. Checker PASS.
- [ ] **15f — d9** (`09-m1d9`): Etap III; pełne splatanie minikursu. Checker PASS.
- [ ] **15g — d10** (`10-m1d10`): Etap IV `<!-- mode: słuchanka -->`; 2–3 sceny (~400–600 słów). Checker `m1-d10` → wszystkie klocki M1 obecne.
- [ ] **15h — d11** (`11-m1d11`): Etap V `<!-- mode: EN-only -->`; egzamin 3 grupy. Checker `m1-d11` PASS.
- [ ] **15i — audyt + apka:** `node .../check-recykling.js --audit ~/angielski` → PASS (każdy rdzeniowy ≥5 wydobyć). `node tools/generate.js`; otwórz `index.html` — M1 ma 11 działów z audio, routing `#/c/<id>` działa.

## Task 16: M2–M5 (po walidacji całego M1)

- [ ] **Step 1:** Potwierdź z Krzyśkiem, czy „11 działów" zostaje wzorcem.
- [ ] **Step 2:** Uzupełnij `slownik.json` (M2–M5: pełne wpisy intro/review[] na siatce 11; recykling klocków M1 sięga m2–m5) i `PROGRAM.md` (mapy). Walidacja jak Task 5 Step 3 (per minikurs).
- [ ] **Step 3:** Generuj minikurs po minikursie Procedurą (Task 9). Numeracja: M2=12–22, M3=23–33, M4=34–44, M5=45–55. Po każdym minikursie `--audit`.
- [ ] **Step 4:** Przed każdą falą oszacuj koszt audio (`liczba_par × ~3 wywołań TTS × cena gpt-4o-mini-tts`); idempotencja (`shouldSkip`) chroni przed podwójną generacją; **STOP na decyzję po M2** (kosztowy checkpoint).

---

## Self-Review (po rewizji 2)

**Spec coverage:** 11-działowa struktura (T7,10–15) ✓; recykling obecność (T1 per-dział) + **WYDOBYCIE ≥5 jako bramka** (T1 `--audit`, T14 S2, T15i) ✓; wydobycie≠ekspozycja (T1 `isRetrieval`, T4 S3) ✓; quick-checki (T4,12) ✓; słuchanka/egzamin (T15g–h) ✓; warstwa wymowy **z bramką** (T4 S4 + recenzent A w T6/T9) ✓; back-translation niuans (T4 S5, T6 S3, T9) ✓; precedencja+3 iteracje (T4,6,9) ✓; tryby audio = weryfikacja (T3) ✓; kasacja M1 (T8) ✓; checkpoint **twardy STOP** (T14, podział A/B) ✓; M2–M5 (T16) ✓; OpenAI/zero-ElevenLabs (Global) ✓; review[] 6→11 + luki≤4 (T5) ✓.

**Naprawione findingi recenzji:** `const out` duplikat (T2 S3 — modyfikacja istniejącej linii) ✓; niezacommitowane repo skilla (T0) ✓; checker liczył tylko obecność (T1 `isRetrieval`+`--audit`) ✓; matcher false-positive na krótkich kluczach (`wordMatches`: ≤2 exact) ✓; „/" wewnątrz „()" (keywords: nawiasy przed split) ✓; checkpoint nie-STOP (podział A/B + 🛑) ✓; brak zależności (sekcja Zależności + „WYMAGA" per task) ✓; Task 15 za gruby (15a–i) ✓; otwarte wiersze vs parser (T4 S4: EN zawsze wypełnione) ✓; d7 vs d8 (T5 S1: d7) ✓; próbka w repo (T13: `/tmp`) ✓; grep/wystąpienia (T4 S1,S6) ✓; hard-coded liczba asercji (T1 S4: bez hard-code) ✓.

**Type consistency:** `check(mdPath,dzialId,slownikPath)`, `audit(dir,slownikPath)`, `keywords(en)`, `wordMatches(kw,w)`, `lineHasAll(lineWords,kws)`, `isRetrieval(pair,kws,mode)`, `countOccurrences(groups,kws)->{lines,groups,retrievals}`, `shouldSkip(outPath,force)` — spójne między T1/T2, testami i Procedurą. `parseChapter` z eksportu `assemble-audio.js`.

**Znane ograniczenia checkera** (recenzent C backstopem): czasowniki nieregularne (go↔went), 2. wariant po „/", rzadkie kolizje prefiksu 3-znakowego (for↔forgot).
