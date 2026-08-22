import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const chapterPath = path.join(root, 'K', '07-k7-masoni', 'rozdzial.md');
const chapter = fs.readFileSync(chapterPath, 'utf8');

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
      .filter((cells) => !/^(polski|pytanie \(EN\))$/i.test(cells[0]));

    groups.push({
      number: Number(match[1]),
      body: match[2],
      scenka: match[2].includes('mode: scenka'),
      rows,
    });
  }

  return groups;
}

const groups = parseGroups(chapter);

// pl2en:  | polski | angielski |                              → angielski w kolumnie 2
// scenka: | pytanie (EN) | podpowiedź (PL) | odpowiedź (EN) |  → angielski w kolumnie 3
function englishCell(cells, scenka) {
  return scenka ? cells[2] : cells[1];
}

function englishLines(group) {
  return group.rows.map((cells) => englishCell(cells, group.scenka));
}

function countEnglishWords(text) {
  return text.split(/\s+/).filter((token) => /[A-Za-z0-9]/.test(token)).length;
}

const allEnglish = groups.flatMap((group) => englishLines(group));
const blob = allEnglish.join('\n');

// G6 broni map myśli w rozmowie; G8 (dodana po lekcji 2026-08-17) wymusza irrealis.
const SCENKI = new Set([6, 8]);
// Grupa 5 to RECITAL — cały monolog w dwunastu taktach, w kolejności map myśli.
// Jest wyjęta z reguły „otwarcie do 8 słów", bo o kolejności decyduje monolog,
// a nie drabinka trudności. W zamian ma własny, ostrzejszy test kolejności map.
const RECITAL = 5;

// ---------------------------------------------------------------- targety
// Osiem klocków, wszystkie wyjęte wprost z map myśli Krzyśka.
// `min` = faktyczna liczba wystąpień policzona po napisaniu rozdziału, minus zapas.
const TARGETS = [
  { name: 'T1 łańcuch przyczynowy: sparked / led … to / resulted in', min: 9, pattern: /\b(?:sparked|led (?:many )?people to|resulted in)\b/gi },
  { name: 'T2 przypuszczenie o przeszłości: may / might / must have', min: 10, pattern: /\b(?:may|might|must) have\b/gi },
  { name: 'T2b zasiew: might have been + -ing', min: 6, pattern: /\bmight have been \w+ing\b/gi },
  { name: 'T3 imiesłów zamiast which was: discussed / seen / linked / claiming', min: 7, pattern: /\b(?:discussed in|seen on|linked to|claiming that)\b/gi },
  { name: 'T4 involved in / including', min: 6, pattern: /\b(?:involved in|including)\b/gi },
  { name: 'T5 originated from / evolved into / dedicated to', min: 10, pattern: /\b(?:originated from|evolved into|dedicated to)\b/gi },
  { name: 'T6 atrybucja: It’s said that / According to / claiming / supposedly', min: 10, pattern: /\b(?:it's said that|according to|claiming that|supposedly)\b/gi },
  { name: 'T7 the + nazwa historyczna', min: 6, pattern: /\bthe (?:Declaration of Independence|French Revolution|Enlightenment|Illuminati)\b/g },
  { name: 'T8 rama psychologiczna: desire for order / comforting to / central theme / point to', min: 8, pattern: /\b(?:desire for order|comforting to|central theme in|point to)\b/gi },
  { name: 'supposed jako przymiotnik (rzekomy)', min: 4, pattern: /\bsupposed\b/gi },
];

// ------------------------------------------------------------------ kanon
// Dwadzieścia trzy zdania z czterech map myśli. To jest kontrakt tego działu:
// Krzysiek poprosił o materiał, który uczy wygłosić DOKŁADNIE jego notatki.
// `mapa` służy testowi kolejności w recitalu.
const KANON = [
  { mapa: 1, name: 'I/1 stone masons = craftsmen who built cathedrals', pattern: /stone masons were craftsmen who built cathedrals/i },
  { mapa: 1, name: 'I/2 Freemasons originated from them', pattern: /freemasons originated from them/i },
  { mapa: 1, name: 'I/3 through their work — closely connected to wealthy and powerful people', pattern: /through their work they were closely connected to wealthy and powerful people/i },
  { mapa: 1, name: 'I/4 over time they may have become well-informed and well-connected', pattern: /over time,? (?:though,? )?they may have become well-informed and well-connected/i },
  { mapa: 1, name: 'I/5 eventually the network evolved into a philosophical brotherhood', pattern: /eventually the network evolved into a philosophical brotherhood/i },
  { mapa: 1, name: 'I/6 dedicated to self-improvement and community service', pattern: /dedicated to self-improvement and community service/i },
  { mapa: 1, name: 'I/7 where people exchanged ideas and built relationships', pattern: /where people exchanged ideas and built relationships/i },
  { mapa: 2, name: 'II/1 Freemasons were involved in important political events', pattern: /freemasons were involved in important political events/i },
  { mapa: 2, name: 'II/2 several founding fathers — including GW and BF', pattern: /several founding fathers were freemasons, including george washington and benjamin franklin/i },
  { mapa: 2, name: 'II/3 Enlightenment ideas discussed in lodges influenced the Declaration', pattern: /it's said that enlightenment ideas discussed in masonic lodges later influenced the declaration of independence/i },
  { mapa: 2, name: 'II/4 as with America, we see something similar in Europe', pattern: /as with america, we see something similar in europe/i },
  { mapa: 2, name: 'II/5 major political events including the French Revolution', pattern: /(?:including the french revolution|the french revolution, for one)/i },
  { mapa: 2, name: 'II/6 some political leaders were Freemasons', pattern: /some political leaders were freemasons/i },
  { mapa: 3, name: 'III/1 Freemasonry was a very secretive organization', pattern: /freemasonry was a very secretive organization/i },
  { mapa: 3, name: 'III/2 that secrecy sparked controversy', pattern: /secrecy sparked controversy/i },
  { mapa: 3, name: 'III/3 led many people to suspect — might have been pulling political strings', pattern: /led many people to suspect that they might have been pulling political strings/i },
  { mapa: 3, name: 'III/4 resulted in Freemasonry being banned', pattern: /resulted in freemasonry being banned/i },
  { mapa: 4, name: 'IV/1 conspiracy theories show our psychological desire for order', pattern: /conspiracy theories show our psychological desire for order/i },
  { mapa: 4, name: 'IV/2 when things feel chaotic, comforting to blame a secret group', pattern: /when things feel chaotic, it's comforting to blame a secret group/i },
  { mapa: 4, name: 'IV/3 remains a central theme in some conspiracy theories', pattern: /remains a central theme in some conspiracy theories/i },
  { mapa: 4, name: 'IV/4 often linked to the Illuminati', pattern: /linked to the illuminati/i },
  { mapa: 4, name: 'IV/5 claiming that hidden elites could control a New World Order', pattern: /claiming that hidden elites could control (?:a|the) new world order/i },
  { mapa: 4, name: 'IV/6 symbols seen on buildings as supposed signs of their presence', pattern: /point to symbols (?:seen )?on buildings as supposed signs of their presence/i },
];

// Piętnaście powrotów z K1/K4/K5/K6, które faktycznie padają w K7.
// Reszta z 90 zaplanowanych w slownik-k.json została wycięta — patrz PROGRAM-K.md.
const POWROTY = [
  { id: 'articles-system', pattern: /\bthe (?:whole tradition|enlightenment|declaration|illuminati|lodges)\b/i },
  { id: 'must-have', pattern: /\bmust have\b/i },
  { id: 'embedded-question', pattern: /\bknows how much influence they had\b/i },
  { id: 'arguably', pattern: /\barguably\b/i },
  { id: 'comes-down-to', pattern: /\bcomes down to\b/i },
  { id: 'no-one-really-knows', pattern: /\bno one really knows\b/i },
  { id: 'no-hard-evidence', pattern: /\bno hard evidence\b/i },
  { id: 'apparently-supposedly', pattern: /\bsupposedly\b/i },
  { id: 'wouldnt-go-that-far', pattern: /\bwouldn't go that far\b/i },
  { id: 'not-saying-just-saying', pattern: /I'm not saying[\s\S]*I'm just saying/i },
  { id: 'according-to-the-article', pattern: /\baccording to\b/i },
  { id: 'lead-to', pattern: /\bled (?:many )?people to\b/i },
  { id: 'only-be-guessing', pattern: /\bonly be guessing\b/i },
  { id: 'id-say', pattern: /\bI'd say\b/i },
  { id: 'tnij-na-dwa', pattern: /[a-z]\. [A-Z]/ },
];

// ============================================================ struktura

test('K7 ma 8 grup po 7–14 wierszy, dryl pl2en i scenki w G6 i G8', () => {
  assert.deepEqual(groups.map((g) => g.number), [1, 2, 3, 4, 5, 6, 7, 8]);

  for (const group of groups) {
    assert.ok(
      group.rows.length >= 7 && group.rows.length <= 14,
      `Grupa ${group.number} ma ${group.rows.length} wierszy, poza zakresem 7–14`,
    );
    // Test w obie strony: dryl nie może stać się scenką ani odwrotnie.
    assert.equal(
      group.scenka,
      SCENKI.has(group.number),
      `Grupa ${group.number}: tryb nie zgadza się z SCENKI`,
    );
    for (const [index, cells] of group.rows.entries()) {
      assert.equal(
        cells.length,
        group.scenka ? 3 : 2,
        `Grupa ${group.number}, wiersz ${index + 1}: zła liczba kolumn`,
      );
    }
  }
});

test('K7 ma dokładnie 81 par', () => {
  const total = groups.reduce((sum, group) => sum + group.rows.length, 0);
  assert.equal(total, 81);
});

test('K7 ma pytanie 4/3/2 dla każdej z 8 grup', () => {
  // Pytanie do ćwiczenia płynności 4/3/2 mieszka w komentarzu `<!-- 432: … -->`
  // pod nagłówkiem grupy i wpada do k-content.json jako `pytanie432`
  // (tools/generate-k.js). NIE w audio.json — assemble-audio.js przepisuje go
  // przy każdej regeneracji i obce pole by zginęło.
  const pytania = new Map();
  let numer = null;
  for (const line of chapter.split('\n')) {
    const h = line.match(/^## Grupa (\d+)/);
    if (h) { numer = Number(h[1]); continue; }
    if (/^#{1,6} /.test(line)) { numer = null; continue; }
    const q = line.match(/^<!--\s*432:\s*(.+?)\s*-->\s*$/);
    if (q && numer != null) pytania.set(numer, q[1]);
  }
  assert.deepEqual([...pytania.keys()].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8]);
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

// ============================================================ wierność mapom

test('K7 zawiera wszystkie 23 zdania kanoniczne z map myśli', () => {
  // NAJWAŻNIEJSZY TEST DZIAŁU. Krzysiek poprosił o materiał, który uczy wygłosić
  // jego własne notatki — nie o ogólną umiejętność wyjaśniania. Bez tego testu
  // trzy iteracje recenzji odsuną rozdział od skanu i nikt tego nie zauważy.
  const brakujace = KANON.filter((k) => !k.pattern.test(blob)).map((k) => k.name);
  assert.deepEqual(brakujace, [], `Zdania z map, których nie ma w rozdziale:\n  ${brakujace.join('\n  ')}`);
});

test('K7 recytuje monolog w Grupie 5 w kolejności map I → II → III → IV', () => {
  const recital = groups.find((g) => g.number === RECITAL);
  const kolejnosc = englishLines(recital).map((linia) => {
    const trafienia = KANON.filter((k) => k.pattern.test(linia));
    return trafienia.length ? Math.min(...trafienia.map((k) => k.mapa)) : null;
  });

  const mapy = kolejnosc.filter((m) => m !== null);
  // Recital swiadomie uzywa wariantow mowionych tam, gdzie kanon brzmi ksiazkowo
  // (np. `ended up getting banned` zamiast `resulted in ... being banned`), wiec pokrywa
  // sie z kanonem tylko czesciowo. Pelny kanon egzekwuje test wyzej, na calym rozdziale.
  assert.ok(mapy.length >= 8, `Recital pokrywa tylko ${mapy.length} taktów kanonu`);
  assert.deepEqual([...new Set(mapy)], [1, 2, 3, 4], 'Recital musi przejść przez wszystkie cztery mapy, w kolejności');
  for (let i = 1; i < mapy.length; i += 1) {
    assert.ok(mapy[i] >= mapy[i - 1], `Recital cofa się z mapy ${mapy[i - 1]} do ${mapy[i]} w takcie ${i + 1}`);
  }
});

test('K7 nie kopiuje drylu do recitalu — żadne zdanie angielskie nie powtarza się', () => {
  // Recital ma dokładać KLEJ NARRACYJNY (So… / Now… / Take America, for example /
  // Here's the thing, though / Even today…), którego mapy myśli nie mają.
  // Kopiuj-wklej z G1–G4 oznacza, że kleju nie ma.
  const norm = (t) => t.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  const widziane = new Map();
  const duplikaty = [];
  for (const linia of allEnglish) {
    const klucz = norm(linia);
    if (widziane.has(klucz)) duplikaty.push(linia);
    else widziane.set(klucz, true);
  }
  assert.deepEqual(duplikaty, []);
});

// ============================================================ dryl

test('K7 dryluje każdy target co najmniej tyle razy, ile zakłada zasiew', () => {
  for (const target of TARGETS) {
    const trafienia = (blob.match(target.pattern) || []).length;
    assert.ok(trafienia >= target.min, `${target.name}: ${trafienia} wystąpień, wymagane ${target.min}`);
  }
});

test('K7 otwiera każdą grupę drylową zdaniem do 8 słów EN', () => {
  for (const group of groups) {
    // Scenka otwiera się pytaniem lektora, recital pierwszym taktem monologu —
    // w obu wypadkach o pierwszym wierszu decyduje rozmowa, nie drabinka trudności.
    if (group.scenka || group.number === RECITAL) continue;
    const slowa = countEnglishWords(englishLines(group)[0]);
    assert.ok(slowa <= 8, `Grupa ${group.number} otwiera się zdaniem na ${slowa} słów`);
  }
});

test('K7 trzyma najdłuższe zdanie na końcu grupy i w limicie długości', () => {
  for (const group of groups) {
    const dlugosci = englishLines(group).map(countEnglishWords);
    const najdluzsze = Math.max(...dlugosci);
    // Dryl: zdanie do powtórzenia na głos. Scenka i recital: wzorzec wypowiedzi,
    // z natury dwuzdaniowy — stąd wyższy limit.
    const limit = group.scenka ? 38 : group.number === RECITAL ? 32 : 25;
    assert.ok(najdluzsze <= limit, `Grupa ${group.number}: najdłuższe zdanie ma ${najdluzsze} słów, limit ${limit}`);

    const prog = Math.ceil((group.rows.length * 2) / 3);
    assert.ok(
      dlugosci.indexOf(najdluzsze) + 1 > prog,
      `Grupa ${group.number}: najdłuższe zdanie stoi w wierszu ${dlugosci.indexOf(najdluzsze) + 1}, a powinno w ostatniej 1/3`,
    );
  }
});

test('K7 zasiewa Grupę 3 pięcioma kolejnymi wierszami z „might have been + -ing"', () => {
  const g3 = englishLines(groups.find((g) => g.number === 3));
  const zasiew = g3.slice(0, 5).every((linia) => /\bmight have been \w+ing\b/i.test(linia));
  assert.ok(zasiew, 'Pierwsze pięć wierszy Grupy 3 musi zasiewać might have been + -ing');
  // …a potem rotacja: dalsze wiersze wprowadzają łańcuch przyczynowy.
  assert.ok(g3.slice(5).some((l) => /\bsparked\b/i.test(l)), 'Po zasiewie brakuje rotacji na sparked');
});

// ============================================== lekcja na żywo 2026-08-17
// Grupy 7–8 nie pochodzą z map myśli, tylko z transkrypcji lekcji, która odbyła
// się cztery godziny po zbudowaniu działu. Targety = to, czego Krzysiek szukał
// na żywo i nie znalazł; czarna lista = to, co powiedział zamiast tego.
// Tablica jest OSOBNA od TARGETS, żeby reguła „scenka nie podaje targetu
// w pytaniu" nie objęła klocków, które G8 celowo recyklinguje w pytaniach.

const TARGETY_LEKCJA = [
  { name: 'L1 the authorities (szukane 2×, 24:32–26:09)', min: 3, pattern: /\bthe authorities\b/gi },
  { name: 'L2 ease / loosen the restrictions (49:13)', min: 2, pattern: /\b(?:eased?|loosen(?:ed)?) the restrictions\b/gi },
  { name: 'L3 get fined for (49:23)', min: 2, pattern: /\bget(?:ting)? fined for\b/gi },
  { name: 'L4 taped off (49:39)', min: 1, pattern: /\btaped off\b/gi },
  { name: 'L5 turn X into Y (53:09)', min: 2, pattern: /\bturn(?:ed|s|ing)?\b[^.|]{0,40}?\binto\b/gi },
  { name: 'L6 the elderly (47:48)', min: 1, pattern: /\bthe elderly\b/gi },
  { name: 'L7 give up / quit, nie „resign" (54:52)', min: 2, pattern: /\bg(?:a|i)ve (?:it |something )?up\b|\bquit\b/gi },
  { name: 'L8 of one’s own free will (38:59)', min: 1, pattern: /\bof (?:your|his|her|their|my) own free will\b/gi },
  { name: 'L9 on one’s own terms (38:36)', min: 1, pattern: /\bon (?:your|his|her|their|my) own terms\b/gi },
  { name: 'L10 another person (48:06)', min: 1, pattern: /\banother person\b/gi },
  { name: 'L11 zgoda podmiotu: there were no… (47:27)', min: 2, pattern: /\bthere were no\b/gi },
];

test('K7 dryluje targety z lekcji 2026-08-17', () => {
  for (const target of TARGETY_LEKCJA) {
    const trafienia = (blob.match(target.pattern) || []).length;
    assert.ok(trafienia >= target.min, `${target.name}: ${trafienia} wystąpień, wymagane ${target.min}`);
  }
});

test('K7 nie wpuszcza do audio błędów z lekcji 2026-08-17', () => {
  // Granice słów, nie includes(): każdy błąd jest podłańcuchem swojej poprawnej
  // wersji („other person" siedzi w „another person"), więc naiwny substring
  // zablokowałby też formy poprawne.
  const bledy = [
    { nazwa: 'I resigned — o rzuceniu gry (54:52)', pattern: /\bI resigned\b/i },
    { nazwa: 'there was no people (47:27)', pattern: /\bthere was no people\b/i },
    { nazwa: 'there was special hours (47:48)', pattern: /\bthere was special hours\b/i },
    { nazwa: 'with other person (48:06)', pattern: /\bwith other person\b/i },
    { nazwa: 'restrictions went lighter / were cut off (49:13)', pattern: /\brestrictions (?:went|were cut off)\b/i },
    { nazwa: 'taped around (49:39)', pattern: /\btaped around\b/i },
    { nazwa: 'made a hospital from (53:09)', pattern: /\bmade (?:a )?hospital from\b/i },
    { nazwa: 'on your own conditions (38:39)', pattern: /\bon (?:your|his|their) own conditions\b/i },
    { nazwa: 'special hours for old people (47:48)', pattern: /\bfor old people\b/i },
  ];
  for (const linia of allEnglish) {
    for (const blad of bledy) {
      assert.ok(!blad.pattern.test(linia), `Błąd z lekcji w audio: „${blad.nazwa}" w zdaniu: ${linia}`);
    }
  }
});

test('K7 Grupa 8 wymusza irrealis w pytaniu i w odpowiedzi', () => {
  // 55 minut rozmowy o teoriach spiskowych i zero 2nd/3rd conditionali
  // w transkrypcji (grep: would have / hadn’t / if I were — 0 trafień).
  // G8 istnieje wyłącznie po to, żeby ten tryb odblokować.
  const g8 = groups.find((g) => g.number === 8);
  assert.ok(g8, 'Brak Grupy 8');
  const pytajnik = /\b(?:if|suppose|would(?:n't)?)\b/i;
  const odpowiedz = /\bwould(?:n't)?\b|'d\b/i;
  const trzeci = /\bwould(?:n't)? have \w+|\bhadn't\b|\bhad (?:never|been)\b/i;
  let trzecich = 0;
  for (const [index, cells] of g8.rows.entries()) {
    assert.match(cells[0], pytajnik, `G8, wymiana ${index + 1}: pytanie nie wymusza gdybania`);
    assert.match(cells[2], odpowiedz, `G8, wymiana ${index + 1}: odpowiedź bez would`);
    if (trzeci.test(cells[2])) trzecich += 1;
  }
  assert.ok(trzecich >= 5, `Tylko ${trzecich} odpowiedzi z 3rd conditionalem — wymagane co najmniej 5`);
});

// ============================================================ czarne listy

test('K7 nie uczy kalk przyimkowych z tego monologu', () => {
  const kalki = [
    { nazwa: 'influenced on (wpłynąć NA)', pattern: /\binfluenced? on\b/i },
    { nazwa: 'involved into', pattern: /\binvolved into\b/i },
    { nazwa: 'connected with (zamiast to)', pattern: /\bconnected with\b/i },
    { nazwa: 'linked with (zamiast to)', pattern: /\blinked with\b/i },
    { nazwa: 'desire of order', pattern: /\bdesire of order\b/i },
    { nazwa: 'dedicated for', pattern: /\bdedicated for\b/i },
    { nazwa: 'point at (zamiast point to)', pattern: /\bpoint at\b/i },
    { nazwa: 'suspect about', pattern: /\bsuspect about\b/i },
    { nazwa: 'thanks to their work (zamiast through)', pattern: /\bthanks to their work\b/i },
  ];
  const znalezione = kalki.filter((k) => k.pattern.test(blob)).map((k) => k.nazwa);
  assert.deepEqual(znalezione, []);
});

test('K7 nie uczy „result in" ze zdaniem podrzędnym ani „might be" o przeszłości', () => {
  assert.doesNotMatch(blob, /\bresult(?:s|ed)? in (?:that|the fact that)\b/i);
  assert.match(blob, /\bresulted in \w+ being \w+/i);
  // Polskie „mogli" nie ma czasu — Polak ucieknie w teraźniejszość.
  assert.doesNotMatch(blob, /\bmight be (?:pulling|running|controlling|influencing)\b/i);
  // I w drugą stronę: `maybe` + past simple zamiast might have been.
  assert.doesNotMatch(blob, /\bmaybe they (?:pulled|ran|controlled)\b/i);
});

test('K7 nie podsuwa zużytych narzędzi hedgingu ani pełnego „It is said that"', () => {
  // `I think` / `I feel like` / `probably` padły ~53 razy w transkrypcie z 2026-08-13.
  // K6 je wypalał; K7 nie może ich przywrócić.
  assert.doesNotMatch(blob, /\b(?:I think|I feel like|probably)\b/i);
  // W mowie zawsze ściągnięte — pełna forma brzmi jak czytanie z kartki.
  assert.doesNotMatch(blob, /\bIt is said that\b/);
});

test('K7 daje „the" nazwom historycznym i nie daje go tam, gdzie nie trzeba', () => {
  for (const nazwa of ['Declaration of Independence', 'French Revolution', 'Illuminati']) {
    const wszystkie = (blob.match(new RegExp(nazwa, 'gi')) || []).length;
    const zThe = (blob.match(new RegExp(`the ${nazwa}`, 'gi')) || []).length;
    assert.equal(zThe, wszystkie, `„${nazwa}" wystąpiło ${wszystkie}×, ale z „the" tylko ${zThe}×`);
  }
  // Druga strona tej samej reguły — nazwa ruchu i przymiotnikowy Enlightenment idą bez rodzajnika.
  assert.doesNotMatch(blob, /\bthe Freemasonry\b/i);
  assert.doesNotMatch(blob, /\bthe Enlightenment ideas\b/i);
  assert.match(blob, /\bEnlightenment ideas\b/);
  assert.match(blob, /\bthe Enlightenment\b/);
});

test('K7 nie głosi teorii spiskowej — każdy claim ma atrybucję', () => {
  // Strażnik przeniesiony z K4. Dział mówi O teoriach spiskowych; żadne zdanie
  // nie może ich twierdzić w imieniu Krzyśka.
  const ryzykowne = /\b(?:Illuminati|New World Order|hidden elites)\b/i;
  const atrybucja = /\b(?:claiming that|claim that|supposedly|supposed|it's said|some people|there are whole channels)\b/i;
  const bezAtrybucji = allEnglish.filter((l) => ryzykowne.test(l) && !atrybucja.test(l));
  assert.deepEqual(bezAtrybucji, []);
});

// ============================================================ scenka

test('K7 scenki nie podają targetu w pytaniu lektora', () => {
  // Wydobycie, nie echo: klocek musi paść w odpowiedzi (kolumna 3).
  // filter, nie find — od G8 scenki są dwie i reguła obowiązuje każdą z osobna.
  for (const scenka of groups.filter((g) => g.scenka)) {
    for (const [index, cells] of scenka.rows.entries()) {
      const pytanie = cells[0];
      for (const target of TARGETS) {
        const re = new RegExp(target.pattern.source, target.pattern.flags.replace('g', ''));
        assert.ok(!re.test(pytanie), `Scenka G${scenka.number}, wymiana ${index + 1}: pytanie zawiera ${target.name}`);
      }
      for (const k of KANON) {
        assert.ok(!k.pattern.test(pytanie), `Scenka G${scenka.number}, wymiana ${index + 1}: pytanie zawiera kanon ${k.name}`);
      }
    }
  }
});

test('K7 scenki sterują odpowiedzią — podpowiedź PL ma co najmniej 60 znaków', () => {
  // Próg wyższy niż w K6 (40), bo odpowiedzi są dwuzdaniowe i kanoniczne:
  // podpowiedź musi wysterować treść, a nie tylko podać jeden klocek.
  for (const scenka of groups.filter((g) => g.scenka)) {
    for (const [index, cells] of scenka.rows.entries()) {
      assert.ok(
        cells[1].length >= 60,
        `Scenka G${scenka.number}, wymiana ${index + 1}: podpowiedź PL ma ${cells[1].length} znaków`,
      );
    }
  }
});

// ============================================================ recykling

test('K7 recyklinguje wszystkie 15 zaplanowanych klocków z K1/K4/K5/K6', () => {
  const brakujace = POWROTY.filter((p) => !p.pattern.test(blob)).map((p) => p.id);
  assert.deepEqual(brakujace, []);
});

test('slownik-k.json zna dział k7 i nie planuje na niego więcej niż 20 powrotów', () => {
  const slownik = JSON.parse(fs.readFileSync(path.join(root, 'K', 'slownik-k.json'), 'utf8'));

  const dzial = slownik.dzialy.find((d) => d.id === 'k7');
  assert.ok(dzial, 'Brak wpisu k7 w slownik-k.json → dzialy');
  assert.equal(dzial.folder, '07-k7-masoni');
  assert.ok(dzial.tytulPl && dzial.tytulEn && dzial.opis);

  // Przed K7 rejestr planował 90 powrotów na jeden dział — więcej, niż 57 par jest
  // w stanie wchłonąć. PROGRAM-K.md ostrzegał, żeby to przejrzeć, a nie przesuwać dalej.
  const powroty = slownik.wyrazenia.filter((w) => (w.review || []).includes('k7')).length;
  assert.ok(powroty <= 20, `Rejestr planuje ${powroty} powrotów na k7 — dział ich nie wchłonie`);

  // Nowe klocki z map myśli muszą być w rejestrze, inaczej nigdy nie wrócą.
  const intro = slownik.wyrazenia.filter((w) => w.intro === 'k7');
  assert.ok(intro.length >= 20, `Tylko ${intro.length} wyrażeń z intro k7`);
  for (const w of intro) {
    assert.ok(Array.isArray(w.review) && w.review.length >= 1, `${w.id}: brak zaplanowanego powrotu`);
    assert.ok(w.review.length <= 3, `${w.id}: ${w.review.length} powrotów — rejestr znowu magazynuje`);
  }
});
