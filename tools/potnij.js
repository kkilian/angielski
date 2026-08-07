// tools/potnij.js — jednorazowa migracja sklejonych grupa-N.mp3 na pary.
// Cięcie ffmpegiem bez rekompresji, ZERO wywołań TTS. Punkty cięcia biorą się
// z dopasowania wykrytych ciszy do listy, którą wygenerował assemble-audio.js.
//
// Uruchom: node tools/potnij.js K/02-k2-kintsugi [--na-sucho]

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const SKILL = path.join(process.env.HOME, '.claude', 'skills', 'angielski-rozdzial', 'assemble-audio.js');
// tekstPary bierzemy z generatora, a nie kopiujemy: kształt tekstu na ekran musi
// być ten sam po obu stronach (dział zmigrowany i dział wygenerowany od nowa).
const { parseChapter, normalizeMode, oczekiwaneCisze, tekstPary } = require(SKILL);

// Oczekiwana cisza `v` pasuje do wykrytej, gdy ta jest nie krótsza niż v − TOLERANCJA.
// Cisza w pliku bywa DŁUŻSZA od zamówionej (nagranie TTS ma ciszę na krawędziach),
// nigdy krótsza — stąd próg jednostronny.
//
// 0.05, nie 0.2: zmierzone na 515 ciszach Kursu K nadwyżki nad wartością nominalną
// mieszczą się w [+0.01, +1.91] s — ani razu ujemnej. Luźniejszy próg jest wręcz
// szkodliwy: przy 0.2 cisza „koniec" (1,0 s) dopasowywała się do pauzy 0,82 s po
// myślniku w środku zdania EN i ucinała wzorzec w połowie (K1 grupa 2, para 3).
// Najdłuższa zaobserwowana pauza wewnątrzzdaniowa w dryl to 0,82 s, najkrótsza
// prawdziwa cisza „koniec" — 1,15 s; próg 0,95 s leży w tej dolinie.
const TOLERANCJA = 0.05;

export function dopasujCisze(oczekiwane, wykryte, dlugoscPliku) {
  const dopasowane = [];
  let j = 0;
  for (let i = 0; i < oczekiwane.length; i++) {
    const o = oczekiwane[i];
    let trafiony = -1;
    for (let k = j; k < wykryte.length; k++) {
      const end = wykryte[k].end == null ? dlugoscPliku : wykryte[k].end;
      if (end - wykryte[k].start >= o.sek - TOLERANCJA) { trafiony = k; break; }
    }
    if (trafiony === -1) return { ok: false, brak: o, indeks: i };
    const w = wykryte[trafiony];
    dopasowane.push({ ...o, start: w.start, end: w.end == null ? dlugoscPliku : w.end });
    j = trafiony + 1;
  }
  return { ok: true, dopasowane };
}

// Z dopasowanych ciszy robi granice plików: wyzwalacz kończy się na końcu ciszy
// o roli „en", wzorzec — na końcu ciszy o roli „koniec". Ostatni wzorzec ciągniemy
// do końca pliku, żeby cięcie nie zgubiło ogona nagrania.
export function punktyCiecia(dopasowane, dlugoscPliku) {
  const pary = [];
  let od = 0;
  let cueDo = null;
  for (const c of dopasowane) {
    if (c.rola === 'en') { cueDo = c.end; continue; }
    if (c.rola !== 'koniec') continue;
    pary.push({ cueOd: od, cueDo, wzorOd: cueDo, wzorDo: c.end });
    od = c.end;
  }
  if (pary.length) pary[pary.length - 1].wzorDo = dlugoscPliku;
  return pary;
}

export function dlugosc(mp3) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=nw=1:nk=1', mp3], { encoding: 'utf8' });
  return Number(r.stdout.trim());
}

export function wykryjCisze(mp3) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', mp3,
    '-af', 'silencedetect=noise=-45dB:d=0.5', '-f', 'null', '-'], { encoding: 'utf8' });
  const out = [];
  let start = null;
  for (const m of (r.stderr || '').matchAll(/silence_(start|end):\s*([-\d.]+)/g)) {
    if (m[1] === 'start') start = Number(m[2]);
    else if (start != null) { out.push({ start, end: Number(m[2]) }); start = null; }
  }
  if (start != null) out.push({ start, end: null }); // urwana na końcu pliku
  return out;
}

// Kontrola sensu: wzorzec to jedno zdanie EN plus przerwa — jego długość musi
// odpowiadać liczbie słów. Łapie rozjazd, którego dopasowanie samo nie wykryje.
//
// Dolny próg 0.18 s/słowo (≈ 5,6 słowa/s), nie 0.25 (= 4,0 słowa/s): zmierzone tempo
// 242 poprawnych wzorców Kursu K to 1,00–4,40 słowa/s (zdania z krótkich słów, typu
// „it's sort of like…", czyta się szybko). Przy 0.25 trzy zdrowe pary były odrzucane.
// Rozjazd, który ten próg ma łapać, wygląda zupełnie inaczej: ucięty wzorzec z K1
// grupy 2 dawał 6,87 słowa/s. Próg stoi w dolinie między 4,40 a 6,87.
function wzorzecSensowny(sekundy, tekstEn, przerwa) {
  const slowa = tekstEn.trim().split(/\s+/).filter(Boolean).length;
  const mowa = sekundy - przerwa;
  return mowa >= slowa * 0.18 && mowa <= slowa * 0.9 + 2;
}

export function zaplanujDzial(katalogAbs) {
  const md = fs.readFileSync(path.join(katalogAbs, 'rozdzial.md'), 'utf8');
  const grupyMd = parseChapter(md);
  if (!grupyMd.length) return { ok: false, powod: 'brak grup w rozdzial.md' };

  const grupy = [];
  for (const g of grupyMd) {
    const tryb = normalizeMode(g.mode);
    const mp3 = path.join(katalogAbs, `grupa-${g.n}.mp3`);
    if (!fs.existsSync(mp3)) return { ok: false, powod: `grupa ${g.n}: brak ${mp3}` };
    // Słuchanki nie migrujemy — offsety zdań wymagałyby osobnego dopasowania, a w
    // Kursie K nie ma ani jednej. Gdy się pojawi, dopisz obsługę zamiast zgadywać.
    if (tryb === 'sluchanka') return { ok: false, powod: `grupa ${g.n}: słuchanka — migracja nieobsługiwana` };

    const dl = dlugosc(mp3);
    const oczekiwane = g.pairs.flatMap((p) => oczekiwaneCisze(tryb, p));
    const dop = dopasujCisze(oczekiwane, wykryjCisze(mp3), dl);
    if (!dop.ok) {
      return { ok: false, powod: `grupa ${g.n}: nie dopasowano ciszy ${dop.brak.sek}s (${dop.brak.rola}), pozycja ${dop.indeks}` };
    }
    const pary = punktyCiecia(dop.dopasowane, dl);
    if (pary.length !== g.pairs.length) {
      return { ok: false, powod: `grupa ${g.n}: ${pary.length} wycinków przy ${g.pairs.length} wierszach` };
    }
    const przerwa = tryb === 'en-only' ? 1.2 : 1;
    pary.forEach((p, i) => {
      p.n = i + 1;
      p.tekst = tekstPary(tryb, g.pairs[i]);
    });
    for (const p of pary) {
      if (!wzorzecSensowny(p.wzorDo - p.wzorOd, p.tekst.en, przerwa)) {
        return { ok: false, powod: `grupa ${g.n}, para ${p.n}: wzorzec ${(p.wzorDo - p.wzorOd).toFixed(1)}s nie pasuje do „${p.tekst.en}"` };
      }
    }
    grupy.push({ n: g.n, tryb, pary });
  }
  return { ok: true, grupy };
}

function tnij(mp3, od, doSek, out) {
  const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error',
    '-ss', String(od), '-to', String(doSek), '-i', mp3, '-c', 'copy', out]);
  if (r.status !== 0) throw new Error(`ffmpeg padł przy ${out}`);
}

// Wykonuje plan: tnie do katalogu tymczasowego, a dopiero po komplecie przenosi
// na miejsce. Dzięki temu dział nigdy nie zostaje w stanie pół-migrowanym.
export function wykonaj(katalogAbs, plan) {
  const tmp = fs.mkdtempSync(path.join(katalogAbs, '.potnij-'));
  const manifest = { wersja: 2, generatedAt: new Date().toISOString(), grupy: [] };
  try {
    for (const g of plan.grupy) {
      if (g.tryb === 'sluchanka') { manifest.grupy.push(g); continue; }
      const mp3 = path.join(katalogAbs, `grupa-${g.n}.mp3`);
      const pary = [];
      for (const p of g.pary) {
        const nr = String(p.n).padStart(2, '0');
        const cue = `g${g.n}-p${nr}-cue.mp3`, wzor = `g${g.n}-p${nr}-en.mp3`;
        tnij(mp3, p.cueOd, p.cueDo, path.join(tmp, cue));
        tnij(mp3, p.wzorOd, p.wzorDo, path.join(tmp, wzor));
        pary.push({
          n: p.n,
          cue: { src: `audio/${cue}`, sek: Number((p.cueDo - p.cueOd).toFixed(3)) },
          wzor: { src: `audio/${wzor}`, sek: Number((p.wzorDo - p.wzorOd).toFixed(3)) },
          tekst: p.tekst,
        });
      }
      manifest.grupy.push({ n: g.n, tryb: g.tryb, pary });
    }
    const audioDir = path.join(katalogAbs, 'audio');
    fs.rmSync(audioDir, { recursive: true, force: true });
    fs.renameSync(tmp, audioDir);
    fs.writeFileSync(path.join(katalogAbs, 'audio.json'), JSON.stringify(manifest, null, 2) + '\n');
    for (const g of plan.grupy) {
      if (g.tryb === 'sluchanka') continue;
      fs.rmSync(path.join(katalogAbs, `grupa-${g.n}.mp3`), { force: true });
    }
    return manifest;
  } catch (e) {
    fs.rmSync(tmp, { recursive: true, force: true });
    throw e;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dzial = process.argv[2];
  if (!dzial) { console.error('użycie: node tools/potnij.js <katalog działu> [--na-sucho]'); process.exit(1); }
  const abs = path.resolve(dzial);
  const plan = zaplanujDzial(abs);
  if (!plan.ok) { console.error('NIE TNĘ —', plan.powod); process.exit(1); }
  for (const g of plan.grupy) {
    console.log(`  grupa-${g.n} [${g.tryb}] → ${g.tryb === 'sluchanka' ? 'zostaje jednym plikiem' : g.pary.length + ' par'}`);
  }
  if (process.argv.includes('--na-sucho')) { console.log('[NA SUCHO] nic nie zapisano.'); process.exit(0); }
  const m = wykonaj(abs, plan);
  const par = m.grupy.reduce((s, g) => s + (g.pary ? g.pary.length : 0), 0);
  console.log(`Gotowe: ${m.grupy.length} grup, ${par} par, ${par * 2} plików.`);
}
