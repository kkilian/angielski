import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const chapterPath = path.join(root, 'K', '08-k8-piec-sufitow', 'rozdzial.md');
const chapter = fs.readFileSync(chapterPath, 'utf8');

// K8 = dryl pięciu „sufitów" z diagnozy lekcji 2026-08-24 (56 min, ~4000 słów mowy
// spontanicznej Krzyśka; poziom B2−). Wzorzec: K7 (2026-08-22). Grupy 1 i 4 to jego
// własne zdania z tej lekcji (en-only), Grupy 2/3/5 to produkcja w nowym kontekście.
// Uzasadnienie, tabela liczb i decyzje: K/PROGRAM-K.md, sekcja K8.

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
const grupa = (n) => groups.find((g) => g.number === n);

// Wszystkie pięć grup idzie w `pl2en`: kolumna 1 to polski cue czytany głosem PL (marin),
// cisza, wzorzec EN (cedar). Wersja z 24.08 stawiała G1/G4 w `en-only` (przód karty =
// cytat z nagrania + polecenie); odrzucona 25.08 razem z takim samym eksperymentem w K7 —
// w Anki czytało się to jak protokół, a nie jak zdanie do wypowiedzenia.
const answers = (group) => group.rows.map((cells) => cells[1]);
const cues = (group) => group.rows.map((cells) => cells[0]);

function countEnglishWords(text) {
  return text.split(/\s+/).filter((token) => /[A-Za-z0-9]/.test(token)).length;
}

const allEnglish = groups.flatMap(answers);
const blob = allEnglish.join('\n');

const MODES = { 1: 'pl2en', 2: 'pl2en', 3: 'pl2en', 4: 'pl2en', 5: 'pl2en' };
const PAR_W_GRUPIE = 8;

// --------------------------------------------------------------- cytaty
// NAJWAŻNIEJSZY TEST DZIAŁU. Szesnaście zdań, które Krzysiek NAPRAWDĘ powiedział
// 2026-08-24 — każde zweryfikowane dosłownie w transkrypcji (numer linii w komentarzu)
// przed wpisaniem tutaj. Od 25.08 cytaty NIE stoją już na kartach (te są zwykłe PL→EN);
// żyją w tabeli metryki i pilnują dwóch rzeczy: że każdy wiersz G1/G4 prostuje konkretną,
// udokumentowaną wpadkę, i że wersja błędna nigdy nie wraca w kolumnie wzorca.
//
// `blad` musi łapać wersję błędną i NIE łapać poprawnej — wzorce zakotwiczone w sąsiednich
// słowach, bo każdy błąd jest podłańcuchem swojej poprawki („make mess" ⊂ „make a mess" nie,
// ale „shared kitchen" ⊂ „a shared kitchen" tak).
const CYTATY = [
  // Grupa 1 — rodzajniki. Wiersze 1–5 zasiewają brak „a"; 6–8: there was a / make a / another.
  { grupa: 1, wiersz: 1, data: '2026-08-24', czas: '00:01:06', cytat: "I'm in a bit of rush", blad: /\bbit of rush\b/i }, // l. 53 (rozgrzewka z ChatGPT)
  { grupa: 1, wiersz: 2, data: '2026-08-24', czas: '00:04:32', cytat: 'it was standard week, nothing crazy. Just enjoying last day of summer', blad: /\bwas standard week\b|\benjoying last day\b/i }, // l. 95
  { grupa: 1, wiersz: 3, data: '2026-08-24', czas: '00:07:31', cytat: 'my friend she was medical student', blad: /\bwas medical student\b|\bmy friend she\b/i }, // l. 161
  { grupa: 1, wiersz: 4, data: '2026-08-24', czas: '00:28:05', cytat: "it costs the same as apartment, but it's just one room", blad: /\bsame as apartment\b/i }, // l. 537
  { grupa: 1, wiersz: 5, data: '2026-08-24', czas: '00:15:14', cytat: 'it was like a 15-minute walk So it was like seven minute run', blad: /\bseven minute run\b|\bwas like a 15-minute\b/i }, // l. 311
  { grupa: 1, wiersz: 6, data: '2026-08-24', czas: '00:33:19', cytat: 'Because there was also shared kitchen, you know', blad: /\balso shared kitchen\b/i }, // l. 631
  { grupa: 1, wiersz: 7, data: '2026-08-24', czas: '00:31:15', cytat: 'they just make mess everywhere', blad: /\bmake mess\b/i }, // l. 595
  { grupa: 1, wiersz: 8, data: '2026-08-24', czas: '00:28:57', cytat: 'Then you can get shared room with other person', blad: /\bget shared room\b|\bwith other person\b/i }, // l. 559
  // Grupa 4 — przyimki i kolokacje kalkowane z polskiego.
  { grupa: 4, wiersz: 1, data: '2026-08-24', czas: '00:48:55', cytat: "If it's in TV, it's true for them", blad: /\bin TV\b/i }, // l. 887
  { grupa: 4, wiersz: 2, data: '2026-08-24', czas: '00:19:37', cytat: "it is worth it but it's only on once at some universities", blad: /\bonly on once\b|\bon some universities\b/i }, // l. 377
  { grupa: 4, wiersz: 3, data: '2026-08-24', czas: '00:34:19', cytat: 'someone, you know burning something like on the pan or something', blad: /\bon the pan\b/i }, // l. 647
  { grupa: 4, wiersz: 4, data: '2026-08-24', czas: '00:07:47', cytat: 'she was using it to all of these different subjects', blad: /\busing it to\b/i }, // l. 165
  { grupa: 4, wiersz: 5, data: '2026-08-24', czas: '00:06:56', cytat: 'it generates me the sentences', blad: /\bgenerates me\b/i }, // l. 155
  { grupa: 4, wiersz: 6, data: '2026-08-24', czas: '00:14:19', cytat: 'they allowed me to to actually participate in this exam', blad: /\ballowed me to\b|\bparticipate in this exam\b/i }, // l. 285
  { grupa: 4, wiersz: 7, data: '2026-08-24', czas: '00:47:30', cytat: 'in these days most of contact is generated by AI', blad: /\bin these days\b|\bmost of contact\b/i }, // l. 865 („Now" przed cytatem odcięte — inaczej polecenie musiałoby zapowiadać jego usunięcie)
  { grupa: 4, wiersz: 8, data: '2026-08-24', czas: '00:11:28', cytat: 'if you passed with high score, then you can get to the best high school', blad: /\bwith high score\b|\bget to the best\b/i }, // l. 241
];

// Powroty z rejestru, które REALNIE wracają w kolumnie odpowiedzi. Osiem z sześćdziesięciu
// zaplanowanych na k8 — reszta wycięta bez zastępnika (PROGRAM-K, sekcja K8). Checker
// recyklingu dopasowuje słowa z przykładów (`He must have seen it` → „seen"), więc to ta
// tablica, nie checker, jest kontraktem.
const POWROTY = [
  { id: 'articles-system', pattern: /\ba shared room\b|\ban apartment\b/i },
  { id: 'must-have', pattern: /\bmust have seen\b/i },
  { id: 'couldnt-have', pattern: /\bcouldn't have been\b/i },
  { id: 'blanking-on-word', pattern: /\bI'm blanking on the word\b/i },
  { id: 'sort-of-like', pattern: /\bsort of like\b/i },
  { id: 'commute', pattern: /\bthe commute\b/i },
  { id: 'if-i-had-to-guess', pattern: /\bIf I had to guess\b/i },
  { id: 'no-one-really-knows', pattern: /\bno one really knows\b/i },
  { id: 'let-it-go', pattern: /\blet the rest go\b/i },
  // pięć wpisów intro:k8 zachowanych z poczekalni po K7
  { id: 'another-person', pattern: /\banother person\b/i },
  { id: 'there-were-no', pattern: /\bthere were no\b/i },
  { id: 'might-have-been-doing', pattern: /\bmight have been \w+ing\b/i },
  { id: 'not-sure-how-to-put-it', pattern: /\bI'm not sure how to put it\b/i },
  { id: 'honestly', pattern: /\bHonestly\b/ },
];

// Mgła (K7 G4) — w K8 nie może wrócić w żadnej odpowiedzi Grupy 4.
const MGLA = [
  { nazwa: 'or something', pattern: /\bor something\b/i },
  { nazwa: "it's like / it was like (przybliżenie)", pattern: /\bit'?s like\b|\bit was like\b/i },
  { nazwa: 'right? (dopytka)', pattern: /,\s*right\?/i },
  { nazwa: 'kind of / sort of', pattern: /\b(?:kind|sort) of\b/i },
  { nazwa: 'something like that', pattern: /\bsomething like that\b/i },
  { nazwa: 'or so', pattern: /\bor so\b/i },
  { nazwa: 'I feel like', pattern: /\bI feel like\b/i },
  { nazwa: 'you know (wypełniacz, 29× na lekcji)', pattern: /\byou know\b/i },
];

// Kalki z 24.08 — żadna nie może wrócić w kolumnie odpowiedzi (w wyzwalaczach G4 są obowiązkowe).
const KALKI_24_08 = /\bin TV\b|\bin television\b|\bin (?:the )?news\b|\bon (?:some |the )?universit|\bonly on once\b|\bon the pan\b|\busing it to\b|\bgenerates? me\b|\ballowed me to\b|\bparticipate in (?:this|the) exam\b|\bin these days\b|\bmost of contact\b|\bget to the best\b|\bwith high score\b/i;

// ============================================================ struktura

test('K8 ma 5 grup po 8 par, wszystkie w trybie pl2en', () => {
  assert.deepEqual(groups.map((g) => g.number), [1, 2, 3, 4, 5]);
  for (const group of groups) {
    assert.equal(group.rows.length, PAR_W_GRUPIE, `Grupa ${group.number} ma ${group.rows.length} wierszy, wymagane ${PAR_W_GRUPIE}`);
    assert.equal(group.mode, MODES[group.number], `Grupa ${group.number}: tryb „${group.mode}" zamiast „${MODES[group.number]}"`);
    for (const [index, cells] of group.rows.entries()) {
      assert.equal(cells.length, 2, `Grupa ${group.number}, wiersz ${index + 1}: ${cells.length} kolumn zamiast 2`);
    }
  }
});

test('K8 ma dokładnie 40 par', () => {
  assert.equal(groups.reduce((sum, group) => sum + group.rows.length, 0), 40);
});

test('K8 ma pytanie 4/3/2 dla każdej z 5 grup', () => {
  const pytania = new Map();
  let numer = null;
  for (const line of chapter.split('\n')) {
    const h = line.match(/^## Grupa (\d+)/);
    if (h) { numer = Number(h[1]); continue; }
    if (/^#{1,6} /.test(line)) { numer = null; continue; }
    const q = line.match(/^<!--\s*432:\s*(.+?)\s*-->\s*$/);
    if (q && numer != null) pytania.set(numer, q[1]);
  }
  assert.deepEqual([...pytania.keys()].sort((a, b) => a - b), [1, 2, 3, 4, 5]);
  for (const [n, pytanie] of pytania) {
    assert.ok(pytanie.length > 15, `Grupa ${n}: pytanie 4/3/2 za krótkie`);
    assert.match(pytanie, /\?$/, `Grupa ${n}: pytanie 4/3/2 nie kończy się pytajnikiem`);
    assert.doesNotMatch(pytanie, /[ąćęłńóśźż]/i, `Grupa ${n}: pytanie 4/3/2 musi być po angielsku`);
  }
});

test('K8 ma nagłówek z separatorem " / " i obie sekcje notatek', () => {
  assert.match(chapter.split('\n')[0], /^# K8 · .+ \/ K8 · .+$/);
  assert.match(chapter, /^## Nowe słowa i struktury$/m);
  assert.match(chapter, /^## Typowe błędy Polaka$/m);
  assert.match(chapter, /^\*\*Akcent i wymowa:\*\*$/m);
});

// ============================================== wierność cytatom (rdzeń działu)

test('K8 wiąże każdy cytat z wierszem, który go prostuje', () => {
  // Cytat nie stoi już na karcie, więc jedyne, co go trzyma przy drylu, to ten test:
  // każdy wpis z CYTATY musi wskazywać istniejący wiersz, a jego wzorzec musi być
  // wolny od błędu. Bez tego tabela metryki stałaby się ozdobą.
  for (const c of CYTATY) {
    const odp = grupa(c.grupa)?.rows[c.wiersz - 1]?.[1];
    assert.ok(odp, `Grupa ${c.grupa} nie ma wiersza ${c.wiersz}`);
    assert.ok(!c.blad.test(odp), `G${c.grupa}, wiersz ${c.wiersz}: wzorzec nadal niesie błąd „${c.cytat}"`);
  }
});

test('K8 dokumentuje pochodzenie każdego cytatu w tabeli metryki', () => {
  const sekcja = chapter.slice(chapter.indexOf('## Typowe błędy Polaka'));
  for (const c of CYTATY) {
    const wiersz = sekcja.split('\n').find((l) => l.startsWith('|') && l.includes(c.czas) && l.includes(c.cytat));
    assert.ok(wiersz, `Brak w tabeli metryki wpisu dla G${c.grupa}/w${c.wiersz}: ${c.czas} „${c.cytat}"`);
    assert.ok(wiersz.includes(c.data), `Tabela metryki: zła data przy „${c.cytat}"`);
    assert.ok(/2026-08-24 18-27-47 — transkrypcja\.md/.test(wiersz), `Tabela metryki: brak pliku transkrypcji przy „${c.cytat}"`);
  }
});

test('K8 nigdy nie powtarza błędu po angielsku w kolumnie odpowiedzi', () => {
  for (const linia of allEnglish) {
    for (const c of CYTATY) {
      assert.ok(!c.blad.test(linia), `Błąd „${c.cytat}" (${c.czas}) wrócił do odpowiedzi: ${linia}`);
    }
    assert.ok(!KALKI_24_08.test(linia), `Kalka z 24.08 wróciła do odpowiedzi: ${linia}`);
  }
});

test('K8 nie powtarza żadnego zdania — ani odpowiedzi, ani wyzwalacza', () => {
  const norm = (t) => t.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  const pula = [...allEnglish, ...groups.flatMap(cues)];
  const widziane = new Set();
  const duplikaty = [];
  for (const linia of pula) {
    const klucz = norm(linia);
    if (widziane.has(klucz)) duplikaty.push(linia);
    else widziane.add(klucz);
  }
  assert.deepEqual(duplikaty, []);
});

// ============================================================ cele per grupa

test('K8 Grupa 1 zasiewa pięć brakujących „a", potem there was a / make a / another', () => {
  const g1 = grupa(1);
  for (const i of [0, 1, 2, 3, 4]) {
    assert.match(g1.rows[i][1], /\b(?:a|an) \w+/i, `G1, wiersz ${i + 1}: zasiew wymaga dostawionego „a"`);
  }
  assert.match(g1.rows[3][1], /\ban apartment\b/, 'G1, wiersz 4: przed samogłoską „an"');
  assert.match(g1.rows[5][1], /\bthere was also a shared kitchen\b/i, 'G1, wiersz 6: rama „there was a X"');
  assert.match(g1.rows[6][1], /\bmake a mess\b/i, 'G1, wiersz 7: kolokacja „make a mess"');
  assert.match(g1.rows[7][1], /\ba shared room with another person\b/i, 'G1, wiersz 8: „a shared room" + „another"');
});

test('K8 Grupa 2 daje słowo codzienne i wiązkę ratunkową zamiast apelu do lektora', () => {
  const g2 = grupa(2);
  const LEKSYKA = /\bprincipal\b|\bjanitor\b|\belementary school\b|\bdorm\b|\bfeature\b|\bem dash\b|\bdead giveaway\b|\blet (?:it|the rest|everything else) go\b|\btook advantage of\b|\bblanking on the word\b|\bsort of like\b|\bnot sure how to put it\b|\bcould only get better\b/gi;
  for (const [index, odp] of answers(g2).entries()) {
    const trafienia = new Set((odp.match(LEKSYKA) || []).map((t) => t.toLowerCase()));
    assert.ok(trafienia.size >= 1, `G2, wiersz ${index + 1}: odpowiedź bez targetu leksykalnego: ${odp}`);
    if (index >= 5) assert.ok(trafienia.size >= 2, `G2, wiersz ${index + 1}: splot wymaga co najmniej dwóch klocków: ${odp}`);
    assert.doesNotMatch(odp, /\bwhat'?s the name of\b|\bwhat do you call\b|\bhow (?:would|do) you (?:say|call)\b/i, `G2, wiersz ${index + 1}: apel do lektora wrócił`);
    assert.doesNotMatch(odp, /\bacademic\b|\bgymnasium\b|\bminus(?:es)?\b/i, `G2, wiersz ${index + 1}: fałszywy przyjaciel`);
  }
  // Trzy wiązki ratunkowe — po jednej — bo zachowanie do zmiany to „mów dalej, nie oddawaj tury".
  assert.match(blob, /\bI'm blanking on the word\b/);
  assert.match(blob, /\bI'm not sure how to put it\b/);
  assert.match(blob, /\bsort of like\b/);
});

test('K8 Grupa 3 zastępuje terrible / nice / weird rejestrem ocen', () => {
  const g3 = grupa(3);
  // Recenzent B (2026-08-24): grim / squalid / a shambles wyleciały jako słownikowe i BrE —
  // rejestr ma być MÓWIONY, amerykański. Strażnik pilnuje, żeby nie wróciły.
  const NEG = /\bnasty\b|\bdingy\b|\bfilthy\b|\brun-down\b|\bin rough shape\b|\bdepressing\b|\ba disaster\b|\ba train wreck\b|\ba disgrace\b|\bpricey\b/i;
  const POS = /\bdecent\b|\bupscale\b|\bwell kept\b|\bgrew on me\b|\bgrows on you\b/i;
  assert.doesNotMatch(blob, /\bgrim\b|\bsqualid\b|\ba shambles\b/i, 'Słownikowe / brytyjskie oceny wróciły do odpowiedzi');
  const MONOKULTURA = /\bterrible\b|\bnice\b|\bweird\b|\bcrazy\b|\bbullshit\b|\bfucking\b/i;
  for (const [index, odp] of answers(g3).entries()) {
    assert.ok(NEG.test(odp) || POS.test(odp), `G3, wiersz ${index + 1}: odpowiedź bez słowa z rejestru ocen: ${odp}`);
    assert.doesNotMatch(odp, MONOKULTURA, `G3, wiersz ${index + 1}: monokultura ocen wróciła: ${odp}`);
    if (index < 5) assert.ok(NEG.test(odp) && !POS.test(odp), `G3, wiersz ${index + 1}: zasiew to same oceny negatywne`);
    else assert.ok(NEG.test(odp) && POS.test(odp), `G3, wiersz ${index + 1}: splot kontrastuje negatyw z pozytywem`);
  }
  // Polski wyzwalacz nie może podsuwać zużytego słowa („okropny" → terrible, „fajny" → nice).
  for (const [index, cue] of cues(g3).entries()) {
    assert.doesNotMatch(cue, /\bokropn|\bstraszn|\bfajn|\bdziwn|\bszalon/i, `G3, wiersz ${index + 1}: wyzwalacz ciągnie do terrible/nice/weird/crazy`);
  }
});

test('K8 Grupa 4 poprawia przyimek w jednym zdaniu i wypędza mgłę', () => {
  const g4 = grupa(4);
  const POPRAWKI = [/\bon TV\b/, /\bat some universities\b/, /\bin a pan\b/, /\busing it for\b/, /\bfor me\b/, /\blet me take the exam\b/, /^These days\b/, /\ba high score\b[\s\S]*\bget into\b/];
  for (const [index, odp] of answers(g4).entries()) {
    assert.match(odp, POPRAWKI[index], `G4, wiersz ${index + 1}: odpowiedź nie zawiera oczekiwanej poprawki`);
    for (const m of MGLA) {
      assert.ok(!m.pattern.test(odp), `G4, wiersz ${index + 1}: mgła „${m.nazwa}" przetrwała w odpowiedzi: ${odp}`);
    }
    assert.match(odp, /^[^.?!]+[.?!]$/, `G4, wiersz ${index + 1}: odpowiedź nie jest jednym zdaniem: ${odp}`);
  }
  // Cue jest polski, więc kalki w nim nie ma — jest jej ŹRÓDŁO. Każdy wiersz niesie
  // polski przyimek/konstrukcję, która tłumaczy się inaczej, niż podpowiada odruch;
  // dokładnie w tych miejscach 24.08 poszła kalka.
  const PULAPKI_PL = [/w telewizji/i, /na niektórych uczelniach/i, /na patelni/i, /do wszystkich/i, /generuje mi/i, /podejść do/i, /W dzisiejszych czasach/i, /dostać się do/i];
  for (const [index, cue] of cues(g4).entries()) {
    assert.match(cue, PULAPKI_PL[index], `G4, wiersz ${index + 1}: wyzwalacz nie niesie polskiej pułapki, na której opiera się dryl`);
  }
});

test('K8 Grupa 5 otwiera strefę irrealis: must have ×5, potem couldn\'t have / 3rd cond / might have been', () => {
  const g5 = grupa(5);
  for (const i of [0, 1, 2, 3, 4]) {
    assert.match(g5.rows[i][1], /\bmust have (?:been )?\w+/i, `G5, wiersz ${i + 1}: zasiew wymaga „must have"`);
    assert.doesNotMatch(g5.rows[i][1], /\bhad to\b/i, `G5, wiersz ${i + 1}: „musiał" uciekł w obowiązek (had to)`);
    // Ogon wnioskowania w polskim wyzwalaczu — bez niego „musiał" czyta się jako „had to".
    assert.match(g5.rows[i][0], /inaczej|bo |tylko nikt|jakimś|— /, `G5, wiersz ${i + 1}: wyzwalacz bez ogona wnioskowania`);
  }
  assert.match(g5.rows[5][1], /\bcouldn't have been worse\b/i, 'G5, wiersz 6: „gorzej być nie mogło"');
  assert.match(g5.rows[6][1], /\bif\b[\s\S]*\b(?:had|'d) \w+[\s\S]*,[\s\S]*\bwould(?:n't)? have \w+/i, 'G5, wiersz 7: pełny 3rd conditional z przecinkiem przed „would"');
  assert.match(g5.rows[7][1], /\bIf I had to guess\b/, 'G5, wiersz 8: otwarcie spekulacji');
  assert.match(g5.rows[7][1], /\bmight have been \w+ing\b/i, 'G5, wiersz 8: „might have been -ing"');
  for (const [index, cue] of cues(g5).entries()) {
    assert.doesNotMatch(cue, /\bmoże\b|\bpewnie\b|\bchyba\b|\bmyślę\b/i, `G5, wiersz ${index + 1}: wyzwalacz ciągnie do maybe / probably / I think`);
  }
  assert.doesNotMatch(blob, /\bmaybe\b|\bI guess\b/i, 'Odpowiedzi nie mogą spekulować przez maybe / I guess');
  assert.doesNotMatch(blob, /\bif [^.,|]*\bwould\b/i, 'W zdaniu z „if" nie ma „would"');
});

// ============================================================ forma i długość

test('K8 otwiera każdą grupę zdaniem do 8 słów EN', () => {
  for (const group of groups) {
    const slowa = countEnglishWords(answers(group)[0]);
    assert.ok(slowa <= 8, `Grupa ${group.number} otwiera się odpowiedzią na ${slowa} słów`);
  }
});

test('K8 trzyma najdłuższe zdanie na końcu grupy i w limicie 25 słów', () => {
  for (const group of groups) {
    const dlugosci = answers(group).map(countEnglishWords);
    const najdluzsze = Math.max(...dlugosci);
    assert.ok(najdluzsze <= 25, `Grupa ${group.number}: najdłuższe zdanie ma ${najdluzsze} słów, limit 25`);
    const prog = Math.ceil((group.rows.length * 2) / 3);
    assert.ok(dlugosci.indexOf(najdluzsze) + 1 > prog, `Grupa ${group.number}: najdłuższe zdanie stoi w wierszu ${dlugosci.indexOf(najdluzsze) + 1}, a powinno w ostatniej 1/3`);
  }
});

test('K8 nie kwalifikuje się do migracji na cloze', () => {
  // tools/k67-luki.js migruje notatki z EN ≥21 słów ORAZ ≥1 klockiem <b>. Karty K8 mają
  // zostać klasyczne — odpowiedzi poniżej progu, zero <b> w tabelach par.
  for (const group of groups) {
    for (const [index, odp] of answers(group).entries()) {
      assert.ok(countEnglishWords(odp) <= 20, `Grupa ${group.number}, wiersz ${index + 1}: ${countEnglishWords(odp)} słów — próg cloze to 21`);
    }
  }
  const tabele = groups.map((g) => g.rows.flat().join(' ')).join(' ');
  assert.doesNotMatch(tabele, /<b\b/i, 'Pogrubienia należą do sekcji notatek, nie do tabel par');
});

test('K8 trzyma wyzwalacz po polsku i bez podpowiedzi', () => {
  // Polskość sprawdzamy dwutorowo: znak diakrytyczny ALBO słowo funkcyjne, które nie
  // istnieje po angielsku — bezspornie polskie zdanie potrafi nie mieć ani jednego ogonka.
  // Uwaga na \b: to granica ASCII, więc „\bże\b" nie łapie własnego „ż".
  const POLSKIE = /[ąćęłńóśźż]/i;
  const FUNKCYJNE = /(?<!\p{L})(?:że|się|jest|nie|jak|czy|już|tam|ale|tylko|przez|dla|bez|na|w|z|od|po|za|tego|tym|mnie|mi|ci|mu|ich|te|ta)(?!\p{L})/iu;
  for (const group of groups) {
    for (const [index, cells] of group.rows.entries()) {
      const cue = cells[0];
      assert.ok(
        POLSKIE.test(cue) || FUNKCYJNE.test(cue),
        `G${group.number}, wiersz ${index + 1}: wyzwalacz nie wygląda na polski — głos PL przeczyta go jak polski tekst`,
      );
      const slowaEn = cells[1].toLowerCase().split(/\s+/);
      for (let i = 0; i + 4 <= slowaEn.length; i += 1) {
        const fragment = slowaEn.slice(i, i + 4).join(' ');
        assert.ok(!cue.toLowerCase().includes(fragment), `G${group.number}, wiersz ${index + 1}: wyzwalacz zdradza odpowiedź („${fragment}")`);
      }
    }
  }
});

// ============================================================ czarne listy

test('K8 nie uczy kalk z polskiego ani brytyjskiej pisowni', () => {
  const kalki = [
    { nazwa: 'different than (zamiast from)', pattern: /\bdifferent than\b/i },
    { nazwa: 'in real world (bez the)', pattern: /\bin real world\b/i },
    { nazwa: 'discuss about', pattern: /\bdiscuss about\b/i },
    { nazwa: 'explain me', pattern: /\bexplain me\b/i },
    { nazwa: 'on the picture (zamiast in)', pattern: /\bon the picture\b/i },
    { nazwa: 'since / from + długość (zamiast for)', pattern: /\b(?:since|from) \w+ years\b/i },
    { nazwa: 'twice cheaper (zamiast half the price)', pattern: /\btwice cheaper\b/i },
    { nazwa: "I don't think so + zdanie", pattern: /\bI don't think so\s+(?:they|he|she|it|people|we|you|I)\b/i },
    { nazwa: 'politics jako politycy', pattern: /\b(?:hundred|many|some|the) politics\b/i },
    { nazwa: 'resign o rzuceniu czegoś', pattern: /\bI resigned\b/i },
    { nazwa: 'overtake zamiast overthrow', pattern: /\bovertake the government\b/i },
    { nazwa: 'academic jako akademik', pattern: /\b(?:an|the) academic\b/i },
    { nazwa: 'BrE (skill wymaga General American)', pattern: /\bneighbourhood\b|\bcolour\b|\bfavourite\b|\bcentre\b|\bsit the exam\b|\bflat\b/i },
  ];
  const znalezione = kalki.filter((k) => k.pattern.test(blob)).map((k) => k.nazwa);
  assert.deepEqual(znalezione, []);
});

test('K8 nie podsuwa zużytych narzędzi hedgingu ani „I don\'t know" w odpowiedziach', () => {
  // I think 19× / I don't know 12× / „So, yeah" — diagnoza 24.08: opinia = jedno zdanie
  // + wygaszenie. Zakaz dotyczy WYŁĄCZNIE odpowiedzi.
  assert.doesNotMatch(blob, /\b(?:I think|I feel like|probably|I don't know)\b/i);
});

// ============================================================ recykling i rejestr

test('K8 recyklinguje dokładnie te powroty, które rejestr na niego zostawił', () => {
  const brakujace = POWROTY.filter((p) => !p.pattern.test(blob)).map((p) => p.id);
  assert.deepEqual(brakujace, []);
});

test('slownik-k.json zna dział k8, poczekalnia jest przycięta, nie przesunięta', () => {
  const slownik = JSON.parse(fs.readFileSync(path.join(root, 'K', 'slownik-k.json'), 'utf8'));

  const dzial = slownik.dzialy.find((d) => d.id === 'k8');
  assert.ok(dzial, 'Brak wpisu k8 w slownik-k.json → dzialy');
  assert.equal(dzial.folder, '08-k8-piec-sufitow');
  assert.ok(dzial.tytulPl && dzial.tytulEn && dzial.opis);

  const ids = new Set(slownik.wyrazenia.map((w) => w.id));
  for (const p of POWROTY) assert.ok(ids.has(p.id), `Powrót „${p.id}" nie istnieje w rejestrze`);

  const powroty = slownik.wyrazenia.filter((w) => (w.review || []).includes('k8'));
  assert.ok(powroty.length <= 20, `Rejestr planuje ${powroty.length} powrotów na k8 — dział ich nie wchłonie`);
  const zaplanowane = new Set(POWROTY.filter((p) => slownik.wyrazenia.find((w) => w.id === p.id)?.intro !== 'k8').map((p) => p.id));
  for (const w of powroty) assert.ok(zaplanowane.has(w.id), `Rejestr planuje powrót „${w.id}" na k8, a dział go nie realizuje`);

  const intro = slownik.wyrazenia.filter((w) => w.intro === 'k8');
  assert.ok(intro.length >= 20, `Tylko ${intro.length} wyrażeń z intro k8`);
  for (const w of intro) {
    assert.ok(Array.isArray(w.review) && w.review.length >= 1 && w.review.length <= 2, `${w.id}: review ma ${w.review?.length ?? 0} pozycji — reguła K8 to 1–2 najbliższe działy`);
    assert.ok(w.en && blob.toLowerCase().includes(w.en.toLowerCase()), `${w.id}: „${w.en}" nie pada dosłownie w żadnej odpowiedzi`);
  }

  // Świadome straty (PROGRAM-K, sekcja K8) — nie mogą zmartwychwstać przy kolejnym dziale.
  const skasowane = ['i-guess-so', 'involved-in', 'linked-to', 'including-lista', 'lead-sb-to-do', 'result-in', 'its-said-that', 'claiming-that', 'supposed-adj', 'ease-restrictions', 'get-fined-for', 'taped-off', 'the-elderly', 'of-your-own-free-will', 'on-your-own-terms', 'second-conditional'];
  assert.deepEqual(skasowane.filter((id) => ids.has(id)), []);

  // Reguła horyzontu: dla wpisów sprzed K7 przyszłe powroty sięgają najwyżej k9.
  const numer = (k) => Number(k.replace(/^k/, ''));
  for (const w of slownik.wyrazenia) {
    if (numer(w.intro) <= 6) {
      const zaDaleko = (w.review || []).filter((k) => numer(k) > 9);
      assert.deepEqual(zaDaleko, [], `${w.id}: rejestr znowu planuje w nieskończoność (${zaDaleko.join(', ')})`);
    }
  }
});
