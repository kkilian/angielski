# HANDOFF — interaktywny egzamin głosowy

**Data aktualizacji:** 2026-07-13 (wieczór)
**Status:** ZBUDOWANE i przetestowane symulacją end-to-end. Czeka na pierwszy
żywy test Krzyśka (mikrofon w przeglądarce) i kalibrację progów.

Poprzednia wersja tego handoffu („nic nie zaczęte, brainstorming od zera")
została skonsumowana tego samego dnia: brainstorming → specka → plan → kod.

---

## Co jest

Interaktywny egzamin głosowy jako bramka M3→M4, wzorowany na COACH 2.0,
ale z pełną warstwą egzaminacyjną (której COACH nie ma).

- **Specka:** `docs/superpowers/specs/2026-07-13-egzamin-glosowy-design.md`
- **Plan:** `docs/superpowers/plans/2026-07-13-egzamin-glosowy.md`
- **Kod:** `tools/egzamin/` (serwer, front, prompty, metryki, werdykt, sym)

Decyzje z brainstormingu (wszystkie 4 pytania z pierwotnego handoffu rozstrzygnięte):

1. **Ocena:** dwie osie, obie muszą przejść — oś A materiał minikursu
   (okazje→użycia struktur-celów), oś B jakość mówienia (rubryka CEFR 4×1–5
   + metryki audio jako dowód). Sędzia ocenia, **kod liczy werdykt**.
2. **Kryteria M3:** oś A ≥60% okazji + każda rodzina (2nd-cond, 3rd-cond,
   wish-if-only, modal-perfect) ≥1 raz poprawnie; oś B każde kryterium ≥3/5.
   Poprzeczka jawna przed startem, rośnie z minikursem (M5 = pełne C1).
3. **Kształt:** ~20 min, 4 bloki tematyczne, pytanie główne + 1–3 adaptacyjne
   follow-upy (3. tylko gdy potrzebny; podniesione z 2 na prośbę Krzyśka po
   1. podejściu); pytania TYLKO audio (cedar), jedna powtórka.
4. **Anty-gotowiec:** plan generowany dopiero po START (z unikaniem pytań
   z poprzednich podejść w `egzaminy/m3/*/plan.json`); follow-upy z treści
   odpowiedzi. Oblanie → zadanie na jutro (dryl 10 par + scenka 3 pytania);
   retake najwcześniej jutro — pilnuje serwer.

## Jak uruchomić

```
npm run egzamin        # → http://127.0.0.1:8124/
```

Klucze: env `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` albo automatyczny fallback
z `~/Desktop/coach-2.0/main.js`. Wyniki każdego podejścia (nagrania, transkrypty,
plan, ocena, werdykt): `egzaminy/m3/<data>-podejscie-N/` (gitignored).

Symulacja bez mikrofonu: `node tools/egzamin/sym.mjs` (przy działającym
serwerze; po skończeniu przenosi swoje podejście do `egzaminy/sym/`, żeby nie
blokować prawdziwego retake'u).

## Co dalej (dla Krzyśka / następnej sesji)

1. **Żywy test:** `npm run egzamin`, test mikrofonu, jedno podejście „na niby"
   w Chrome (Safari też powinien działać — MediaRecorder→mp4 obsłużony, ale
   Chrome pewniejszy).
2. **Kalibracja:** po 1–2 próbnych podejściach obejrzeć `ocena.json` i raport —
   ewentualnie dokręcić prompt sędziego (`tools/egzamin/prompty/sedzia.md`)
   i progi (`PROGI_M3` w `tools/egzamin/server.mjs`). Dopiero potem bramka
   obowiązuje na serio.
3. Świadomie poza v1: Anki z egzaminu, PDF zadania, historia podejść,
   rotacja kluczy do ~/.zshenv.

## Po 1. realnym podejściu (2026-07-13, M3: OBLANE 40% osi A — zasłużenie)

- Oś B zdana 3/3/3/3 (= diagnoza B2.2); 2nd cond już automatyczny (4/4),
  wish/if-only i modal-perfect wciąż unikane → zadanie na jutro: modal-perfect.
- Kalibracja promptów: generator nie zmyśla faktów z życia, sędzia uznaje
  samokorekty. Progi bez zmian — rozróżniły uczciwie.
- **Egzaminy M1 i M2 dodane** jako testy kontrolne fundamentu (wybór na
  stronie startowej; osobne rodziny struktur: M1 inwersje/klefty, M2
  cleft/Only…/whether/hedging; blokada retake per minikurs).
