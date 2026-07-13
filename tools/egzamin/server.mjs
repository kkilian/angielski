// Serwer egzaminu głosowego (lokalny). Użycie: npm run egzamin → http://127.0.0.1:8124/
// Wzorzec: tools/serve.mjs. Klucze API tylko tutaj — nigdy we froncie.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { klucze, ttsMp3, transkrybuj, claude } from './api.mjs';
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
  const s = { id, dir, minikurs, nrPytania: 0, wymiany: [], start: Date.now() };
  sesje.set(id, s);
  return s;
}

function zapisz(s, nazwa, dane) {
  fs.writeFileSync(path.join(s.dir, nazwa),
    Buffer.isBuffer(dane) ? dane : JSON.stringify(dane, null, 2));
}

async function zadajPytanie(s, tekst) {
  s.nrPytania += 1;
  const mp3 = await ttsMp3(tekst);
  zapisz(s, `pytanie-${s.nrPytania}.mp3`, mp3);
  s.wymiany.push({ nr: s.nrPytania, pytanie: tekst });
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

// v1 (szkielet): jedno zahardcodowane pytanie i komentarz sędziego do jednej odpowiedzi.
const PYTANIE_V1 = 'Tell me about your channel. What would happen if your next three videos completely flopped?';
const SEDZIA_V1 = `Jesteś surowym, ale konkretnym egzaminatorem ustnego angielskiego (poziom docelowy C1, uczeń ~B2.2).
Dostajesz transkrypt JEDNEJ odpowiedzi na pytanie egzaminacyjne. Skomentuj po polsku w 2-4 zdaniach:
czy odpowiedź używa conditionali (pytanie ich wymaga), zacytuj verbatim jeden błąd lub słabość i podaj poprawkę,
oraz jedną rzecz zrobioną dobrze. Ignoruj artefakty transkrypcji mowy (interpunkcja, drobne literówki ASR).`;

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
      const s = nowaSesja();
      const pytanieAudio = await zadajPytanie(s, PYTANIE_V1);
      return json(res, 200, { sesjaId: s.id, pytanieAudio });
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
      // v1: komentarz do jednej odpowiedzi zamiast pełnego egzaminu
      const komentarz = await claude({
        system: SEDZIA_V1,
        messages: [{ role: 'user', content: `Pytanie: ${wymiana.pytanie}\n\nTranskrypt odpowiedzi: ${t.text}` }],
        maxTokens: 500,
      });
      return json(res, 200, { transkrypt: t.text, metryki: m, komentarz, koniec: true });
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
