// Symulacja pełnego podejścia przez HTTP — "uczeń" mówi głosem TTS.
// Użycie: node tools/egzamin/sym.mjs   (serwer musi działać na 8124)
// Scenariusz celowo miesza jakość: dobre conditionale, ucieczka w 1st, odpowiedź 4-słowna.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ttsMp3 } from './api.mjs';

const BAZA = 'http://127.0.0.1:8124';
const REPO = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));

const ODPOWIEDZI = [
  "If that happened, I would probably double down on quality instead of quantity. I would pick one topic, make the best video I could, and if it still didn't work, I would ask my viewers directly what they need from me.",
  "I think it will be fine. I will just keep posting videos and I will see what happens. Probably the algorithm will pick something up eventually.",
  "I don't know, maybe yes.",
  "Looking back, if I had started a year earlier, I would have made all my beginner mistakes before anyone was watching. I would have built a small audience by now, and I might have avoided wasting money on ads.",
  "I wish I had spent more time on thumbnails. If only I had understood how much they matter, my first videos would have gotten more clicks. I should have studied other channels before publishing anything.",
  "I could have handled it better, definitely. I should have taken a break instead of forcing three videos in one week. I might have kept more energy for the important things, like talking to my students.",
];

async function post(sciezka, opcje = {}) {
  const r = await fetch(BAZA + sciezka, { method: 'POST', ...opcje });
  const j = await r.json();
  if (!r.ok) throw new Error(`${sciezka} ${r.status}: ${j.blad || ''}`);
  return j;
}

console.log('— START —');
let j = await post('/api/start');
const sesjaId = j.sesjaId;
console.log(`Sesja ${sesjaId}`);

let n = 0, followupy = 0;
while (!j.koniec) {
  n += 1;
  if (n > 12) throw new Error('Ponad 12 pytań — pętla się nie kończy');
  if (j.typ === 'followup') followupy += 1;
  console.log(`\n[${n}] blok ${j.blok.idx}/${j.blok.z} (${j.typ}) — ${j.blok.temat}`);
  const tekst = ODPOWIEDZI[(n - 1) % ODPOWIEDZI.length];
  console.log(`    odpowiadam: "${tekst.slice(0, 60)}…"`);
  const audio = await ttsMp3(tekst);
  j = await post('/api/odpowiedz', {
    headers: { 'X-Sesja': sesjaId, 'Content-Type': 'audio/mpeg' },
    body: audio,
  });
  console.log(`    transkrypt: "${(j.transkrypt || '').slice(0, 60)}…"`);
}
console.log(`\n— KONIEC po ${n} odpowiedziach (follow-upów: ${followupy}) —`);

// Asserty na artefaktach
const dir = path.join(REPO, 'egzaminy', 'm3', sesjaId);
const musi = ['plan.json', 'wymiany.json', 'pytanie-1.mp3', 'odpowiedz-1.mp3'];
for (const f of musi) {
  if (!fs.existsSync(path.join(dir, f))) throw new Error(`Brak artefaktu: ${f}`);
}
const wymiany = JSON.parse(fs.readFileSync(path.join(dir, 'wymiany.json'), 'utf8'));
if (wymiany.length !== n) throw new Error(`wymiany.json ma ${wymiany.length} wpisów, odpowiedzi było ${n}`);
if (!wymiany.every(w => w.transkrypt && w.metryki)) throw new Error('Wymiana bez transkryptu/metryk');
if (n < 4) throw new Error('Mniej niż 4 wypowiedzi');
if (followupy < 1) throw new Error('Zero follow-upów — ucieczka w 1st cond powinna wymusić follow-up');
console.log('SYM OK:', { odpowiedzi: n, followupy, sesjaId });
