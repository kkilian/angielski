import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const THIS_FILE = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(THIS_FILE), '..');

function readTitle(chapterPath) {
  const markdownPath = path.join(chapterPath, 'rozdzial.md');
  if (!fs.existsSync(markdownPath)) return null;
  const firstContentLine = fs.readFileSync(markdownPath, 'utf8')
    .split(/\r?\n/)
    .find((line) => line.trim());
  const match = firstContentLine?.match(/^#\s+(.+?)\s*$/);
  return match ? match[1] : null;
}

function splitTitle(raw, fallback) {
  if (!raw) return { title: fallback, titlePl: fallback, titleEn: fallback };
  const separator = raw.indexOf(' / ');
  if (separator === -1) return { title: raw, titlePl: raw, titleEn: raw };
  return {
    title: raw,
    titlePl: raw.slice(0, separator).trim(),
    titleEn: raw.slice(separator + 3).trim(),
  };
}

function findGroups(chapterPath, relativeChapterPath) {
  const groups = [];
  for (const entry of fs.readdirSync(chapterPath, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const match = entry.name.match(/^grupa-(\d+)\.mp3$/i);
    if (!match) continue;
    const absolutePath = path.join(chapterPath, entry.name);
    const version = Math.round(fs.statSync(absolutePath).mtimeMs);
    groups.push({
      n: Number(match[1]),
      label: `Grupa ${Number(match[1])}`,
      src: `${relativeChapterPath}/${entry.name}?v=${version}`,
    });
  }
  return groups.sort((a, b) => a.n - b.n);
}

// Pytanie do ćwiczenia płynności 4/3/2 — komentarz `<!-- 432: … -->` bezpośrednio
// pod nagłówkiem `## Grupa N` w rozdzial.md. NIE w audio.json: assemble-audio.js
// przepisuje manifest przy każdej regeneracji audio i zapisuje wyłącznie
// {n, tryb, pary}, więc obce pole by zginęło.
function czytajPytania432(chapterPath) {
  const markdownPath = path.join(chapterPath, 'rozdzial.md');
  const pytania = new Map();
  if (!fs.existsSync(markdownPath)) return pytania;
  let numer = null;
  for (const line of fs.readFileSync(markdownPath, 'utf8').split(/\r?\n/)) {
    const heading = line.match(/^##\s*Grupa\s*(\d+)/i);
    if (heading) { numer = Number(heading[1]); continue; }
    if (/^#{1,6}\s+/.test(line)) { numer = null; continue; }
    const q = line.match(/^<!--\s*432:\s*(.+?)\s*-->\s*$/);
    if (q && numer != null) pytania.set(numer, q[1]);
    const n = line.match(/^<!--\s*nazwa:\s*(.+?)\s*-->\s*$/);
    if (n && numer != null) pytania.set(`nazwa-${numer}`, n[1]);
  }
  return pytania;
}

// Dział w formacie 2 opisuje swoje audio w audio.json — nie skanujemy grupa-N.mp3.
// audioVersion to najświeższy mtime audio; odtwarzacz dokleja go jako ?v= do
// każdej ścieżki z manifestu (cache-busting bez puchnięcia content.json).
function czytajFormat2(chapterPath, relativeChapterPath) {
  const manifestPath = path.join(chapterPath, 'audio.json');
  if (!fs.existsSync(manifestPath)) return null;
  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch { return null; }
  if (manifest.wersja !== 2 || !Array.isArray(manifest.grupy)) return null;

  let version = 0;
  const dotknij = (p) => { try { version = Math.max(version, fs.statSync(p).mtimeMs); } catch {} };
  dotknij(manifestPath);
  const audioDir = path.join(chapterPath, 'audio');
  if (fs.existsSync(audioDir)) for (const f of fs.readdirSync(audioDir)) dotknij(path.join(audioDir, f));
  for (const g of manifest.grupy) if (g.src) dotknij(path.join(chapterPath, g.src));

  return {
    format: 2,
    audioManifest: `${relativeChapterPath}/audio.json`,
    audioVersion: Math.round(version),
    hasAudio: manifest.grupy.length > 0,
    groups: manifest.grupy.map((g) => ({
      n: g.n,
      label: `Grupa ${g.n}`,
      parCount: g.pary ? g.pary.length : (g.zdania ? g.zdania.length : 0),
    })),
  };
}

export function buildKManifest(rootDir = ROOT) {
  const courseRoot = path.join(rootDir, 'R');
  const registryPath = path.join(courseRoot, 'kurs.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const metadata = new Map((registry.dzialy || []).map((chapter) => [chapter.folder, chapter]));

  const chapterFolders = fs.readdirSync(courseRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d{2}-r\d+-/.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => Number(b.slice(0, 2)) - Number(a.slice(0, 2)));

  const chapters = chapterFolders.map((folder) => {
    const folderMatch = folder.match(/^(\d{2})-r(\d+)-/);
    const localNumber = Number(folderMatch[2]);
    const chapterPath = path.join(courseRoot, folder);
    const relativeChapterPath = `R/${folder}`;
    const fallbackTitle = folder.replace(/^\d{2}-r\d+-/, '').replace(/-/g, ' ');
    const titles = splitTitle(readTitle(chapterPath), fallbackTitle);
    const chapterMetadata = metadata.get(folder) || {};
    const groups = findGroups(chapterPath, relativeChapterPath);
    const format2 = czytajFormat2(chapterPath, relativeChapterPath);

    const pytania = czytajPytania432(chapterPath);
    const audio = format2 || { hasAudio: groups.length > 0, groups };
    audio.groups = audio.groups.map((g) => {
      const z = pytania.has(g.n) ? { ...g, pytanie432: pytania.get(g.n) } : { ...g };
      if (pytania.has(`nazwa-${g.n}`)) z.label = `Grupa ${g.n} · ${pytania.get(`nazwa-${g.n}`)}`;
      return z;
    });

    return {
      id: chapterMetadata.id || `r${localNumber}`,
      slug: relativeChapterPath,
      localNumber,
      ...titles,
      description: chapterMetadata.opis || '',
      pdf: fs.existsSync(path.join(chapterPath, 'rozdzial.pdf'))
        ? `${relativeChapterPath}/rozdzial.pdf`
        : null,
      ...audio,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    course: {
      id: registry.kurs?.id || 'r',
      title: registry.kurs?.tytul || 'Rozmowa',
      description: registry.kurs?.opis || '',
    },
    chapters,
  };
}

export function writeKManifest(rootDir = ROOT, outputPath = path.join(rootDir, 'content.json')) {
  const manifest = buildKManifest(rootDir);
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === THIS_FILE) {
  const manifest = writeKManifest();
  const audioCount = manifest.chapters.reduce((sum, chapter) => sum + chapter.groups.length, 0);
  console.log(`content.json: ${manifest.chapters.length} działy, ${audioCount} plików audio`);
}
