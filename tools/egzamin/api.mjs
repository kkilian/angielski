// Klienci API egzaminu głosowego. Zero zależności — Node 24 (fetch/FormData/Blob).
// Klucze: env → fallback z ~/Desktop/coach-2.0/main.js (wzorzec assemble-audio.js).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const COACH_MAIN = path.join(os.homedir(), 'Desktop', 'coach-2.0', 'main.js');
const MODEL_LLM = 'claude-sonnet-5';
const INSTR_EN = 'Speak in natural, native General American English. Calm and clear tone, medium pace. Conversational, not theatrical.';

let cache = null;
export function klucze() {
  if (cache) return cache;
  let openai = process.env.OPENAI_API_KEY || null;
  let anthropic = process.env.ANTHROPIC_API_KEY || null;
  if (!openai || !anthropic) {
    try {
      const src = fs.readFileSync(COACH_MAIN, 'utf8');
      openai = openai || (src.match(/const OPENAI_API_KEY = '([^']+)'/) || [])[1] || null;
      anthropic = anthropic || (src.match(/const CLAUDE_API_KEY = '([^']+)'/) || [])[1] || null;
    } catch { /* brak COACH-a — zostają env */ }
  }
  cache = { openai, anthropic };
  return cache;
}

async function zRetry(fn, opis) {
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try { return await fn(); } catch (e) {
      lastErr = e;
      if (attempt < 4) await new Promise(r => setTimeout(r, 1500 * attempt));
    }
  }
  throw new Error(`${opis}: ${lastErr?.message || lastErr}`);
}

export function ttsMp3(text) {
  const { openai } = klucze();
  if (!openai) throw new Error('Brak klucza OpenAI (env OPENAI_API_KEY albo coach-2.0/main.js)');
  return zRetry(async () => {
    const resp = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openai}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts', voice: 'cedar', input: text,
        instructions: INSTR_EN, response_format: 'mp3',
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!resp.ok) throw new Error(`TTS ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length === 0) throw new Error('TTS: puste audio dla: ' + text.slice(0, 60));
    return buf;
  }, 'TTS');
}

export function transkrybuj(buf, mime = 'audio/webm') {
  const { openai } = klucze();
  if (!openai) throw new Error('Brak klucza OpenAI');
  return zRetry(async () => {
    const fd = new FormData();
    const ext = mime.includes('mp4') ? 'mp4' : mime.includes('mpeg') ? 'mp3' : 'webm';
    fd.append('file', new Blob([buf], { type: mime }), `odpowiedz.${ext}`);
    fd.append('model', 'whisper-1');
    fd.append('language', 'en');
    fd.append('response_format', 'verbose_json');
    fd.append('timestamp_granularities[]', 'word');
    const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openai}` },
      body: fd,
      signal: AbortSignal.timeout(120_000),
    });
    if (!resp.ok) throw new Error(`STT ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
    const j = await resp.json();
    return {
      text: (j.text || '').trim(),
      words: (j.words || []).map(w => ({ word: w.word, start: w.start, end: w.end })),
      durationSek: j.duration || 0,
    };
  }, 'STT');
}

export function claude({ system, messages, maxTokens = 4000 }) {
  const { anthropic } = klucze();
  if (!anthropic) throw new Error('Brak klucza Anthropic (env ANTHROPIC_API_KEY albo coach-2.0/main.js)');
  return zRetry(async () => {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropic, 'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: MODEL_LLM, max_tokens: maxTokens, system, messages }),
      signal: AbortSignal.timeout(180_000),
    });
    if (!resp.ok) throw new Error(`Claude ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
    const j = await resp.json();
    return (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  }, 'Claude');
}

export async function claudeJson(opts) {
  const raw = await claude(opts);
  const m = raw.match(/```json\s*([\s\S]*?)```/) || raw.match(/```\s*([\s\S]*?)```/);
  const kandydat = (m ? m[1] : raw).trim();
  try { return JSON.parse(kandydat); } catch {
    // ostatnia próba: od pierwszego { do ostatniego }
    const i = kandydat.indexOf('{'), k = kandydat.lastIndexOf('}');
    if (i >= 0 && k > i) { try { return JSON.parse(kandydat.slice(i, k + 1)); } catch { /* niżej */ } }
    throw new Error('Claude: nieparsowalny JSON. Surowy początek: ' + raw.slice(0, 300));
  }
}
