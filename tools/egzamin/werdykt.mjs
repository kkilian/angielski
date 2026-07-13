// Werdykt egzaminu — deterministycznie z ocen sędziego. Czysta funkcja, bez I/O.
// Sędzia ocenia (okazje, kryteria 1–5), kod decyduje. Progi podawane z zewnątrz.
const KRYTERIA = [
  ['plynnosc', 'płynność'], ['zakres', 'zakres'],
  ['poprawnosc', 'poprawność'], ['spojnosc', 'spójność'],
];

export function werdykt(ocena, { rodziny, progProcent, progOsB }) {
  const powody = [];

  // Oś A — okazje i rodziny
  const okazje = ocena?.osA?.okazje || [];
  const wykorzystane = okazje.filter(o => o.wykorzystana).length;
  const procent = okazje.length ? Math.round(wykorzystane / okazje.length * 100) : 0;
  if (procent < progProcent) {
    powody.push(`Oś A: wykorzystane ${procent}% okazji (próg ${progProcent}%) — ucieczka od struktur.`);
  }
  for (const r of rodziny) {
    const poprawnie = okazje.some(o => o.rodzina === r && o.wykorzystana && o.poprawne);
    if (!poprawnie) powody.push(`Oś A: rodzina ${r} bez ani jednego poprawnego użycia.`);
  }

  // Oś B — cztery kryteria
  const oceny = {};
  for (const [klucz, nazwa] of KRYTERIA) {
    const o = Number(ocena?.osB?.[klucz]?.ocena) || 0;
    oceny[klucz] = o;
    if (o < progOsB) powody.push(`Oś B: ${nazwa} ${o}/5 (próg ${progOsB}).`);
  }

  return {
    zdane: powody.length === 0,
    powody,
    osA: { procent, wykorzystane, wszystkie: okazje.length },
    osB: oceny,
  };
}
