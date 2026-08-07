# Audio per para — plan wykonania

> **Dla agentów:** WYMAGANY SUB-SKILL: użyj `superpowers:subagent-driven-development`
> (zalecane) albo `superpowers:executing-plans`, żeby wykonać ten plan zadanie po zadaniu.
> Kroki mają składnię checkboxów (`- [ ]`) do odhaczania.

**Cel:** Pociąć audio Kursu K na osobne pliki per para (wyzwalacz + wzorzec EN), pokazać
aktualną frazę na ekranie telefonu i na ekranie blokady, oprzeć gwiazdkowanie i karty Anki
o gotowe pliki zamiast ponownego TTS.

**Architektura:** `assemble-audio.js` przestaje sklejać grupy — zapisuje pary do
`<dział>/audio/` i opisuje je w `<dział>/audio.json`. Manifesty stron dostają `format: 2`
i wskaźnik na ten plik; odtwarzacze dociągają go leniwie po wejściu w dział i grają kolejkę
par przez wspólny moduł `pary.js`. Istniejące audio Kursu K migruje jednorazowo narzędziem
`tools/potnij.js`, które tnie ffmpegiem bez ani jednego wywołania TTS.

**Stack:** Node 24 (ESM + `node:test`), ffmpeg 7.1.1 (`silencedetect`, `-c copy`), OpenAI
`gpt-4o-mini-tts` (tylko generator nowych działów), AnkiConnect.

**Specka:** `docs/superpowers/specs/2026-08-07-audio-per-para-design.md`

## Ograniczenia globalne

- **Pracuj na gałęzi `audio-per-para`.** `main` jest wdrażany na Render przy każdym pushu;
  między Zadaniem 8 a końcem planu strona na `main` musi zostać sprawna.
- **Kurs M jest nietykalny.** 39 działów `01-…` do `36-…`, `56-…`, `57-…`, `58-…` zachowuje
  pliki `grupa-N.mp3` i dotychczasowe zachowanie odtwarzacza. Żaden krok tego planu nie
  usuwa ani nie regeneruje audio Kursu M.
- **Zero TTS w migracji.** `tools/potnij.js` nie może wywołać OpenAI. Cięcie tylko
  `ffmpeg -ss … -to … -c copy` (bez rekompresji).
- **Nazwy plików:** `g{grupa}-p{para dwucyfrowo}-cue.mp3` i `…-en.mp3`, w podkatalogu `audio/`.
- **Nazwa pliku w mediach Anki bez zmian:** `angielski-m{mk}-d{d}-{sha1(en) 10 znaków}.mp3`.
- **Testy:** `node --test tools/*.test.mjs` (bez `build-podglad.browser.test.mjs`, który
  wymaga Chrome — jego uruchamiaj osobno). Baza przed startem: 21 przechodzących testów.
- **Język:** komentarze, komunikaty i nazwy funkcji po polsku, zgodnie z resztą repo.

## Mapa plików

| plik | odpowiedzialność | zadanie |
|---|---|---|
| `~/.claude/skills/angielski-rozdzial/assemble-audio.js` | plan segmentów (czysty) + generowanie par i `audio.json` | 1, 9 |
| `~/.claude/skills/angielski-rozdzial/test-assemble-audio.js` | testy planu segmentów | 1 |
| `tools/potnij.js` | dopasowanie ciszy (czyste) + CLI migracji | 2, 3 |
| `tools/potnij.test.mjs` | testy dopasowania i reguły „cały dział albo nic" | 2, 3 |
| `tools/generate-k.js`, `tools/generate.js` | wykrycie formatu 2 w manifestach | 4 |
| `tools/generate-k.test.mjs` | test formatu 2 | 4 |
| `pary.js` (korzeń) | kolejka par, przejścia pętli, opisy na ekran blokady | 5 |
| `tools/pary.test.mjs` | testy `pary.js` | 5 |
| `k-app.js`, `k.html`, `k-style.css` | karta z frazą, Media Session, sterowanie po parach | 6 |
| `app.js`, `index.html`, `style.css` | to samo dla Kursu M, format 1 bez zmian | 7 |
| `K/0*/audio/`, `K/0*/audio.json` | zmigrowane audio | 8 |
| `tools/build-podglad.js` | podświetlanie wiersza, ▶ przy wierszu, `audio` w eksporcie | 10 |
| `~/.claude/skills/przejmij-json/add-cards.cjs` | użycie gotowego pliku zamiast TTS | 11 |
| `README.md`, oba `SKILL.md` | dokumentacja | 9, 11 |

---

## Zadanie 0: Próba na iPhonie — BRAMKA

Cel: sprawdzić na żywym urządzeniu, czy iOS płynnie przechodzi między krótkimi plikami
przy zablokowanym ekranie. To jedyne poważne ryzyko całego planu. **Jeśli test padnie,
zatrzymaj się i wróć do Krzyśka** — reszta planu zakłada, że przejścia działają.

**Pliki:**
- Utwórz: `tmp/proba/` (katalog roboczy, nie commitujemy — `tmp/` jest poza repo)

- [ ] **Krok 1: Załóż gałąź**

```bash
cd ~/angielski
git checkout -b audio-per-para
```

- [ ] **Krok 2: Potnij ręcznie jedną grupę na pary**

Grupa `K/02-k2-kintsugi/grupa-1.mp3` — 13 wierszy, dryl `pl2en`. Skrypt jednorazowy,
tnie po prostu na końcach wykrytych ciszy (na tym etapie nie chodzi o dokładność, tylko
o to, żeby powstało ~26 krótkich plików do przesłuchania):

```bash
mkdir -p tmp/proba/audio
node -e '
const {spawnSync}=require("child_process");
const src="K/02-k2-kintsugi/grupa-1.mp3";
const r=spawnSync("ffmpeg",["-hide_banner","-nostats","-i",src,"-af","silencedetect=noise=-45dB:d=1.0","-f","null","-"],{encoding:"utf8"});
const konce=[...r.stderr.matchAll(/silence_end:\s*([\d.]+)/g)].map(m=>Number(m[1]));
const dl=Number(spawnSync("ffprobe",["-v","error","-show_entries","format=duration","-of","default=nw=1:nk=1",src],{encoding:"utf8"}).stdout);
const punkty=[0,...konce,dl];
for(let i=0;i<punkty.length-1;i++){
  const out=`tmp/proba/audio/kawalek-${String(i+1).padStart(2,"0")}.mp3`;
  spawnSync("ffmpeg",["-y","-hide_banner","-loglevel","error","-ss",String(punkty[i]),"-to",String(punkty[i+1]),"-i",src,"-c","copy",out]);
}
console.log("kawałków:",punkty.length-1);
'
```

Oczekiwane: `kawałków: 26` (13 par × 2).

- [ ] **Krok 3: Zrób stronę próbną, która łańcuchuje te pliki**

```bash
cat > tmp/proba/index.html <<'HTML'
<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>Próba par</title></head>
<body style="font:18px system-ui;padding:24px;background:#111;color:#eee">
<h1>Próba: 26 plików pod rząd</h1>
<p id="stan">gotowe</p>
<button id="graj" style="font-size:22px;padding:14px 28px">▶ Graj</button>
<audio id="a" playsinline></audio>
<script>
const pliki = Array.from({length:26},(_,i)=>`audio/kawalek-${String(i+1).padStart(2,'0')}.mp3`);
const a = document.getElementById('a'), stan = document.getElementById('stan');
let i = 0;
function wczytaj(){
  a.src = pliki[i];
  stan.textContent = `kawałek ${i+1}/${pliki.length}`;
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `Kawałek ${i+1}`, artist: 'Próba par', album: 'Angielski' });
  }
}
a.addEventListener('ended', () => { i = (i+1) % pliki.length; wczytaj(); a.play().catch(()=>{}); });
document.getElementById('graj').addEventListener('click', () => { wczytaj(); a.play(); });
</script></body></html>
HTML
```

- [ ] **Krok 4: Wystaw lokalnie i podaj Krzyśkowi adres**

```bash
ipconfig getifaddr en0   # adres w sieci lokalnej, np. 192.168.1.14
cd tmp/proba && python3 -m http.server 8000
```

Poproś Krzyśka: otwórz `http://<adres>:8000` **w Safari na iPhonie** (nie w Chrome),
naciśnij ▶, **zablokuj ekran** i słuchaj przez 2 minuty bez dotykania telefonu.

- [ ] **Krok 5: Zbierz werdykt**

Trzy pytania do Krzyśka:
1. Czy przez całe 2 minuty grało bez zatrzymania?
2. Czy na ekranie blokady zmieniał się napis „Kawałek N"?
3. Czy między kawałkami słychać było zauważalną dziurę?

**PRZECHODZI** → idź do Zadania 1.
**NIE PRZECHODZI** (zatrzymuje się na końcu kawałka) → **zatrzymaj plan**, napisz Krzyśkowi
co się stało i wróć do wariantu „pary + sklejona grupa" z brainstormingu. Nie zaczynaj
Zadania 1.

- [ ] **Krok 6: Posprzątaj**

```bash
rm -rf tmp/proba
```

---

## Zadanie 1: `planujPare` — czysta funkcja planowania segmentów

Wyciąga z `assembleGroup()` decyzję „jakie segmenty i jakie ciszy" do funkcji, którą da się
przetestować bez OpenAI i bez ffmpega. Ta sama funkcja odtworzy oczekiwane ciszy przy
migracji (Zadanie 2), dzięki czemu wzory długości ciszy żyją w jednym miejscu.

**Pliki:**
- Modyfikuj: `~/.claude/skills/angielski-rozdzial/assemble-audio.js` (dodaj funkcje, nie ruszaj `assembleGroup`)
- Test: `~/.claude/skills/angielski-rozdzial/test-assemble-audio.js`

**Interfejsy:**
- Konsumuje: `silenceDuration`, `answerSilence`, `normalizeMode` (już istnieją w tym pliku)
- Produkuje:
  - `planujPare(tryb, para) → { cue: Segment[], wzor: Segment[] }`
  - `Segment = { rodzaj: 'tts', tekst: string, lang: 'pl'|'en' } | { rodzaj: 'cisza', sek: number }`
  - `oczekiwaneCisze(tryb, para) → [{ sek: number, rola: 'wewn'|'en'|'koniec' }]`

- [ ] **Krok 1: Napisz test, który pada**

Dopisz na końcu `test-assemble-audio.js`, przed podsumowaniem `console.log`:

```js
// --- planujPare ---
const { planujPare, oczekiwaneCisze } = require('./assemble-audio');

const dryl = planujPare('pl2en', { pl: 'Wyleciało mi słowo.', en: 'I am blanking on the word.' });
ok(dryl.cue.length === 2, 'pl2en: cue to nagranie PL + cisza');
ok(dryl.cue[0].rodzaj === 'tts' && dryl.cue[0].lang === 'pl', 'pl2en: cue zaczyna się od PL');
ok(dryl.cue[1].rodzaj === 'cisza' && dryl.cue[1].sek === 3.6, 'pl2en: cisza = 6 słów × 0.6');
ok(dryl.wzor.length === 2 && dryl.wzor[0].lang === 'en', 'pl2en: wzorzec to EN + przerwa');
ok(dryl.wzor[1].sek === 1, 'pl2en: przerwa końcowa 1 s');

const scenka = planujPare('scenka', { q: 'How are you?', prompt: 'Powiedz, że dobrze.', a: 'Doing great.' });
ok(scenka.cue.length === 4, 'scenka: pytanie + 0.7 + podpowiedź + cisza');
ok(scenka.cue[0].lang === 'en' && scenka.cue[2].lang === 'pl', 'scenka: pytanie EN, podpowiedź PL');
ok(scenka.cue[1].sek === 0.7, 'scenka: przerwa 0.7 s między pytaniem a podpowiedzią');
ok(scenka.cue[3].sek === 3, 'scenka: cisza = max(3, 2 słowa × 0.7)');

const bezPodpowiedzi = planujPare('scenka', { q: 'How are you?', prompt: '', a: 'Doing great.' });
ok(bezPodpowiedzi.cue.length === 3, 'scenka bez podpowiedzi: pytanie + 0.7 + cisza');

const egzamin = planujPare('en-only', { pl: 'What if it flops?', en: 'I would start over.' });
ok(egzamin.cue[0].lang === 'en', 'en-only: pytanie jest po angielsku mimo kolumny „polski"');
ok(egzamin.wzor[1].sek === 1.2, 'en-only: przerwa końcowa 1.2 s');

// role ciszy sterują cięciem przy migracji
const role = oczekiwaneCisze('scenka', { q: 'How are you?', prompt: 'Powiedz, że dobrze.', a: 'Doing great.' });
ok(role.length === 3, 'scenka: trzy ciszy na wiersz');
ok(role.map((c) => c.rola).join(',') === 'wewn,en,koniec', 'scenka: role w kolejności wewn→en→koniec');

const roleDrylu = oczekiwaneCisze('pl2en', { pl: 'Test.', en: 'One two three.' });
ok(roleDrylu.map((c) => c.rola).join(',') === 'en,koniec', 'pl2en: dwie ciszy, en→koniec');
```

- [ ] **Krok 2: Uruchom test i potwierdź, że pada**

```bash
node ~/.claude/skills/angielski-rozdzial/test-assemble-audio.js
```
Oczekiwane: `TypeError: planujPare is not a function`.

- [ ] **Krok 3: Dopisz implementację**

W `assemble-audio.js`, tuż po `normalizeMode` (linia ~62), wstaw:

```js
// --- czyste: co ma się nagrać i ile ciszy, dla jednego wiersza tabeli ---
// Zwraca dwie listy segmentów: `cue` (wszystko, co słyszysz zanim odpowiesz)
// i `wzor` (wzorcowa odpowiedź EN). To źródło prawdy o długościach ciszy —
// korzysta z niego i generator, i migracja starych nagrań (tools/potnij.js).
function planujPare(tryb, para) {
  const tts = (tekst, lang) => ({ rodzaj: 'tts', tekst, lang });
  const cisza = (sek) => ({ rodzaj: 'cisza', sek });
  switch (tryb) {
    case 'scenka': {
      const cue = [tts(para.q, 'en'), cisza(0.7)];
      if (para.prompt) cue.push(tts(para.prompt, 'pl'));
      cue.push(cisza(answerSilence(para.a)));
      return { cue, wzor: [tts(para.a, 'en'), cisza(1)] };
    }
    case 'en-only':
      // kolumna „polski" trzyma pytanie po angielsku — czytamy ją głosem EN
      return {
        cue: [tts(para.pl, 'en'), cisza(answerSilence(para.en))],
        wzor: [tts(para.en, 'en'), cisza(1.2)],
      };
    case 'en2pl':
      return {
        cue: [tts(para.en, 'en'), cisza(silenceDuration(para.en))],
        wzor: [tts(para.pl, 'pl'), cisza(1)],
      };
    default: // pl2en
      return {
        cue: [tts(para.pl, 'pl'), cisza(silenceDuration(para.en))],
        wzor: [tts(para.en, 'en'), cisza(1)],
      };
  }
}

// Ciszy, których należy się spodziewać w sklejonym grupa-N.mp3, w kolejności.
// `en` = po niej zaczyna się wzorzec, `koniec` = po niej zaczyna się następny
// wiersz, `wewn` = cisza w środku wyzwalacza (scenka). Migracja tnie na `en` i `koniec`.
function oczekiwaneCisze(tryb, para) {
  const { cue, wzor } = planujPare(tryb, para);
  const zCue = cue.filter((s) => s.rodzaj === 'cisza');
  const out = zCue.map((s, i) => ({ sek: s.sek, rola: i === zCue.length - 1 ? 'en' : 'wewn' }));
  for (const s of wzor.filter((s) => s.rodzaj === 'cisza')) out.push({ sek: s.sek, rola: 'koniec' });
  return out;
}
```

Dopisz obie do `module.exports` na końcu pliku:

```js
module.exports = { parseChapter, silenceDuration, answerSilence, normalizeMode, planujPare, oczekiwaneCisze, getOpenAI, ttsToFile, makeSilence, concatFiles, assembleGroup, shouldSkip };
```

- [ ] **Krok 4: Uruchom test i potwierdź, że przechodzi**

```bash
node ~/.claude/skills/angielski-rozdzial/test-assemble-audio.js
```
Oczekiwane: wszystkie `✓`, kod wyjścia 0.

- [ ] **Krok 5: Commit**

Skill ma własne repo git.

```bash
cd ~/.claude/skills/angielski-rozdzial
git add assemble-audio.js test-assemble-audio.js
git commit -m "feat: planujPare — czysty plan segmentow i oczekiwanych ciszy"
cd ~/angielski
```

---

## Zadanie 2: Dopasowanie ciszy — czysta logika migracji

Sedno migracji. Nie liczymy wykrytych ciszy (to zawodzi w 10 z 18 grup, bo ffmpeg znajduje
pauzy wewnątrz zdań), tylko **dopasowujemy je do listy oczekiwanej**, odrzucając nadmiar.

**Pliki:**
- Utwórz: `tools/potnij.js`
- Test: `tools/potnij.test.mjs`

**Interfejsy:**
- Produkuje:
  - `dopasujCisze(oczekiwane, wykryte, dlugoscPliku) → { ok: true, dopasowane: [{sek, rola, start, end}] } | { ok: false, brak: {sek, rola}, indeks: number }`
  - `oczekiwane`: `[{ sek, rola }]` z `oczekiwaneCisze` (Zadanie 1)
  - `wykryte`: `[{ start: number, end: number|null }]` (`end: null` = cisza urwana na końcu pliku)
  - `punktyCiecia(dopasowane, dlugoscPliku) → [{ cueOd, cueDo, wzorOd, wzorDo }]`

- [ ] **Krok 1: Napisz test, który pada**

```js
// tools/potnij.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import { dopasujCisze, punktyCiecia } from './potnij.js';

test('dopasowuje czysty przypadek bez nadmiarowych ciszy', () => {
  const oczekiwane = [
    { sek: 3.6, rola: 'en' }, { sek: 1, rola: 'koniec' },
    { sek: 4.8, rola: 'en' }, { sek: 1, rola: 'koniec' },
  ];
  const wykryte = [
    { start: 4.0, end: 7.8 }, { start: 10.0, end: 11.3 },
    { start: 15.0, end: 20.1 }, { start: 23.0, end: 24.4 },
  ];
  const r = dopasujCisze(oczekiwane, wykryte, 25);
  assert.equal(r.ok, true);
  assert.equal(r.dopasowane.length, 4);
  assert.equal(r.dopasowane[0].rola, 'en');
  assert.equal(r.dopasowane[0].end, 7.8);
});

test('odrzuca pauzy wewnatrz zdania jako nadmiarowe', () => {
  const oczekiwane = [{ sek: 3.6, rola: 'en' }, { sek: 1, rola: 'koniec' }];
  // 0.7 s to pauza po myslniku w srodku zdania PL — nie pasuje do 3.6 ani do 1.0
  const wykryte = [
    { start: 2.0, end: 2.7 },
    { start: 4.0, end: 7.8 },
    { start: 10.0, end: 11.3 },
  ];
  const r = dopasujCisze(oczekiwane, wykryte, 12);
  assert.equal(r.ok, true);
  assert.equal(r.dopasowane[0].start, 4.0, 'cisza 0.7 s zostala pominieta');
});

test('zglasza brak, gdy dlugiej ciszy nie ma', () => {
  const oczekiwane = [{ sek: 8, rola: 'en' }, { sek: 1, rola: 'koniec' }];
  const wykryte = [{ start: 4.0, end: 5.2 }];
  const r = dopasujCisze(oczekiwane, wykryte, 10);
  assert.equal(r.ok, false);
  assert.equal(r.brak.sek, 8);
  assert.equal(r.indeks, 0);
});

test('domyka cisze urwana na koncu pliku', () => {
  const oczekiwane = [{ sek: 3.6, rola: 'en' }, { sek: 1, rola: 'koniec' }];
  const wykryte = [{ start: 4.0, end: 7.8 }, { start: 10.0, end: null }];
  const r = dopasujCisze(oczekiwane, wykryte, 11.5);
  assert.equal(r.ok, true);
  assert.equal(r.dopasowane[1].end, 11.5);
});

test('punktyCiecia dziela grupe na pary cue/wzor', () => {
  const dopasowane = [
    { sek: 3.6, rola: 'en', start: 4.0, end: 7.8 },
    { sek: 1, rola: 'koniec', start: 10.0, end: 11.3 },
    { sek: 4.8, rola: 'en', start: 15.0, end: 20.1 },
    { sek: 1, rola: 'koniec', start: 23.0, end: 24.4 },
  ];
  const pary = punktyCiecia(dopasowane, 25);
  assert.equal(pary.length, 2);
  assert.deepEqual(pary[0], { cueOd: 0, cueDo: 7.8, wzorOd: 7.8, wzorDo: 11.3 });
  assert.deepEqual(pary[1], { cueOd: 11.3, cueDo: 20.1, wzorOd: 20.1, wzorDo: 24.4 });
});

test('ostatnia para siega konca pliku', () => {
  const dopasowane = [
    { sek: 3.6, rola: 'en', start: 4.0, end: 7.8 },
    { sek: 1, rola: 'koniec', start: 10.0, end: 11.5 },
  ];
  const pary = punktyCiecia(dopasowane, 11.5);
  assert.equal(pary[0].wzorDo, 11.5);
});
```

- [ ] **Krok 2: Uruchom test i potwierdź, że pada**

```bash
node --test tools/potnij.test.mjs
```
Oczekiwane: `Cannot find module './potnij.js'`.

- [ ] **Krok 3: Napisz minimalną implementację**

```js
// tools/potnij.js — jednorazowa migracja sklejonych grupa-N.mp3 na pary.
// Cięcie ffmpegiem bez rekompresji, ZERO wywołań TTS. Punkty cięcia biorą się
// z dopasowania wykrytych ciszy do listy, którą wygenerował assemble-audio.js.
//
// Uruchom: node tools/potnij.js K/02-k2-kintsugi [--na-sucho]

// Oczekiwana cisza `v` pasuje do wykrytej, gdy ta jest nie krótsza niż v − TOLERANCJA.
// Cisza w pliku bywa DŁUŻSZA od zamówionej (nagranie TTS ma ciszę na krawędziach),
// nigdy istotnie krótsza — stąd próg jednostronny.
const TOLERANCJA = 0.2;

export function dopasujCisze(oczekiwane, wykryte, dlugoscPliku) {
  const dopasowane = [];
  let j = 0;
  for (let i = 0; i < oczekiwane.length; i++) {
    const o = oczekiwane[i];
    let trafiony = -1;
    for (let k = j; k < wykryte.length; k++) {
      const end = wykryte[k].end == null ? dlugoscPliku : wykryte[k].end;
      if (end - wykryte[k].start >= o.sek - TOLERANCJA) { trafiony = k; break; }
    }
    if (trafiony === -1) return { ok: false, brak: o, indeks: i };
    const w = wykryte[trafiony];
    dopasowane.push({ ...o, start: w.start, end: w.end == null ? dlugoscPliku : w.end });
    j = trafiony + 1;
  }
  return { ok: true, dopasowane };
}

// Z dopasowanych ciszy robi granice plików: wyzwalacz kończy się na końcu ciszy
// o roli „en", wzorzec — na końcu ciszy o roli „koniec".
export function punktyCiecia(dopasowane, dlugoscPliku) {
  const pary = [];
  let od = 0;
  let cueDo = null;
  for (const c of dopasowane) {
    if (c.rola === 'en') { cueDo = c.end; continue; }
    if (c.rola !== 'koniec') continue;
    pary.push({ cueOd: od, cueDo, wzorOd: cueDo, wzorDo: c.end });
    od = c.end;
  }
  if (pary.length) pary[pary.length - 1].wzorDo = dlugoscPliku;
  return pary;
}
```

- [ ] **Krok 4: Uruchom testy i potwierdź, że przechodzą**

```bash
node --test tools/potnij.test.mjs
```
Oczekiwane: 6 przechodzących.

- [ ] **Krok 5: Commit**

```bash
git add tools/potnij.js tools/potnij.test.mjs
git commit -m "feat: dopasowanie ciszy i punkty ciecia dla migracji audio"
```

---

## Zadanie 3: `tools/potnij.js` — CLI, cięcie, `audio.json`

Dokłada do czystej logiki obsługę ffmpega, zapis plików i regułę „cały dział albo nic".

**Pliki:**
- Modyfikuj: `tools/potnij.js`
- Test: `tools/potnij.test.mjs`

**Interfejsy:**
- Konsumuje: `dopasujCisze`, `punktyCiecia` (Zadanie 2); `parseChapter`, `normalizeMode`,
  `oczekiwaneCisze` z `assemble-audio.js`
- Produkuje:
  - `zaplanujDzial(katalogAbs) → { ok: true, grupy: [...] } | { ok: false, powod: string }`
  - `wykryjCisze(mp3) → [{start, end}]`, `dlugosc(mp3) → number`
  - plik `audio.json` w kształcie ze specki (`wersja: 2`)

- [ ] **Krok 1: Napisz test integracyjny, który pada**

Dopisz do `tools/potnij.test.mjs`:

```js
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zaplanujDzial } from './potnij.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('planuje caly dzial K2 na prawdziwych plikach', () => {
  const r = zaplanujDzial(path.join(ROOT, 'K', '02-k2-kintsugi'));
  assert.equal(r.ok, true, r.powod);
  assert.equal(r.grupy.length, 5);
  assert.equal(r.grupy[0].tryb, 'pl2en');
  assert.equal(r.grupy[0].pary.length, 13);
  assert.equal(r.grupy[4].tryb, 'scenka');
  assert.equal(r.grupy[4].pary.length, 10);
  // pierwszy wyzwalacz zaczyna sie od zera, wzorzec zaraz po nim
  assert.equal(r.grupy[0].pary[0].cueOd, 0);
  assert.equal(r.grupy[0].pary[0].wzorOd, r.grupy[0].pary[0].cueDo);
  // teksty ida z rozdzial.md, nie z audio
  assert.ok(r.grupy[0].pary[0].tekst.pl.length > 0);
  assert.ok(r.grupy[0].pary[0].tekst.en.length > 0);
  assert.equal(r.grupy[0].pary[0].tekst.pyt, null);
  // scenka: pytanie EN w `pyt`, podpowiedz w `pl`
  assert.ok(r.grupy[4].pary[0].tekst.pyt.length > 0);
});

test('planuje caly dzial K1 i K3', () => {
  for (const dir of ['01-k1-powiedz-to-raz', '03-k3-jednym-zdaniem']) {
    const r = zaplanujDzial(path.join(ROOT, 'K', dir));
    assert.equal(r.ok, true, `${dir}: ${r.powod}`);
  }
});
```

- [ ] **Krok 2: Uruchom test i potwierdź, że pada**

```bash
node --test tools/potnij.test.mjs
```
Oczekiwane: `zaplanujDzial is not a function`.

- [ ] **Krok 3: Dopisz implementację do `tools/potnij.js`**

```js
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const SKILL = path.join(process.env.HOME, '.claude', 'skills', 'angielski-rozdzial', 'assemble-audio.js');
const { parseChapter, normalizeMode, oczekiwaneCisze } = require(SKILL);

export function dlugosc(mp3) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=nw=1:nk=1', mp3], { encoding: 'utf8' });
  return Number(r.stdout.trim());
}

export function wykryjCisze(mp3) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', mp3,
    '-af', 'silencedetect=noise=-45dB:d=0.5', '-f', 'null', '-'], { encoding: 'utf8' });
  const out = [];
  let start = null;
  for (const m of (r.stderr || '').matchAll(/silence_(start|end):\s*([-\d.]+)/g)) {
    if (m[1] === 'start') start = Number(m[2]);
    else if (start != null) { out.push({ start, end: Number(m[2]) }); start = null; }
  }
  if (start != null) out.push({ start, end: null }); // urwana na końcu pliku
  return out;
}

// Teksty na ekran: jeden kształt dla wszystkich trybów (patrz specka).
function tekstPary(tryb, para) {
  if (tryb === 'scenka') return { pyt: para.q, pl: para.prompt || null, en: para.a };
  if (tryb === 'en-only') return { pyt: para.pl, pl: null, en: para.en };
  return { pyt: null, pl: para.pl, en: para.en };
}

// Kontrola sensu: wzorzec to jedno zdanie EN plus przerwa — jego długość musi
// odpowiadać liczbie słów. Łapie rozjazd, którego dopasowanie samo nie wykryje.
function wzorzecSensowny(sekundy, tekstEn, przerwa) {
  const slowa = tekstEn.trim().split(/\s+/).filter(Boolean).length;
  const mowa = sekundy - przerwa;
  return mowa >= slowa * 0.25 && mowa <= slowa * 0.9 + 2;
}

export function zaplanujDzial(katalogAbs) {
  const md = fs.readFileSync(path.join(katalogAbs, 'rozdzial.md'), 'utf8');
  const grupyMd = parseChapter(md);
  if (!grupyMd.length) return { ok: false, powod: 'brak grup w rozdzial.md' };

  const grupy = [];
  for (const g of grupyMd) {
    const tryb = normalizeMode(g.mode);
    const mp3 = path.join(katalogAbs, `grupa-${g.n}.mp3`);
    if (!fs.existsSync(mp3)) return { ok: false, powod: `grupa ${g.n}: brak ${mp3}` };
    // Słuchanki nie migrujemy — offsety zdań wymagałyby osobnego dopasowania, a w
    // Kursie K nie ma ani jednej. Gdy się pojawi, dopisz obsługę zamiast zgadywać.
    if (tryb === 'sluchanka') return { ok: false, powod: `grupa ${g.n}: słuchanka — migracja nieobsługiwana` };

    const dl = dlugosc(mp3);
    const oczekiwane = g.pairs.flatMap((p) => oczekiwaneCisze(tryb, p));
    const dop = dopasujCisze(oczekiwane, wykryjCisze(mp3), dl);
    if (!dop.ok) {
      return { ok: false, powod: `grupa ${g.n}: nie dopasowano ciszy ${dop.brak.sek}s (${dop.brak.rola}), pozycja ${dop.indeks}` };
    }
    const pary = punktyCiecia(dop.dopasowane, dl);
    if (pary.length !== g.pairs.length) {
      return { ok: false, powod: `grupa ${g.n}: ${pary.length} wycinków przy ${g.pairs.length} wierszach` };
    }
    const przerwa = tryb === 'en-only' ? 1.2 : 1;
    pary.forEach((p, i) => {
      p.n = i + 1;
      p.tekst = tekstPary(tryb, g.pairs[i]);
    });
    for (const p of pary) {
      if (!wzorzecSensowny(p.wzorDo - p.wzorOd, p.tekst.en, przerwa)) {
        return { ok: false, powod: `grupa ${g.n}, para ${p.n}: wzorzec ${(p.wzorDo - p.wzorOd).toFixed(1)}s nie pasuje do „${p.tekst.en}"` };
      }
    }
    grupy.push({ n: g.n, tryb, pary });
  }
  return { ok: true, grupy };
}
```

- [ ] **Krok 4: Uruchom testy i potwierdź, że przechodzą**

```bash
node --test tools/potnij.test.mjs
```
Oczekiwane: 8 przechodzących. Jeśli któryś dział zgłasza `nie dopasowano ciszy` —
**nie luzuj tolerancji**; zgłoś to Krzyśkowi, bo to znaczy, że plik nie pochodzi
z obecnego generatora.

- [ ] **Krok 5: Dopisz cięcie i zapis (jeszcze bez kasowania)**

Dołóż do `tools/potnij.js`:

```js
function tnij(mp3, od, doSek, out) {
  const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error',
    '-ss', String(od), '-to', String(doSek), '-i', mp3, '-c', 'copy', out]);
  if (r.status !== 0) throw new Error(`ffmpeg padł przy ${out}`);
}

// Wykonuje plan: tnie do katalogu tymczasowego, a dopiero po komplecie przenosi
// na miejsce. Dzięki temu dział nigdy nie zostaje w stanie pół-migrowanym.
export function wykonaj(katalogAbs, plan) {
  const tmp = fs.mkdtempSync(path.join(katalogAbs, '.potnij-'));
  const manifest = { wersja: 2, generatedAt: new Date().toISOString(), grupy: [] };
  try {
    for (const g of plan.grupy) {
      if (g.tryb === 'sluchanka') { manifest.grupy.push(g); continue; }
      const mp3 = path.join(katalogAbs, `grupa-${g.n}.mp3`);
      const pary = [];
      for (const p of g.pary) {
        const nr = String(p.n).padStart(2, '0');
        const cue = `g${g.n}-p${nr}-cue.mp3`, wzor = `g${g.n}-p${nr}-en.mp3`;
        tnij(mp3, p.cueOd, p.cueDo, path.join(tmp, cue));
        tnij(mp3, p.wzorOd, p.wzorDo, path.join(tmp, wzor));
        pary.push({
          n: p.n,
          cue: { src: `audio/${cue}`, sek: Number((p.cueDo - p.cueOd).toFixed(3)) },
          wzor: { src: `audio/${wzor}`, sek: Number((p.wzorDo - p.wzorOd).toFixed(3)) },
          tekst: p.tekst,
        });
      }
      manifest.grupy.push({ n: g.n, tryb: g.tryb, pary });
    }
    const audioDir = path.join(katalogAbs, 'audio');
    fs.rmSync(audioDir, { recursive: true, force: true });
    fs.renameSync(tmp, audioDir);
    fs.writeFileSync(path.join(katalogAbs, 'audio.json'), JSON.stringify(manifest, null, 2) + '\n');
    for (const g of plan.grupy) {
      if (g.tryb === 'sluchanka') continue;
      fs.rmSync(path.join(katalogAbs, `grupa-${g.n}.mp3`), { force: true });
    }
    return manifest;
  } catch (e) {
    fs.rmSync(tmp, { recursive: true, force: true });
    throw e;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dzial = process.argv[2];
  if (!dzial) { console.error('użycie: node tools/potnij.js <katalog działu> [--na-sucho]'); process.exit(1); }
  const abs = path.resolve(dzial);
  const plan = zaplanujDzial(abs);
  if (!plan.ok) { console.error('NIE TNĘ —', plan.powod); process.exit(1); }
  for (const g of plan.grupy) {
    console.log(`  grupa-${g.n} [${g.tryb}] → ${g.tryb === 'sluchanka' ? 'zostaje jednym plikiem' : g.pary.length + ' par'}`);
  }
  if (process.argv.includes('--na-sucho')) { console.log('[NA SUCHO] nic nie zapisano.'); process.exit(0); }
  const m = wykonaj(abs, plan);
  const par = m.grupy.reduce((s, g) => s + (g.pary ? g.pary.length : 0), 0);
  console.log(`Gotowe: ${m.grupy.length} grup, ${par} par, ${par * 2} plików.`);
}
```

- [ ] **Krok 6: Sprawdź na sucho, że wszystkie trzy działy przechodzą**

```bash
for d in K/01-k1-powiedz-to-raz K/02-k2-kintsugi K/03-k3-jednym-zdaniem; do
  echo "== $d"; node tools/potnij.js "$d" --na-sucho || echo "PADŁO: $d";
done
```
Oczekiwane: trzy działy, 18 grup, żadnego „PADŁO".

- [ ] **Krok 7: Commit**

```bash
git add tools/potnij.js tools/potnij.test.mjs
git commit -m "feat: potnij.js — CLI migracji audio na pary (calosc albo nic)"
```

---

## Zadanie 4: Format 2 w manifestach

**Pliki:**
- Modyfikuj: `tools/generate-k.js`, `tools/generate.js`
- Test: `tools/generate-k.test.mjs`

**Interfejsy:**
- Konsumuje: `audio.json` (Zadanie 3)
- Produkuje: w manifeście dla działu formatu 2 pola `format: 2`, `audioManifest`,
  `audioVersion`, `groups[].parCount`; brak `groups[].src`

- [ ] **Krok 1: Napisz test, który pada**

Dopisz do `tools/generate-k.test.mjs`:

```js
test('buildKManifest rozpoznaje dzial w formacie 2', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kurs-k-f2-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  write(root, 'K/slownik-k.json', JSON.stringify({
    kurs: { id: 'k', tytul: 'Kurs K', opis: 'Osobny kurs' },
    dzialy: [{ id: 'k1', folder: '01-k1-jeden', opis: 'Pierwszy dział' }],
    wyrazenia: [],
  }));
  write(root, 'K/01-k1-jeden/rozdzial.md', '# K1 · Jeden / K1 · One\n');
  write(root, 'K/01-k1-jeden/audio/g1-p01-cue.mp3', 'cue');
  write(root, 'K/01-k1-jeden/audio/g1-p01-en.mp3', 'en');
  write(root, 'K/01-k1-jeden/audio.json', JSON.stringify({
    wersja: 2,
    grupy: [{ n: 1, tryb: 'pl2en', pary: [{
      n: 1,
      cue: { src: 'audio/g1-p01-cue.mp3', sek: 5 },
      wzor: { src: 'audio/g1-p01-en.mp3', sek: 2 },
      tekst: { pyt: null, pl: 'Test.', en: 'Test.' },
    }] }],
  }));

  const ch = buildKManifest(root).chapters[0];
  assert.equal(ch.format, 2);
  assert.equal(ch.audioManifest, 'K/01-k1-jeden/audio.json');
  assert.ok(ch.audioVersion > 0);
  assert.equal(ch.hasAudio, true);
  assert.equal(ch.groups.length, 1);
  assert.equal(ch.groups[0].parCount, 1);
  assert.equal(ch.groups[0].src, undefined, 'format 2 nie ma src na poziomie grupy');
});
```

- [ ] **Krok 2: Uruchom test i potwierdź, że pada**

```bash
node --test tools/generate-k.test.mjs
```
Oczekiwane: `expected undefined to equal 2` przy `ch.format`.

- [ ] **Krok 3: Dodaj wykrywanie formatu 2**

W `tools/generate-k.js` dodaj przed funkcją budującą rozdział:

```js
// Dział w formacie 2 opisuje swoje audio w audio.json — nie skanujemy grupa-N.mp3.
// audioVersion to najświeższy mtime audio; odtwarzacz dokleja go jako ?v= do
// każdej ścieżki z manifestu (cache-busting bez puchnięcia content.json).
function czytajFormat2(chapterPath, relativeChapterPath) {
  const manifestPath = path.join(chapterPath, 'audio.json');
  if (!fs.existsSync(manifestPath)) return null;
  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch { return null; }
  if (manifest.wersja !== 2 || !Array.isArray(manifest.grupy)) return null;

  let version = 0;
  const dotknij = (p) => { try { version = Math.max(version, fs.statSync(p).mtimeMs); } catch {} };
  dotknij(manifestPath);
  const audioDir = path.join(chapterPath, 'audio');
  if (fs.existsSync(audioDir)) for (const f of fs.readdirSync(audioDir)) dotknij(path.join(audioDir, f));
  for (const g of manifest.grupy) if (g.src) dotknij(path.join(chapterPath, g.src));

  return {
    format: 2,
    audioManifest: `${relativeChapterPath}/audio.json`,
    audioVersion: Math.round(version),
    hasAudio: manifest.grupy.length > 0,
    groups: manifest.grupy.map((g) => ({
      n: g.n,
      label: `Grupa ${g.n}`,
      parCount: g.pary ? g.pary.length : (g.zdania ? g.zdania.length : 0),
    })),
  };
}
```

W `buildKManifest` obiekt rozdziału powstaje jako `return { … }` wewnątrz `.map()`
(linie 67–78). Zamień w nim dwa ostatnie pola:

```js
    const groups = findGroups(chapterPath, relativeChapterPath);
    const format2 = czytajFormat2(chapterPath, relativeChapterPath);

    return {
      id: chapterMetadata.id || `k${localNumber}`,
      slug: relativeChapterPath,
      localNumber,
      ...titles,
      description: chapterMetadata.opis || '',
      pdf: fs.existsSync(path.join(chapterPath, 'rozdzial.pdf'))
        ? `${relativeChapterPath}/rozdzial.pdf`
        : null,
      ...(format2 || { hasAudio: groups.length > 0, groups }),
    };
```

- [ ] **Krok 4: Zrób to samo w `tools/generate.js`**

Skopiuj `czytajFormat2` do `tools/generate.js` bez zmian. W `build()` rozdział powstaje
jako `return { id, slug: id, number, … }` (linia 122). Zamień końcówkę:

```js
    const groups = findGroups(chapterPath, id);
    const { minikurs, localNumber } = parseMinikurs(id, number);
    const format2 = czytajFormat2(chapterPath, id);

    return { id, slug: id, number, minikurs, localNumber, title, titlePl, titleEn, pdf,
      ...(format2 || { hasAudio: groups.length > 0, groups }) };
```

Zliczanie audio na kafelkach minikursów (`e.audioCount += c.groups.length`) działa dalej —
dla formatu 2 liczy grupy, nie pliki, co jest poprawne.

- [ ] **Krok 5: Uruchom testy i potwierdź, że przechodzą**

```bash
node --test tools/generate-k.test.mjs tools/k-site.test.mjs
node tools/build-all.js
```
Oczekiwane: testy zielone; build wypisuje 3 działy K i 39 M jak dotąd (nic jeszcze nie
zmigrowaliśmy, więc wszystko idzie starą ścieżką).

- [ ] **Krok 6: Commit**

```bash
git add tools/generate-k.js tools/generate.js tools/generate-k.test.mjs content.json k-content.json
git commit -m "feat: manifesty rozpoznaja dzial w formacie 2 (audio.json)"
```

---

## Zadanie 5: `pary.js` — kolejka i pętle

**Pliki:**
- Utwórz: `pary.js` (korzeń projektu)
- Test: `tools/pary.test.mjs`

**Interfejsy:**
- Produkuje:
  - `budujKolejke(grupa, wersja) → [{ src, rola: 'cue'|'wzor'|'sluchanka', para: number, tekst?, zdania? }]`
  - `nastepny(pozycja, dlugoscKolejki, tryb) → number|null` (`null` = koniec grupy)
  - `poprzedniaPara(pozycja) → number`, `nastepnaPara(pozycja, dlugoscKolejki) → number`
  - `opisBlokady(element, ctx) → { title, artist }`, gdzie `ctx = { grupa, ilePar }`
  - `zdanieDla(zdania, czas) → number`
  - `TRYBY_PETLI = ['off', 'para', 'grupa', 'caly']`, `nastepnyTryb(tryb, maPary) → string`

- [ ] **Krok 1: Napisz test, który pada**

```js
// tools/pary.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import { budujKolejke, nastepny, poprzedniaPara, nastepnaPara, opisBlokady, nastepnyTryb } from '../pary.js';

const GRUPA = {
  n: 3, tryb: 'pl2en',
  pary: [
    { n: 1, cue: { src: 'audio/g3-p01-cue.mp3', sek: 9 }, wzor: { src: 'audio/g3-p01-en.mp3', sek: 4 },
      tekst: { pyt: null, pl: 'Wyleciało mi słowo.', en: "I'm blanking on the word." } },
    { n: 2, cue: { src: 'audio/g3-p02-cue.mp3', sek: 8 }, wzor: { src: 'audio/g3-p02-en.mp3', sek: 3 },
      tekst: { pyt: null, pl: 'Daj mi sekundę.', en: 'Give me a sec.' } },
  ],
};

test('kolejka przeplata wyzwalacz z wzorcem i doklei wersje', () => {
  const q = budujKolejke(GRUPA, 1785822079612);
  assert.equal(q.length, 4);
  assert.equal(q[0].rola, 'cue');
  assert.equal(q[1].rola, 'wzor');
  assert.equal(q[0].para, 1);
  assert.equal(q[2].para, 2);
  assert.equal(q[0].src, 'audio/g3-p01-cue.mp3?v=1785822079612');
});

test('tryb off zatrzymuje sie po ostatnim elemencie', () => {
  assert.equal(nastepny(0, 4, 'off'), 1);
  assert.equal(nastepny(3, 4, 'off'), null);
});

test('tryb para wraca z wzorca na ten sam wyzwalacz', () => {
  assert.equal(nastepny(0, 4, 'para'), 1);
  assert.equal(nastepny(1, 4, 'para'), 0);
  assert.equal(nastepny(3, 4, 'para'), 2);
});

test('tryb grupa zawija na poczatek grupy', () => {
  assert.equal(nastepny(3, 4, 'grupa'), 0);
  assert.equal(nastepny(1, 4, 'grupa'), 2);
});

test('tryb caly sygnalizuje wyjscie poza grupe', () => {
  assert.equal(nastepny(3, 4, 'caly'), null);
  assert.equal(nastepny(1, 4, 'caly'), 2);
});

test('skok po parach zawsze lezy na wyzwalaczu', () => {
  assert.equal(nastepnaPara(0, 4), 2);
  assert.equal(nastepnaPara(1, 4), 2);
  assert.equal(nastepnaPara(3, 4), 0, 'z ostatniej pary wracamy na pierwsza');
  assert.equal(poprzedniaPara(2), 0);
  assert.equal(poprzedniaPara(3), 0, 'z wzorca wracamy na wyzwalacz tej samej pary');
  assert.equal(poprzedniaPara(0), 0);
});

test('opis na ekran blokady zmienia sie z wyzwalacza na wzorzec', () => {
  const q = budujKolejke(GRUPA, 1);
  const ctx = { grupa: 3, ilePar: 2 };
  assert.deepEqual(opisBlokady(q[0], ctx), {
    title: 'Wyleciało mi słowo.', artist: 'Grupa 3 · para 1/2',
  });
  assert.deepEqual(opisBlokady(q[1], ctx), {
    title: "I'm blanking on the word.", artist: 'Wyleciało mi słowo.',
  });
});

test('scenka pokazuje pytanie EN jako wyzwalacz', () => {
  const grupa = { n: 5, tryb: 'scenka', pary: [{ n: 1,
    cue: { src: 'a.mp3', sek: 12 }, wzor: { src: 'b.mp3', sek: 4 },
    tekst: { pyt: 'How are you?', pl: 'Powiedz, że dobrze.', en: 'Doing great.' } }] };
  const q = budujKolejke(grupa, 1);
  assert.equal(opisBlokady(q[0], { grupa: 5, ilePar: 1 }).title, 'How are you?');
  assert.equal(opisBlokady(q[1], { grupa: 5, ilePar: 1 }).title, 'Doing great.');
});

test('stan „para" wypada z cyklu, gdy dzial nie ma par', () => {
  assert.equal(nastepnyTryb('off', true), 'para');
  assert.equal(nastepnyTryb('para', true), 'grupa');
  assert.equal(nastepnyTryb('caly', true), 'off');
  assert.equal(nastepnyTryb('off', false), 'grupa');
  assert.equal(nastepnyTryb('caly', false), 'off');
});

test('sluchanka to jeden element kolejki, fraza z offsetow', () => {
  const grupa = { n: 1, tryb: 'sluchanka', src: 'grupa-1.mp3', zdania: [
    { pl: 'No i to jest to.', en: 'This is it.', t: [0, 4.2] },
    { pl: 'Ciągle myślę…', en: 'I keep thinking…', t: [4.2, 9.6] },
  ] };
  const q = budujKolejke(grupa, 77);
  assert.equal(q.length, 1);
  assert.equal(q[0].rola, 'sluchanka');
  assert.equal(q[0].src, 'grupa-1.mp3?v=77');
  assert.equal(zdanieDla(grupa.zdania, 0), 0);
  assert.equal(zdanieDla(grupa.zdania, 4.3), 1);
  assert.equal(zdanieDla(grupa.zdania, 99), 1, 'poza koncem trzymamy sie ostatniego zdania');
});
```

Dopisz `zdanieDla` do importu na górze pliku testowego.

- [ ] **Krok 2: Uruchom test i potwierdź, że pada**

```bash
node --test tools/pary.test.mjs
```
Oczekiwane: `Cannot find module '../pary.js'`.

- [ ] **Krok 3: Napisz implementację**

```js
// pary.js — wspólna logika odtwarzania par dla obu odtwarzaczy (app.js i k-app.js).
// Czyste funkcje: żadnego DOM-u, żadnego <audio>, żadnego fetcha. Dzięki temu
// testuje się to w node, a oba odtwarzacze nie rozjeżdżają się przy poprawkach.

export const TRYBY_PETLI = ['off', 'para', 'grupa', 'caly'];

// Kolejka to płaska lista: wyzwalacz, wzorzec, wyzwalacz, wzorzec…
// Wyzwalacze leżą na parzystych pozycjach — na tym opiera się skok po parach.
// Słuchanka nie ma par (ciągła narracja bez ciszy na produkcję) — zostaje jednym
// plikiem, a fraza na ekranie przełącza się z offsetów przy `timeupdate`.
export function budujKolejke(grupa, wersja) {
  const v = wersja ? `?v=${wersja}` : '';
  if (grupa.tryb === 'sluchanka') {
    return [{ src: grupa.src + v, rola: 'sluchanka', para: 1, zdania: grupa.zdania || [] }];
  }
  const out = [];
  for (const p of grupa.pary || []) {
    out.push({ src: p.cue.src + v, rola: 'cue', para: p.n, tekst: p.tekst });
    out.push({ src: p.wzor.src + v, rola: 'wzor', para: p.n, tekst: p.tekst });
  }
  return out;
}

// Które zdanie słuchanki leci w danej sekundzie. Ostatnie trzymamy do końca pliku.
export function zdanieDla(zdania, czas) {
  let i = 0;
  for (let k = 0; k < zdania.length; k++) if (czas >= zdania[k].t[0]) i = k;
  return i;
}

// Co zagrać po zakończeniu elementu na pozycji `poz`. null = koniec grupy
// (odtwarzacz sam decyduje: stop przy „off"/„para"/„grupa", następna grupa przy „caly").
export function nastepny(poz, dlugosc, tryb) {
  if (tryb === 'para') {
    const cel = poz % 2 === 0 ? poz + 1 : poz - 1;
    return cel < dlugosc ? cel : 0; // kolejka jednoelementowa (słuchanka) — zapętl ją
  }
  if (poz < dlugosc - 1) return poz + 1;
  if (tryb === 'grupa') return 0;
  return null;
}

export function nastepnaPara(poz, dlugosc) {
  const start = Math.floor(poz / 2) * 2 + 2;
  return start >= dlugosc ? 0 : start;
}

// Z wzorca wracamy na wyzwalacz tej samej pary; z wyzwalacza — na poprzednią parę.
export function poprzedniaPara(poz) {
  if (poz % 2 === 1) return poz - 1;
  return Math.max(0, poz - 2);
}

export function opisBlokady(element, ctx) {
  const t = element.tekst || {};
  const wyzwalacz = t.pyt || t.pl || '';
  if (element.rola === 'wzor') return { title: t.en || '', artist: wyzwalacz };
  return { title: wyzwalacz, artist: `Grupa ${ctx.grupa} · para ${element.para}/${ctx.ilePar}` };
}

export function nastepnyTryb(tryb, maPary) {
  const cykl = maPary ? TRYBY_PETLI : TRYBY_PETLI.filter((t) => t !== 'para');
  return cykl[(cykl.indexOf(tryb) + 1) % cykl.length];
}
```

- [ ] **Krok 4: Uruchom testy i potwierdź, że przechodzą**

```bash
node --test tools/pary.test.mjs
```
Oczekiwane: 10 przechodzących.

- [ ] **Krok 5: Commit**

```bash
git add pary.js tools/pary.test.mjs
git commit -m "feat: pary.js — wspolna kolejka par i przejscia petli"
```

---

## Zadanie 6: `k-app.js` — karta z frazą i sterowanie po parach

**Pliki:**
- Modyfikuj: `k-app.js`, `k.html` (linie 27–53, sekcja `.player`), `k-style.css`
- Test: `tools/k-site.test.mjs`

**Interfejsy:**
- Konsumuje: `pary.js` (Zadanie 5), `k-content.json` z `format`/`audioManifest`/`audioVersion` (Zadanie 4)
- Produkuje: zachowanie odtwarzacza; `k-app.js` nadal eksportuje `fmt`, `cycleRepeat`,
  `nextIndex`, `cleanTitle` (istniejące testy na nich stoją — nie usuwaj ich)

- [ ] **Krok 1: Napisz test, który pada**

Dopisz do `tools/k-site.test.mjs`:

```js
test('K uzywa wspolnego modulu par i karty z fraza', () => {
  const app = fs.readFileSync(new URL('../k-app.js', import.meta.url), 'utf8');
  assert.match(app, /from '\.\/pary\.js'/);
  assert.match(app, /audioManifest/);
  assert.match(app, /budujKolejke/);
  assert.match(app, /nastepnyTryb/);

  const html = fs.readFileSync(new URL('../k.html', import.meta.url), 'utf8');
  assert.match(html, /id="p-wyzwalacz"/);
  assert.match(html, /id="p-wzorzec"/);
  assert.match(html, /id="p-para"/);
  assert.equal((html.match(/<audio\b/g) || []).length, 1, 'nadal jeden element audio');
});

test('wzorzec jest ukryty, dopoki nie leci', () => {
  const css = fs.readFileSync(new URL('../k-style.css', import.meta.url), 'utf8');
  assert.match(css, /\.player\s+#p-wzorzec\s*\{[^}]*visibility:\s*hidden/);
  assert.match(css, /\.player\.wzorzec\s+#p-wzorzec\s*\{[^}]*visibility:\s*visible/);
});
```

- [ ] **Krok 2: Uruchom test i potwierdź, że pada**

```bash
node --test tools/k-site.test.mjs
```
Oczekiwane: brak `id="p-wyzwalacz"` w `k.html`.

- [ ] **Krok 3: Przebuduj kartę w `k.html`**

Zamień blok `<div class="player-meta">…</div>` (linie 29–39) na:

```html
      <div class="player-meta">
        <span class="now-mark" aria-hidden="true"></span>
        <div class="now-copy">
          <strong id="p-chapter">—</strong>
          <span id="p-para"></span>
        </div>
        <button class="repeat" id="p-repeat" type="button" aria-label="Tryb pętli: jedna. Zmień tryb">
          <span aria-hidden="true">↻</span>
          <span id="p-repeat-label">jedna</span>
        </button>
      </div>

      <div class="fraza" aria-live="polite">
        <p class="fraza-wyzwalacz" id="p-wyzwalacz"></p>
        <p class="fraza-wzorzec" id="p-wzorzec"></p>
      </div>
```

Zostaw `<strong id="p-group">` usunięty — jego rolę przejmuje `#p-chapter` (`K3 · Grupa 3`)
i `#p-para` (`7/16`).

- [ ] **Krok 4: Dodaj style w `k-style.css`**

```css
/* Karta z aktualną frazą. Wzorzec zajmuje miejsce od początku (visibility,
   nie display), żeby karta nie podskakiwała w momencie odsłonięcia. */
.player .fraza { padding: 2px 4px 10px; }
.player .fraza p { margin: 0; }
.player #p-wyzwalacz { font-size: 17px; line-height: 1.35; color: var(--muted, #9aa4b2); }
.player #p-wzorzec { margin-top: 8px; font-size: 19px; line-height: 1.35; font-weight: 650; visibility: hidden; }
.player.wzorzec #p-wzorzec { visibility: visible; }
.player #p-para { font-variant-numeric: tabular-nums; }
```

- [ ] **Krok 5: Przepisz warstwę odtwarzania w `k-app.js`**

Cały kod niżej wchodzi **wewnątrz `initSite()`** (linie 32–357), gdzie istnieją już
`audio`, `player`, `byId`, `setText`, `state`, `persist`, `move`, `renderPlayer`,
`updateActiveGroup`, `repeatLabels`. Nazwy trzymaj dokładnie takie jak tu.

**5a.** Import na górze pliku, pod istniejącymi eksportami (linia ~19):

```js
import { budujKolejke, nastepny, nastepnaPara, poprzedniaPara, opisBlokady, nastepnyTryb, zdanieDla } from './pary.js';
```

**5b.** Rozszerz etykiety pętli (linia 38) — format 1 ma trzy stany, format 2 cztery:

```js
  const repeatLabels = {
    off: 'wył.', one: 'jedna', all: 'całość',      // format 1 (stare działy)
    para: 'para', grupa: 'grupa', caly: 'całość',  // format 2
  };
  // Wchodząc w dział formatu 2 przekładamy zapamiętany tryb na nowe nazwy.
  const TRYB_Z_FORMATU1 = { one: 'grupa', all: 'caly' };
```

**5c.** Dodaj stan par tuż po deklaracji `state` (linia 49):

```js
  state.kolejka = [];        // płaska lista elementów bieżącej grupy (pusta = format 1)
  state.poz = 0;             // pozycja w kolejce
  let manifest = null;       // audio.json bieżącego działu
  let manifestDla = null;    // id działu, dla którego manifest jest aktualny

  const grupaTeraz = () => (manifest ? manifest.grupy[state.index] : null);
  const maPary = () => state.kolejka.length > 0 && state.kolejka[0].rola !== 'sluchanka';

  async function wczytajManifest(chapter) {
    if (manifestDla === chapter.id) return manifest;
    const response = await fetch(`${chapter.audioManifest}?v=${chapter.audioVersion}`, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`audio.json ${response.status}`);
    manifest = await response.json();
    manifestDla = chapter.id;
    return manifest;
  }
```

**5d.** Wepnij format 2 w `loadAndPlay` (linia 127) — jedna linia na początku, reszta ciała bez zmian:

```js
  function loadAndPlay(chapter, index) {
    if (chapter.format === 2) return void grajPary(chapter, index, 0);
    const group = chapter.groups[index];
    // …istniejące ciało bez żadnej zmiany…
  }
```

**5e.** Dopisz obok niej trzy nowe funkcje:

```js
  async function grajPary(chapter, index, poz) {
    try {
      await wczytajManifest(chapter);
    } catch {
      setText('p-wyzwalacz', 'Nie udało się wczytać audio tego działu.');
      setText('p-wzorzec', '');
      return;
    }
    const grupa = manifest.grupy[index];
    if (!grupa) return;
    state.chapter = chapter;
    state.index = index;
    if (TRYB_Z_FORMATU1[state.repeat]) state.repeat = TRYB_Z_FORMATU1[state.repeat];
    state.kolejka = budujKolejke(grupa, chapter.audioVersion);
    state.poz = Math.min(poz, Math.max(0, state.kolejka.length - 1));
    wczytajPozycje();
    audio.play().catch(() => {});
    persist();
  }

  function wczytajPozycje() {
    const element = state.kolejka[state.poz];
    if (!element) return;
    audio.src = element.src;
    audio.loop = false;  // pętla „para" idzie przez przejścia, nie natywnie
    renderFraza(element);
    updateMediaSession();
    renderPlayer();
    updateActiveGroup();
  }

  // Wyzwalacz widać zawsze; wzorzec dopiero, gdy leci (klasa .wzorzec na .player).
  function renderFraza(element) {
    const grupa = grupaTeraz();
    if (element.rola === 'sluchanka') {
      const i = zdanieDla(element.zdania, audio.currentTime);
      const zdanie = element.zdania[i] || {};
      setText('p-wyzwalacz', zdanie.pl || '');
      setText('p-wzorzec', zdanie.en || '');
      player.classList.add('wzorzec');  // w słuchance angielski jest treścią, nie odpowiedzią
      setText('p-para', `${i + 1}/${element.zdania.length}`);
      return;
    }
    const tekst = element.tekst;
    setText('p-wyzwalacz', [tekst.pyt, tekst.pl].filter(Boolean).join(' — '));
    setText('p-wzorzec', tekst.en || '');
    player.classList.toggle('wzorzec', element.rola === 'wzor');
    setText('p-para', `${element.para}/${grupa.pary.length}`);
  }
```

**5f.** Rozszerz `updateMediaSession` (linia 57) o gałąź par — istniejące ciało zostaje jako `else`:

```js
  function updateMediaSession() {
    if (!('mediaSession' in navigator) || !state.chapter) return;
    const album = 'Kurs K · Conversation Lab';
    if (state.kolejka.length) {
      const element = state.kolejka[state.poz];
      const grupa = grupaTeraz();
      if (element.rola === 'sluchanka') {
        const zdanie = element.zdania[zdanieDla(element.zdania, audio.currentTime)] || {};
        navigator.mediaSession.metadata = new MediaMetadata({
          title: zdanie.en || '', artist: `Grupa ${grupa.n}`, album,
        });
        return;
      }
      const opis = opisBlokady(element, { grupa: grupa.n, ilePar: grupa.pary.length });
      navigator.mediaSession.metadata = new MediaMetadata({ title: opis.title, artist: opis.artist, album });
      return;
    }
    const group = state.chapter.groups[state.index];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: group.label, artist: cleanTitle(state.chapter.titlePl), album,
    });
  }
```

**5g.** Skok po parach — nowa funkcja obok `move` (linia 147):

```js
  function skok(offset) {
    if (!state.kolejka.length) return move(offset);           // format 1 — po grupach, jak dziś
    if (offset < 0 && audio.currentTime > 2) { audio.currentTime = 0; return; }
    state.poz = offset < 0 ? poprzedniaPara(state.poz) : nastepnaPara(state.poz, state.kolejka.length);
    wczytajPozycje();
    audio.play().catch(() => {});
    persist();
  }
```

**5h.** `setRepeat` (linia 159) — natywna pętla tylko w formacie 1:

```js
  function setRepeat(mode) {
    state.repeat = mode;
    localStorage.setItem('ang.k.repeat', mode);
    audio.loop = mode === 'one' && !state.kolejka.length;
    renderPlayer();
  }
```

**5i.** `persist` (linia 122) zapamiętuje pozycję w kolejce:

```js
  function persist() {
    if (!state.chapter) return;
    localStorage.setItem('ang.k.last', JSON.stringify({
      id: state.chapter.id, index: state.index, poz: state.poz,
    }));
  }
```

**5j.** `restoreLast` (linia 267) — gałąź formatu 2 na początku, reszta bez zmian:

```js
  function restoreLast() {
    try {
      const saved = JSON.parse(localStorage.getItem('ang.k.last'));
      const chapter = data.chapters.find((item) => item.id === saved?.id);
      if (!chapter) return;
      if (chapter.format === 2) {
        wczytajManifest(chapter).then(() => {
          const grupa = manifest.grupy[saved.index];
          if (!grupa) return;
          state.chapter = chapter;
          state.index = saved.index;
          state.kolejka = budujKolejke(grupa, chapter.audioVersion);
          state.poz = Math.min(saved.poz || 0, state.kolejka.length - 1);
          audio.src = state.kolejka[state.poz].src;  // tylko wczytaj — start wymaga dotknięcia
          audio.loop = false;
          renderFraza(state.kolejka[state.poz]);
          updateMediaSession();
          renderPlayer();
        }).catch(() => {});
        return;
      }
      if (!chapter.groups[saved.index]) return;
      // …istniejące ciało bez zmian…
    } catch {}
  }
```

**5k.** Podmień podpięcia w `wire()` (linie 292–334):

```js
      if (action.dataset.action === 'loop') {
        setRepeat(chapter.format === 2 ? 'grupa' : 'one');
        loadAndPlay(chapter, index);
      } else {
        selectGroup(chapter, index);
      }
```

```js
    byId('p-prev').addEventListener('click', () => skok(-1));
    byId('p-next').addEventListener('click', () => skok(1));
    byId('p-repeat').addEventListener('click', () => {
      setRepeat(state.kolejka.length ? nastepnyTryb(state.repeat, maPary()) : cycleRepeat(state.repeat));
    });
```

```js
    audio.addEventListener('ended', () => {
      if (state.kolejka.length) {
        const dalej = nastepny(state.poz, state.kolejka.length, state.repeat);
        if (dalej == null) {
          if (state.repeat === 'caly') {
            const ile = state.chapter.groups.length;
            return void grajPary(state.chapter, (state.index + 1) % ile, 0);
          }
          renderPlayer(); updateActiveGroup(); return;
        }
        state.poz = dalej;
        wczytajPozycje();
        audio.play().catch(() => {});
        return;
      }
      if (state.repeat === 'all') move(1);
      else { renderPlayer(); updateActiveGroup(); }
    });

    // Brakujący plik pary nie może zatrzymać całej grupy ani wpaść w pętlę na sobie.
    audio.addEventListener('error', () => {
      if (!state.kolejka.length) return;
      console.warn('Nie mogę wczytać', audio.src, '— przeskakuję dalej');
      const dalej = nastepny(state.poz, state.kolejka.length, state.repeat === 'para' ? 'off' : state.repeat);
      if (dalej == null) return;
      state.poz = dalej;
      wczytajPozycje();
      audio.play().catch(() => {});
    });

    audio.addEventListener('timeupdate', () => {
      updatePositionState();
      updateSeek();
      const element = state.kolejka[state.poz];
      if (element && element.rola === 'sluchanka') { renderFraza(element); updateMediaSession(); }
    });
```

(usuń stary `audio.addEventListener('timeupdate', …)` z linii 324 — zastępuje go powyższy)

```js
      set('previoustrack', () => skok(-1));
      set('nexttrack', () => skok(1));
```

- [ ] **Krok 6: Uruchom testy i potwierdź, że przechodzą**

```bash
node --test tools/k-site.test.mjs tools/pary.test.mjs
```
Oczekiwane: zielone, w tym stare testy `fmt`/`cycleRepeat`/`nextIndex`/`cleanTitle`.

- [ ] **Krok 7: Commit**

```bash
git add k-app.js k.html k-style.css tools/k-site.test.mjs
git commit -m "feat: odtwarzacz K — karta z fraza, ekran blokady, skok po parach"
```

---

## Zadanie 7: `app.js` — obsługa formatu 2 bez zmiany formatu 1

**Pliki:**
- Modyfikuj: `app.js`, `index.html` (linie 26–49), `style.css`
- Test: `tools/k-site.test.mjs` (ma już testy sięgające do `app.js`)

**Interfejsy:**
- Konsumuje: `pary.js` (Zadanie 5)
- Produkuje: brak nowych — `app.js` nie jest importowany przez testy

Kurs M nie ma dziś ani jednego działu w formacie 2, więc ta ścieżka jest przygotowaniem
pod M5. **Zachowanie działów formatu 1 musi zostać identyczne** — łącznie z `audio.loop`
dla trybu „jedna" (natywna pętla, jedyny w pełni pewny tryb przy zablokowanym ekranie).

- [ ] **Krok 1: Napisz test, który pada**

Dopisz do `tools/k-site.test.mjs`:

```js
test('M obsluguje oba formaty i nie traci natywnej petli', () => {
  const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
  assert.match(app, /from '\.\/pary\.js'/);
  assert.match(app, /format === 2/);
  assert.match(app, /audio\.loop = \(state\.repeat === 'one'\)/,
    'format 1 musi dalej zapetlac grupe natywnie');

  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="p-wyzwalacz"/);
  assert.match(html, /id="p-wzorzec"/);
});
```

- [ ] **Krok 2: Uruchom test i potwierdź, że pada**

```bash
node --test tools/k-site.test.mjs
```

- [ ] **Krok 3: Dołóż kartę do `index.html`**

W bloku `.player-top` (linie 28–37) po `<div class="player-info">…</div>` wstaw:

```html
      <div class="fraza" aria-live="polite">
        <p class="fraza-wyzwalacz" id="p-wyzwalacz"></p>
        <p class="fraza-wzorzec" id="p-wzorzec"></p>
      </div>
```

W `style.css` dodaj te same reguły co w Zadaniu 6, z selektorem `.player` (Kurs M używa
tej samej nazwy klasy).

- [ ] **Krok 4: Dołóż gałąź formatu 2 w `app.js`**

`app.js` nie ma opakowania `initSite()` — cały kod jest na poziomie modułu. Istniejące
nazwy, których użyjesz: `audio`, `playerEl`, `byId`, `setText`, `state`, `persist`,
`next`, `prev`, `renderPlayer`, `updateActiveUI`, `updateMediaSession`, `ART_SIZES`,
`REPEAT_LABEL`, `cleanTitle`.

**4a.** Import na górze pliku, pod stałymi:

```js
import { budujKolejke, nastepny, nastepnaPara, poprzedniaPara, opisBlokady, nastepnyTryb, zdanieDla } from './pary.js';
```

**4b.** Rozszerz `REPEAT_LABEL` (linia 16) i dodaj mapowanie starych trybów:

```js
const REPEAT_LABEL = {
  off: 'wył', one: 'jedna', all: 'cały',
  para: 'para', grupa: 'grupa', caly: 'cały',
};
const TRYB_Z_FORMATU1 = { one: 'grupa', all: 'caly' };
```

**4c.** Stan par obok `state` (linia 47):

```js
state.kolejka = [];
state.poz = 0;
let manifest = null;
let manifestDla = null;
const grupaTeraz = () => (manifest ? manifest.grupy[state.index] : null);
const maPary = () => state.kolejka.length > 0 && state.kolejka[0].rola !== 'sluchanka';

async function wczytajManifest(chapter) {
  if (manifestDla === chapter.id) return manifest;
  const response = await fetch(`${chapter.audioManifest}?v=${chapter.audioVersion}`, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`audio.json ${response.status}`);
  manifest = await response.json();
  manifestDla = chapter.id;
  return manifest;
}

async function grajPary(chapter, index, poz) {
  try {
    await wczytajManifest(chapter);
  } catch {
    setText('p-wyzwalacz', 'Nie udało się wczytać audio tego działu.');
    setText('p-wzorzec', '');
    return;
  }
  const grupa = manifest.grupy[index];
  if (!grupa) return;
  state.chapter = chapter;
  state.index = index;
  if (TRYB_Z_FORMATU1[state.repeat]) state.repeat = TRYB_Z_FORMATU1[state.repeat];
  state.kolejka = budujKolejke(grupa, chapter.audioVersion);
  state.poz = Math.min(poz, Math.max(0, state.kolejka.length - 1));
  wczytajPozycje();
  audio.play().catch(() => {});
  persist();
}

function wczytajPozycje() {
  const element = state.kolejka[state.poz];
  if (!element) return;
  audio.src = element.src;
  audio.loop = false;
  renderFraza(element);
  updateMediaSession();
  renderPlayer();
  updateActiveUI();
}

function renderFraza(element) {
  const grupa = grupaTeraz();
  if (element.rola === 'sluchanka') {
    const i = zdanieDla(element.zdania, audio.currentTime);
    const zdanie = element.zdania[i] || {};
    setText('p-wyzwalacz', zdanie.pl || '');
    setText('p-wzorzec', zdanie.en || '');
    playerEl.classList.add('wzorzec');
    return;
  }
  const tekst = element.tekst;
  setText('p-wyzwalacz', [tekst.pyt, tekst.pl].filter(Boolean).join(' — '));
  setText('p-wzorzec', tekst.en || '');
  playerEl.classList.toggle('wzorzec', element.rola === 'wzor');
  setText('p-group', `Para ${element.para}/${grupa.pary.length}`);
}

function skok(offset) {
  if (!state.kolejka.length) return offset < 0 ? prev() : next();
  if (offset < 0 && audio.currentTime > 2) { audio.currentTime = 0; return; }
  state.poz = offset < 0 ? poprzedniaPara(state.poz) : nastepnaPara(state.poz, state.kolejka.length);
  wczytajPozycje();
  audio.play().catch(() => {});
  persist();
}
```

**4d.** Wczesny return w `loadAndPlay` (linia 86) — reszta ciała **bez żadnej zmiany**:

```js
function loadAndPlay(chapter, index) {
  if (chapter.format === 2) return void grajPary(chapter, index, 0);
  const g = chapter.groups[index];
  // …istniejące ciało bez zmian…
}
```

**4e.** `setRepeat` (linia 128) — natywna pętla tylko w formacie 1:

```js
function setRepeat(mode) {
  state.repeat = mode;
  localStorage.setItem('ang.repeat', mode);
  audio.loop = mode === 'one' && !state.kolejka.length;
  renderPlayer();
  updateActiveUI();
}
```

**4f.** `cycleRepeat` (linia 135) rozgałęzia się po formacie:

```js
function cycleRepeat() {
  if (state.kolejka.length) return setRepeat(nastepnyTryb(state.repeat, maPary()));
  const order = ['off', 'one', 'all'];
  setRepeat(order[(order.indexOf(state.repeat) + 1) % order.length]);
}
```

**4g.** `updateMediaSession` (linia 163) — gałąź par przed istniejącym ciałem:

```js
function updateMediaSession() {
  if (!('mediaSession' in navigator) || !state.chapter) return;
  const artwork = ART_SIZES.map((s) => ({ src: `icons/icon-${s}.png`, sizes: `${s}x${s}`, type: 'image/png' }));
  if (state.kolejka.length) {
    const element = state.kolejka[state.poz];
    const grupa = grupaTeraz();
    if (element.rola === 'sluchanka') {
      const zdanie = element.zdania[zdanieDla(element.zdania, audio.currentTime)] || {};
      navigator.mediaSession.metadata = new MediaMetadata({
        title: zdanie.en || '', artist: `Grupa ${grupa.n}`, album: 'Angielski', artwork });
      return;
    }
    const opis = opisBlokady(element, { grupa: grupa.n, ilePar: grupa.pary.length });
    navigator.mediaSession.metadata = new MediaMetadata({
      title: opis.title, artist: opis.artist, album: 'Angielski', artwork });
    return;
  }
  const g = state.chapter.groups[state.index];
  navigator.mediaSession.metadata = new MediaMetadata({
    title: g.label, artist: state.chapter.titlePl, album: 'Angielski', artwork });
}
```

**4h.** W `wire()` (linia 408) i `setupMediaSession()` (linia 147) podmień prev/next na `skok`,
dołóż obsługę błędu wczytania i przełączanie frazy w słuchance — dokładnie tak jak w
Zadaniu 6, krok 5k, z tą różnicą, że tryb „cały" woła `grajPary(state.chapter, (state.index + 1) % state.chapter.groups.length, 0)`,
a fallback formatu 1 to `next()` zamiast `move(1)`.

**4i.** `restoreLast` (linia 390) — gałąź formatu 2 jak w Zadaniu 6, krok 5j, z kluczem
`ang.last` i bez `cleanTitle` w opisie.

- [ ] **Krok 5: Uruchom pełny zestaw testów**

```bash
node --test tools/*.test.mjs
```
Oczekiwane: wszystko zielone (`build-podglad.browser.test.mjs` może wymagać Chrome —
jeśli padnie z powodu braku przeglądarki, uruchom resztę pojedynczo i odnotuj).

- [ ] **Krok 6: Commit**

```bash
git add app.js index.html style.css tools/k-site.test.mjs
git commit -m "feat: odtwarzacz M rozumie format 2, format 1 bez zmian"
```

---

## Zadanie 8: Migracja Kursu K — przełączenie

Moment, w którym Kurs K przestaje mieć `grupa-N.mp3`. Wszystko, co go obsługuje, jest już
gotowe (Zadania 4–7).

**Pliki:**
- Utwórz: `K/0*/audio/`, `K/0*/audio.json`
- Usuń: `K/0*/grupa-*.mp3` (18 plików)
- Modyfikuj: `tools/build-podglad.test.mjs:20-32`, `tools/build-podglad.browser.test.mjs:21-33,189`

- [ ] **Krok 1: Sprawdź na sucho jeszcze raz**

```bash
for d in K/01-k1-powiedz-to-raz K/02-k2-kintsugi K/03-k3-jednym-zdaniem; do
  node tools/potnij.js "$d" --na-sucho || { echo "STOP: $d"; break; }
done
```
Wszystkie trzy muszą przejść. Jeśli nie — **nie tnij**, zgłoś Krzyśkowi.

- [ ] **Krok 2: Potnij**

```bash
for d in K/01-k1-powiedz-to-raz K/02-k2-kintsugi K/03-k3-jednym-zdaniem; do
  echo "== $d"; node tools/potnij.js "$d";
done
```
Oczekiwane: 3 działy, 18 grup, ~250 par, ~500 plików.

- [ ] **Krok 3: Sprawdź, że stare pliki zniknęły i nowe się zgadzają**

```bash
ls K/*/grupa-*.mp3 2>/dev/null && echo "BŁĄD: zostały stare pliki" || echo "OK: brak grupa-*.mp3"
for d in K/0*/; do
  echo "$d $(ls "$d/audio" | wc -l) plików, $(node -e "console.log(JSON.parse(require('fs').readFileSync('$d/audio.json')).grupy.reduce((s,g)=>s+g.pary.length,0))") par";
done
```
Liczba plików musi być dokładnie 2× liczba par.

- [ ] **Krok 4: Przebuduj manifesty i sprawdź format**

```bash
node tools/build-all.js
node -e "const k=require('./k-content.json'); console.log(k.chapters.map(c=>[c.id,c.format,c.groups.length].join(' ')).join('\n'))"
```
Oczekiwane: `k1 2 5`, `k2 2 5`, `k3 2 8`.

- [ ] **Krok 5: Napraw testy, które zakładały `grupa-*.mp3` w K**

W `tools/build-podglad.test.mjs` i `tools/build-podglad.browser.test.mjs` funkcja
`kAudioSources()` czyta pliki `grupa-N.mp3` z katalogów K — po migracji zwróci pustą listę.
Zamień jej ciało na czytanie `audio.json`:

```js
// Kurs K jest w formacie 2 — źródła audio biorą się z audio.json, nie z listy plików.
function kAudioSources() {
  const courseRoot = path.join(ROOT, 'K');
  return fs.readdirSync(courseRoot)
    .filter((name) => /^\d{2}-k\d+-/.test(name))
    .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))
    .flatMap((dir) => {
      const m = JSON.parse(fs.readFileSync(path.join(courseRoot, dir, 'audio.json'), 'utf8'));
      return m.grupy.flatMap((g) => (g.pary || []).flatMap((p) => [
        `K/${dir}/${p.cue.src}`, `K/${dir}/${p.wzor.src}`,
      ]));
    });
}
```

W `build-podglad.browser.test.mjs:189` asercja oczekuje `grupa-1.mp3` w `#player`.
Zamień na:

```js
  assert.match(await cdp.evaluate("document.querySelector('#player').getAttribute('src')"),
    /K\/01-k1-powiedz-to-raz\/audio\/g1-p01-cue\.mp3$/);
```

Asercja `Odtwórz cały Kurs K · N grup` w `build-podglad.test.mjs` liczy grupy, nie pliki —
zmień źródło liczby na sumę `m.grupy.length` po działach.

- [ ] **Krok 6: Uruchom testy**

```bash
node --test tools/generate-k.test.mjs tools/k-site.test.mjs tools/pary.test.mjs tools/potnij.test.mjs tools/k2-content.test.mjs tools/k3-content.test.mjs tools/build-podglad.test.mjs
```

- [ ] **Krok 7: Sprawdź w przeglądarce**

```bash
npm run serve
```
Otwórz `http://localhost:8000/k.html`, wejdź w K1, kliknij Grupa 1. Sprawdź:
1. słychać polskie zdanie, na karcie widać je na szaro
2. angielskie **nie jest** widoczne w trakcie ciszy
3. gdy zaczyna lecieć angielskie — pojawia się na karcie
4. licznik `1/12` rośnie z każdą parą
5. ⇦ przeskakuje o parę do przodu, ⇤ wraca
6. przycisk pętli cyklicznie: wył → para → grupa → cały

- [ ] **Krok 8: Commit**

```bash
git add -A K/ content.json k-content.json tools/build-podglad.test.mjs tools/build-podglad.browser.test.mjs
git commit -m "feat: Kurs K przeniesiony na audio per para (18 grup, ~250 par)"
```

---

## Zadanie 9: `assemble-audio.js` generuje pary

Od tej chwili nowe działy powstają od razu w formacie 2.

**Pliki:**
- Modyfikuj: `~/.claude/skills/angielski-rozdzial/assemble-audio.js`, `SKILL.md`
- Test: `~/.claude/skills/angielski-rozdzial/test-assemble-audio.js`

**Interfejsy:**
- Konsumuje: `planujPare` (Zadanie 1), kształt `audio.json` (Zadanie 3)
- Produkuje: `zapiszPare(openai, tryb, para, ścieżki, workDir) → { cue, wzor }` z długościami

- [ ] **Krok 1: Napisz test, który pada**

Dopisz do `test-assemble-audio.js`:

```js
// --- nazwy plików par ---
const { nazwaPary } = require('./assemble-audio');
ok(nazwaPary(1, 1, 'cue') === 'g1-p01-cue.mp3', 'nazwa: para 1 grupy 1, wyzwalacz');
ok(nazwaPary(3, 12, 'en') === 'g3-p12-en.mp3', 'nazwa: para 12 grupy 3, wzorzec');
ok(nazwaPary(10, 7, 'cue') === 'g10-p07-cue.mp3', 'nazwa: dwucyfrowa grupa');
```

- [ ] **Krok 2: Uruchom test i potwierdź, że pada**

```bash
node ~/.claude/skills/angielski-rozdzial/test-assemble-audio.js
```

- [ ] **Krok 3: Zamień `assembleGroup` na zapis par**

```js
function nazwaPary(grupa, para, rola) {
  return `g${grupa}-p${String(para).padStart(2, '0')}-${rola}.mp3`;
}

function dlugoscMp3(p) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=nw=1:nk=1', p], { encoding: 'utf8' });
  return Number(Number(out.trim()).toFixed(3));
}

// Nagrywa jedną parę do dwóch plików w <dział>/audio/. Zwraca ich długości do audio.json.
async function zapiszPare(openai, tryb, para, grupaN, paraN, audioDir, workDir) {
  const plan = planujPare(tryb, para);
  const zrob = async (segmenty, rola) => {
    const czesci = [];
    for (const [i, s] of segmenty.entries()) {
      const f = path.join(workDir, `g${grupaN}_${paraN}_${rola}_${i}.mp3`);
      if (s.rodzaj === 'tts') await ttsToFile(openai, s.tekst, s.lang, f);
      else makeSilence(s.sek, f);
      czesci.push(f);
    }
    const out = path.join(audioDir, nazwaPary(grupaN, paraN, rola));
    concatFiles(czesci, out);
    return { src: `audio/${path.basename(out)}`, sek: dlugoscMp3(out) };
  };
  return { cue: await zrob(plan.cue, 'cue'), wzor: await zrob(plan.wzor, 'en') };
}
```

Dołóż zapis grupy słuchanki (jeden plik + offsety, bo nie ma tam ciszy na produkcję):

```js
// Słuchanka zostaje jednym nagraniem — cięcie nic by nie dało, bo nie ma pauzy
// na Twoją produkcję. Zamiast plików zapisujemy offsety każdego zdania.
async function zapiszSluchanke(openai, grupa, outDir, workDir) {
  const segmenty = [];
  const zdania = [];
  let czas = 0;
  for (const [i, para] of grupa.pairs.entries()) {
    const en = path.join(workDir, `s${grupa.n}_${i}_en.mp3`);
    const gap = path.join(workDir, `s${grupa.n}_${i}_gap.mp3`);
    await ttsToFile(openai, para.en, 'en', en);
    const przerwa = Math.min(2.5, Math.max(0.9, silenceDuration(para.en) * 0.35));
    makeSilence(przerwa, gap);
    const dl = dlugoscMp3(en);
    zdania.push({ pl: para.pl, en: para.en, t: [Number(czas.toFixed(3)), Number((czas + dl).toFixed(3))] });
    czas += dl + przerwa;
    segmenty.push(en, gap);
  }
  const out = path.join(outDir, `grupa-${grupa.n}.mp3`);
  concatFiles(segmenty, out);
  return { n: grupa.n, tryb: 'sluchanka', src: `grupa-${grupa.n}.mp3`, zdania };
}
```

Zamień pętlę w `main()` (linie 244–250) na:

```js
  const audioDir = path.join(outDir, 'audio');
  fs.mkdirSync(audioDir, { recursive: true });
  const manifest = { wersja: 2, generatedAt: new Date().toISOString(), grupy: [] };
  const manifestPath = path.join(outDir, 'audio.json');
  if (fs.existsSync(manifestPath)) {
    // dogrywamy do istniejącego manifestu (tryb --only N)
    try { manifest.grupy = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).grupy || []; } catch {}
  }

  for (const g of groups) {
    const tryb = normalizeMode(g.mode);
    if (!g.pairs.length) { console.warn(`Grupa ${g.n}: 0 par, pomijam`); continue; }

    if (tryb === 'sluchanka') {
      const out = path.join(outDir, `grupa-${g.n}${suffix}.mp3`);
      if (shouldSkip(out, force)) { console.log(`Grupa ${g.n} — istnieje, pomijam`); continue; }
      process.stdout.write(`Grupa ${g.n} [słuchanka] (${g.pairs.length} zdań)... `);
      const wpis = await zapiszSluchanke(openai, g, outDir, workDir);
      manifest.grupy = manifest.grupy.filter((x) => x.n !== g.n).concat(wpis).sort((a, b) => a.n - b.n);
      console.log('→ ' + out);
      continue;
    }

    process.stdout.write(`Grupa ${g.n} [${tryb}] (${g.pairs.length} par)... `);
    const pary = [];
    for (const [i, para] of g.pairs.entries()) {
      const nr = i + 1;
      const cueOut = path.join(audioDir, nazwaPary(g.n, nr, 'cue'));
      const enOut = path.join(audioDir, nazwaPary(g.n, nr, 'en'));
      if (shouldSkip(cueOut, force) && shouldSkip(enOut, force)) {
        pary.push({ n: nr, cue: { src: `audio/${path.basename(cueOut)}`, sek: dlugoscMp3(cueOut) },
          wzor: { src: `audio/${path.basename(enOut)}`, sek: dlugoscMp3(enOut) }, tekst: tekstPary(tryb, para) });
        continue;
      }
      const { cue, wzor } = await zapiszPare(openai, tryb, para, g.n, nr, audioDir, workDir);
      pary.push({ n: nr, cue, wzor, tekst: tekstPary(tryb, para) });
    }
    manifest.grupy = manifest.grupy.filter((x) => x.n !== g.n)
      .concat({ n: g.n, tryb, pary }).sort((a, b) => a.n - b.n);
    console.log(`→ ${pary.length * 2} plików`);
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`audio.json: ${manifest.grupy.length} grup`);
```

Dołóż jeszcze `tekstPary` (identyczne jak w `tools/potnij.js` — kształt tekstu na ekran
musi być ten sam po obu stronach):

```js
function tekstPary(tryb, para) {
  if (tryb === 'scenka') return { pyt: para.q, pl: para.prompt || null, en: para.a };
  if (tryb === 'en-only') return { pyt: para.pl, pl: null, en: para.en };
  return { pyt: null, pl: para.pl, en: para.en };
}
```

Zostaw `assembleGroup` w pliku i w `module.exports` — używa jej `test-assemble-audio.js`
i nic nie zyskujemy na jej kasowaniu.

- [ ] **Krok 4: Uruchom test i potwierdź, że przechodzi**

```bash
node ~/.claude/skills/angielski-rozdzial/test-assemble-audio.js
```

- [ ] **Krok 5: Zaktualizuj `SKILL.md`**

W „Krok 3: Audio" zamień opis wyjścia: powstaje `<dział>/audio/g{N}-p{NN}-{cue|en}.mp3`
plus `<dział>/audio.json`; `grupa-N.mp3` powstaje już **tylko** dla grup słuchanki.
Dopisz zdanie, że po wygenerowaniu trzeba puścić `npm run build` w `~/angielski`.

- [ ] **Krok 6: Commit**

```bash
cd ~/.claude/skills/angielski-rozdzial
git add assemble-audio.js test-assemble-audio.js SKILL.md
git commit -m "feat: generator zapisuje pary i audio.json zamiast sklejonej grupy"
cd ~/angielski
```

---

## Zadanie 10: Podgląd — podświetlanie wiersza i ▶ przy wierszu

**Pliki:**
- Modyfikuj: `tools/build-podglad.js`
- Test: `tools/build-podglad.test.mjs`

**Interfejsy:**
- Konsumuje: `audio.json` działów formatu 2
- Produkuje: atrybuty `data-cue`, `data-en`, `data-para` na wierszach; pole `audio` w eksporcie JSON

- [ ] **Krok 1: Napisz test, który pada**

```js
test('wiersze Kursu K niosa sciezki do par i eksport je przekazuje', () => {
  const html = buildPreview();
  assert.match(html, /data-cue="K\/01-k1-powiedz-to-raz\/audio\/g1-p01-cue\.mp3"/);
  assert.match(html, /data-en-src="K\/01-k1-powiedz-to-raz\/audio\/g1-p01-en\.mp3"/);
  assert.match(html, /data-para="1"/);
  assert.match(html, /class="row-play"/, 'kazdy wiersz ma wlasny przycisk odtwarzania');
  assert.match(html, /tr\.dataset\.enSrc/, 'eksport siega po sciezke do pliku EN');
  assert.match(html, /grajaca/, 'jest klasa podswietlenia grajacego wiersza');
});

test('dzialy Kursu M zostaja przy jednym pliku na grupe', () => {
  const html = buildPreview();
  assert.match(html, /data-audio="\[&quot;01-m1d1[^"]*grupa-1\.mp3&quot;\]"/,
    'M nadal ma kolejke plikow grupowych');
});
```

- [ ] **Krok 2: Uruchom test i potwierdź, że pada**

```bash
node --test tools/build-podglad.test.mjs
```

- [ ] **Krok 3: Wczytaj `audio.json` przy budowie**

W `build-podglad.js`, obok `audioForDir`, dodaj:

```js
// Dział w formacie 2: mapa {grupa → [{cue, en}]} po numerze wiersza.
function paryDlaDir(dir) {
  const p = path.join(ROOT, dir, 'audio.json');
  if (!fs.existsSync(p)) return null;
  try {
    const m = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (m.wersja !== 2) return null;
    const out = new Map();
    for (const g of m.grupy) {
      if (!g.pary) continue;
      out.set(g.n, g.pary.map((x) => ({ cue: `${dir}/${x.cue.src}`, en: `${dir}/${x.wzor.src}` })));
    }
    return out;
  } catch { return null; }
}
```

Dołóż `pary: paryDlaDir(dir)` do obiektów `mItems` i `kItems`.

- [ ] **Krok 4: Dołóż atrybuty i przycisk do wiersza**

`renderRows(item, group)` (linia 291) iteruje `for (const row of group.rows)` — potrzebny
jest indeks, więc zamień pętlę na `.entries()`:

```js
function renderRows(item, group) {
  const paryGrupy = item.pary ? item.pary.get(group.n) : null;
  let rows = '';
  for (const [indeks, row] of group.rows.entries()) {
    const para = paryGrupy ? paryGrupy[indeks] : null;
    const audioAttr = para
      ? ` data-cue="${A(para.cue)}" data-en-src="${A(para.en)}" data-para="${indeks + 1}"`
      : '';
    const przyciskWiersza = para
      ? '<td class="rp"><button class="row-play" title="Odtwórz tę parę">▶︎</button></td>'
      : '';
    // …dalej jak dziś, z dwiema zmianami w każdej z dwóch gałęzi (scenka / dryl):
    //   `<tr ${rowData(...)}${audioAttr}>`   zamiast   `<tr ${rowData(...)}>`
    //   `…</td>${przyciskWiersza}</tr>`      zamiast   `…</td></tr>`
  }
  return rows;
}
```

- [ ] **Krok 5: Dołóż podświetlanie i odtwarzanie par w skrypcie podglądu**

W bloku `<script>`, w sekcji audio, zamień `playQueue` na wersję świadomą wierszy:

```js
let wiersze=[];              // element <tr> odpowiadający pozycji w kolejce
function podswietl(i){
  document.querySelectorAll('tr.grajaca').forEach(tr=>tr.classList.remove('grajaca'));
  const tr=wiersze[i]; if(!tr) return;
  tr.classList.add('grajaca');
  tr.scrollIntoView({block:'center',behavior:'smooth'});
}
function playQueue(list,label,btn,trs){
  queue=list.slice(); qi=0; qlabel=label||'Audio'; wiersze=trs||[]; setActiveBtn(btn);
  audiobar.hidden=!queue.length; if(!queue.length) return;
  loadCurrent(); podswietl(qi); player.play().catch(()=>{});
}
player.addEventListener('ended',()=>{
  if(qi<queue.length-1){ qi++; loadCurrent(); podswietl(qi); player.play().catch(()=>{}); }
  else { setActiveBtn(null); document.querySelectorAll('tr.grajaca').forEach(tr=>tr.classList.remove('grajaca')); }
});
```

Przycisk grupy buduje kolejkę z par, jeśli wiersze je mają:

```js
document.addEventListener('click',e=>{
  const rp=e.target.closest('.row-play');
  if(rp){
    const tr=rp.closest('tr[data-cue]'); if(!tr) return;
    playQueue([tr.dataset.cue,tr.dataset.enSrc], tr.dataset.pl.slice(0,60), rp, [tr,tr]);
    return;
  }
  const pb=e.target.closest('.play-btn'); if(!pb) return;
  const sekcja=pb.closest('section.group');
  const trs=sekcja?[...sekcja.querySelectorAll('tr[data-cue]')]:[];
  if(trs.length){
    const list=trs.flatMap(tr=>[tr.dataset.cue,tr.dataset.enSrc]);
    const rows=trs.flatMap(tr=>[tr,tr]);
    if(pb===activeBtn && !player.paused){ player.pause(); return; }
    playQueue(list, pb.dataset.label, pb, rows);
    return;
  }
  // …istniejąca ścieżka dla działów formatu 1…
});
```

Styl podświetlenia:

```css
tr.grajaca td{background:#fff6e8;box-shadow:inset 3px 0 0 var(--accent)}
td.rp{width:34px;text-align:center;padding-left:0}
.row-play{background:none;border:none;color:var(--muted);font-size:14px;padding:2px 6px;border-radius:8px}
.row-play:hover{color:var(--accent)}
```

- [ ] **Krok 6: Dołóż `audio` do eksportu**

W `collectStarredCards()` dopisz do obiektu karty:

```js
    const audio = tr.dataset.enSrc || null;
    cards.push(activeCourse==='k'
      ? {pl:tr.dataset.pl,en:tr.dataset.en,targets,blocks,course:'K',chapter:tr.dataset.chapter,audio}
      : {pl:tr.dataset.pl,en:tr.dataset.en,targets,blocks,mk:Number(tr.dataset.mk),d:Number(tr.dataset.d),audio});
```

- [ ] **Krok 7: Uruchom testy i sprawdź w przeglądarce**

```bash
node --test tools/build-podglad.test.mjs
node tools/build-podglad.js && open podglad.html
```
W Chrome: wejdź w Kurs K → K1 → kliknij ▶ przy Grupie 1. Grający wiersz musi się
podświetlić i sam wjechać na środek.

- [ ] **Krok 8: Commit**

```bash
git add tools/build-podglad.js tools/build-podglad.test.mjs
git commit -m "feat: podglad gra pare po parze i podswietla grajacy wiersz"
```

---

## Zadanie 11: Anki bierze gotowy plik + dokumentacja

**Pliki:**
- Modyfikuj: `~/.claude/skills/przejmij-json/add-cards.cjs`, `~/.claude/skills/przejmij-json/SKILL.md`
- Modyfikuj: `README.md`

**Interfejsy:**
- Konsumuje: pole `audio` z eksportu (Zadanie 10)
- Produkuje: karty z `[sound:…]` bez wywołania OpenAI

- [ ] **Krok 1: Dodaj czytanie pliku z dysku**

W `add-cards.cjs`, po `audioFilename`, dodaj:

```js
// Korzeń kursu — ścieżki w polu `audio` są względne wobec ~/angielski.
const KURS = process.env.ANG_ROOT || path.join(os.homedir(), 'angielski');

// Zwraca base64 gotowego nagrania EN z kursu albo null, gdy karta go nie ma.
function audioZDysku(card) {
  if (!card.audio) return null;
  const p = path.join(KURS, card.audio);
  try { return fs.readFileSync(p).toString('base64'); }
  catch { return null; }
}
```

W pętli dodawania zamień blok audio na:

```js
    if (audioOn || card.audio) {
      try {
        const zDysku = audioZDysku(p.card);
        if (!zDysku && !audioOn) throw new Error('brak pliku i brak klucza OpenAI');
        const fname = audioFilename(p.card);
        await anki('storeMediaFile', { filename: fname, data: zDysku || await ttsMp3Base64(p.card.en) });
        p.note.fields.Extra = `[sound:${fname}]`;
        if (zDysku) zKursu++;
      } catch (e) {
        noSound.push({ en: p.card.en, err: e.message });
      }
    }
```

Zadeklaruj `let zKursu = 0;` obok `let added = 0, dup = 0;` i dopisz do podsumowania:

```js
  console.log(`\nDodane: ${added} · Z kursu (bez TTS): ${zKursu} · Duplikaty: ${dup} · Bez luki (pominięte): ${skipped.length} · Bez audio: ${noSound.length} · Błędy: ${failed.length}`);
```

W `--dry-run` pokaż źródło audio:

```js
      console.log('audio:', p.card.audio ? `${p.card.audio} (z kursu)` : (audioOn ? audioFilename(p.card) + ' (TTS)' : '(wyłączone)'));
```

- [ ] **Krok 2: Sprawdź na sucho na prawdziwym eksporcie**

Otwórz `podglad.html`, wejdź w Kurs K, oznacz gwiazdką 3 zdania, kliknij „⬇ Eksport K do Anki".

```bash
node ~/.claude/skills/przejmij-json/add-cards.cjs ~/Downloads/powtorki-angielski-k-*.json --dry-run
```
Oczekiwane: przy każdej karcie `audio: K/0…/audio/g…-en.mp3 (z kursu)`.

- [ ] **Krok 3: Dodaj naprawdę i sprawdź kartę w Anki**

Anki musi być otwarte (AnkiConnect na 8765).

```bash
node ~/.claude/skills/przejmij-json/add-cards.cjs ~/Downloads/powtorki-angielski-k-*.json
```
Oczekiwane: `Z kursu (bez TTS): 3`. W Anki otwórz talię `angielski-k`, odsłoń odpowiedź —
musi zagrać ten sam głos co kurs.

- [ ] **Krok 4: Zaktualizuj `przejmij-json/SKILL.md`**

Opisz pole `audio` w formacie wejścia, zasadę „jest plik → zero TTS", nowy licznik
„Z kursu (bez TTS)" i zmienną `ANG_ROOT`.

- [ ] **Krok 5: Zaktualizuj `README.md`**

Sekcja „Dodanie nowego rozdziału": nowy układ katalogu (`audio/` + `audio.json`),
`grupa-N.mp3` tylko dla słuchanki. Sekcja „Pliki": dopisz `pary.js` i `tools/potnij.js`.
Sekcja „Na iPhonie": opisz cztery stany pętli i to, że ⇤/⇦ chodzą po parach.

- [ ] **Krok 6: Commit**

```bash
cd ~/.claude/skills/przejmij-json
git add add-cards.cjs SKILL.md 2>/dev/null || true
git -C ~/.claude/skills/przejmij-json commit -m "feat: karty Anki biora gotowe audio z kursu" 2>/dev/null || true
cd ~/angielski
git add README.md
git commit -m "docs: README pod audio per para"
```

---

## Zadanie 12: Domknięcie

- [ ] **Krok 1: Pełny zestaw testów**

```bash
node --test tools/*.test.mjs
```

- [ ] **Krok 2: Pełny build**

```bash
node tools/build-all.js && node tools/build-podglad.js
```

- [ ] **Krok 3: Ostatni sprawdzian na iPhonie**

```bash
ipconfig getifaddr en0
npm run serve
```
Krzysiek otwiera `http://<adres>:8000/k.html` w Safari, wchodzi w K3 → Grupa 1, włącza,
**blokuje ekran** i słucha 3 minuty. Sprawdza: gra bez przerwy, na ekranie blokady zmieniają
się frazy, przyciski ⇤/⇦ przeskakują zdanie.

- [ ] **Krok 4: Scal do `main`**

```bash
git checkout main
git merge --no-ff audio-per-para -m "feat: audio per para dla Kursu K"
```

- [ ] **Krok 5: Zapytaj Krzyśka, czy pushować**

Push uruchamia deploy na Render. **Nie pushuj bez jego zgody.**

---

## Kolejność i zależności

```
0 (BRAMKA iPhone)
└─ 1 planujPare
   ├─ 2 dopasowanie ciszy ── 3 potnij.js CLI ──┐
   └─ 9 generator par                          │
                                               │
   4 format 2 w manifestach ────────┐          │
   5 pary.js ── 6 k-app.js          ├── 8 MIGRACJA ── 10 podgląd ── 11 Anki ── 12 domknięcie
              └─ 7 app.js ──────────┘
```

Zadania 4–7 można prowadzić równolegle z 2–3. **Zadanie 8 wymaga ukończenia 3, 4, 6 i 7** —
wcześniej Kurs K przestałby działać w przeglądarce.
