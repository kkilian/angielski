import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { cleanTitle, cycleRepeat, fmt, nextIndex } from '../k-app.js';

test('k.html is isolated from the M site and exposes one native audio element', () => {
  const html = fs.readFileSync(new URL('../k.html', import.meta.url), 'utf8');
  assert.equal((html.match(/<audio\b/g) || []).length, 1);
  assert.match(html, /href="k-style\.css"/);
  assert.match(html, /src="k-app\.js"/);
  assert.doesNotMatch(html, /(?:^|["'])content\.json/);
  assert.match(html, /aria-label="Wstecz"/);
  assert.match(html, /aria-label="Postęp odtwarzania"/);
  assert.match(html, /<meta name="description" content="[^"]+">/);
});

test('player helpers keep K playback behavior predictable', () => {
  assert.equal(fmt(0), '0:00');
  assert.equal(fmt(65.8), '1:05');
  assert.equal(cycleRepeat('off'), 'one');
  assert.equal(cycleRepeat('one'), 'all');
  assert.equal(cycleRepeat('all'), 'off');
  assert.equal(nextIndex(0, 2), 1);
  assert.equal(nextIndex(1, 2), 0);
  assert.equal(cleanTitle('K2 · Kintsugi: siła niedoskonałości'), 'Kintsugi: siła niedoskonałości');
});

test('M homepage links to course K', () => {
  const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
  assert.match(app, /href="k\.html"/);
  assert.match(app, /Conversation Lab/);
});

test('K storage uses its own namespace', () => {
  const app = fs.readFileSync(new URL('../k-app.js', import.meta.url), 'utf8');
  assert.match(app, /ang\.k\.repeat/);
  assert.match(app, /ang\.k\.last/);
  assert.match(app, /k-content\.json/);
  assert.match(app, /Tryb pętli:.*Zmień tryb/);
  assert.doesNotMatch(app, /fetch\(['"]content\.json/);
});

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
