# Kurs K w podglądzie — projekt integracji

**Data:** 2026-08-02  
**Status:** projekt zaakceptowany w rozmowie; dokument oczekuje na końcowe potwierdzenie  
**Zakres:** K1 i K2 w generowanym `podglad.html`

## 1. Cel

Rozszerzyć wspólny podgląd materiałów o Kurs K bez naruszania działania Kursu M.
K1 i K2 mają oferować ten sam pełny tryb nauki co działy M: rozmycie angielskich
zdań, odkrywanie treści, gwiazdki, powtórki, eksport JSON do Anki oraz audio.

## 2. Wybrane rozwiązanie

Generator `tools/build-podglad.js` zostanie rozszerzony o jawne pojęcie kursu.
Nie będziemy udawać, że K jest kolejnym numerem M, ani osadzać `k.html` w ramce.
Generator odczyta oba źródła i zbuduje jeden samodzielny plik HTML:

- Kurs M z obecnych katalogów `NN-mXdY-*` i `slownik.json`;
- Kurs K z katalogów `K/NN-kN-*` i `K/slownik-k.json`.

To zachowuje wygodę jednego podglądu, a zarazem ścisłą granicę danych między
kursami.

## 3. Nawigacja i wygląd

Ekran główny pokaże dwie czytelne sekcje: istniejący Kurs M oraz osobny
`Kurs K · Conversation Lab`. K otrzyma własny kafel otwierający widok kursu,
w którym dostępne będą K1 i K2 oraz nawigacja boczna między działami.

Widok K zachowa znane mechanizmy podglądu, ale dostanie subtelny motyw zgodny z
mikrowitryną K: atramentowy granat, ciepłe tło i złoty akcent. Zmiana nie będzie
przebudowywać ani wizualnie destabilizować istniejących widoków M.

## 4. Dane i izolacja zależności

Każdy dział będzie posiadał jawne pola identyfikujące kurs i dział, na przykład
`course: "k"`, `id: "k1"`, `label: "K1"`. Zależności i wyróżniane wyrażenia K
będą wyliczane wyłącznie z `K/slownik-k.json`. Generator nie będzie dopasowywać
targetów K do `slownik.json` kursu M.

K1 i K2 pozostają niezależne od M także wtedy, gdy identyczny zwrot pojawi się
w obu rejestrach.

## 5. Tryb nauki

Każda tabela K otrzyma te same zachowania co materiał M:

- angielska kolumna jest domyślnie rozmyta w trybie nauki;
- kliknięcie lub obsługa klawiaturą odsłania pojedyncze zdanie;
- użytkownik może przełączyć cały widok między nauką i swobodnym czytaniem;
- wiersze można oznaczać gwiazdką;
- K1 i K2 udostępniają audio grupami oraz przycisk całego kursu K.

Implementacja użyje wspólnych funkcji interfejsu, aby zachowanie M i K nie
rozjeżdżało się w przyszłości.

## 6. Osobne gwiazdki, powtórki i eksport

Kurs K otrzyma osobną przestrzeń stanu w `localStorage`, niezależną od M.
Zostaną użyte osobne klucze dla gwiazdek i elementów już wyeksportowanych.

Panel powtórek będzie przełączany kontekstem kursu: w widoku K pokazuje wyłącznie
zdania K, a w widoku M wyłącznie zdania M. Eksport K zachowa format użyteczny dla
Anki i doda jednoznaczne oznaczenia `course: "K"` oraz `chapter: "K1"` lub
`"K2"`. Eksport nie zmieni obecnych zapisów M.

## 7. Audio

Generator wykryje istniejące pliki `K/*/grupa-N.mp3`. Przyciski grup odtworzą
właściwy plik, a przycisk całego Kursu K utworzy kolejkę dziesięciu grup w
kolejności K1 → K2. Obsługa istniejącego elementu audio, zapętlenia i kolejki
pozostanie wspólna z M.

## 8. Generowanie i pliki

Źródłem zmian będzie `tools/build-podglad.js`; `podglad.html` pozostaje
generowanym, ignorowanym artefaktem. Po zmianie generator zostanie uruchomiony,
aby odświeżyć lokalny plik `/Users/krzysztofkilian/angielski/podglad.html`.

Nie będą modyfikowane treści K1/K2, ich PDF-y, MP3 ani działająca mikrowitryna
`k.html`.

## 9. Obsługa błędów

- Brak rejestru K zatrzyma generator z czytelnym komunikatem.
- Brak pojedynczego MP3 nie ukryje tekstu działu; niedostępny przycisk zostanie
  pominięty zgodnie z obecną logiką podglądu.
- Nieprawidłowy identyfikator kursu nie może zapisać stanu do przestrzeni M.

## 10. Kryteria odbioru

- Ekran główny pokazuje osobne sekcje M i K.
- K1 i K2 otwierają się i wyświetlają wszystkie grupy zdań.
- Blur, odkrywanie, tryb nauki, gwiazdki i obsługa klawiatury działają w K.
- Gwiazdki K pozostają po odświeżeniu i nie pojawiają się w powtórkach M.
- Eksport K zawiera tylko zaznaczone zdania K oraz poprawne oznaczenia K1/K2.
- Audio pojedynczych grup i kolejka całego K wskazują istniejące pliki.
- Zależności K pochodzą wyłącznie z `K/slownik-k.json`.
- Dotychczasowe zachowanie wszystkich widoków M przechodzi test regresji.
- Wygenerowany `podglad.html` nie zgłasza błędów konsoli na telefonie ani desktopie.

## 11. Poza zakresem

- Łączenie rejestrów językowych M i K.
- Wspólna kolejka powtórek lub wspólny eksport obu kursów.
- Zmiana treści rozdziałów, audio, PDF-ów albo mikrowitryny `k.html`.
- Backend, logowanie lub synchronizacja stanu między urządzeniami.
