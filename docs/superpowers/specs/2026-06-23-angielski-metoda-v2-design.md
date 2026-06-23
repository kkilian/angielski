# Projekt: metoda v2 — kurs angielskiego B2→C1 (4− → 4+/5)

- **Data:** 2026-06-23
- **Status:** zaakceptowany do planu implementacji
- **Autor:** Krzysiek + Claude (brainstorming)
- **Dotyczy:** repo `~/angielski` (kurs) + skill `~/.claude/skills/angielski-rozdzial`

---

## 1. Kontekst i problem

Po kilku lekcjach wygenerowanego Minikursu 1 (działy 01–06) ocena: **4− w skali 1–6**
(4 = użyteczne z błędami; cel: 4+ → docelowo 5). Feedback Krzyśka:

1. **Tłumaczenia czasem nieprecyzyjne** — przykład pamiętany: „wprowadzić się
   z powrotem do rodziców" jako *move back in with someone* zamiast *…with your parents*.
2. **Za mało powtórzeń jednego wyrażenia** — klocek pojawia się zbyt rzadko, żeby
   wbić się w różnych kontekstach i połączeniach. „Trzeba bardziej wałkować."
3. **Brak powrotów między działami** — to, co było w dziale poprzednim, ma wracać
   w następnych, żeby się utrwalało.
4. **Za krótkie jednostki** — generować większe, dobrze zaplanowane całości.
5. **Generować z góry cały minikurs** (a docelowo cały program), żeby widzieć
   progresję, przeplatanie i metodę — „porządnie, nie strzelać dział po dziale".
6. **Zbadać metodę Pawlikowskiej jeszcze raz** i osadzić w niej łuk kursu.

### Ustalenia ze stanu faktycznego (przed projektem)
- Błąd „someone vs parents" jest **już naprawiony** w aktualnym dziale 02
  (*move back in with my parents / your parents / my folks*). Pochodził ze
  **starego** kursu (rozdz. 07), skasowanego. Feedback częściowo dotyczył starego materiału.
- `METODA-C1.md` została rano 2026-06-22 podbita (głębszy dryl, rejestr-sufit,
  wierność PL↔EN, szkic przeplatania). Część postulatów jest już w regułach.
- **Co realnie cienkie** (źródło 4−): (a) spirala między działami LEKKA — wyrażenie
  z d1 wraca w d2 raptem 1–2×; (b) druga połowa minikursu chuda — działy 05/06
  (słuchanka/egzamin) mają po 1 grupie/mp3 vs 4–5 w 01–04; (c) brak automatycznej
  kontroli wierności tłumaczeń.

**Wniosek:** to nie przebudowa, lecz **podkręcenie pokręteł + warstwa QA +
holistyczny plan generacji**. Wybrane podejście: **B (ewolucyjne „metoda v2")**.

---

## 2. Cele i kryteria sukcesu

- Ocena ≥ **4+** na próbce (checkpoint po 3 działach M1), docelowo **5**.
- Każde kluczowe wyrażenie spotykane **~10–14×** w całym programie, zawsze w nowym
  kontekście (nie dosłowne kopie).
- Druga połowa minikursu (Etap IV/V) pełnoprawna, nie „urwana".
- Zero usterek wierności PL↔EN typu „someone vs parents" (egzekwowane maszynowo).
- Cały program (~55 działów) **zaplanowany z góry**; generacja falami z checkpointem.

### Non-goals (YAGNI)
- Nie zmieniamy łuku 5 etapów (research potwierdził, że jest wierny Pawlikowskiej).
- Nie przechodzimy na „globalne przebiegi" Pawlikowskiej (wariant C) — zostaje
  per-temat (pełna obróbka tematu naraz, domknięcie + egzamin blisko).
- Nie budujemy nowej apki/odtwarzacza — istniejący czyta `content.json`.
- Nie generujemy wszystkich 55 działów w jednym ciągu (wariant odrzucony jako ryzyko).

---

## 3. Research metody Pawlikowskiej (osadzenie łuku)

Źródło: analiza „Blondynki na językach" (`~/.claude/skills/wloski-rozdzial/METODA-PAWLIKOWSKIEJ.md`).

1. **Łuk 5 etapów odwzorowuje jej 5 poziomów 1:1** i pokrywa się z pamięcią Krzyśka:
   - Etap I (PL→EN, fundament) = Poziom I
   - Etap II (EN→PL, powtórka potocznie) = Poziom II
   - Etap III (PL→EN, składanie klocków + gramatyka C1) = Poziom III
   - Etap IV (dłuższe opowiastki/słuchanka) = Poziom IV
   - Etap V (egzamin bez tłumaczenia) = Poziom V
   → **łuku nie ruszamy.**
2. **Jej silnik powtarzalności to RECYKLING, nie długość drylu.** Jej dryl ma 3–5
   wierszy (my mamy 6–12, więcej). Powtórzenia biorą się z tego, że **to samo słowo
   wraca przez wiele lekcji** w nowych konstrukcjach (np. *albergo* przez present →
   past → future). → **główna dźwignia do 4+/5 = mocno podkręcony recykling.**
3. **Różnica strukturalna (świadoma):** u niej 5 poziomów to globalne przebiegi przez
   cały materiał; u nas 5 etapów **per temat**. Zgodne z „na jeden temat generować
   od razu wszystko".

---

## 4. Sekcja 1 — Struktura minikursu (finer działy)

Minikurs = **11 krótszych działów** (dziś 6). Jedna „codzienna porcja" ≈ 1 dział;
minikurs ≈ 2 tygodnie nauki. Łuk 5 etapów zostaje; fundament rozłożony na więcej dni,
druga połowa pogrubiona.

| Dział | Etap | Co robi | Kierunek | Nowe wyrażenia | Grupy (mp3) |
|---|---|---|---|---|---|
| 1 | I | Fundament: 2 nowe klocki, dryl 8–12 zdań każdy | PL→EN | 2 | ~4 |
| 2 | I | j.w. + recykling d1 | PL→EN | 2 | ~4 |
| 3 | I | j.w. + recykling d1–2 | PL→EN | 2 | ~4 |
| 4 | I | j.w. + recykling d1–3 | PL→EN | 2 | ~4 |
| 5 | I | j.w. + recykling d1–4 | PL→EN | 2 | ~4 |
| 6 | II | Powtórka konwersacyjna + rozpoznawanie ze słuchu | EN→PL | 0–1 | ~4 |
| 7 | II | j.w., druga porcja (swobodne wymiany) | EN→PL | 0–1 | ~4 |
| 8 | III | Składanie 2–3 klocków + gramatyka C1 (inwersje, cleft) | PL→EN | struktury | ~4 |
| 9 | III | j.w., trudniejsze sploty | PL→EN | struktury | ~4 |
| 10 | IV | Słuchanka — spójna historia z Jakiem, pocięta na sceny | EN (+PL w PDF) | — | ~4 |
| 11 | V | Egzamin EN-only — pytania → wzorcowe odpowiedzi | EN-only | — | ~3 |

**Decyzje:**
- **2 nowe wyrażenia/dział** w Etapie I → **~10 klocków rdzeniowych/minikurs**, każdy
  głębiej wałkowany i **wracający w każdym kolejnym dziale**.
- Gramatyka C1 skoncentrowana w Etapie III (działy 8–9).
- M1 zachowuje treść (Jake, powrót z Norwegii, te same wyrażenia) — przesypana na 11
  działów z mocnym recyklingiem.
- Skala: ~44 grupy/mp3 na minikurs (dziś ~20); ~55 działów w całym programie.

Szkielet 11-działowy jest **wzorcem dla wszystkich 5 minikursów** (M1–M5).

---

## 5. Sekcja 2 — Silnik recyklingu (rdzeń naprawy)

**Cel:** każde kluczowe wyrażenie spotykane **~10–14×** w programie, nigdy jako
dosłowne powtórzenie — każdy powrót dokłada **jedną nową rzecz** (nowy partner
kolokacyjny / nowa struktura / nowy temat). Wałkujemy *wyrażenie*, nie *zdanie*.

### Przykład cyklu życia: `to be on the fence` (wchodzi M1 d3)
| Gdzie | Co nowego |
|---|---|
| M1 d3 (intro) | dryl 8–12 zdań: *on the fence about X · sit on the fence · come off the fence* |
| M1 d4 | spleciony z `figure out` |
| M1 d5 | spleciony z `go out on my own` |
| M1 d6–7 (II) | rozpoznawanie EN→PL |
| M1 d8 (III) | inwersja C1: *Had they offered more, I wouldn't be on the fence* |
| M1 d10 | w narracji (słuchanka) |
| M1 d11 | w odpowiedzi EN-only (egzamin) |
| M2 | *on the fence about the offer* (temat: praca) |
| M5 | *on the fence about going all in* (capstone) |
→ ~10–12 spotkań zamiast 2.

### Zmiany w `slownik.json` (rejestr przeplatania)
Do każdego wpisu dochodzą 2 pola:
- `budzet_powrotow` — liczba docelowa wystąpień (np. 12 dla rdzeniowych, mniej dla gramatyki).
- `partnerzy` — lista kolokacji do rotacji, żeby powroty się różniły.
- `review[]` — bez zmian (lista działów, w których wyrażenie MA wrócić); rozpisana
  tak, by sumarycznie trafić w `budzet_powrotow`. Numeracja `m<k>-d<n>` do d11.
- (opcjonalnie) `policzono` — liczność per dział, uzupełniana przez recenzenta — audyt QA.

### Dwa kanały recyklingu w każdym dziale
1. **Wpleciony** — stare wyrażenia mieszają się z nowymi w zwykłych grupach (kontekstowo).
2. **Grupa-splot** — ostatnia grupa działu zawsze braiduje nowe + stare (skoncentrowana
   powtórka). M1 już to robi jako „Grupa 5".

### Egzekwowanie
Recenzent-recyklingu (Sekcja 7) po wygenerowaniu działu czyta `slownik.json`, zbiera
wyrażenia z `review[]` na ten dział i **liczy**, czy faktycznie są i czy nie są
dosłowną kopią. Brak → dział do poprawki. Zamienia „obietnicę w słowniku" w twardy warunek.

---

## 6. Sekcja 3 — Słuchanka + egzamin (pełna druga połowa)

### Etap IV — Słuchanka (dział 10), ~4 grupy zamiast 1
Spójna historia z Jakiem pocięta na sceny (scena = 1 mp3), ~500–700 słów angielskiego,
używająca **wszystkich** wałkowanych wyrażeń minikursu:

| Grupa | Scena | Recykling |
|---|---|---|
| 1 | Jake łapie Cię na ostatnie tygodnie — *wrapping up, heading back* | d1–2 |
| 2 | Dylemat mieszkaniowy — *on the fence, move back in with my parents* | d3 |
| 3 | Rozkmina zawodowa — *figure out, go out on my own, play it safe* | d4–5 |
| 4 | „Prześpij się z tym" — *talk it over, sleep on it, mixed feelings* | całość |

- Audio: **EN ciągłe**, zdanie po zdaniu z krótką pauzą, bez wyzwalacza PL. PDF: EN + PL.

### Etap V — Egzamin EN-only (dział 11), ~3 grupy
Jake pyta po angielsku → cisza (odpowiadasz na głos) → wzorcowa odpowiedź EN
(też recyklinguje wyrażenia):

| Grupa | Typ | Przykład |
|---|---|---|
| 1 | Rozgrzewka (krótkie) | *So when do you wrap up over there?* |
| 2 | Pogłębione (wymuszają klocki) | *Are you on the fence about where to live once you're back?* |
| 3 | Scenariusz (dłuższa wypowiedź) | *Walk me through it — what's the first move, and why?* |

- Audio: **pytanie EN → dłuższa cisza → wzorcowa odpowiedź EN.**

### Tryby audio do zbudowania w `assemble-audio.js`
Dziś skrypt umie tylko `PL→cisza→EN`. Do dodania **3 tryby** (+ testy):
- `EN→PL` (Etap II): EN → cisza → PL potwierdza.
- `słuchanka` (Etap IV): EN ciągłe, zdanie po zdaniu z krótką pauzą, bez PL.
- `EN-only` (Etap V): pytanie EN → dłuższa cisza → wzorcowa odpowiedź EN.
Markery etapu w `.md` (`<!-- mode: ... -->`) sterują trybem. **Głosy: wyłącznie
OpenAI (PL = nova, EN = alloy)** — patrz Sekcja 9.

---

## 7. Sekcja 4 — QA tłumaczeń (3 adversarialni recenzenci)

Istniejący „3 recenzentów" przedefiniowani na **3 wyspecjalizowanych, adversarialnych**
agentów (mają *szukać* błędów, nie przyklepywać). Lecą **równolegle** po wygenerowaniu
md, **przed** PDF/audio. Dział nie przechodzi, dopóki wszyscy trzej nie przejdą.

1. **Recenzent WIERNOŚCI PL↔EN:**
   - zgodność ogólność↔konkretność (referent po PL → referent po EN; reguła „someone vs parents");
   - **back-translation** EN→PL i kontrola, czy znaczenie się nie rozjechało;
   - PL jako naturalny *wyzwalacz produkcji*, nie kalka.
2. **Recenzent NATURALNOŚCI + sufit rejestru:**
   - test „czy 30-letni Amerykanin powie to na głos w 2026?";
   - sufit rejestru: zero slangu na siłę, ≤1–2 „(luźno)"/grupa;
   - US (apartment, vacation), skróty naturalne, struktury C1 w wariancie mówionym.
3. **Recenzent RECYKLINGU + metody:**
   - **liczy** wyrażenia z `review[]` na ten dział (egzekwuje Sekcję 5), wyłapuje dosłowne kopie;
   - 2 nowe wyrażenia/dział × 8–12 zdań, drabinka rośnie, jest partner kolokacyjny, markery etapu OK.

**Pętla:** problem → automatyczna poprawka → ponowna recenzja → PDF + audio.

**Dwie bramki:** automatyczna (recenzenci, każdy dział) + ludzka (checkpoint po 3
działach M1). Maszyna łapie wierność i metodę; Krzysiek ocenia „czy to brzmi jak 4+".

---

## 8. Sekcja 5 — Plan generacji

**Cały plan na papierze powstaje z góry; kosztowna generacja idzie falami z checkpointem.**

### Faza 0 — Metoda i mapa (papier + kod, zero audio)
1. `METODA-C1.md` → reguły v2 (finer działy, budżet recyklingu, gruba druga połowa,
   3 adversarialni recenzenci, tryby audio, twarda zasada OpenAI/no-ElevenLabs).
2. `slownik.json` → pola `budzet_powrotow` + `partnerzy`; `review[]` pod budżet ~10–14;
   **harmonogram wszystkich ~55 działów** (M1–M5).
3. `PROGRAM.md` → pełna mapa ~55 działów wg szkieletu 11-działowego.
4. `assemble-audio.js` → 3 nowe tryby audio (EN→PL, słuchanka, EN-only) + testy.

### Faza 1 — M1 od nowa, z checkpointem
5. Generuj M1 działy **1–3** (fundament; widać dryl + start recyklingu) → 3 recenzentów → PDF + audio.
6. **CHECKPOINT (Krzysiek):** czy 4+? Tak → dalej. Nie → korekta metody, regeneracja.
   *(Na życzenie próbka słuchanki/egzaminu, żeby ocenić też drugą połowę.)*
7. Generuj M1 działy **4–11** → recenzenci → PDF + audio.
8. **Dopiero gdy cały nowy M1 (01–11) gotowy i zwalidowany** — podmień stary M1
   (01–06) na nowy; zaktualizuj `content.json`/apkę. Stary M1 zostaje live przez
   całą regenerację, żeby Krzysiek nie został bez materiału do nauki.

### Faza 2 — M2–M5 hurtem
9. Finalizuj listy wyrażeń M2–M5 (dziś szkice w `slownik.json`).
10. Generuj minikurs po minikursie (po 11 działów) przez ten sam pipeline.
11. Aktualizuj apkę.

### Odporność i ryzyka
- Każdy dział = osobny folder → generacja wznawialna (padnie jeden, reszta zostaje).
- Recenzenci pilnują jakości per dział; checkpoint pilnuje metody przed skalą.
- **Skala (szczerze):** ~55 działów × (md + 3 recenzentów + PDF + audio) = dużo czasu
  i tokenów. Checkpoint po 3 działach = wyłącznik awaryjny, zanim się rozkręci.

---

## 9. Reguły globalne (twarde, niezmienne)

- **Wariant:** General American (słownictwo, pisownia, idiomy współczesne).
- **Sufit rejestru:** naturalna, neutralna amerykańszczyzna mówiona; bez ultra-slangu;
  ≤1–2 „(luźno)" na grupę.
- **Wierność PL↔EN:** ogólność↔konkretność musi się zgadzać (Sekcja 7, recenzent 1).
- **Audio = wyłącznie OpenAI TTS.** Głosy: **PL = nova, EN = alloy** (instrukcja:
  natural General American). Dotyczy też 3 nowych trybów. **ElevenLabs ZAKAZANY**,
  chyba że Krzysiek wprost o niego poprosi (opt-in). (Trwała preferencja — patrz
  pamięć `no-elevenlabs-english-audio`; commit 381232b „bez ElevenLabs".)
- **Kontrakt parsera audio:** tabele zawsze `| polski | angielski |`, nagłówki zawsze
  `## Grupa N`, jedna grupa = jeden `grupa-N.mp3`, sekcja `## Nowe słowa i struktury`
  poza audio.

---

## 10. Artefakty do zmiany / utworzenia

| Plik | Zmiana |
|---|---|
| `~/.claude/skills/angielski-rozdzial/METODA-C1.md` | reguły v2 (sekcje 4–9 tego specu) |
| `~/.claude/skills/angielski-rozdzial/SKILL.md` | workflow: 11 działów, 3 recenzenci, tryby audio |
| `~/.claude/skills/angielski-rozdzial/assemble-audio.js` | 3 nowe tryby audio + testy |
| `~/angielski/slownik.json` | pola `budzet_powrotow`/`partnerzy`; harmonogram ~55 działów |
| `~/angielski/PROGRAM.md` | mapa ~55 działów (szkielet 11-działowy) |
| `~/angielski/01..11-*` (M1) | regeneracja M1 od nowa (po checkpoincie) |
| `~/angielski/content.json` | nowe działy M1 (potem M2–M5) |

---

## 11. Otwarte pytania (do planu implementacji)
- Dokładne listy 2-wyrażeń-na-dział dla M1 (z obecnych ~14 klocków → ~10 rdzeniowych
  rozłożonych na działy 1–5; reszta jako partnerzy kolokacyjni).
- Czy checkpoint ma objąć też próbkę słuchanki/egzaminu (decyzja Krzyśka w Fazie 1).
- Finalizacja list wyrażeń M2–M5 — po walidacji M1.
