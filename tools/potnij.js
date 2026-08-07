// tools/potnij.js — jednorazowa migracja sklejonych grupa-N.mp3 na pary.
// Cięcie ffmpegiem bez rekompresji, ZERO wywołań TTS. Punkty cięcia biorą się
// z dopasowania wykrytych ciszy do listy, którą wygenerował assemble-audio.js.
//
// Uruchom: node tools/potnij.js K/02-k2-kintsugi [--na-sucho]

// Oczekiwana cisza `v` pasuje do wykrytej, gdy ta jest nie krótsza niż v − TOLERANCJA.
// Cisza w pliku bywa DŁUŻSZA od zamówionej (nagranie TTS ma ciszę na krawędziach),
// nigdy istotnie krótsza — stąd próg jednostronny.
const TOLERANCJA = 0.2;

export function dopasujCisze(oczekiwane, wykryte, dlugoscPliku) {
  const dopasowane = [];
  let j = 0;
  for (let i = 0; i < oczekiwane.length; i++) {
    const o = oczekiwane[i];
    let trafiony = -1;
    for (let k = j; k < wykryte.length; k++) {
      const end = wykryte[k].end == null ? dlugoscPliku : wykryte[k].end;
      if (end - wykryte[k].start >= o.sek - TOLERANCJA) { trafiony = k; break; }
    }
    if (trafiony === -1) return { ok: false, brak: o, indeks: i };
    const w = wykryte[trafiony];
    dopasowane.push({ ...o, start: w.start, end: w.end == null ? dlugoscPliku : w.end });
    j = trafiony + 1;
  }
  return { ok: true, dopasowane };
}

// Z dopasowanych ciszy robi granice plików: wyzwalacz kończy się na końcu ciszy
// o roli „en", wzorzec — na końcu ciszy o roli „koniec". Ostatni wzorzec ciągniemy
// do końca pliku, żeby cięcie nie zgubiło ogona nagrania.
export function punktyCiecia(dopasowane, dlugoscPliku) {
  const pary = [];
  let od = 0;
  let cueDo = null;
  for (const c of dopasowane) {
    if (c.rola === 'en') { cueDo = c.end; continue; }
    if (c.rola !== 'koniec') continue;
    pary.push({ cueOd: od, cueDo, wzorOd: cueDo, wzorDo: c.end });
    od = c.end;
  }
  if (pary.length) pary[pary.length - 1].wzorDo = dlugoscPliku;
  return pary;
}
