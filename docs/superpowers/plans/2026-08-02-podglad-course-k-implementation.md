# Course K Preview Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodać K1 i K2 do generowanego `podglad.html` z pełnym trybem nauki, audio oraz całkowicie osobnymi gwiazdkami, powtórkami i eksportem od Kursu M.

**Architecture:** `tools/build-podglad.js` nadal generuje jeden samodzielny HTML, ale jego model danych jawnie rozróżnia kurs `m` i `k`. Dane K są skanowane wyłącznie z `K/` i `K/slownik-k.json`; wspólne funkcje renderują tabele i audio, natomiast stan przeglądarki jest wybierany według aktywnego kursu. Istniejące klucze M pozostają bez zmian, aby zachować zapisane gwiazdki użytkownika.

**Tech Stack:** Node.js ESM, `node:test`, statyczny HTML/CSS/JavaScript, `localStorage`, natywny `<audio>`.

## Global Constraints

- K1 i K2 odczytują zależności wyłącznie z `K/slownik-k.json`.
- Kurs K używa kluczy `kurs.k.stars` i `kurs.k.exported`.
- Kurs M zachowuje klucze `kurs.stars` i `kurs.exported` oraz dotychczasowy kształt kart eksportu.
- K oferuje blur, odsłanianie kliknięciem i klawiaturą, gwiazdki, powtórki, eksport oraz audio.
- Kafel M10 i wszystkie obecne widoki M zachowują swoje działanie i wygląd.
- `podglad.html` jest artefaktem generowanym; źródłem zmian jest renderer w `tools/`.
- Nie modyfikować treści, PDF-ów, MP3 ani plików mikrowitryny `k.html`.

---

## File Structure

- Create: `tools/build-podglad.test.mjs` — test kontraktu wygenerowanego HTML dla M i K.
- Modify: `tools/build-podglad.js` — skanowanie danych, model kursu, render K, nawigacja, osobny stan i eksport.
- Generate locally: `podglad.html` — gotowy podgląd otwierany przez użytkownika; plik pozostaje ignorowany przez Git.
- Modify: `docs/superpowers/plans/2026-08-02-podglad-course-k-implementation.md` — zaznaczenie wykonanych kroków.

### Task 1: Test kontraktu Kursu K i model danych generatora

**Files:**
- Create: `tools/build-podglad.test.mjs`
- Modify: `tools/build-podglad.js`

**Interfaces:**
- Consumes: `slownik.json`, `K/slownik-k.json`, katalogi `NN-mXdY-*`, katalogi `K/NN-kN-*`.
- Produces: rekord działu `{ course, id, chapter, label, dir, parsed, sentenceCount, newExpressions, blocks, audio }` oraz wygenerowany HTML zawierający widok `data-view="k"`.

- [ ] **Step 1: Napisz test, który buduje podgląd i wymaga pełnej obecności K1/K2**

Utwórz `tools/build-podglad.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'podglad.html');

function buildPreview() {
  const run = spawnSync(process.execPath, ['tools/build-podglad.js'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  return fs.readFileSync(OUT, 'utf8');
}

test('preview renders K1 and K2 as an independent course with all audio', () => {
  const html = buildPreview();
  assert.match(html, /data-go="k"/);
  assert.match(html, /data-view="k" data-course="k"/);
  assert.match(html, /id="k1"/);
  assert.match(html, /id="k2"/);
  assert.match(html, /Kurs K[^<]*Conversation Lab/);
  assert.match(html, /Odtwórz cały Kurs K · 10 grup/);
  assert.match(html, /K\/01-k1-powiedz-to-raz\/grupa-1\.mp3/);
  assert.match(html, /K\/02-k2-kintsugi\/grupa-5\.mp3/);
  assert.ok((html.match(/data-course="k"/g) || []).length > 100);
});

test('preview keeps the existing M course present', () => {
  const html = buildPreview();
  assert.match(html, /data-go="m1"/);
  assert.match(html, /data-view="m1" data-course="m"/);
  assert.match(html, /data-go="m10"/);
  assert.match(html, /id="m1-d1"/);
});
```

- [ ] **Step 2: Uruchom test i potwierdź RED**

Run:

```bash
node --test tools/build-podglad.test.mjs
```

Expected: oba testy kończą się `FAIL`, ponieważ obecny HTML nie zawiera `data-go="k"`, `data-view="k"` ani nowego identyfikatora `data-go="m1"`.

- [ ] **Step 3: Dodaj jawne rejestry i funkcje zależności per kurs**

W `tools/build-podglad.js` odczytaj oba rejestry:

```js
const mRegistry = JSON.parse(fs.readFileSync(path.join(ROOT, 'slownik.json'), 'utf8'));
const kRegistry = JSON.parse(fs.readFileSync(path.join(ROOT, 'K', 'slownik-k.json'), 'utf8'));
```

Zamień globalne zależności od `slownik` i `LEX` na funkcje z jawnym rejestrem:

```js
function newExprFor(registry, dzialId, etap = null) {
  if (etap && ['II', 'IV', 'V'].includes(etap)) return [];
  return (registry.wyrazenia || [])
    .filter((expression) => expression.intro === dzialId)
    .map((expression) => expression.en);
}

function blocksForDzial(registry, id) {
  return (registry.wyrazenia || [])
    .filter((expression) => expression.typ !== 'gramatyka')
    .filter((expression) => expression.intro === id || (expression.review || []).includes(id))
    .map((expression) => {
      let re = null;
      try { re = new RegExp(`(${termSourcesFor(expression.en).join('|')})`, 'i'); } catch {}
      return { id: expression.id, re };
    })
    .filter((block) => block.re);
}
```

Wywołania M muszą przekazywać `mRegistry`; wywołania K muszą przekazywać `kRegistry`.

- [ ] **Step 4: Zbuduj rekordy K tylko z katalogu `K/`**

Dodaj skanowanie:

```js
const kRoot = path.join(ROOT, 'K');
const kDirs = fs.readdirSync(kRoot)
  .filter((name) => /^(\d{2})-k(\d+)-/.test(name)
    && fs.existsSync(path.join(kRoot, name, 'rozdzial.md')))
  .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));

const kItems = kDirs.map((name) => {
  const chapter = Number(name.match(/^(\d{2})-k(\d+)-/)[2]);
  const id = `k${chapter}`;
  const dir = `K/${name}`;
  const parsed = parse(fs.readFileSync(path.join(ROOT, dir, 'rozdzial.md'), 'utf8'));
  return {
    course: 'k', id, chapter, label: `K${chapter}`, dir, parsed,
    sentenceCount: parsed.groups.reduce((sum, group) => sum + group.rows.length, 0),
    newExpressions: newExprFor(kRegistry, id),
    blocks: blocksForDzial(kRegistry, id),
    audio: audioForDir(dir),
  };
});
```

Każdy istniejący rekord M otrzymuje `course: 'm'`, `chapter: ln` i `label: `M${mk} · D${ln}``.

- [ ] **Step 5: Wydziel wspólny renderer wierszy i działów**

Dodaj `renderRows(item, group)` oraz `renderArticle(item)` i upewnij się, że każdy wiersz ma:

```html
<tr data-k="…" data-pl="…" data-en="…" data-targets="[…]"
    data-blocks="[…]" data-course="k" data-chapter="K1">
```

Dla M pozostaw także `data-mk` i `data-d`, ponieważ istniejący format eksportu ich potrzebuje. Etykiety odtwarzacza K używają `K1`, `K2`; etykiety M pozostają `D1`, `D2` itd.

- [ ] **Step 6: Wyrenderuj jeden widok K z dwoma działami**

Dodaj kafel `data-go="k"`, grupę nawigacji `data-view="k"` oraz sekcję:

```html
<section class="mk-view course-k" data-view="k" data-course="k">
  <div class="mkhead">
    <h2>Kurs K · Conversation Lab</h2>
    <p>Rozwojowa ścieżka B2 → C1 z realnych rozmów i materiałów od lektora.</p>
    <!-- play button z kolejką wszystkich plików K1, potem K2 -->
  </div>
  <!-- K1 article, K2 article -->
</section>
```

Kafel M zmienia `data-go="1"` na `data-go="m1"`; widok i nawigacja M dostają odpowiednio `data-view="m1" data-course="m"`.

- [ ] **Step 7: Uruchom test i potwierdź GREEN dla modelu i renderu**

Run:

```bash
node --test tools/build-podglad.test.mjs
```

Expected: `2 tests`, `2 pass`, `0 fail`.

- [ ] **Step 8: Commit**

```bash
git add tools/build-podglad.js tools/build-podglad.test.mjs
git commit -m "feat: render course K in learning preview"
```

### Task 2: Osobne gwiazdki, powtórki i eksport K

**Files:**
- Modify: `tools/build-podglad.test.mjs`
- Modify: `tools/build-podglad.js`

**Interfaces:**
- Consumes: `data-course` i `data-chapter` z Task 1.
- Produces: `STORE_KEYS`, `activeCourse`, `stateFor(course)`, `setActiveCourse(course)` oraz `collectStarredCards()` filtrujące aktywny kurs.

- [ ] **Step 1: Dodaj failing test izolacji stanu i kontraktu eksportu**

Dopisz do testu:

```js
test('K review storage and export are isolated from M', () => {
  const html = buildPreview();
  assert.match(html, /stars:'kurs\.k\.stars'/);
  assert.match(html, /exported:'kurs\.k\.exported'/);
  assert.match(html, /m:\{stars:'kurs\.stars',exported:'kurs\.exported'\}/);
  assert.match(html, /tr\.dataset\.course!==activeCourse/);
  assert.match(html, /course:'K',chapter:tr\.dataset\.chapter/);
  assert.match(html, /deck:activeCourse==='k'\?'angielski-k':'angielski'/);
});
```

- [ ] **Step 2: Uruchom test i potwierdź RED**

Run:

```bash
node --test tools/build-podglad.test.mjs
```

Expected: trzeci test kończy się `FAIL`, bo skrypt używa jeszcze jednego globalnego `Set` i kluczy M.

- [ ] **Step 3: Zastąp globalny stan mapą dwóch kursów**

W skrypcie przeglądarkowym wygenerowanego HTML użyj:

```js
const STORE_KEYS={
  m:{stars:'kurs.stars',exported:'kurs.exported'},
  k:{stars:'kurs.k.stars',exported:'kurs.k.exported'}
};
let activeCourse='m';
const reviewState={};

function loadSet(key){
  try{return new Set(JSON.parse(localStorage.getItem(key)||'[]'));}
  catch{return new Set();}
}
function stateFor(course){
  if(!STORE_KEYS[course]) throw new Error('Nieznany kurs: '+course);
  if(!reviewState[course]) reviewState[course]={
    stars:loadSet(STORE_KEYS[course].stars),
    exported:loadSet(STORE_KEYS[course].exported)
  };
  return reviewState[course];
}
function saveCourse(course){
  const state=stateFor(course), keys=STORE_KEYS[course];
  try{
    localStorage.setItem(keys.stars,JSON.stringify([...state.stars]));
    localStorage.setItem(keys.exported,JSON.stringify([...state.exported]));
  }catch{}
}
```

`markStars`, `refreshCounts`, `buildReview`, obsługa kliknięcia gwiazdki i `freshKeys` pobierają `const {stars, exported}=stateFor(activeCourse)`. `markStars` zeruje ikonę wierszy innego kursu i nie miesza ich ze stanem aktywnego kursu.

- [ ] **Step 4: Filtruj panel powtórek według aktywnego kursu**

W `buildReview()` pomiń wiersz, gdy:

```js
if(tr.dataset.course!==activeCourse) return;
```

Dodaj `setActiveCourse(course)`, która ustawia `activeCourse`, wpisuje `M` lub `K` do etykiet przycisku powtórek i eksportu, a następnie wywołuje `markStars()` i `refreshCounts()`.

- [ ] **Step 5: Zachowaj eksport M i dodaj jawny eksport K**

W `collectStarredCards()` filtruj po `data-course`. Kartę twórz warunkowo:

```js
cards.push(activeCourse==='k'
  ? {pl:tr.dataset.pl,en:tr.dataset.en,targets,blocks,course:'K',chapter:tr.dataset.chapter}
  : {pl:tr.dataset.pl,en:tr.dataset.en,targets,blocks,mk:Number(tr.dataset.mk),d:Number(tr.dataset.d)});
```

Metadane i nazwa pliku używają:

```js
const out={
  source:'angielski-podglad',
  deck:activeCourse==='k'?'angielski-k':'angielski',
  exportedAt:new Date().toISOString(),
  cards:picked.cards
};
const suffix=activeCourse==='k'?'-k':'';
a.download='powtorki-angielski'+suffix+'-'+dateStamp+'.json';
```

Dopiero po skutecznym uruchomieniu pobrania dopisz wybrane klucze do `stateFor(activeCourse).exported`.

- [ ] **Step 6: Uruchom test i potwierdź GREEN**

Run:

```bash
node --test tools/build-podglad.test.mjs
```

Expected: `3 tests`, `3 pass`, `0 fail`.

- [ ] **Step 7: Commit**

```bash
git add tools/build-podglad.js tools/build-podglad.test.mjs
git commit -m "feat: isolate K review and Anki export"
```

### Task 3: Nawigacja, blur i odświeżony motyw K

**Files:**
- Modify: `tools/build-podglad.test.mjs`
- Modify: `tools/build-podglad.js`

**Interfaces:**
- Consumes: widoki `data-view="mN|k"`, `setActiveCourse(course)` i wspólny renderer z wcześniejszych zadań.
- Produces: `showView(viewId)`, dostępna klawiaturą kontrola blur oraz rozpoznawalny wizualnie widok K.

- [ ] **Step 1: Dodaj failing test zachowań i semantyki interfejsu**

Dopisz:

```js
test('K uses the complete study UI and a distinct visual theme', () => {
  const html = buildPreview();
  assert.match(html, /\.course-k\{--accent:#a66a19/);
  assert.match(html, /aria-label="Odsłoń angielskie zdanie"/);
  assert.match(html, /tabindex="0"/);
  assert.match(html, /function showView\(viewId\)/);
  assert.match(html, /setActiveCourse\(view\.dataset\.course\)/);
  assert.match(html, /#sidenav a\[href\^="#"\]/);
  assert.match(html, /K1 · Powiedz to jasno za pierwszym razem/);
  assert.match(html, /K2 · Kintsugi: siła niedoskonałości/);
});
```

- [ ] **Step 2: Uruchom test i potwierdź RED**

Run:

```bash
node --test tools/build-podglad.test.mjs
```

Expected: czwarty test kończy się `FAIL`, dopóki nawigacja i dostępny blur nie są gotowe.

- [ ] **Step 3: Uogólnij nawigację z numeru M na identyfikator widoku**

Zastąp `showMk(n)` funkcją:

```js
function showView(viewId){
  const view=document.querySelector('.mk-view[data-view="'+viewId+'"]');
  if(!view) return;
  document.getElementById('home').classList.remove('is-active');
  document.querySelectorAll('.mk-view').forEach((item)=>item.classList.toggle('is-active',item===view));
  document.querySelectorAll('.navgroup').forEach((group)=>group.classList.toggle('is-active',group.dataset.view===viewId));
  setActiveCourse(view.dataset.course);
  sidenav.classList.add('is-active');
  backHomeBtn.hidden=false;
  titleEl.textContent=VIEW_TITLES[viewId]||'Angielski — podgląd';
  window.scrollTo(0,0);
}
```

Kliknięcie kafla wywołuje `showView(tile.dataset.go)`. Kliknięcie każdego linku działu w sidenav używa `#sidenav a[href^="#"]`, odnajduje najbliższy `.mk-view` i przekazuje jego `data-view`.

- [ ] **Step 4: Dodaj pełną obsługę odsłaniania myszą i klawiaturą**

Każde `td.en` w tabelach zdań otrzymuje `tabindex="0"` oraz `aria-label="Odsłoń angielskie zdanie"`. Wspólną funkcję przełączającą wywołują `click` i `keydown` dla `Enter` albo spacji:

```js
function revealEnglish(target){
  const td=target.closest('td.en');
  if(td&&(body.classList.contains('study')||body.classList.contains('review-mode'))) td.classList.toggle('show');
}
document.addEventListener('keydown',(event)=>{
  if((event.key==='Enter'||event.key===' ')&&event.target.matches('td.en')){
    event.preventDefault();
    revealEnglish(event.target);
  }
});
```

Istniejący tryb `body.study td.en { filter: blur(5px) }` pozostaje wspólny dla M i K.

- [ ] **Step 5: Dodaj wizualną sekcję K bez zmiany motywów M**

Dodaj CSS:

```css
.course-section{margin-top:22px}
.course-section-title{margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.tile[data-go="k"]{border-color:#d9bd87;background:linear-gradient(135deg,#fffaf0,#f5ead4)}
.tile[data-go="k"] .t-num{color:#8a5817}
.course-k{--accent:#a66a19;--line:#e4d5b8}
.course-k .mkhead{background:linear-gradient(135deg,rgba(255,250,240,.8),rgba(238,224,194,.45));padding:18px;border-radius:14px}
.course-k .chip{background:#f6eddc;border-color:#dfc99d;color:#704816}
```

Na home umieść osobne nagłówki `Kurs M` i `Kurs K · Conversation Lab`. Zaktualizuj tytuł dokumentu, intro i footer tak, aby nie wymieniały tylko M1/M2 ani nie opisywały gwiazdek jako wspólnych między M i K.

- [ ] **Step 6: Napraw selektor motywu M10 po zmianie `data-go`**

Zamień selektory:

```css
.tile[data-go="m10"]{--accent:#b45309;border-color:#f59e0b;background:linear-gradient(135deg,#fff7ed,#ffe4e6)}
.tile[data-go="m10"]:hover{border-color:#b45309}
.mk-view[data-view="m10"],.navgroup[data-view="m10"] { --accent:#b45309; }
```

- [ ] **Step 7: Uruchom test i potwierdź GREEN**

Run:

```bash
node --test tools/build-podglad.test.mjs
```

Expected: `4 tests`, `4 pass`, `0 fail`.

- [ ] **Step 8: Commit**

```bash
git add tools/build-podglad.js tools/build-podglad.test.mjs
git commit -m "feat: finish course-aware preview navigation"
```

### Task 4: Regresja, interakcje i finalny lokalny build

**Files:**
- Modify if a verified defect is found: `tools/build-podglad.js`
- Modify if the contract needs coverage for that defect: `tools/build-podglad.test.mjs`
- Generate locally: `podglad.html`

**Interfaces:**
- Consumes: kompletny generator i test kontraktu.
- Produces: zweryfikowany `/Users/krzysztofkilian/angielski/podglad.html` gotowy do otwarcia przez `file://`.

- [ ] **Step 1: Uruchom pełny zestaw testów repozytorium**

Run:

```bash
node --test tools/build-podglad.test.mjs tools/generate-k.test.mjs tools/k-site.test.mjs tools/egzamin/metryki.test.mjs tools/egzamin/werdykt.test.mjs
```

Expected: wszystkie testy kończą się `pass`, `fail 0`.

- [ ] **Step 2: Przebuduj końcowy plik i sprawdź zasoby audio**

Run:

```bash
node tools/build-podglad.js
test -s podglad.html
test "$(find K -type f -name 'grupa-*.mp3' | wc -l | tr -d ' ')" = "10"
```

Expected: generator wypisuje M1, M2, M3, M4, M9, M10 oraz Kurs K; oba polecenia `test` zwracają kod 0.

- [ ] **Step 3: Zweryfikuj przepływ M w przeglądarce**

Uruchom lokalny serwer `npm run preview` lub `node tools/serve.mjs`, otwórz `http://127.0.0.1:8123/podglad.html` i sprawdź:

1. M1 otwiera się z boczną nawigacją.
2. Blur ukrywa EN, kliknięcie oraz Enter odsłaniają zdanie.
3. Gwiazdka M zwiększa licznik M i pojawia się w powtórkach M.
4. Kafel M10 zachowuje motyw świtu.
5. Konsola nie zawiera wyjątków JavaScript.

- [ ] **Step 4: Zweryfikuj przepływ K w przeglądarce**

W tej samej sesji sprawdź:

1. Kafel Kurs K otwiera K1 i K2.
2. Blur, kliknięcie i Enter działają na zwykłym wierszu oraz w scence.
3. Gwiazdka K nie zwiększa licznika po powrocie do M.
4. Powtórki K zawierają tylko zdania K.
5. Eksport K zawiera `deck: "angielski-k"`, `course: "K"`, `chapter: "K1"` albo `"K2"` i nie zawiera pól `mk: null`.
6. Audio grupy K1 oraz kolejka całego K rozpoczynają odtwarzanie z istniejącej ścieżki.
7. Widok mieści się w szerokości telefonu i desktopu bez poziomego przewijania całej strony.

- [ ] **Step 5: Jeśli QA ujawni błąd, dodaj reprodukujący test przed poprawką**

Każdy wykryty defekt najpierw otrzymuje osobny przypadek w `tools/build-podglad.test.mjs`, który kończy się `FAIL`; następnie minimalna zmiana w generatorze doprowadza go do `PASS`. Po poprawce ponownie wykonaj kroki 1–4.

- [ ] **Step 6: Sprawdź diff i status**

Run:

```bash
git diff --check
git status --short
git diff --stat HEAD~3..HEAD
```

Expected: `git diff --check` nie wypisuje błędów; śledzone zmiany dotyczą wyłącznie generatora, testu i dokumentacji planu; `podglad.html` nie pojawia się jako plik do commita.

- [ ] **Step 7: Commit ewentualnej poprawki z QA**

Jeżeli Task 4 zmienił śledzone pliki:

```bash
git add tools/build-podglad.js tools/build-podglad.test.mjs
git commit -m "fix: harden course K preview interactions"
```

Jeżeli Task 4 nie zmienił śledzonych plików, nie twórz pustego commita.
