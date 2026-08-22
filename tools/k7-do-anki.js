// Buduje cztery JSON-y (po jednym na grupę) do wgrania nowego K7 do Anki.
//
// DLACZEGO SKRYPT, A NIE RĘCZNIE: tmp/k4-grupa-*.json były pisane ręcznie i NIE MIAŁY
// pola `audio`, przez co add-cards.cjs schodził na płatne TTS zamiast użyć gotowych
// nagrań kursu. Tutaj ścieżki lecą wprost z audio.json, więc nie da się ich zgubić.
//
// Kształt pola `pl` zależy od trybu grupy (assemble-audio.js:227, tekstPary):
//   pl2en   → tekst.pl  = polski wyzwalacz
//   en-only → tekst.pyt = DOSŁOWNY cytat z lekcji + polecenie (tekst.pl jest null)
//
// Uruchom: node tools/k7-do-anki.js

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const DZIAL = 'K/07-k7-cztery-dziury';

const manifest = JSON.parse(fs.readFileSync(path.join(root, DZIAL, 'audio.json'), 'utf8'));
const slownik = JSON.parse(fs.readFileSync(path.join(root, 'K', 'slownik-k.json'), 'utf8'));

// Co pogrubić na karcie. NIE bierzemy tego ze slownik-k.json: tamtejsze pola `en`
// to przykłady z wielokropkami („It comes down to…", „a student → the student"),
// więc dosłowne dopasowanie ich nie znajduje. W dziale o KONSTRUKCJACH pogrubiamy
// poprawiony element, nie hasło słownikowe — indeks [grupa][para].
const KLOCKI = {
  1: [['had known', "wouldn't have gone"], ['had filled up', 'would have doubted'],
      ["hadn't quit", 'would have lost'], ['the authorities', 'had explained', 'would have trusted'],
      ['had stayed', 'would never have met'], ['I wish I had started'],
      ['unless', 'hard evidence'], ["If it hadn't been for", "wouldn't be talking"]],
  2: [['had already left'], ['By the time', 'had already changed'], ['had never lived'],
      ['had already cleared'], ['had been repeating'], ['must have read'],
      ["I've never read"], ["I've been learning", 'for three years']],
  3: [['a completely different culture'], ['a conspiracy theory'], ['a problem'],
      ['turned it into', 'a hospital'], ['About', 'a hundred politicians'],
      ['health care'], ['a documentary'], ['the real world']],
  4: [['sixteen hours a day'], ['about'], ['roughly', 'half the price'], ['around'],
      ["I'd say", 'the Illuminati'], ['with their money'], ['only squared'],
      ['It comes down to this']],
};

const outDir = path.join(root, 'tmp');
fs.mkdirSync(outDir, { recursive: true });

let razem = 0;
for (const g of manifest.grupy) {
  const cards = g.pary.map((para) => {
    const pl = g.tryb === 'en-only' ? para.tekst.pyt : para.tekst.pl;
    const en = para.tekst.en;
    if (!pl) throw new Error(`Grupa ${g.n}, para ${para.n}: brak tekstu wyzwalacza (tryb ${g.tryb})`);
    const targets = (KLOCKI[g.n]?.[para.n - 1] || []).filter((k) => en.toLowerCase().includes(k.toLowerCase()));
    if (!targets.length) throw new Error(`Grupa ${g.n}, para ${para.n}: żaden klocek nie pasuje do „${en}"`);
    return {
      pl,
      en,
      targets,
      audio: `${DZIAL}/${para.wzor.src.replace(/^audio\//, 'audio/')}`,
      course: 'K',
      chapter: 'K7',
    };
  });

  const out = {
    source: 'angielski-podglad',
    course: 'K',
    chapter: 'K7',
    group: g.n,
    deck: `angielski-k::K7::Grupa ${g.n}`,
    exportedAt: new Date().toISOString(),
    cards,
  };
  const plik = path.join(outDir, `k7-grupa-${g.n}.json`);
  fs.writeFileSync(plik, `${JSON.stringify(out, null, 2)}\n`);
  razem += cards.length;
  const bezTargetu = cards.filter((c) => !c.targets.length).length;
  console.log(`${plik}  ${String(cards.length).padStart(2)} kart  tryb ${g.tryb}${bezTargetu ? `  (bez klocka: ${bezTargetu})` : ''}`);
}
console.log(`\nRazem ${razem} kart w ${manifest.grupy.length} plikach.`);
console.log(`Wgranie:  for n in 1 2 3 4; do node ~/.claude/skills/przejmij-json/add-cards.cjs tmp/k7-grupa-$n.json --deck "angielski-k::K7::Grupa $n"; done`);
