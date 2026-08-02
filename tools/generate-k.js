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

export function buildKManifest(rootDir = ROOT) {
  const courseRoot = path.join(rootDir, 'K');
  const registryPath = path.join(courseRoot, 'slownik-k.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const metadata = new Map((registry.dzialy || []).map((chapter) => [chapter.folder, chapter]));

  const chapterFolders = fs.readdirSync(courseRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d{2}-k\d+-/.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => Number(a.slice(0, 2)) - Number(b.slice(0, 2)));

  const chapters = chapterFolders.map((folder) => {
    const folderMatch = folder.match(/^(\d{2})-k(\d+)-/);
    const localNumber = Number(folderMatch[2]);
    const chapterPath = path.join(courseRoot, folder);
    const relativeChapterPath = `K/${folder}`;
    const fallbackTitle = folder.replace(/^\d{2}-k\d+-/, '').replace(/-/g, ' ');
    const titles = splitTitle(readTitle(chapterPath), fallbackTitle);
    const chapterMetadata = metadata.get(folder) || {};
    const groups = findGroups(chapterPath, relativeChapterPath);

    return {
      id: chapterMetadata.id || `k${localNumber}`,
      slug: relativeChapterPath,
      localNumber,
      ...titles,
      description: chapterMetadata.opis || '',
      pdf: fs.existsSync(path.join(chapterPath, 'rozdzial.pdf'))
        ? `${relativeChapterPath}/rozdzial.pdf`
        : null,
      hasAudio: groups.length > 0,
      groups,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    course: {
      id: registry.kurs?.id || 'k',
      title: registry.kurs?.tytul || 'Kurs K',
      description: registry.kurs?.opis || '',
    },
    chapters,
  };
}

export function writeKManifest(rootDir = ROOT, outputPath = path.join(rootDir, 'k-content.json')) {
  const manifest = buildKManifest(rootDir);
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === THIS_FILE) {
  const manifest = writeKManifest();
  const audioCount = manifest.chapters.reduce((sum, chapter) => sum + chapter.groups.length, 0);
  console.log(`k-content.json: ${manifest.chapters.length} działy, ${audioCount} plików audio`);
}
