# Anki: stan „wyeksportowane" + audio na kartach — plan implementacji

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eksport powtórek z podglądu kursu wysyła tylko nowe gwiazdki (⭐→✅ po eksporcie), a karty Anki dostają audio EN (TTS, tył karty).

**Architecture:** Dwie niezależne części. (A) `tools/build-podglad.js` generuje `podglad.html` z inline JS — dochodzi drugi zbiór w localStorage (`kurs.exported`) i filtr eksportu. (B) `~/.claude/skills/przejmij-json/add-cards.cjs` — przed `addNote` generuje MP3 zdania EN gołym fetchem do OpenAI i wgrywa przez AnkiConnect `storeMediaFile`; `[sound:…]` trafia do pola `Extra` (tył karty Cloze).

**Tech Stack:** Node (bez zależności), AnkiConnect (HTTP 8765), OpenAI `gpt-4o-mini-tts` (goły `fetch`).

**Spec:** `docs/superpowers/specs/2026-07-10-anki-eksport-audio-design.md`

## Global Constraints

- Zero nowych zależności npm; `add-cards.cjs` woła OpenAI gołym `fetch` (Node ≥18).
- Głos TTS: `process.env.ANG_VOICE_EN || 'cedar'`; instrukcje: `process.env.ANG_INSTR_EN || 'Speak in natural, native General American English. Calm and clear tone, medium pace. Conversational, not theatrical.'`.
- Klucz OpenAI: `process.env.OPENAI_API_KEY` albo fallback z `~/Desktop/coach-2.0/main.js` (wzorzec `const OPENAI_API_KEY = '…'`).
- Format eksportowanego JSON-a bez zmian: `{source, deck, exportedAt, cards:[{pl,en,targets,blocks,mk,d}]}`.
- `podglad.html` jest gitignorowany — commitujemy tylko `tools/build-podglad.js` (repo `~/angielski`) oraz pliki skilla (repo `~/.claude`).
- W repo `~/angielski` są niezacommitowane zmiany innych sesji (`.gitignore`, `package.json`, `M1-M2-pary-trojki.md`, `tools/serve.mjs`) — **commituj wyłącznie pliki wymienione w tasku** (zawsze `git add <konkretny plik>`, nigdy `git add -A`).
- Języki: kod/komentarze/komunikaty UI po polsku, jak w istniejących plikach.

---

### Task 1: Podgląd — stan „wyeksportowane" (`tools/build-podglad.js`)

**Files:**
- Modify: `tools/build-podglad.js` (inline JS ~linie 470–537, CSS ~linia 389, teksty ~linie 423 i 426)
- Output (gitignorowany, do weryfikacji): `podglad.html`

**Interfaces:**
- Consumes: istniejące `data-k` na `tr`, localStorage `kurs.stars`.
- Produces: localStorage `kurs.exported` (JSON array kluczy `data-k`); `window.collectStarredCards()` zwraca teraz **`{cards, keys}`** (dotąd: sama tablica kart) — `cards` tylko dla nowych gwiazdek.

- [ ] **Step 1: Stan `exported` + zapis (edycja inline JS)**

W `tools/build-podglad.js` zamień:

```js
// ---- ⭐ Powtórki (jeden wspólny zbiór gwiazdek dla całego kursu) ----
const KEY='kurs.stars';
let stars; try{ stars=new Set(JSON.parse(localStorage.getItem(KEY)||'[]')); }catch(e){ stars=new Set(); }
function save(){ try{ localStorage.setItem(KEY, JSON.stringify([...stars])); }catch(e){} }
```

na:

```js
// ---- ⭐ Powtórki (jeden wspólny zbiór gwiazdek dla całego kursu) ----
// kurs.stars = oznaczone; kurs.exported = podzbiór już wyeksportowany do Anki (✅).
const KEY='kurs.stars';
const KEY_EXP='kurs.exported';
let stars; try{ stars=new Set(JSON.parse(localStorage.getItem(KEY)||'[]')); }catch(e){ stars=new Set(); }
let exported; try{ exported=new Set(JSON.parse(localStorage.getItem(KEY_EXP)||'[]')); }catch(e){ exported=new Set(); }
function save(){ try{ localStorage.setItem(KEY, JSON.stringify([...stars])); localStorage.setItem(KEY_EXP, JSON.stringify([...exported])); }catch(e){} }
```

- [ ] **Step 2: Licznik „N par · M nowych"**

Zamień:

```js
function refreshCounts(){
  const n=stars.size;
  document.getElementById('review-toggle-count').textContent=n;
  document.getElementById('review-count').textContent=n+' '+(n===1?'para':(n%10>=2&&n%10<=4&&!(n%100>=12&&n%100<=14)?'pary':'par'));
  document.getElementById('review-empty').style.display=n?'none':'block';
}
```

na:

```js
function freshKeys(){ return [...stars].filter(k=>!exported.has(k)); }
function refreshCounts(){
  const n=stars.size, f=freshKeys().length;
  document.getElementById('review-toggle-count').textContent=n;
  const pary=n+' '+(n===1?'para':(n%10>=2&&n%10<=4&&!(n%100>=12&&n%100<=14)?'pary':'par'));
  const nowe=f===1?'nowa':(f%10>=2&&f%10<=4&&!(f%100>=12&&f%100<=14)?'nowe':'nowych');
  document.getElementById('review-count').textContent=f?pary+' · '+f+' '+nowe:pary;
  document.getElementById('review-empty').style.display=n?'none':'block';
}
```

- [ ] **Step 3: Trzy stany gwiazdki (☆/⭐/✅)**

Zamień:

```js
function markStars(){
  document.querySelectorAll('section.group tr[data-k]').forEach(tr=>{
    const b=tr.querySelector('.star-btn'); if(!b) return;
    const on=stars.has(rowKey(tr)); b.classList.toggle('on',on); b.textContent=on?'⭐':'☆';
  });
}
```

na:

```js
function starFace(k){ return exported.has(k)?'✅':'⭐'; }
function markStars(){
  document.querySelectorAll('section.group tr[data-k]').forEach(tr=>{
    const b=tr.querySelector('.star-btn'); if(!b) return;
    const k=rowKey(tr), on=stars.has(k);
    b.classList.toggle('on',on);
    b.textContent=on?starFace(k):'☆';
  });
}
```

- [ ] **Step 4: Zakładka Powtórki — ✅ i przygaszenie wyeksportowanych**

W `buildReview()` zamień:

```js
    const row=document.createElement('tr'); row.setAttribute('data-k',k);
    row.innerHTML='<td class="star"><button class="star-btn on">⭐</button></td><td class="pl">'+pl+'</td><td class="en">'+en+'</td>';
    tb.appendChild(row);
```

na:

```js
    const row=document.createElement('tr'); row.setAttribute('data-k',k);
    if(exported.has(k)) row.className='was-exported';
    row.innerHTML='<td class="star"><button class="star-btn on">'+starFace(k)+'</button></td><td class="pl">'+pl+'</td><td class="en">'+en+'</td>';
    tb.appendChild(row);
```

Oraz w bloku CSS po linii `.star-btn.on{opacity:1;color:var(--accent)}` dodaj:

```css
.review tr.was-exported td{opacity:.55}
```

- [ ] **Step 5: Odkliknięcie zdejmuje z OBU zbiorów**

W handlerze kliknięcia gwiazdki zamień:

```js
  if(stars.has(k)) stars.delete(k); else stars.add(k);
```

na:

```js
  if(stars.has(k)){ stars.delete(k); exported.delete(k); } else stars.add(k);
```

- [ ] **Step 6: Eksport tylko nowych + oznaczanie po eksporcie**

Zamień cały blok:

```js
// ---- ⬇ Eksport JSON (gwiazdkowane → karty Anki przez skill przejmij-json) ----
function collectStarredCards(){
  const cards=[];
  document.querySelectorAll('section.group tr[data-k]').forEach(tr=>{
    if(!stars.has(rowKey(tr))) return;
    let targets=[], blocks=[];
    try{ targets=JSON.parse(tr.dataset.targets||'[]'); }catch(e){}
    try{ blocks=JSON.parse(tr.dataset.blocks||'[]'); }catch(e){}
    cards.push({ pl:tr.dataset.pl, en:tr.dataset.en, targets, blocks,
                 mk:Number(tr.dataset.mk), d:Number(tr.dataset.d) });
  });
  return cards;
}
window.collectStarredCards = collectStarredCards; // hook do weryfikacji headless
document.getElementById('export-json').addEventListener('click',()=>{
  const cards=collectStarredCards();
  if(!cards.length){ alert('Najpierw oznacz zdania gwiazdką (☆).'); return; }
  const out={ source:'angielski-podglad', deck:'angielski', exportedAt:new Date().toISOString(), cards };
  const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const dt=new Date(), pad=x=>String(x).padStart(2,'0');
  a.href=url; a.download='powtorki-angielski-'+dt.getFullYear()+pad(dt.getMonth()+1)+pad(dt.getDate())+'.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
});
```

na:

```js
// ---- ⬇ Eksport JSON (gwiazdkowane → karty Anki przez skill przejmij-json) ----
// Bierze tylko NOWE gwiazdki (⭐ bez ✅); po pobraniu pliku oznacza je jako wyeksportowane.
function collectStarredCards(){
  const cards=[], keys=[];
  document.querySelectorAll('section.group tr[data-k]').forEach(tr=>{
    const k=rowKey(tr);
    if(!stars.has(k)||exported.has(k)) return;
    let targets=[], blocks=[];
    try{ targets=JSON.parse(tr.dataset.targets||'[]'); }catch(e){}
    try{ blocks=JSON.parse(tr.dataset.blocks||'[]'); }catch(e){}
    cards.push({ pl:tr.dataset.pl, en:tr.dataset.en, targets, blocks,
                 mk:Number(tr.dataset.mk), d:Number(tr.dataset.d) });
    keys.push(k);
  });
  return { cards, keys };
}
window.collectStarredCards = collectStarredCards; // hook do weryfikacji headless
document.getElementById('export-json').addEventListener('click',()=>{
  const picked=collectStarredCards();
  if(!picked.cards.length){
    alert(stars.size?'Wszystkie gwiazdki są już wyeksportowane (✅). Oznacz nowe zdania, żeby mieć co eksportować.':'Najpierw oznacz zdania gwiazdką (☆).');
    return;
  }
  const out={ source:'angielski-podglad', deck:'angielski', exportedAt:new Date().toISOString(), cards:picked.cards };
  const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const dt=new Date(), pad=x=>String(x).padStart(2,'0');
  a.href=url; a.download='powtorki-angielski-'+dt.getFullYear()+pad(dt.getMonth()+1)+pad(dt.getDate())+'.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  picked.keys.forEach(k=>exported.add(k));
  save(); markStars(); refreshCounts();
  if(body.classList.contains('review-mode')) buildReview();
});
```

- [ ] **Step 7: Teksty w UI**

W `.intro` (HTML template, ~linia 423) zamień fragment:

```
W Powtórkach „⬇ Wyeksportuj JSON" pobiera oznaczone zdania → dajesz mi JSON, a skill <b>przejmij-json</b> robi z nich karty Anki (luka C1: PL u góry, EN z luką).
```

na:

```
„⬇ Wyeksportuj JSON" pobiera tylko <b>nowe</b> ⭐ (po eksporcie zmieniają się w ✅ i nie wchodzą do kolejnych eksportów) → dajesz mi JSON, a skill <b>przejmij-json</b> robi z nich karty Anki z audio (luka C1: PL u góry, EN z luką).
```

W `.rhint` (~linia 426) zamień:

```
Kliknij „⬇ Wyeksportuj JSON" u góry, żeby zrobić z nich karty Anki.
```

na:

```
„⬇ Wyeksportuj JSON" u góry pobiera tylko nowe ⭐ · ✅ = już wyeksportowane do Anki.
```

- [ ] **Step 8: Rebuild + asercje statyczne**

Run: `cd ~/angielski && node tools/build-podglad.js && grep -c "kurs.exported" podglad.html && grep -c "was-exported" podglad.html && grep -c "starFace" podglad.html`
Expected: log buildera („Podgląd: …podglad.html"), potem trzy liczby ≥ 1.

- [ ] **Step 9: Test funkcjonalny w headless (skill `browse`)**

Uruchom serwer w tle: `node tools/serve.mjs` (port **8123**; jeśli zajęty — już działa z innej sesji, użyj istniejącego). Skillem `browse` otwórz `http://127.0.0.1:8123/podglad.html` i wykonaj scenariusz (JS w konsoli strony):

1. `localStorage.clear(); location.reload()` — czysty stan.
2. Zbierz dwa klucze: `const ks=[...document.querySelectorAll('section.group tr[data-k]')].slice(0,2).map(t=>t.dataset.k)`.
3. `localStorage.setItem('kurs.stars', JSON.stringify(ks)); location.reload()`.
4. Assert: `window.collectStarredCards().cards.length === 2`; pierwsze dwa przyciski `.star-btn` mają tekst `⭐`; `#review-count` zawiera „2 pary · 2 nowe".
5. `document.getElementById('export-json').click()` (pobieranie pliku w headless może nie dojść — nieistotne). Assert: `JSON.parse(localStorage.getItem('kurs.exported')).length === 2`; przyciski pokazują `✅`; `#review-count` to „2 pary"; `window.collectStarredCards().cards.length === 0`.
6. Ponowny klik `#export-json` → alert „Wszystkie gwiazdki są już wyeksportowane…" (w headless: podepnij `window.alert = m => window.__lastAlert = m` przed klikiem i sprawdź `__lastAlert`).
7. Oznacz trzeci wiersz: `document.querySelectorAll('section.group tr[data-k]')[2].querySelector('.star-btn').click()`. Assert: `collectStarredCards().cards.length === 1`.
8. Odklik pierwszego ✅: `document.querySelector('section.group tr[data-k] .star-btn').click()`. Assert: klucz zniknął i z `kurs.stars`, i z `kurs.exported`.

Expected: wszystkie asercje przechodzą.

- [ ] **Step 10: Commit (tylko builder)**

```bash
cd ~/angielski
git add tools/build-podglad.js
git commit -m "Podgląd: gwiazdki z historią eksportu (⭐→✅, kurs.exported) — eksport JSON bierze tylko nowe" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>" -- tools/build-podglad.js
```

---

### Task 2: Audio na kartach (`~/.claude/skills/przejmij-json/add-cards.cjs`)

**Files:**
- Modify: `~/.claude/skills/przejmij-json/add-cards.cjs`
- Test fixtures (nie commitować): `$SCRATCH/fixture.json`, `$SCRATCH/mock-anki.mjs` — gdzie `$SCRATCH` = katalog scratchpad Twojej sesji (z system promptu); wszystkie `<scratchpad>` niżej czytaj jako tę ścieżkę

**Interfaces:**
- Consumes: JSON eksportu (format bez zmian; karty z `pl,en,targets,mk,d`).
- Produces: notatka Cloze z `Extra = '[sound:angielski-m{mk}-d{d}-{sha1(en)[0..10]}.mp3]'`; plik audio w mediach Anki pod tą nazwą; nowe flagi CLI `--no-audio`, env `ANKI_URL`, `ANG_VOICE_EN`, `ANG_INSTR_EN`; raport z licznikiem „Bez audio".

- [ ] **Step 1: Nagłówek, flagi, konfiguracja TTS**

W `add-cards.cjs` zamień blok komentarza użycia:

```js
// Użycie:
//   node add-cards.cjs powtorki-angielski-20260627.json            # dodaje karty
//   node add-cards.cjs powtorki-angielski-20260627.json --dry-run  # tylko pokazuje, nic nie wysyła
//   node add-cards.cjs <plik.json> --deck "moja talia"             # inna talia
```

na:

```js
// Użycie:
//   node add-cards.cjs powtorki-angielski-20260627.json            # dodaje karty (z audio EN na tyle)
//   node add-cards.cjs powtorki-angielski-20260627.json --dry-run  # tylko pokazuje, nic nie wysyła
//   node add-cards.cjs <plik.json> --deck "moja talia"             # inna talia
//   node add-cards.cjs <plik.json> --no-audio                      # bez generowania audio
//
// Audio: OpenAI gpt-4o-mini-tts (goły fetch), głos ANG_VOICE_EN (domyślnie cedar, jak nowe głosy kursu),
// instrukcje ANG_INSTR_EN. Plik idzie do mediów Anki (storeMediaFile) pod deterministyczną nazwą,
// [sound:…] trafia do pola Extra → gra po odsłonięciu odpowiedzi.
```

Zamień:

```js
const fs = require('fs');

const ANKI = 'http://127.0.0.1:8765';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
```

na:

```js
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const ANKI = process.env.ANKI_URL || 'http://127.0.0.1:8765';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const noAudio = args.includes('--no-audio');
```

- [ ] **Step 2: TTS + nazwa pliku (nowe funkcje)**

Po linii `const esc = (s) => …;` wstaw:

```js
// --- audio EN: ten sam mechanizm co kurs (assemble-audio.js), ale gołym fetchem, bez SDK ---
const VOICE_EN = process.env.ANG_VOICE_EN || 'cedar';
const INSTR_EN = process.env.ANG_INSTR_EN || 'Speak in natural, native General American English. Calm and clear tone, medium pace. Conversational, not theatrical.';

function readKeyFromCoach() {
  try {
    const src = fs.readFileSync(path.join(os.homedir(), 'Desktop', 'coach-2.0', 'main.js'), 'utf8');
    const m = src.match(/const OPENAI_API_KEY = '([^']+)'/);
    return m && m[1];
  } catch { return null; }
}
const OPENAI_KEY = process.env.OPENAI_API_KEY || readKeyFromCoach();
const audioOn = !noAudio && !!OPENAI_KEY;

// Deterministyczna nazwa: to samo zdanie → ten sam plik (ponowny run nadpisuje, zero śmieci w mediach).
function audioFilename(card) {
  const h = crypto.createHash('sha1').update(String(card.en)).digest('hex').slice(0, 10);
  return `angielski-m${card.mk || 0}-d${card.d || 0}-${h}.mp3`;
}

async function ttsMp3Base64(text) {
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const resp = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice: VOICE_EN, input: text, instructions: INSTR_EN, response_format: 'mp3' }),
      });
      if (!resp.ok) throw new Error(`OpenAI TTS ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
      const buf = Buffer.from(await resp.arrayBuffer());
      if (!buf.length) throw new Error('TTS: puste audio dla: ' + text);
      return buf.toString('base64');
    } catch (e) {
      lastErr = e;
      if (attempt < 4) await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw lastErr;
}
```

- [ ] **Step 3: Ostrzeżenie o braku klucza + dry-run z nazwą audio**

W funkcji głównej, zaraz po `console.log(\`Talia: …\`);` dodaj:

```js
  if (!noAudio && !OPENAI_KEY) console.warn('⚠ Brak klucza OpenAI (OPENAI_API_KEY albo coach-2.0/main.js) — karty dodam BEZ audio.');
```

W bloku `if (dryRun) { … }`, w pętli podglądu po linii `console.log('Text:', p.note.fields.Text);` dodaj:

```js
      console.log('audio:', audioOn ? audioFilename(p.card) : '(wyłączone)');
```

- [ ] **Step 4: Generowanie + upload audio przed `addNote`, raport „Bez audio"**

Zamień:

```js
  let added = 0, dup = 0;
  const failed = [];
  for (const p of prepared) {
    try {
      await anki('addNote', { note: p.note });
      added++;
    } catch (e) {
      if (/duplicate/i.test(e.message)) dup++;
      else failed.push({ en: p.card.en, err: e.message });
    }
  }

  console.log(`\nDodane: ${added} · Duplikaty: ${dup} · Bez luki (pominięte): ${skipped.length} · Błędy: ${failed.length}`);
```

na:

```js
  let added = 0, dup = 0;
  const failed = [];
  const noSound = [];
  for (const p of prepared) {
    if (audioOn) {
      try {
        const fname = audioFilename(p.card);
        await anki('storeMediaFile', { filename: fname, data: await ttsMp3Base64(p.card.en) });
        p.note.fields.Extra = `[sound:${fname}]`;
      } catch (e) {
        noSound.push({ en: p.card.en, err: e.message });
      }
    }
    try {
      await anki('addNote', { note: p.note });
      added++;
    } catch (e) {
      if (/duplicate/i.test(e.message)) dup++;
      else failed.push({ en: p.card.en, err: e.message });
    }
  }

  console.log(`\nDodane: ${added} · Duplikaty: ${dup} · Bez luki (pominięte): ${skipped.length} · Bez audio: ${noSound.length} · Błędy: ${failed.length}`);
  if (noSound.length) {
    console.log('\nBEZ AUDIO (TTS/upload padł — karta dodana bez dźwięku):');
    for (const s of noSound) console.log('  •', s.en, '→', s.err);
  }
```

(Uwaga: `allowDuplicate:false` sprawdza tylko pierwsze pole — `Text` — więc `[sound:…]` w `Extra` nie psuje wykrywania duplikatów. Dla duplikatu audio zdąży się wygenerować — koszt groszowy, plik deterministyczny, nieszkodliwe.)

- [ ] **Step 5: Test — dry-run na fixture**

Zapisz w scratchpadzie `fixture.json`:

```json
{ "deck": "angielski",
  "cards": [
    { "pl": "Domykam tu robotę w Norwegii.", "en": "I'm wrapping up my job here in Norway.",
      "targets": ["wrapping up"], "blocks": ["wrap-up"], "mk": 1, "d": 2 },
    { "pl": "To była decyzja na styk.", "en": "It was a close call.",
      "targets": ["a close call"], "blocks": ["close-call"], "mk": 2, "d": 3 }
  ] }
```

Run: `node ~/.claude/skills/przejmij-json/add-cards.cjs <scratchpad>/fixture.json --dry-run`
Expected: `kart w JSON: 2 · z luką: 2 · bez luki: 0 · [DRY-RUN]`; w podglądzie każdej karty linia `audio: angielski-m1-d2-<10 hex>.mp3` (i `-m2-d3-`); zero połączeń sieciowych z Anki/OpenAI (dry-run kończy się przed `createDeck`).

Run: `node …/add-cards.cjs <scratchpad>/fixture.json --dry-run --no-audio`
Expected: linie `audio: (wyłączone)`.

- [ ] **Step 6: Test E2E z mockiem AnkiConnect (prawdziwy TTS, ~2 zdania)**

Zapisz w scratchpadzie `mock-anki.mjs`:

```js
// Fałszywy AnkiConnect: odpowiada sukcesem i loguje akcje na stdout (1 linia JSON / request).
import http from 'node:http';
http.createServer((req, res) => {
  let b = '';
  req.on('data', (c) => (b += c));
  req.on('end', () => {
    const j = JSON.parse(b);
    console.log(JSON.stringify({
      action: j.action,
      filename: j.params?.filename,
      extra: j.params?.note?.fields?.Extra,
      dataLen: (j.params?.data || '').length,
    }));
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ result: j.action === 'addNote' ? 12345 : null, error: null }));
  });
}).listen(8766, () => console.log('MOCK-READY'));
```

Run (mock w tle, log do pliku):

```bash
node <scratchpad>/mock-anki.mjs > <scratchpad>/mock.log 2>&1 & MOCKPID=$!
sleep 1
ANKI_URL=http://127.0.0.1:8766 node ~/.claude/skills/przejmij-json/add-cards.cjs <scratchpad>/fixture.json
kill $MOCKPID
cat <scratchpad>/mock.log
```

Expected:
- wyjście skryptu: `Dodane: 2 · Duplikaty: 0 · Bez luki (pominięte): 0 · Bez audio: 0 · Błędy: 0`;
- w `mock.log`: `createDeck`; dwa `storeMediaFile` z `filename` pasującym do `^angielski-m1-d2-[0-9a-f]{10}\.mp3$` / `^angielski-m2-d3-…` i `dataLen > 10000` (prawdziwe MP3 w base64); dwa `addNote` z `extra` = `[sound:<ta sama nazwa>]`.
- Test z `--no-audio` (mock jak wyżej): w logu brak `storeMediaFile`, `addNote` ma `extra` = `""`.

Jeśli brak klucza OpenAI (nie ma env ani coacha) — zgłoś to i zatrzymaj się; nie markuj testu jako zaliczonego.

- [ ] **Step 7: Commit w repo `~/.claude`**

```bash
cd ~/.claude
git add skills/przejmij-json/add-cards.cjs
git commit -m "przejmij-json: audio EN na kartach (gpt-4o-mini-tts → storeMediaFile → [sound:] w Extra), --no-audio, ANKI_URL" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>" -- skills/przejmij-json/add-cards.cjs
```

---

### Task 3: Dokumentacja skilla + smoke test na żywym Anki

**Files:**
- Modify: `~/.claude/skills/przejmij-json/SKILL.md`
- Modify: `~/.claude/projects/-Users-krzysztofkilian-angielski/memory/angielski-powtorki-anki-pipeline.md` (+ ewentualnie linijka w `MEMORY.md`)

**Interfaces:**
- Consumes: zachowanie z Tasków 1–2 (⭐→✅, `[sound:…]` w `Extra`, flaga `--no-audio`, licznik „Bez audio").
- Produces: aktualną dokumentację; brak zmian w kodzie.

- [ ] **Step 1: SKILL.md — opis audio i nowych flag**

W `~/.claude/skills/przejmij-json/SKILL.md`:

1. Zamień zdanie:

```
Talia domyślnie **`angielski`** (osobna od coachowej „ulepszenia"). Model: wbudowany **Cloze**,
pola `Text`/`Extra`. Bez audio. Duplikaty pomijane (`allowDuplicate:false`).
```

na:

```
Talia domyślnie **`angielski`** (osobna od coachowej „ulepszenia"). Model: wbudowany **Cloze**,
pola `Text`/`Extra`. **Audio EN** generowane automatycznie (OpenAI `gpt-4o-mini-tts`, głos
`ANG_VOICE_EN` — domyślnie `cedar`, jak nowe głosy kursu) i wgrywane do mediów Anki; `[sound:…]`
siedzi w polu `Extra`, więc gra dopiero po odsłonięciu odpowiedzi. Duplikaty pomijane
(`allowDuplicate:false`). Flaga `--no-audio` wyłącza dźwięk; wymaga klucza OpenAI
(`OPENAI_API_KEY` albo coach-2.0). Podgląd oznacza wyeksportowane zdania jako ✅ i kolejny
eksport zawiera tylko nowe ⭐ — stare zdania nie wracają w JSON-ach.
```

2. W kroku 2 (suchy przebieg) dopisz na końcu akapitu: `Dry-run pokazuje też przewidzianą nazwę pliku audio per karta.`
3. W kroku 6 (raport) zamień listę liczników na: **Dodane / Duplikaty / Bez luki (pominięte) / Bez audio / Błędy**. Dopisz: `Jeśli „Bez audio" > 0 — wymień zdania; można je dograć ponownym runem (deterministyczna nazwa pliku nadpisze/uzupełni media, a duplikat karty zostanie pominięty — uwaga: karta-duplikat NIE dostanie wstecz audio, to świadome ograniczenie).`
4. W sekcji „Uwagi" dopisz: `- Env: ANKI_URL (testy/mock), ANG_VOICE_EN, ANG_INSTR_EN, OPENAI_API_KEY.`

- [ ] **Step 2: Smoke test na żywym Anki (tylko jeśli AnkiConnect odpowiada)**

Sprawdź: `curl -s http://127.0.0.1:8765 -d '{"action":"version","version":6}'` — jeśli brak odpowiedzi, **pomiń ten step** i odnotuj w raporcie „smoke test odłożony — Anki zamknięte".

Jeśli działa:

```bash
node ~/.claude/skills/przejmij-json/add-cards.cjs <scratchpad>/fixture.json --deck "test-audio"
curl -s http://127.0.0.1:8765 -d '{"action":"findNotes","version":6,"params":{"query":"deck:test-audio"}}'
# → notesInfo na zwróconych ID: pole Extra zawiera [sound:angielski-m1-d2-….mp3]
curl -s http://127.0.0.1:8765 -d '{"action":"getMediaFilesNames","version":6,"params":{"pattern":"angielski-m1-d2-*.mp3"}}'
# → nazwa pliku jest na liście
```

Cleanup (obowiązkowy):

```bash
curl -s http://127.0.0.1:8765 -d '{"action":"deleteDecks","version":6,"params":{"decks":["test-audio"],"cardsToo":true}}'
curl -s http://127.0.0.1:8765 -d '{"action":"deleteMediaFile","version":6,"params":{"filename":"<nazwa-z-testu-m1>"}}'
curl -s http://127.0.0.1:8765 -d '{"action":"deleteMediaFile","version":6,"params":{"filename":"<nazwa-z-testu-m2>"}}'
```

Expected: karta w talii test-audio z `[sound:…]` w Extra, plik w mediach; po cleanupie talia i pliki znikają.

- [ ] **Step 3: Aktualizacja pamięci projektu**

W `~/.claude/projects/-Users-krzysztofkilian-angielski/memory/angielski-powtorki-anki-pipeline.md` zaktualizuj treść tak, by odzwierciedlała: gwiazdki ⭐→✅ (klucz `kurs.exported`, eksport tylko nowych, odklik czyści oba zbiory) oraz audio EN na tyle karty (`gpt-4o-mini-tts`, `ANG_VOICE_EN`||`cedar`, `[sound:]` w `Extra`, `--no-audio`, `ANKI_URL` do testów). Jeżeli zmieni się jednolinijkowy „hook" — popraw też wpis w `MEMORY.md`.

- [ ] **Step 4: Commit dokumentacji w `~/.claude`**

```bash
cd ~/.claude
git add skills/przejmij-json/SKILL.md
git commit -m "przejmij-json: dokumentacja audio na kartach + liczników (Bez audio) + env" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>" -- skills/przejmij-json/SKILL.md
```

(Pliki memory commituj tylko, jeśli są śledzone w repo `~/.claude` — sprawdź `git ls-files projects/ | head`; jeśli nieśledzone, zostaw bez commita.)

---

## Weryfikacja końcowa (manualna, Krzysiek)

1. `npm run preview` → Safari `http://127.0.0.1:8123/podglad.html` → oznacz kilka zdań ⭐ → eksport → ✅, licznik się zgadza, drugi eksport mówi „wszystko wyeksportowane".
2. Otwarte Anki → `przejmij-json` na świeżym JSON-ie → karta w talii `angielski`: przód bez dźwięku, po odsłonięciu odpowiedzi gra głos EN.
