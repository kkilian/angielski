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
function kAudioSources() {
  const courseRoot = path.join(ROOT, 'K');
  return fs.readdirSync(courseRoot)
    .filter((name) => /^\d{2}-k\d+-/.test(name))
    .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))
    .flatMap((dir) => fs.readdirSync(path.join(courseRoot, dir))
      .filter((file) => /^grupa-\d+\.mp3$/.test(file))
      .sort((a, b) => Number.parseInt(a.slice(6), 10) - Number.parseInt(b.slice(6), 10))
      .map((file) => `K/${dir}/${file}`));
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
  assert.match(html, new RegExp(`Odtwórz cały Kurs K · ${sources.length} grup`));
  assert.ok(html.includes(sources[0]), `brak pierwszej grupy audio: ${sources[0]}`);
  assert.ok(html.includes(sources.at(-1)), `brak ostatniej grupy audio: ${sources.at(-1)}`);
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
