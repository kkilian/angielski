import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const chapterPath = path.join(root, 'K', '02-k2-kintsugi', 'rozdzial.md');
const chapter = fs.readFileSync(chapterPath, 'utf8');
const audioContent = chapter.split('\n## Nowe słowa i struktury')[0];

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

function countEnglishWords(text) {
  return text.split(/\s+/).filter((token) => /[A-Za-z0-9]/.test(token)).length;
}

test('K2 actively drills every vocabulary item highlighted in the worksheet', () => {
  const requiredWords = ['shatter', 'crude', 'aesthetic', 'transience', 'resilience'];

  for (const word of requiredWords) {
    assert.match(audioContent, new RegExp(`\\b${word}\\b`, 'i'), `${word} is missing from the audio groups`);

    const pattern = word === 'shatter'
      ? /\bshatter(?:s|ed|ing)?\b/gi
      : new RegExp(`\\b${word}\\b`, 'gi');
    const count = audioContent.match(pattern)?.length ?? 0;
    assert.ok(count >= 5, `${word} appears only ${count} times in the audio groups`);
  }
});

test('K2 mock conversation starts with all seven worksheet questions in order', () => {
  const expectedQuestions = [
    'What is Kintsugi, and how did a disappointed Japanese military leader accidentally help create it in the 15th century?',
    'How does the philosophy of *Wabi-Sabi* differ from modern western ideas about perfection and buying new things?',
    'Why do modern psychologists use Kintsugi as a metaphor for human emotions and mental resilience?',
    'In your opinion, why are people often tempted to hide their personal mistakes, scars, or failures from others?',
    'Do you agree or disagree with the saying: "Perfectionism is a barrier to real happiness"? Explain why.',
    'In modern society, we often throw away broken items immediately. How can adopting a Kintsugi mindset change our relationship with material possessions and environmental waste?',
    'Can a person’s past mistakes or difficult experiences actually make them a more valuable friend, colleague, or leader? Why or why not?',
  ];

  const groupFive = groups.find((group) => group.number === 5);
  assert.ok(groupFive, 'Group 5 is missing');
  assert.match(groupFive.body, /<!-- mode: scenka -->/);
  assert.equal(groupFive.rows.length, 10);
  assert.deepEqual(groupFive.rows.slice(0, 7).map((row) => row[0]), expectedQuestions);
});

test('K2 groups open with short sentences and Group 1 stays easy to repeat', () => {
  for (const group of groups.filter((g) => g.number <= 4)) {
    group.rows.slice(0, 3).forEach((cells, index) => {
      const words = countEnglishWords(cells[1]);
      assert.ok(
        words <= 9,
        `Group ${group.number} row ${index + 1} opens with ${words} words: "${cells[1]}"`,
      );
    });
  }

  const groupOne = groups.find((group) => group.number === 1);
  assert.ok(groupOne, 'Group 1 is missing');
  for (const cells of groupOne.rows) {
    const words = countEnglishWords(cells[1]);
    assert.ok(words <= 12, `Group 1 row has ${words} words: "${cells[1]}"`);
  }
});

test('K2 rotates target words instead of massing them', () => {
  const targetPatterns = [
    /\bshatter(?:s|ed|ing)?\b/i,
    /\bcrude\b/i,
    /\baesthetic\b/i,
    /\btransience\b/i,
    /\bresilience\b/i,
  ];

  for (const group of groups.filter((g) => g.number <= 4)) {
    for (const pattern of targetPatterns) {
      let run = 0;
      let longestRun = 0;
      for (const cells of group.rows) {
        run = pattern.test(cells[1]) ? run + 1 : 0;
        longestRun = Math.max(longestRun, run);
      }
      assert.ok(
        longestRun <= 3,
        `Group ${group.number}: ${pattern} appears in ${longestRun} consecutive rows`,
      );
    }
  }
});

test('K2 keeps the five-group audio contract and 10–18 rows per group', () => {
  assert.deepEqual(groups.map((group) => group.number), [1, 2, 3, 4, 5]);

  for (const group of groups) {
    assert.ok(
      group.rows.length >= 10 && group.rows.length <= 18,
      `Group ${group.number} has ${group.rows.length} data rows`,
    );
  }
});
