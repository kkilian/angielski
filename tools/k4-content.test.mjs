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

// pl2en:  | polski | angielski |                  → angielski w kolumnie 2
// scenka: | pytanie (EN) | podpowiedź (PL) | odpowiedź (EN) | → angielski w kolumnie 3
// Bez tego rozróżnienia asercje o angielskim czytałyby polską podpowiedź scenki.
function englishCell(cells, scenka) {
  return scenka ? cells[2] : cells[1];
}

function englishLines(group) {
  return group.rows.map((cells) => englishCell(cells, group.scenka));
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

// Dwie scenki w dziale: G6 prowadzi lekcję, G9 odpowiada na pytania lektora.
const SCENKI = new Set([6, 9]);

test('K4 ma 9 grup po 10–18 wierszy: dryl pl2en, scenki w G6 i G9', () => {
  assert.deepEqual(
    groups.map((group) => group.number),
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
  );

  for (const group of groups) {
    assert.ok(
      group.rows.length >= 10 && group.rows.length <= 18,
      `Grupa ${group.number} ma ${group.rows.length} wierszy danych`,
    );
    // Format grupy jest chroniony w obie strony: dryl nie może się zamienić
    // w scenkę, a scenka nie może przestać być rozmową.
    const powinnaBycScenka = SCENKI.has(group.number);
    assert.equal(
      group.scenka,
      powinnaBycScenka,
      powinnaBycScenka
        ? `Grupa ${group.number} musi mieć marker <!-- mode: scenka -->`
        : `Grupa ${group.number} ma marker scenki — ma być pl2en`,
    );
    // Scenka musi mieć komplet trzech kolumn, inaczej audio nie ma czego czytać.
    if (group.scenka) {
      for (const cells of group.rows) {
        assert.equal(cells.length, 3, `Wiersz scenki ma ${cells.length} kolumn: "${cells.join(' | ')}"`);
      }
    }
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
  for (const line of englishLines(groupOne)) {
    const words = countEnglishWords(line);
    assert.ok(words <= 12, `Wiersz Grupy 1 ma ${words} słów: "${line}"`);
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

test('K4 nie wpuszcza do audio błędów z assessmentu 2026-08-13', () => {
  // Osobno od listy `kalki` powyżej, bo tamta robi includes() na stringu, a tutaj
  // każdy błąd jest podłańcuchem swojej poprawnej wersji: 'paragraph suggest' siedzi
  // w 'paragraph suggests', 'lead into' w 'lead in to'. Potrzebne granice słowa.
  const bledy = [
    { name: 'lead into zamiast lead to', pattern: /\blead(?:s|ing)? into\b/i },
    { name: 'fixed on your looks', pattern: /\bfixed on\b/i },
    { name: 'men problems zamiast men\'s issues', pattern: /\bmen problems\b/i },
    { name: 'Incels believes', pattern: /\bincels believes\b/i },
    { name: 'paragraph suggest bez -s', pattern: /\bparagraph suggest\b/i },
    { name: 'an harmful', pattern: /\ban harmful\b/i },
    { name: 'zbędne the przy society', pattern: /\bthe society is biased\b/i },
    { name: 'zbędne the przy radicalization', pattern: /\bthe radicalization\b/i },
  ];

  for (const line of allEnglish) {
    for (const blad of bledy) {
      assert.ok(!blad.pattern.test(line), `Błąd „${blad.name}" trafił do audio: "${line}"`);
    }
  }
});

// ─── Grupy 7–9: budowa zdania ────────────────────────────────

function sentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => countEnglishWords(sentence) > 0);
}

test('K4 Grupy 7–9 trzymają zdania krótkie: max 12 słów na zdanie', () => {
  for (const group of groups.filter((g) => g.number >= 7)) {
    for (const line of englishLines(group)) {
      for (const sentence of sentences(line)) {
        const words = countEnglishWords(sentence);
        assert.ok(
          words <= 12,
          `Grupa ${group.number}: zdanie ma ${words} słów: "${sentence}"`,
        );
      }
    }
  }
});

test('K4 Grupy 7 i 9 tną myśl na dwa zdania (albo mieszczą ją w jednym krótkim)', () => {
  // Sedno assessmentu 2026-08-13: „budujesz zdanie za długo, zanim wiesz, jak je skończyć".
  // Dopuszczalne są dwa wyjścia — rozbicie na dwa zdania albo jedno zdanie tak krótkie,
  // że nie ma się gdzie zaciąć (np. „They reinforce each other's beliefs, creating an
  // echo chamber."). Zakazane jest jedno długie zdanie z doklejanymi członami.
  for (const group of groups.filter((g) => g.number === 7 || g.number === 9)) {
    for (const line of englishLines(group)) {
      const parts = sentences(line);
      const words = countEnglishWords(line);
      assert.ok(
        parts.length >= 2 || words <= 10,
        `Grupa ${group.number}: jedno zdanie na ${words} słów, a nie rozbite: "${line}"`,
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

// ─── Grupa 6: prowadzenie rozmowy ────────────────────────────

const groupSix = groups.find((group) => group.number === 6);

test('K4 Grupa 6 dryluje sześć ruchów prowadzenia rozmowy', () => {
  assert.ok(groupSix, 'Brakuje Grupy 6');
  const answers = englishLines(groupSix);

  const ruchy = [
    { name: 'prośba o powtórzenie', pattern: /\bsay that again\b/i },
    { name: 'nie dosłyszałem', pattern: /\bdidn'?t catch that\b/i },
    { name: 'przekierowanie lektora (I\'d rather you + past)', pattern: /\bi'?d rather you asked\b/i },
    { name: 'przyznanie się do zgadywania', pattern: /\bonly be guessing\b/i },
    { name: 'sądząc po nazwie', pattern: /\bgoing by the name\b/i },
    { name: 'grzeczna niezgoda', pattern: /\bi'?m pretty sure i said\b/i },
    { name: 'sterowanie tempem', pattern: /\bparagraph by paragraph\b/i },
    { name: 'prośba o poprawianie', pattern: /\bcorrect me as we go\b/i },
    { name: 'pytanie o blokadę', pattern: /\bholding me back\b/i },
  ];

  for (const ruch of ruchy) {
    assert.ok(
      answers.some((line) => ruch.pattern.test(line)),
      `Brakuje w Grupie 6: ${ruch.name}`,
    );
  }
});

test('K4 Grupa 6 nie powtarza błędów z transkryptu 2026-08-12', () => {
  assert.ok(groupSix, 'Brakuje Grupy 6');
  const bledy = [
    { name: 'liczba pojedyncza man', pattern: /\bpush (?:this )?man into\b/i },
    { name: 'liczba pojedyncza belief', pattern: /\bharmful belief\b(?!s)/i },
    { name: "I'd rather you + bezokolicznik", pattern: /\bi'?d rather you ask\b/i },
    { name: 'gołe Sorry bez prośby', pattern: /^sorry\.?$/i },
    { name: 'you have to ask me', pattern: /\byou have to ask me\b/i },
  ];

  for (const line of englishLines(groupSix)) {
    for (const blad of bledy) {
      assert.ok(!blad.pattern.test(line), `Błąd „${blad.name}" wrócił do audio: "${line}"`);
    }
  }
});

test('K4 Grupa 6 domyka dział składanką z targetami K1–K5', () => {
  assert.ok(groupSix, 'Brakuje Grupy 6');
  const ostatnieDwie = englishLines(groupSix).slice(-2);
  assert.ok(
    ostatnieDwie.some((line) => /\becho chambers?\b/i.test(line) && /\bmen\b/i.test(line)),
    'Ostatnie wiersze Grupy 6 mają streszczać dział (echo chambers + men w liczbie mnogiej)',
  );
  assert.ok(
    ostatnieDwie.some((line) => /\bbeliefs get reinforced\b/i.test(line)),
    'Ostatnie wiersze Grupy 6 mają recyklingować reinforce w stronie biernej z get',
  );
});
