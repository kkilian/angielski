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
  return String(title).replace(/^K\d+\s*·\s*/i, '');
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
  const repeatLabels = { off: 'wył.', one: 'jedna', all: 'całość' };

  let data = null;
  let visibleChapterId = null;
  let backHash = '#/';
  let seeking = false;

  const state = {
    chapter: null,
    index: -1,
    repeat: localStorage.getItem('ang.k.repeat') || 'one',
  };

  const byId = (id) => document.getElementById(id);
  const setText = (id, text) => {
    const element = byId(id);
    if (element) element.textContent = text;
  };

  function updateMediaSession() {
    if (!('mediaSession' in navigator) || !state.chapter) return;
    const group = state.chapter.groups[state.index];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: group.label,
      artist: cleanTitle(state.chapter.titlePl),
      album: 'Kurs K · Conversation Lab',
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
    setText('p-group', group.label);
    setText('p-chapter', cleanTitle(state.chapter.titlePl));
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
    localStorage.setItem('ang.k.last', JSON.stringify({ id: state.chapter.id, index: state.index }));
  }

  function loadAndPlay(chapter, index) {
    const group = chapter.groups[index];
    if (!group) return;
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

  function selectGroup(chapter, index) {
    if (state.chapter?.id === chapter.id && state.index === index) togglePlay();
    else loadAndPlay(chapter, index);
  }

  function setRepeat(mode) {
    state.repeat = mode;
    localStorage.setItem('ang.k.repeat', mode);
    audio.loop = mode === 'one';
    renderPlayer();
  }

  function renderHome() {
    visibleChapterId = null;
    backHash = '#/';
    back.hidden = true;
    setText('topbar-context', 'Kurs K');

    const audioCount = data.chapters.reduce((sum, chapter) => sum + chapter.groups.length, 0);
    const cards = data.chapters.map((chapter) => {
      const groups = chapter.groups.length;
      return `
        <button class="lesson-card" data-nav="${esc(chapter.id)}">
          <span class="lesson-code">K${chapter.localNumber}</span>
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
        <div class="hero-proof" aria-hidden="true">K</div>
        <p class="eyebrow">B2 → C1 · prawdziwe rozmowy</p>
        <h1>Powiedz jedną rzecz.<br><span>Powiedz ją od razu.</span></h1>
        <p class="hero-copy">Materiały z Twoich rozmów i lekcji. Słuchaj, odpowiedz w ciszy, sprawdź naturalną wersję.</p>
        <div class="hero-stats"><b>${data.chapters.length}</b> działy <i></i> <b>${audioCount}</b> nagrań</div>
      </section>
      <section class="lesson-section" aria-labelledby="lesson-heading">
        <div class="section-title">
          <span id="lesson-heading">Kolejne rozmowy</span>
          <small>zacznij od K1</small>
        </div>
        <div class="lesson-list">${cards}</div>
      </section>
      <footer class="site-footer">Kurs K · Conversation Lab <span>osobna ścieżka od M</span></footer>`;
    updateActiveGroup();
    window.scrollTo(0, 0);
  }

  function renderChapter(chapter) {
    visibleChapterId = chapter.id;
    backHash = '#/';
    back.hidden = false;
    setText('topbar-context', `K${chapter.localNumber}`);

    const rows = chapter.groups.map((group, index) => `
      <div class="group-row" data-index="${index}">
        <button class="group-main" data-action="play" data-index="${index}">
          <span class="group-play-icon">▶</span>
          <span class="group-copy">
            <strong>${esc(group.label)}</strong>
            <small>posłuchaj · odpowiedz · powtórz</small>
          </span>
        </button>
        <button class="group-loop" data-action="loop" data-index="${index}" aria-label="Zapętl ${esc(group.label)}">↻</button>
      </div>`).join('');

    view.innerHTML = `
      <section class="chapter-hero">
        <p class="eyebrow">Sesja ${String(chapter.localNumber).padStart(2, '0')}</p>
        <div class="chapter-number" aria-hidden="true">K${chapter.localNumber}</div>
        <h1>${esc(cleanTitle(chapter.titlePl))}</h1>
        <p class="chapter-en">${esc(cleanTitle(chapter.titleEn))}</p>
        <p class="chapter-description">${esc(chapter.description)}</p>
      </section>
      ${chapter.hasAudio
        ? `<section class="groups" aria-label="Grupy audio">${rows}</section>`
        : '<p class="empty">Audio nie jest jeszcze dostępne. PDF możesz otworzyć poniżej.</p>'}
      ${chapter.pdf
        ? `<a class="pdf-link" href="${esc(chapter.pdf)}" target="_blank" rel="noopener"><span>PDF</span> Otwórz materiał do lekcji <b aria-hidden="true">↗</b></a>`
        : ''}`;
    updateActiveGroup();
    window.scrollTo(0, 0);
  }

  function renderError() {
    back.hidden = true;
    view.innerHTML = `
      <section class="error-card">
        <span>Nie udało się wczytać kursu K.</span>
        <button id="retry" type="button">Spróbuj ponownie</button>
      </section>`;
    byId('retry').addEventListener('click', loadData);
  }

  function route() {
    if (!data) return;
    const match = (location.hash || '').match(/^#\/k\/(k\d+)$/);
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
      if (!chapter?.groups[saved.index]) return;
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
        location.hash = `#/k/${navigation.dataset.nav}`;
        return;
      }
      const action = event.target.closest('[data-action]');
      if (!action || !visibleChapterId) return;
      const chapter = data.chapters.find((item) => item.id === visibleChapterId);
      const index = Number(action.dataset.index);
      if (action.dataset.action === 'loop') {
        setRepeat('one');
        loadAndPlay(chapter, index);
      } else {
        selectGroup(chapter, index);
      }
    });

    back.addEventListener('click', () => { location.hash = backHash; });
    byId('p-play').addEventListener('click', togglePlay);
    byId('p-prev').addEventListener('click', () => move(-1));
    byId('p-next').addEventListener('click', () => move(1));
    byId('p-repeat').addEventListener('click', () => setRepeat(cycleRepeat(state.repeat)));

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
      if (state.repeat === 'all') move(1);
      else { renderPlayer(); updateActiveGroup(); }
    });
    audio.addEventListener('loadedmetadata', () => { updatePositionState(); updateSeek(); });
    audio.addEventListener('timeupdate', () => { updatePositionState(); updateSeek(); });
    window.addEventListener('hashchange', route);

    if ('mediaSession' in navigator) {
      const set = (name, handler) => {
        try { navigator.mediaSession.setActionHandler(name, handler); } catch {}
      };
      set('play', () => audio.play().catch(() => {}));
      set('pause', () => audio.pause());
      set('previoustrack', () => move(-1));
      set('nexttrack', () => move(1));
      set('seekto', (details) => {
        audio.currentTime = details.seekTime;
        updatePositionState();
      });
    }
  }

  async function loadData() {
    try {
      const response = await fetch('k-content.json', { cache: 'no-cache' });
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
