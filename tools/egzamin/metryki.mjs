// Metryki mowy z word-timestampów whisper-1. Czyste funkcje — bez I/O.
// Pauza = przerwa >= 2 s między końcem słowa a początkiem następnego.
const PROG_PAUZY_SEK = 2;

export function metryki(words, durationSek) {
  if (!words || words.length === 0) {
    return { liczbaSlow: 0, czasSek: 0, tempoNetto: 0, pauzy: [], pauzeNaMin: 0 };
  }
  const pauzy = [];
  for (let i = 1; i < words.length; i++) {
    const przerwa = words[i].start - words[i - 1].end;
    if (przerwa >= PROG_PAUZY_SEK) {
      pauzy.push({ start: r2(words[i - 1].end), dlugoscSek: r2(przerwa) });
    }
  }
  const span = words[words.length - 1].end - words[0].start;
  const czasMowieniaSek = span - pauzy.reduce((s, p) => s + p.dlugoscSek, 0);
  const tempoNetto = czasMowieniaSek > 0 ? Math.round(words.length / (czasMowieniaSek / 60)) : 0;
  const czasSek = durationSek || 0;
  const pauzeNaMin = czasSek > 0 ? Math.round(pauzy.length / (czasSek / 60)) : 0;
  return { liczbaSlow: words.length, czasSek, tempoNetto, pauzy, pauzeNaMin };
}

const r2 = x => Math.round(x * 100) / 100;
