# Egzamin głosowy — design (v2, po brainstormingu 2026-07-13 wieczorem)

Zastępuje skasowane podejście z rana (spec 387 linii + plan 17 zadań — usunięte,
bo nic nie zadziałało przed rozbudową). Ten dokument jest celowo krótki.

## Cel

Interaktywny egzamin głosowy zamiast pasywnego dnia 11 (mp3 z ciszą). Serio
egzamin: bramka między minikursami — nie zdam → nie zaczynam kolejnego.
Pierwsze użycie: bramka M3→M4. Dotychczasowy rozdział d11 zostaje jako
ćwiczenie przygotowawcze; nie ruszamy go.

## Decyzje z brainstormingu (rozstrzygają 4 pytania z handoffu)

1. **Co mierzy:** dwie osie, obie muszą przejść.
   Oś A = materiał minikursu (struktury-cele w spontanicznej produkcji).
   Oś B = jakość mówienia (rubryka CEFR + twarde metryki audio).
2. **Kształt:** rozmowa ~20 min, 4 bloki tematyczne, w każdym pytanie główne
   + 1–2 adaptacyjne follow-upy; łącznie ~8–12 wypowiedzi.
3. **Poprzeczka:** rośnie z minikursem (M3: solidne B2 bez skostniałych błędów
   + zero ucieczki od irrealis; M5: pełne C1). Jawna przed startem egzaminu.
4. **Anty-gotowiec:** plan pytań generowany dopiero po kliknięciu START;
   follow-upy budowane z treści udzielonej odpowiedzi. Retake = nowe pytania.
5. **Pytania tylko audio** (głos cedar), tekst ukryty do raportu; jedno
   powtórzenie na życzenie. Listening jest częścią egzaminu.
6. **Technicznie:** lokalna strona + mały serwer Node w repo kursu
   (jak podglad.html + serve.mjs). Nie deployowane, klucze poza frontem.

## Przebieg podejścia

1. `npm run egzamin` → lokalna strona. Test mikrofonu (3 s nagrania
   z odsłuchem) PRZED startem. Ekran z jawną rubryką i progiem. START.
2. Serwer generuje plan: 4 bloki z realnego życia Krzyśka (MadreM, praca,
   rodzina), każdy inżynierowany pod okazje do struktur-celów minikursu
   (M3: what-if → 2nd/3rd/mixed conditionale, wish/if only, modal perfects).
3. Pętla: cedar czyta pytanie → nagranie odpowiedzi (timer, sugerowane
   60–120 s) → transkrypcja → follow-up albo następny blok.
4. Koniec po 4 blokach (~20 min) → sędzia ocenia całość → raport.

## Ocena

**Oś A — materiał.** Sędzia dostaje transkrypt + listę okazji z planu
i rozlicza każdą: wykorzystana czy ucieczka, użycie poprawne czy nie,
z cytatami verbatim. Próg M3 (startowy, do kalibracji na podejściach
próbnych): ≥60% okazji wykorzystanych ORAZ każda rodzina struktur-celów
użyta ≥1 raz poprawnie.

**Oś B — mowa.** Rubryka 1–5 z cytatami: płynność, zakres, poprawność,
spójność. Do promptu sędziego wstrzykiwane metryki z timestampów whisper-1
(tempo netto, pauzy >2 s/min, długość wypowiedzi) — jako dowód, nie osobny
próg w v1 (pierwsze podejścia ustalają baseline). Próg M3: każde kryterium
≥3; nagminne błędy skostniałe (rodzajniki, past vs present perfect) ściągają
poprawność w dół.

**Werdykt.** ZDANE = obie osie nad progiem. Raport (HTML lokalnie): werdykt
na górze → oś A z cytatami → oś B z cytatami i metrykami → pełny transkrypt
z podświetlonymi błędami/upgrade'ami → odtwarzalne nagrania.

**Oblanie → zadanie na jutro.** Raport kończy jedno konkretne zadanie
z największej luki tego podejścia (np. mini-dryl 10 zdań PL→EN na oblaną
strukturę + 3 pytania scenkowe), w markdownie. Retake najwcześniej
następnego dnia — pilnuje tego serwer: po oblaniu blokuje START w tym
samym dniu kalendarzowym (sprawdza daty podejść w `egzaminy/`).

## Architektura

- `tools/egzamin/server.mjs` — serwer w stylu serve.mjs; endpointy:
  - `POST /api/start` → plan 4 bloków (Claude) + TTS pierwszego pytania,
  - `POST /api/odpowiedz` → whisper-1 (webm wprost, bez ffmpeg; word
    timestamps) → decyzja follow-up/następny blok (Claude) → TTS pytania,
  - `POST /api/zakoncz` → sędzia (Claude) → raport + werdykt.
- `tools/egzamin/egzamin.html` — jedna strona, vanilla JS, maszyna stanów:
  pytanie gra → nagrywam → przetwarzanie → … → raport. Kod źródłowy —
  commitowany (w przeciwieństwie do generowanego podglad.html); serwowana
  przez server.mjs, bez serwera jest martwa (endpointy tylko lokalne).
- Prompty (generator / follow-up / sędzia) w osobnych plikach
  w `tools/egzamin/` — kalibracja bez ruszania kodu.
- Modele: STT `whisper-1` (jedyny z timestampami słów); generator,
  follow-upy, sędzia `claude-sonnet-5`; TTS `gpt-4o-mini-tts` głos `cedar`.
- Klucze: env `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` z fallbackiem do COACH-a
  (wzorzec z assemble-audio.js). TODO poza zakresem: rotacja kluczy
  i przeniesienie do ~/.zshenv.
- Zapis po KAŻDEJ odpowiedzi do `egzaminy/m3/<data>-podejscie-N/`
  (webm + transkrypt + plan + raport + werdykt). Katalog w .gitignore.
  Awaria w trakcie → nic nie ginie, podejście nieważne (ani zdane,
  ani oblane).
- Błędy API: retry ×4; definitywna awaria → egzamin przerwany
  z komunikatem, bez werdyktu.

## Kolejność budowy

1. **Szkielet end-to-end:** jedno zahardcodowane pytanie — cedar czyta,
   nagrywam, whisper transkrybuje, sędzia komentuje jedną odpowiedź.
   Weryfikuje całą pętlę audio na żywo, zanim powstanie cokolwiek innego.
2. **Pełna rozmowa:** plan na START, 4 bloki, follow-upy, zegar.
3. **Werdykt:** sędzia całości, rubryka, raport, zadanie na jutro.

Testy: funkcje metryk (czyste) — unit testy; kalibracja promptu sędziego
i progów — 1–2 podejścia próbne na realnych nagraniach Krzyśka, zanim
bramka obowiązuje na serio.

## Poza zakresem v1 (świadomie)

- Gwiazdkowanie zdań z egzaminu do Anki, PDF zadania na jutro,
  historia/wykresy podejść, retroaktywne egzaminy M1/M2.
- Twarde progi liczbowe na metrykach audio (najpierw baseline).

## Kryteria sukcesu

- Podejście do egzaminu M3 od START do werdyktu bez dotykania terminala.
- Werdykt z uzasadnieniem cytatami — wiadomo, CO oblałem i co robić jutro.
- Pytania za każdym podejściem inne; follow-upy odnoszą się do tego,
  co faktycznie powiedziałem.
- Spec M3 (2026-07-04): egzamin wykrywa spontaniczne 2nd/3rd conditionale
  — to jest dokładnie oś A tego egzaminu.
