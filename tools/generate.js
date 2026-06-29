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

// Z nazwy folderu „12-m2d1-…" wyciągnij minikurs (2) i numer lokalny (1).
// Bardziej odporne niż dzielenie globalnego numeru przez 11. Fallback: z numeru.
function parseMinikurs(id, number) {
  const m = id.match(/^\d{2}-m(\d+)d(\d+)-/);
  if (m) return { minikurs: Number(m[1]), localNumber: Number(m[2]) };
  return { minikurs: Math.floor((number - 1) / 11) + 1, localNumber: ((number - 1) % 11) + 1 };
}

// Tytuł/temat minikursu z rejestru slownik.json (id „m"+num). Gdy brak — null (UI wyprowadzi ze slugów).
function readMinikursyMeta() {
  try {
    const s = JSON.parse(fs.readFileSync(path.join(ROOT, 'slownik.json'), 'utf8'));
    const out = {};
    for (const mk of s.minikursy || []) {
      const num = Number(String(mk.id).replace(/^m/, ''));
      if (num) out[num] = { tytul: mk.tytul || null, temat: mk.temat || null, status: mk.status || null };
    }
    return out;
  } catch { return {}; }
}

// Rozdziały ukryte w publicznej wersji (osobny produkt / robocze). Zostają na
// dysku i w repo, ale NIE trafiają do content.json → nie widać ich w odtwarzaczu.
// Aby pokazać rozdział publicznie, usuń jego id z tego zbioru.
const HIDDEN = new Set([
  // (puste) — wszystkie rozdziały widoczne w odtwarzaczu.
  // Aby ukryć rozdział, dodaj tu jego id, np. '04-pomidory-kongo'.
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
        if (!found.has(n)) {
          // cache-busting: ?v=<mtime>. mp3 mają nagłówek immutable (render.yaml),
          // a nazwy się nie zmieniają po regeneracji — bez tego przeglądarka grałaby
          // stary plik z cache. mtime zmienia URL tylko gdy plik faktycznie się zmienił.
          let v = '';
          try { v = `?v=${Math.round(fs.statSync(path.join(absDir, e.name)).mtimeMs)}`; } catch {}
          found.set(n, `${relDir}/${e.name}${v}`);
        }
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
    const { minikurs, localNumber } = parseMinikurs(id, number);

    return { id, slug: id, number, minikurs, localNumber, title, titlePl, titleEn, pdf, hasAudio: groups.length > 0, groups };
  }).sort((a, b) => a.number - b.number);

  // Wymiar minikursu — kafle na stronie głównej. Bierzemy WSZYSTKIE minikursy z rejestru
  // (m1…m5), żeby pokazać też niewygenerowane jako „wkrótce" (generated:false, bez linku).
  const meta = readMinikursyMeta();
  const byNum = new Map();
  for (const c of chapters) {
    const e = byNum.get(c.minikurs) || { count: 0, audioCount: 0 };
    e.count += 1; e.audioCount += c.groups.length;
    byNum.set(c.minikurs, e);
  }
  const nums = new Set([...byNum.keys(), ...Object.keys(meta).map(Number)]);
  const slugTytul = (num) => {
    const first = chapters.find((c) => c.minikurs === num);
    return first ? `Minikurs ${num}` : `Minikurs ${num}`;
  };
  const minikursy = [...nums].sort((a, b) => a - b).map((num) => {
    const tally = byNum.get(num) || { count: 0, audioCount: 0 };
    const m = meta[num] || {};
    return {
      num, id: `m${num}`,
      tytul: m.tytul || slugTytul(num),
      temat: m.temat || '',
      status: m.status || null,
      count: tally.count, audioCount: tally.audioCount,
      generated: tally.count > 0,
    };
  });

  const manifest = { generatedAt: new Date().toISOString(), minikursy, chapters };
  fs.writeFileSync(path.join(ROOT, 'content.json'), JSON.stringify(manifest, null, 2) + '\n');

  const totalAudio = chapters.reduce((s, c) => s + c.groups.length, 0);
  console.log(`content.json: ${chapters.length} rozdziałów, ${totalAudio} plików audio, ${minikursy.filter((m) => m.generated).length}/${minikursy.length} minikursów`);
  for (const m of minikursy) {
    console.log(`  m${m.num} „${m.tytul}" — ${m.count} działów / ${m.audioCount} audio${m.generated ? '' : '  (wkrótce)'}`);
  }
  for (const c of chapters) {
    console.log(`  ${c.id} [m${c.minikurs}·${c.localNumber}] — ${c.groups.length} audio${c.hasAudio ? '' : '  (brak audio)'}`);
  }
}

build();
