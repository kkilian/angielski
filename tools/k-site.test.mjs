import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { cleanTitle, cycleRepeat, fmt, nextIndex, RUNDY_432, stan432, krok432 } from '../k-app.js';

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

test('ekran 4/3/2 ma przycisk w wierszu grupy, wlasna trase i wlasny styl', () => {
  const app = fs.readFileSync(new URL('../k-app.js', import.meta.url), 'utf8');
  assert.match(app, /data-action="432"/);
  assert.match(app, /\/432\//, 'trasa #/k/kN/432/i — swipe-back w iOS zamyka ekran, nie strone');
  assert.match(app, /pytanie432/);
  // updateActiveGroup() nadpisuje textContent kazdego .group-play-icon — nowy
  // przycisk nie moze uzywac tej klasy.
  assert.doesNotMatch(app, /class="group-play-icon"[^>]*data-action="432"/);

  const css = fs.readFileSync(new URL('../k-style.css', import.meta.url), 'utf8');
  assert.match(css, /\.group-432\s*\{/);
  assert.match(css, /\.ex432-clock/);
});

test('licznik 4/3/2 idzie 4:00 -> 3:00 -> 2:00, bije na koncu rundy, skip nie bije', () => {
  assert.deepEqual(RUNDY_432, [240, 180, 120]);

  let s = stan432();
  assert.deepEqual(
    { runda: s.runda, pozostalo: s.pozostalo, dziala: s.dziala, koniec: s.koniec },
    { runda: 0, pozostalo: 240, dziala: false, koniec: false },
  );

  // tik przy pauzie = no-op
  s = krok432(s, { typ: 'tik' });
  assert.equal(s.pozostalo, 240);

  s = krok432(s, { typ: 'start' });
  assert.equal(s.dziala, true);
  s = krok432(s, { typ: 'tik' });
  assert.equal(s.pozostalo, 239);
  assert.equal(s.sygnal, null);

  // do konca pierwszej rundy: przejscie na 3:00 + sygnal konca rundy
  for (let i = 0; i < 238; i += 1) s = krok432(s, { typ: 'tik' });
  assert.equal(s.pozostalo, 1);
  s = krok432(s, { typ: 'tik' });
  assert.equal(s.runda, 1);
  assert.equal(s.pozostalo, 180);
  assert.equal(s.sygnal, 'koniec-rundy');
  s = krok432(s, { typ: 'tik' });
  assert.equal(s.sygnal, null, 'sygnal jest jednorazowy');

  // skip przechodzi dalej bez sygnalu
  s = krok432(s, { typ: 'skip' });
  assert.equal(s.runda, 2);
  assert.equal(s.pozostalo, 120);
  assert.equal(s.sygnal, null);

  // koniec ostatniej rundy = koniec cwiczenia, licznik staje
  for (let i = 0; i < 120; i += 1) s = krok432(s, { typ: 'tik' });
  assert.equal(s.koniec, true);
  assert.equal(s.dziala, false);
  assert.equal(s.sygnal, 'koniec');
  s = krok432(s, { typ: 'tik' });
  assert.equal(s.koniec, true, 'po koncu tik nic nie zmienia');

  // start po koncu = restart od rundy 0
  s = krok432(s, { typ: 'start' });
  assert.deepEqual(
    { runda: s.runda, pozostalo: s.pozostalo, dziala: s.dziala, koniec: s.koniec },
    { runda: 0, pozostalo: 240, dziala: true, koniec: false },
  );

  // pauza zatrzymuje bez utraty czasu
  s = krok432(s, { typ: 'tik' });
  s = krok432(s, { typ: 'pauza' });
  assert.equal(s.dziala, false);
  assert.equal(s.pozostalo, 239);
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
