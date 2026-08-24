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

// Rozmiar Kursu K rośnie z każdym działem — czytamy go z dysku, żeby test
// nie wymagał ręcznej aktualizacji przy K4, K5…
function kDzialy() {
  const courseRoot = path.join(ROOT, 'K');
  return fs.readdirSync(courseRoot)
    .filter((name) => /^\d{2}-k\d+-/.test(name))
    .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))
    .map((dir) => ({
      dir,
      manifest: JSON.parse(fs.readFileSync(path.join(courseRoot, dir, 'audio.json'), 'utf8')),
    }));
}

// Kurs K jest w formacie 2 — źródła audio biorą się z audio.json, nie z listy plików.
function kAudioSources() {
  return kDzialy().flatMap(({ dir, manifest }) =>
    manifest.grupy.flatMap((g) => (g.pary || []).flatMap((p) => [
      `K/${dir}/${p.cue.src}`, `K/${dir}/${p.wzor.src}`,
    ])));
}

// Przycisk „Odtwórz cały Kurs K" liczy grupy, nie pliki.
function kGroupCount() {
  return kDzialy().reduce((sum, { manifest }) => sum + manifest.grupy.length, 0);
}

test('preview renders every K chapter as an independent course with all audio', () => {
  const html = buildPreview();
  const sources = kAudioSources();
  assert.match(html, /data-go="k"/);
  assert.match(html, /data-view="k" data-course="k"/);
  assert.match(html, /id="k1"/);
  assert.match(html, /id="k2"/);
  assert.match(html, /id="k3"/);
  assert.match(html, /Kurs K[^<]*Conversation Lab/);
  assert.match(html, new RegExp(`Odtwórz cały Kurs K · ${kGroupCount()} grup`));
  assert.ok(html.includes(sources[0]), `brak pierwszej pary audio: ${sources[0]}`);
  assert.ok(html.includes(sources.at(-1)), `brak ostatniej pary audio: ${sources.at(-1)}`);
  assert.ok((html.match(/data-course="k"/g) || []).length > 100);
});

test('preview keeps the existing M course present', () => {
  const html = buildPreview();
  assert.match(html, /data-go="m1"/);
  assert.match(html, /data-view="m1" data-course="m"/);
  assert.match(html, /data-go="m10"/);
  assert.match(html, /id="m1-d1"/);
});

test('K review storage and export are isolated from M', () => {
  const html = buildPreview();
  assert.match(html, /stars:'kurs\.k\.stars'/);
  assert.match(html, /exported:'kurs\.k\.exported'/);
  assert.match(html, /m:\{stars:'kurs\.stars',exported:'kurs\.exported'\}/);
  assert.match(html, /tr\.dataset\.course!==activeCourse/);
  assert.match(html, /course:'K',chapter:tr\.dataset\.chapter/);
  assert.match(html, /deck:activeCourse==='k'\?'angielski-k':'angielski'/);
});

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

test('tryb GWIAZDKI ONLY: przycisk, filtr CSS tylko dla K, kolejka z gwiazdek', () => {
  const html = buildPreview();
  // przycisk w topbarze, domyślnie schowany
  assert.match(html, /<button id="stars-only" hidden[^>]*>⭐ GWIAZDKI ONLY<\/button>/);
  // filtr CSS — zawężony do Kursu K, żeby M zostało nietknięte
  assert.ok(html.includes('body.stars-only .course-k tr[data-k]:not(.starred){display:none}'));
  assert.ok(html.includes('body.stars-only .course-k section.group:not(:has(tr.starred)){display:none}'));
  assert.ok(html.includes('body.stars-only .course-k article.dzial:not(:has(tr.starred)){display:none}'));
  assert.ok(!html.includes('body.stars-only tr[data-k]:not(.starred)'), 'filtr nie moze byc globalny');
  // klasa .starred utrzymywana przy kazdej zmianie gwiazdki
  assert.ok(html.includes("tr.classList.toggle('starred',on)"));
  // przycisk widoczny wylacznie w Kursie K
  assert.ok(html.includes("starsOnlyBtn.hidden = course!=='k'"));
  // tryb celowo NIE jest zapisywany w localStorage
  assert.ok(!/localStorage[^\n]*stars-only/.test(html));
  // kolejka: format rozpoznajemy po pelnej liscie, gramy po przefiltrowanej
  assert.ok(html.includes('function tylkoGwiazdki(trs)'));
  assert.ok(html.includes('const grane=tylkoGwiazdki(trs);'));
  assert.ok(html.includes('if(!grane.length) return;'));
  assert.match(html, /if\(trs\.length\*2===list\.length\)/, 'detekcja formatu 2 nadal na pelnej liscie');
});

test('komentarz 4/3/2 z rozdzial.md nie wycieka do podgladu jako podpis grupy', () => {
  // parse() w build-podglad.js traktuje kazdy nie-mode'owy komentarz jako podpis
  // grupy (cur.cap) i renderuje go w <div class="gcap">. Pytania cwiczenia 4/3/2
  // (`<!-- 432: … -->`) mieszkaja w rozdzial.md i musza byc tam pomijane.
  const html = buildPreview();
  assert.doesNotMatch(html, /class="gcap">\s*432:/, 'pytanie 4/3/2 wyrenderowane jako podpis grupy');
});
