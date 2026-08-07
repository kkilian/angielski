// pary.js — wspólna logika odtwarzania par dla obu odtwarzaczy (app.js i k-app.js).
// Czyste funkcje: żadnego DOM-u, żadnego <audio>, żadnego fetcha. Dzięki temu
// testuje się to w node, a oba odtwarzacze nie rozjeżdżają się przy poprawkach.

export const TRYBY_PETLI = ['off', 'para', 'grupa', 'caly'];

// Kolejka to płaska lista: wyzwalacz, wzorzec, wyzwalacz, wzorzec…
// Wyzwalacze leżą na parzystych pozycjach — na tym opiera się skok po parach.
// Słuchanka nie ma par (ciągła narracja bez ciszy na produkcję) — zostaje jednym
// plikiem, a fraza na ekranie przełącza się z offsetów przy `timeupdate`.
export function budujKolejke(grupa, wersja) {
  const v = wersja ? `?v=${wersja}` : '';
  if (grupa.tryb === 'sluchanka') {
    return [{ src: grupa.src + v, rola: 'sluchanka', para: 1, zdania: grupa.zdania || [] }];
  }
  const out = [];
  for (const p of grupa.pary || []) {
    out.push({ src: p.cue.src + v, rola: 'cue', para: p.n, tekst: p.tekst });
    out.push({ src: p.wzor.src + v, rola: 'wzor', para: p.n, tekst: p.tekst });
  }
  return out;
}

// Które zdanie słuchanki leci w danej sekundzie. Ostatnie trzymamy do końca pliku.
export function zdanieDla(zdania, czas) {
  let i = 0;
  for (let k = 0; k < zdania.length; k++) if (czas >= zdania[k].t[0]) i = k;
  return i;
}

// Co zagrać po zakończeniu elementu na pozycji `poz`. null = koniec grupy
// (odtwarzacz sam decyduje: stop przy „off"/„para"/„grupa", następna grupa przy „caly").
export function nastepny(poz, dlugosc, tryb) {
  if (tryb === 'para') {
    const cel = poz % 2 === 0 ? poz + 1 : poz - 1;
    return cel < dlugosc ? cel : 0; // kolejka jednoelementowa (słuchanka) — zapętl ją
  }
  if (poz < dlugosc - 1) return poz + 1;
  if (tryb === 'grupa') return 0;
  return null;
}

export function nastepnaPara(poz, dlugosc) {
  const start = Math.floor(poz / 2) * 2 + 2;
  return start >= dlugosc ? 0 : start;
}

// Z wzorca wracamy na wyzwalacz tej samej pary; z wyzwalacza — na poprzednią parę.
export function poprzedniaPara(poz) {
  if (poz % 2 === 1) return poz - 1;
  return Math.max(0, poz - 2);
}

export function opisBlokady(element, ctx) {
  const t = element.tekst || {};
  const wyzwalacz = t.pyt || t.pl || '';
  if (element.rola === 'wzor') return { title: t.en || '', artist: wyzwalacz };
  return { title: wyzwalacz, artist: `Grupa ${ctx.grupa} · para ${element.para}/${ctx.ilePar}` };
}

export function nastepnyTryb(tryb, maPary) {
  const cykl = maPary ? TRYBY_PETLI : TRYBY_PETLI.filter((t) => t !== 'para');
  return cykl[(cykl.indexOf(tryb) + 1) % cykl.length];
}
