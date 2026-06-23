# Projekt: metoda v2 — kurs angielskiego B2→C1 (4− → 4+/5)

- **Data:** 2026-06-23 (rewizja po adversarialnej recenzji 4 agentów)
- **Status:** zaakceptowany do planu implementacji
- **Autor:** Krzysiek + Claude (brainstorming + 4 recenzentów Opus)
- **Dotyczy:** repo `~/angielski` (kurs) + skill `~/.claude/skills/angielski-rozdzial`

---

## 0. Rewizja po recenzji (co się zmieniło względem 1. wersji specu)

Cztery adversarialne recenzje (dydaktyka, wierność, wykonalność, YAGNI) wykryły, że
1. wersja specu **przeszacowała zakres pracy** i miała sprzeczności numeracji.
Korekty (źródło findingu w nawiasie):

**Sprostowania faktów (mniej do zrobienia, niż sądziłem):**
- **3 „nowe" tryby audio JUŻ ISTNIEJĄ** w `assemble-audio.js` (`normalizeMode` + gałęzie
  `sluchanka`/`en-only`/`en2pl`/`pl2en`, linie 48–185), są przetestowane i live (działy
  03/05/06 ich używają). → Faza 0 = **zweryfikuj/dostrój**, nie „zbuduj". `SKILL.md`
  (linie 159–161) ma NIEAKTUALNY tekst „trybów nie ma" — do poprawy. (red-team)
- **3 recenzenci A/B/C już są** w `SKILL.md` (Krok 1). Spec ich nie tworzy — wzmacnia. (wierność)
- **METODA-C1.md (2026-06-22) to de facto „v1.5"** — ma już rejestr `review[]`, harmonogram,
  dryl „mało wyrażeń/dużo zdań", kontrast B2→C1, wierność PL↔EN, łuk 5 etapów, specyfikacje
  trybów audio. Realny **delta v2 jest cieńszy**. (YAGNI)
- **Głosy potwierdzone:** EN=alloy, PL=nova; ElevenLabs opt-in, domyślnie WYŁĄCZONY (zgodne). (red-team)

**Naprawione sprzeczności:**
- „`review[]` bez zmian" vs „pod budżet" → `review[]` trzeba **PRZELICZYĆ** ze starej siatki
  6-działowej na 11-działową i **rozszerzyć**; długość `review[]` JEST budżetem. (wierność, YAGNI)
- Numery w przykładach (np. „on the fence = d3") to **ilustracja docelowej siatki**, nie
  obecne `intro` (faktycznie d2). Mapowanie stare→nowe powstaje w Fazie 0. (wierność)
- `PROGRAM.md`/`METODA-C1.md` mają zaszyte „6 działów / 30 / 3–4 wyrażenia" — trzeba je
  **jawnie przepisać** na 11/55/2, inaczej zostanie sprzeczny martwy tekst. (wierność)

**Cięcia (YAGNI):** usuwam pola `policzono`, `partnerzy`, `budzet_powrotow` ze słownika —
`review[]` (lista działów) wystarcza jako budżet; partnerzy kolokacyjni żyją w regule
METODA-C1 §2 i w haśle `en`, nie jako drugie źródło prawdy.

**Dodatki dydaktyczne (dźwignia 4+→5):** aktywne wydobycie zamiast samej ekspozycji,
rozproszone quick-checki, rozszerzające interwały, lekka warstwa wymowy/błędów,
produkcja swobodna wcześniej. (dydaktyka)

---

## 1. Kontekst i problem

Po kilku lekcjach M1 (działy 01–06) ocena **4−/6** (cel ≥4+, docelowo 5). Feedback:
1. Tłumaczenia czasem nieprecyzyjne (pamiętany „move back in with someone" — w istocie
   błąd **starego** kursu, już naprawiony w obecnym dziale 02).
2. Jedno wyrażenie użyte **za rzadko**, w za małej liczbie kontekstów/kolokacji.
3. Brak **powrotów między działami**.
4. Dłuższe, dobrze zaplanowane całości; **cały minikurs/program z góry**, nie „strzelanie".
5. **Zbadać metodę Pawlikowskiej** i osadzić w niej łuk.

**Realne źródło 4−** (po audycie): spirala LEKKA (wyrażenie wraca 1–2×), druga połowa
chuda (działy 05/06 = 1 grupa), brak twardej egzekucji recyklingu i aktywnego wydobycia.
**Wybrane podejście: B (ewolucyjne) — podkręcenie istniejącego, nie przebudowa.**

---

## 2. Cele i kryteria sukcesu

- Ocena ≥ **4+** na checkpoincie (po działach 1–3 **+ próbka drugiej połowy**), docelowo 5.
- Każdy rdzeniowy klocek: **≥10 powrotów** (długość `review[]`) w programie, w tym
  **≥5 aktywnych wydobyć** (wiersze PL→EN, gdzie klocek jest CELEM produkcji), nie samej ekspozycji.
- Druga połowa minikursu pełnoprawna; **testowanie rozproszone**, nie tylko egzamin na końcu.
- Zero usterek wierności PL↔EN (egzekwowane: skrypt + recenzent).
- Cały program zaplanowany z góry; generacja falami z checkpointem.

### Non-goals (YAGNI)
- Nie zmieniamy łuku 5 etapów (research potwierdził wierność Pawlikowskiej).
- Nie budujemy trybów audio od zera (już istnieją) ani nowej apki.
- Nie zamrażamy „11 działów" dla M2–M5 przed walidacją M1 (finalizacja po checkpoincie).
- Nie dodajemy pól JSON, których uczeń nie odczuje (`policzono`/`partnerzy`/`budzet_powrotow`).
- Pełny „shadowing" wymowy i adaptacja trudności per-klocek — **odłożone** (po walidacji M1).

---

## 3. Research metody Pawlikowskiej (osadzenie łuku)

Źródło: `~/.claude/skills/wloski-rozdzial/METODA-PAWLIKOWSKIEJ.md`.
1. **Łuk 5 etapów odwzorowuje jej 5 poziomów co do kierunku i funkcji** (PL→EN fundament →
   EN→PL powtórka → składanie → opowiastki → egzamin bez tłumaczenia). *Uwaga: rozpoznawanie
   ze słuchu w Etapie II to nasze świadome rozszerzenie — u niej Poziom II nie wydziela słuchu.*
2. **Jej silnik powtarzalności to RECYKLING, nie długość drylu** (jej dryl 3–5 wierszy; my
   6–12). To samo słowo wraca przez wiele lekcji w nowych konstrukcjach. → **główna dźwignia**.
3. **Różnica świadoma:** u niej 5 poziomów = globalne przebiegi przez cały materiał; u nas
   5 etapów **per temat** (zgodne z „na jeden temat generować od razu wszystko").

---

## 4. Struktura minikursu (finer działy — produkcja wcześniej)

Minikurs = **~11 krótszych działów** (dziś 6). „~11" to **wynik M1 do walidacji**, nie
zamrożony wzorzec dla M2–M5. Rozkład etapów na działy (stary→nowy): I: 2→**4**, II: 1→**2**,
III: 1→**3**, IV: 1→**1**, V: 1→**1**. Fundament skrócony (z 5 do 4), składanie wydłużone
(produkcja swobodna wcześniej i dłużej).

| Dział | Etap | Co robi | Kier. | Nowe | Grupy |
|---|---|---|---|---|---|
| 1 | I | Fundament: 2–3 nowe klocki, dryl 8–12 zdań; **kończy otwartą produkcją** | PL→EN | 2–3 | ~4 |
| 2 | I | j.w. + recykling d1; **otwarte wiersze** (uczeń sam buduje, EN dopiero w audio) | PL→EN | 2–3 | ~4 |
| 3 | I | j.w. + recykling d1–2; **+ quick-check (2–3 EN-only) na końcu** | PL→EN | 2 | ~4 |
| 4 | I | j.w. + recykling d1–3 + quick-check | PL→EN | 2 | ~4 |
| 5 | II | Powtórka konwersacyjna + rozpoznawanie | EN→PL | 0–1 | ~4 |
| 6 | II | j.w., swobodne wymiany + mini-narracja (rozgrzewka słuchanki) | EN→PL | 0–1 | ~4 |
| 7 | III | Składanie 2–3 klocków + gramatyka C1; **przeplatanie typów** (phrasal/idiom/struktura) | PL→EN | struktury | ~4 |
| 8 | III | j.w., trudniejsze sploty + quick-check | PL→EN | struktury | ~4 |
| 9 | III | j.w., pełne splatanie całego minikursu | PL→EN | struktury | ~4 |
| 10 | IV | **Słuchanka** — spójna historia z Jakiem, **2–3 sceny** | EN (+PL w PDF) | — | 2–3 |
| 11 | V | **Egzamin** EN-only — pytania → wzorcowe odpowiedzi | EN-only | — | ~3 |

**Decyzje:**
- **2–3 nowe klocki/dział** w Etapie I → **~10 rdzeniowych/minikurs**, każdy głębiej wałkowany
  i wracający; B2 udźwignie 3 w d1–d2.
- **Produkcja swobodna od d2** (otwarte wiersze: polski wyzwalacz, uczeń buduje sam, wzorzec
  dopiero w audio/po odsłonięciu) — nie czekamy z produkcją do Etapu III.
- **Quick-check** (2–3 pytania EN-only na końcu działu, od d3) recyklinguje wcześniejsze klocki
  = **testowanie rozproszone**, nie jeden egzamin na finiszu.
- Skala: ~40 grup/mp3 na minikurs; ~55 działów w programie (do potwierdzenia po M1).

---

## 5. Silnik recyklingu (rdzeń naprawy 4−)

**Cel:** każdy rdzeniowy klocek ma `review[]` o długości **≥10** (gramatyka ≥6), rozłożone
przez program; każdy powrót dokłada **jedną nową rzecz** (nowy partner kolokacyjny / struktura /
temat). **Długość `review[]` JEST budżetem** — bez osobnego pola liczbowego.

**Ekspozycja ≠ wydobycie (kluczowa poprawka dydaktyczna).** Większość powrotów musi być
**aktywnym wydobyciem**: wiersz PL→EN, w którym **stary klocek jest CELEM produkcji** (polski
wyzwalacz wymusza dokładnie ten klocek jako jedyną trudną rzecz), a nie tłem w zdaniu obok
nowego materiału. Twardy próg: **≥5 aktywnych wydobyć** na rdzeniowy klocek w programie.

**Definicja liczenia (obiektywna):** „1 powrót" = klocek pojawia się ≥1× w danym dziale z
`review[]`. Skrypt liczy obecność per dział (nie wewnątrz-działowe powtórki). Anty-klastrowanie:
max ~2 wystąpienia tego samego klocka w jednej grupie.

**Harmonogram — interwały rozszerzające** (nie sztywne +1/+3/+6): pierwszy powrót **+2** działy
(po przespanej nocy), potem rosnąco (+2, +4, +8…). Klocki wprowadzone późno (d3–d4) fizycznie
mieszczą mniej powrotów w M1 — **dobijają budżet w następnym minikursie** (`review[]` celuje
w m2/m3), więc budżet realnie zależy od działu wprowadzenia (wczesne ~12–14, późne ~8–10 w M1).

**Dwa kanały w każdym dziale:** (1) *wpleciony* — stare klocki mieszają się z nowymi; (2)
*grupa-splot* — ostatnia grupa braiduje nowe + stare. Co najmniej połowa powrotów używa
**innego partnera kolokacyjnego** niż intro (rotacja partnerów — z reguły METODA-C1 §2, nie z pola JSON).

**Egzekwowanie (hybryda — obiektywne + jakościowe):**
- **Skrypt-checker** (deterministyczny): czyta `slownik.json`, dla każdego wpisu z `review[]`
  na ten dział grepuje `rozdzial.md` i raportuje brak/obecność + liczbę wystąpień (anty-klaster).
  To zdejmuje subiektywność z najważniejszego warunku.
- **Recenzent C (LLM)** ocenia, czy powroty to **wydobycie czy ekspozycja** i czy partner rotuje.

### Zmiany w `slownik.json`
- **Bez nowych pded** — schemat zostaje `{id, pl, en, typ, intro, review[]}`.
- `review[]` każdego wpisu: **przeliczyć na siatkę 11-działową** (m1-d1…m1-d11, m2-…) i
  **rozszerzyć do ≥10** (rdzeniowe) / ≥6 (gramatyka). Stary harmonogram (pod 6 działów) nadpisany.
- Reguły dydaktyczne (partnerzy, budżet, rotacja) żyją w **METODA-C1.md**; `slownik.json`
  trzyma tylko dane per-wyrażenie. (Jedno źródło prawdy.)

---

## 6. Słuchanka + egzamin + warstwa wymowy/błędów

### Etap IV — Słuchanka (dział 10), **2–3 sceny** (zamiast 1 grupy)
Spójna historia z Jakiem, ~400–600 słów EN, używa wszystkich klocków minikursu. Scena = 1 mp3.
- Audio: tryb `słuchanka` (już w kodzie) — EN ciągłe, zdanie po zdaniu, pauza, bez PL. PDF: EN+PL.
- Zastępuje dawne „150–250 słów" z METODA-C1/PROGRAM (do aktualizacji w Fazie 0).

### Etap V — Egzamin EN-only (dział 11), ~3 grupy
Pytanie EN → cisza (odpowiadasz) → wzorcowa odpowiedź EN (recyklinguje klocki).
- Grupy: rozgrzewka (krótkie) / pogłębione (wymuszają klocki) / scenariusz (dłuższa wypowiedź).
- Audio: tryb `en-only` (już w kodzie).

### Warstwa wymowy/błędów (NOWE, lekkie — adresuje „brzmieć jak native")
W sekcji `## Nowe słowa i struktury` (poza audio), per dział:
- **Akcent wyrazowy + 1–2 pułapki wymowy** dla trudnych słów (np. `figure ['fɪɡjər]`, „th").
- **1–2 typowe błędy Polaka** przy tych klockach (np. brak „the", kalka „make a decision"
  vs „zrobić decyzję"). Tanio, a zdejmuje fosylizację. (Pełny shadowing — odłożony.)

### Kontrakt kolumn per-tryb (żeby recenzent wierności nie zgłaszał fałszywych alarmów)
- `pl2en`/`en2pl`/`słuchanka`: kolumna 1 = PL (w słuchance PL idzie tylko do PDF).
- `en-only` (egzamin): **kolumna 1 = pytanie po ANGIELSKU** — recenzent wierności PL↔EN
  **pomija ten dział** (dostaje inną instrukcję: ocena jakości pytań/odpowiedzi EN).
- **Surowy `|` w treści trybów swobodnych** (słuchanka/egzamin) MUSI być escapowany `\|`
  (parser dzieli po niezescapowanym `|`); checker ostrzega, gdy wiersz ma >4 komórki.

---

## 7. QA — recenzenci (wzmocnienie istniejących, nie nowy build)

`SKILL.md` ma już 3 recenzentów (A: poprawność+US; B: naturalność+rejestr+poziom; C: wierność+
przeplatanie). Wzmocnienia:
- **C dostaje twarde wsparcie skryptem** (sekcja 5) — liczenie recyklingu przestaje być „na oko".
- **C ocenia wydobycie vs ekspozycja** i rotację partnera.
- **Recenzent wierności (C): back-translation** kontroluje WYŁĄCZNIE zgodność referenta i
  ogólności/konkretności („someone vs parents") oraz brak zmiany znaczenia rdzennego —
  **dopuszcza stylistyczny rozjazd** wyzwalacza (inaczej zabije naturalność polskiej kolumny).
- **Recenzenci dostają w prompcie** ścieżki/treść `slownik.json` + `METODA-C1.md` (§5–§6), nie
  tylko `rozdzial.md`.
- **Bezpiecznik pętli:** max **3 iteracje** poprawek; potem dział idzie do checkpointu z listą
  spornych uwag (nie w nieskończoność). **Precedencja przy konflikcie:** wierność > poprawność >
  naturalność > preferencja (rozwiązuje oscylację „luźniej" vs „sufit rejestru").
- Recenzent zwraca **PASS/FAIL + lista**; brak wierszy BŁĄD/ZMIEŃ = PASS.

**Dwie bramki:** automatyczna (skrypt + recenzenci, każdy dział) + ludzka (checkpoint).

---

## 8. Plan generacji

Sednem są **3 ruchy**; szczegóły proceduralne → plan implementacji.

**Ruch 0 — Reguły i mapa na papierze (zero generacji treści):**
- `METODA-C1.md` → v2: przepisz liczby **6→~11 działów, 3–4→2–3 nowe/dział**; harmonogram
  → interwały rozszerzające + `review[]` ≥10/≥6; dodaj: wydobycie≠ekspozycja, quick-checki,
  kontrakt kolumn per-tryb, warstwa wymowy/błędów, precedencja recenzentów, twarda reguła OpenAI.
- `slownik.json` → przelicz wszystkie `review[]` na siatkę 11-działową i rozszerz do budżetu;
  zaplanuj harmonogram dla M1–M5 (bez nowych pól).
- `PROGRAM.md` → przepisz **30→~55, 6→~11**; mapa M1 z 11 działami; zdejmij status „GOTOWE 01–06".
- `assemble-audio.js` → **zweryfikuj** istniejące tryby (dostrój pauzę słuchanki, ~0.8 s może być
  za krótka); **NIE pisz od zera**. Popraw NIEAKTUALNY tekst w `SKILL.md` (linie 159–161).
- Pre-flight: klucz OpenAI z `OPENAI_API_KEY` (preferowane) zamiast zależności od `coach-2.0/main.js`.

**Ruch 1 — M1 od nowa, z checkpointem (jedyna bramka, która może zawrócić metodę):**
- Generuj M1 działy 1–3 + **próbka drugiej połowy** (1 grupa składania, 1 scena słuchanki,
  1 blok egzaminu na klockach z d1–3) → skrypt-checker + recenzenci → PDF + audio.
- **CHECKPOINT (Krzysiek):** ocena + **1 mierzalne pytanie**: „weź 2 klocki z d1 i policz, ile
  razy wróciły w d2–3 i czy za każdym razem w innym połączeniu". Może oznaczyć klocki „już umiem"
  → degradacja do tła, budżet uwolniony na trudne (adaptacja przez pętlę ludzką, bez pola JSON).
- Tak → generuj M1 działy 4–11. Nie → korekta metody, regeneracja próbki.

**Ruch 2 — Podmiana M1 i reszta hurtem:**
- **Stary M1 (01–06) do skasowania** — Krzysiek go nie chce („wywal, nie podoba mi się").
  Brak wymogu utrzymania live UPRASZCZA podmianę: **skasuj stare 01–06, wygeneruj nowe 01–11
  w ich miejsce** (nie trzeba tymczasowego prefiksu dla ciągłości). Dla bezpieczeństwa kolejność:
  skasuj stare foldery + ich wpisy z `content.json` PRZED regeneracją (apka routuje po nazwie
  folderu i `generate.js` nie dedupuje po `number` — inaczej duplikaty/kolizje 01–06). Awaria
  w połowie jest akceptowalna (ciągłość nauki nie jest wymagana, regeneracja wznawialna per dział).
- Finalizuj listy wyrażeń M2–M5; generuj minikurs po minikursie tym samym pipeline'em.
- Numeracja folderów: **globalna 2-cyfrowa** (01–55) + slug `m<k>d<n>`; `generate.js` (`parseInt`)
  to uniesie (<99). Per-minikurs 01–11 dałoby kolizje — odrzucone.

**Skala i koszt (do oszacowania w planie):** ~55 działów × (md + recenzenci + PDF + audio).
Audio woła `gpt-4o-mini-tts` **sekwencyjnie per segment** (~100–130 wywołań/dział) → tysiące
wywołań, godziny, realny rachunek. Mitigacje w planie: **skip-jeśli-mp3-istnieje** (idempotencja
per grupa), rozważyć równoległość TTS, oszacować koszt przed falą M2–M5. Checkpoint chroni jakość,
nie koszt skali — stąd osobny budżet.

---

## 9. Reguły globalne (twarde)

- **Wariant:** General American. **Sufit rejestru:** neutralna amerykańszczyzna, bez slangu na
  siłę, ≤1–2 „(luźno)"/grupa. **Wierność PL↔EN:** ogólność↔konkretność (recenzent C + skrypt).
- **Audio = wyłącznie OpenAI TTS.** PL=**nova**, EN=**alloy**. Tryby słuchanka/en-only: tylko
  `alloy` (brak PL). **ElevenLabs ZAKAZANY** poza świadomym opt-in (kod już domyślnie wyłącza:
  `ELEVEN_ENABLED = klucz && ELEVEN_TTS==='1'`). (Pamięć `no-elevenlabs-english-audio`; commit 381232b.)
- **Kontrakt parsera:** tabele `| polski | angielski |`, nagłówki `## Grupa N`, jedna grupa =
  jeden `grupa-N.mp3`, `## Nowe słowa i struktury` poza audio. Markery `<!-- mode: ... -->` per grupa.

---

## 10. Artefakty do zmiany / utworzenia

| Plik | Zmiana |
|---|---|
| `…/angielski-rozdzial/METODA-C1.md` | v2: 6→11 działów, 3–4→2–3 nowe, interwały rozszerzające, wydobycie≠ekspozycja, quick-checki, warstwa wymowy, kontrakt per-tryb, precedencja recenzentów |
| `…/angielski-rozdzial/SKILL.md` | popraw nieaktualne linie 159–161 (tryby JUŻ są); 11 działów; recenzenci dostają slownik+METODA; skrypt-checker w Kroku 1 |
| `…/angielski-rozdzial/assemble-audio.js` | **tylko weryfikacja/dostrojenie** (pauza słuchanki); idempotencja skip-jeśli-istnieje; klucz z env |
| `…/angielski-rozdzial/` (nowy) | `check-recykling.js` — deterministyczny licznik `review[]` w dziale |
| `~/angielski/slownik.json` | przelicz `review[]` na 11-działową siatkę, rozszerz do budżetu (bez nowych pól) |
| `~/angielski/PROGRAM.md` | przepisz 30→55, 6→11; mapa M1 (11 działów); zdejmij „GOTOWE" |
| `~/angielski/01..06-*` (stary M1) | **SKASOWAĆ** (Krzysiek nie chce) — usuń foldery + wpisy z content.json |
| `~/angielski/01..11-*` (nowy M1) | regeneracja w miejsce skasowanego |
| `~/angielski/content.json` | po podmianie M1 (potem M2–M5) |

---

## 11. Otwarte pytania (do planu / po checkpoincie)
- Dokładne listy 2–3-wyrażeń-na-dział dla M1 (z obecnych ~14 klocków → ~10 rdzeniowych na d1–4).
- Finalna liczba działów/minikurs (czy „11" zostaje) — decyzja PO checkpoincie.
- Finalizacja list M2–M5 — po walidacji M1.
- Czy włączyć adaptację trudności per-klocek jako trwałe pole (na razie: pętla ludzka na checkpoincie).
