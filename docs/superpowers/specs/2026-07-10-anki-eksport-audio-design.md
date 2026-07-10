# Eksport powtórek → Anki: stan „wyeksportowane" + audio na kartach

Data: 2026-07-10 · Status: zatwierdzony projekt (przed implementacją)

## Problem

1. Gwiazdki (`kurs.stars` w localStorage podglądu) nie zerują się po eksporcie JSON —
   każdy kolejny eksport zawiera też stare zdania. Anki odrzuca identyczne duplikaty
   (`allowDuplicate:false`), ale karty „bez luki", którym Claude dobiera target ręcznie,
   mogą dostać inną lukę niż poprzednio i duplikat przechodzi. Do tego szum: Claude za
   każdym razem przetwarza od nowa stare zdania.
2. Karty Anki nie mają dźwięku. Kurs ma tylko sklejki `grupa-N.mp3` (PL + cisze + EN);
   pojedyncze zdania powstają w katalogu tymczasowym i są kasowane po sklejeniu —
   nie ma gotowych plików per zdanie.

## Decyzje (z rozmowy z Krzyśkiem)

- Gwiazdki: stan „wyeksportowane" (drugi zbiór), NIE zerowanie i NIE dedup po stronie skilla.
- Audio: tylko angielskie zdanie, gra dopiero po odsłonięciu odpowiedzi (pole `Extra`).
- Źródło audio: świeży TTS per zdanie tym samym mechanizmem co kurs (koszt groszowy),
  nie wycinanie ze sklejek.
- Głos: env `ANG_VOICE_EN` z domyślnym `marin` (kurs właśnie przechodzi na nowe głosy
  OpenAI, snapshot gpt-4o-mini-tts-2025-12-15); instrukcje akcentu z `ANG_INSTR_EN`.

## Część A — podgląd (`tools/build-podglad.js`)

- Nowy klucz localStorage: **`kurs.exported`** (zbiór kluczy `data-k`, obok `kurs.stars`).
- Trzy stany przycisku gwiazdki:
  - `☆` — nieoznaczone,
  - `⭐` — oznaczone, czeka na eksport („nowe"),
  - `✅` — oznaczone i już wyeksportowane (przyciemnione w zakładce Powtórki).
- **„⬇ Wyeksportuj JSON"** zbiera tylko klucze będące w `stars`, a nie w `exported`.
  Po pobraniu pliku dopisuje te klucze do `exported`. Gdy nowych zero →
  `alert('Wszystkie gwiazdki już wyeksportowane…')`.
- Licznik pokazuje oba stany, np. „14 par · 3 nowe" (przy zerze nowych: „14 par").
- Zakładka ⭐ Powtórki pokazuje wszystkie oznaczone (historia zostaje), ✅ wyszarzone.
- Kliknięcie w `⭐`/`✅` zdejmuje klucz z **obu** zbiorów (świadome ponowne `⭐` pozwala
  wyeksportować jeszcze raz; przed przypadkowym duplikatem broni Anki).
- Format JSON-a bez zmian (`source`, `deck`, `exportedAt`, `cards[]`) — zmienia się
  tylko filtr tego, co trafia do `cards`.

## Część B — skill `przejmij-json` (`~/.claude/skills/przejmij-json/add-cards.cjs`)

- Przy właściwym uruchomieniu (nie `--dry-run`), dla każdej karty z luką:
  1. TTS zdania `en`: `fetch` do `https://api.openai.com/v1/audio/speech`
     (model `gpt-4o-mini-tts`, `voice = ANG_VOICE_EN || 'marin'`,
     `instructions = ANG_INSTR_EN || <domyślne z kursu>`, `response_format: 'mp3'`),
     retry ×4 z backoffem jak w `assemble-audio.js`. Klucz: `OPENAI_API_KEY` albo
     fallback z `~/Desktop/coach-2.0/main.js` (jak w kursie). Bez SDK — goły fetch,
     zero nowych zależności.
  2. `storeMediaFile` (AnkiConnect, base64) z deterministyczną nazwą
     `angielski-m{mk}-d{d}-{sha1(en) skrócony}.mp3` — ponowny run nadpisuje ten sam
     plik zamiast śmiecić w mediach.
  3. `addNote` z polem `Extra = '[sound:<nazwa>.mp3]'` → audio gra po odsłonięciu
     odpowiedzi (tył karty Cloze).
- Gdy TTS/upload padnie: karta dodaje się **bez audio**, raport dostaje licznik
  „bez audio: N" z listą zdań.
- Nowa flaga `--no-audio` (dodawanie jak dotychczas, bez TTS).
- `--dry-run` nie woła TTS ani Anki (jak dziś), ale pokazuje przewidzianą nazwę pliku audio.
- Aktualizacja `SKILL.md` (usunąć „Bez audio", opisać audio i flagę) oraz wpisu w pamięci
  `angielski-powtorki-anki-pipeline.md` po wdrożeniu.

## Poza zakresem

- Dogranie audio do kart już istniejących w Anki (narzędzie tylko dodaje — ewentualny
  osobny skrypt kiedyś).
- Wycinanie zdań ze sklejek `grupa-N.mp3`.
- Zmiany w pipeline audio kursu (`assemble-audio.js`) — równolegle trwa przebudowa
  głosów M3 w innej sesji; ten projekt jej nie dotyka.

## Weryfikacja

- **A:** `node tools/build-podglad.js` → w przeglądarce (serwer `tools/serve.mjs`, nie
  `file://` — Safari): oznacz 2 zdania → eksport → oba `✅`, licznik „2 pary"; oznacz
  trzecie → eksport → JSON zawiera tylko nowe zdanie; odklik `✅` → znika z obu zbiorów.
  Headless: istniejący hook `window.collectStarredCards` + sprawdzenie filtra.
- **B:** `--dry-run` na próbce → podgląd karty + nazwy audio; run z otwartym Anki →
  karta ma `[sound:…]` w `Extra`, plik widoczny przez `getMediaFilesNames`, audio gra
  na tylnej stronie karty; run z `--no-audio` → karta bez `[sound:…]`.
