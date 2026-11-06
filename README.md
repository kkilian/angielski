# Rozmowa · angielski

Osobna strona z działami do rozmowy w PAŻP (od 06.11.2026). Jeden dział = jedna sesja angielskiego.
Odtwarzacz skopiowany z Kursu K (`~/angielski`, tamtego projektu NIE ruszamy): audio per para,
pętla na zablokowanym iPhonie, fraza na ekranie blokady, przycisk „3 rundy” (2:00 → 1:30 → 1:00).

## Po każdej sesji (Claude robi sam)

1. Nagrania KK → `kariera-mundurowa/brain/angielski/narzedzia/pomiar-mowy.py` (wyniki w `brain/angielski/pomiary/`).
2. Nowy folder `R/NN-rN-slug/rozdzial.md` (format jak R1):
   - Grupa 1–2 `pl2en`: zdania KK z nagrań dnia, poprawione (po jednej grupie na pytanie);
   - Grupa 3 `pl2en`: te same ramy i błędy w nowych zdaniach;
   - Grupa 4 `scenka`: komisja dopytuje (pytanie EN | podpowiedź PL | odpowiedź EN);
   - Grupa 5 `słuchanka`: całe poprawione odpowiedzi do shadowingu;
   - pod `## Grupa N`: `<!-- nazwa: … -->`, `<!-- 432: pytanie -->`, potem ewentualnie `<!-- mode: … -->`;
   - `## Nowe słowa i struktury` + `## Typowe błędy Polaka` (co padło, nagranie, znacznik).
   Fakty z historii KK zostają; bez slangu na siłę; US English.
3. Weryfikacja: 3 recenzentów Opus (poprawność, naturalność, wierność PL↔EN), poprawki, druga runda kontrolna.
4. Audio: `node ~/.claude/skills/angielski-rozdzial/assemble-audio.js R/<dział>/rozdzial.md` (po poprawkach `--only N --force`).
5. PDF: `~/.claude/skills/gstack/make-pdf/dist/pdf generate R/<dział>/rozdzial.md <scratchpad>/x.pdf` → `R/<dział>/rozdzial.pdf`.
6. Wpis w `R/kurs.json` (`dzialy[]`), potem `npm run build` (content.json).
7. Podgląd: `npm run serve` → http://127.0.0.1:8010. Push na GitHub/Render tylko po „wrzuć” KK.
