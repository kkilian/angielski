import { budujKolejke, nastepny, nastepnaPara, poprzedniaPara, opisBlokady, nastepnyTryb, zdanieDla, bazaDzialu } from './pary.js';

export function fmt(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

export function cycleRepeat(mode) {
  const order = ['off', 'one', 'all'];
  const index = order.indexOf(mode);
  return order[(index + 1 + order.length) % order.length];
}

export function nextIndex(index, length) {
  if (!length) return -1;
  return (index + 1 + length) % length;
}

export function cleanTitle(title) {
  return String(title).replace(/^R\d+\s*·\s*/i, '');
}

// ————— Ćwiczenie 4/3/2 (Nation) —————
// Ta sama odpowiedź trzy razy: 4 min, 3 min, 2 min. Zmiana tempa = ta stała.
export const RUNDY_432 = [120, 90, 60];

export function stan432(rundy = RUNDY_432) {
  return { runda: 0, pozostalo: rundy[0], dziala: false, koniec: false, sygnal: null };
}

// Czysty reduktor. Akcje: start | pauza | skip | tik (jedna sekunda).
// `sygnal`: 'koniec-rundy' | 'koniec' | null — jednorazowy; UI zamienia go
// na beep i wibrację. Testowany bez DOM w tools/k-site.test.mjs.
export function krok432(stan, akcja, rundy = RUNDY_432) {
  const s = { ...stan, sygnal: null };
  if (akcja.typ === 'start') {
    if (s.koniec) return { ...stan432(rundy), dziala: true };
    s.dziala = true;
    return s;
  }
  if (akcja.typ === 'pauza') { s.dziala = false; return s; }
  if (akcja.typ === 'skip') {
    if (s.koniec) return s;
    if (s.runda + 1 >= rundy.length) { s.koniec = true; s.dziala = false; s.pozostalo = 0; return s; }
    s.runda += 1;
    s.pozostalo = rundy[s.runda];
    return s;
  }
  if (akcja.typ === 'tik') {
    if (!s.dziala || s.koniec) return s;
    s.pozostalo -= 1;
    if (s.pozostalo > 0) return s;
    if (s.runda + 1 >= rundy.length) { s.koniec = true; s.dziala = false; s.pozostalo = 0; s.sygnal = 'koniec'; return s; }
    s.runda += 1;
    s.pozostalo = rundy[s.runda];
    s.sygnal = 'koniec-rundy';
    return s;
  }
  return s;
}

const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

function plural(number, one, few, many) {
  if (number === 1) return one;
  const last = number % 10;
  const lastTwo = number % 100;
  return last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14) ? few : many;
}

function initSite() {
  const audio = document.getElementById('audio');
  const view = document.getElementById('view');
  const player = document.getElementById('player');
  const back = document.getElementById('back');
  const seek = document.getElementById('p-seek');
  const repeatLabels = {
    off: 'wył.', one: 'jedna', all: 'całość',      // format 1 (stare działy)
    para: 'para', grupa: 'grupa', caly: 'całość',  // format 2
  };
  // Wchodząc w dział formatu 2 przekładamy zapamiętany tryb na nowe nazwy.
  const TRYB_Z_FORMATU1 = { one: 'grupa', all: 'caly' };

  let data = null;
  let visibleChapterId = null;
  let backHash = '#/';
  let seeking = false;

  const state = {
    chapter: null,
    index: -1,
    repeat: localStorage.getItem('ang.k.repeat') || 'one',
  };

  state.kolejka = [];        // płaska lista elementów bieżącej grupy (pusta = format 1)
  state.poz = 0;             // pozycja w kolejce
  let manifest = null;       // audio.json bieżącego działu
  let manifestDla = null;    // id działu, dla którego manifest jest aktualny

  const grupaTeraz = () => (manifest ? manifest.grupy[state.index] : null);
  const maPary = () => state.kolejka.length > 0 && state.kolejka[0].rola !== 'sluchanka';

  async function wczytajManifest(chapter) {
    if (manifestDla === chapter.id) return manifest;
    const response = await fetch(`${chapter.audioManifest}?v=${chapter.audioVersion}`, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`audio.json ${response.status}`);
    manifest = await response.json();
    manifestDla = chapter.id;
    return manifest;
  }

  const byId = (id) => document.getElementById(id);
  const setText = (id, text) => {
    const element = byId(id);
    if (element) element.textContent = text;
  };

  function updateMediaSession() {
    if (!('mediaSession' in navigator) || !state.chapter) return;
    const album = 'Rozmowa · angielski';
    if (state.kolejka.length) {
      const element = state.kolejka[state.poz];
      const grupa = grupaTeraz();
      if (element.rola === 'sluchanka') {
        const zdanie = element.zdania[zdanieDla(element.zdania, audio.currentTime)] || {};
        navigator.mediaSession.metadata = new MediaMetadata({
          title: zdanie.en || '', artist: `Grupa ${grupa.n}`, album,
        });
        return;
      }
      const opis = opisBlokady(element, { grupa: grupa.n, ilePar: grupa.pary.length });
      navigator.mediaSession.metadata = new MediaMetadata({ title: opis.title, artist: opis.artist, album });
      return;
    }
    const group = state.chapter.groups[state.index];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: group.label,
      artist: cleanTitle(state.chapter.titlePl),
      album,
    });
  }

  function updatePositionState() {
    if (!('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession)) return;
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate || 1,
        position: Math.min(audio.currentTime, audio.duration),
      });
    } catch {}
  }

  function updateSeek() {
    const duration = audio.duration;
    if (!seeking) {
      seek.value = Number.isFinite(duration) && duration > 0
        ? Math.round((audio.currentTime / duration) * 1000)
        : 0;
    }
    setText('p-current', fmt(audio.currentTime));
    setText('p-duration', fmt(Number.isFinite(duration) ? duration : 0));
  }

  function renderPlayer() {
    if (!state.chapter || state.index < 0) {
      player.hidden = true;
      document.body.classList.remove('with-player', 'is-playing');
      return;
    }

    player.hidden = false;
    document.body.classList.add('with-player');
    document.body.classList.toggle('is-playing', !audio.paused);
    const group = state.chapter.groups[state.index];
    setText('p-chapter', `R${state.chapter.localNumber} · ${group.label}`);
    // W formacie 2 licznik par uzupełnia renderFraza; w formacie 1 nie ma par,
    // więc w to miejsce wraca tytuł działu.
    if (!state.kolejka.length) setText('p-para', cleanTitle(state.chapter.titlePl));
    setText('p-play', audio.paused ? '▶' : 'Ⅱ');
    setText('p-repeat-label', repeatLabels[state.repeat]);
    const repeatButton = byId('p-repeat');
    repeatButton.dataset.mode = state.repeat;
    repeatButton.setAttribute('aria-label', `Tryb pętli: ${repeatLabels[state.repeat]}. Zmień tryb`);
    updateSeek();
  }

  function updateActiveGroup() {
    document.querySelectorAll('.group-row').forEach((row) => {
      const isActive = state.chapter
        && visibleChapterId === state.chapter.id
        && Number(row.dataset.index) === state.index;
      row.classList.toggle('active', isActive);
      const icon = row.querySelector('.group-play-icon');
      if (icon) icon.textContent = isActive && !audio.paused ? 'Ⅱ' : '▶';
    });
  }

  function persist() {
    if (!state.chapter) return;
    localStorage.setItem('ang.k.last', JSON.stringify({
      id: state.chapter.id, index: state.index, poz: state.poz,
    }));
  }

  async function grajPary(chapter, index, poz) {
    try {
      await wczytajManifest(chapter);
    } catch {
      setText('p-wyzwalacz', 'Nie udało się wczytać audio tego działu.');
      setText('p-wzorzec', '');
      return;
    }
    const grupa = manifest.grupy[index];
    if (!grupa) return;
    state.chapter = chapter;
    state.index = index;
    if (TRYB_Z_FORMATU1[state.repeat]) state.repeat = TRYB_Z_FORMATU1[state.repeat];
    state.kolejka = budujKolejke(grupa, chapter.audioVersion, bazaDzialu(chapter));
    state.poz = Math.min(poz, Math.max(0, state.kolejka.length - 1));
    wczytajPozycje();
    audio.play().catch(() => {});
    persist();
  }

  function wczytajPozycje() {
    const element = state.kolejka[state.poz];
    if (!element) return;
    audio.src = element.src;
    audio.loop = false;  // pętla „para" idzie przez przejścia, nie natywnie
    renderFraza(element);
    updateMediaSession();
    renderPlayer();
    updateActiveGroup();
  }

  // Wyzwalacz widać zawsze; wzorzec dopiero, gdy leci (klasa .wzorzec na .player).
  function renderFraza(element) {
    const grupa = grupaTeraz();
    if (element.rola === 'sluchanka') {
      const i = zdanieDla(element.zdania, audio.currentTime);
      const zdanie = element.zdania[i] || {};
      setText('p-wyzwalacz', zdanie.pl || '');
      setText('p-wzorzec', zdanie.en || '');
      player.classList.add('wzorzec');  // w słuchance angielski jest treścią, nie odpowiedzią
      setText('p-para', `${i + 1}/${element.zdania.length}`);
      return;
    }
    const tekst = element.tekst;
    setText('p-wyzwalacz', [tekst.pyt, tekst.pl].filter(Boolean).join(' — '));
    setText('p-wzorzec', tekst.en || '');
    player.classList.toggle('wzorzec', element.rola === 'wzor');
    setText('p-para', `${element.para}/${grupa.pary.length}`);
  }

  function loadAndPlay(chapter, index) {
    if (chapter.format === 2) return void grajPary(chapter, index, 0);
    const group = chapter.groups[index];
    if (!group) return;
    // Wracamy z działu formatu 2 — wyczyść kolejkę i kartę z frazą.
    state.kolejka = [];
    state.poz = 0;
    setText('p-wyzwalacz', '');
    setText('p-wzorzec', '');
    player.classList.remove('wzorzec');
    state.chapter = chapter;
    state.index = index;
    audio.src = group.src;
    audio.loop = state.repeat === 'one';
    audio.play().catch(() => {});
    updateMediaSession();
    renderPlayer();
    updateActiveGroup();
    persist();
  }

  function togglePlay() {
    if (!state.chapter) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }

  function move(offset) {
    if (!state.chapter) return;
    const length = state.chapter.groups.length;
    const index = (state.index + offset + length) % length;
    loadAndPlay(state.chapter, index);
  }

  function skok(offset) {
    if (!state.kolejka.length) return move(offset);           // format 1 — po grupach, jak dziś
    if (offset < 0 && audio.currentTime > 2) { audio.currentTime = 0; return; }
    state.poz = offset < 0 ? poprzedniaPara(state.poz) : nastepnaPara(state.poz, state.kolejka.length);
    wczytajPozycje();
    audio.play().catch(() => {});
    persist();
  }

  function selectGroup(chapter, index) {
    if (state.chapter?.id === chapter.id && state.index === index) togglePlay();
    else loadAndPlay(chapter, index);
  }

  function setRepeat(mode) {
    state.repeat = mode;
    localStorage.setItem('ang.k.repeat', mode);
    audio.loop = mode === 'one' && !state.kolejka.length;
    renderPlayer();
  }

  function renderHome() {
    visibleChapterId = null;
    backHash = '#/';
    back.hidden = true;
    setText('topbar-context', 'Rozmowa');

    const audioCount = data.chapters.reduce((sum, chapter) => sum + chapter.groups.length, 0);
    const cards = data.chapters.map((chapter) => {
      const groups = chapter.groups.length;
      return `
        <button class="lesson-card" data-nav="${esc(chapter.id)}">
          <span class="lesson-code">R${chapter.localNumber}</span>
          <span class="lesson-body">
            <span class="lesson-label">Sesja ${String(chapter.localNumber).padStart(2, '0')}</span>
            <strong>${esc(cleanTitle(chapter.titlePl))}</strong>
            <em>${esc(cleanTitle(chapter.titleEn))}</em>
            <span class="lesson-description">${esc(chapter.description)}</span>
          </span>
          <span class="lesson-meta">
            ${groups ? `${groups} ${plural(groups, 'grupa', 'grupy', 'grup')}` : 'PDF'}
            <span aria-hidden="true">↗</span>
          </span>
        </button>`;
    }).join('');

    view.innerHTML = `
      <section class="hero">
        <div class="hero-proof" aria-hidden="true">R</div>
        <p class="eyebrow">PAŻP · rozmowa po angielsku</p>
        <h1>Twoje odpowiedzi.<br><span>Tylko płynniej.</span></h1>
        <p class="hero-copy">Dział z każdej sesji: Twoje zdania z nagrań, poprawione. Słuchaj, odpowiedz w ciszy, sprawdź wersję wzorcową, a na końcu powtarzaj całe odpowiedzi.</p>
        <div class="hero-stats"><b>${data.chapters.length}</b> działy <i></i> <b>${audioCount}</b> nagrań</div>
      </section>
      <section class="lesson-section" aria-labelledby="lesson-heading">
        <div class="section-title">
          <span id="lesson-heading">Sesje</span>
          <small>najnowsza na górze</small>
        </div>
        <div class="lesson-list">${cards}</div>
      </section>
      <footer class="site-footer">Rozmowa · angielski <span>dzień po dniu, z Twoich nagrań</span></footer>`;
    updateActiveGroup();
    window.scrollTo(0, 0);
  }

  function renderChapter(chapter) {
    visibleChapterId = chapter.id;
    backHash = '#/';
    back.hidden = false;
    setText('topbar-context', `R${chapter.localNumber}`);

    const rows = chapter.groups.map((group, index) => `
      <div class="group-row" data-index="${index}">
        <button class="group-main" data-action="play" data-index="${index}">
          <span class="group-play-icon">▶</span>
          <span class="group-copy">
            <strong>${esc(group.label)}</strong>
            <small>posłuchaj · odpowiedz · powtórz</small>
          </span>
        </button>
        ${group.pytanie432
          ? `<button class="group-432" data-action="432" data-index="${index}" aria-label="Ćwiczenie 4/3/2 — ${esc(group.label)}">3 rundy</button>`
          : ''}
        <button class="group-loop" data-action="loop" data-index="${index}" aria-label="Zapętl ${esc(group.label)}">↻</button>
      </div>`).join('');

    view.innerHTML = `
      <section class="chapter-hero">
        <p class="eyebrow">Sesja ${String(chapter.localNumber).padStart(2, '0')}</p>
        <div class="chapter-number" aria-hidden="true">R${chapter.localNumber}</div>
        <h1>${esc(cleanTitle(chapter.titlePl))}</h1>
        <p class="chapter-en">${esc(cleanTitle(chapter.titleEn))}</p>
        <p class="chapter-description">${esc(chapter.description)}</p>
      </section>
      ${chapter.hasAudio
        ? `<section class="groups" aria-label="Grupy audio">${rows}</section>`
        : '<p class="empty">Audio nie jest jeszcze dostępne. PDF możesz otworzyć poniżej.</p>'}
      ${chapter.pdf
        ? `<a class="pdf-link" href="${esc(chapter.pdf)}" target="_blank" rel="noopener"><span>PDF</span> Otwórz tekst działu <b aria-hidden="true">↗</b></a>`
        : ''}`;
    updateActiveGroup();
    window.scrollTo(0, 0);
  }

  // ————— Ekran 4/3/2: pytanie do grupy + trzy rundy mówienia —————
  let s432 = null;
  let uchwyt432 = null;
  let ostatniTik432 = 0;
  let ctxAudio432 = null;

  function obudzDzwiek432() {
    // iOS odblokowuje AudioContext wyłącznie w geście użytkownika —
    // stąd tworzenie i resume() w handlerze przycisku Start, nie przy renderze.
    try {
      ctxAudio432 = ctxAudio432 || new (window.AudioContext || window.webkitAudioContext)();
      ctxAudio432.resume?.();
    } catch {}
  }

  function beep432(ile) {
    try { navigator.vibrate?.(ile > 1 ? [180, 90, 180, 90, 180] : [180]); } catch {}
    if (!ctxAudio432) return;
    try {
      for (let i = 0; i < ile; i += 1) {
        const t = ctxAudio432.currentTime + i * 0.28;
        const osc = ctxAudio432.createOscillator();
        const gain = ctxAudio432.createGain();
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        osc.connect(gain).connect(ctxAudio432.destination);
        osc.start(t);
        osc.stop(t + 0.22);
      }
    } catch {}
  }

  function stop432() {
    if (uchwyt432) { clearInterval(uchwyt432); uchwyt432 = null; }
    s432 = null;
  }

  function rysuj432() {
    if (!s432) return;
    setText('ex432-clock', fmt(s432.pozostalo));
    setText('ex432-start', s432.koniec ? 'Jeszcze raz' : s432.dziala ? 'Pauza' : 'Start');
    document.querySelectorAll('.ex432-round').forEach((el, i) => {
      el.classList.toggle('done', s432.koniec || i < s432.runda);
      el.classList.toggle('active', !s432.koniec && i === s432.runda);
    });
    setText('ex432-hint', s432.koniec
      ? 'Trzy rundy za Tobą. Ta sama odpowiedź, coraz mniej czasu — to jest cała metoda.'
      : `Runda ${s432.runda + 1} z ${RUNDY_432.length} · ta sama odpowiedź, coraz krócej`);
  }

  function tykaj432() {
    // Zegar ścienny zamiast liczenia tików: iOS dławi setInterval przy zgaszonym
    // ekranie, więc nadrobione sekundy przepuszczamy przez reduktor po jednej.
    if (!s432) return;
    let sekundy = Math.floor((Date.now() - ostatniTik432) / 1000);
    if (sekundy <= 0) return;
    ostatniTik432 += sekundy * 1000;
    while (sekundy > 0) {
      s432 = krok432(s432, { typ: 'tik' });
      if (s432.sygnal) beep432(s432.sygnal === 'koniec' ? 3 : 1);
      sekundy -= 1;
    }
    rysuj432();
  }

  function render432(chapter, index) {
    const group = chapter.groups[index];
    visibleChapterId = chapter.id;
    backHash = `#/r/${chapter.id}`;
    back.hidden = false;
    setText('topbar-context', `R${chapter.localNumber} · 3 rundy`);

    s432 = stan432();

    const rundy = RUNDY_432
      .map((sek, i) => `<span class="ex432-round${i === 0 ? ' active' : ''}">${fmt(sek)}</span>`)
      .join('');
    view.innerHTML = `
      <section class="ex432" aria-label="Ćwiczenie 4/3/2">
        <p class="eyebrow">${esc(group.label)} · 3 rundy</p>
        <h1 class="ex432-question">${esc(group.pytanie432)}</h1>
        <p class="ex432-copy">Odpowiadaj na głos przez całą rundę. Potem ta sama odpowiedź w 3:00 i w 2:00.</p>
        <div class="ex432-rounds">${rundy}</div>
        <div class="ex432-clock" id="ex432-clock">${fmt(RUNDY_432[0])}</div>
        <p class="ex432-hint" id="ex432-hint">Runda 1 z ${RUNDY_432.length} · ta sama odpowiedź, coraz krócej</p>
        <div class="ex432-controls">
          <button class="ex432-start" id="ex432-start" type="button">Start</button>
          <button class="ex432-skip" id="ex432-skip" type="button">Następna runda</button>
        </div>
      </section>`;

    byId('ex432-start').addEventListener('click', () => {
      obudzDzwiek432();
      s432 = krok432(s432, { typ: s432.dziala ? 'pauza' : 'start' });
      if (s432.dziala) {
        ostatniTik432 = Date.now();
        if (!uchwyt432) uchwyt432 = setInterval(tykaj432, 250);
      }
      rysuj432();
    });
    byId('ex432-skip').addEventListener('click', () => {
      s432 = krok432(s432, { typ: 'skip' });
      ostatniTik432 = Date.now();
      rysuj432();
    });
    window.scrollTo(0, 0);
  }

  function renderError() {
    back.hidden = true;
    view.innerHTML = `
      <section class="error-card">
        <span>Nie udało się wczytać kursu.</span>
        <button id="retry" type="button">Spróbuj ponownie</button>
      </section>`;
    byId('retry').addEventListener('click', loadData);
  }

  function route() {
    if (!data) return;
    // Każde wyjście z ekranu 4/3/2 (back, swipe, wordmark, deep link) gasi timer.
    stop432();
    const m432 = (location.hash || '').match(/^#\/r\/(r\d+)\/432\/(\d+)$/);
    if (m432) {
      const chapter = data.chapters.find((item) => item.id === m432[1]);
      const index = Number(m432[2]);
      // Deep link do grupy bez pytania spada na widok działu zamiast wywalać apkę.
      if (chapter?.groups[index]?.pytanie432) return render432(chapter, index);
    }
    const match = (location.hash || '').match(/^#\/r\/(r\d+)/);
    if (match) {
      const chapter = data.chapters.find((item) => item.id === match[1]);
      if (chapter) return renderChapter(chapter);
    }
    renderHome();
  }

  function restoreLast() {
    try {
      const saved = JSON.parse(localStorage.getItem('ang.k.last'));
      const chapter = data.chapters.find((item) => item.id === saved?.id);
      if (!chapter) return;
      if (chapter.format === 2) {
        wczytajManifest(chapter).then(() => {
          const grupa = manifest.grupy[saved.index];
          if (!grupa) return;
          state.chapter = chapter;
          state.index = saved.index;
          if (TRYB_Z_FORMATU1[state.repeat]) state.repeat = TRYB_Z_FORMATU1[state.repeat];
          state.kolejka = budujKolejke(grupa, chapter.audioVersion, bazaDzialu(chapter));
          state.poz = Math.min(saved.poz || 0, state.kolejka.length - 1);
          audio.src = state.kolejka[state.poz].src;  // tylko wczytaj — start wymaga dotknięcia
          audio.loop = false;
          renderFraza(state.kolejka[state.poz]);
          updateMediaSession();
          renderPlayer();
        }).catch(() => {});
        return;
      }
      if (!chapter.groups[saved.index]) return;
      state.chapter = chapter;
      state.index = saved.index;
      audio.src = chapter.groups[saved.index].src;
      audio.loop = state.repeat === 'one';
      updateMediaSession();
      renderPlayer();
    } catch {}
  }

  function wire() {
    view.addEventListener('click', (event) => {
      const navigation = event.target.closest('[data-nav]');
      if (navigation) {
        location.hash = `#/r/${navigation.dataset.nav}`;
        return;
      }
      const action = event.target.closest('[data-action]');
      if (!action || !visibleChapterId) return;
      const chapter = data.chapters.find((item) => item.id === visibleChapterId);
      const index = Number(action.dataset.index);
      // Gałąź 432 MUSI stać przed else — else łapie wszystko i odpaliłby odtwarzanie.
      if (action.dataset.action === '432') {
        location.hash = `#/r/${chapter.id}/432/${index}`;
        return;
      }
      if (action.dataset.action === 'loop') {
        setRepeat(chapter.format === 2 ? 'grupa' : 'one');
        loadAndPlay(chapter, index);
      } else {
        selectGroup(chapter, index);
      }
    });

    back.addEventListener('click', () => { location.hash = backHash; });
    byId('p-play').addEventListener('click', togglePlay);
    byId('p-prev').addEventListener('click', () => skok(-1));
    byId('p-next').addEventListener('click', () => skok(1));
    byId('p-repeat').addEventListener('click', () => {
      setRepeat(state.kolejka.length ? nastepnyTryb(state.repeat, maPary()) : cycleRepeat(state.repeat));
    });

    seek.addEventListener('input', () => {
      seeking = true;
      setText('p-current', fmt((Number(seek.value) / 1000) * (audio.duration || 0)));
    });
    seek.addEventListener('change', () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = (Number(seek.value) / 1000) * audio.duration;
      }
      seeking = false;
    });

    audio.addEventListener('play', () => { renderPlayer(); updateActiveGroup(); });
    audio.addEventListener('pause', () => { renderPlayer(); updateActiveGroup(); });
    audio.addEventListener('ended', () => {
      if (state.kolejka.length) {
        const dalej = nastepny(state.poz, state.kolejka.length, state.repeat);
        if (dalej == null) {
          if (state.repeat === 'caly') {
            const ile = state.chapter.groups.length;
            return void grajPary(state.chapter, (state.index + 1) % ile, 0);
          }
          renderPlayer(); updateActiveGroup(); return;
        }
        state.poz = dalej;
        wczytajPozycje();
        audio.play().catch(() => {});
        return;
      }
      if (state.repeat === 'all') move(1);
      else { renderPlayer(); updateActiveGroup(); }
    });

    // Brakujący plik pary nie może zatrzymać całej grupy ani wpaść w pętlę na sobie.
    audio.addEventListener('error', () => {
      if (!state.kolejka.length) return;
      console.warn('Nie mogę wczytać', audio.src, '— przeskakuję dalej');
      const dalej = nastepny(state.poz, state.kolejka.length, state.repeat === 'para' ? 'off' : state.repeat);
      if (dalej == null) return;
      state.poz = dalej;
      wczytajPozycje();
      audio.play().catch(() => {});
    });

    audio.addEventListener('loadedmetadata', () => { updatePositionState(); updateSeek(); });
    audio.addEventListener('timeupdate', () => {
      updatePositionState();
      updateSeek();
      const element = state.kolejka[state.poz];
      if (element && element.rola === 'sluchanka') { renderFraza(element); updateMediaSession(); }
    });
    window.addEventListener('hashchange', route);

    if ('mediaSession' in navigator) {
      const set = (name, handler) => {
        try { navigator.mediaSession.setActionHandler(name, handler); } catch {}
      };
      set('play', () => audio.play().catch(() => {}));
      set('pause', () => audio.pause());
      set('previoustrack', () => skok(-1));
      set('nexttrack', () => skok(1));
      set('seekto', (details) => {
        audio.currentTime = details.seekTime;
        updatePositionState();
      });
    }
  }

  async function loadData() {
    try {
      const response = await fetch('content.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.json();
      restoreLast();
      route();
    } catch {
      renderError();
    }
  }

  wire();
  loadData();
}

if (typeof document !== 'undefined') initSite();
