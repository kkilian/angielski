# Audio per para — projekt

**Data:** 2026-08-07
**Zakres:** Kurs K (3 działy, 18 grup) + generator + podgląd + eksport do Anki
**Poza zakresem:** audio Kursu M (39 działów zostaje nietknięte), powtórka wewnątrz aplikacji, zmiana głosów, PDF-y

## Problem

Audio kursu jest dziś generowane i przechowywane **per grupa**: `grupa-1.mp3` to jedno
nagranie ~3 minut, w którym sklejone jest 10–18 par (PL → cisza → EN → 1 s przerwy).
Z tego wynikają trzy koszty:

1. **Gwiazdkowanie w podglądzie jest powolne.** Leci 3-minutowy plik, a Krzysiek musi sam
   wypatrzeć w tabeli, przy którym wierszu jest, żeby trafić w gwiazdkę.
2. **Anki generuje audio od nowa.** `przejmij-json` woła OpenAI TTS dla każdej karty, mimo
   że dokładnie to zdanie zostało już nagrane przy tworzeniu działu.
3. **Nie widać, co leci.** Ani na ekranie telefonu, ani na ekranie blokady — manifest
   `content.json` nie zawiera ani jednego zdania, więc przeglądarka nie wie, co gra.

Pocięcie audio na pary usuwa wszystkie trzy i otwiera drogę do powtórek w aplikacji
(osobna robota).

## Decyzje

Podjęte w brainstormingu 2026-08-07, w kolejności zadawania:

| # | Decyzja | Uzasadnienie |
|---|---|---|
| 1 | Długie `grupa-N.mp3` **znikają**; zostają tylko pary | Krzysiek świadomie przyjął ryzyko iOS (patrz „Ryzyko") |
| 2 | **Dwa pliki na parę**: `-cue` (wyzwalacz + cisza) i `-en` (wzorzec) | Anki potrzebuje samego EN; napis przełącza się bez odliczania |
| 3 | **Słuchanka zostaje jednym plikiem** + offsety | Jedyny materiał bez ciszy na produkcję; cięcie nic tam nie daje, a najbardziej naraża |
| 4 | Nowy format **domyślny w generatorze**; stare działy M zostają | Przyszłe M5 ma być po nowemu; oba odtwarzacze muszą znać oba formaty |
| 5 | Fraza w **karcie na dole ekranu** (pasek rośnie) | Widać też listę grup; jeden komponent, bez nowej nawigacji |
| 6 | **EN pojawia się dopiero, gdy leci** | Angielski na ekranie w trakcie ciszy zamienia dryl w czytanie |
| 7 | **⇤ / ⇦ = para**, pętla `wył → para → grupa → cały` | Cofnięcie zdania z ekranu blokady; „zapętl tę parę" to nowa możliwość drylu |
| 8 | Podgląd **podświetla grający wiersz** + ▶ przy wierszu | Rozwiązuje koszt nr 1: gwiazdkujesz to, co słyszysz |

Rozstrzygnięte przez wykonawcę (Krzysiek: „rób jak uważasz"): nazwy `-cue`/`-en`,
pętla czterostanowa.

## Format danych

### Katalog działu

```
K/03-k3-jednym-zdaniem/
  rozdzial.md
  rozdzial.pdf
  audio.json
  audio/
    g1-p01-cue.mp3
    g1-p01-en.mp3
    g1-p02-cue.mp3
    …
```

Nazwa pliku: `g{grupa}-p{para dwucyfrowo}-{cue|en}.mp3`.
`grupa-N.mp3` w działach formatu 2 **nie istnieje** — poza grupami słuchanki.

### `audio.json`

Jeden kształt dla wszystkich trybów, żeby odtwarzacz nie musiał ich rozróżniać:

```json
{
  "wersja": 2,
  "generatedAt": "2026-08-07T09:00:00.000Z",
  "grupy": [
    {
      "n": 1,
      "tryb": "pl2en",
      "pary": [
        {
          "n": 1,
          "cue":  { "src": "audio/g1-p01-cue.mp3", "sek": 11.2 },
          "wzor": { "src": "audio/g1-p01-en.mp3",  "sek": 4.6 },
          "tekst": {
            "pyt": null,
            "pl": "Wyleciało mi słowo.",
            "en": "I'm blanking on the word."
          }
        }
      ]
    }
  ]
}
```

Pola `tekst` wypełniane per tryb:

| tryb | `pyt` | `pl` | `en` |
|---|---|---|---|
| `pl2en` (dryl) | `null` | wyzwalacz PL | wzorzec EN |
| `scenka` | pytanie EN | podpowiedź PL | odpowiedź EN |
| `en-only` (egzamin) | pytanie EN | `null` | odpowiedź EN |

Tryb `en2pl` istnieje w `normalizeMode`, ale nie używa go żaden dział. Traktujemy jak
`pl2en` z zamienioną kolejnością nagrań; nie testujemy osobno.

Zawartość audio per tryb:

| tryb | `cue` zawiera | `wzor` zawiera |
|---|---|---|
| `pl2en` | PL + cisza `silenceDuration(en)` | EN + 1 s |
| `scenka` | pytanie EN + 0,7 s + podpowiedź PL + cisza `answerSilence(a)` | odpowiedź EN + 1 s |
| `en-only` | pytanie EN + cisza `answerSilence(en)` | odpowiedź EN + 1,2 s |

**Słuchanka** ma inny kształt — bez `cue`, bez cięcia:

```json
{
  "n": 1,
  "tryb": "sluchanka",
  "src": "grupa-1.mp3",
  "zdania": [
    { "pl": "No i to jest to…", "en": "This is it —…", "t": [0.0, 4.2] }
  ]
}
```

W Kursie K słuchanka nie występuje; kształt istnieje dla przyszłych działów M.

### `content.json` / `k-content.json`

Dział formatu 2 dostaje dwa pola i traci `groups[].src`:

```json
{
  "id": "k3",
  "format": 2,
  "audioManifest": "K/03-k3-jednym-zdaniem/audio.json",
  "audioVersion": 1785822079612,
  "hasAudio": true,
  "groups": [ { "n": 1, "label": "Grupa 1", "parCount": 16 } ]
}
```

Dział bez `format` (albo `format: 1`) to stary układ — pola dokładnie jak dziś.

`audioVersion` = największy `mtimeMs` w katalogu `audio/` oraz w plikach `grupa-*.mp3`
działu. Odtwarzacz dokleja go jako `?v=` do **każdej** ścieżki z `audio.json`. Dzięki temu
manifest zostaje mały, a regeneracja działu unieważnia cache mimo niezmiennych nazw plików.
`build-podglad.js` celowo **nie** dokleja `?v=` — podgląd bywa otwierany z `file://`,
gdzie parametr zapytania psuje ścieżkę, a sam plik i tak powstaje na nowo przy każdym buildzie.

`groups[].parCount` to liczba par w grupie, a dla grupy słuchanki — liczba zdań.

Manifest `audio.json` jest **dociągany dopiero po wejściu w dział**. Strona główna i
lista działów nie wczytują żadnych zdań.

## Komponenty

### 1. `assemble-audio.js` (skill `angielski-rozdzial`)

Przestaje sklejać grupy. Zmiana wewnętrzna: dzisiejsze gałęzie `if (mode === …)` w
`assembleGroup()` budują listę segmentów **i od razu je wykonują**. Rozdzielamy to na:

- `planujParę(tryb, para) → { cue: [...], wzor: [...] }` — **czysta funkcja**: zwraca listę
  segmentów `{ rodzaj: 'tts'|'cisza', tekst?, lang?, sek? }`. Bez API, bez ffmpega,
  w pełni testowalna. Ta sama funkcja odtwarza oczekiwane ciszy przy migracji (patrz niżej).
- wykonanie: TTS każdego segmentu `tts`, `makeSilence` każdego `cisza`, sklejenie w
  `cue`/`wzor`, pomiar `ffprobe`, zapis do `audio/` i `audio.json`.

Słuchanka: bez zmian w wykonaniu (jeden plik), dochodzi zapis offsetów do `audio.json`.

`shouldSkip` przenosi się z `grupa-N.mp3` na komplet plików pary — regeneracja pojedynczej
pary staje się możliwa (`--only-para`).

Interfejs wiersza poleceń zostaje: `assemble-audio.js <rozdzial.md> [--only N] [--force]`.

### 2. `tools/potnij.js` — migracja Kursu K

Jednorazowe narzędzie, **bez OpenAI**, bez rekompresji (`ffmpeg -ss/-to -c copy`).

Dla każdej grupy działu:

1. Sparsuj `rozdzial.md`, ustal tryb i wiersze.
2. Odtwórz **oczekiwaną listę ciszy** przez `planujParę` (te same wzory, które je wygenerowały).
3. `ffmpeg silencedetect=noise=-45dB:d=0.5` na `grupa-N.mp3`.
4. Dopasuj zachłannie w kolejności: oczekiwana cisza `v` pasuje do wykrytej, gdy
   `długość ≥ v − 0,2 s`. Niedopasowane wykryte ciszy odrzuć jako pauzy wewnątrz zdania.
5. Nie dopasowało się wszystko → **zgłoś grupę i jej nie tykaj**.
6. Punkty cięcia: koniec ciszy o roli `en` (start wzorca) i koniec ciszy o roli `koniec`
   (start następnej pary).
7. Kontrola sensu po cięciu: suma kawałków = długość oryginału (±0,5 s) oraz
   `długość wzorca − 1 s` mieści się w `liczba słów × [0,25; 0,9] s`.
8. Zapisz `audio/`, `audio.json`, usuń `grupa-N.mp3`.

**Cały dział albo nic.** Kroki 1–7 wykonują się dla wszystkich grup działu do katalogu
tymczasowego. Dopiero gdy **każda** grupa przejdzie, narzędzie przenosi pliki na miejsce,
zapisuje `audio.json` i kasuje `grupa-N.mp3`. Jedna niedopasowana grupa → dział zostaje
w całości w formacie 1. Bez tego dział mógłby zostać w stanie pół-migrowanym, którego
żaden z formatów nie opisuje.

**Zweryfikowane na żywych plikach przed napisaniem specki: 18/18 grup Kursu K się dopasowuje.**
Próba oparta na samym liczeniu ciszy zawodzi (10/18) — ffmpeg wykrywa pauzy wewnątrz zdań
(0,6–0,9 s), a progu długości nie da się ustawić, bo przerwa końcowa mierzy się do 2,5 s,
a najkrótsza pauza na produkcję to 3,4 s. Dopasowanie do oczekiwanych długości omija ten problem.

### 3. `pary.js` — wspólny moduł odtwarzania

Nowy moduł ES w **korzeniu projektu** (obok `app.js` i `k-app.js`, nie w `tools/` — ten
katalog trzyma skrypty builda, a `pary.js` leci do przeglądarki). Importowany przez oba
odtwarzacze; bez niego ta sama logika powstałaby dwa razy i rozjechała się przy pierwszej
poprawce.

Odpowiada za:
- wczytanie `audio.json` (z `?v=`) i spłaszczenie grupy do kolejki `[{src, tekst, rola, para}]`,
- przejścia pętli (`wył` / `para` / `grupa` / `cały`),
- treść opisu na ekran blokady dla danego elementu kolejki.

Nie dotyka DOM-u ani `<audio>` — to zostaje w każdym odtwarzaczu osobno.

### 4. Odtwarzacze `k-app.js` i `app.js`

Stan rośnie z `{chapter, index}` do `{chapter, grupa, para, część}`, gdzie `część` to
`cue` albo `wzor`.

**Karta na dole** (dziś: „Grupa 1" + tytuł działu):

```
┌────────────────────────┐
│ K3 · Grupa 3   7/16  ↻ │
│                        │
│ Wyleciało mi słowo —   │  ← cue, zawsze widoczne
│ daj mi sekundę.        │
│                        │
│ I'm blanking on the    │  ← wzor, dopiero gdy leci
│ word — give me a sec.  │
│                        │
│ 0:12 ──●──────── 0:20  │
│    ⇤      ⏸      ⇦     │
└────────────────────────┘
```

W scence cue ma dwie linie (pytanie EN + podpowiedź PL). W egzaminie — jedną (pytanie EN).

**Ekran blokady** (Media Session), aktualizowany przy każdej zmianie `src`:

| co leci | `title` | `artist` |
|---|---|---|
| `cue` | wyzwalacz (PL albo pytanie EN) | `Grupa 3 · para 7/16` |
| `wzor` | wzorzec EN | wyzwalacz (kontekst zostaje widoczny) |

`album` bez zmian (`Kurs K` / `Angielski`).

**Sterowanie:**
- ⇤ — poprzednia para; jeśli minęło > 2 s bieżącej pary, wraca na jej początek
- ⇦ — następna para
- oba podpięte do Media Session `previoustrack` / `nexttrack`, więc działają z ekranu blokady
- pętla: `wył → para → grupa → cały`; `para` wraca z `wzor` na `cue` tej samej pary,
  `grupa` z ostatniej pary na pierwszą, `cały` przechodzi do następnej grupy (z zawinięciem)

**Format 1 (stare działy M):** zachowanie **bez żadnej zmiany** — grupa jako jeden plik,
`audio.loop` dla „jedna", ⇤/⇦ po grupach. Przycisk pętli pomija stan `para`.

**Grupa słuchanki w dziale formatu 2:** jeden plik, więc ⇤/⇦ przewijają `currentTime` do
offsetu poprzedniego/następnego zdania zamiast zmieniać `src`; karta i ekran blokady
przełączają zdanie na `timeupdate`. Przycisk pętli pomija stan `para`.

`restoreLast` w `localStorage` zapisuje dodatkowo `para`; brak pola = stary wpis, wracamy
na początek grupy.

### 5. `tools/build-podglad.js`

- Wiersz tabeli dostaje `data-cue` i `data-en` (ścieżki względne do korzenia projektu)
  oraz `data-para`.
- ▶ przy grupie buduje kolejkę par zamiast jednego pliku. Grający wiersz dostaje klasę
  `grajaca` i `scrollIntoView({block:'center'})`.
- Każdy wiersz dostaje własne ▶ (gra tylko tę parę: cue + wzor).
- Wiersze działu w formacie 1 zachowują się jak dziś (jeden plik na grupę, bez podświetlania).
- Eksport JSON: karta dostaje pole `audio` ze ścieżką do pliku `-en` (albo `null`).

### 6. `przejmij-json/add-cards.cjs`

Nowa ścieżka: karta ma `audio`, plik istnieje na dysku → czytaj, zakoduj base64,
`storeMediaFile` do mediów Anki, `[sound:…]` w polu `Extra`. **Zero wywołań OpenAI.**

Fallback bez zmian: brak `audio` albo brak pliku → TTS jak dziś. Ta ścieżka musi zostać —
Kurs M dalej eksportuje bez plików.

Nazwa pliku w mediach Anki **bez zmian**: `angielski-m{mk}-d{d}-{sha1(en)[0..10]}.mp3`
(dla kart K bez `mk`/`d` wychodzi `angielski-m0-d0-…`, tak jak dziś). Zmiana schematu
zdublowałaby media przy ponownym imporcie już dodanych zdań.

### 8. Dokumentacja

| plik | zmiana |
|---|---|
| `README.md` | sekcja „Dodanie nowego rozdziału" i „Pliki" — nowy układ katalogu, `audio.json`, `pary.js` |
| `angielski-rozdzial/SKILL.md` | Krok 3 „Audio": nowe wyjście (pary + `audio.json`) zamiast `grupa-N.mp3` |
| `przejmij-json/SKILL.md` | pole `audio` w JSON, kiedy TTS jest pomijany, nowy licznik „bez pliku" |

### 7. `tools/generate.js` i `tools/generate-k.js`

Wykrywają obecność `audio.json` w katalogu działu:
- jest → `format: 2`, `audioManifest`, `audioVersion`, `groups[].parCount`
- nie ma → dzisiejsze skanowanie `grupa-N.mp3`

## Przepływ danych

```
rozdzial.md ──┬─→ assemble-audio.js ──→ audio/*.mp3 + audio.json
              │                              │
              │                              ├─→ generate-k.js ──→ k-content.json
              │                              │        │
              │                              │        └─→ k-app.js  (pary.js)
              │                              │              ├─ karta na ekranie
              │                              │              └─ Media Session
              │                              │
              └─→ build-podglad.js ──────────┴─→ podglad.html
                                                   ├─ podświetlanie wiersza
                                                   └─ eksport JSON (pole audio)
                                                          │
                                                          └─→ add-cards.cjs ──→ Anki
```

## Obsługa błędów

| sytuacja | zachowanie |
|---|---|
| `potnij.js`: cisze się nie dopasowują | grupa zgłoszona, pliki nietknięte, kod wyjścia ≠ 0 |
| `potnij.js`: kontrola sensu nie przechodzi | jak wyżej; `grupa-N.mp3` **nie jest** kasowany |
| odtwarzacz: `audio.json` nie wczytany | dział pokazuje „Brak audio", reszta strony działa |
| odtwarzacz: pojedynczy plik 404 | przeskocz do następnej części, zaloguj w konsoli |
| `add-cards.cjs`: `audio` wskazuje na brakujący plik | fallback na TTS, policz w liczniku „bez pliku" |
| `assemble-audio.js`: TTS pada po 4 próbach | jak dziś — przerwij, para nie zostaje zapisana |

## Testy

Nowe, w istniejącej konwencji projektu:

| plik | co sprawdza |
|---|---|
| `test-assemble-audio.js` (skill) | `planujParę` dla 4 trybów: liczba i kolejność segmentów, długości ciszy |
| `tools/potnij.test.mjs` | dopasowanie ciszy: przypadek czysty, z pauzą w zdaniu, z brakiem (musi odrzucić); reguła „cały dział albo nic" |
| `tools/pary.test.mjs` | kolejka par, przejścia czterech trybów pętli, opisy Media Session |
| `tools/generate-k.test.mjs` | rozpoznanie formatu 2, obecność `audioManifest` i `audioVersion` |
| `tools/build-podglad.test.mjs` | `data-cue`/`data-en` w wierszach, `audio` w eksporcie |

**Test ręczny, obowiązkowy i pierwszy w kolejności wykonania:** jedna grupa pocięta,
serwer lokalny, iPhone, ekran zablokowany, dwie minuty słuchania. Zacinka → wracamy do
rozmowy o sklejce, zanim powstanie cokolwiek innego.

## Ryzyko

**Główne: iOS przestaje płynnie przechodzić między plikami przy zablokowanym ekranie.**
README projektu (linie 49–50) odnotowuje, że tryb „cały" potrafi wymagać tapnięcia
„Następny" na ekranie blokady. Dziś grupa to jeden plik, więc przejście zdarza się raz na
~3 minuty; po pocięciu — co ~15 sekund, około 32 razy na grupę.

Krzysiek przyjął to ryzyko świadomie („kasujemy długie pliki… i sprawdzamy w praniu").
Łagodzenie: test na żywym urządzeniu jest **pierwszym** krokiem wykonania, na grupie
pociętej ffmpegiem, zanim powstanie generator, odtwarzacz czy podgląd. Koszt wycofania
się na tym etapie to kilkanaście minut.

**Poboczne:** liczba plików w repo rośnie z 18 do ~520 dla Kursu K (rozmiar w bajtach
praktycznie bez zmian — te same dane, więcej nagłówków MP3).
