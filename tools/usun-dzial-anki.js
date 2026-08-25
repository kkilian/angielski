// Kasuje z Anki cały dział kursu K przed wgraniem przepisanej wersji.
//
// Uruchom:  node tools/usun-dzial-anki.js k8            (dry-run, robi backup)
//           node tools/usun-dzial-anki.js k8 --wykonaj
//
// Historia: 22.08 K7 (81 par → 32); 25.08 K7 i K8 (grupy w trybie `en-only`
// przestawione na zwykły pl2en — zmieniły się przody kart, a wraz z polskim tekstem
// także hashe plików cue.mp3, więc czysty re-import jest pewniejszy niż liczenie
// na nadpisanie mediów).
//
// DLACZEGO ZAPYTANIE PO TALII, A NIE PO TYPIE NOTATKI:
// 23 z 81 notatek K7 zostały wcześniej zmigrowane przez tools/k67-luki.js na typ
// `angielski-k-luka` (cloze). `updateNoteModel` zostawił je w ich taliach, więc
// deck:"angielski-k::K7" łapie oba typy. Zapytanie note:"angielski-pl-en" złapałoby
// tylko 58 i zostawiło 23 sieroty — niewidoczne dla dedupu add-cards.cjs (Anki
// sprawdza duplikaty w obrębie typu notatki), czyli przy re-imporcie powstałyby
// ciche duplikaty z zerową historią obok tych z historią.
//
// DRY-RUN JEST DOMYŚLNY. Kasowanie wymaga --wykonaj. (k67-luki.js ma odwrotnie —
// tam opt-in --dry-run jest w porządku dla migracji, tu nie jest.)
//
// Uruchom: node tools/k7-usun-anki.js              (nic nie kasuje, robi backup)
//          node tools/k7-usun-anki.js --wykonaj

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ANKI = process.env.ANKI_URL || 'http://127.0.0.1:8765';
const args = process.argv.slice(2);
const wykonaj = args.includes('--wykonaj');

const DZIAL = (args.find((a) => /^k\d+$/i.test(a)) || '').toLowerCase();
if (!DZIAL) {
  console.error('Podaj dział, np.: node tools/usun-dzial-anki.js k8 [--wykonaj]');
  process.exit(1);
}
const DECK = `angielski-k::${DZIAL.toUpperCase()}`;
const TAG = DZIAL;
const ZNANE_TYPY = new Set(['angielski-pl-en', 'angielski-k-luka']);
// Ile notatek typu `angielski-k-luka` (cloze) spodziewamy się zastać. To ASERCJA
// STANU, nie ustawienie: jeśli liczba się nie zgadza, Anki rozjechało się z założeniami
// i trzeba sprawdzić PRZED kasowaniem. K7 miał 23 (zmigrowane przez k67-luki.js
// z wersji masońskiej) do przepisania 22.08; od tego czasu działy mają 0.
// Podaj inaczej flagą --cloze=N.
const OCZEKIWANE_CLOZE = Number((args.find((a) => a.startsWith('--cloze=')) || '--cloze=0').split('=')[1]);
const MIN_APKG = 100_000;

async function anki(action, params) {
  let res;
  try {
    res = await fetch(ANKI, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, version: 6, params: params || {} }),
    });
  } catch (e) {
    throw new Error(`Nie mogę połączyć się z Anki (${ANKI}). Czy Anki jest otwarte? ${e.message}`);
  }
  const json = await res.json();
  if (json.error) throw new Error(`AnkiConnect [${action}]: ${json.error}`);
  return json.result;
}

const stamp = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

// Nazwy plików mp3 siedzą w polach jako [sound:NAZWA]. Zbieramy je PRZED kasowaniem,
// bo deleteNotes zostawia media osierocone, a Check Media w Anki przeczesuje całą
// kolekcję i mógłby ruszyć cudze talie.
function media(fields) {
  const out = [];
  for (const f of Object.values(fields || {})) {
    for (const m of String(f?.value ?? '').matchAll(/\[sound:([^\]]+)\]/g)) out.push(m[1]);
  }
  return out;
}

async function main() {
  console.log(wykonaj ? '### TRYB: KASOWANIE ###\n' : '### TRYB: DRY-RUN (nic nie zostanie skasowane) ###\n');

  // 1. talie
  const talie = (await anki('deckNames')).filter((d) => d === DECK || d.startsWith(`${DECK}::`));
  console.log(`Talie ${DECK} (${talie.length}):`);
  for (const t of talie) console.log(`  ${t}`);
  if (!talie.length) { console.log(`\nNic do kasowania — talii ${DECK} już nie ma.`); return; }

  // 2. notatki + kontrola spójności
  const ids = await anki('findNotes', { query: `deck:"${DECK}"` });
  const idsTag = await anki('findNotes', { query: `tag:${TAG}` });
  const wDeck = new Set(ids);
  const pozaDeck = idsTag.filter((id) => !wDeck.has(id));
  console.log(`\nNotatki w talii ${DECK}: ${ids.length}`);
  console.log(`Notatki z tagiem "${TAG}": ${idsTag.length}`);
  if (pozaDeck.length) {
    console.error(`\nPRZERWANE: ${pozaDeck.length} notatek ma tag "${TAG}", ale leży POZA talią ${DECK}.`);
    console.error(`Kasowanie po talii by ich nie ruszyło, a i tak są częścią działu. Sprawdź ręcznie:`);
    console.error(pozaDeck.join(' '));
    process.exitCode = 1;
    return;
  }

  // 3. rozbicie per typ + zbiórka mediów
  const notes = await anki('notesInfo', { notes: ids });
  const perTyp = new Map();
  const MEDIA = new Set();
  for (const n of notes) {
    perTyp.set(n.modelName, (perTyp.get(n.modelName) || 0) + 1);
    for (const m of media(n.fields)) MEDIA.add(m);
  }
  console.log('\nRozbicie per typ notatki:');
  for (const [typ, ile] of [...perTyp].sort()) console.log(`  ${typ.padEnd(20)} ${ile}`);

  const nieznane = [...perTyp.keys()].filter((t) => !ZNANE_TYPY.has(t));
  if (nieznane.length) {
    console.error(`\nPRZERWANE: nieoczekiwany typ notatki w ${DECK}: ${nieznane.join(', ')}`);
    process.exitCode = 1;
    return;
  }
  const cloze = perTyp.get('angielski-k-luka') || 0;
  if (cloze !== OCZEKIWANE_CLOZE) {
    console.error(`\nPRZERWANE: oczekiwano ${OCZEKIWANE_CLOZE} notatek cloze (z k67-luki.js), jest ${cloze}.`);
    console.error('Stan Anki odbiega od założeń planu — sprawdź, zanim skasujesz.');
    process.exitCode = 1;
    return;
  }
  console.log(`\nPliki mediów do posprzątania po kasowaniu: ${MEDIA.size}`);

  // 4. backup zawężony do K7 — dokładnie to, co znika, przywracalne jednym kliknięciem
  const apkg = path.join(__dirname, '..', 'tmp', `${DZIAL}-przed-usunieciem-${stamp()}.apkg`);
  fs.mkdirSync(path.dirname(apkg), { recursive: true });
  await anki('exportPackage', { deck: DECK, path: path.resolve(apkg), includeSched: true });
  const rozmiar = fs.existsSync(apkg) ? fs.statSync(apkg).size : 0;
  if (rozmiar < MIN_APKG) {
    console.error(`\nPRZERWANE: backup ${apkg} ma ${rozmiar} B (< ${MIN_APKG}). Nie kasuję bez backupu.`);
    process.exitCode = 1;
    return;
  }
  console.log(`Backup: ${apkg} (${(rozmiar / 1024 / 1024).toFixed(1)} MB, z harmonogramem)`);

  if (!wykonaj) {
    console.log(`\nDRY-RUN. Do skasowania: ${ids.length} notatek, ${MEDIA.size} plików mediów, ${talie.length} talii.`);
    console.log('Uruchom ponownie z --wykonaj, żeby skasować.');
    return;
  }

  // 5. kasowanie
  await anki('deleteNotes', { notes: ids });
  const zostalo = await anki('findNotes', { query: `deck:"${DECK}"` });
  if (zostalo.length) {
    console.error(`\nPRZERWANE PO KASOWANIU: w talii dalej jest ${zostalo.length} notatek. Nie ruszam mediów ani talii.`);
    process.exitCode = 1;
    return;
  }
  console.log(`\nSkasowano ${ids.length} notatek.`);

  let mediaOk = 0;
  for (const m of MEDIA) {
    try { await anki('deleteMediaFile', { filename: m }); mediaOk += 1; } catch (e) { console.warn(`  media: ${m} — ${e.message}`); }
  }
  console.log(`Skasowano ${mediaOk}/${MEDIA.size} plików mediów.`);

  await anki('deleteDecks', { decks: talie, cardsToo: true });
  console.log(`Skasowano ${talie.length} talii.`);
  console.log(`\nGotowe. Backup na wypadek pomyłki: ${apkg}`);
}

main().catch((e) => { console.error(`\nBŁĄD: ${e.message}`); process.exitCode = 1; });
