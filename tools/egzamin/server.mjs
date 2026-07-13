// Serwer egzaminu głosowego (lokalny). Użycie: npm run egzamin → http://127.0.0.1:8124/
// Wzorzec: tools/serve.mjs. Klucze API tylko tutaj — nigdy we froncie.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { klucze } from './api.mjs';

const TU = path.dirname(fileURLToPath(import.meta.url));           // tools/egzamin/
const REPO = path.dirname(path.dirname(TU));                        // repo root
const EGZAMINY = path.join(REPO, 'egzaminy');
const PORT = Number(process.env.PORT) || 8124;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.mp3': 'audio/mpeg', '.md': 'text/plain; charset=utf-8',
};

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
