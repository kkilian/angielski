// Serwer egzaminu głosowego (lokalny). Użycie: npm run egzamin → http://127.0.0.1:8124/
// Wzorzec: tools/serve.mjs. Klucze API tylko tutaj — nigdy we froncie.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { klucze, ttsMp3, transkrybuj, claudeJson } from './api.mjs';
import { metryki } from './metryki.mjs';

const TU = path.dirname(fileURLToPath(import.meta.url));           // tools/egzamin/
const REPO = path.dirname(path.dirname(TU));                        // repo root
const EGZAMINY = path.join(REPO, 'egzaminy');
const PORT = Number(process.env.PORT) || 8124;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.mp3': 'audio/mpeg', '.md': 'text/plain; charset=utf-8',
};

// ── Sesje ────────────────────────────────────────────────────────────────
const sesje = new Map();

function nowaSesja(minikurs = 'm3') {
  const dzis = new Date().toISOString().slice(0, 10);
  const baza = path.join(EGZAMINY, minikurs);
  fs.mkdirSync(baza, { recursive: true });
  const n = fs.readdirSync(baza).filter(d => d.startsWith(dzis)).length + 1;
  const id = `${dzis}-podejscie-${n}`;
  const dir = path.join(baza, id);
  fs.mkdirSync(dir, { recursive: true });
  const s = { id, dir, minikurs, nrPytania: 0, blokIdx: 0, followupyWBloku: 0,
              plan: null, wymiany: [], start: Date.now() };
  sesje.set(id, s);
  return s;
}

function zapisz(s, nazwa, dane) {
  fs.writeFileSync(path.join(s.dir, nazwa),
    Buffer.isBuffer(dane) ? dane : JSON.stringify(dane, null, 2));
}

async function zadajPytanie(s, tekst, typ) {
  s.nrPytania += 1;
  const mp3 = await ttsMp3(tekst);
  zapisz(s, `pytanie-${s.nrPytania}.mp3`, mp3);
  s.wymiany.push({ nr: s.nrPytania, blok: s.blokIdx + 1, typ, pytanie: tekst });
  zapisz(s, 'wymiany.json', s.wymiany);
  return `/api/audio/${s.id}/pytanie-${s.nrPytania}.mp3`;
}

function czytajBody(req, limitMB = 50) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let rozmiar = 0;
    req.on('data', c => {
      rozmiar += c.length;
      if (rozmiar > limitMB * 1024 * 1024) { reject(new Error('Body za duże')); req.destroy(); }
      else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// ── Prompty i brief (pliki obok — kalibracja bez ruszania kodu) ─────────
const PROMPT = n => fs.readFileSync(path.join(TU, 'prompty', `${n}.md`), 'utf8');
const BRIEF = fs.readFileSync(path.join(TU, 'minikurs-m3.md'), 'utf8');
const LICZBA_BLOKOW = 4;
const MAX_FOLLOWUPY = 2;

function starePytania(minikurs) {
  const baza = path.join(EGZAMINY, minikurs);
  if (!fs.existsSync(baza)) return [];
  const pytania = [];
  for (const d of fs.readdirSync(baza)) {
    try {
      const plan = JSON.parse(fs.readFileSync(path.join(baza, d, 'plan.json'), 'utf8'));
      for (const b of plan.bloki || []) if (b.pytanie) pytania.push(b.pytanie);
    } catch { /* podejście bez planu — pomijamy */ }
  }
  return pytania;
}

function oblanyDzis(minikurs) {
  const baza = path.join(EGZAMINY, minikurs);
  if (!fs.existsSync(baza)) return false;
  const dzis = new Date().toISOString().slice(0, 10);
  return fs.readdirSync(baza).some(d => {
    if (!d.startsWith(dzis)) return false;
    try {
      const w = JSON.parse(fs.readFileSync(path.join(baza, d, 'werdykt.json'), 'utf8'));
      return w.zdane === false;
    } catch { return false; }
  });
}

async function generujPlan(minikurs) {
  const stare = starePytania(minikurs);
  const plan = await claudeJson({
    system: PROMPT('generator'),
    messages: [{ role: 'user', content:
      `BRIEF MINIKURSU:\n${BRIEF}\n\nPYTANIA GŁÓWNE Z POPRZEDNICH PODEJŚĆ (unikaj):\n` +
      (stare.length ? stare.map(p => `- ${p}`).join('\n') : '(brak — to pierwsze podejście)') }],
    maxTokens: 6000,
  });
  if (!plan.bloki || plan.bloki.length !== LICZBA_BLOKOW) {
    throw new Error(`Generator zwrócił ${plan.bloki?.length ?? 0} bloków zamiast ${LICZBA_BLOKOW}`);
  }
  return plan;
}

async function decyzjaFollowup(s) {
  const blok = s.plan.bloki[s.blokIdx];
  const wymianyBloku = s.wymiany.filter(w => w.blok === s.blokIdx + 1)
    .map(w => `PYTANIE: ${w.pytanie}\nODPOWIEDŹ (transkrypt): ${w.transkrypt || '(brak)'}`)
    .join('\n\n');
  return claudeJson({
    system: PROMPT('followup'),
    messages: [{ role: 'user', content:
      `AKTUALNY BLOK (${s.blokIdx + 1}/${LICZBA_BLOKOW}):\n${JSON.stringify(blok, null, 2)}\n\n` +
      `WYMIANY W TYM BLOKU:\n${wymianyBloku}\n\n` +
      `ZADANE FOLLOW-UPY W TYM BLOKU: ${s.followupyWBloku} (limit ${MAX_FOLLOWUPY})` }],
    maxTokens: 500,
  });
}

function json(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function bladem(res, e) {
  console.error('[egzamin]', e);
  json(res, 500, { blad: String(e?.message || e) });
}

function statyczny(res, fp) {
  fs.stat(fp, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('not found'); }
    const type = TYPES[path.extname(fp).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size });
    fs.createReadStream(fp).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  try {
    if (url === '/api/health' && req.method === 'GET') {
      const k = klucze();
      return json(res, 200, { ok: true, klucze: { openai: !!k.openai, anthropic: !!k.anthropic } });
    }

    if (url === '/api/start' && req.method === 'POST') {
      if (oblanyDzis('m3')) {
        return json(res, 403, { blad: 'Dziś już oblane. Zrób zadanie na jutro — retake najwcześniej jutro.' });
      }
      const s = nowaSesja();
      s.plan = await generujPlan(s.minikurs);
      zapisz(s, 'plan.json', s.plan);
      const pytanieAudio = await zadajPytanie(s, s.plan.bloki[0].pytanie, 'glowne');
      return json(res, 200, {
        sesjaId: s.id, pytanieAudio, typ: 'glowne',
        blok: { idx: 1, z: LICZBA_BLOKOW, temat: s.plan.bloki[0].temat },
      });
    }

    if (url === '/api/odpowiedz' && req.method === 'POST') {
      const s = sesje.get(req.headers['x-sesja']);
      if (!s) return json(res, 400, { blad: 'Nieznana sesja' });
      const mime = req.headers['content-type'] || 'audio/webm';
      const buf = await czytajBody(req);
      if (buf.length < 1000) return json(res, 400, { blad: 'Puste/zbyt krótkie nagranie' });
      const ext = mime.includes('mp4') ? 'mp4' : mime.includes('mpeg') ? 'mp3' : 'webm';
      const nr = s.nrPytania;
      zapisz(s, `odpowiedz-${nr}.${ext}`, buf);
      const t = await transkrybuj(buf, mime);
      const m = metryki(t.words, t.durationSek);
      const wymiana = s.wymiany[s.wymiany.length - 1];
      Object.assign(wymiana, { transkrypt: t.text, words: t.words, metryki: m });
      zapisz(s, 'wymiany.json', s.wymiany);

      // Follow-up czy następny blok?
      let decyzja = { next: true };
      if (s.followupyWBloku < MAX_FOLLOWUPY) {
        try { decyzja = await decyzjaFollowup(s); }
        catch (e) { console.error('[followup]', e.message); /* awaria decyzji ≠ koniec egzaminu */ }
      }
      if (decyzja.followup) {
        s.followupyWBloku += 1;
        const pytanieAudio = await zadajPytanie(s, decyzja.followup, 'followup');
        return json(res, 200, {
          transkrypt: t.text, pytanieAudio, typ: 'followup',
          blok: { idx: s.blokIdx + 1, z: LICZBA_BLOKOW, temat: s.plan.bloki[s.blokIdx].temat },
        });
      }
      s.blokIdx += 1;
      s.followupyWBloku = 0;
      if (s.blokIdx >= LICZBA_BLOKOW) {
        return json(res, 200, { transkrypt: t.text, koniec: true });
      }
      const pytanieAudio = await zadajPytanie(s, s.plan.bloki[s.blokIdx].pytanie, 'glowne');
      return json(res, 200, {
        transkrypt: t.text, pytanieAudio, typ: 'glowne',
        blok: { idx: s.blokIdx + 1, z: LICZBA_BLOKOW, temat: s.plan.bloki[s.blokIdx].temat },
      });
    }

    if (url.startsWith('/api/audio/') && req.method === 'GET') {
      const [, , , sesjaId, plik] = url.split('/');
      const s = sesje.get(sesjaId);
      if (!s || !/^[\w.-]+\.mp3$/.test(plik || '')) { res.writeHead(404); return res.end('not found'); }
      return statyczny(res, path.join(s.dir, plik));
    }
    // Statyczne: tylko z tools/egzamin/
    let p = url === '/' ? '/egzamin.html' : url;
    const fp = path.normalize(path.join(TU, p));
    if (!fp.startsWith(TU)) { res.writeHead(403); return res.end('forbidden'); }
    return statyczny(res, fp);
  } catch (e) { return bladem(res, e); }
});

server.listen(PORT, '127.0.0.1', () => {
  fs.mkdirSync(EGZAMINY, { recursive: true });
  console.log(`Egzamin głosowy: http://127.0.0.1:${PORT}/`);
});
