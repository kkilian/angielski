import './generate.js';
import { writeKManifest } from './generate-k.js';

const manifest = writeKManifest();
const audioCount = manifest.chapters.reduce((sum, chapter) => sum + chapter.groups.length, 0);

console.log(`k-content.json: ${manifest.chapters.length} działy, ${audioCount} plików audio`);
