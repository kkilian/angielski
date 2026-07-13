# Egzamin głosowy — plan implementacji

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans
> (wykonanie inline w sesji, która napisała ten plan). Subagenci — WYŁĄCZNIE
> model opus (polecenie Krzyśka 2026-07-13).
>
> Plan celowo chudszy niż kanon writing-plans (pełny kod tylko tam, gdzie
> nieoczywisty): standing instruction właściciela „nie rozdymaj specek" +
> wykonawca = ta sama sesja. Poranny plan-elaborat (2359 linii) został
> skasowany właśnie za rozdęcie.

**Goal:** Interaktywny egzamin głosowy (bramka M3→M4) wg specki
`docs/superpowers/specs/2026-07-13-egzamin-glosowy-design.md`.

**Architecture:** Lokalna strona `tools/egzamin/egzamin.html` + serwer
`tools/egzamin/server.mjs` (node:http, wzorzec serve.mjs). Serwer trzyma
klucze, woła OpenAI (whisper-1, gpt-4o-mini-tts/cedar) i Anthropic
(claude-sonnet-5), zapisuje wszystko po każdej odpowiedzi do `egzaminy/`.

**Tech Stack:** Node 24 (natywny fetch/FormData/Blob, node:test) — ZERO
zależności npm, jak reszta repo. Front: vanilla JS, maszyna stanów.

## Global Constraints

- Zero npm dependencies; tylko wbudowane moduły Node 24.
- Klucze: env `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, fallback regex z
  `~/Desktop/coach-2.0/main.js`: `const OPENAI_API_KEY = '…'`
  i `const CLAUDE_API_KEY = '…'` (wzorzec assemble-audio.js). Nigdy w froncie.
- Modele: STT `whisper-1` (verbose_json + word timestamps); LLM
  `claude-sonnet-5`; TTS `gpt-4o-mini-tts`, voice `cedar`, instructions:
  „Speak in natural, native General American English. Calm and clear tone,
  medium pace. Conversational, not theatrical."
- Port 8124 (podgląd ma 8123). UI po polsku, treść egzaminu po angielsku.
- Nagrania z przeglądarki: MediaRecorder — Chrome daje `audio/webm`, Safari
  `audio/mp4`; serwer przyjmuje oba (rozszerzenie z Content-Type).
- Zapis po każdej odpowiedzi do `egzaminy/m3/<YYYY-MM-DD>-podejscie-<N>/`;
  katalog `egzaminy/` w .gitignore.
- Progi liczy KOD (deterministycznie) z ocen sędziego; sędzia tylko ocenia.
- Progi M3: oś A — `procentOkazji >= 60` ORAZ każda rodzina struktur ≥1
  poprawne użycie; oś B — każde z 4 kryteriów `>= 3`.

## Mapa plików

| Plik | Odpowiedzialność |
|---|---|
| `tools/egzamin/server.mjs` | http, routing, sesja, zapis, progi, blokada retake |
| `tools/egzamin/api.mjs` | klienci API: klucze, tts, transkrypcja, claude |
| `tools/egzamin/metryki.mjs` | czyste funkcje: metryki z word-timestampów |
| `tools/egzamin/metryki.test.mjs` | node:test dla metryk |
| `tools/egzamin/egzamin.html` | front: maszyna stanów, mikrofon, raport |
| `tools/egzamin/prompty/generator.md` | system prompt: plan 4 bloków |
| `tools/egzamin/prompty/followup.md` | system prompt: follow-up / next |
| `tools/egzamin/prompty/sedzia.md` | system prompt: ocena całości |
| `tools/egzamin/minikurs-m3.md` | brief M3: struktury-cele, konteksty, poprzeczka |
| `tools/egzamin/sym.mjs` | symulacja podejścia przez HTTP (odpowiedzi z TTS) |

---

### Task 1: Fundament — serwer statyczny + klucze + health

**Files:** Create `tools/egzamin/server.mjs`, `tools/egzamin/api.mjs`;
Modify `package.json` (script `"egzamin": "node tools/egzamin/server.mjs"`),
`.gitignore` (+`egzaminy/`).

**Interfaces (api.mjs produkuje):**
- `klucze() -> {openai, anthropic}` — env → fallback COACH; throw gdy brak.
- `ttsMp3(text) -> Buffer` — POST api.openai.com/v1/audio/speech, retry ×4
  (backoff 1500·attempt ms, wzorzec assemble-audio).
- `transkrybuj(buf, mime) -> {text, words:[{word,start,end}], durationSek}`
  — POST /v1/audio/transcriptions, FormData: file (Blob z mime), model
  whisper-1, response_format verbose_json, timestamp_granularities[]=word.
- `claude({system, messages, maxTokens}) -> string` — POST
  api.anthropic.com/v1/messages, model claude-sonnet-5, header
  anthropic-version 2023-06-01; retry ×4.
- `claudeJson(...)` — jw. + parsowanie ```json bloku lub gołego JSON; throw
  z surowym tekstem w błędzie gdy nieparsowalne.

**Serwer:** statyczne pliki tylko z `tools/egzamin/` (`/` → egzamin.html),
`GET /api/health` → `{ok:true, klucze:{openai:bool, anthropic:bool}}`
(bool = czy klucz DOSTĘPNY, wartości nie zwracać).

- [ ] Kroki: server+api → `npm run egzamin` w tle → `curl -s
  localhost:8124/api/health` → oba `true` → commit.

### Task 2: Metryki mowy (TDD, czyste funkcje)

**Files:** Create `tools/egzamin/metryki.mjs`, `metryki.test.mjs`.

**Interfaces:** `metryki(words, durationSek) -> {liczbaSlow, czasSek,
tempoNetto, pauzy:[{start,dlugoscSek}], pauzeNaMin}`
- pauza = przerwa ≥2 s między end słowa i start następnego;
- tempoNetto = liczbaSlow / (czasMowieniaMin), czas mówienia = span od
  pierwszego start do ostatniego end MINUS suma pauz;
- puste words → wszystkie zera (nie NaN/Infinity).

- [ ] Test first (przypadki: normalny, z 2 pauzami, pusty, jedno słowo) →
  `node --test tools/egzamin/` FAIL → implementacja → PASS → commit.

### Task 3: Szkielet end-to-end (Milestone 1 — pętla audio działa)

**Files:** Create `tools/egzamin/egzamin.html`; Modify `server.mjs`.

**Endpoints:**
- `POST /api/start` (v1: hardcoded pytanie „Tell me about your channel —
  what would happen if your next three videos flopped?") →
  `{sesjaId, pytanieAudio:"/api/audio/<sesjaId>/p1.mp3"}`; TTS zapisany
  w katalogu podejścia; `GET /api/audio/...` serwuje mp3.
- `POST /api/odpowiedz` (body: audio, nagłówki X-Sesja, Content-Type) →
  transkrypcja → (v1) krótki komentarz sędziego do JEDNEJ odpowiedzi →
  `{transkrypt, komentarz, koniec:true}`. Zapis: odpowiedz-1.webm/.mp4,
  transkrypt-1.json.

**Front (maszyna stanów):** `idle → test-mikrofonu (3 s nagranie+odsłuch)
→ gotowy → pytanie-gra (audio, tekst UKRYTY, przycisk „Powtórz (1×)") →
nagrywam (timer) → przetwarzam → wynik-v1`. MediaRecorder z
`MediaRecorder.isTypeSupported('audio/webm') ? webm : mp4`.

- [ ] Kroki: endpoints → front → weryfikacja bez przeglądarki: `node -e`
  POST wygenerowanej TTS-em „odpowiedzi ucznia" (głos alloy, tekst z
  celowym błędem rodzajnikowym) → assert transkrypt zawiera słowa i words[],
  komentarz niepusty → commit. Test w przeglądarce robi Krzysiek później —
  odnotować w raporcie końcowym.

### Task 4: Brief M3 + prompty (pedagogiczne serce)

**Files:** Create `tools/egzamin/minikurs-m3.md`, `prompty/generator.md`,
`prompty/followup.md`, `prompty/sedzia.md`.

**minikurs-m3.md** (wsad dla generatora i sędziego): struktury-cele M3 z
rodzinami: `2nd-cond`, `3rd-cond` (+mixed), `wish-if-only`,
`modal-perfect`; w tle zawsze: rodzajniki, celne czasowniki. Konteksty
Krzyśka (z kursu M3): kanał MadreM rusza, łapanie uczniów/korki, sucha
passa, sceptyczny brat, decyzje i ryzyko, make-or-break month; szerzej:
praca, rodzina, wyjazdy. Poprzeczka M3 (jawna, do pokazania na starcie):
solidne B2 bez skostniałych błędów + zero ucieczki od irrealis.

**generator.md:** rola egzaminatora ustnego; NA WEJŚCIU brief + lista
pytań głównych z poprzednich podejść (do unikania); NA WYJŚCIU JSON:
`{bloki:[{temat, pytanie, rodziny:["2nd-cond",...], okazje:[opis okazji
jaką pytanie tworzy]}]}` — 4 bloki, każda rodzina pokryta ≥1 raz w planie;
pytania osobiste (ty/twój kanał/twoja decyzja), otwarte, wymuszające
hipotezy; jedno z bloków celuje w swobodną mowę (oś B) tematem
emocjonalnym/narracyjnym.

**followup.md:** NA WEJŚCIU blok + transkrypty dotychczasowych wypowiedzi
w bloku + ile follow-upów już było; NA WYJŚCIU JSON
`{followup:"..."}` LUB `{next:true}`; zasady: max 2 follow-upy/blok;
follow-up MUSI odnosić się do konkretu z odpowiedzi; jeśli rodzina bloku
niewykorzystana — follow-up tworzy drugą okazję (np. „And if you HAD
done X back then…?"); jeśli odpowiedź <15 słów — follow-up drąży.

**sedzia.md:** NA WEJŚCIU plan (bloki+okazje), pełny transkrypt Q/A,
metryki per odpowiedź; NA WYJŚCIU JSON:
`{osA:{okazje:[{blok, rodzina, wykorzystana:bool, cytat, poprawne:bool,
komentarz}]}, osB:{plynnosc:{ocena,cytaty,komentarz}, zakres:{...},
poprawnosc:{...}, spojnosc:{...}}, bledy:[{cytat, poprawka,
typ:"error"|"upgrade", wyjasnienie}], zadanieNaJutro:{struktura, opis,
dryl:[10 par PL→EN], scenka:[3 pytania EN]}}`.
Zasady sędziego: cytaty verbatim; ignoruj artefakty ASR (wzorzec COACH);
skostniałe błędy B1 (rodzajniki, past vs present perfect) obniżają
`poprawnosc`; oceny 1–5 zakotwiczone opisami (3 = „solidne B2"); NIE
wydaje werdyktu — werdykt liczy kod.

- [ ] Kroki: 4 pliki → sanity: `claudeJson` na generator.md zwraca
  poprawny JSON z 4 blokami i pokryciem rodzin (skrypt jednorazowy) →
  commit.

### Task 5: Pełna rozmowa (plan na START, 4 bloki, follow-upy)

**Files:** Modify `server.mjs`, `egzamin.html`.

**Sesja (w pamięci + na dysku po każdym kroku):** `{id, dir, plan,
blokIdx, followupyWBloku, wymiany:[{blok, pytanie, transkrypt, words,
metryki}], start:Date}`.
- `/api/start`: blokada retake (skan `egzaminy/m3/*/werdykt.json` — jeśli
  dziś OBLANE → 403 z komunikatem); generator (z listą starych pytań z
  `egzaminy/m3/*/plan.json`) → plan.json → TTS pytania bloku 1.
- `/api/odpowiedz`: transkrypcja+metryki+zapis → followup.md decyduje →
  `{transkrypt, nastepnePytanieAudio, blok:{idx,z:4}, koniec:bool}`;
  po bloku 4 → `koniec:true`.
- Front: pasek postępu bloków (1/4…), łączny zegar sesji, bez zmian
  w pętli stanów; po `koniec` → auto-wywołanie `/api/zakoncz`.

- [ ] Kroki: sesja+endpoints → front → rozbudowa `sym.mjs`: pełne
  podejście symulowane (4 bloki, odpowiedzi TTS: jedna z conditionalem,
  jedna z ucieczką w 1st, jedna krótka <15 słów → assert follow-up) →
  commit.

### Task 6: Werdykt, raport, zadanie na jutro

**Files:** Modify `server.mjs`, `egzamin.html`.

- `/api/zakoncz`: sedzia.md → oceny; KOD liczy werdykt (progi z Global
  Constraints) → `werdykt.json` + `raport.json`; odpowiedź = pełny raport.
- Front — ekran raportu: werdykt (ZDANE zielone / OBLANE czerwone +
  KTÓRA oś i czemu) → oś A: tabela okazji (✓/✗, cytaty) → oś B: 4 oceny
  z cytatami + metryki → transkrypt z podświetlonymi błędami (mark
  error/upgrade, tooltip z poprawką — wzorzec COACH) → odtwarzacze nagrań
  (`/api/audio/...`) → przy OBLANE: zadanie na jutro (dryl 10 par PL→EN
  + 3 pytania scenkowe) + info kiedy retake.

- [ ] Kroki: endpoint → progi jako czysta funkcja `werdykt(oceny) ->
  {zdane, powody[]}` z testami node:test (przypadki: obie osie pass, oś A
  fail na procencie, oś A fail na rodzinie, oś B fail na jednym kryterium)
  → front raportu → `sym.mjs` do końca (assert werdykt.json istnieje,
  raport kompletny) → commit.

### Task 7: Weryfikacja końcowa + review + domknięcie

- [ ] `node --test tools/egzamin/` — wszystko PASS.
- [ ] Pełna symulacja `node tools/egzamin/sym.mjs` na żywych API — od
  START do raportu; obejrzeć raport.json okiem: czy cytaty verbatim, czy
  zadanie na jutro sensowne.
- [ ] Code review przez subagentów (WYŁĄCZNIE opus) — bugi + bezpieczeństwo
  (klucze!); poprawki.
- [ ] Zaktualizować `.handoff-egzamin/HANDOFF.md` (skonsumowany → stan
  faktyczny + jak uruchomić) i memory. Commit końcowy.
- [ ] Raport dla Krzyśka: co działa, co przetestowane symulacją, co MUSI
  sprawdzić sam (mikrofon w przeglądarce, odsłuch, realne podejście
  próbne → kalibracja progów).
