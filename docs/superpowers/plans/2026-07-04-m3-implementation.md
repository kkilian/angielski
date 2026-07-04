# M3 „Rozkręcam to" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wyprodukować minikurs M3 (11 działów, foldery 23–33) — realny łuk budowania MadreM, przeważony pod diagnozę B2→C1 (irrealis jako czerwona nić, mikro-dryl rodzajników, więcej produkcji, umiarkowany recykling).

**Architecture:** Istniejący pipeline `angielski-rozdzial` (Tryb B: jeden dział na raz) + istniejące narzędzia (`check-recykling.js`, `assemble-audio.js`, `tools/generate.js`, `tools/build-podglad.js`). Jedyna zmiana kodu: dodanie flagi progu do audytu recyklingu, żeby dopuścić umiarkowany recykling M3 bez osłabiania M1/M2. Reszta to produkcja treści przez pipeline (pisarz → checker → 3 recenzentów opus → PDF → audio), dział po dziale, z commitem per dział.

**Tech Stack:** Node.js (skrypty, zero zależności), Markdown (`rozdzial.md` — kontrakt parsera audio), OpenAI TTS (PL=nova, EN=alloy), skille: `angielski-rozdzial`, `make-pdf`.

## Global Constraints

Każdy task dziedziczy poniższe (wartości skopiowane z `docs/superpowers/specs/2026-07-04-m3-design.md` i `METODA-C1.md`):

- **Wariant:** General American; rejestr neutralny, peer; **bez slangu na siłę** (≤1 „(luźno)"/grupa; **zero „(sztywno)" w drylu** — kontrast B2→C1 idzie do notki „Typowe błędy").
- **Nazwy folderów:** `<NN>-m3d<N>-<slug>`, `NN` = 23–33 (kontrakt `tools/generate.js` regex `^\d{2}-m(\d+)d(\d+)-` i `check-recykling.js` `m(\d+)d(\d+)`).
- **ID działu w slowniku/checkerze:** `m3-d<N>` (z myślnikiem).
- **Kontrakt formatu `rozdzial.md`:** nagłówki dokładnie `## Grupa N`; tabele `| polski | angielski |` (Etap II „scenka" = 3 kolumny `| pytanie (EN) | podpowiedź (PL) | odpowiedź (EN) |`); markery trybu jako komentarz pod nagłówkiem grupy (`<!-- mode: scenka -->`, `<!-- mode: słuchanka -->`, `<!-- mode: EN-only -->`); sekcja `## Nowe słowa i struktury` na końcu (poza audio).
- **Recykling: umiarkowany.** M3 rdzeniowe klocki dostają `review[]` długości **~3** (nie ≥5); audyt uruchamiany z `--min-core 3`. Klocki gramatyki: `review[]` ~3, audyt `--min-gram 3` (bez zmian względem domyślnego 3).
- **Irrealis = kręgosłup:** każdy dział sadzi/wzmacnia hipotezę (sekwencja z tasków niżej). W „Typowe błędy" używaj **realnych błędów Krzyśka z diagnozy** dosłownie (np. „they may most stop caring" → „may have stopped"; „more serious" → „more seriously"; „exchange for" → „replace/make up for"; „in between us" → „between us").
- **Mikro-dryl rodzajników:** w działach d1–d9 jedna grupa PL→EN skomponowana tak, że każdy wiersz zawiesza się na wyborze `a/an/the/∅` (naturalny wyzwalacz PL wymusza właściwy rodzajnik w EN). Bez nowego tooling — zwykła grupa 2-kolumnowa, 6–8 par.
- **Audio:** OpenAI, PL=nova, EN=alloy; bez ElevenLabs.
- **Recenzenci:** 3 agenci opus (A poprawność+US, B naturalność+rejestr+poziom, C wierność PL↔EN + przeplatanie) na każdy dział; napraw KAŻDY BŁĄD/ZMIEŃ; max 3 iteracje; precedencja: wierność > poprawność > naturalność > preferencja.

---

## File Structure

- **Modify:** `~/.claude/skills/angielski-rozdzial/check-recykling.js` — dodać flagi `--min-core`/`--min-gram` do audytu (domyślne 5/3 → M1/M2 bez zmian).
- **Modify:** `~/.claude/skills/angielski-rozdzial/test-check-recykling.js` — test progu audytu.
- **Modify:** `~/angielski/slownik.json` — dodać M3 `wyrazenia` (intro + `review[]`~3), wpis `m3` w `minikursy[]`, oraz dopisać `m3-d*` do `review[]` wybranych klocków M1/M2 (recykling transferowy, umiarkowany).
- **Create:** `~/angielski/23-m3d1-...` … `33-m3d11-...` — po jednym folderze/dział, każdy z `rozdzial.md` + `rozdzial.pdf` + `grupa-N.mp3`.
- **Modify (regenerowane):** `~/angielski/content.json` (`node tools/generate.js`), `~/angielski/podglad.html` (`node tools/build-podglad.js`).
- **Modify:** `~/angielski/PROGRAM.md` — status M3 (temat zmieniony vs stary „mieszkanie/codzienność"; odnotować przetasowanie M4/M5).

---

## Production Recipe (obowiązuje w KAŻDYM tasku działu 3–13)

Niezmienny przepis; taski działów podają tylko parametry (klocki, gramatyka, tryb, slug) i wykonują dokładnie te kroki, podstawiając ścieżkę folderu:

1. **Slownik gotowy:** upewnij się, że `slownik.json` ma klocki tego działu (`intro`/`review[]` ustawione w Tasku 2).
2. **Generacja `rozdzial.md`:** wygeneruj dział wg `METODA-C1.md` (Tryb B skilla `angielski-rozdzial`) z parametrami z wiersza taska: zasiew→splot→składanka, ~5–6 grup, marker trybu jeśli ≠ Etap I, grupa mikro-dryl rodzajników (d1–d9), sekcja „Nowe słowa i struktury" z warstwą wymowy (akcent + ≥1 pułapka) i „Typowe błędy" (realne błędy Krzyśka). Zapisz do `~/angielski/<NN>-m3d<N>-<slug>/rozdzial.md`.
3. **Gate — checker recyklingu (OBOWIĄZKOWY, przed recenzentami):**
   `node ~/.claude/skills/angielski-rozdzial/check-recykling.js ~/angielski/<NN>-m3d<N>-<slug>/rozdzial.md m3-d<N>`
   Oczekiwane: `PASS.` Jeśli `FAIL: brak: …` → dopnij wydobycia brakujących klocków, powtórz.
4. **Trzej recenzenci (Task tool, model opus):** wyślij A/B/C wg `SKILL.md` Krok 1; napraw każdy BŁĄD/ZMIEŃ; powtórz checker; max 3 iteracje.
5. **PDF:** wywołaj skill `make-pdf` na `rozdzial.md` → `/tmp/rozdzial.pdf`; skopiuj do folderu działu jako `rozdzial.pdf`.
6. **Audio:** `node ~/.claude/skills/angielski-rozdzial/assemble-audio.js "~/angielski/<NN>-m3d<N>-<slug>/rozdzial.md"` → `grupa-1.mp3 … grupa-N.mp3`.
7. **Commit** (tylko folder tego działu):
   `git add ~/angielski/<NN>-m3d<N>-<slug> && git commit -m "M3 d<N>: <slug>"`

---

## Task 1: Flaga progu audytu w `check-recykling.js` (jedyny kod)

**Files:**
- Modify: `~/.claude/skills/angielski-rozdzial/check-recykling.js:80-94` (funkcja `main`, gałąź `--audit`)
- Test: `~/.claude/skills/angielski-rozdzial/test-check-recykling.js`

**Interfaces:**
- Produces: eksport `auditThreshold(typ, {minCore, minGram})` → `number`; CLI `--audit <dir> [--min-core N] [--min-gram N]`. Domyślne: `minCore=5`, `minGram=3` (M1/M2 bez zmian).

- [ ] **Step 1: Test progu (failing)** — dopisz do `test-check-recykling.js`:

```js
const { auditThreshold } = require('./check-recykling');
const assert = require('assert');
// domyślnie: rdzeniowy 5, gramatyka 3
assert.strictEqual(auditThreshold('idiom', {}), 5);
assert.strictEqual(auditThreshold('gramatyka', {}), 3);
// flaga obniża próg rdzeniowy, nie ruszając gramatyki
assert.strictEqual(auditThreshold('phrasal', { minCore: 3 }), 3);
assert.strictEqual(auditThreshold('gramatyka', { minCore: 3 }), 3);
console.log('auditThreshold OK');
```

- [ ] **Step 2: Uruchom test — ma FAIL**

Run: `node ~/.claude/skills/angielski-rozdzial/test-check-recykling.js`
Expected: FAIL — `auditThreshold is not a function`.

- [ ] **Step 3: Implementacja** — w `check-recykling.js` dodaj helper i podłącz do `main`:

```js
// przy innych funkcjach:
function auditThreshold(typ, { minCore = 5, minGram = 3 } = {}) {
  return typ === 'gramatyka' ? minGram : minCore;
}
```

W `main`, w gałęzi `--audit`, przed pętlą wyników:

```js
const mcIdx = args.indexOf('--min-core');
const mgIdx = args.indexOf('--min-gram');
const opts = {
  minCore: mcIdx >= 0 ? Number(args[mcIdx + 1]) : 5,
  minGram: mgIdx >= 0 ? Number(args[mgIdx + 1]) : 3,
};
```

Zmień linię `const min = r.typ === 'gramatyka' ? 3 : 5;` na:

```js
const min = auditThreshold(r.typ, opts);
```

Dodaj `auditThreshold` do `module.exports`.

- [ ] **Step 4: Uruchom test — ma PASS**

Run: `node ~/.claude/skills/angielski-rozdzial/test-check-recykling.js`
Expected: `auditThreshold OK` + reszta istniejących testów PASS.

- [ ] **Step 5: Regresja M1/M2** — audyt domyślny nadal przechodzi:

Run: `node ~/.claude/skills/angielski-rozdzial/check-recykling.js --audit ~/angielski`
Expected: `PASS: wszystkie klocki ≥ progu wydobyć.` (M1/M2 bez zmian).

- [ ] **Step 6: Commit**

```bash
git add ~/.claude/skills/angielski-rozdzial/check-recykling.js ~/.claude/skills/angielski-rozdzial/test-check-recykling.js
```
(uwaga: skill jest poza repo `~/angielski` — commit w repo skilla, jeśli wersjonowane; inaczej pomiń `git add` dla plików spoza repo i odnotuj zmianę w PROGRAM.md.)

---

## Task 2: Przygotowanie `slownik.json` pod M3

**Files:**
- Modify: `~/angielski/slownik.json` (`wyrazenia[]`, `minikursy[]`)

**Interfaces:**
- Produces: wpisy klocków M3 (`id`, `pl`, `en`, `typ`, `intro: m3-d<N>`, `review[]`~3) — czytane przez `check-recykling.js` i pisarza; wpis `m3` w `minikursy[]` — czytany przez `tools/generate.js`.

- [ ] **Step 1: Dodaj wpis minikursu** do `slownik.json → minikursy[]`:

```json
{ "id": "m3", "tytul": "Rozkręcam to — budowanie MadreM",
  "temat": "Środek wchodzenia na swoje: łapanie uczniów, kanał, wpadki i sucha passa, ważenie ryzyka i duże decyzje. Bohaterowie: Jake (kumpel z zagranicy), sceptyczny brat (silnik hipotez). Fokus: irrealis (2nd/3rd/mixed cond, modal perfects, wish/if only) + rodzajniki. Rejestr: neutralny peer.",
  "status": "w produkcji (23-33)" }
```

- [ ] **Step 2: Dodaj nowe klocki leksykalne M3** do `wyrazenia[]` (Etap I + rodzina ryzyka + naprawy). `review[]` **~3** (umiarkowanie), interwały +2/+4 i obowiązkowo Etap II/III M3:

```json
{ "id": "line-up-students", "pl": "ustawić/załatwić (uczniów)", "en": "to line up (students)", "typ": "phrasal", "intro": "m3-d1", "review": ["m3-d3", "m3-d5", "m3-d9"] },
{ "id": "word-of-mouth", "pl": "poczta pantoflowa", "en": "word of mouth", "typ": "idiom", "intro": "m3-d1", "review": ["m3-d4", "m3-d8"] },
{ "id": "take-on-student", "pl": "brać (ucznia)", "en": "to take on (a student)", "typ": "phrasal", "intro": "m3-d1", "review": ["m3-d4", "m3-d9"] },
{ "id": "put-out-videos", "pl": "wrzucać (filmy)", "en": "to put out (videos)", "typ": "phrasal", "intro": "m3-d2", "review": ["m3-d5", "m3-d10"] },
{ "id": "gain-traction", "pl": "zacząć się przyjmować/łapać", "en": "to gain traction", "typ": "kolokacja", "intro": "m3-d2", "review": ["m3-d6", "m3-d10"] },
{ "id": "stick-with-it", "pl": "nie odpuszczać, wytrwać", "en": "to stick with it", "typ": "phrasal", "intro": "m3-d2", "review": ["m3-d5", "m3-d8"] },
{ "id": "fall-through", "pl": "rozpaść się (plan/umowa)", "en": "to fall through", "typ": "phrasal", "intro": "m3-d3", "review": ["m3-d6", "m3-d9"] },
{ "id": "dry-up", "pl": "wyschnąć (źródło, uczniowie)", "en": "to dry up", "typ": "phrasal", "intro": "m3-d3", "review": ["m3-d5", "m3-d9"] },
{ "id": "cover-the-bills", "pl": "pokrywać (rachunki)", "en": "to cover the bills", "typ": "kolokacja", "intro": "m3-d3", "review": ["m3-d7", "m3-d10"] },
{ "id": "take-a-shot-at", "pl": "spróbować (czegoś), podejść do", "en": "to take a shot at", "typ": "idiom", "intro": "m3-d4", "review": ["m3-d6", "m3-d9"] },
{ "id": "run-paid-ads", "pl": "puścić płatne reklamy", "en": "to run (paid) ads", "typ": "kolokacja", "intro": "m3-d4", "review": ["m3-d7", "m3-d10"] },
{ "id": "weigh-the-risks", "pl": "ważyć ryzyko", "en": "to weigh the risks", "typ": "kolokacja", "intro": "m3-d5", "review": ["m3-d7", "m3-d11"] },
{ "id": "break-even", "pl": "wyjść na zero", "en": "to break even", "typ": "idiom", "intro": "m3-d5", "review": ["m3-d8", "m3-d11"] },
{ "id": "set-aside-money", "pl": "odłożyć (pieniądze)", "en": "to set aside (money)", "typ": "phrasal", "intro": "m3-d5", "review": ["m3-d8", "m3-d10"] },
{ "id": "make-up-for", "pl": "zrekompensować / nadrobić", "en": "to make up for / to replace", "typ": "phrasal", "intro": "m3-d3", "review": ["m3-d6", "m3-d9"] },
{ "id": "launch-release", "pl": "wypuścić / odpalić (produkt)", "en": "to launch / to release", "typ": "kolokacja", "intro": "m3-d2", "review": ["m3-d6", "m3-d11"] },
{ "id": "provide-give", "pl": "dawać / zapewniać", "en": "to provide / to give", "typ": "kolokacja", "intro": "m3-d6", "review": ["m3-d9", "m3-d11"] }
```

- [ ] **Step 3: Dodaj klocki gramatyczne M3 (irrealis)** do `wyrazenia[]` (`typ: gramatyka`, `review[]`~3):

```json
{ "id": "second-conditional", "pl": "gdyby (teraz/ogólnie), to bym…", "en": "If it flopped, I'd start over.", "typ": "gramatyka", "intro": "m3-d4", "review": ["m3-d5", "m3-d9", "m3-d11"] },
{ "id": "third-conditional", "pl": "gdybym był (wtedy)…, to bym był…", "en": "If I'd started a year ago, I would have had a following by now.", "typ": "gramatyka", "intro": "m3-d6", "review": ["m3-d8", "m3-d9", "m3-d11"] },
{ "id": "mixed-conditional-modal-perfect", "pl": "warunek mieszany + modal perfect", "en": "They may have stopped caring — I should have left sooner.", "typ": "gramatyka", "intro": "m3-d7", "review": ["m3-d9", "m3-d10", "m3-d11"] },
{ "id": "wish-if-only", "pl": "żałuję, że… / gdyby tylko…", "en": "I wish I'd put out videos back then.", "typ": "gramatyka", "intro": "m3-d8", "review": ["m3-d9", "m3-d10", "m3-d11"] }
```

- [ ] **Step 4: Recykling transferowy (umiarkowany)** — dopisz `m3-d*` do `review[]` wybranych klocków M1/M2 związanych z decyzją/ryzykiem (≤2 powroty każdy, żeby nie przeładować). Np. do `figure-out`, `on-the-fence`, `go-all-in`, `pull-the-trigger`, `second-guess` dopisz po jednym-dwa `m3-d<N>` (rozłóż na d1, d4, d7). Zachowaj istniejące wpisy.

- [ ] **Step 5: Walidacja JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync(process.env.HOME+'/angielski/slownik.json','utf8')); console.log('slownik OK')"`
Expected: `slownik OK`.

- [ ] **Step 6: Commit**

```bash
git add ~/angielski/slownik.json && git commit -m "M3: rejestr slownik.json (klocki + minikurs + recykling ~3)"
```

---

## Tasks 3–13: Produkcja działów (Recipe + parametry)

Każdy task = **Production Recipe** z parametrami z wiersza. Kolejność ważna (recykling zależy od wcześniejszych). Commit per dział.

| Task | Folder | Tryb / marker | Nowe klocki (intro tu) | Gramatyka (kręgosłup) | Uwagi |
|---|---|---|---|---|---|
| **3** (d1) | `23-m3d1-lapanie-uczniow` | Etap I (PL→EN) | line-up-students, word-of-mouth, take-on-student | ziarno 1st→**2nd cond** | + grupa mikro-dryl rodzajników; bohater: kalendarz pusty |
| **4** (d2) | `24-m3d2-kanal-rusza` | Etap I | put-out-videos, gain-traction, stick-with-it, launch-release | ziarno **2nd cond** | naprawa „put out there"→launch/release; rodzajniki |
| **5** (d3) | `25-m3d3-sucha-passa` | Etap I | fall-through, dry-up, cover-the-bills, make-up-for | ziarno **2nd/3rd** | naprawa „exchange for"→replace/make up for; quick-check od d3; rodzajniki |
| **6** (d4) | `26-m3d4-sceptyczny-brat` | Etap II `<!-- mode: scenka -->` | take-a-shot-at, run-paid-ads, **second-conditional** | **2nd cond wymuszony** | brat pyta „a jak ci się zawali?"; klocek pada w ODPOWIEDZI (kol.3); naprawa „paid advertisement"→run ads |
| **7** (d5) | `27-m3d5-swobodne-wymiany` | Etap II `<!-- mode: scenka -->` | weigh-the-risks, break-even, set-aside-money | 2nd cond + hipotezy | rozgrzewka słuchanki; rodzajniki |
| **8** (d6) | `28-m3d6-decyzje-i-ryzyko` | Etap III (PL→EN) | provide-give | **3rd conditional** intro | splot 2–3 klocków; naprawa „support with feedback"→provide/give (parallelism) |
| **9** (d7) | `29-m3d7-trudniejsze-sploty` | Etap III | — | **mixed cond + modal perfects** | naprawa „may most stop caring"→may have stopped; quick-check |
| **10** (d8) | `30-m3d8-pelne-splatanie` | Etap III | — | **wish / if only** | cały minikurs w splocie |
| **11** (d9) | `31-m3d9-silownia-conditionali` | Etap II `<!-- mode: scenka -->` | — | **wszystkie typy, mieszane** | silnik automatyzmu: każdy prompt = inny typ hipotezy, wciąż nowa treść; recykling gęsty |
| **12** (d10) | `32-m3d10-sluchanka-make-or-break` | Etap IV `<!-- mode: słuchanka -->` | — | narracja nasycona hipotezami | „Make-or-break month at MadreM", ~150–250 słów, 2–3 sceny; EN ciągłe, PL w PDF |
| **13** (d11) | `33-m3d11-egzamin-what-if` | Etap V `<!-- mode: EN-only -->` | — | **spontaniczne conditionale** | pytania „What if…"; kol.1 = pytanie EN, kol.2 = wzorcowa odpowiedź |

**Dla każdego z Tasków 3–13 (checkbox per dział):**

- [ ] **Task 3 — d1** — wykonaj Recipe kroki 1–7 z parametrami wiersza 3. Gate: `check-recykling … m3-d1` = PASS. Commit `M3 d1: łapanie uczniów`.
- [ ] **Task 4 — d2** — Recipe z wiersza 4. Gate `m3-d2` PASS. Commit `M3 d2: kanał rusza`.
- [ ] **Task 5 — d3** — Recipe z wiersza 5. Gate `m3-d3` PASS. Commit `M3 d3: sucha passa`.
- [ ] **Task 6 — d4** — Recipe z wiersza 6 (**scenka**: 3 kolumny, klocek w kol.3). Gate `m3-d4` PASS. Commit `M3 d4: sceptyczny brat`.
- [ ] **Task 7 — d5** — Recipe z wiersza 7 (**scenka**). Gate `m3-d5` PASS. Commit `M3 d5: swobodne wymiany`.
- [ ] **Task 8 — d6** — Recipe z wiersza 8. Gate `m3-d6` PASS. Commit `M3 d6: decyzje i ryzyko`.
- [ ] **Task 9 — d7** — Recipe z wiersza 9. Gate `m3-d7` PASS. Commit `M3 d7: trudniejsze sploty`.
- [ ] **Task 10 — d8** — Recipe z wiersza 10. Gate `m3-d8` PASS. Commit `M3 d8: pełne splatanie`.
- [ ] **Task 11 — d9** — Recipe z wiersza 11 (**scenka**, sam irrealis). Gate `m3-d9` PASS. Commit `M3 d9: siłownia conditionali`.
- [ ] **Task 12 — d10** — Recipe z wiersza 12 (**słuchanka**; recenzent C pomija wierność jak dla trybów specjalnych). Gate `m3-d10` PASS. Commit `M3 d10: słuchanka`.
- [ ] **Task 13 — d11** — Recipe z wiersza 13 (**EN-only**; recenzent C i checker pomijają kol.1 jako pytanie EN). Gate `m3-d11` PASS. Commit `M3 d11: egzamin what if`.

---

## Task 14: Regeneracja manifestu i podglądu + audyt programu

**Files:**
- Modify (regenerowane): `~/angielski/content.json`, `~/angielski/podglad.html`

- [ ] **Step 1: Manifest strony**

Run: `node ~/angielski/tools/generate.js`
Expected: log wymienia `m3 „Rozkręcam to…" — 11 działów / N audio` oraz `generated: true` dla m3.

- [ ] **Step 2: Podgląd lokalny (⭐ + ▶︎)**

Run: `node ~/angielski/tools/build-podglad.js`
Expected: `podglad.html` zawiera M3. (Jeśli skrypt wymaga argów — sprawdź jego nagłówek `--help`/komentarz; wywołaj zgodnie.)

- [ ] **Step 3: Audyt recyklingu całego programu z progiem M3**

Run: `node ~/.claude/skills/angielski-rozdzial/check-recykling.js --audit ~/angielski --min-core 3`
Expected: `PASS: wszystkie klocki ≥ progu wydobyć.` (M1/M2 nadal ≥5; M3 ≥3.)

- [ ] **Step 4: Commit**

```bash
git add ~/angielski/content.json ~/angielski/podglad.html && git commit -m "M3: regeneracja content.json + podglad.html"
```

---

## Task 15: Aktualizacja PROGRAM.md + domknięcie

**Files:**
- Modify: `~/angielski/PROGRAM.md`

- [ ] **Step 1: Zaktualizuj sekcje M3 i status** — w `PROGRAM.md`: zmień temat M3 z „Mieszkanie i codzienność" na „Rozkręcam to — budowanie MadreM (ryzyko/decyzje)"; odnotuj, że ściągnięcie tematu ryzyka z M5 **przetasowuje M4/M5** (rewizja osobno, po walidacji M3); dopisz w sekcji 7 status: `M3 KOMPLETNY (23–33)`.
- [ ] **Step 2: Commit**

```bash
git add ~/angielski/PROGRAM.md && git commit -m "M3: syllabus + status (temat = MadreM, przetasowanie M4/M5)"
```

- [ ] **Step 3: PR / handoff** — gałąź `m3-design` gotowa do przeglądu; zaproponuj użytkownikowi ocenę M3 (cel ≥4+) przed finalizacją M4/M5.

---

## Self-Review (wypełnione przy pisaniu planu)

- **Pokrycie specu:** temat MadreM (Task 2/3–13) ✓; szkielet 11 działów przeważony (tabela 3–13) ✓; irrealis od d1 + siłownia d9 (kręgosłup) ✓; rodzajniki (Global Constraints + d1–d9) ✓; więcej produkcji/mniej drylu (Etap I 3 działy, +scenka d4/d5/d9) ✓; recykling umiarkowany ~3 (Task 1 flaga + Task 2 review[]) ✓; naprawy leksykalne z diagnozy (Task 2 + wiersze d2/d3/d4/d6) ✓; Anki/⭐ (Task 14 podglad) ✓; kryteria sukcesu → egzamin d11 (Task 13) ✓.
- **Placeholdery:** brak „TBD"; recykling transferowy w Tasku 2 Step 4 wskazuje konkretne id klocków i rozkład — deterministyczne, nie placeholder.
- **Spójność typów:** `auditThreshold(typ, opts)`, flagi `--min-core/--min-gram`, id działów `m3-d<N>`, foldery `<NN>-m3d<N>-<slug>` — spójne między Task 1/2/14 i Recipe.
- **Zakres:** jeden podsystem (treść M3) → jeden plan; M4/M5 świadomie poza zakresem (Task 15).
