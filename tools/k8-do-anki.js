// Buduje pięć JSON-ów (po jednym na grupę) do wgrania K8 do Anki — klon tools/k7-do-anki.js.
//
// DLACZEGO SKRYPT, A NIE RĘCZNIE: ręczne tmp/k4-grupa-*.json nie miały pola `audio`, przez co
// add-cards.cjs schodził na płatne TTS zamiast użyć gotowych nagrań kursu. Tutaj ścieżki lecą
// wprost z audio.json, więc nie da się ich zgubić.
//
// Kształt pola `pl` zależy od trybu grupy (assemble-audio.js:227, tekstPary):
//   pl2en   → tekst.pl  = polski wyzwalacz
//   (do 25.08 G1/G4 chodziły w `en-only` i brały przód z tekst.pyt — cytat z nagrania
//    plus polecenie. Odrzucone: w Anki czytało się to jak protokół.)
//
// Uruchom: node tools/k8-do-anki.js

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const DZIAL = 'K/08-k8-piec-sufitow';

const manifest = JSON.parse(fs.readFileSync(path.join(root, DZIAL, 'audio.json'), 'utf8'));

// Co pogrubić na karcie — indeks [grupa][para]. Nie ze slownik-k.json (jak w K7): pogrubiamy
// POPRAWIONY element albo target grupy, dosłownie tak, jak stoi w odpowiedzi (case-insensitive).
// Skrypt rzuca, gdy żaden klocek nie pasuje — po recenzji zaktualizuj tę mapę, nie tekst.
const KLOCKI = {
  1: [['a bit of a rush'], ['a standard week', 'the last day'], ['a medical student'], ['an apartment'],
      ['a fifteen-minute walk', 'a seven-minute run'], ['a shared kitchen', 'a complete mess'], ['make a mess'],
      ['a shared room', 'another person', 'a room to yourself']],
  2: [['The principal'], ['The janitor'], ['elementary school'], ['best feature'], ['em dash', 'a dead giveaway'],
      ["I'm blanking on the word", 'janitor'], ["I'm not sure how to put it", 'the dorm', 'sort of like'],
      ['took advantage of', 'let the rest go', 'could only get better']],
  3: [['nasty'], ['filthy'], ['run-down', 'there were no'], ['a disaster'], ['Honestly', 'a disgrace'],
      ['in rough shape', 'run-down', 'filthy', 'pretty decent'], ['well kept', 'upscale', 'pricey'],
      ['depressing', 'grew on me', 'upscale', 'the commute is brutal']],
  4: [['on TV'], ['at some universities'], ['in a pan'], ['for all'], ['for me'], ['let me take the exam'],
      ['These days', 'content'], ['a high score', 'get into']],
  5: [['must have overslept', "otherwise he'd be"], ['must have disabled', 'would have gone off'],
      ['There must have been a reason', 'no one really knows'], ['must have seen'], ['must have been a bot'],
      ["couldn't have been worse"], ["If I'd known", 'would have moved out'], ['If I had to guess', 'might have been smoking']],
};

const outDir = path.join(root, 'tmp');
fs.mkdirSync(outDir, { recursive: true });

let razem = 0;
for (const g of manifest.grupy) {
  const cards = g.pary.map((para) => {
    const pl = para.tekst.pl;
    const en = para.tekst.en;
    if (!pl) throw new Error(`Grupa ${g.n}, para ${para.n}: brak tekstu wyzwalacza (tryb ${g.tryb})`);
    const planowane = KLOCKI[g.n]?.[para.n - 1] || [];
    const targets = planowane.filter((k) => en.toLowerCase().includes(k.toLowerCase()));
    const zgubione = planowane.filter((k) => !targets.includes(k));
    if (!targets.length) throw new Error(`Grupa ${g.n}, para ${para.n}: żaden klocek nie pasuje do „${en}"`);
    if (zgubione.length) throw new Error(`Grupa ${g.n}, para ${para.n}: klocki „${zgubione.join('”, „')}” nie padają w „${en}"`);
    return {
      pl,
      en,
      targets,
      audio: `${DZIAL}/${para.wzor.src.replace(/^audio\//, 'audio/')}`,
      course: 'K',
      chapter: 'K8',
    };
  });

  const out = {
    source: 'angielski-podglad',
    course: 'K',
    chapter: 'K8',
    group: g.n,
    deck: `angielski-k::K8::Grupa ${g.n}`,
    exportedAt: new Date().toISOString(),
    cards,
  };
  const plik = path.join(outDir, `k8-grupa-${g.n}.json`);
  fs.writeFileSync(plik, `${JSON.stringify(out, null, 2)}\n`);
  razem += cards.length;
  console.log(`${plik}  ${String(cards.length).padStart(2)} kart  tryb ${g.tryb}`);
}
console.log(`\nRazem ${razem} kart w ${manifest.grupy.length} plikach.`);
console.log('Wgranie (najpierw z --dry-run):');
console.log('  for n in 1 2 3 4 5; do node ~/.claude/skills/przejmij-json/add-cards.cjs tmp/k8-grupa-$n.json --deck "angielski-k::K8::Grupa $n"; done');
