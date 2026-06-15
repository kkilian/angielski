// generate.js — skanuje foldery rozdziałów i buduje content.json (manifest strony).
// Zero zależności. Uruchom: `node tools/generate.js` albo `npm run build`.
//
// Wzorzec jak w silownia-app (generate-program.js -> program.json):
// stan plików na dysku jest jedynym źródłem prawdy, a strona czyta gotowy JSON.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..'); // korzeń = folder ~/angielski

const isChapterDir = (name) => /^\d{2}-/.test(name);

// Rozdziały ukryte w publicznej wersji (osobny produkt / robocze). Zostają na
// dysku i w repo, ale NIE trafiają do content.json → nie widać ich w odtwarzaczu.
// Aby pokazać rozdział publicznie, usuń jego id z tego zbioru.
const HIDDEN = new Set([
  '01-na-lotnisku',
  '02-na-lotnisku-rozszerzony',
  '03-pociag-cieszyn-warszawa',
  '04-pomidory-kongo',
  '05-cieszyn-lofthus',
  '06-rzad-wylacza-ai',
  '07-co-dalej-po-norwegii',
]);

// Tytuł z pierwszej linii nagłówka H1 w rozdzial.md, np.
// "# Z Cieszyna do Lofthus / From Cieszyn to Lofthus"
function readTitle(chapterPath) {
  const mdPath = path.join(chapterPath, 'rozdzial.md');
  if (!fs.existsSync(mdPath)) return null;
  for (const line of fs.readFileSync(mdPath, 'utf8').split(/\r?\n/)) {
    if (line.trim() === '') continue;
    const m = line.match(/^#\s+(.+?)\s*$/);
    return m ? m[1] : null; // pierwsza niepusta linia: jeśli nie jest H1, brak tytułu
  }
  return null;
}

// Znajdź pliki grupa-N.mp3 w folderze rozdziału, a jeśli ich tam nie ma —
// jeden poziom głębiej (obsługa 07-co-dalej-po-norwegii/aa/).
function findGroups(chapterPath, chapterId) {
  const found = new Map(); // n -> ścieżka względna (URL od korzenia strony)

  const scan = (absDir, relDir) => {
    let entries;
    try { entries = fs.readdirSync(absDir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (!e.isFile()) continue;
      const m = e.name.match(/^grupa-(\d+)\.mp3$/i);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!found.has(n)) found.set(n, `${relDir}/${e.name}`);
      }
    }
  };

  scan(chapterPath, chapterId);
  if (found.size === 0) {
    for (const e of fs.readdirSync(chapterPath, { withFileTypes: true })) {
      if (e.isDirectory()) scan(path.join(chapterPath, e.name), `${chapterId}/${e.name}`);
    }
  }

  return [...found.keys()]
    .sort((a, b) => a - b) // liczbowo, nie leksykalnie (grupa-10 po grupa-2)
    .map((n) => ({ n, label: `Grupa ${n}`, src: found.get(n) }));
}

function build() {
  const ids = fs.readdirSync(ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory() && isChapterDir(e.name) && !HIDDEN.has(e.name))
    .map((e) => e.name)
    .sort();

  const chapters = ids.map((id) => {
    const chapterPath = path.join(ROOT, id);
    const number = parseInt(id.match(/^(\d+)/)[1], 10);

    const raw = readTitle(chapterPath);
    let title, titlePl, titleEn;
    if (raw) {
      title = raw;
      const i = raw.indexOf(' / ');
      titlePl = i === -1 ? raw : raw.slice(0, i).trim();
      titleEn = i === -1 ? raw : raw.slice(i + 3).trim();
    } else {
      title = titlePl = titleEn = id.replace(/^\d{2}-/, '').replace(/-/g, ' ');
    }

    const pdf = fs.existsSync(path.join(chapterPath, 'rozdzial.pdf'))
      ? `${id}/rozdzial.pdf` : null;

    const groups = findGroups(chapterPath, id);

    return { id, slug: id, number, title, titlePl, titleEn, pdf, hasAudio: groups.length > 0, groups };
  }).sort((a, b) => a.number - b.number);

  const manifest = { generatedAt: new Date().toISOString(), chapters };
  fs.writeFileSync(path.join(ROOT, 'content.json'), JSON.stringify(manifest, null, 2) + '\n');

  const totalAudio = chapters.reduce((s, c) => s + c.groups.length, 0);
  console.log(`content.json: ${chapters.length} rozdziałów, ${totalAudio} plików audio`);
  for (const c of chapters) {
    console.log(`  ${c.id} — ${c.groups.length} audio${c.hasAudio ? '' : '  (brak audio)'}`);
  }
}

build();
