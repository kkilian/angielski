import test from 'node:test';
import assert from 'node:assert/strict';
import { werdykt } from './werdykt.mjs';

const RODZINY = ['2nd-cond', '3rd-cond', 'wish-if-only', 'modal-perfect'];
const PROGI = { rodziny: RODZINY, progProcent: 60, progOsB: 3 };

const okazja = (rodzina, wykorzystana, poprawne) => ({ rodzina, wykorzystana, poprawne });
const osB = (p, z, po, s) => ({
  plynnosc: { ocena: p }, zakres: { ocena: z }, poprawnosc: { ocena: po }, spojnosc: { ocena: s },
});

// komplet: każda rodzina wykorzystana poprawnie → 100%
const osAdobra = { okazje: RODZINY.map(r => okazja(r, true, true)) };

test('obie osie nad progiem → zdane', () => {
  const w = werdykt({ osA: osAdobra, osB: osB(3, 3, 3, 3) }, PROGI);
  assert.equal(w.zdane, true);
  assert.deepEqual(w.powody, []);
  assert.equal(w.osA.procent, 100);
});

test('oś A: procent poniżej progu → oblane z powodem', () => {
  // 4 rodziny poprawnie + 4 dodatkowe niewykorzystane = 50% < 60%
  const okazje = [...RODZINY.map(r => okazja(r, true, true)),
                  ...RODZINY.map(r => okazja(r, false, false))];
  const w = werdykt({ osA: { okazje }, osB: osB(4, 4, 4, 4) }, PROGI);
  assert.equal(w.zdane, false);
  assert.equal(w.osA.procent, 50);
  assert.match(w.powody[0], /50%/);
});

test('oś A: rodzina bez poprawnego użycia → oblane', () => {
  // 3rd-cond wykorzystana ale niepoprawna; procent = 100%
  const okazje = [okazja('2nd-cond', true, true), okazja('3rd-cond', true, false),
                  okazja('wish-if-only', true, true), okazja('modal-perfect', true, true)];
  const w = werdykt({ osA: { okazje }, osB: osB(3, 3, 3, 3) }, PROGI);
  assert.equal(w.zdane, false);
  assert.match(w.powody.join(' '), /3rd-cond/);
});

test('oś B: jedno kryterium poniżej progu → oblane', () => {
  const w = werdykt({ osA: osAdobra, osB: osB(3, 3, 2, 3) }, PROGI);
  assert.equal(w.zdane, false);
  assert.match(w.powody.join(' '), /poprawność.*2\/5/);
});

test('obie osie leżą → wszystkie powody wymienione', () => {
  const okazje = [okazja('2nd-cond', false, false), okazja('3rd-cond', false, false),
                  okazja('wish-if-only', true, true), okazja('modal-perfect', true, true)];
  const w = werdykt({ osA: { okazje }, osB: osB(2, 3, 2, 3) }, PROGI);
  assert.equal(w.zdane, false);
  assert.ok(w.powody.length >= 4); // procent + 2 rodziny + 2 kryteria osi B
});

test('puste/brakujące dane → oblane, nie wybuch', () => {
  const w = werdykt({ osA: { okazje: [] }, osB: {} }, PROGI);
  assert.equal(w.zdane, false);
  assert.equal(w.osA.procent, 0);
});
