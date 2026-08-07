import test from 'node:test';
import assert from 'node:assert/strict';

import { budujKolejke, nastepny, poprzedniaPara, nastepnaPara, opisBlokady, nastepnyTryb, zdanieDla } from '../pary.js';

const GRUPA = {
  n: 3, tryb: 'pl2en',
  pary: [
    { n: 1, cue: { src: 'audio/g3-p01-cue.mp3', sek: 9 }, wzor: { src: 'audio/g3-p01-en.mp3', sek: 4 },
      tekst: { pyt: null, pl: 'Wyleciało mi słowo.', en: "I'm blanking on the word." } },
    { n: 2, cue: { src: 'audio/g3-p02-cue.mp3', sek: 8 }, wzor: { src: 'audio/g3-p02-en.mp3', sek: 3 },
      tekst: { pyt: null, pl: 'Daj mi sekundę.', en: 'Give me a sec.' } },
  ],
};

test('kolejka przeplata wyzwalacz z wzorcem i doklei wersje', () => {
  const q = budujKolejke(GRUPA, 1785822079612);
  assert.equal(q.length, 4);
  assert.equal(q[0].rola, 'cue');
  assert.equal(q[1].rola, 'wzor');
  assert.equal(q[0].para, 1);
  assert.equal(q[2].para, 2);
  assert.equal(q[0].src, 'audio/g3-p01-cue.mp3?v=1785822079612');
});

test('tryb off zatrzymuje sie po ostatnim elemencie', () => {
  assert.equal(nastepny(0, 4, 'off'), 1);
  assert.equal(nastepny(3, 4, 'off'), null);
});

test('tryb para wraca z wzorca na ten sam wyzwalacz', () => {
  assert.equal(nastepny(0, 4, 'para'), 1);
  assert.equal(nastepny(1, 4, 'para'), 0);
  assert.equal(nastepny(3, 4, 'para'), 2);
});

test('tryb grupa zawija na poczatek grupy', () => {
  assert.equal(nastepny(3, 4, 'grupa'), 0);
  assert.equal(nastepny(1, 4, 'grupa'), 2);
});

test('tryb caly sygnalizuje wyjscie poza grupe', () => {
  assert.equal(nastepny(3, 4, 'caly'), null);
  assert.equal(nastepny(1, 4, 'caly'), 2);
});

test('skok po parach zawsze lezy na wyzwalaczu', () => {
  assert.equal(nastepnaPara(0, 4), 2);
  assert.equal(nastepnaPara(1, 4), 2);
  assert.equal(nastepnaPara(3, 4), 0, 'z ostatniej pary wracamy na pierwsza');
  assert.equal(poprzedniaPara(2), 0);
  assert.equal(poprzedniaPara(3), 2, 'z wzorca wracamy na wyzwalacz tej samej pary');
  assert.equal(poprzedniaPara(0), 0);
});

test('opis na ekran blokady zmienia sie z wyzwalacza na wzorzec', () => {
  const q = budujKolejke(GRUPA, 1);
  const ctx = { grupa: 3, ilePar: 2 };
  assert.deepEqual(opisBlokady(q[0], ctx), {
    title: 'Wyleciało mi słowo.', artist: 'Grupa 3 · para 1/2',
  });
  assert.deepEqual(opisBlokady(q[1], ctx), {
    title: "I'm blanking on the word.", artist: 'Wyleciało mi słowo.',
  });
});

test('scenka pokazuje pytanie EN jako wyzwalacz', () => {
  const grupa = { n: 5, tryb: 'scenka', pary: [{ n: 1,
    cue: { src: 'a.mp3', sek: 12 }, wzor: { src: 'b.mp3', sek: 4 },
    tekst: { pyt: 'How are you?', pl: 'Powiedz, że dobrze.', en: 'Doing great.' } }] };
  const q = budujKolejke(grupa, 1);
  assert.equal(opisBlokady(q[0], { grupa: 5, ilePar: 1 }).title, 'How are you?');
  assert.equal(opisBlokady(q[1], { grupa: 5, ilePar: 1 }).title, 'Doing great.');
});

test('stan „para" wypada z cyklu, gdy dzial nie ma par', () => {
  assert.equal(nastepnyTryb('off', true), 'para');
  assert.equal(nastepnyTryb('para', true), 'grupa');
  assert.equal(nastepnyTryb('caly', true), 'off');
  assert.equal(nastepnyTryb('off', false), 'grupa');
  assert.equal(nastepnyTryb('caly', false), 'off');
});

test('sluchanka to jeden element kolejki, fraza z offsetow', () => {
  const grupa = { n: 1, tryb: 'sluchanka', src: 'grupa-1.mp3', zdania: [
    { pl: 'No i to jest to.', en: 'This is it.', t: [0, 4.2] },
    { pl: 'Ciągle myślę…', en: 'I keep thinking…', t: [4.2, 9.6] },
  ] };
  const q = budujKolejke(grupa, 77);
  assert.equal(q.length, 1);
  assert.equal(q[0].rola, 'sluchanka');
  assert.equal(q[0].src, 'grupa-1.mp3?v=77');
  assert.equal(zdanieDla(grupa.zdania, 0), 0);
  assert.equal(zdanieDla(grupa.zdania, 4.3), 1);
  assert.equal(zdanieDla(grupa.zdania, 99), 1, 'poza koncem trzymamy sie ostatniego zdania');
});
