# Kurs K - projekt niezależnej ścieżki konwersacyjnej

**Data:** 2026-08-02
**Status:** zatwierdzony do realizacji przez użytkownika poleceniem wykonania całości
**Zakres pierwszego wydania:** K1, K2, osobna mikrowitryna, PDF-y i audio

## 1. Cel

Kurs K jest rozwojową, niezależną od kursu M ścieżką B2 -> C1 opartą na realnych
rozmowach z lektorem i materiałach otrzymywanych przed zajęciami. K1 naprawia
problemy wykryte w transkrypcji pierwszej rozmowy. K2 przygotowuje do rozmowy o
kintsugi na podstawie przesłanego worksheetu.

Sukces pierwszego wydania oznacza, że użytkownik może otworzyć osobny adres HTML,
wybrać K1 lub K2, odtwarzać każdą grupę z telefonu także przy zablokowanym ekranie,
zapętlać ją oraz otworzyć zweryfikowany PDF działu.

## 2. Granice

- Kurs K ma własny program, rejestr wyrażeń, manifest treści i interfejs.
- K1 i K2 nie czytają `PROGRAM.md`, `slownik.json` ani `content.json` kursu M.
- Istniejące rozdziały M, `index.html`, `app.js`, `style.css` i `content.json`
  pozostają funkcjonalnie bez zmian.
- Wspólne może być wyłącznie repozytorium, skrypt składania audio i konfiguracja
  wdrożenia statycznego.
- Projekt ma obsługiwać późniejsze K3, K4 i kolejne działy bez zmian w interfejsie.

## 3. Rozważone podejścia

### A. Osobna mikrowitryna K - wybrane

`k.html` ładuje `k-app.js`, `k-style.css` i generowany `k-content.json`. Dane oraz
rozdziały mieszkają pod `K/`. To najprostsza granica, nie niesie ryzyka regresji
odtwarzacza M i pozwala nadać K własną tożsamość.

### B. Przełącznik M/K w obecnej aplikacji

Mniej nowych plików, ale wymaga zmiany routera, generatora i modelu danych M.
Odrzucone, ponieważ użytkownik poprosił o osobny HTML i osobne zależności.

### C. Wspólny rdzeń i dwa motywy

Najmniej duplikacji długoterminowo, ale wymaga refaktoryzacji działającego M.
Odrzucone jako nadmiarowe dla dwóch pierwszych działów K.

## 4. Struktura plików

```text
K/
  PROGRAM-K.md
  slownik-k.json
  01-k1-powiedz-to-raz/
    rozdzial.md
    rozdzial.pdf
    grupa-1.mp3 ... grupa-N.mp3
  02-k2-kintsugi/
    rozdzial.md
    rozdzial.pdf
    grupa-1.mp3 ... grupa-N.mp3
k.html
k-style.css
k-app.js
k-content.json
tools/generate-k.js
tools/generate-k.test.mjs
tools/k-site.test.mjs
```

`k-content.json` jest artefaktem generowanym. Źródłem prawdy są foldery pod `K/`
oraz nagłówki w `rozdzial.md`.

## 5. Model kursu i zależności

Identyfikatory działów to `k1`, `k2`, `k3` itd. Rejestr `K/slownik-k.json`
zachowuje schemat `{id, pl, en, typ, intro, review[]}`. Checker recyklingu działa
z jawnym parametrem `--slownik K/slownik-k.json`, dzięki czemu nie może przypadkiem
sięgnąć do rejestru M.

K1 wprowadza narzędzia komunikacyjne. K2 musi wydobywać je w nowym kontekście,
szczególnie podczas wyjaśniania metafory kintsugi i odpowiadania na pytania
lektora. Przyszłe powroty są planowane wyłącznie jako `k3`, `k4` itd.

## 6. K1 - Powiedz to za pierwszym razem / Say It in One Go

Źródłem jest transkrypcja, w której użytkownik jest Osobą A. Dział nie jest kopią
M4. Wprowadza od nowa, w rejestrze K, zwarte procedury odpowiadające rzeczywistym
zacięciom:

- przekazanie sedna: `to get my point across`, `What I mean is...`;
- ratunek przy braku słowa: `I'm blanking on the word`, `It's sort of like...`;
- miękka propozycja: `I was thinking we could...`, `Would it be OK if I...`;
- doprecyzowanie po fakcie: `I should have mentioned...`, `I'd say...`.

Konteksty pozostają prawdziwe: praca przy aplikacjach i kursach do matury z
matematyki, siłownia, szachy, ciekawostki oraz sposób prowadzenia lekcji. Ostatnia
grupa jest scenką opartą na pytaniach z realnej rozmowy.

## 7. K2 - Kintsugi: siła niedoskonałości / The Strength of Imperfection

Źródłem jest `esl_worksheet_kintsugi_b1_b2.pdf`. Dział podnosi materiał z B1/B2
do naturalnego, mówionego B2 -> C1. Wprowadza niewielką liczbę klocków ćwiczonych
głęboko:

- `to piece something back together`;
- `to draw attention to something`;
- `to embrace imperfection`;
- `to be a testament to something`;
- `to come out stronger`.

Grupy przechodzą od literalnego procesu naprawy przez wabi-sabi i odporność
psychiczną do debaty o perfekcjonizmie, konsumpcji i wyrzucaniu przedmiotów.
Ostatnia grupa jest scenką z pytaniami odpowiadającymi worksheetowi. K2 wydobywa
co najmniej cztery procedury z K1, nie importując niczego z M.

## 8. Format materiałów

Każdy dział zachowuje kontrakt parsera audio: `## Grupa N`, tabele PL/EN oraz
`## Nowe słowa i struktury`. Nowe klocki są ułożone jako zasiew -> splot ->
składanka. Tabele zawierają wyłącznie naturalne zdania; sztywne wersje z
transkrypcji trafiają do notki `Typowe błędy Polaka`.

Każdy dział przechodzi checker recyklingu oraz trzy niezależne recenzje:
poprawność i amerykańskość, naturalność i rejestr, wierność PL/EN i recykling.
Po korektach powstają PDF i osobne MP3 dla wszystkich grup.

## 9. Interfejs K

Interfejs nosi nazwę `Kurs K - Conversation Lab`. Zachowuje sprawdzone zachowania
M: jeden element `<audio>`, Media Session, poprzednia/następna grupa, trzy tryby
pętli, pasek postępu, przywrócenie ostatniej grupy i link do PDF.

Tożsamość wizualna nie kopiuje magnetofonu M. Jest to współczesny notatnik
konwersacyjny: ciemny atramentowy granat, ciepła kość słoniowa, oszczędny złoty
akcent i cienka nieregularna linia postępu. Motyw pasuje do K2, ale pozostaje
neutralny dla przyszłych tematów. Typografia ma być wyrazista, interfejs mobilny,
a ruch ograniczony i respektujący `prefers-reduced-motion`.

Widoki:

1. Strona główna z K1, K2 i krótkim opisem celu każdego działu.
2. Widok działu z grupami audio i linkiem do PDF.
3. Stały dolny odtwarzacz zoptymalizowany dla obsługi jedną ręką.

Stan odtwarzacza ma osobny prefiks kluczy `ang.k.*`, aby nie kolidował z kursem M.

## 10. Generowanie i wdrożenie

`tools/generate-k.js` skanuje wyłącznie `K/NN-kN-*`, odczytuje tytuł, PDF i MP3,
a następnie zapisuje `k-content.json`. `npm run build` uruchamia generator M i K,
dzięki czemu obecne wdrożenie statyczne publikuje oba interfejsy.

Błąd danych ma być widoczny w interfejsie jako krótki komunikat z możliwością
ponowienia. Brak audio nie blokuje PDF-u. Brak PDF-u nie blokuje audio.

## 11. Testy i kryteria odbioru

- Test generatora potwierdza skanowanie tylko katalogu K, kolejność K1/K2,
  wykrywanie MP3 i PDF oraz stabilne adresy URL.
- Test struktury witryny potwierdza osobne zasoby, jeden element audio, dostępne
  etykiety i brak odwołań do `content.json` kursu M.
- Testy parsera/checkera potwierdzają obecność zaplanowanych powrotów K1 w K2.
- Wszystkie pliki MP3 są poprawnymi plikami audio i odpowiadają liczbie grup.
- Oba PDF-y są renderowane do PNG i sprawdzane wizualnie bez ucięć, nakładania
  tekstu ani brakujących znaków.
- Witryna jest sprawdzona w szerokości telefonu i desktopu; nawigacja, audio,
  pętla, postęp i linki PDF działają bez błędów konsoli.

## 12. Poza zakresem

- Migracja istniejącego M4 do K.
- Wspólna strona startowa łącząca M i K.
- Logowanie, synchronizacja postępu między urządzeniami i backend.
- Automatyczne publikowanie nowych worksheetów bez przygotowania językowego.
