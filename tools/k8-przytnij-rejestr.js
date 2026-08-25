// Jednorazowa operacja na K/slownik-k.json przy budowie K8 (2026-08-24).
//
// PROGRAM-K.md („Dalszy rozwój" po K7): poczekalnię k8 trzeba PRZYCIĄĆ, nie przesunąć
// dalej. Stan wejściowy: 21 wpisów `intro: k8`, 60 powrotów `review→k8`, horyzont do k26.
// Trzy stosy, deterministycznie, z raportem — dry-run domyślny, zapis po `--wykonaj`.
//
// Uruchom: node tools/k8-przytnij-rejestr.js [--wykonaj]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const plik = path.join(root, 'K', 'slownik-k.json');
const wykonaj = process.argv.includes('--wykonaj');

const slownik = JSON.parse(fs.readFileSync(plik, 'utf8'));
const numer = (k) => Number(String(k).replace(/^k/, ''));

// 1. Świadome straty: wpisy intro:k8 bez miejsca w pięciu sufitach.
const USUN_INTRO_K8 = [
  'i-guess-so', // furtka „Chyba tak" → I guess so — K6 uczyło ją omijać
  'involved-in', 'linked-to', 'including-lista', 'lead-sb-to-do', 'result-in',
  'its-said-that', 'claiming-that', 'supposed-adj', // klocki strukturalne z działu o masonach
  'ease-restrictions', 'get-fined-for', 'taped-off', 'the-elderly',
  'of-your-own-free-will', 'on-your-own-terms', // leksyka lockdownu z lekcji 08-17
  'second-conditional', // G5 poszła w must have / 3rd cond; 2nd cond zostaje w K7 G1
];

// 2. Zostają z poczekalni (odświeżone przykłady = fraza z odpowiedzi K8).
const ODSWIEZ_INTRO_K8 = {
  'another-person': { pl: 'z drugą osobą (an + other = another)', en: 'a shared room with another person', review: ['k9', 'k10'] },
  'there-were-no': { pl: 'nie było zasłon / ludzi (liczbę dyktuje rzeczownik)', en: 'there were no curtains', review: ['k9', 'k10'] },
  'might-have-been-doing': { pl: 'mogli (wtedy) coś robić — przypuszczenie o przeszłości ciągłej', en: 'they might have been smoking', review: ['k9', 'k10'] },
  'not-sure-how-to-put-it': { pl: 'nie wiem, jak to ująć (wiązka ratunkowa)', en: "I'm not sure how to put it", review: ['k9', 'k10'] },
  'honestly': { pl: 'szczerze mówiąc', en: 'Honestly, the principal', review: ['k9', 'k10'] },
};

// 3. Powroty na k8, które dział REALNIE robi (kontrakt: POWROTY w tools/k8-content.test.mjs).
//    `let-it-go` (intro k6) nie miał k8 w planie, a K8 go realizuje (G2/w8) — dostaje k8,
//    bo to zapis faktu, nie przesunięcie długu.
const ZOSTAJE_REVIEW_K8 = new Set([
  'articles-system', 'must-have', 'couldnt-have', 'blanking-on-word', 'sort-of-like',
  'commute', 'if-i-had-to-guess', 'no-one-really-knows', 'let-it-go',
]);

// 4. Nowe wpisy K8 — `en` to DOSŁOWNA fraza z kolumny odpowiedzi (KLOCKI w k8-do-anki.js
//    i check-recykling.js dopasowują dosłownie; przykłady z wielokropkami się nie łapią).
const NOWE_K8 = [
  // G1 — rodzajniki w pięciu ramach
  { id: 'a-bit-of-a-rush', pl: 'trochę się spieszę', en: 'a bit of a rush', typ: 'kolokacja' },
  { id: 'it-was-a-frame', pl: 'to był (jakiś) tydzień / koszmar — „it was a X"', en: 'It was a standard week', typ: 'gramatyka' },
  { id: 'the-same-as-an', pl: 'tyle samo co mieszkanie (an przed samogłoską)', en: 'the same as an apartment', typ: 'gramatyka' },
  { id: 'n-minute-x', pl: 'piętnastominutowy spacer (a + liczba-minute + rzeczownik)', en: 'a fifteen-minute walk', typ: 'gramatyka' },
  { id: 'make-a-mess', pl: 'robić bałagan', en: 'make a mess', typ: 'kolokacja' },
  // G2 — słowo codzienne zamiast apelu do lektora
  { id: 'principal', pl: 'dyrektor(ka) szkoły', en: 'The principal', typ: 'słowo' },
  { id: 'janitor', pl: 'woźny', en: 'The janitor', typ: 'słowo' },
  { id: 'elementary-school', pl: 'podstawówka', en: 'elementary school', typ: 'słowo' },
  { id: 'dorm', pl: 'akademik (NIE academic)', en: 'the dorm', typ: 'słowo' },
  { id: 'feature-app', pl: 'funkcja aplikacji', en: 'The best feature of Anki', typ: 'słowo' },
  { id: 'em-dash', pl: 'długi myślnik', en: 'An em dash', typ: 'słowo' },
  { id: 'dead-giveaway', pl: 'pewny znak, że…', en: 'a dead giveaway', typ: 'fraza' },
  { id: 'take-advantage-of', pl: 'skorzystać z okazji', en: 'took advantage of the opportunity', typ: 'kolokacja' },
  { id: 'could-only-get-better', pl: 'od tego momentu mogło być już tylko lepiej', en: 'it could only get better', typ: 'fraza' },
  // G3 — rejestr ocen
  // (po recenzji B z 2026-08-24: grim / squalid / a shambles → nasty / filthy / in rough shape /
  //  depressing / brutal — słownikowe i BrE wyleciały; zapis poniżej odzwierciedla stan KOŃCOWY)
  { id: 'nasty', pl: 'paskudny (łazienka, jedzenie)', en: 'nasty', typ: 'słowo' },
  { id: 'filthy', pl: 'zasyfiony, brudny jak chlew', en: 'filthy', typ: 'słowo' },
  { id: 'run-down', pl: 'zapuszczony (budynek)', en: 'run-down', typ: 'słowo' },
  { id: 'in-rough-shape', pl: 'w opłakanym stanie', en: 'in rough shape', typ: 'fraza' },
  { id: 'depressing', pl: 'przygnębiający (miejsce)', en: 'depressing', typ: 'słowo' },
  { id: 'brutal-commute', pl: 'brutalny, morderczy (dojazd)', en: 'the commute is brutal', typ: 'kolokacja' },
  { id: 'a-disgrace', pl: 'kompromitacja', en: 'a disgrace', typ: 'fraza' },
  { id: 'decent', pl: 'przyzwoity', en: 'pretty decent', typ: 'słowo' },
  { id: 'upscale', pl: 'z wyższej półki', en: 'upscale', typ: 'słowo' },
  { id: 'well-kept', pl: 'zadbany', en: 'well kept', typ: 'kolokacja' },
  { id: 'pricey', pl: 'drogawy', en: 'pricey', typ: 'słowo' },
  { id: 'grew-on-me', pl: 'z czasem to polubiłem', en: 'it grew on me', typ: 'fraza' },
  // G4 — przyimki i kolokacje
  { id: 'on-tv', pl: 'w telewizji (on, nie in)', en: 'on TV', typ: 'gramatyka' },
  { id: 'at-universities', pl: 'na uczelniach (at, nie on)', en: 'at some universities', typ: 'gramatyka' },
  { id: 'in-a-pan', pl: 'na patelni (in a pan)', en: 'in a pan', typ: 'gramatyka' },
  { id: 'use-it-for', pl: 'używać czegoś do (for, nie to)', en: 'using it for', typ: 'gramatyka' },
  { id: 'generate-for-me', pl: 'generuje mi (bez celownika: … for me)', en: 'the sentences for me', typ: 'gramatyka' },
  { id: 'let-me-take-the-exam', pl: 'pozwolili mi przystąpić do egzaminu', en: 'let me take the exam', typ: 'kolokacja' },
  { id: 'these-days', pl: 'w dzisiejszych czasach (bez in)', en: 'These days', typ: 'fraza' },
  { id: 'get-into-school', pl: 'dostać się do (szkoły, na uczelnię)', en: 'get into the best high school', typ: 'kolokacja' },
  // G5 — strefa irrealis
  { id: 'must-have-been', pl: 'musiał być (wniosek o przeszłości)', en: 'must have been a bot', typ: 'gramatyka' },
  { id: 'there-must-have-been', pl: 'musiał być jakiś powód', en: 'There must have been a reason', typ: 'gramatyka' },
  { id: 'couldnt-have-been-worse', pl: 'gorzej być nie mogło', en: "it couldn't have been worse", typ: 'gramatyka' },
  { id: 'otherwise-hed', pl: 'inaczej by… (otherwise + would)', en: "otherwise he'd be here", typ: 'gramatyka' },
  { id: 'would-have-moved-out', pl: 'wyprowadziłbym się (3rd cond, kotwica czasowa)', en: 'I would have moved out after a week', typ: 'gramatyka' },
];

const DZIAL_K8 = {
  id: 'k8',
  folder: '08-k8-piec-sufitow',
  tytulPl: 'Pięć sufitów',
  tytulEn: 'Five Ceilings',
  opis: 'Pięć targetów z diagnozy lekcji 2026-08-24 (Top 5 po ROI, poziom B2−): rodzajniki w pięciu ramach (en-only — Twoje cytaty), słowo codzienne zamiast apelu do lektora (principal, janitor, dorm, feature, em dash), rejestr ocen zamiast terrible/nice/weird (grim, squalid, run-down, decent, upscale), przyimki kalkowane z polskiego (en-only — Twoje cytaty: in TV, on universities, on the pan) i strefa irrealis (must have / couldn\'t have been / would have). Kontekst: akademik w Katowicach, szkoła, korki, Anki.',
};

// ------------------------------------------------------------------ operacja
const raport = [];
const przed = {
  wpisow: slownik.wyrazenia.length,
  introK8: slownik.wyrazenia.filter((w) => w.intro === 'k8').length,
  reviewK8: slownik.wyrazenia.filter((w) => (w.review || []).includes('k8')).length,
};

const ids = new Set(slownik.wyrazenia.map((w) => w.id));
for (const id of USUN_INTRO_K8) {
  const w = slownik.wyrazenia.find((x) => x.id === id);
  if (!w) throw new Error(`Do skasowania „${id}" — nie ma go w rejestrze`);
  if (w.intro !== 'k8') throw new Error(`„${id}" ma intro ${w.intro}, nie k8 — nie kasuję cudzego działu`);
}
for (const id of Object.keys(ODSWIEZ_INTRO_K8)) {
  if (!ids.has(id)) throw new Error(`Do odświeżenia „${id}" — nie ma go w rejestrze`);
}
for (const n of NOWE_K8) {
  if (ids.has(n.id)) throw new Error(`Nowy wpis „${n.id}" już istnieje`);
}

let wyrazenia = slownik.wyrazenia.filter((w) => !USUN_INTRO_K8.includes(w.id));
raport.push(`skasowane intro:k8 → ${USUN_INTRO_K8.length}: ${USUN_INTRO_K8.join(', ')}`);

let wycieteK8 = [];
wyrazenia = wyrazenia.map((w) => {
  const review = w.review || [];
  const przeszle = review.filter((k) => numer(k) <= 7);
  let przyszle;
  if (numer(w.intro) <= 6) {
    // Wpisy sprzed K7: k8 tylko gdy dział go realizuje, potem k9 — najwyżej dwa najbliższe.
    const chceK8 = review.includes('k8');
    const zostajeK8 = ZOSTAJE_REVIEW_K8.has(w.id);
    if (chceK8 && !zostajeK8) wycieteK8.push(w.id);
    przyszle = [...(zostajeK8 ? ['k8'] : []), ...review.filter((k) => k === 'k9')].slice(0, 2);
  } else if (w.id in ODSWIEZ_INTRO_K8) {
    const o = ODSWIEZ_INTRO_K8[w.id];
    return { ...w, pl: o.pl, en: o.en, review: o.review };
  } else {
    // intro k7: dwa najbliższe z zaplanowanych (k9/k10, k9/k11) — bez dokładania.
    przyszle = review.filter((k) => numer(k) >= 8).slice(0, 2);
  }
  return { ...w, review: [...przeszle, ...przyszle] };
});
raport.push(`powroty na k8 wycięte bez zastępnika → ${wycieteK8.length}: ${wycieteK8.join(', ')}`);

wyrazenia.push(...NOWE_K8.map((n) => ({ ...n, intro: 'k8', review: ['k9', 'k10'] })));
raport.push(`nowe intro:k8 → ${NOWE_K8.length}`);

const dzialy = slownik.dzialy.some((d) => d.id === 'k8')
  ? slownik.dzialy.map((d) => (d.id === 'k8' ? DZIAL_K8 : d))
  : [...slownik.dzialy, DZIAL_K8];

const po = {
  wpisow: wyrazenia.length,
  introK8: wyrazenia.filter((w) => w.intro === 'k8').length,
  reviewK8: wyrazenia.filter((w) => (w.review || []).includes('k8')).length,
};
const horyzont = {};
for (const w of wyrazenia) for (const k of w.review || []) if (numer(k) >= 9) horyzont[k] = (horyzont[k] || 0) + 1;

console.log(`Rejestr PRZED: ${przed.wpisow} wpisów, intro:k8 ${przed.introK8}, review→k8 ${przed.reviewK8}`);
for (const linia of raport) console.log('  •', linia);
console.log(`Rejestr PO:    ${po.wpisow} wpisów, intro:k8 ${po.introK8}, review→k8 ${po.reviewK8}`);
console.log('  horyzont powrotów:', Object.entries(horyzont).sort((a, b) => numer(a[0]) - numer(b[0])).map(([k, n]) => `${k}=${n}`).join(' '));

if (po.reviewK8 > 20) throw new Error(`review→k8 = ${po.reviewK8} > 20`);
if (po.introK8 < 20) throw new Error(`intro:k8 = ${po.introK8} < 20`);

if (!wykonaj) {
  console.log('\nDry-run. Zapis: node tools/k8-przytnij-rejestr.js --wykonaj');
} else {
  const wynik = { ...slownik, wersja: '2026-08-24', dzialy, wyrazenia };
  fs.writeFileSync(plik, `${JSON.stringify(wynik, null, 2)}\n`);
  console.log(`\nZapisano ${plik}`);
}
