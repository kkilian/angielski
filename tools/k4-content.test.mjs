import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const chapterPath = path.join(root, 'K', '04-k4-manosfera', 'rozdzial.md');
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

    groups.push({ number: Number(match[1]), body: match[2], rows });
  }

  return groups;
}

const groups = parseGroups(chapter);
const SCENKI = [9, 10];
const drillGroups = groups.filter((group) => !SCENKI.includes(group.number));
const scenki = groups.filter((group) => SCENKI.includes(group.number));

// W grupach drylu angielski to kolumna 2; w scence — wzorcowa odpowiedź (kolumna 3).
function englishCell(group, cells) {
  return SCENKI.includes(group.number) ? cells[2] : cells[1];
}

function englishLines(group) {
  return group.rows.map((cells) => englishCell(group, cells));
}

function countEnglishWords(text) {
  return text.split(/\s+/).filter((token) => /[A-Za-z0-9]/.test(token)).length;
}

// Sześć słów z Exercise 1 arkusza + dziesięć słów, których Krzyśkowi zabrakło w rozmowie.
const TARGETS = [
  { name: 'incel', pattern: /\bincels?\b/i },
  { name: 'misogyny', pattern: /\bmisogyn(?:y|ist|istic)\b/i },
  { name: 'nihilistic', pattern: /\bnihilis(?:tic|m)\b/i },
  { name: 'manifesto', pattern: /\bmanifestos?\b/i },
  { name: 'radicalization', pattern: /\bradicaliz(?:ation|ed|e|es|ing)\b|\bradical\b/i },
  { name: 'counter-terrorism', pattern: /\bcounter-terrorism\b|\bterrorism\b/i },
  { name: 'resent', pattern: /\bresent(?:s|ed|ment|ful)?\b/i },
  { name: 'echo chamber', pattern: /\becho chambers?\b/i },
  { name: 'reinforce', pattern: /\breinforc(?:e|es|ed|ing)\b/i },
  { name: 'feedback loop', pattern: /\bfeedback loop\b|\bthe whole loop\b/i },
  { name: 'distorted view', pattern: /\bdistorted\b/i },
  { name: 'bitterness', pattern: /\bbitterness\b/i },
  { name: 'pointless', pattern: /\bpointless\b/i },
  { name: 'martyr', pattern: /\bmartyrs?\b/i },
  { name: 'fixed hierarchy', pattern: /\bhierarchy\b/i },
  { name: 'determined by', pattern: /\bdetermines?\b|\bdetermined by\b/i },
];

const allEnglish = groups.flatMap((group) => englishLines(group));

test('K4 trzyma kontrakt audio: 10 grup po 10–18 wierszy', () => {
  assert.deepEqual(
    groups.map((group) => group.number),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );

  for (const group of groups) {
    assert.ok(
      group.rows.length >= 10 && group.rows.length <= 18,
      `Grupa ${group.number} ma ${group.rows.length} wierszy danych`,
    );
  }
});

test('K4 dryluje każdy z szesnastu targetów co najmniej pięć razy', () => {
  for (const target of TARGETS) {
    const count = allEnglish.filter((line) => target.pattern.test(line)).length;
    assert.ok(count >= 5, `${target.name} pada tylko ${count} razy w angielskiej kolumnie`);
  }
});

test('K4 otwiera grupy krótkimi zdaniami, a Grupa 1 zostaje łatwa do powtórzenia', () => {
  for (const group of drillGroups) {
    group.rows.slice(0, 3).forEach((cells, index) => {
      const words = countEnglishWords(cells[1]);
      assert.ok(
        words <= 9,
        `Grupa ${group.number} wiersz ${index + 1} otwiera się ${words} słowami: "${cells[1]}"`,
      );
    });
  }

  const groupOne = groups.find((group) => group.number === 1);
  assert.ok(groupOne, 'Brakuje Grupy 1');
  for (const cells of groupOne.rows) {
    const words = countEnglishWords(cells[1]);
    assert.ok(words <= 12, `Wiersz Grupy 1 ma ${words} słów: "${cells[1]}"`);
  }
});

test('K4 rotuje targety zamiast je kumulować', () => {
  for (const group of groups) {
    const lines = englishLines(group);
    for (const target of TARGETS) {
      let run = 0;
      let longestRun = 0;
      for (const line of lines) {
        run = target.pattern.test(line) ? run + 1 : 0;
        longestRun = Math.max(longestRun, run);
      }
      assert.ok(
        longestRun <= 3,
        `Grupa ${group.number}: ${target.name} pada w ${longestRun} kolejnych wierszach`,
      );
    }
  }
});

test('K4 odtwarza wszystkie jedenaście pytań arkusza dosłownie i w kolejności', () => {
  const exercise2 = [
    'What is the main difference between general "Red Pill" self-help communities and the "Incel" subculture described in the text?',
    'How does the "Black Pill" ideology lead users into psychological defeatism and hopelessness?',
    'What pseudo-scientific hierarchy and internal jargon do online incel forums use to categorize society?',
    'What real-world violent events mentioned in the article led law enforcement agencies to classify extreme incel ideology as a form of terrorism?',
    'In what ways do social media recommendation algorithms accidentally funnel users searching for basic self-help into extremist content?',
    'Why is it difficult for governments to regulate toxic online forums while simultaneously protecting freedom of speech?',
  ];

  const exercise3 = [
    'Do you agree or disagree: "Tech platforms and social media companies should be held legally responsible when violent attacks are planned on their platforms"? Why or why not?',
    'How can societies better address issues of male isolation and mental health before young people fall into toxic online communities?',
    'What steps should be taken in schools or universities to educate students about digital media literacy and avoiding online radicalization?',
    'Is online content moderation effective, or does banning radical forums simply push extremist groups into secret, unmonitored parts of the internet?',
    'How can friends and family members recognize the warning signs that someone they know is becoming radicalized online?',
  ];

  const [g9, g10] = scenki;
  assert.ok(g9 && g10, 'Brakuje którejś ze scenek (Grupy 9 i 10)');
  assert.match(g9.body, /<!-- mode: scenka -->/);
  assert.match(g10.body, /<!-- mode: scenka -->/);

  // Pytania arkusza otwierają scenkę; dopytania lektora idą po nich.
  assert.deepEqual(g9.rows.slice(0, exercise2.length).map((row) => row[0]), exercise2);
  assert.deepEqual(g10.rows.slice(0, exercise3.length).map((row) => row[0]), exercise3);
});

test('K4 trzyma odpowiedzi wzorcowe krótko — max dwa zdania', () => {
  for (const group of scenki) {
    for (const cells of group.rows) {
      const answer = cells[2];
      const sentences = answer.split(/[.!?]+(?=\s|$)/).filter((part) => /[A-Za-z]/.test(part));
      assert.ok(
        sentences.length <= 2,
        `Grupa ${group.number}: odpowiedź ma ${sentences.length} zdania: "${answer}"`,
      );

      const words = countEnglishWords(answer);
      assert.ok(
        words <= 35,
        `Grupa ${group.number}: odpowiedź ma ${words} słów — miało być max 35: "${answer}"`,
      );
    }
  }
});

test('K4 nie wpuszcza do audio kalek z transkrypcji rozmowy', () => {
  const kalki = [
    'biased towards men',
    'biased toward men',
    'eco chamber',
    'resentfulness',
    'compartmentaliz',
    'deterministic',
    'crooked image',
    'crooked view',
    'bitterness with',
    'annoyance with the world',
    'creates feedback loop',
    "there's positive aspect",
    'radicalize content',
    'dwellers',
    'i want be ready',
    // Wyłapane przez recenzentów przy pierwszym przebiegu — zostają jako zabezpieczenie.
    'unreachable women',
    'identified himself as',
    'a prejudice against',
    'accelerate the problem',
    'feed the whole loop',
    'go together there',
    'treats the reason',
  ];

  for (const line of allEnglish) {
    for (const kalka of kalki) {
      assert.ok(
        !line.toLowerCase().includes(kalka.toLowerCase()),
        `Kalka "${kalka}" trafiła do audio: "${line}"`,
      );
    }
  }
});

test('K4 nigdy nie głosi ideologii — każdy jej claim ma atrybucję', () => {
  // Zdania oddające przekonania incelów/Black Pill nie mogą stać jako gołe twierdzenia:
  // to jest umiejętność, której Krzyśkowi zabrakło („it sounds like I'm defending them").
  const claims = [
    /determine your worth/i,
    /purely biological and fixed/i,
    /self-improvement is pointless/i,
    /society is biased against men/i,
    /fundamentally trapped/i,
    /genetics determine everything/i,
    /looks determine everything/i,
    /can't move up/i,
  ];

  const attribution =
    /\baccording to\b|\bin their view\b|\bthe (?:text|article|author)\b|\bthey (?:argue|think|believe|claim|convince|call|categorize)\b|\bbelievers in\b|\bthe idea is that\b|\bthat's why they\b|\bit argues\b/i;

  for (const line of allEnglish) {
    for (const claim of claims) {
      if (!claim.test(line)) continue;
      assert.ok(
        attribution.test(line),
        `Claim ideologii bez atrybucji: "${line}"`,
      );
    }
  }
});

test('K4 daje gotowe otwarcia streszczenia dla każdego z sześciu akapitów', () => {
  // Bez tych formuł streszczenie rozsypuje się tak jak w rozmowie: „The third, what, the third…".
  const openings = [
    /the first paragraph/i,
    /the second paragraph/i,
    /the third paragraph/i,
    /the fourth paragraph/i,
    /the fifth paragraph/i,
    /the sixth paragraph/i,
  ];

  for (const opening of openings) {
    assert.ok(
      allEnglish.some((line) => opening.test(line)),
      `Brakuje otwarcia dla akapitu: ${opening}`,
    );
  }
});

test('K4 dryluje język dystansu i rodzajniki, których Krzysiek gubił', () => {
  const musiBycWAudio = [
    { name: "I'm not defending them", pattern: /i'm not defending them/i },
    { name: 'These are extreme cases', pattern: /extreme cases/i },
    { name: 'a darker corner', pattern: /a darker corner/i },
    { name: 'a feedback loop', pattern: /a feedback loop/i },
    { name: 'an echo chamber', pattern: /an echo chamber/i },
    { name: 'a distorted view', pattern: /a distorted view/i },
    { name: 'an umbrella term', pattern: /an umbrella term/i },
    { name: 'biased against men', pattern: /biased against men/i },
    { name: 'bitterness toward the world', pattern: /bitterness toward the world/i },
    { name: 'blames women for', pattern: /blam(?:es|ing) women for/i },
  ];

  for (const wymagane of musiBycWAudio) {
    assert.ok(
      allEnglish.some((line) => wymagane.pattern.test(line)),
      `Brakuje w audio: ${wymagane.name}`,
    );
  }
});
