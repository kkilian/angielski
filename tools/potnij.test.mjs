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
