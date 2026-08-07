import test from 'node:test';
import assert from 'node:assert/strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { dopasujCisze, punktyCiecia, zaplanujDzial } from './potnij.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

// Regresja: K1 grupa 2, para 3. Zdanie „I'm blanking on the word — give me a second."
// ma po myslniku pauze 0.82 s. Przy tolerancji 0.2 ta pauza przechodzila prog ciszy
// „koniec" (1.0 - 0.2 = 0.8) i kradla dopasowanie prawdziwej ciszy 1.28 s — wzorzec
// byl ucinany w polowie zdania. Prawdziwa cisza „koniec" mierzy sie zawsze >= 1.15 s.
test('pauza po myslniku nie kradnie dopasowania ciszy koncowej', () => {
  const oczekiwane = [{ sek: 6, rola: 'en' }, { sek: 1, rola: 'koniec' }];
  const wykryte = [
    { start: 25.79, end: 32.44 },  // 6.66 s — cisza na produkcje
    { start: 33.92, end: 34.75 },  // 0.82 s — pauza po myslniku w srodku zdania EN
    { start: 35.38, end: 36.66 },  // 1.28 s — prawdziwa cisza koncowa
  ];
  const r = dopasujCisze(oczekiwane, wykryte, 40);
  assert.equal(r.ok, true);
  assert.equal(r.dopasowane[1].start, 35.38, 'koniec pary to cisza 1.28 s, nie pauza 0.82 s');
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
  assert.deepEqual(pary[1], { cueOd: 11.3, cueDo: 20.1, wzorOd: 20.1, wzorDo: 25 });
});

test('ostatnia para siega konca pliku', () => {
  const dopasowane = [
    { sek: 3.6, rola: 'en', start: 4.0, end: 7.8 },
    { sek: 1, rola: 'koniec', start: 10.0, end: 11.5 },
  ];
  const pary = punktyCiecia(dopasowane, 11.5);
  assert.equal(pary[0].wzorDo, 11.5);
});

// Migracja jest jednorazowa: po niej grupa-N.mp3 juz nie istnieje i nie ma czego
// planowac. Testy ponizej maja sens tylko dla dzialu, ktory czeka na pociecie —
// zostawiamy je dla przyszlych dzialow (np. przeniesionych z Kursu M).
const doMigracji = (dir) => fs.existsSync(path.join(ROOT, 'K', dir, 'grupa-1.mp3'));

test('planuje caly dzial K2 na prawdziwych plikach', (t) => {
  if (!doMigracji('02-k2-kintsugi')) return t.skip('K2 jest juz w formacie 2');
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

test('planuje caly dzial K1 i K3', (t) => {
  const czekaja = ['01-k1-powiedz-to-raz', '03-k3-jednym-zdaniem'].filter(doMigracji);
  if (!czekaja.length) return t.skip('K1 i K3 sa juz w formacie 2');
  for (const dir of czekaja) {
    const r = zaplanujDzial(path.join(ROOT, 'K', dir));
    assert.equal(r.ok, true, `${dir}: ${r.powod}`);
  }
});
