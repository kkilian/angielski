# Kurs K Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zbudować niezależny, rozwojowy kurs K z działami K1 i K2, zweryfikowanymi PDF-ami i MP3 oraz osobną mobilną mikrowitryną audio.

**Architecture:** Treść i rejestr mieszkają wyłącznie pod `K/`. Generator skanuje foldery K i tworzy `k-content.json`; `k.html` z własnym JS/CSS czyta ten manifest i używa jednego natywnego elementu audio z Media Session. Kurs M pozostaje funkcjonalnie bez zmian.

**Tech Stack:** Markdown, JSON, Node.js ESM i `node:test`, statyczny HTML/CSS/JavaScript, OpenAI TTS przez istniejący `assemble-audio.js`, generator PDF zgodny ze skillem `make-pdf`, Poppler do kontroli renderu.

## Global Constraints

- K1/K2 nie czytają `PROGRAM.md`, `slownik.json` ani `content.json` kursu M.
- Id działów: `k1`, `k2`; foldery: `K/01-k1-powiedz-to-raz`, `K/02-k2-kintsugi`.
- General American, mówiony B2 -> C1, bez wymuszonego slangu.
- Każdy nowy klocek ma układ zasiew -> splot -> składanka i naturalne pary PL/EN.
- Ostatnia grupa każdego działu jest scenką z pytaniem EN, podpowiedzią PL i odpowiedzią EN.
- Interfejs K zachowuje jeden element `<audio>`, Media Session, pętle `off/one/all`, seek, poprzedni/następny i PDF.
- Klucze pamięci przeglądarki mają prefiks `ang.k.`.
- Nie modyfikować istniejących rozdziałów ani treści kursu M.

---

### Task 1: Program K i niezależny rejestr

**Files:**
- Create: `K/PROGRAM-K.md`
- Create: `K/slownik-k.json`

**Interfaces:**
- Consumes: diagnoza transkrypcji Osoby A i worksheet kintsugi.
- Produces: `dzialy[]` z metadanymi dla generatora oraz `wyrazenia[]` w schemacie `{id, pl, en, typ, intro, review[]}` dla checkera.

- [ ] **Step 1: Utwórz program dwóch pierwszych działów**

W `PROGRAM-K.md` zapisz cel kursu, zasadę izolacji od M, opis K1/K2, listę targetów i mapę recyklingu K1 -> K2 -> przyszłe K3/K4.

- [ ] **Step 2: Utwórz rejestr**

Top-level JSON ma pola `wersja`, `kurs`, `dzialy`, `wyrazenia`. W K1 zarejestruj: `get-point-across`, `what-i-mean-is`, `blanking-on-word`, `sort-of-like`, `i-was-thinking-we-could`, `would-it-be-ok-if`, `should-have-mentioned`, `id-say`. Do K2 skieruj powroty: `get-point-across`, `what-i-mean-is`, `sort-of-like`, `should-have-mentioned`, `id-say`.

W K2 zarejestruj: `piece-back-together`, `draw-attention-to`, `embrace-imperfection`, `testament-to`, `come-out-stronger`. Ich `review[]` wskazuje wyłącznie przyszłe `k3`, `k4`, `k6`, `k10`.

- [ ] **Step 3: Sprawdź składnię i izolację**

Run:

```bash
node -e "const s=require('./K/slownik-k.json'); if(!s.wyrazenia.length) process.exit(1); if(JSON.stringify(s).match(/m[0-9]+-d[0-9]+/)) process.exit(2); console.log(s.dzialy.length, s.wyrazenia.length)"
```

Expected: `2 13` i kod 0.

### Task 2: K1 - materiał z realnej rozmowy

**Files:**
- Create: `K/01-k1-powiedz-to-raz/rozdzial.md`

**Interfaces:**
- Consumes: `K/slownik-k.json`, transkrypcję z Osobą A i kontrakt `angielski-rozdzial`.
- Produces: pięć grup audio-ready oraz sekcję słów, wymowy i typowych błędów.

- [ ] **Step 1: Napisz grupy 1-4 PL -> EN**

Każda grupa ma 10-14 par. Rozłóż targety tak, aby każdy wracał w nowych partnerach kolokacyjnych, pytaniach, przeczeniach i czasach. Konteksty muszą obejmować pracę przy aplikacjach/kursach do matury z matematyki, siłownię, szachy, ciekawostki oraz organizację lekcji.

- [ ] **Step 2: Napisz grupę 5 jako scenkę**

Dodaj `<!-- mode: scenka -->` oraz tabelę `pytanie (EN) | podpowiedź (PL) | odpowiedź (EN)`. Pytania odtwarzają realne intencje lektorki, a target pada w odpowiedzi, nie w pytaniu.

- [ ] **Step 3: Dodaj warstwę metajęzykową**

W `Nowe słowa i struktury` podaj targety słownikowo, akcent wyrazowy, co najmniej jedną pułapkę wymowy i korekty: `matura examination -> matura exam`, `it could be done in one sentence -> I could say it in one sentence`, `come across as clear -> come across clearly`.

- [ ] **Step 4: Sprawdź parser i rejestr**

Run:

```bash
node /Users/krzysztofkilian/.agents/skills/angielski-rozdzial/check-recykling.js K/01-k1-powiedz-to-raz/rozdzial.md k1 --slownik K/slownik-k.json
```

Expected: PASS; osiem wpisów INTRO; parser rozpoznaje pięć grup.

### Task 3: K2 - kintsugi i recykling K1

**Files:**
- Create: `K/02-k2-kintsugi/rozdzial.md`

**Interfaces:**
- Consumes: `K/slownik-k.json`, przesłany worksheet oraz targety K1 zaplanowane na `k2`.
- Produces: pięć grup audio-ready przygotowujących do pytań lektora.

- [ ] **Step 1: Zweryfikuj fakty źródłowe**

Sprawdź historię kintsugi i definicję wabi-sabi w wiarygodnych źródłach muzealnych/akademickich. Legendę o Ashikadze Yoshimasie przedstaw jako legendę, nie pewny fakt.

- [ ] **Step 2: Napisz grupy 1-4 PL -> EN**

Każda ma 10-14 par. Kolejność: proces naprawy, estetyka/wabi-sabi, odporność psychiczna, perfekcjonizm i konsumpcja. Każdy nowy target ma 8-12 ekspozycji w całym dziale.

- [ ] **Step 3: Wydobądź K1 w K2**

W naturalnych odpowiedziach użyj `to get my point across`, `What I mean is...`, `It's sort of like...`, `I should have mentioned...`, `I'd say...`. Nie dodawaj żadnego wyrażenia z rejestru M jako obowiązkowego powrotu.

- [ ] **Step 4: Dodaj grupę 5 jako scenkę worksheetową**

Użyj pytań o historię rzemiosła, perfekcjonizm, odporność, odpady i wartość trudnych doświadczeń. Podpowiedź PL steruje treścią, odpowiedź EN zawiera target.

- [ ] **Step 5: Dodaj słownik, wymowę i typowe błędy**

Uwzględnij wymowę `kintsugi`, `aesthetic`, `resilience`, `imperfection` oraz typowe kalki i przyimki.

- [ ] **Step 6: Sprawdź recykling**

Run:

```bash
node /Users/krzysztofkilian/.agents/skills/angielski-rozdzial/check-recykling.js K/02-k2-kintsugi/rozdzial.md k2 --slownik K/slownik-k.json
```

Expected: PASS i obecność wszystkich pięciu zaplanowanych powrotów K1.

### Task 4: Trzy niezależne recenzje językowe

**Files:**
- Modify: `K/01-k1-powiedz-to-raz/rozdzial.md`
- Modify: `K/02-k2-kintsugi/rozdzial.md`

**Interfaces:**
- Consumes: oba drafty, rejestr K, metodę C1 i transkrypcję.
- Produces: tekst bez uwag BŁĄD/ZMIEŃ, gotowy do PDF/audio.

- [ ] **Step 1: Uruchom równolegle recenzentów A/B/C**

A sprawdza poprawność, General American, wymowę i typowe błędy. B sprawdza współczesną naturalność mówioną, rejestr i poziom. C sprawdza wierność PL/EN, jakość wyzwalaczy i wszystkie powroty z `K/slownik-k.json`.

- [ ] **Step 2: Zastosuj wszystkie uwagi BŁĄD i ZMIEŃ**

Pierwszeństwo: wierność > poprawność > naturalność > preferencja. Nie dodawaj nowych targetów tylko po to, żeby urozmaicić tekst.

- [ ] **Step 3: Ponów recenzje po zmianach**

Maksymalnie trzy rundy. Zakończ, gdy wszyscy recenzenci nie zgłaszają BŁĄD/ZMIEŃ.

### Task 5: PDF i audio

**Files:**
- Create: `K/01-k1-powiedz-to-raz/rozdzial.pdf`
- Create: `K/01-k1-powiedz-to-raz/grupa-1.mp3` ... `grupa-5.mp3`
- Create: `K/02-k2-kintsugi/rozdzial.pdf`
- Create: `K/02-k2-kintsugi/grupa-1.mp3` ... `grupa-5.mp3`

**Interfaces:**
- Consumes: zatwierdzone `rozdzial.md`.
- Produces: pliki dostarczane przez witrynę K.

- [ ] **Step 1: Wygeneruj oba PDF-y skillem `make-pdf`**

Generuj do `/tmp`, skopiuj do folderu danego działu, a następnie renderuj wszystkie strony do PNG zgodnie ze skillem `pdf`.

- [ ] **Step 2: Sprawdź render PDF**

Sprawdź wizualnie każdą stronę: brak ucięć tabel, nakładania tekstu, czarnych kwadratów i osieroconych nagłówków.

- [ ] **Step 3: Wygeneruj audio**

Run:

```bash
node /Users/krzysztofkilian/.agents/skills/angielski-rozdzial/assemble-audio.js K/01-k1-powiedz-to-raz/rozdzial.md
node /Users/krzysztofkilian/.agents/skills/angielski-rozdzial/assemble-audio.js K/02-k2-kintsugi/rozdzial.md
```

Expected: pięć MP3 na dział; głosy PL=`marin`, EN=`cedar`; scenka ma kolejność pytanie EN -> podpowiedź PL -> cisza -> odpowiedź EN.

- [ ] **Step 4: Sprawdź pliki audio**

Run:

```bash
find K -type f -name 'grupa-*.mp3' -exec file {} \;
```

Expected: 10 poprawnych plików MPEG/ID3, żaden pusty.

### Task 6: Generator manifestu K - TDD

**Files:**
- Create: `tools/generate-k.test.mjs`
- Create: `tools/generate-k.js`
- Create: `k-content.json`
- Modify: `package.json`
- Modify: `render.yaml`

**Interfaces:**
- Produces: `buildKManifest(rootDir): object` i `writeKManifest(rootDir, outputPath): object`.
- Consumes: `K/slownik-k.json` oraz `K/NN-kN-*/rozdzial.md|pdf|mp3`.

- [ ] **Step 1: Napisz test generatora**

Test w `node:test` tworzy fixture w `fs.mkdtempSync(path.join(os.tmpdir(), 'kurs-k-'))`, zapisuje dwa foldery K i jeden fałszywy folder M poza K, a następnie oczekuje dwóch działów w kolejności, poprawnych tytułów, PDF i grup liczbowo 1, 2, 10.

- [ ] **Step 2: Uruchom test i zobacz oczekiwany RED**

Run: `node --test tools/generate-k.test.mjs`

Expected: FAIL, ponieważ `tools/generate-k.js` jeszcze nie istnieje.

- [ ] **Step 3: Zaimplementuj minimalny generator**

Eksportuj `buildKManifest` i `writeKManifest`; uruchom zapis tylko przy bezpośrednim wywołaniu pliku. Metadata kursu i opisy działów pochodzą z `K/slownik-k.json`; cache-busting MP3 używa `mtimeMs`.

- [ ] **Step 4: Uruchom GREEN**

Run: `node --test tools/generate-k.test.mjs`

Expected: PASS.

- [ ] **Step 5: Podłącz build**

W `package.json` ustaw `build:k` na `node tools/generate-k.js`, a `build` na sekwencję generatora M i K. W `render.yaml` użyj `npm run build` jako build command.

- [ ] **Step 6: Wygeneruj manifest produkcyjny**

Run: `npm run build`

Expected: istnieją oba `content.json` i `k-content.json`; K ma dokładnie dwa działy i 10 audio.

### Task 7: Mikrowitryna K - TDD i projekt frontendu

**Files:**
- Create: `tools/k-site.test.mjs`
- Create: `k.html`
- Create: `k-app.js`
- Create: `k-style.css`

**Interfaces:**
- Consumes: `k-content.json`.
- Produces: hash routes `#/` i `#/k/:id`, odtwarzacz i Media Session.

- [ ] **Step 1: Napisz test struktury i czystych funkcji**

Test oczekuje jednego `<audio>`, linków do `k-style.css`/`k-app.js`, braku `content.json`, prefiksu `ang.k.`, a z `k-app.js` importuje i testuje `fmt`, `cycleRepeat`, `nextIndex`, `cleanTitle`.

- [ ] **Step 2: Uruchom RED**

Run: `node --test tools/k-site.test.mjs`

Expected: FAIL, ponieważ pliki witryny nie istnieją.

- [ ] **Step 3: Zbuduj minimalny HTML i JS**

`k-app.js` eksportuje czyste funkcje i inicjalizuje DOM tylko wtedy, gdy `document` istnieje. Implementuje listę działów, widok grup, PDF, odtwarzanie, seek, pętle, restore i Media Session. Błąd fetch pokazuje przycisk `Spróbuj ponownie`.

- [ ] **Step 4: Zbuduj warstwę wizualną**

Zastosuj atramentowy granat, ciepłe powierzchnie, złoty akcent, mocną hierarchię i subtelną linię postępu. Nie kopiuj magnetofonu M. Zapewnij focus-visible, kontrast, touch targets co najmniej 44 px i `prefers-reduced-motion`.

- [ ] **Step 5: Uruchom GREEN**

Run: `node --test tools/k-site.test.mjs tools/generate-k.test.mjs`

Expected: PASS bez ostrzeżeń.

### Task 8: Integracja i weryfikacja końcowa

**Files:**
- Modify only if a failing check requires it: K files and K site files from prior tasks.

**Interfaces:**
- Consumes: pełny build.
- Produces: zweryfikowany pakiet gotowy do otwarcia i wdrożenia.

- [ ] **Step 1: Uruchom wszystkie testy i build**

Run:

```bash
node --test tools/generate-k.test.mjs tools/k-site.test.mjs tools/egzamin/metryki.test.mjs tools/egzamin/werdykt.test.mjs
npm run build
git diff --check
```

Expected: wszystkie testy PASS, build 0, brak błędów whitespace.

- [ ] **Step 2: Uruchom lokalny serwer i QA przeglądarkowe**

Otwórz `k.html` na szerokości telefonu i desktopu. Sprawdź przejścia home -> K1/K2 -> back, odtworzenie/pauzę, seek, poprzedni/następny, trzy pętle, zachowanie po refreshu oraz oba linki PDF. Konsola ma być czysta.

- [ ] **Step 3: Sprawdź izolację M**

Otwórz `index.html`, potwierdź listę dotychczasowych minikursów i odtworzenie istniejącej grupy. Porównaj `git diff` i potwierdź brak zmian w `app.js`, `style.css`, `content.json` poza spodziewanym timestampem generatora.

- [ ] **Step 4: Zatwierdź komplet**

Stage only files projektu K, plan/spec oraz niezbędne zmiany `package.json`/`render.yaml`; commit message: `feat: dodaj niezalezny kurs K z K1 i K2`.
