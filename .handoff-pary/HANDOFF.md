# HANDOFF — audio per para (Kurs K)

**Data:** 2026-08-07 · **Stan:** zaprojektowane i zaplanowane, **nic jeszcze nie wykonane**

## Co masz zrobić

Wykonać plan `docs/superpowers/plans/2026-08-07-audio-per-para.md` — 13 zadań (0–12).
Zacznij od przeczytania planu **w całości**, potem specki, potem tego pliku do końca.

Użyj skilla `superpowers:subagent-driven-development` albo `superpowers:executing-plans`.

## Trzy pliki, które musisz przeczytać

| plik | po co |
|---|---|
| `docs/superpowers/plans/2026-08-07-audio-per-para.md` | plan wykonania, kod w każdym kroku |
| `docs/superpowers/specs/2026-08-07-audio-per-para-design.md` | dlaczego tak, jakie decyzje i czyje |
| ten plik | stan faktyczny i pułapki |

## O co chodzi w jednym akapicie

Audio kursu leży dziś w plikach `grupa-N.mp3` — jeden plik to ~3 minuty i 10–18 par
sklejonych razem. To blokuje trzy rzeczy: szybkie gwiazdkowanie zdań do Anki, pokazywanie
aktualnej frazy na ekranie telefonu, i ponowne użycie nagrania w karcie Anki (dziś Anki
generuje audio od nowa przez OpenAI). Tniemy audio Kursu K na osobne pliki per para —
**wyzwalacz** (`-cue`, polskie zdanie plus cisza na produkcję) i **wzorzec** (`-en`,
angielskie zdanie). Kurs M zostaje nietknięty.

## BRAMKA — zanim cokolwiek napiszesz

**Zadanie 0 planu to test na iPhonie Krzyśka i jest obowiązkowe.**

Ryzyko: iOS przy zablokowanym ekranie potrafi zaciąć się na przejściu między plikami
(README projektu, linie 49–50, opisuje to jako znane ograniczenie trybu „cały"). Dziś
grupa to jeden plik, więc przejście zdarza się raz na 3 minuty. Po pocięciu — co ~15 sekund,
około 32 razy na grupę.

Krzysiek przyjął to ryzyko świadomie („kasujemy długie pliki i sprawdzamy w praniu"), ale
sprawdzamy je **przed** wygenerowaniem 500 plików, nie po. Jeśli test padnie — zatrzymaj
się, napisz Krzyśkowi i wróć do wariantu „pary + sklejona grupa" z brainstormingu.

## Co jest zweryfikowane, a co nie

**Zweryfikowane na żywych plikach w tej sesji:**
- `ffmpeg silencedetect` znajduje ciszy generatora we wszystkich 18 grupach Kursu K
- dopasowanie do oczekiwanych długości (odtworzonych z `rozdzial.md`) daje **18/18**
- proste liczenie ciszy **nie działa** (10/18) — ffmpeg wykrywa pauzy wewnątrz zdań
  po myślnikach i przecinkach; progu długości nie da się ustawić, bo przerwa końcowa
  mierzy się do 2,5 s, a najkrótsza pauza na produkcję to 3,4 s
- ffmpeg 7.1.1 jest lokalnie, `-c copy` tnie bez rekompresji
- baza testów: **21 przechodzących** (`node --test tools/*.test.mjs`, bez testu Chrome)

**Niezweryfikowane — sprawdzisz w trakcie:**
- zachowanie iOS przy zablokowanym ekranie (Zadanie 0)
- czy `-c copy` nie gubi kilkudziesięciu milisekund na granicy ramki MP3 (Zadanie 8, krok 7 — na słuch)

## Pułapki, o które łatwo się potknąć

1. **Trzy testy odwołują się do `grupa-*.mp3` w K i pękną przy migracji.**
   `tools/build-podglad.test.mjs:28`, `tools/build-podglad.browser.test.mjs:29` i `:189`.
   Zadanie 8, krok 5 mówi dokładnie, co w nich zmienić. Nie „napraw" ich wcześniej — do
   Zadania 8 są poprawne.

2. **Scenka ma trzy ciszy na wiersz, nie dwie.** Przerwa 0,7 s między pytaniem a
   podpowiedzią mierzy się jako ~1,0 s. Dlatego `oczekiwaneCisze` ma role `wewn`/`en`/`koniec`,
   a cięcie idzie tylko po `en` i `koniec`.

3. **`k-app.js` jest opakowany w `initSite()`, `app.js` nie.** Kod z Zadania 6 wchodzi
   do wnętrza funkcji; kod z Zadania 7 na poziom modułu. Nazwy zmiennych w planie są
   przepisane z rzeczywistego kodu — trzymaj się ich.

4. **`k-app.js` eksportuje `fmt`, `cycleRepeat`, `nextIndex`, `cleanTitle` i istniejące
   testy na nich stoją.** Nie usuwaj ich przy przebudowie. `cycleRepeat` obsługuje dalej
   format 1 (trzy stany); format 2 używa `nastepnyTryb` z `pary.js`.

5. **Kurs M jest nietykalny.** 39 działów zachowuje `grupa-N.mp3` i dzisiejsze zachowanie,
   łącznie z natywnym `audio.loop` w trybie „jedna". To jedyny w pełni pewny tryb przy
   zablokowanym ekranie — nie zamień go na przejścia.

6. **Nie pushuj bez zgody Krzyśka.** Push na `main` uruchamia deploy na Render. Plan każe
   pracować na gałęzi `audio-per-para` i scalić dopiero po Zadaniu 12.

## Decyzje, których nie podważaj bez pytania

Wszystkie zapadły w brainstormingu z Krzyśkiem 2026-08-07 (tabela w spece, sekcja „Decyzje"):

1. Długie `grupa-N.mp3` znikają — zostają tylko pary
2. Dwa pliki na parę, nie jeden
3. Słuchanka zostaje jednym plikiem (w K nie występuje)
4. Nowy format domyślny w generatorze; stare działy M zostają
5. Fraza w karcie na dole ekranu, nie na osobnym ekranie
6. Angielskie pokazuje się dopiero, gdy leci — nigdy w trakcie ciszy
7. ⇤ / ⇦ chodzą po parach; pętla ma cztery stany
8. Podgląd podświetla grający wiersz

Nazwy `-cue`/`-en` i czterostanową pętlę Krzysiek zostawił do decyzji wykonawcy
(„rób jak uważasz") — są już wpisane w speckę i plan.

## Stan repo

- gałąź `main`, commity `b65f065` (specka) i `78b897e` (plan)
- w drzewie roboczym: nic poza `tmp/` (poza repo)
- gałąź `audio-per-para` **jeszcze nie istnieje** — zakłada ją Zadanie 0, krok 1
