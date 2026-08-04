import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const chapterPath = path.join(root, 'K', '03-k3-jednym-zdaniem', 'rozdzial.md');
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
const SCENKA = 8;
const drillGroups = groups.filter((group) => group.number !== SCENKA);
const scenka = groups.find((group) => group.number === SCENKA);

// Kolumna angielska: w grupach dryl to kolumna 2, w scence — wzorcowa odpowiedź (kolumna 3).
function englishCell(group, cells) {
  return group.number === SCENKA ? cells[2] : cells[1];
}

function englishLines(group) {
  return group.rows.map((cells) => englishCell(group, cells));
}

function countEnglishWords(text) {
  return text.split(/\s+/).filter((token) => /[A-Za-z0-9]/.test(token)).length;
}

const TARGETS = [
  { name: 'election', pattern: /\belections?\b/i },
  { name: 'courtyard', pattern: /\bcourtyards?\b/i },
  { name: 'self-service', pattern: /\bself-service\b/i },
  { name: 'common knowledge', pattern: /\bcommon knowledge\b/i },
  { name: 'word of mouth', pattern: /\bword of mouth\b/i },
  { name: 'commute', pattern: /\bcommut(?:e|es|ed|ing)\b/i },
  { name: 'suburbs', pattern: /\bsuburbs?\b|\bsuburban\b/i },
  { name: 'toll road', pattern: /\btolls?\b/i },
  { name: 'tourist trap', pattern: /\btourist traps?\b/i },
  { name: 'homogeneous', pattern: /\bhomogeneous\b/i },
];

const allEnglish = groups.flatMap((group) => englishLines(group));

test('K3 keeps the eight-group audio contract and 10–18 rows per group', () => {
  assert.deepEqual(groups.map((group) => group.number), [1, 2, 3, 4, 5, 6, 7, 8]);

  for (const group of groups) {
    assert.ok(
      group.rows.length >= 10 && group.rows.length <= 18,
      `Grupa ${group.number} ma ${group.rows.length} wierszy danych`,
    );
  }
});

test('K3 drills each of the ten targets at least five times', () => {
  for (const target of TARGETS) {
    const count = allEnglish.filter((line) => target.pattern.test(line)).length;
    assert.ok(count >= 5, `${target.name} pada tylko ${count} razy w angielskiej kolumnie`);
  }
});

test('K3 groups open with short sentences and Group 1 stays easy to repeat', () => {
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

test('K3 rotates target words instead of massing them', () => {
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

test('K3 mock conversation replays the real questions from the lesson', () => {
  const expectedQuestions = [
    'Have you been to Japan?',
    'Is there some type of general European culture?',
    'Did you like Kraków when you were living there?',
    "What about Warsaw? What's your opinion on it?",
    'Do you have a favorite cuisine?',
    "What's your favorite thing to get at a milk bar?",
    'How do people find the good milk bars?',
    'Do you cook for yourself? What do you make on a normal day?',
    'Did you keep a lot of friends from your childhood?',
    'Kraków just lost its mayor — what happens now?',
    'Would you want to go to the US?',
  ];

  assert.ok(scenka, 'Brakuje scenki (Grupa 8)');
  assert.match(scenka.body, /<!-- mode: scenka -->/);
  assert.equal(scenka.rows.length, expectedQuestions.length);
  assert.deepEqual(scenka.rows.map((row) => row[0]), expectedQuestions);
});

test('K3 model answers stay compressed — one thought, not five sentences', () => {
  assert.ok(scenka, 'Brakuje scenki (Grupa 8)');

  for (const cells of scenka.rows) {
    const answer = cells[2];
    const sentences = answer.split(/[.!?]+(?=\s|$)/).filter((part) => /[A-Za-z]/.test(part));
    assert.ok(
      sentences.length <= 2,
      `Odpowiedź ma ${sentences.length} zdania — miały być max 2: "${answer}"`,
    );

    const words = countEnglishWords(answer);
    assert.ok(words <= 35, `Odpowiedź ma ${words} słów — miało być max 35: "${answer}"`);
  }
});

test('K3 never drills the calques Krzysiek actually said in the lesson', () => {
  const calques = [
    'on the university',
    'on the AGH',
    'twice cheaper',
    'complaining on',
    'complain on',
    'most of people',
    'there was no roads',
    'for the vacation',
    'out of mouth',
    'public knowledge',
    'go with this car',
    'go with a car',
    'mass appealing',
    'saying about',
    'two times',
    'strong winter',
    'countryside roads',
    'the last floor',
    'a healthcare',
    'there is used to',
    'to be original',
    'monthly subscription',
  ];

  for (const line of allEnglish) {
    for (const calque of calques) {
      assert.ok(
        !line.toLowerCase().includes(calque.toLowerCase()),
        `Kalka "${calque}" trafiła do audio: "${line}"`,
      );
    }
  }
});
