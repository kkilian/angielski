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
