import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'podglad.html');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function buildPreview() {
  const run = spawnSync(process.execPath, ['tools/build-podglad.js'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.equal(run.status, 0, run.stderr || run.stdout);
}

// Kolejka „cały Kurs K" rośnie z każdym działem — czytamy ją z dysku, żeby
// test nie wymagał ręcznej aktualizacji przy K4, K5…
// Kurs K jest w formacie 2 — kolejka bierze się z audio.json, nie z listy plików.
function kAudioSources() {
  const courseRoot = path.join(ROOT, 'K');
  return fs.readdirSync(courseRoot)
    .filter((name) => /^\d{2}-k\d+-/.test(name))
    .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))
    .flatMap((dir) => {
      const m = JSON.parse(fs.readFileSync(path.join(courseRoot, dir, 'audio.json'), 'utf8'));
      return m.grupy.flatMap((g) => (g.pary || []).flatMap((p) => [
        `K/${dir}/${p.cue.src}`, `K/${dir}/${p.wzor.src}`,
      ]));
    });
}

function waitForDebugger(browser) {
  return new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error(`Chrome did not expose CDP:\n${output}`)), 12_000);
    browser.stderr.on('data', (chunk) => {
      output += chunk.toString();
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (!match) return;
      clearTimeout(timer);
      resolve(match[1]);
    });
    browser.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Chrome exited before CDP was ready (${code}):\n${output}`));
    });
  });
}

async function connectToPage(browserWebSocketUrl) {
  const browserUrl = new URL(browserWebSocketUrl);
  const targets = await fetch(`http://${browserUrl.host}/json/list`).then((response) => response.json());
  const page = targets.find((target) => target.type === 'page');
  assert.ok(page?.webSocketDebuggerUrl, 'Chrome page target is available');

  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  const eventWaiters = new Map();
  const observed = [];
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const waiter = pending.get(message.id);
      if (!waiter) return;
      pending.delete(message.id);
      if (message.error) waiter.reject(new Error(message.error.message));
      else waiter.resolve(message.result);
      return;
    }
    observed.push(message);
    const waiter = eventWaiters.get(message.method);
    if (!waiter) return;
    eventWaiters.delete(message.method);
    waiter(message.params);
  });

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }

  function once(method) {
    return new Promise((resolve) => eventWaiters.set(method, resolve));
  }

  async function evaluate(expression) {
    const response = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    assert.equal(response.exceptionDetails, undefined, response.exceptionDetails?.text);
    return response.result.value;
  }

  return { socket, send, once, evaluate, observed };
}

test('real browser keeps M and K study flows independent', { timeout: 30_000 }, async (t) => {
  if (!fs.existsSync(CHROME)) {
    t.skip('Google Chrome is not installed');
    return;
  }

  buildPreview();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'podglad-chrome-'));
  assert.ok(profile.startsWith(path.join(os.tmpdir(), 'podglad-chrome-')));
  const browser = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--allow-file-access-from-files',
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  t.after(async () => {
    if (browser.exitCode === null && browser.signalCode === null) {
      const exited = new Promise((resolve) => browser.once('exit', resolve));
      browser.kill('SIGTERM');
      const forceKill = setTimeout(() => browser.kill('SIGKILL'), 5_000);
      await exited;
      clearTimeout(forceKill);
    }
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  });

  const debuggerUrl = await waitForDebugger(browser);
  const cdp = await connectToPage(debuggerUrl);
  t.after(() => cdp.socket.close());
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      window.__qaErrors=[];
      addEventListener('error',(event)=>window.__qaErrors.push(String(event.error||event.message)));
      addEventListener('unhandledrejection',(event)=>window.__qaErrors.push(String(event.reason)));
    `,
  });

  const loaded = cdp.once('Page.loadEventFired');
  await cdp.send('Page.navigate', { url: pathToFileURL(OUT).href });
  await loaded;
  await cdp.evaluate('localStorage.clear()');
  const reloaded = cdp.once('Page.loadEventFired');
  await cdp.send('Page.reload');
  await reloaded;

  assert.equal(await cdp.evaluate("!!document.querySelector('.tile[data-go=\"k\"]')"), true);
  await cdp.evaluate("document.querySelector('.tile[data-go=\"k\"]').click()");
  assert.equal(await cdp.evaluate("document.querySelector('.mk-view[data-view=\"k\"]').classList.contains('is-active')"), true);
  assert.equal(await cdp.evaluate('activeCourse'), 'k');

  const revealWorked = await cdp.evaluate(`(() => {
    document.querySelector('#toggle').click();
    const cell=document.querySelector('#k1 tr[data-k] td.en');
    cell.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
    return document.body.classList.contains('study')&&cell.classList.contains('show');
  })()`);
  assert.equal(revealWorked, true);

  await cdp.evaluate("document.querySelector('#k1 tr[data-k] .star-btn').click()");
  assert.deepEqual(await cdp.evaluate(`({
    k:JSON.parse(localStorage.getItem('kurs.k.stars')||'[]').length,
    m:JSON.parse(localStorage.getItem('kurs.stars')||'[]').length
  })`), { k: 1, m: 0 });
  assert.deepEqual(await cdp.evaluate(`(() => {
    const card=collectStarredCards().cards[0];
    return {course:card.course,chapter:card.chapter,hasMk:Object.hasOwn(card,'mk')};
  })()`), { course: 'K', chapter: 'K1', hasMk: false });

  await cdp.evaluate("document.querySelector('#review-toggle').click()");
  assert.equal(await cdp.evaluate("document.querySelectorAll('#review-body tr').length"), 1);
  await cdp.evaluate("document.querySelector('#review-toggle').click()");

  await cdp.evaluate("document.querySelector('#k1 .gplay').click()");
  assert.match(await cdp.evaluate("document.querySelector('#player').getAttribute('src')"), /K\/01-k1-powiedz-to-raz\/audio\/g1-p01-cue\.mp3$/);
  const kSources = kAudioSources();
  await cdp.evaluate("document.querySelector('.course-k .play-mk').click()");
  assert.deepEqual(await cdp.evaluate('({length:queue.length,first:queue[0],last:queue.at(-1)})'), {
    length: kSources.length,
    first: kSources[0],
    last: kSources.at(-1),
  });

  // --- ⭐ GWIAZDKI ONLY ---
  assert.equal(await cdp.evaluate("document.querySelector('#stars-only').hidden"), false);
  await cdp.evaluate("document.querySelector('#stars-only').click()");
  assert.equal(await cdp.evaluate("document.body.classList.contains('stars-only')&&document.querySelector('#stars-only').classList.contains('on')"), true);

  // widoczny dokładnie jeden wiersz w całym Kursie K + jego grupa i dział zostają
  assert.deepEqual(await cdp.evaluate(`({
    wiersze:[...document.querySelectorAll('.course-k tr[data-k]')].filter(tr=>tr.checkVisibility()).length,
    grupy:[...document.querySelectorAll('.course-k section.group')].filter(g=>g.checkVisibility()).length,
    dzialy:[...document.querySelectorAll('.course-k article.dzial')].filter(a=>a.checkVisibility()).length
  })`), { wiersze: 1, grupy: 1, dzialy: 1 });

  // PLAY grupy gra WYŁĄCZNIE gwiazdkowaną parę (2 pliki), nie całą grupę
  assert.equal(await cdp.evaluate(`(()=>{
    const tr=document.querySelector('.course-k tr.starred');
    tr.closest('section.group').querySelector('.gplay').click();
    return queue.length===2 && queue[0]===tr.dataset.cue && queue[1]===tr.dataset.enSrc;
  })()`), true);

  // PLAY całego Kursu K też zawęża się do gwiazdek (a nie spada na ścieżkę formatu 1)
  await cdp.evaluate("document.querySelector('.course-k .play-mk').click()");
  assert.equal(await cdp.evaluate('queue.length'), 2);

  // odgwiazdkowanie ukrywa na żywo; whole-K play staje się no-opem
  await cdp.evaluate("document.querySelector('.course-k tr.starred .star-btn').click()");
  assert.equal(await cdp.evaluate("[...document.querySelectorAll('.course-k tr[data-k],.course-k article.dzial')].filter(el=>el.checkVisibility()).length"), 0);
  await cdp.evaluate("document.querySelector('.course-k .play-mk').click()");
  assert.equal(await cdp.evaluate('queue.length'), 2, 'pusty zakres nie buduje nowej kolejki');
  // przywracamy gwiazdkę — dalsza część testu zakłada k:1
  await cdp.evaluate("document.querySelector('#k1 tr[data-k] .star-btn').click()");
  assert.equal(await cdp.evaluate("[...document.querySelectorAll('.course-k tr[data-k]')].filter(tr=>tr.checkVisibility()).length"), 1);

  await cdp.evaluate("document.querySelector('#back-home').click();document.querySelector('.tile[data-go=\"m1\"]').click()");
  assert.equal(await cdp.evaluate('activeCourse'), 'm');
  // tryb zostaje włączony, ale filtr jest scope'owany do .course-k — M nietknięte
  assert.deepEqual(await cdp.evaluate(`({
    schowany:document.querySelector('#stars-only').hidden,
    trybNadalWlaczony:document.body.classList.contains('stars-only'),
    widoczneWierszeM:[...document.querySelectorAll('.mk-view[data-view="m1"] tr[data-k]')].filter(tr=>tr.checkVisibility()).length>10
  })`), { schowany: true, trybNadalWlaczony: true, widoczneWierszeM: true });
  await cdp.evaluate("document.querySelector('#m1-d1 tr[data-k] .star-btn').click()");
  assert.deepEqual(await cdp.evaluate(`({
    k:JSON.parse(localStorage.getItem('kurs.k.stars')||'[]').length,
    m:JSON.parse(localStorage.getItem('kurs.stars')||'[]').length
  })`), { k: 1, m: 1 });
  assert.deepEqual(await cdp.evaluate(`(() => {
    const card=collectStarredCards().cards[0];
    return {mk:card.mk,d:card.d,hasCourse:Object.hasOwn(card,'course')};
  })()`), { mk: 1, d: 1, hasCourse: false });

  await cdp.evaluate("document.querySelector('#review-toggle').click()");
  assert.equal(await cdp.evaluate("document.querySelectorAll('#review-body tr').length"), 1);
  await cdp.evaluate("document.querySelector('#review-toggle').click();document.querySelector('#back-home').click();document.querySelector('.tile[data-go=\"k\"]').click()");
  // powrót do K: przycisk znów widoczny i nadal wciśnięty (flaga przeżyła rundę po M)
  assert.equal(await cdp.evaluate("!document.querySelector('#stars-only').hidden&&document.querySelector('#stars-only').classList.contains('on')"), true);

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 1,
    mobile: true,
  });
  assert.equal(await cdp.evaluate('document.documentElement.scrollWidth<=window.innerWidth'), true);
  assert.deepEqual(await cdp.evaluate('window.__qaErrors'), []);
  assert.equal(cdp.observed.some((event) => event.method === 'Runtime.exceptionThrown'), false);
});
