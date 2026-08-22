import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const chapterPath = path.join(root, 'K', '07-k7-cztery-dziury', 'rozdzial.md');
const chapter = fs.readFileSync(chapterPath, 'utf8');

// K7 był działem o masonach (81 par z map myśli Krzyśka). Od 2026-08-22 jest drylem
// jego własnych błędów, zmierzonych na trzech transkrypcjach lekcji (2026-08-03,
// 2026-08-13, 2026-08-17 — ~9200 słów mowy spontanicznej). Kanon 23 zdań z map
// odszedł świadomie; jego miejsce jako „najważniejszy test działu" zajęły CYTATY.
// Uzasadnienie i tabela liczb: K/PROGRAM-K.md, sekcja K7.

function parseGroups(markdown) {
  const groups = [];
  const groupPattern = /## Grupa (\d+)\n([\s\S]*?)(?=\n## Grupa|\n## Nowe słowa i struktury|$)/g;

  for (const match of markdown.matchAll(groupPattern)) {
    const rows = match[2]
      .split('\n')
      .filter((line) => line.startsWith('|'))
      .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))
      .filter((cells) => cells.length >= 2)
      .filter((cells) => !cells.every((cell) => /^:?-{3,}:?$/.test(cell)))
      .filter((cells) => !/^polski$/i.test(cells[0]));

    groups.push({
      number: Number(match[1]),
      body: match[2],
      mode: match[2].match(/mode:\s*([\w-]+)/)?.[1] ?? 'pl2en',
      rows,
    });
  }

  return groups;
}

const groups = parseGroups(chapter);

// Wszystkie cztery grupy mają dwie kolumny `| polski | angielski |`.
// pl2en  → kolumna 1 to polski cue, czytany głosem PL (marin).
// en-only→ kolumna 1 to CYTAT Krzyśka + polecenie, czytany głosem EN (cedar).
//          assemble-audio.js:227 → tekstPary zwraca {pyt: para.pl, pl: null, en}.
const answers = (group) => group.rows.map((cells) => cells[1]);
const cues = (group) => group.rows.map((cells) => cells[0]);

function countEnglishWords(text) {
  return text.split(/\s+/).filter((token) => /[A-Za-z0-9]/.test(token)).length;
}

const allEnglish = groups.flatMap(answers);
const blob = allEnglish.join('\n');

const MODES = { 1: 'pl2en', 2: 'pl2en', 3: 'en-only', 4: 'en-only' };
const EN_ONLY = new Set([3, 4]);
const PAR_W_GRUPIE = 8;

// --------------------------------------------------------------- cytaty
// NAJWAŻNIEJSZY TEST DZIAŁU (następca KANON-u z wersji masońskiej).
// Szesnaście zdań, które Krzysiek NAPRAWDĘ powiedział na lekcji — każde
// zweryfikowane dosłownie w transkrypcji przed wpisaniem tutaj. Bez tego testu
// trzy iteracje recenzji zamienią jego zdania na wygładzone zdania z podręcznika
// i cały sens działu („to są TWOJE błędy") wyparuje bez śladu.
//
// `blad` musi łapać wersję błędną i NIE łapać poprawnej — dlatego wzorce są
// zakotwiczone w sąsiednich słowach, a nie w samym rzeczowniku.
// Dwa cytaty dzielą znacznik 00:53:09 — to jedna długa wypowiedź z dwoma różnymi
// błędami, więc unikalność egzekwujemy na cytacie, nie na znaczniku.
const CYTATY = [
  // Grupa 3 — rodzajniki. Wiersze 1–5 zasiewają brak „a"; 6–8 to trzy kontrasty.
  { grupa: 3, wiersz: 1, data: '2026-08-03', czas: '00:06:14', cytat: "it's completely different culture", blad: /\bit's completely different culture\b/i },
  { grupa: 3, wiersz: 2, data: '2026-08-17', czas: '00:47:27', cytat: 'It is conspiracy theory', blad: /\bit is conspiracy theory\b/i },
  { grupa: 3, wiersz: 3, data: '2026-08-03', czas: '00:26:42', cytat: "you have problem when you don't tolerate", blad: /\byou have problem\b/i },
  { grupa: 3, wiersz: 4, data: '2026-08-17', czas: '00:53:09', cytat: 'they made hospital from it', blad: /\bmade hospital from\b/i },
  { grupa: 3, wiersz: 5, data: '2026-08-13', czas: '00:19:31', cytat: 'like hundred politics were killed there', blad: /\bhundred politics\b/i },
  { grupa: 3, wiersz: 6, data: '2026-08-03', czas: '00:58:31', cytat: 'to have a health care in the United States', blad: /\ba health care\b/i },
  { grupa: 3, wiersz: 7, data: '2026-08-13', czas: '00:53:56', cytat: 'I watched the documentary about it', blad: /\bwatched the documentary\b/i },
  { grupa: 3, wiersz: 8, data: '2026-08-13', czas: '00:50:02', cytat: 'find someone in a real world', blad: /\bin a real world\b/i },
  // Grupa 4 — precyzja. Wiersze 1–5 zasiewają „or something"; 6–8 to „right?", „I feel like", diagnoza.
  { grupa: 4, wiersz: 1, data: '2026-08-03', czas: '00:08:49', cytat: 'They work like yeah 16 hours a day or something, right?', blad: /\bor something\b/i },
  { grupa: 4, wiersz: 2, data: '2026-08-03', czas: '00:22:13', cytat: 'It was like three years ago or something.', blad: /\bwas like three years\b/i },
  { grupa: 4, wiersz: 3, data: '2026-08-03', czas: '00:21:08', cytat: "Maybe it's twice cheaper, twice cheaper or something", blad: /\btwice cheaper\b/i },
  { grupa: 4, wiersz: 4, data: '2026-08-17', czas: '00:53:09', cytat: 'they put like 500 beds in there or something', blad: /\bput like 500 beds\b/i },
  { grupa: 4, wiersz: 5, data: '2026-08-17', czas: '00:31:16', cytat: 'I associate them with Illuminati or something', blad: /\bwith Illuminati or\b/i },
  { grupa: 4, wiersz: 6, data: '2026-08-03', czas: '00:18:34', cytat: 'Because someone built them from their money, right?', blad: /\bbuilt them from their money\b/i },
  { grupa: 4, wiersz: 7, data: '2026-08-03', czas: '00:59:27', cytat: "I feel like it's the same as in Poland, but squared, right?", blad: /\bI feel like it's the same\b/i },
  { grupa: 4, wiersz: 8, data: '2026-08-03', czas: '01:00:18', cytat: "I feel like I'm going in circles", blad: /\bgoing in circles\b/i },
];

// Klaps filmowy: „August 3rd, 6:14 — you said, "…"". Znacznik jest MM:SS, a powyżej
// godziny H:MM:SS — „60:18" to nieistniejąca minuta i test ma to wyłapać.
// Data najpierw, żeby granica
// przed ciszą była czysta, a ostatnią rzeczą w parze zawsze była wersja poprawna.
const SLATE = /^(?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}(?:st|nd|rd|th), \d{1,2}:\d{2}(?::\d{2})? — you said, "/;

// Sześć powrotów zamiast piętnastu — dział skurczył się z 81 par do 32.
// Pozostałe dziewięć przeniesione na k8 w slownik-k.json.
const POWROTY = [
  { id: 'articles-system', pattern: /\bthe real world\b|\ba hundred\b/i },
  { id: 'must-have', pattern: /\bmust have \w+/i },
  { id: 'comes-down-to', pattern: /\bcomes down to\b/i },
  { id: 'no-hard-evidence', pattern: /\bhard evidence\b/i },
  { id: 'id-say', pattern: /\bI'd say\b/i },
  { id: 'tnij-na-dwa', pattern: /[a-z]\. [A-Z]/ },
];

// Mgła, którą Grupa 4 ma wypędzić. Liczby to wystąpienia w 9200 słowach
// mowy spontanicznej Krzyśka: or something 51×, right? 57×, I feel like 20×.
const MGLA = [
  { nazwa: 'or something', pattern: /\bor something\b/i },
  { nazwa: "it's like / it was like (przybliżenie)", pattern: /\bit'?s like\b|\bit was like\b/i },
  { nazwa: 'right? (dopytka)', pattern: /,\s*right\?/i },
  { nazwa: 'kind of / sort of', pattern: /\b(?:kind|sort) of\b/i },
  { nazwa: 'something like that', pattern: /\bsomething like that\b/i },
  { nazwa: 'or so', pattern: /\bor so\b/i },
  { nazwa: 'I feel like', pattern: /\bI feel like\b/i },
];

// ============================================================ struktura

test('K7 ma 4 grupy po 8 par, tryby pl2en / pl2en / en-only / en-only', () => {
  assert.deepEqual(groups.map((g) => g.number), [1, 2, 3, 4]);

  for (const group of groups) {
    assert.equal(group.rows.length, PAR_W_GRUPIE, `Grupa ${group.number} ma ${group.rows.length} wierszy, wymagane ${PAR_W_GRUPIE}`);
    // W obie strony: dryl PL nie może stać się en-only ani odwrotnie.
    assert.equal(group.mode, MODES[group.number], `Grupa ${group.number}: tryb „${group.mode}" zamiast „${MODES[group.number]}"`);
    for (const [index, cells] of group.rows.entries()) {
      assert.equal(cells.length, 2, `Grupa ${group.number}, wiersz ${index + 1}: ${cells.length} kolumn zamiast 2`);
    }
  }
});

test('K7 ma dokładnie 32 pary', () => {
  const total = groups.reduce((sum, group) => sum + group.rows.length, 0);
  assert.equal(total, 32);
});

test('K7 ma pytanie 4/3/2 dla każdej z 4 grup', () => {
  // Komentarz `<!-- 432: … -->` pod nagłówkiem grupy wpada do k-content.json jako
  // `pytanie432` (tools/generate-k.js). NIE do audio.json — assemble-audio.js
  // przepisuje manifest przy każdej regeneracji i obce pole by zginęło.
  const pytania = new Map();
  let numer = null;
  for (const line of chapter.split('\n')) {
    const h = line.match(/^## Grupa (\d+)/);
    if (h) { numer = Number(h[1]); continue; }
    if (/^#{1,6} /.test(line)) { numer = null; continue; }
    const q = line.match(/^<!--\s*432:\s*(.+?)\s*-->\s*$/);
    if (q && numer != null) pytania.set(numer, q[1]);
  }
  assert.deepEqual([...pytania.keys()].sort((a, b) => a - b), [1, 2, 3, 4]);
  for (const [n, pytanie] of pytania) {
    assert.ok(pytanie.length > 15, `Grupa ${n}: pytanie 4/3/2 za krótkie`);
    assert.match(pytanie, /\?$/, `Grupa ${n}: pytanie 4/3/2 nie kończy się pytajnikiem`);
    assert.doesNotMatch(pytanie, /[ąćęłńóśźż]/i, `Grupa ${n}: pytanie 4/3/2 musi być po angielsku`);
  }
});

test('K7 ma nagłówek z separatorem " / " i obie sekcje notatek', () => {
  // Separator jest kontraktem tools/generate-k.js — dzieli H1 na titlePl/titleEn.
  assert.match(chapter.split('\n')[0], /^# K7 · .+ \/ K7 · .+$/);
  assert.match(chapter, /^## Nowe słowa i struktury$/m);
  assert.match(chapter, /^## Typowe błędy Polaka$/m);
  assert.match(chapter, /^\*\*Akcent i wymowa:\*\*$/m);
});

// ============================================== wierność cytatom (rdzeń działu)

test('K7 cytuje dokładnie te zdania, które Krzysiek powiedział na lekcji', () => {
  const wszystkieCue = groups.filter((g) => EN_ONLY.has(g.number)).flatMap(cues);
  const brakujace = [];
  for (const c of CYTATY) {
    const trafienia = wszystkieCue.filter((cue) => cue.includes(c.cytat));
    if (trafienia.length !== 1) brakujace.push(`G${c.grupa}/w${c.wiersz} (${c.data} ${c.czas}): ${trafienia.length}× „${c.cytat}"`);
  }
  assert.deepEqual(brakujace, [], `Cytaty, które nie występują dokładnie raz w kolumnie wyzwalacza:\n  ${brakujace.join('\n  ')}`);
});

test('K7 stawia cytat na właściwym wierszu właściwej grupy', () => {
  for (const c of CYTATY) {
    const group = groups.find((g) => g.number === c.grupa);
    assert.ok(group, `Brak Grupy ${c.grupa}`);
    const cue = group.rows[c.wiersz - 1]?.[0];
    assert.ok(cue, `Grupa ${c.grupa} nie ma wiersza ${c.wiersz}`);
    assert.ok(cue.includes(c.cytat), `G${c.grupa}, wiersz ${c.wiersz}: wyzwalacz nie zawiera „${c.cytat}"`);
  }
});

test('K7 podaje wyzwalacz en-only w formie klapsa z datą i znacznikiem', () => {
  for (const group of groups.filter((g) => EN_ONLY.has(g.number))) {
    for (const [index, cue] of cues(group).entries()) {
      assert.match(cue, SLATE, `G${group.number}, wiersz ${index + 1}: wyzwalacz nie zaczyna się klapsem „Month Dth, M:SS — you said, "…"`);
    }
  }
});

test('K7 zgadza znacznik w wyzwalaczu z tabelą metryki', () => {
  // Sam wzorzec klapsa nie wystarcza: „60:18" ma poprawny KSZTAŁT MM:SS, choć minuta 60
  // nie istnieje. Jedyne wiarygodne źródło to pole `czas` (HH:MM:SS) — wyzwalacz musi
  // nieść jego skróconą postać, więc każda literówka w minucie wywala test.
  const skrot = (hhmmss) => {
    const [h, m, sek] = hhmmss.split(':').map(Number);
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sek).padStart(2, '0')}` : `${m}:${String(sek).padStart(2, '0')}`;
  };
  for (const c of CYTATY) {
    const cue = groups.find((g) => g.number === c.grupa).rows[c.wiersz - 1][0];
    assert.ok(cue.includes(skrot(c.czas)), `G${c.grupa}, wiersz ${c.wiersz}: wyzwalacz nie niesie znacznika „${skrot(c.czas)}" (z ${c.czas})`);
  }
});

test('K7 dokumentuje pochodzenie każdego cytatu w tabeli metryki', () => {
  // Bez tej tabeli cytatu nie da się odsłuchać w oryginale, a wtedy „to twoje słowa"
  // jest deklaracją, nie faktem sprawdzalnym.
  const sekcja = chapter.slice(chapter.indexOf('## Typowe błędy Polaka'));
  for (const c of CYTATY) {
    const wiersz = sekcja.split('\n').find((l) => l.startsWith('|') && l.includes(c.czas) && l.includes(c.cytat));
    assert.ok(wiersz, `Brak w tabeli metryki wpisu dla G${c.grupa}/w${c.wiersz}: ${c.czas} „${c.cytat}"`);
    assert.ok(wiersz.includes(c.data), `Tabela metryki: zła data przy „${c.cytat}"`);
    assert.ok(/transkrypcja\.md/.test(wiersz), `Tabela metryki: brak pliku transkrypcji przy „${c.cytat}"`);
  }
});

test('K7 nigdy nie powtarza błędu po angielsku w kolumnie odpowiedzi', () => {
  // Granice słów i kotwice w sąsiednich słowach, nie includes(): każdy błąd jest
  // podłańcuchem swojej poprawnej wersji („completely different culture" siedzi
  // w „a completely different culture"), więc naiwny substring zablokowałby
  // też wersje poprawne.
  for (const linia of allEnglish) {
    for (const c of CYTATY) {
      assert.ok(!c.blad.test(linia), `Błąd „${c.cytat}" (${c.data} ${c.czas}) wrócił do odpowiedzi: ${linia}`);
    }
  }
});

test('K7 nie powtarza żadnego zdania — ani odpowiedzi, ani wyzwalacza', () => {
  const norm = (t) => t.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  const pula = [...allEnglish, ...groups.filter((g) => EN_ONLY.has(g.number)).flatMap(cues)];
  const widziane = new Set();
  const duplikaty = [];
  for (const linia of pula) {
    const klucz = norm(linia);
    if (widziane.has(klucz)) duplikaty.push(linia);
    else widziane.add(klucz);
  }
  assert.deepEqual(duplikaty, []);
});

// ============================================================ cele gramatyczne

test('K7 Grupa 1 wymusza irrealis — strefa z zerem wystąpień na lekcjach', () => {
  // grep po 9200 słowach mowy spontanicznej: would have 0×, could have 0×,
  // I wish 0×, unless 0×. Grupa 1 istnieje wyłącznie po to, żeby ten tryb otworzyć.
  const g1 = groups.find((g) => g.number === 1);
  assert.ok(g1, 'Brak Grupy 1');
  const irrealis = /\bwould(?:n't)?(?: \w+)? have \w+|\b(?:I|we|they|he|she|you)'d have \w+|\bwish(?:ed)? .*\bhad\b|\bunless\b|\bwould(?:n't)? be \w+ing\b/i;
  const trzeci = /\bif\b[\s\S]*\bhad\b[\s\S]*\bwould(?:n't)?(?: \w+)? have\b|\bif it hadn't been for\b/i;
  let trzecich = 0;
  for (const [index, cells] of g1.rows.entries()) {
    assert.match(cells[1], irrealis, `G1, wiersz ${index + 1}: odpowiedź bez konstrukcji irrealnej`);
    assert.match(cells[0], /gdyb|żałuj|szkoda, że|chyba że|o ile nie/i, `G1, wiersz ${index + 1}: polski wyzwalacz nie każe gdybać`);
    if (trzeci.test(cells[1])) trzecich += 1;
  }
  assert.ok(trzecich >= 5, `Tylko ${trzecich} odpowiedzi w pełnym 3rd conditionalu — wymagane co najmniej 5`);
  // W zdaniu z `if` NIGDY nie ma `would` — najczęstszy błąd Polaka w tej strefie.
  assert.doesNotMatch(blob, /\bif [^.,|]*\bwould\b/i);
});

test('K7 Grupa 2 wymusza perfekty — past perfect 0× na wszystkich trzech lekcjach', () => {
  // Liczniki wystąpień przepuszczały złą strukturę: „must have read" łapie się na regex
  // present perfect, więc zasiew 5+3 wychodził rzutem na taśmę mimo modalnego perfectu
  // w środku bloku zasiewu. Dlatego test pilnuje SLOTU każdego wiersza z osobna.
  const g2 = groups.find((g) => g.number === 2);
  assert.ok(g2, 'Brak Grupy 2');
  const pastPerfect = /\b(?:had|hadn't|'d) (?:already |never |just |only )?(?:been|had|gone|seen|made|taken|written|read|left|come|begun|become|thought|kept|lost|felt|known|heard|spent|\w+ed)\b/i;
  const modalPerfect = /\b(?:must|might|could|should|may)(?:n't)? have \w+/i;
  const presentPerfect = /\b(?:have|has|'ve|'s) (?:already |never |just )?(?:been|had|gone|seen|made|taken|written|read|left|come|become|kept|lost|felt|known|heard|spent|\w+ed)\b/i;
  const prpCont = /\b(?:have|has|'ve|'s) been \w+ing\b/i;

  for (const i of [0, 1, 2, 3, 4]) {
    const odp = g2.rows[i][1];
    assert.match(odp, pastPerfect, `G2, wiersz ${i + 1}: zasiew wymaga past perfect`);
    assert.ok(!modalPerfect.test(odp), `G2, wiersz ${i + 1}: perfect modalny należy do splotu, nie do zasiewu`);
  }
  assert.match(g2.rows[5][1], modalPerfect, 'G2, wiersz 6: splot zaczyna perfect modalny (must have)');
  assert.match(g2.rows[6][1], presentPerfect, 'G2, wiersz 7: splot wymaga present perfect');
  assert.ok(!modalPerfect.test(g2.rows[6][1]), 'G2, wiersz 7: to ma być present perfect, nie modalny');
  assert.match(g2.rows[7][1], prpCont, 'G2, wiersz 8: splot domyka present perfect continuous');

  assert.match(blob, /\bby the time\b/i, 'Brakuje kotwicy czasowej „by the time"');
  assert.match(blob, /\b(?:since|for) \w+/i, 'Brakuje „since" / „for" przy present perfect');
});

test('K7 zasiewa Grupę 3 pięcioma brakującymi „a", potem trzy kontrasty', () => {
  const g3 = groups.find((g) => g.number === 3);
  for (const i of [0, 1, 2, 3, 4]) {
    assert.match(g3.rows[i][1], /\b(?:a|an) \w+/i, `G3, wiersz ${i + 1}: zasiew wymaga dostawionego „a"`);
  }
  // 6: a → zero (niepoliczalne), 7: the → a (pierwsza wzmianka), 8: a → the (jedyny desygnat)
  assert.match(g3.rows[5][1], /\bhealth care\b/i, 'G3, wiersz 6: kontrast „a health care" → zero rodzajnika');
  assert.doesNotMatch(g3.rows[5][1], /\ba health care\b/i, 'G3, wiersz 6: rodzajnik nie został usunięty');
  assert.match(g3.rows[6][1], /\ba documentary\b/i, 'G3, wiersz 7: kontrast „the" → „a" przy pierwszej wzmiance');
  assert.match(g3.rows[7][1], /\bthe real world\b/i, 'G3, wiersz 8: kontrast „a" → „the" przy jedynym desygnacie');
});

test('K7 zasiewa Grupę 4 mgłą i wypędza ją z odpowiedzi', () => {
  const g4 = groups.find((g) => g.number === 4);
  for (const [index, cue] of cues(g4).entries()) {
    assert.ok(MGLA.some((m) => m.pattern.test(cue)), `G4, wiersz ${index + 1}: wyzwalacz nie zawiera żadnego znacznika mgły`);
  }
  for (const [index, odp] of answers(g4).entries()) {
    for (const m of MGLA) {
      assert.ok(!m.pattern.test(odp), `G4, wiersz ${index + 1}: mgła „${m.nazwa}" przetrwała w odpowiedzi: ${odp}`);
    }
    // Sedno grupy — jego własne słowa z 01:00:18: „I can't find a way to say it
    // in one sentence instead of five". Każda odpowiedź to DOKŁADNIE jedno zdanie.
    assert.match(odp, /^[^.?!]+[.?!]$/, `G4, wiersz ${index + 1}: odpowiedź nie jest jednym zdaniem: ${odp}`);
  }
});

// ============================================================ forma i długość

test('K7 otwiera każdą grupę zdaniem do 8 słów EN', () => {
  for (const group of groups) {
    const slowa = countEnglishWords(answers(group)[0]);
    assert.ok(slowa <= 8, `Grupa ${group.number} otwiera się odpowiedzią na ${slowa} słów`);
  }
});

test('K7 trzyma najdłuższe zdanie na końcu grupy i w limicie 25 słów', () => {
  for (const group of groups) {
    const dlugosci = answers(group).map(countEnglishWords);
    const najdluzsze = Math.max(...dlugosci);
    assert.ok(najdluzsze <= 25, `Grupa ${group.number}: najdłuższe zdanie ma ${najdluzsze} słów, limit 25`);
    const prog = Math.ceil((group.rows.length * 2) / 3);
    assert.ok(
      dlugosci.indexOf(najdluzsze) + 1 > prog,
      `Grupa ${group.number}: najdłuższe zdanie stoi w wierszu ${dlugosci.indexOf(najdluzsze) + 1}, a powinno w ostatniej 1/3`,
    );
  }
});

test('K7 nie kwalifikuje się do migracji na cloze', () => {
  // tools/k67-luki.js migruje notatki K6/K7 z EN ≥21 słów ORAZ ≥1 klockiem <b>
  // na typ `angielski-k-luka`. Nowe karty mają zostać klasyczne, więc trzymamy
  // odpowiedzi poniżej progu i nie wpuszczamy <b> do tabel par.
  for (const group of groups) {
    for (const [index, odp] of answers(group).entries()) {
      assert.ok(countEnglishWords(odp) <= 20, `Grupa ${group.number}, wiersz ${index + 1}: ${countEnglishWords(odp)} słów — próg cloze to 21`);
    }
  }
  const tabele = groups.map((g) => g.rows.flat().join(' ')).join(' ');
  assert.doesNotMatch(tabele, /<b\b/i, 'Pogrubienia należą do sekcji notatek, nie do tabel par');
});

test('K7 trzyma wyzwalacz en-only krótko i po angielsku', () => {
  for (const group of groups.filter((g) => EN_ONLY.has(g.number))) {
    for (const [index, cue] of cues(group).entries()) {
      const slowa = countEnglishWords(cue);
      assert.ok(slowa <= 30, `G${group.number}, wiersz ${index + 1}: wyzwalacz ma ${slowa} słów — cue audio robi się za długi`);
      assert.doesNotMatch(cue, /[ąćęłńóśźż]/i, `G${group.number}, wiersz ${index + 1}: wyzwalacz en-only czyta głos EN, więc musi być po angielsku`);
    }
  }
});

test('K7 trzyma wyzwalacz pl2en po polsku i bez podpowiedzi', () => {
  for (const group of groups.filter((g) => !EN_ONLY.has(g.number))) {
    for (const [index, cells] of group.rows.entries()) {
      assert.match(cells[0], /[ąćęłńóśźż]/i, `G${group.number}, wiersz ${index + 1}: polski wyzwalacz bez polskich znaków`);
      const slowaEn = cells[1].toLowerCase().split(/\s+/);
      for (let i = 0; i + 4 <= slowaEn.length; i += 1) {
        const fragment = slowaEn.slice(i, i + 4).join(' ');
        assert.ok(!cells[0].toLowerCase().includes(fragment), `G${group.number}, wiersz ${index + 1}: wyzwalacz zdradza odpowiedź („${fragment}")`);
      }
    }
  }
});

// ============================================================ czarne listy

test('K7 nie uczy kalk z polskiego', () => {
  const kalki = [
    { nazwa: 'different than (zamiast from)', pattern: /\bdifferent than\b/i },
    { nazwa: 'in real world (bez the)', pattern: /\bin real world\b/i },
    { nazwa: 'discuss about', pattern: /\bdiscuss about\b/i },
    { nazwa: 'explain me', pattern: /\bexplain me\b/i },
    { nazwa: 'on the picture (zamiast in)', pattern: /\bon the picture\b/i },
    { nazwa: 'since / from + długość (zamiast for)', pattern: /\b(?:since|from) \w+ years\b/i },
    { nazwa: 'twice cheaper (zamiast half the price)', pattern: /\btwice cheaper\b/i },
    { nazwa: 'I don\'t think so + zdanie', pattern: /\bI don't think so\s+(?:they|he|she|it|people|we|you|I)\b/i },
    { nazwa: 'politics jako politycy', pattern: /\b(?:hundred|many|some|the) politics\b/i },
    { nazwa: 'resign o rzuceniu czegoś', pattern: /\bI resigned\b/i },
    { nazwa: 'overtake zamiast overthrow', pattern: /\bovertake the government\b/i },
  ];
  const znalezione = kalki.filter((k) => k.pattern.test(blob)).map((k) => k.nazwa);
  assert.deepEqual(znalezione, []);
});

test('K7 nie podsuwa zużytych narzędzi hedgingu w odpowiedziach', () => {
  // `I think` / `I feel like` / `probably` padły 69 / 20 / 46 razy w transkrypcjach.
  // K6 je wypalał, Grupa 4 celuje w nie wprost — nie mogą wrócić w kolumnie wzorca.
  // Zakaz dotyczy WYŁĄCZNIE odpowiedzi: w wyzwalaczach G4 są obowiązkowe, bo to
  // właśnie błąd do naprawienia.
  assert.doesNotMatch(blob, /\b(?:I think|I feel like|probably)\b/i);
});

test('K7 nie zamienia poprawki w twierdzenie o teorii spiskowej', () => {
  // Trzy cytaty z Grupy 3 i 4 dotyczą COVID i teorii spiskowych. Poprawienie
  // rodzajnika nie może po drodze przemienić się w głoszenie tezy.
  const ryzykowne = /\b(?:conspiracy|hoax|hidden elites|Illuminati)\b/i;
  const atrybucja = /\b(?:theory|theories|some people|supposedly|claim|claiming|I'd say|it's said)\b/i;
  const bezAtrybucji = allEnglish.filter((l) => ryzykowne.test(l) && !atrybucja.test(l));
  assert.deepEqual(bezAtrybucji, []);
});

// ============================================================ recykling

test('K7 recyklinguje sześć zaplanowanych klocków z K1/K4/K6', () => {
  const brakujace = POWROTY.filter((p) => !p.pattern.test(blob)).map((p) => p.id);
  assert.deepEqual(brakujace, []);
});

test('slownik-k.json zna dział k7 i nie planuje na niego więcej niż 20 powrotów', () => {
  const slownik = JSON.parse(fs.readFileSync(path.join(root, 'K', 'slownik-k.json'), 'utf8'));

  const dzial = slownik.dzialy.find((d) => d.id === 'k7');
  assert.ok(dzial, 'Brak wpisu k7 w slownik-k.json → dzialy');
  assert.equal(dzial.folder, '07-k7-cztery-dziury');
  assert.ok(dzial.tytulPl && dzial.tytulEn && dzial.opis);

  const powroty = slownik.wyrazenia.filter((w) => (w.review || []).includes('k7')).length;
  assert.ok(powroty <= 20, `Rejestr planuje ${powroty} powrotów na k7 — dział ich nie wchłonie`);

  const intro = slownik.wyrazenia.filter((w) => w.intro === 'k7');
  assert.ok(intro.length >= 20, `Tylko ${intro.length} wyrażeń z intro k7`);
  for (const w of intro) {
    assert.ok(Array.isArray(w.review) && w.review.length >= 1, `${w.id}: brak zaplanowanego powrotu`);
    assert.ok(w.review.length <= 3, `${w.id}: ${w.review.length} powrotów — rejestr znowu magazynuje`);
  }
});

test('slownik-k.json nie zgubił leksyki z lekcji 2026-08-17', () => {
  // Trzynaście wyrażeń, których Krzysiek szukał NA ŻYWO na lekcji o masonach.
  // Stary K7 je drylował w Grupie 7; nowy K7 ich nie ma, ale to jest realnie
  // nauczone słownictwo z zaplanowanymi powrotami — musi przeżyć przepisanie
  // działu, przeniesione na k8, a nie zniknąć razem z materiałem masońskim.
  const slownik = JSON.parse(fs.readFileSync(path.join(root, 'K', 'slownik-k.json'), 'utf8'));
  const wymagane = ['the-authorities', 'ease-restrictions', 'get-fined-for', 'taped-off', 'turn-into', 'the-elderly', 'give-up-quit', 'of-your-own-free-will', 'on-your-own-terms', 'another-person', 'there-were-no'];
  const maja = new Set(slownik.wyrazenia.map((w) => w.id));
  const zgubione = wymagane.filter((id) => !maja.has(id));
  assert.deepEqual(zgubione, [], `Leksyka z lekcji 2026-08-17 wypadła z rejestru: ${zgubione.join(', ')}`);
});
