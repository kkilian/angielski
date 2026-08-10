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

// Wszystkie grupy pl2en — zero scenek.
function englishCell(cells) {
  return cells[1];
}

function englishLines(group) {
  return group.rows.map((cells) => englishCell(cells));
}

function countEnglishWords(text) {
  return text.split(/\s+/).filter((token) => /[A-Za-z0-9]/.test(token)).length;
}

// 11 targetów z transkryptu (w kolejności ROI) — lista do weryfikacji wystąpień.
const TARGETS = [
  { name: 'resent', pattern: /\bresent(?:s|ed|ment|ful)\b/i },
  { name: 'biased against', pattern: /\bbiased against\b/i },
  { name: 'echo chamber', pattern: /\becho chambers?\b/i },
  { name: 'reinforce', pattern: /\breinforc(?:e|es|ed|ing)\b/i },
  { name: 'feedback loop', pattern: /\bfeedback loop/i },
  { name: 'distorted view', pattern: /\bdistorted view\b/i },
  { name: 'bitterness', pattern: /\bbitterness\b/i },
  { name: 'determined by / determine', pattern: /\bdetermine(?:s\b|d by\b|\b)/i },
  { name: 'categorize', pattern: /\bcategoriz(?:e|es|ed|ing)\b/i },
  { name: 'hierarchy', pattern: /\bhierarchy\b/i },
  { name: 'attribution openings', pattern: /\baccording to the (?:article|text)\b|\bthe (?:text|article) (?:argues|says|explains)\b|\bin their view\b|\bto be clear, i'?m not defending them\b|\bextreme cases\b/i },
];

const allEnglish = groups.flatMap((group) => englishLines(group));

// ─── Kontrakt ────────────────────────────────────────────────

test('K4 ma 5 grup po 10–18 wierszy; wszystkie pl2en', () => {
  assert.deepEqual(
    groups.map((group) => group.number),
    [1, 2, 3, 4, 5],
  );

  for (const group of groups) {
    assert.ok(
      group.rows.length >= 10 && group.rows.length <= 18,
      `Grupa ${group.number} ma ${group.rows.length} wierszy danych`,
    );
    // Zero scenek — sprawdź, czy nie ma trybu scenka i czy to na pewno pl2en.
    assert.ok(
      !group.body.includes('mode: scenka'),
      `Grupa ${group.number} ma marker scenki — ma być tylko pl2en`,
    );
  }
});

test('K4 dryluje każdy z 11 targetów co najmniej 5 razy w EN', () => {
  for (const target of TARGETS) {
    const count = allEnglish.filter((line) => target.pattern.test(line)).length;
    assert.ok(count >= 5, `${target.name} pada tylko ${count} razy w angielskiej kolumnie`);
  }
});

test('K4 otwiera grupy krótkimi zdaniami, a Grupa 1 nie przekracza 12 słów EN', () => {
  for (const group of groups) {
    const firstLine = englishLines(group)[0];
    const words = countEnglishWords(firstLine);
    assert.ok(
      words <= 8,
      `Grupa ${group.number} otwiera się ${words} słowami: "${firstLine}"`,
    );
  }

  const groupOne = groups.find((group) => group.number === 1);
  assert.ok(groupOne, 'Brakuje Grupy 1');
  for (const cells of groupOne.rows) {
    const words = countEnglishWords(cells[1]);
    assert.ok(words <= 12, `Wiersz Grupy 1 ma ${words} słów: "${cells[1]}"`);
  }
});

test('K4 rotuje targety: zasiew do 6 wierszy pod rząd, potem przeplot', () => {
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
        longestRun <= 6,
        `Grupa ${group.number}: ${target.name} pada w ${longestRun} kolejnych wierszach (dopuszczalne 6)`,
      );
    }
  }
});

test('K4 ma zasiew: co najmniej jeden target pada w 5–6 kolejnych wierszach', () => {
  // Nowa reguła K: zasiew wydłużony do 5–6 pod rząd.
  // Sprawdzamy, czy przynajmniej jeden target w całym rozdziale ma serię ≥5.
  let foundSeed = false;
  for (const group of groups) {
    const lines = englishLines(group);
    for (const target of TARGETS) {
      let run = 0;
      for (const line of lines) {
        run = target.pattern.test(line) ? run + 1 : 0;
        if (run >= 5) { foundSeed = true; break; }
      }
      if (foundSeed) break;
    }
    if (foundSeed) break;
  }
  assert.ok(foundSeed, 'Żaden target nie ma zasiewu ≥5 — reguła K wymaga 5–6 pod rząd');
});

test('K4 nie wpuszcza do audio kalek z transkryptu', () => {
  const kalki = [
    'biased towards men',
    'biased toward men',
    'eco chamber',
    'eco-chamber',
    'resentfulness',
    'compartmentaliz',
    'deterministic',
    'crooked image',
    'crooked view',
    'bitterness with',
    'creates feedback loop',
    "there's positive aspect",
    'radicalize content',
    'a darker corner of it',
    'at the top of the ladder',
    'move up that hierarchy',
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

test('K4 nigdy nie głosi ideologii — każdy claim ma atrybucję', () => {
  const claims = [
    /determine your worth/i,
    /genetics determine everything/i,
    /looks determine everything/i,
    /society is biased against men/i,
    /can't move up/i,
    /genetics determine your fate/i,
    /your place is determined by looks/i,
    /(?:worth|success|fate|everything) (?:is|are) determined by/i,
  ];

  const attribution =
    /\baccording to\b|\bin their view\b|\bthe (?:text|article|author|(?:first|second|third|fourth|fifth|sixth)\s+paragraph)\b|\bthey (?:argue|think|believe|claim|convince|call|categorize|say)\b|\bit argues\b|\bthey feel\b/i;

  // Zdania, w których Krzysiek dystansuje się od claimu — nie potrzebują atrybucji.
  const speakerDistancing = /\bi don'?t (?:believe|think|agree)\b|\bi'?m not saying\b|\bnot me\b/i;

  for (const line of allEnglish) {
    for (const claim of claims) {
      if (!claim.test(line)) continue;
      if (speakerDistancing.test(line)) continue;
      assert.ok(
        attribution.test(line),
        `Claim ideologii bez atrybucji: "${line}"`,
      );
    }
  }
});

test('K4 daje gotowe otwarcia streszczenia dla każdego z sześciu akapitów', () => {
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

test('K4 dryluje język dystansu i poprawione rodzajniki', () => {
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
    { name: 'at the top of the hierarchy', pattern: /at the top of the hierarchy/i },
    { name: 'categorize people into rigid', pattern: /categorize people into rigid/i },
  ];

  for (const wymagane of musiBycWAudio) {
    assert.ok(
      allEnglish.some((line) => wymagane.pattern.test(line)),
      `Brakuje w audio: ${wymagane.name}`,
    );
  }
});

test('K4 NIE zawiera żadnego z 11 pytań Exercise 2/3 arkusza', () => {
  // Pytania arkusza celowo pominięte — trenuje je czwartkowa lekcja z tutorem.
  const exerciseQuestions = [
    'What is the main difference',
    'How does the "Black Pill" ideology',
    'What pseudo-scientific hierarchy',
    'What real-world violent events',
    'In what ways do social media recommendation algorithms',
    'Why is it difficult for governments',
    'Do you agree or disagree',
    'How can societies better address',
    'What steps should be taken in schools',
    'Is online content moderation effective',
    'How can friends and family members recognize',
  ];

  const fullChapter = chapter.toLowerCase();
  for (const q of exerciseQuestions) {
    assert.ok(
      !fullChapter.includes(q.toLowerCase()),
      `Pytanie arkusza trafiło do rozdziału: "${q}"`,
    );
  }
});
