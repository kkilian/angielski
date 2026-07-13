import test from 'node:test';
import assert from 'node:assert/strict';
import { metryki } from './metryki.mjs';

// words: [{word, start, end}] w sekundach (whisper-1 verbose_json)
const slowo = (word, start, end) => ({ word, start, end });

test('normalna wypowiedź bez długich pauz', () => {
  const words = [
    slowo('If', 0.0, 0.2), slowo('I', 0.3, 0.4), slowo('had', 0.5, 0.8),
    slowo('more', 0.9, 1.2), slowo('time', 1.3, 1.7), slowo('I', 2.0, 2.1),
    slowo('would', 2.2, 2.5), slowo('travel', 2.6, 3.0),
  ];
  const m = metryki(words, 3.5);
  assert.equal(m.liczbaSlow, 8);
  assert.equal(m.pauzy.length, 0);
  assert.equal(m.czasSek, 3.5);
  // czas mówienia = span 0.0→3.0 = 3.0 s → 8 słów / 0.05 min = 160 wpm
  assert.equal(m.tempoNetto, 160);
  assert.equal(m.pauzeNaMin, 0);
});

test('wypowiedź z dwiema pauzami >=2 s', () => {
  const words = [
    slowo('Well', 0.0, 0.5),
    slowo('I', 3.0, 3.1),            // pauza 2.5 s (0.5→3.0)
    slowo('think', 3.2, 3.6),
    slowo('maybe', 6.0, 6.5),        // pauza 2.4 s (3.6→6.0)
    slowo('yes', 6.6, 7.0),
  ];
  const m = metryki(words, 8);
  assert.equal(m.pauzy.length, 2);
  assert.deepEqual(m.pauzy[0], { start: 0.5, dlugoscSek: 2.5 });
  assert.deepEqual(m.pauzy[1], { start: 3.6, dlugoscSek: 2.4 });
  // span 7.0 − pauzy 4.9 = 2.1 s mówienia → 5 / (2.1/60) ≈ 142.9 → 143
  assert.equal(m.tempoNetto, 143);
  // 2 pauzy / (8/60 min) = 15 na minutę
  assert.equal(m.pauzeNaMin, 15);
});

test('puste words — zera, nie NaN', () => {
  const m = metryki([], 0);
  assert.deepEqual(m, { liczbaSlow: 0, czasSek: 0, tempoNetto: 0, pauzy: [], pauzeNaMin: 0 });
});

test('jedno słowo', () => {
  const m = metryki([slowo('Yes', 1.0, 1.4)], 2);
  assert.equal(m.liczbaSlow, 1);
  assert.equal(m.pauzy.length, 0);
  // span 0.4 s → 1 / (0.4/60) = 150
  assert.equal(m.tempoNetto, 150);
});

test('pauza dokładnie 2.0 s liczy się jako pauza', () => {
  const words = [slowo('a', 0, 0.5), slowo('b', 2.5, 3.0)];
  const m = metryki(words, 3);
  assert.equal(m.pauzy.length, 1);
  assert.equal(m.pauzy[0].dlugoscSek, 2);
});
