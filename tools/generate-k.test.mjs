import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { buildKManifest } from './generate-k.js';

function write(root, relativePath, content = '') {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

test('buildKManifest scans only K and sorts chapters and audio numerically', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kurs-k-'));
  assert.ok(root.startsWith(path.join(os.tmpdir(), 'kurs-k-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  write(root, 'K/slownik-k.json', JSON.stringify({
    kurs: { id: 'k', tytul: 'Kurs K', opis: 'Osobny kurs' },
    dzialy: [
      { id: 'k1', folder: '01-k1-jeden', opis: 'Pierwszy dział' },
      { id: 'k2', folder: '02-k2-dwa', opis: 'Drugi dział' },
    ],
    wyrazenia: [],
  }));

  write(root, 'K/01-k1-jeden/rozdzial.md', '# K1 · Jeden / K1 · One\n');
  write(root, 'K/01-k1-jeden/rozdzial.pdf', 'pdf');
  write(root, 'K/01-k1-jeden/grupa-10.mp3', 'ten');
  write(root, 'K/01-k1-jeden/grupa-2.mp3', 'two');
  write(root, 'K/01-k1-jeden/grupa-1.mp3', 'one');
  write(root, 'K/02-k2-dwa/rozdzial.md', '# K2 · Dwa / K2 · Two\n');
  write(root, '01-m1d1-ignored/rozdzial.md', '# M1 / M1\n');

  const manifest = buildKManifest(root);

  assert.deepEqual(manifest.course, { id: 'k', title: 'Kurs K', description: 'Osobny kurs' });
  assert.equal(manifest.chapters.length, 2);
  assert.deepEqual(manifest.chapters.map((chapter) => chapter.id), ['k1', 'k2']);
  assert.deepEqual(manifest.chapters.map((chapter) => chapter.localNumber), [1, 2]);
  assert.equal(manifest.chapters[0].titlePl, 'K1 · Jeden');
  assert.equal(manifest.chapters[0].titleEn, 'K1 · One');
  assert.equal(manifest.chapters[0].pdf, 'K/01-k1-jeden/rozdzial.pdf');
  assert.deepEqual(manifest.chapters[0].groups.map((group) => group.n), [1, 2, 10]);
  assert.match(manifest.chapters[0].groups[0].src, /^K\/01-k1-jeden\/grupa-1\.mp3\?v=\d+$/);
  assert.equal(manifest.chapters[1].hasAudio, false);
  assert.equal(manifest.chapters[1].description, 'Drugi dział');
});
