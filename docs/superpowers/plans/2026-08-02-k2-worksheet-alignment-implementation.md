# K2 Worksheet Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Przepisać K2 od zera tak, aby aktywnie uczyło pięciu słów wyróżnionych w worksheetcie i przygotowywało do pełnej odpowiedzi na wszystkie siedem pytań końcowych.

**Architecture:** Źródłem treści pozostaje `K/02-k2-kintsugi/rozdzial.md`, a niezależny rejestr `K/slownik-k.json` planuje wyłącznie zależności kursu K. Istniejący generator tworzy z finalnej treści manifest, lokalny podgląd, PDF i pięć ścieżek audio; interfejs K nie wymaga zmian.

**Tech Stack:** Markdown, JSON, Node.js ESM i `node:test`, checker `angielski-rozdzial`, generator PDF `make-pdf`, OpenAI TTS przez `assemble-audio.js`, istniejący statyczny frontend i Render.

## Global Constraints

- K1 pozostaje bez zmian.
- Kurs K nie importuje zależności z kursu M.
- Pięć obowiązkowych słów: `shatter`, `crude`, `aesthetic`, `transience`, `resilience`.
- Siedem pierwszych pytań grupy 5 odpowiada siedmiu pytaniom końcowym PDF-u i zachowuje ich kolejność.
- General American, naturalny język mówiony B2 → C1, bez wymuszonego slangu.
- Każda grupa ma 10–18 wierszy; grupa 5 używa trybu `scenka`.
- Historia o Ashikadze Yoshimasie jest nazywana popularną legendą.
- Audio powstaje dopiero po zamknięciu wszystkich recenzji językowych.

---

### Task 1: Test kontraktu treści K2

**Files:**
- Create: `tools/k2-content.test.mjs`

**Interfaces:**
- Consumes: `K/02-k2-kintsugi/rozdzial.md` jako tekst UTF-8.
- Produces: automatyczną blokadę regresji dla słownictwa, pytań i kontraktu grup.

- [ ] **Step 1: Napisz test pięciu słów**

Test ma oczekiwać dokładnych wyrazów `shatter`, `crude`, `aesthetic`,
`transience`, `resilience` w tabelach grup, a nie tylko w sekcji słownikowej.
Każdy z pięciu wyrazów ma pojawić się w części audio co najmniej pięć razy.

- [ ] **Step 2: Napisz test siedmiu pytań**

Test wycina `Grupa 5`, sprawdza marker `<!-- mode: scenka -->`, dziesięć wierszy
danych i siedem pytań worksheetu w dokładnej kolejności jako pierwsze siedem
wierszy.

- [ ] **Step 3: Napisz test struktury grup**

Parser testowy ma znaleźć dokładnie pięć grup, a każda z nich ma zawierać od 10
do 18 wierszy danych. Sekcja `Nowe słowa i struktury` nie jest liczona jako grupa.

- [ ] **Step 4: Uruchom RED**

Run:

```bash
node --test tools/k2-content.test.mjs
```

Expected: FAIL dla brakujących `shatter`, `crude`, `transience` i niezgodnych
pytań obecnego K2.

### Task 2: Program, rejestr i nowy rozdział K2

**Files:**
- Modify: `K/PROGRAM-K.md`
- Modify: `K/slownik-k.json`
- Modify: `K/02-k2-kintsugi/rozdzial.md`

**Interfaces:**
- Consumes: worksheet, spec projektu, targety K1 zaplanowane na `k2`.
- Produces: pięć grup audio-ready i zaktualizowane zależności kursu K.

- [ ] **Step 1: Zmień rdzeń K2 w programie i rejestrze**

Zastąp pięć starych targetów K2 wpisami `shatter-into-pieces`, `crude-repair`,
`aesthetic-value`, `transience-of-things`, `mental-resilience`. Każdy wpis ma
`intro: "k2"` i powroty wyłącznie do przyszłych `k3`, `k4` itd. Opis programu
ma wymienić wymagane słowa i siedem pytań jako kryterium gotowości.

- [ ] **Step 2: Napisz grupę 1**

Dodaj 15 przeplatanych par PL→EN. Każde wymagane słowo otrzymuje zasiew w
naturalnym kontekście: roztrzaskana ceramika, prymitywna naprawa, wartość
estetyczna, przemijanie i odporność psychiczna.

- [ ] **Step 3: Napisz grupy 2–4**

Każda grupa ma 12–15 par. Grupa 2 buduje odpowiedzi 1–2, grupa 3 odpowiedzi 3–4,
a grupa 4 odpowiedzi 5–7. Każdy blok zawiera tezę, rozwinięcie, przykład i
zastrzeżenie; naturalnie odzyskuje zaplanowane procedury K1.

- [ ] **Step 4: Napisz grupę 5**

Użyj tabeli `pytanie (EN) | podpowiedź (PL) | odpowiedź (EN)`. Pierwsze siedem
wierszy zawiera pełne pytania worksheetu w kolejności, każdy z konkretną
podpowiedzią i rozwiniętą odpowiedzią. Wiersze 8–10 to follow-upy sprawdzające
definicje i osobiste zastosowanie.

- [ ] **Step 5: Dodaj słownik i warstwę błędów**

Podaj pięć definicji zgodnych z worksheetem, transkrypcję IPA/akcent, wymowę
`kintsugi` i `wabi-sabi`, pułapkę `aesthetic` oraz korekty typowych kalek.

- [ ] **Step 6: Uruchom GREEN i checker**

Run:

```bash
node --test tools/k2-content.test.mjs
node /Users/krzysztofkilian/.agents/skills/angielski-rozdzial/check-recykling.js K/02-k2-kintsugi/rozdzial.md k2 --slownik K/slownik-k.json
```

Expected: oba polecenia kończą się kodem 0; pięć nowych wpisów to `INTRO`, a
wszystkie wymagane powroty K1 są obecne.

### Task 3: Trzy niezależne recenzje językowe

**Files:**
- Modify: `K/02-k2-kintsugi/rozdzial.md`
- Modify only if a registry mismatch is found: `K/slownik-k.json`

**Interfaces:**
- Consumes: nowy draft, worksheet, `METODA-C1.md` i rejestr K.
- Produces: tekst bez uwag `BŁĄD` i `ZMIEŃ`, gotowy do syntezy audio.

- [ ] **Step 1: Uruchom równolegle recenzentów A/B/C**

A sprawdza poprawność, General American, wymowę i typowe błędy. B sprawdza
naturalność mówioną, rejestr i poziom B2 → C1. C porównuje każdą parę PL↔EN,
pięć definicji, siedem pytań i zaplanowany recykling z PDF-em i rejestrem.

- [ ] **Step 2: Zastosuj wszystkie uwagi obowiązkowe**

Popraw każdą uwagę `BŁĄD` i `ZMIEŃ`, zachowując kolejność pierwszych siedmiu
pytań. Pierwszeństwo konfliktów: wierność > poprawność > naturalność > preferencja.

- [ ] **Step 3: Ponów recenzje i testy**

Maksymalnie trzy rundy. Zakończ dopiero, gdy nie pozostają uwagi obowiązkowe, a
test treści i checker nadal przechodzą.

### Task 4: Regeneracja PDF i audio

**Files:**
- Modify: `K/02-k2-kintsugi/rozdzial.pdf`
- Modify: `K/02-k2-kintsugi/grupa-1.mp3`
- Modify: `K/02-k2-kintsugi/grupa-2.mp3`
- Modify: `K/02-k2-kintsugi/grupa-3.mp3`
- Modify: `K/02-k2-kintsugi/grupa-4.mp3`
- Modify: `K/02-k2-kintsugi/grupa-5.mp3`

**Interfaces:**
- Consumes: zamknięty recenzjami `rozdzial.md`.
- Produces: finalny PDF oraz pięć finalnych plików audio.

- [ ] **Step 1: Wygeneruj PDF skillem `make-pdf`**

Użyj finalnego Markdownu i zapisz wynik jako
`K/02-k2-kintsugi/rozdzial.pdf`.

- [ ] **Step 2: Wyrenderuj i obejrzyj wszystkie strony**

Sprawdź brak uciętych wierszy, nakładania tekstu, czarnych znaków, osieroconych
nagłówków i zbyt małej czcionki. W razie błędu popraw źródło lub parametry i
powtórz generację.

- [ ] **Step 3: Wygeneruj audio**

Run:

```bash
node /Users/krzysztofkilian/.agents/skills/angielski-rozdzial/assemble-audio.js K/02-k2-kintsugi/rozdzial.md
```

Expected: pięć nowych MP3; grupa 5 ma kolejność pytanie EN → podpowiedź PL →
cisza → odpowiedź EN.

- [ ] **Step 4: Zweryfikuj audio technicznie**

Run:

```bash
find K/02-k2-kintsugi -maxdepth 1 -name 'grupa-*.mp3' -type f -exec file {} \;
```

Expected: dokładnie pięć niepustych plików MPEG/ID3.

### Task 5: Integracja, podgląd i wdrożenie

**Files:**
- Modify: `k-content.json`
- Regenerate ignored local artifact: `podglad.html`
- Modify only if failing checks require it: files explicitly listed above

**Interfaces:**
- Consumes: finalny PDF, MP3 i treść K2.
- Produces: działające lokalne i publiczne K2.

- [ ] **Step 1: Przebuduj manifest i podgląd**

Run:

```bash
npm run build
node tools/build-podglad.js
```

Expected: K2 ma pięć grup audio i link do nowego PDF-u; podgląd wskazuje nową
treść oraz nowe wersje MP3.

- [ ] **Step 2: Uruchom pełną weryfikację**

Run:

```bash
node --test tools/*.test.mjs tools/egzamin/*.test.mjs
git diff --check
```

Expected: wszystkie testy PASS i brak błędów whitespace.

- [ ] **Step 3: Sprawdź działanie strony**

Otwórz `k.html` lokalnie, przejdź do K2, sprawdź pięć grup, PDF, play/pause,
seek, poprzednią/następną grupę i konsolę. Następnie odśwież
`file:///Users/krzysztofkilian/angielski/podglad.html#k2` w Safari.

- [ ] **Step 4: Zatwierdź i wdróż**

Stage wyłącznie pliki K2, rejestr/program, test, plan/spec i artefakty builda.
Commit message: `feat: przebuduj K2 pod worksheet kintsugi`. Push `main`, a potem
sprawdź publiczny adres `https://angielski-audio.onrender.com/k.html` aż nowy
manifest i PDF będą dostępne.
