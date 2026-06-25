// app.js — router + silnik audio + Media Session (ekran blokady iOS).
//
// Sedno odtwarzania w tle (zweryfikowane):
//  - jeden, współdzielony <audio> (nie Web Audio API),
//  - tryb "jedna" = natywne audio.loop (obsługuje silnik mediów -> działa przy blokadzie),
//  - tryb "cały" = przejście na zdarzeniu 'ended' + Media Session 'nexttrack' (ręczny fallback),
//  - pierwszy play musi wyjść z dotknięcia użytkownika (dlatego play() w handlerach kliknięć).

const audio = document.getElementById('audio');
const view = document.getElementById('view');
const playerEl = document.getElementById('player');
const backBtn = document.getElementById('back');
const seek = document.getElementById('p-seek');

const ART_SIZES = [96, 128, 192, 256, 384, 512];
const REPEAT_LABEL = { off: 'wył', one: 'jedna', all: 'cały' };

// Znacznik wersji (widoczny w stopce — potwierdza deploy).
const BUILD = 'M1 · v2 · 2026-06-25 · zasiew→splot';
// Etap minikursu wg pozycji części (METODA §3.1: I:4, II:2, III:3, IV:1, V:1).
const STAGES = [
  'Etap I · Fundament', 'Etap I · Fundament', 'Etap I · Fundament', 'Etap I · Fundament',
  'Etap II · Powtórka', 'Etap II · Powtórka',
  'Etap III · Splot', 'Etap III · Splot', 'Etap III · Splot',
  'Etap IV · Słuchanka', 'Etap V · Egzamin',
];
const stageFor = (n) => STAGES[((n - 1) % 11 + 11) % 11] || '';

let DATA = null;
let renderedChapterId = null;
let seeking = false;

const state = {
  chapter: null,
  index: -1,
  repeat: localStorage.getItem('ang.repeat') || 'one',
};

/* ---------- narzędzia ---------- */
const byId = (id) => document.getElementById(id);
const setText = (id, t) => { const el = byId(id); if (el) el.textContent = t; };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function fmt(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}
function throttle(fn, ms) {
  let last = 0;
  return (...a) => { const now = Date.now(); if (now - last >= ms) { last = now; fn(...a); } };
}
// polska odmiana liczebnika
function plural(n, one, few, many) {
  if (n === 1) return one;
  const m10 = n % 10, m100 = n % 100;
  return (m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)) ? few : many;
}
// Tytuł do wyświetlenia bez prefiksu „M1 · Dział N: " / „M1 · Part N: "
// (numer i etap pokazujemy osobno; pełny tytuł zostaje na ekranie blokady).
const cleanTitle = (s) => String(s).replace(/^M\d+\s*·\s*(Dział|Part)\s*\d+:\s*/i, '');
// data builda z content.json (generatedAt) → „YYYY-MM-DD HH:MM"
function fmtBuild(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ---------- silnik audio ---------- */
function loadAndPlay(chapter, index) {
  const g = chapter.groups[index];
  if (!g) return;
  state.chapter = chapter;
  state.index = index;
  audio.src = g.src;
  audio.loop = (state.repeat === 'one');
  audio.play().catch(() => {}); // pierwszy raz musi wyjść z gestu
  updateMediaSession();
  renderPlayer();
  updateActiveUI();
  persist();
}

function selectGroup(chapter, index) {
  // ta sama grupa co aktualnie gra -> pauza/wznowienie; inna -> wczytaj i graj
  if (state.chapter && state.chapter.id === chapter.id && state.index === index) togglePlay();
  else loadAndPlay(chapter, index);
}

function loopGroup(chapter, index) {
  setRepeat('one');
  loadAndPlay(chapter, index);
}

function togglePlay() {
  if (!state.chapter) return;
  if (audio.paused) audio.play().catch(() => {}); else audio.pause();
}

function next() {
  if (!state.chapter) return;
  const len = state.chapter.groups.length;
  loadAndPlay(state.chapter, (state.index + 1) % len);
}
function prev() {
  if (!state.chapter) return;
  if (audio.currentTime > 3) { audio.currentTime = 0; return; } // typowe: cofnij do początku
  const len = state.chapter.groups.length;
  loadAndPlay(state.chapter, (state.index - 1 + len) % len);
}

function setRepeat(mode) {
  state.repeat = mode;
  localStorage.setItem('ang.repeat', mode);
  audio.loop = (mode === 'one'); // zmiana w locie, bez restartu utworu
  renderPlayer();
  updateActiveUI();
}
function cycleRepeat() {
  const order = ['off', 'one', 'all'];
  setRepeat(order[(order.indexOf(state.repeat) + 1) % order.length]);
}

function persist() {
  if (state.chapter) {
    localStorage.setItem('ang.last', JSON.stringify({ id: state.chapter.id, index: state.index }));
  }
}

/* ---------- Media Session (ekran blokady) ---------- */
function setupMediaSession() {
  if (!('mediaSession' in navigator)) return;
  const ms = navigator.mediaSession;
  const set = (a, h) => { try { ms.setActionHandler(a, h); } catch {} };
  set('play', () => audio.play().catch(() => {}));
  set('pause', () => audio.pause());
  set('previoustrack', () => prev());
  set('nexttrack', () => next());
  set('seekto', (d) => {
    if (d.fastSeek && 'fastSeek' in audio) audio.fastSeek(d.seekTime);
    else audio.currentTime = d.seekTime;
    updatePositionState();
  });
  // UWAGA: świadomie NIE ustawiamy 'seekbackward'/'seekforward' —
  // iOS zamieniłby wtedy przyciski Następny/Poprzedni na przewijanie ±10 s.
}
function updateMediaSession() {
  if (!('mediaSession' in navigator) || !state.chapter) return;
  const g = state.chapter.groups[state.index];
  navigator.mediaSession.metadata = new MediaMetadata({
    title: g.label,
    artist: state.chapter.titlePl, // tytuł rozdziału widoczny na ekranie blokady
    album: 'Angielski',
    artwork: ART_SIZES.map((s) => ({ src: `icons/icon-${s}.png`, sizes: `${s}x${s}`, type: 'image/png' })),
  });
}
function setMSState(s) {
  if ('mediaSession' in navigator) { try { navigator.mediaSession.playbackState = s; } catch {} }
}
function updatePositionState() {
  if (!('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession)) return;
  const d = audio.duration;
  if (!isFinite(d) || d <= 0) return;
  try {
    navigator.mediaSession.setPositionState({
      duration: d,
      playbackRate: audio.playbackRate || 1,
      position: Math.min(audio.currentTime, d),
    });
  } catch {}
}

/* ---------- render: pasek odtwarzacza ---------- */
function renderPlayer() {
  if (!state.chapter) {
    playerEl.hidden = true;
    document.body.classList.remove('with-player', 'playing');
    return;
  }
  playerEl.hidden = false;
  document.body.classList.add('with-player');

  const g = state.chapter.groups[state.index];
  setText('p-group', g.label);
  setText('p-chapter', state.chapter.titlePl);
  setText('p-play', audio.paused ? '▶' : '⏸');
  document.body.classList.toggle('playing', !audio.paused); // szpula + puls przycisku

  const rep = byId('p-repeat');
  rep.classList.remove('rep-off', 'rep-one', 'rep-all');
  rep.classList.add('rep-' + state.repeat);
  setText('p-rep-tag', REPEAT_LABEL[state.repeat]);

  updateSeekUI();
}

function updateSeekUI() {
  const d = audio.duration;
  if (!seeking) seek.value = (isFinite(d) && d > 0) ? Math.round((audio.currentTime / d) * 1000) : 0;
  seek.style.setProperty('--fill', (Number(seek.value) / 10) + '%'); // wypełnienie „taśmy"
  setText('p-cur', fmt(audio.currentTime));
  setText('p-dur', fmt(isFinite(d) ? d : 0));
}

// podświetlenie aktywnej grupy w aktualnie wyświetlanym rozdziale
function updateActiveUI() {
  document.querySelectorAll('.group').forEach((row) => {
    const idx = Number(row.dataset.index);
    const isActive = state.chapter && renderedChapterId === state.chapter.id && idx === state.index;
    row.classList.toggle('active', isActive);
    row.classList.toggle('loop-one', isActive && state.repeat === 'one');
    const icon = row.querySelector('.g-icon');
    if (icon) icon.textContent = (isActive && !audio.paused) ? '⏸' : '▶';
  });
}

/* ---------- render: widoki ---------- */
function renderHome() {
  renderedChapterId = null;
  backBtn.hidden = true;
  setText('topbar-title', 'Angielski');

  const totalAudio = DATA.chapters.reduce((s, c) => s + c.groups.length, 0);
  const items = DATA.chapters.map((c) => {
    const meta = c.hasAudio
      ? `${c.groups.length} ${plural(c.groups.length, 'grupa', 'grupy', 'grup')}`
      : 'tylko PDF';
    return `
      <button class="chapter${c.hasAudio ? '' : ' no-audio'}" data-nav="${esc(c.id)}">
        <span class="chapter-num">${String(c.number).padStart(2, '0')}</span>
        <span class="chapter-body">
          <span class="chapter-stage">${esc(stageFor(c.number))}</span>
          <span class="chapter-title">${esc(cleanTitle(c.titlePl))}</span>
          <span class="chapter-sub">${esc(cleanTitle(c.titleEn))}</span>
        </span>
        <span class="chapter-meta">${meta}<span class="chev">›</span></span>
      </button>`;
  }).join('');

  view.innerHTML = `
    <section class="hero">
      <div class="kicker">B2 → C1 · gadane, nie pisane</div>
      <h1>Minikurs 1:<br>Powrót do domu</h1>
      <p class="sub">${DATA.chapters.length} ${plural(DATA.chapters.length, 'część', 'części', 'części')} · ${totalAudio} ${plural(totalAudio, 'nagranie', 'nagrania', 'nagrań')} · słuchaj i powtarzaj na głos</p>
    </section>
    ${items}
    <footer class="site-foot">
      <div><b>Angielski · Studio</b> — ${esc(BUILD)}</div>
      <div>build ${esc(fmtBuild(DATA.generatedAt))}</div>
    </footer>`;
  updateActiveUI();
  window.scrollTo(0, 0);
}

function renderChapter(ch) {
  renderedChapterId = ch.id;
  backBtn.hidden = false;
  setText('topbar-title', ch.titlePl);

  const rows = ch.groups.map((g, i) => `
    <div class="group" data-index="${i}">
      <button class="g-main" data-action="play" data-index="${i}">
        <span class="g-icon">▶</span>
        <span class="g-label">${esc(g.label)}</span>
      </button>
      <button class="g-loop" data-action="loop" data-index="${i}" title="Zapętl tylko tę grupę" aria-label="Zapętl ${esc(g.label)}">⟳</button>
    </div>`).join('');

  view.innerHTML = `
    <section class="chapter-head">
      <div class="kicker">Część ${String(ch.number).padStart(2, '0')}</div>
      <h1>${esc(cleanTitle(ch.titlePl))}</h1>
      <div class="en">${esc(cleanTitle(ch.titleEn))}</div>
      <span class="stage-tag">${esc(stageFor(ch.number))}</span>
    </section>
    ${ch.hasAudio
      ? `<div class="groups">${rows}</div>`
      : `<p class="note">Ten rozdział nie ma jeszcze audio.</p>`}
    ${ch.pdf
      ? `<a class="pdf-link" href="${esc(ch.pdf)}" target="_blank" rel="noopener">📄 Otwórz PDF rozdziału</a>`
      : ''}`;
  updateActiveUI();
  window.scrollTo(0, 0);
}

function route() {
  const m = (location.hash || '').match(/^#\/c\/(.+)$/);
  if (m) {
    const ch = DATA.chapters.find((c) => c.id === decodeURIComponent(m[1]));
    if (ch) return renderChapter(ch);
  }
  renderHome();
}

/* ---------- przywróć ostatnio słuchaną grupę (bez auto-odtwarzania) ---------- */
function restoreLast() {
  try {
    const raw = localStorage.getItem('ang.last');
    if (!raw) return;
    const { id, index } = JSON.parse(raw);
    const ch = DATA.chapters.find((c) => c.id === id);
    if (ch && ch.groups[index]) {
      state.chapter = ch;
      state.index = index;
      audio.src = ch.groups[index].src; // tylko wczytaj — odtworzenie wymaga dotknięcia
      audio.loop = (state.repeat === 'one');
      updateMediaSession();
      renderPlayer();
    }
  } catch {}
}

/* ---------- podpięcie zdarzeń ---------- */
function wire() {
  // nawigacja + sterowanie grupami (delegacja kliknięć — działa po każdym re-renderze)
  view.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-nav]');
    if (nav) { location.hash = `#/c/${encodeURIComponent(nav.dataset.nav)}`; return; }
    const act = e.target.closest('[data-action]');
    if (act && renderedChapterId) {
      const ch = DATA.chapters.find((c) => c.id === renderedChapterId);
      const idx = Number(act.dataset.index);
      if (act.dataset.action === 'play') selectGroup(ch, idx);
      else if (act.dataset.action === 'loop') loopGroup(ch, idx);
    }
  });

  backBtn.addEventListener('click', () => { location.hash = '#/'; });

  byId('p-play').addEventListener('click', togglePlay);
  byId('p-prev').addEventListener('click', prev);
  byId('p-next').addEventListener('click', next);
  byId('p-repeat').addEventListener('click', cycleRepeat);

  seek.addEventListener('input', () => {
    seeking = true;
    seek.style.setProperty('--fill', (Number(seek.value) / 10) + '%');
    setText('p-cur', fmt((seek.value / 1000) * (audio.duration || 0)));
  });
  seek.addEventListener('change', () => {
    if (isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = (seek.value / 1000) * audio.duration;
    }
    seeking = false;
  });

  audio.addEventListener('play', () => { setMSState('playing'); renderPlayer(); updateActiveUI(); });
  audio.addEventListener('pause', () => { setMSState('paused'); renderPlayer(); updateActiveUI(); });
  audio.addEventListener('ended', () => {
    if (state.repeat === 'all') next();      // tryb "jedna" tu nie trafia (natywna pętla)
    else { renderPlayer(); updateActiveUI(); } // "wył" -> zatrzymane
  });
  audio.addEventListener('loadedmetadata', () => { updatePositionState(); updateSeekUI(); });
  audio.addEventListener('timeupdate', throttle(() => { updateSeekUI(); updatePositionState(); }, 500));

  window.addEventListener('hashchange', route);
}

/* ---------- start ---------- */
async function init() {
  DATA = await (await fetch('content.json', { cache: 'no-cache' })).json();
  setupMediaSession();
  wire();
  restoreLast();
  route();
}
init();
