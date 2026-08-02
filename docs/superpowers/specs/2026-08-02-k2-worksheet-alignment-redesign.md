# K2 — pełna zgodność z worksheetem kintsugi

**Data:** 2026-08-02  
**Status:** zatwierdzony do realizacji poleceniem użytkownika, aby przemyśleć i wygenerować całość ponownie  
**Zakres:** wyłącznie K2; K1 i działający interfejs kursu K pozostają bez zmian

## Cel

K2 ma przygotować Krzyśka nie tylko do ogólnej rozmowy o kintsugi, lecz do
rozpoznania, wyjaśnienia i aktywnego użycia całego materiału z pliku
`esl_worksheet_kintsugi_b1_b2.pdf`. Kryterium sukcesu jest możliwość udzielenia
naturalnej, rozwiniętej odpowiedzi na każde z siedmiu pytań końcowych oraz
swobodne użycie pięciu słów wyróżnionych w worksheetcie.

## Źródło prawdy

Worksheet jest nadrzędny wobec obecnej wersji K2. Obowiązkowe słownictwo to:

1. `shatter` — roztrzaskać się / rozbić się na mniejsze kawałki;
2. `crude` — prymitywny, niewyszukany, wykonany bez finezji;
3. `aesthetic` — związany z pięknem i wyglądem artystycznym;
4. `transience` — przemijanie, krótkotrwałość i ciągła zmiana;
5. `resilience` — zdolność do podnoszenia się po trudnościach.

Obowiązkowe pytania końcowe to siedem pytań z Exercise 2 i Exercise 3. W grupie
scenkowej wystąpią w tej samej kolejności i z zachowaniem ich pełnego sensu oraz
sformułowania. Trzy dodatkowe pytania kontrolne znajdą się dopiero po nich, aby
grupa spełniała kontrakt 10 wierszy i trenowała nieprzewidywalny follow-up.

Fakty historyczne będą podane ostrożnie: opowieść o Ashikadze Yoshimasie zostaje
oznaczona jako popularna legenda, a nie bezspornie udokumentowane pochodzenie.

## Projekt językowy

Pięć słów z worksheetu stanie się rdzeniem K2 i trafi do niezależnego rejestru
kursu K jako naturalne klocki: `shatter into pieces`, `a crude repair`,
`aesthetic value`, `the transience of things` i `mental resilience`. Każdy wróci
w wielu zdaniach, odpowiedziach i pytaniach, zamiast pojawić się tylko w
słowniczku.

Zwroty z poprzedniej wersji — między innymi `piece back together`,
`draw attention to`, `embrace imperfection`, `a testament to` i
`come out stronger` — pozostaną użyteczne jako język modelowych odpowiedzi, ale
nie będą konkurować z wymaganym słownictwem worksheetu o status głównego celu.

K2 odzyska procedury komunikacyjne z K1: `to get my point across`,
`What I mean is...`, `It's sort of like...`, `I should have mentioned...`,
`I'd say...` i `What ... most is ...`. Odpowiedzi będą brzmiały jak naturalny
General American na poziomie B2 → C1, bez wymuszonego slangu.

## Struktura rozdziału

1. **Grupa 1 — słownictwo i historia przedmiotu (15 par):** zasiew i rotacja
   wszystkich pięciu słów w realnym kontekście artykułu.
2. **Grupa 2 — Exercise 2, pytania 1–2 (12–15 par):** proces kintsugi, legenda o
   Yoshimasie, crude repair oraz porównanie wabi-sabi z zachodnim
   perfekcjonizmem i kupowaniem nowych rzeczy.
3. **Grupa 3 — Exercise 2, pytania 3–4 (12–15 par):** metafora odporności
   psychicznej oraz przyczyny ukrywania błędów, blizn i porażek.
4. **Grupa 4 — Exercise 3, pytania 5–7 (12–15 par):** perfekcjonizm i szczęście,
   naprawianie rzeczy i odpady, wartość trudnych doświadczeń w relacjach i
   przywództwie. Materiał zawiera argumenty, zastrzeżenia i osobiste stanowisko.
5. **Grupa 5 — próbna rozmowa (10 wierszy):** najpierw dokładnie siedem pytań z
   worksheetu, potem trzy krótkie follow-upy. Każde pytanie ma sterującą
   podpowiedź po polsku i pełną, naturalną odpowiedź wzorcową po angielsku.

Sekcja `Nowe słowa i struktury` poda definicje zgodne z worksheetem, wymowę
General American, akcent, pułapki wymowy i typowe błędy Polaka. Nie wchodzi ona
do audio.

## Artefakty i przepływ danych

- `K/PROGRAM-K.md` opisze poprawiony cel K2.
- `K/slownik-k.json` zastąpi stare główne targety K2 pięcioma wymaganymi
  klockami worksheetowymi i zachowa wyłącznie zależności kursu K.
- `K/02-k2-kintsugi/rozdzial.md` zostanie przepisany od zera.
- `K/02-k2-kintsugi/rozdzial.pdf` zostanie ponownie wygenerowany i sprawdzony
  strona po stronie.
- `grupa-1.mp3`–`grupa-5.mp3` zostaną ponownie wygenerowane z nowej treści.
- `k-content.json` i lokalny `podglad.html` zostaną przebudowane z finalnych
  artefaktów.

## Kontrola jakości

- Stały test treści potwierdzi obecność pięciu wymaganych słów i siedmiu pytań.
- Checker recyklingu musi przejść z `K/slownik-k.json`.
- Trzej niezależni recenzenci sprawdzą: poprawność i wymowę; naturalność i
  rejestr; wierność PL↔EN, źródłu oraz zależnościom K.
- Każda uwaga `BŁĄD` lub `ZMIEŃ` zostanie poprawiona przed generacją audio.
- PDF zostanie wyrenderowany do obrazów i obejrzany w całości.
- Wszystkie MP3 muszą być niepuste i odpowiadać pięciu grupom.
- Pełny build i testy witryny muszą przejść przed wysłaniem zmian na Render.

## Poza zakresem

- Zmiany treści K1.
- Przebudowa wizualna `k.html` lub logiki odtwarzacza.
- Łączenie zależności K z kursem M.
- Udawanie, że trudne doświadczenia automatycznie czynią każdą osobę silniejszą.
