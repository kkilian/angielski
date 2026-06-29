// build-podglad.js — lokalne narzędzie do nauki: jeden wspólny podgląd WSZYSTKICH minikursów
// (M1, M2, … gdy powstaną) w stylu „html z blurrem". Angielski rozmazany dopóki nie klikniesz,
// tagi Zasiew/Splot/Składanka, chipsy nowych klocków, jedna zakładka ⭐ Powtórki (klucz `kurs.stars`)
// oraz przycisk „⬇ Wyeksportuj JSON" — eksport gwiazdkowanych zdań do kart Anki (skill `przejmij-json`).
//
// Zero zależności. Uruchom: `node tools/build-podglad.js` → ~/angielski/podglad.html
// Plik wyjściowy jest lokalny (w .gitignore); commitujemy renderer, nie wynik.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'podglad.html');
const slownik = JSON.parse(fs.readFileSync(path.join(ROOT, 'slownik.json'), 'utf8'));
const mkTitle = (mk) => {
  const e = (slownik.minikursy || []).find((m) => m.id === `m${mk}`);
  return e ? { tytul: e.tytul, temat: e.temat || '' } : { tytul: `Minikurs ${mk}`, temat: '' };
};

const etapFromLocal = (n) => (n <= 4 ? 'I' : n <= 6 ? 'II' : n <= 9 ? 'III' : n === 10 ? 'IV' : 'V');
const ETAPN = { I: 'Etap I · fundament (PL→EN)', II: 'Etap II · powtórka (EN→PL)', III: 'Etap III · splatanie + gramatyka C1', IV: 'Etap IV · słuchanka', V: 'Etap V · egzamin (EN-only)' };

// nowe zwroty wprowadzane w danym dziale (Etap II/IV/V tylko recyklingują → brak chipsów)
function newExprFor(dzialId, etap) {
  if (['II', 'IV', 'V'].includes(etap)) return [];
  return slownik.wyrazenia.filter((e) => e.intro === dzialId).map((e) => e.en);
}

const H = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// escape do wartości atrybutu HTML (np. data-*) — zachowuje poprawny JSON po stronie przeglądarki
const A = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function inline(s) {
  return H(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/`(.+?)`/g, '<code>$1</code>');
}
// czysty tekst (bez znaczników md) — do data-en/data-pl i do dopasowywania klocków
const plain = (s) => String(s).replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '').replace(/\s+/g, ' ').trim();

// ---- parser markdown działu ----
function parse(md) {
  const lines = md.split('\n');
  let title = '';
  const groups = [];
  let cur = null, inExtra = false, extra = [];
  for (const ln of lines) {
    if (/^#\s/.test(ln) && !title) { title = ln.replace(/^#\s+/, '').trim(); continue; }
    if (/^##\s+Nowe/.test(ln)) { inExtra = true; continue; }
    if (inExtra) { extra.push(ln); continue; }
    const g = ln.match(/^##\s+(.*)$/);
    if (g) { cur = { name: g[1].trim(), cap: '', mode: '', rows: [] }; groups.push(cur); continue; }
    const cm = ln.match(/^<!--\s*(.*?)\s*-->/);
    if (cm && cur) {
      const c = cm[1];
      const mm = c.match(/mode:\s*(.+)/i);
      if (mm) cur.mode = mm[1].trim(); else cur.cap = c;
      continue;
    }
    if (/^\|/.test(ln)) {
      if (/^\|\s*polski/i.test(ln) || /^\|\s*-+/.test(ln)) continue;
      const cells = ln.split('|').slice(1, -1).map((x) => x.trim());
      if (cells.length >= 2 && cur) cur.rows.push({ pl: cells[0], en: cells.slice(1).join(' | ') });
    }
  }
  return { title, groups, extra };
}

function renderExtra(lines) {
  let html = '', inTable = false, inList = false;
  const close = () => { if (inList) { html += '</ul>'; inList = false; } if (inTable) { html += '</table>'; inTable = false; } };
  for (let ln of lines) {
    if (!ln.trim()) continue;
    if (/^\|/.test(ln)) {
      if (/^\|\s*polski/i.test(ln) || /^\|\s*-+/.test(ln)) continue;
      if (!inTable) { close(); html += '<table class="nw">'; inTable = true; }
      const c = ln.split('|').slice(1, -1).map((x) => x.trim());
      html += `<tr><td>${inline(c[0])}</td><td class="enx">${inline(c.slice(1).join(' | '))}</td></tr>`;
      continue;
    }
    if (/^\*\*[^*]+\*\*:?\s*$/.test(ln.trim())) { close(); html += `<h4>${inline(ln.trim().replace(/:$/, ''))}</h4>`; continue; }
    if (/^[-*]\s+/.test(ln.trim())) { if (!inList) { close(); html += '<ul>'; inList = true; } html += `<li>${inline(ln.trim().replace(/^[-*]\s+/, ''))}</li>`; continue; }
    close(); html += `<p>${inline(ln.trim())}</p>`;
  }
  close();
  return html;
}

function tag(g) {
  const c = (g.cap || '').toLowerCase();
  if (g.mode) return ['mode', g.mode];
  if (c.includes('zasiew')) return ['seed', 'Zasiew'];
  if (c.includes('splot')) return ['splot', 'Splot'];
  if (c.includes('składank') || c.includes('domkni')) return ['skladanka', 'Składanka'];
  if (c.includes('quick') || c.includes('produkcja')) return ['mode', c.includes('quick') ? 'quick-check' : 'produkcja'];
  return ['plain', 'Grupa'];
}

// ---- term patterns: zamień zwrot klocka na zestaw regexów (warianty czasownika, partykuły, zaimki) ----
const _PART = new Set(['up', 'out', 'in', 'off', 'back', 'home', 'apart', 'even', 'aside', 'around', 'base', 'over', 'on', 'by', 'behind', 'through', 'together']);
const _LIGHT = new Set(['have', 'has', 'had', 'be', 'am', 'is', 'are', 'get', 'got', 'go', 'take', 'make', 'put', 'do']);
const _esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const _verbAlt = (v) => {
  const b = v.replace(/e$/, '');
  let alts = `${_esc(v)}|${_esc(b)}(?:e|es|ed|ing|d)`;
  // podwojenie spółgłoski w jednosylabowych CVC: wrap→wrapping/wrapped, get→getting, put→putting
  if (/[aeiou][bcdfghjklmnpqrstvz]$/i.test(v) && !/[aeiou]{2}[bcdfghjklmnpqrstvz]$/i.test(v)) {
    alts += `|${_esc(v + v.slice(-1))}(?:ing|ed)`;
  }
  return alts;
};
function termSourcesFor(rawx) {
  const set = new Set();
  let s = String(rawx).toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[·;]/g, '/');
  for (let part of s.split('/')) {
    part = part.trim().replace(/^to\s+/, '').replace(/^(the|a|an)\s+/, '').replace(/\s+/g, ' ').trim();
    if (part.length < 3) continue;
    let toks = part.split(' ');
    if (toks.length === 2 && _PART.has(toks[1])) { set.add(`\\b(?:${_verbAlt(toks[0])})\\b(?:\\s+\\w+){0,3}\\s+${_esc(toks[1])}\\b`); continue; }
    if (toks.length >= 3 && _LIGHT.has(toks[0]) && !_PART.has(toks[1])) toks = toks.slice(1);
    let phrase = _esc(toks.join(' ')).replace(/\\?\b(my|your|his|her|their|our)\b/g, '(?:my|your|his|her|their|our)');
    set.add(`\\b${phrase}\\b`);
  }
  return [...set];
}
function termSources(exprs) {
  const set = new Set();
  for (const e of exprs) for (const t of termSourcesFor(e)) set.add(t);
  return [...set];
}

// ---- dopasowanie klocków w zdaniu (do cloze) — leksykalne klocki dla danego działu ----
const LEX = (slownik.wyrazenia || []).filter((e) => e.typ !== 'gramatyka');
function blocksForDzial(id) {
  return LEX.filter((e) => e.intro === id || (e.review || []).includes(id))
    .map((e) => { let re = null; try { re = new RegExp('(' + termSourcesFor(e.en).join('|') + ')', 'i'); } catch { } return { id: e.id, re }; })
    .filter((b) => b.re);
}
// zwraca [{text, block}] — pierwsze trafienie każdego klocka, bez nakładających się zakresów
function findTargets(text, blocks) {
  const hits = [];
  for (const b of blocks) {
    const m = b.re.exec(text);
    if (m) hits.push({ text: m[0], start: m.index, end: m.index + m[0].length, block: b.id });
  }
  hits.sort((a, b) => (b.end - b.start) - (a.end - a.start)); // dłuższe mają pierwszeństwo
  const kept = [];
  for (const h of hits) {
    if (kept.some((k) => !(h.end <= k.start || h.start >= k.end))) continue;
    kept.push(h);
  }
  kept.sort((a, b) => a.start - b.start);
  return kept.map((h) => ({ text: h.text, block: h.block }));
}

// ---- audio: pliki grupa-N.mp3 w folderze działu (jak generate.js findGroups, ale bez ?v= —
//      dzięki temu względne ścieżki działają też z file://, nie tylko z serwera) ----
function audioForDir(dir) {
  const abs = path.join(ROOT, dir);
  const found = new Map();
  const scan = (absDir, relDir) => {
    let entries; try { entries = fs.readdirSync(absDir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (!e.isFile()) continue;
      const m = e.name.match(/^grupa-(\d+)\.mp3$/i);
      if (m && !found.has(Number(m[1]))) found.set(Number(m[1]), `${relDir}/${e.name}`);
    }
  };
  scan(abs, dir);
  if (found.size === 0) {
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
      if (e.isDirectory()) scan(path.join(abs, e.name), `${dir}/${e.name}`);
    }
  }
  return [...found.keys()].sort((a, b) => a - b).map((n) => found.get(n));
}

// ---- zbierz działy ze wszystkich minikursów ----
const dirs = fs.readdirSync(ROOT)
  .filter((n) => /^(\d{2})-m(\d+)d(\d+)-/.test(n) && fs.existsSync(path.join(ROOT, n, 'rozdzial.md')))
  .sort((a, b) => parseInt(a) - parseInt(b));

const items = dirs.map((dir) => {
  const m = dir.match(/^(\d{2})-m(\d+)d(\d+)-/);
  const mk = Number(m[2]), ln = Number(m[3]);
  const md = fs.readFileSync(path.join(ROOT, dir, 'rozdzial.md'), 'utf8');
  const etap = etapFromLocal(ln);
  const id = `m${mk}-d${ln}`;
  const P = parse(md);
  return {
    id, mk, ln, dir, etap, parsed: P, title: P.title,
    sentenceCount: P.groups.reduce((s, g) => s + g.rows.length, 0),
    newExpressions: newExprFor(id, etap),
    blocks: blocksForDzial(id),
    audio: audioForDir(dir),
  };
});

const minikursy = [...new Set(items.map((it) => it.mk))].sort((a, b) => a - b);
const TERMS = {};
for (const it of items) TERMS[it.id] = termSources(it.newExpressions);

// ---- buduj: kafle (home), nav per-minikurs, widoki minikursów ----
const mkMeta = {};
for (const mk of minikursy) {
  const its = items.filter((x) => x.mk === mk);
  mkMeta[mk] = { ...mkTitle(mk), dz: its.length, zd: its.reduce((s, i) => s + i.sentenceCount, 0) };
}
const presentSet = new Set(minikursy.map((m) => 'm' + m));
const lockedMk = (slownik.minikursy || []).filter((m) => !presentSet.has(m.id))
  .map((m) => ({ num: Number(String(m.id).replace(/^m/, '')), tytul: m.tytul, temat: m.temat || '' }))
  .filter((m) => m.num).sort((a, b) => a.num - b.num);
const clip = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; };

let tiles = '';
let navGroups = '';
let mkViews = '';
for (const mk of minikursy) {
  const meta = mkMeta[mk];
  tiles += `<button class="tile" data-go="${mk}"><span class="t-num">M${mk}</span><span class="t-body"><span class="t-title">${H(meta.tytul)}</span>${meta.temat ? `<span class="t-sub">${H(clip(meta.temat, 120))}</span>` : ''}<span class="t-meta">${meta.dz} ${meta.dz === 1 ? 'dział' : 'działów'} · ${meta.zd} zdań</span></span><span class="t-chev">›</span></button>`;
  let navLinks = '';
  let articles = '';
  for (const it of items.filter((x) => x.mk === mk)) {
    const P = it.parsed;
    const navTitle = P.title.split('/')[0].replace(/^M\d+\s*·\s*Dział\s*\d+:\s*/, '').trim();
    navLinks += `<a href="#${it.id}">D${it.ln} · ${H(navTitle)}</a>`;
    const dPlay = it.audio.length
      ? `<button class="play-btn" data-audio="${A(JSON.stringify(it.audio))}" data-label="${A('D' + it.ln + ' · ' + navTitle)}">▶︎ Odtwórz audio${it.audio.length > 1 ? ` · ${it.audio.length} grup` : ''}</button>`
      : '';
    const chips = it.newExpressions.map((e) => `<span class="chip">${H(e)}</span>`).join('');
    let groupsHtml = '';
    P.groups.forEach((g, gi) => {
      const [cls, label] = tag(g);
      let rows = '';
      for (const r of g.rows) {
        const k = (r.pl + ' ||| ' + r.en).replace(/"/g, '&quot;');
        const plEN = plain(r.en), plPL = plain(r.pl);
        const tgts = findTargets(plEN, it.blocks);
        const targets = JSON.stringify(tgts.map((t) => t.text));
        const blocks = JSON.stringify([...new Set(tgts.map((t) => t.block))]);
        rows += `<tr data-k="${k}" data-pl="${A(plPL)}" data-en="${A(plEN)}" data-targets="${A(targets)}" data-blocks="${A(blocks)}" data-mk="${it.mk}" data-d="${it.ln}">`
          + `<td class="star"><button class="star-btn" title="Do powtórki">☆</button></td>`
          + `<td class="pl">${inline(r.pl)}</td><td class="en">${inline(r.en)}</td></tr>`;
      }
      // grupy zdań mapują się 1:1 na grupa-(gi+1).mp3 (P.groups w kolejności dokumentu)
      const gAudio = it.audio[gi];
      const gTyp = (label && label !== 'Grupa') ? ' · ' + label : '';
      const gPlay = gAudio ? `<button class="play-btn gplay" data-audio="${A(JSON.stringify([gAudio]))}" data-label="${A('D' + it.ln + ' · ' + g.name + gTyp)}" title="Odtwórz tę grupę">▶︎</button>` : '';
      groupsHtml += `<section class="group ${cls}"><div class="ghead"><span class="gtag">${H(label)}</span><span class="gname">${H(g.name)}</span>${gPlay}</div>${g.cap ? `<div class="gcap">${H(g.cap)}</div>` : ''}<table>${rows}</table></section>`;
    });
    articles += `<article class="dzial" id="${it.id}" data-id="${it.id}">
      <div class="dhead">
        <div class="detap">M${it.mk} · ${H(ETAPN[it.etap] || ('Etap ' + it.etap))}</div>
        <h3>${H(P.title)}</h3>
        <div class="dmeta">${it.sentenceCount} zdań${it.newExpressions.length ? ` · ${it.newExpressions.length} nowych zwrotów` : ''}</div>
        ${dPlay ? `<div class="dplay">${dPlay}</div>` : ''}
        ${chips ? `<div class="chips"><span class="cl">nowe:</span> ${chips}</div>` : ''}
      </div>
      ${groupsHtml}
      <details class="extra"><summary>Nowe słowa i struktury · wymowa · typowe błędy</summary>${renderExtra(P.extra)}</details>
    </article>`;
  }
  const mkAudio = items.filter((x) => x.mk === mk).flatMap((x) => x.audio);
  const mkPlay = mkAudio.length
    ? `<div class="mkplay"><button class="play-btn play-mk" data-audio="${A(JSON.stringify(mkAudio))}" data-label="${A('Cały M' + mk)}">▶︎ Odtwórz cały minikurs · ${mkAudio.length} grup</button></div>`
    : '';
  navGroups += `<div class="navgroup" data-mk="${mk}"><div class="navmk">M${mk} — ${H(meta.tytul)}</div>${navLinks}</div>`;
  mkViews += `<section class="mk-view" data-mk="${mk}">
    <div class="mkhead"><h2>M${mk} — ${H(meta.tytul)}</h2>${meta.temat ? `<p>${H(meta.temat)}</p>` : ''}${mkPlay}</div>
    ${articles}
  </section>`;
}
const lockedTiles = lockedMk.map((m) => `<div class="tile tile-locked"><span class="t-num">M${m.num}</span><span class="t-body"><span class="t-title">${H(m.tytul)}</span><span class="t-meta t-soon">⌛ wkrótce</span></span></div>`).join('');

const totalSent = items.reduce((a, b) => a + b.sentenceCount, 0);

const html = `<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Podgląd kursu — M1 + M2 (nauka + eksport do Anki)</title>
<style>
:root{--bg:#f6f4ef;--card:#fff;--ink:#1f2328;--muted:#6b7280;--line:#e7e3da;--accent:#b4541f;
--seed:#2f7d57;--splot:#3060a8;--skladanka:#7a5bb0;--mode:#b8860b}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16.5px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.layout{display:flex;gap:0;align-items:flex-start}
#sidenav{position:sticky;top:0;height:100vh;overflow:auto;width:250px;flex:none;background:#efece4;border-right:1px solid var(--line);padding:16px 12px;font-size:13.5px;display:none}
#sidenav.is-active{display:block}
#sidenav .navback{display:block;color:var(--accent);font-weight:700;text-decoration:none;padding:5px 8px;border-radius:7px;margin-bottom:6px}
#sidenav .navback:hover{background:#e3ded3}
#sidenav .navmk{font-weight:700;color:var(--accent);margin:14px 4px 4px;font-size:12px;text-transform:uppercase;letter-spacing:.05em}
#sidenav a{display:block;color:#374151;text-decoration:none;padding:5px 8px;border-radius:7px;line-height:1.3}
#sidenav a:hover{background:#e3ded3}
.navgroup{display:none}.navgroup.is-active{display:block}
/* home (wybór minikursu) + widoki minikursów */
.home,.mk-view{display:none}
.home.is-active,.mk-view.is-active{display:block}
.home-hero{margin:6px 0 18px}
.home-hero .kicker{font-size:12px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.06em}
.home-hero h1{margin:4px 0 4px;font-size:26px}
.home-hero p{margin:0;color:var(--muted);font-size:14px}
.tiles{display:flex;flex-direction:column;gap:12px}
.tile{display:flex;align-items:center;gap:14px;width:100%;text-align:left;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 18px;box-shadow:0 1px 2px rgba(0,0,0,.03)}
.tile:hover{border-color:var(--accent)}
.tile .t-num{font-size:20px;font-weight:800;color:var(--accent);min-width:42px}
.tile .t-body{display:flex;flex-direction:column;gap:3px;flex:1;min-width:0}
.tile .t-title{font-size:17px;font-weight:700}
.tile .t-sub{font-size:13px;color:var(--muted);line-height:1.4}
.tile .t-meta{font-size:12.5px;color:var(--muted);font-weight:600}
.tile .t-chev{font-size:22px;color:var(--muted)}
.tile-locked{opacity:.6;cursor:default}
.tile-locked:hover{border-color:var(--line)}
.tile .t-soon{color:#9a6b00}
main{flex:1;min-width:0;max-width:880px;margin:0 auto;padding:20px 22px 90px}
.topbar{position:sticky;top:0;z-index:5;background:rgba(246,244,239,.93);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:12px 0;border-bottom:1px solid var(--line);display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:14px}
.topbar h1{font-size:18px;margin:0;margin-right:auto}
button{font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;border:1px solid var(--line);background:var(--card);color:var(--ink);padding:7px 13px;border-radius:999px}
button.on{background:var(--accent);color:#fff;border-color:var(--accent)}
#export-json{border-color:#2f7d57;color:#1d5b3c}
#export-json:hover{background:#2f7d57;color:#fff;border-color:#2f7d57}
.intro{font-size:13.5px;color:var(--muted);margin:0 0 16px;line-height:1.5}
.legend{display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-size:12.5px;color:var(--muted);margin:0 0 16px}
u.new{text-decoration:none;background:linear-gradient(transparent 62%,#ffe08a 62%,#ffe08a 92%,transparent 92%);padding:0 1px;border-radius:2px;font-weight:700}
.mkhead{margin:24px 0 14px;padding-bottom:8px;border-bottom:2px solid var(--accent)}
.mkhead h2{margin:0;font-size:21px;color:var(--accent)}
.mkhead p{margin:3px 0 0;color:var(--muted);font-size:13.5px}
.dzial{margin:0 0 26px}
.dhead{margin:18px 0 12px}
.detap{font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
.dhead h3{margin:3px 0 6px;font-size:19px;letter-spacing:-.01em}
.dmeta{font-size:13px;color:var(--muted)}
.chips{margin:8px 0 0;font-size:13px}.chips .cl{color:var(--muted)}
.dplay{margin:9px 0 0}.mkplay{margin:10px 0 0}
.play-btn{border-color:var(--accent);color:var(--accent);font-weight:700}
.play-btn:hover{background:var(--accent);color:#fff}
.play-btn.playing{background:var(--accent);color:#fff}
.play-mk{font-size:14px;padding:8px 16px}
.gplay{margin-left:auto;align-self:center;font-size:12px;padding:4px 12px;line-height:1}
#audiobar{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;align-items:center;gap:12px;
  padding:10px 16px;background:rgba(255,255,255,.97);border-top:1px solid var(--line);
  box-shadow:0 -2px 14px rgba(0,0,0,.08);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
#audiobar[hidden]{display:none}
.audio-now{font-size:13.5px;font-weight:700;color:var(--accent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:42%}
#audiobar audio{flex:1;height:38px;min-width:0}
#audio-close{flex:none;border:1px solid var(--line);background:var(--card);border-radius:999px;padding:6px 11px;color:var(--muted)}
#audio-close:hover{color:var(--ink);border-color:var(--muted)}
.chip{display:inline-block;background:#eaf3ee;border:1px solid #cfe6da;color:#256048;border-radius:999px;padding:2px 9px;margin:2px 4px 2px 0;font-size:12.5px;font-weight:600}
.group{background:var(--card);border:1px solid var(--line);border-radius:13px;margin:0 0 14px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.03)}
.ghead{display:flex;align-items:baseline;gap:10px;padding:11px 15px 3px}
.gtag{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:3px 8px;border-radius:6px;color:#fff;white-space:nowrap}
.gname{font-size:15.5px;font-weight:700}
.gcap{padding:0 15px 9px;color:var(--muted);font-size:13px}
.seed .gtag{background:var(--seed)}.seed{border-left:4px solid var(--seed)}
.splot .gtag{background:var(--splot)}.splot{border-left:4px solid var(--splot)}
.skladanka .gtag{background:var(--skladanka)}.skladanka{border-left:4px solid var(--skladanka)}
.mode .gtag{background:var(--mode)}.mode{border-left:4px solid var(--mode)}
.plain .gtag{background:#9aa0a6}.plain{border-left:4px solid #9aa0a6}
table{width:100%;border-collapse:collapse}
td{padding:8px 15px;vertical-align:top;border-top:1px solid var(--line)}
tr:first-child td{border-top:none}
td.star{width:34px;text-align:center;padding-left:8px;padding-right:0}
td.pl{width:46%;color:#374151}
td.en{width:50%;font-weight:600}
body.study td.en{filter:blur(5px);cursor:pointer;transition:filter .12s}
body.study td.en.show{filter:none}
.star-btn{background:none;border:none;padding:2px 4px;border-radius:8px;font-size:17px;line-height:1;cursor:pointer;color:#c2c7cf;opacity:.7;transition:transform .1s,opacity .1s}
.star-btn:hover{opacity:1;transform:scale(1.15)}
.star-btn.on{opacity:1;color:var(--accent)}
.review{display:none;margin:0 0 22px}
.review .rhead{display:flex;align-items:baseline;gap:10px;margin:6px 0 14px;padding-bottom:8px;border-bottom:2px solid var(--accent);flex-wrap:wrap}
.review .rhead h2{margin:0;font-size:21px;color:var(--accent)}
.review .rhead .rcount{color:var(--muted);font-size:13.5px}
.review .rhead .rhint{color:var(--muted);font-size:12.5px;flex-basis:100%}
.review td.en{filter:blur(5px);cursor:pointer;transition:filter .12s}
.review td.en.show{filter:none}
#review-empty{color:var(--muted);font-size:14px;font-style:italic;padding:10px 2px}
body.review-mode #sidenav,body.review-mode .legend,body.review-mode .intro,body.review-mode .home,body.review-mode .mk-view{display:none}
body.review-mode .review{display:block}
.extra{margin-top:6px;background:var(--card);border:1px solid var(--line);border-radius:13px;padding:4px 16px}
.extra summary{cursor:pointer;font-weight:600;padding:10px 0;font-size:14px}
.extra h4{font-size:14px;margin:14px 0 5px}
.extra ul{margin:6px 0;padding-left:20px}.extra li{margin:3px 0;font-size:14.5px}
.extra td{font-size:14px}.extra td.enx{color:var(--seed);font-weight:600}
.extra code{background:#f1ede5;padding:1px 4px;border-radius:4px}
@media(max-width:760px){#sidenav{display:none!important}}
</style></head>
<body>
<div class="layout">
<nav id="sidenav"><a href="#" class="navback" id="nav-home">← Kursy</a>${navGroups}</nav>
<main>
  <div class="topbar">
    <button id="back-home" hidden>← Kursy</button>
    <h1 id="topbar-title">Angielski — podgląd</h1>
    <button id="toggle">🙈 Ukryj angielski</button>
    <button id="review-toggle">⭐ Powtórki (<span id="review-toggle-count">0</span>)</button>
    <button id="export-json" title="Pobierz gwiazdkowane zdania jako JSON do Anki">⬇ Wyeksportuj JSON</button>
  </div>
  <p class="intro">📋 Podgląd tekstu kursu. Wybierz minikurs (M1 / M2). „🙈 Ukryj angielski" → kolumna EN się rozmazuje, klikasz pojedyncze zdanie, żeby je odsłonić (mów na głos, sprawdzaj się). ☆ przy zdaniu wrzuca je do <b>⭐ Powtórki</b> (wspólne dla całego kursu). W Powtórkach „⬇ Wyeksportuj JSON" pobiera oznaczone zdania → dajesz mi JSON, a skill <b>przejmij-json</b> robi z nich karty Anki (luka C1: PL u góry, EN z luką).</p>
  <div class="legend"><span><u class="new">podkreślone</u> = nowe klocki w TYM dziale</span></div>
  <section class="review">
    <div class="rhead"><h2>⭐ Powtórki</h2><span class="rcount" id="review-count">0 par</span><span class="rhint">Kliknij „⬇ Wyeksportuj JSON" u góry, żeby zrobić z nich karty Anki.</span></div>
    <div class="group plain" id="review-box"><table><tbody id="review-body"></tbody></table></div>
    <p id="review-empty">Oznacz pary gwiazdką (☆) przy zdaniach, które sprawiły kłopot — wylądują tutaj do powtórki.</p>
  </section>
  <section class="home" id="home">
    <div class="home-hero">
      <div class="kicker">B2 → C1 · American English</div>
      <h1>Wybierz minikurs</h1>
      <p>⭐ Powtórki i eksport do Anki działają na cały kurs — niezależnie od tego, który minikurs otworzysz.</p>
    </div>
    <div class="tiles">${tiles}${lockedTiles}</div>
  </section>
  ${mkViews}
  <footer style="color:var(--muted);font-size:13px;margin-top:30px">${minikursy.length} ${minikursy.length === 1 ? 'minikurs' : 'minikursy'} · ${items.length} działów · ${totalSent} zdań · narzędzie lokalne do nauki i eksportu do Anki.</footer>
</main>
</div>
<div id="audiobar" hidden>
  <span id="audio-now" class="audio-now"></span>
  <audio id="player" controls preload="none"></audio>
  <button id="audio-close" title="Zamknij odtwarzacz">✕</button>
</div>
<script>
const TERMS = ${JSON.stringify(TERMS)};
const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
document.querySelectorAll('article.dzial').forEach(art=>{
  const terms = TERMS[art.dataset.id]||[];
  if(!terms.length) return;
  let re; try{ re = new RegExp('('+terms.join('|')+')','gi'); }catch(e){ return; }
  art.querySelectorAll('section.group td.en').forEach(td=>{
    if(/[<]/.test(td.innerHTML)) td.innerHTML = td.innerHTML.replace(re, m=>'<u class="new">'+m+'</u>');
    else td.innerHTML = esc(td.textContent).replace(re, m=>'<u class="new">'+m+'</u>');
  });
});
const body=document.body, btn=document.getElementById('toggle');
btn.addEventListener('click',()=>{
  const on=body.classList.toggle('study');
  btn.classList.toggle('on',on);
  btn.textContent = on?'👁 Pokaż angielski':'🙈 Ukryj angielski';
  if(!on) document.querySelectorAll('td.en.show').forEach(e=>e.classList.remove('show'));
});
document.addEventListener('click',e=>{
  const td=e.target.closest('td.en');
  if(td && (body.classList.contains('study')||body.classList.contains('review-mode'))) td.classList.toggle('show');
});
// ---- ⭐ Powtórki (jeden wspólny zbiór gwiazdek dla całego kursu) ----
const KEY='kurs.stars';
let stars; try{ stars=new Set(JSON.parse(localStorage.getItem(KEY)||'[]')); }catch(e){ stars=new Set(); }
function save(){ try{ localStorage.setItem(KEY, JSON.stringify([...stars])); }catch(e){} }
function rowKey(tr){ return tr.getAttribute('data-k'); }
function refreshCounts(){
  const n=stars.size;
  document.getElementById('review-toggle-count').textContent=n;
  document.getElementById('review-count').textContent=n+' '+(n===1?'para':(n%10>=2&&n%10<=4&&!(n%100>=12&&n%100<=14)?'pary':'par'));
  document.getElementById('review-empty').style.display=n?'none':'block';
}
function markStars(){
  document.querySelectorAll('section.group tr[data-k]').forEach(tr=>{
    const b=tr.querySelector('.star-btn'); if(!b) return;
    const on=stars.has(rowKey(tr)); b.classList.toggle('on',on); b.textContent=on?'⭐':'☆';
  });
}
function buildReview(){
  const tb=document.getElementById('review-body'); tb.innerHTML='';
  document.querySelectorAll('section.group tr[data-k]').forEach(tr=>{
    if(!stars.has(rowKey(tr))) return;
    const pl=tr.querySelector('td.pl').innerHTML, en=tr.querySelector('td.en').innerHTML;
    const k=tr.getAttribute('data-k');
    const row=document.createElement('tr'); row.setAttribute('data-k',k);
    row.innerHTML='<td class="star"><button class="star-btn on">⭐</button></td><td class="pl">'+pl+'</td><td class="en">'+en+'</td>';
    tb.appendChild(row);
  });
}
document.addEventListener('click',e=>{
  const b=e.target.closest('.star-btn'); if(!b) return;
  const tr=b.closest('tr[data-k]'); if(!tr) return;
  const k=rowKey(tr);
  if(stars.has(k)) stars.delete(k); else stars.add(k);
  save(); markStars(); refreshCounts();
  if(body.classList.contains('review-mode')) buildReview();
});
document.getElementById('review-toggle').addEventListener('click',()=>{
  const on=body.classList.toggle('review-mode');
  document.getElementById('review-toggle').classList.toggle('on',on);
  if(on){ buildReview(); window.scrollTo(0,0); }
});
// ---- ⬇ Eksport JSON (gwiazdkowane → karty Anki przez skill przejmij-json) ----
function collectStarredCards(){
  const cards=[];
  document.querySelectorAll('section.group tr[data-k]').forEach(tr=>{
    if(!stars.has(rowKey(tr))) return;
    let targets=[], blocks=[];
    try{ targets=JSON.parse(tr.dataset.targets||'[]'); }catch(e){}
    try{ blocks=JSON.parse(tr.dataset.blocks||'[]'); }catch(e){}
    cards.push({ pl:tr.dataset.pl, en:tr.dataset.en, targets, blocks,
                 mk:Number(tr.dataset.mk), d:Number(tr.dataset.d) });
  });
  return cards;
}
window.collectStarredCards = collectStarredCards; // hook do weryfikacji headless
document.getElementById('export-json').addEventListener('click',()=>{
  const cards=collectStarredCards();
  if(!cards.length){ alert('Najpierw oznacz zdania gwiazdką (☆).'); return; }
  const out={ source:'angielski-podglad', deck:'angielski', exportedAt:new Date().toISOString(), cards };
  const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const dt=new Date(), pad=x=>String(x).padStart(2,'0');
  a.href=url; a.download='powtorki-angielski-'+dt.getFullYear()+pad(dt.getMonth()+1)+pad(dt.getDate())+'.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
});
// ---- ▶︎ Audio: kolejka grup (grupa-1 → grupa-2 → …) na jednym <audio> ----
const player=document.getElementById('player');
const audiobar=document.getElementById('audiobar');
const audioNow=document.getElementById('audio-now');
let queue=[], qi=0, qlabel='', activeBtn=null;
function setActiveBtn(btn){
  if(activeBtn && activeBtn!==btn) activeBtn.classList.remove('playing');
  activeBtn=btn||null; if(activeBtn) activeBtn.classList.add('playing');
}
function loadCurrent(){
  player.src=queue[qi]||'';
  audioNow.textContent=qlabel+(queue.length>1?'  ·  grupa '+(qi+1)+'/'+queue.length:'');
}
function playQueue(list,label,btn){
  queue=list.slice(); qi=0; qlabel=label||'Audio'; setActiveBtn(btn);
  audiobar.hidden=!queue.length; if(!queue.length) return;
  loadCurrent(); player.play().catch(()=>{});
}
player.addEventListener('ended',()=>{
  if(qi<queue.length-1){ qi++; loadCurrent(); player.play().catch(()=>{}); }
  else setActiveBtn(null);
});
document.addEventListener('click',e=>{
  const pb=e.target.closest('.play-btn'); if(!pb) return;
  let list=[]; try{ list=JSON.parse(pb.dataset.audio||'[]'); }catch(e){}
  if(!list.length) return;
  if(pb===activeBtn && !player.paused){ player.pause(); return; } // ten sam → pauza
  if(pb===activeBtn && player.paused){ player.play().catch(()=>{}); return; } // ten sam → wznów
  playQueue(list, pb.dataset.label, pb);
});
document.getElementById('audio-close').addEventListener('click',()=>{
  player.pause(); audiobar.hidden=true; setActiveBtn(null);
});
// ---- nawigacja dwupoziomowa: home (wybór minikursu) → widok minikursu ----
const sidenav=document.getElementById('sidenav');
const backHomeBtn=document.getElementById('back-home');
const titleEl=document.getElementById('topbar-title');
const MK_TITLES={};
document.querySelectorAll('.mk-view').forEach(v=>{ const h=v.querySelector('.mkhead h2'); MK_TITLES[v.dataset.mk]=h?h.textContent:('M'+v.dataset.mk); });
function showHome(){
  document.querySelectorAll('.mk-view').forEach(v=>v.classList.remove('is-active'));
  document.getElementById('home').classList.add('is-active');
  sidenav.classList.remove('is-active');
  document.querySelectorAll('.navgroup').forEach(g=>g.classList.remove('is-active'));
  backHomeBtn.hidden=true;
  titleEl.textContent='Angielski — podgląd';
  window.scrollTo(0,0);
}
function showMk(n){
  n=String(n);
  const view=document.querySelector('.mk-view[data-mk="'+n+'"]'); if(!view) return;
  document.getElementById('home').classList.remove('is-active');
  document.querySelectorAll('.mk-view').forEach(v=>v.classList.toggle('is-active', v===view));
  document.querySelectorAll('.navgroup').forEach(g=>g.classList.toggle('is-active', g.dataset.mk===n));
  sidenav.classList.add('is-active');
  backHomeBtn.hidden=false;
  titleEl.textContent=MK_TITLES[n]||('M'+n);
  window.scrollTo(0,0);
}
document.addEventListener('click',e=>{
  const tile=e.target.closest('.tile[data-go]'); if(tile){ showMk(tile.dataset.go); }
});
backHomeBtn.addEventListener('click',e=>{ e.preventDefault(); if(body.classList.contains('review-mode')) document.getElementById('review-toggle').click(); showHome(); });
document.getElementById('nav-home').addEventListener('click',e=>{ e.preventDefault(); showHome(); });
document.addEventListener('click',e=>{
  const a=e.target.closest('#sidenav a[href^="#m"]'); if(!a) return;
  const id=a.getAttribute('href').slice(1), art=document.getElementById(id);
  if(art){ const mkv=art.closest('.mk-view'); if(mkv) showMk(mkv.dataset.mk); setTimeout(()=>art.scrollIntoView({behavior:'smooth'}),0); }
});

markStars(); refreshCounts(); showHome();
</script>
</body></html>`;

fs.writeFileSync(OUT, html);
console.log('Podgląd:', OUT);
console.log('Minikursy:', minikursy.map((m) => 'M' + m).join(', '), '| działów:', items.length, '| zdań:', totalSent);
for (const it of items) console.log(' ', it.id, '·', it.sentenceCount, 'zdań ·', it.newExpressions.length, 'nowych');
