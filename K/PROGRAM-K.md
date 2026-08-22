# PROGRAM K - Conversation Lab

## Cel

Kurs K jest osobną ścieżką B2 -> C1 zbudowaną wokół prawdziwych rozmów z
lektorem i materiałów otrzymywanych przed zajęciami. Każdy dział ma pomóc mówić
precyzyjniej podczas najbliższej rozmowy. Działy są samodzielne: nie ma
obowiązkowej ciągłości między nimi, a frazy z wcześniejszych działów wracają
tylko jako lekki klej tam, gdzie naturalnie pasują.

K nie pobiera wyrażeń ani harmonogramu z kursu M. Jedynym rejestrem zależności
jest `K/slownik-k.json`.

## Metoda

- General American, naturalny język mówiony B2 -> C1.
- Mało targetów, dużo wydobyć: zasiew -> splot -> składanka.
- Zdania do powtarzania na głos: każda grupa zaczyna krótko (otwarcie ~8 słów
  EN), a dłuższe, złożone zdania pojawiają się dopiero na końcu grupy jako
  składanka. Wykładowe definicje nie wchodzą do audio.
- Polska kolumna wywołuje konkretną, naturalną odpowiedź po angielsku.
- Sztywne lub błędne wersje trafiają do notki `Typowe błędy Polaka`, nie do audio.
- Ostatnia grupa odtwarza lub symuluje realną rozmowę: pytanie EN -> podpowiedź PL -> odpowiedź EN.
- Id działów są liniowe: `k1`, `k2`, `k3` itd.
- **Ćwiczenie płynności 4/3/2 (Nation):** grupa może mieć jedno pytanie EN dotyczące jej
  treści — komentarz `<!-- 432: …? -->` bezpośrednio pod `## Grupa N` w rozdzial.md
  (w scence nad `<!-- mode: scenka -->`). Generator przenosi je do `k-content.json` jako
  `pytanie432`, a player pokazuje przy grupie przycisk otwierający ekran z timerem
  4:00 → 3:00 → 2:00: ta sama odpowiedź trzy razy, coraz mniej czasu, bez mikrofonu
  i bez oceny. Pytanie NIE mieszka w audio.json (assemble-audio.js przepisuje manifest
  i zgubiłby obce pole). Na razie pytania ma tylko K7; docelowo każdy nowy dział
  dostaje je przy budowie.

## K1 - Powiedz to jasno za pierwszym razem / Say It Clearly the First Time

**Źródło:** transkrypcja pierwszej rozmowy z lektorką; Krzysiek jest Osobą A.

**Diagnoza:** komunikacja działa na poziomie B2, ale wypowiedzi urywają się przy
sednie, brakujące słowo zatrzymuje tok rozmowy, a propozycje i doprecyzowania nie
wchodzą jeszcze automatycznie.

**Targety:**

- `to get my point across`
- `What I mean is...`
- `I'm blanking on the word`
- `It's sort of like...`
- `I was thinking we could...`
- `Would it be OK if I...?`
- `I should have mentioned...`
- `I'd say...`
- `What ... most is ...`

**Konteksty:** aplikacje i kursy do matury z matematyki, siłownia, szachy,
ciekawostki oraz sposób prowadzenia lekcji.

## K2 - Kintsugi: siła niedoskonałości / The Strength of Imperfection

**Źródło:** worksheet `esl_worksheet_kintsugi_b1_b2.pdf`.

**Cel:** podnieść materiał B1/B2 do mówionego B2 -> C1, aktywnie opanować całe
słownictwo wyróżnione w worksheetcie i przygotować pełne, osobiste odpowiedzi na
wszystkie siedem pytań z Exercise 2 i Exercise 3.

**Nowe targety z worksheetu:**

- `to shatter into pieces`
- `a crude repair`
- `aesthetic value`
- `the transience of things`
- `mental resilience`

**Lekki klej z K1 (bez obowiązku):** frazy takie jak `I'd say...`,
`What I mean is...` czy `It's sort of like...` pojawiają się tylko tam, gdzie
naturalnie pasują do odpowiedzi na pytania worksheetu.

**Łuk działu:** zasiew pięciu słów w krótkich, codziennych zdaniach ->
artykuł: metoda, legenda o Yoshimasie, wabi-sabi (pytania 1-2) -> metafora
psychologiczna i ukrywanie porażek (pytania 3-4) -> perfekcjonizm, naprawa
vs wyrzucanie, trudna przeszłość (pytania 5-7) -> próbna rozmowa z siedmioma
pytaniami z PDF-u i trzema follow-upami.

## K3 - Powiedz to w jednym zdaniu / Say It in One Sentence

**Źródło:** transkrypcja drugiej rozmowy z lektorem (2026-08-03, 1:04:15); Krzysiek
jest Osobą A.

**Diagnoza:** lektor ocenia słownictwo jako mocne i nie widzi rażących błędów
gramatycznych. Realne wąskie gardło nazwał sam Krzysiek: „I can't find a way to say
it in one sentence instead of five sentences". Do tego w transkrypcji jest kilkanaście
miejsc, w których zabrakło konkretnego słowa („How would you say?", „What's the name
of it when…", „I don't have the words").

**Nowe targety (słowa, których zabrakło albo które warto mieć aktywnie):**

- `an election`
- `a courtyard`
- `self-service`
- `common knowledge`
- `word of mouth`
- `to commute`
- `the suburbs / suburban`
- `a toll / a toll road`
- `a tourist trap`
- `homogeneous`

**Kompresja jako zasada projektowa:** polska kolumna podaje myśl tak rozwlekle, jak
padła na lekcji, angielska daje jej zwięzły, jednozdaniowy odpowiednik. W scence
odpowiedzi wzorcowe mają maksymalnie dwa zdania.

**Błędy z lekcji:** poprawne formy są wplecione w zdania drylu i wracają wielokrotnie;
wersje błędne nie trafiają do audio, tylko do notki `Typowe błędy Polaka` (zgodnie
z Zasadą 3 metody). Trzy klasy błędów dostały własne grupy, bo pojawiały się na lekcji
najczęściej:

- **Grupa 5 — rodzajniki:** `a very nice city`, `have a problem`, `the average person`,
  `a completely different part`, ale `health care` i `health insurance` bez rodzajnika.
- **Grupa 6 — `there is/are` i `used to`:** `there were no roads`, `winters used to be
  harsh`, `there didn't use to be`, `are they waiting`.
- **Grupa 7 — przyimki i kalki czasownikowe:** `complain about`, `talk about`,
  `think of`, `drive a car`, `on vacation`, `twice`, `has mass appeal`, `a real native`,
  `back roads`.

**Lekki klej z K1:** `I was thinking we could...`, `Would it be OK if...?`,
`What I mean is...`, `I'd say...`, `I'm blanking on the word`, `to get my point across`.
Z K2 wracają `aesthetic value` i `mental resilience`; `shatter into pieces`,
`a crude repair` i `the transience of things` przesunięto na `k4`, bo nie wchodzą
naturalnie w rozmowę o Polsce i USA.

**Łuk działu (8 grup):** zasiew dziesięciu słów w krótkich zdaniach -> Kraków, płatna
autostrada, bar mleczny i wakacje -> Ameryka: przedmieścia, dojazdy, zamknięte paczki
znajomych -> składanka i porównania USA/Polska (zdrowie, American dream) -> trzy grupy
naprawy błędów (rodzajniki, `there is/are` + `used to`, przyimki i kalki) -> scenka
z realnymi pytaniami lektora z tej lekcji.

## K4 - Manosfera: opowiedz cudzy pogląd / The Manosphere: Reporting Someone Else's View

**Źródło:** worksheet `esl_worksheet_incel_manosphere_deep_in_depth_b1_b2.pdf` od lektora
oraz **dwie** transkrypcje głosowych rozmów Krzyśka z ChatGPT o tym arkuszu
(2026-08-08 → G1–G5, 2026-08-12 → G6) i **assessment od lektora po lekcji**
(2026-08-13 → G7–G9).

**Diagnoza z transkryptu:** rozmowa dobrnęła tylko do szóstego akapitu — ani jedno
z jedenastu pytań arkusza nie zostało dotknięte. Zacięcia były powtarzalne:
brakujące słowa (`resent`, `echo chamber`, `reinforce`, `feedback loop`,
`bitterness`), złe słowa (`compartmentalizing` zamiast `categorizing`,
`deterministic` zamiast `determined by`, `crooked image` zamiast `distorted view`),
systematycznie gubione rodzajniki i mylone `biased towards`/`against`.

**Skrócenie 2026-08-10:** 10 grup → 5 grup, 164 pary → 77 par. Decyzja Krzyśka:
K4 ma być przygotowaniem do czwartkowej lekcji, nie kursem-encyklopedią.

**Dodanie Grupy 6 (2026-08-12):** 5 grup → 6 grup, 77 → 95 par. Po przećwiczeniu
G1–G5 druga rozmowa z ChatGPT pokazała, że słownictwo tematyczne już siedzi, ale
rozmowa rozsypuje się na **prowadzeniu jej**: gołe „Sorry" zamiast prośby
o powtórzenie, brak sposobu na przekierowanie rozmówcy („so you have to ask me
questions"), brak języka na przyznanie się do zgadywania i na grzeczną niezgodę.
Do tego wróciły błędy liczby mnogiej (`push man into isolation`,
`their harmful belief`) i present continuous zamiast simple (`they are leaning`).

**Nowe targety (11, w kolejności ROI z transkryptu):**

- `to resent somebody / resentful / resentment`
- `biased against somebody`
- `an echo chamber`
- `to reinforce`
- `a feedback loop`
- `a distorted view of reality`
- `bitterness toward somebody`
- `to be determined by`
- `to categorize people into rigid groups`
- `to move up in the hierarchy` / `a fixed hierarchy`
- openings and attribution: `According to the article…`, `The text argues that…`, `In their view…`, `To be clear, I'm not defending them`, `These are extreme cases`

**Targety Grupy 6 (prowadzenie rozmowy, uniwersalne — nie o manosferze):**

- `Say that again?` / `I didn't catch that (last part)`
- `I'd rather you asked me the questions` (C1: unreal past po `I'd rather` + podmiot)
- `I'd only be guessing` / `going by the name`
- `I'm pretty sure I said…` / `Fair enough`
- `paragraph by paragraph` / `Can we come back to that?`
- `Correct me as we go` / `What's holding me back?` / `Would you say that's still B1?`

**Atrybucja:** każde zdanie oddające ideologię idzie w mowie zależnej — nigdy jako gołe twierdzenie.

**Pytania Exercise 2/3 celowo pominięte** — trenuje je czwartkowa lekcja z tutorem; błędy z niej wróciły do **samego K4 jako G7–G9** (assessment 2026-08-13), a nie do osobnego działu. Pilnuje tego `tools/k4-content.test.mjs`.

**Nowa zasada K: zasiew wydłużony do 5–6 kolejnych wierszy** jednego targetu (z wariacjami osoba/czas/przeczenie), potem rotacja. Zamiast dotychczasowego limitu max 3 pod rząd w fazie zasiewu.

**Dodanie Grup 7–9 (2026-08-13):** 6 grup → 9 grup, 95 → 141 par. Źródłem jest tym razem
**assessment od lektora po lekcji**, nie transkrypcja rozmowy z ChatGPT. Diagnoza schodzi
o poziom niżej niż przy G6: słownictwo tematyczne siedzi, prowadzenie rozmowy też, ale
**rozsypuje się sama budowa zdania**. Cytat: „Twoim głównym ograniczeniem nie jest brak
angielskiego. Problem zaczyna się, gdy próbujesz konstruować i poprawiać zdanie
jednocześnie podczas mówienia."

Pięć punktów assessmentu rozłożonych na trzy grupy:

| punkt | grupa |
|---|---|
| 1 · zdanie budowane za długo, restarty („they… it… it usually…") | G7 |
| 5 · trudniejsza konstrukcja niż potrzeba | G7 (domknięcie) |
| 3 · zgoda podmiotu z orzeczeniem, `a`/`an` | G7 (wchodzi sama) |
| 4 · **zbędne** `the` przy pojęciach ogólnych | G7 (jw.) |
| 2 · kolokacje i przyimki | G8 |
| zapowiedź lektora: „zadam pytanie, Ty odpowiesz sam" | G9 |

Punkty 3 i 4 **nie dostały własnej grupy celowo** — krótkie zdanie samo je wymusza.
`Society is biased against men.` nie ma gdzie schować błędu; długie zdanie ma.
Naprawa punktu 1 naprawia 3 i 4 za darmo. Zwróć uwagę, że punkt 4 jest **lustrzanym
odbiciem** błędu z G4: tam brakowało `a`/`an` przy policzalnych rzeczownikach, tu
nadmiarowe `the` trafia na niepoliczalne pojęcia (`society`, `radicalization`, `isolation`).

**Nowe targety Grup 7–9 (chunki jako całości, nie słowo + przyimek):**

- `to lead to` (**nigdy** `lead into`)
- `based on` / `determined by` (**nie** `fixed on your looks`)
- `to act as` (naturalniejsze niż `work as`)
- `to push somebody toward something`
- `trapped in` (wewnątrz systemu) / `trapped by` (przez coś)
- `men's issues` (**nie** `men problems`)
- reguła bez słownictwa: **jedna myśl = jedno zdanie, kropka jest darmowa**

**Łuk działu (9 grup):** G1 — zasiew resent + biased against → G2 — echo chamber + reinforce + feedback loop → G3 — distorted view + bitterness + determined by → G4 — naprawa rodzajników, przyimków, categorize + hierarchy → G5 — otwarcia/atrybucja + streszczenia 6 akapitów recyklingujące targety G1–G4 → **G6 (scenka) — prowadzenie lekcji i ratowanie rozmowy**, zakończone dwoma wierszami składanki → G7 — tnij długą myśl na dwa krótkie zdania → G8 — chunki i przyimki → **G9 (scenka) — odpowiadasz sam na pytania lektora**, dwa zdania na odpowiedź, podpowiedź PL celowo cienka.

**Wyjątek formatu:** scenki w K4 są dwie — G6 (prowadzenie lekcji) i G9 (odpowiadanie na
pytania), obie `<!-- mode: scenka -->`, pytanie EN → podpowiedź PL → odpowiedź EN.
G1–G5, G7 i G8 zostają drylem `pl2en`. Utrzymuje to regułę metody K („ostatnia grupa
symuluje realną rozmowę") — tak samo kończą się K1, K2 i K3. Kontraktu pilnuje
`tools/k4-content.test.mjs` w obie strony: dryl nie może się zamienić w scenkę,
a G6 i G9 nie mogą przestać nimi być. Test pilnuje też długości zdań w G7–G9
(max 12 słów na zdanie; wiersz G7 i G9 albo rozbity na dwa zdania, albo mieszczący
się w jednym na max 10 słów).

**Lekki klej z K1 (bez obowiązku):** `It's sort of like...`, `I'm blanking on the word`, `I should have mentioned...`, `What ... most is ...`, `I'd say...`, `What I mean is...` — wchodzą naturalnie w G5. Pozostałe zaplanowane powroty przesunięto dalej.

## K5 - Mów o tym, czego nikt nie udowodnił / Talk About What Nobody Can Prove

**Źródło:** film z YouTube wybrany przez Krzyśka — Patrick Boyle, *„Epstein – Follow The
Money!"* (`https://www.youtube.com/watch?v=CbJSgan4mfQ`, 37:38, 2025-07-26). Transkrypt
angielski pobrany `yt-dlp` (5138 słów); nie wchodzi do repo.

**Pierwszy dział K oparty o materiał, którego nie dał lektor.** Cel Krzyśka: umieć
swobodnie o tym filmie rozmawiać — omawiać, budować zdania i wnioski. Prosił wprost
o **frazy, czasowniki i budowanie zdań**, nie o egzotyczne słownictwo i idiomy.

**Diagnoza:** film przez 37 minut robi językowo jedną rzecz — opowiada historię, w której
nic nie jest udowodnione. Każde zdanie o nim musi nieść, KTO to twierdzi i JAK PEWNE to
jest. Polski robi to całymi zdaniami („mówi się, że… ale to nie zostało udowodnione…
więc nie wiadomo, czy to prawda"), angielski wciska tę samą treść w **jedno gniazdo
wewnątrz zdania** (`reportedly`, `allegedly`, `there's no hard evidence that…`). To jest
znany problem Krzyśka („pięć zdań zamiast jednego") w wersji tematycznej — i najtańsza
możliwa naprawa. Drugie wąskie gardło: **pytanie zależne** (`how he made his money`,
nie *how did he make*), które w tym temacie padnie w rozmowie pięć razy.

**Nadbudowa nad K4:** K4 zasiał atrybucję na poziomie „cytuję tekst" (`According to the
article…`, `In their view…`). K5 buduje piętro wyżej — **stopniowanie pewności wewnątrz
jednego zdania**, bo o filmie z YouTube nie mówi się „według artykułu" przy każdym zdaniu.

**Nowe targety (13, w kolejności ROI):**

- `No one really knows how…` / `It's still not clear where…` (pytanie zależne)
- `reportedly` (doniesienia o faktach) / `allegedly` (nieudowodnione zarzuty)
- `There's no hard evidence that…` / `There's no proof he ever…`
- `It's basically a video about…` / `Long story short, …`
- `What I don't get is…` / `What gets me is…` / `What struck me was…` (zdanie rozszczepione)
- `…, which is why…` / `…, which is exactly why…`
- `apparently` (wierzę) vs `supposedly` (wątpię)
- `a fortune` / `to be worth $X` / `net worth`
- `His whole point is that…` / `He makes the case that…`
- `The numbers don't add up.` / `It doesn't add up.`
- `I'm not saying X — I'm just saying Y.`
- `If I had to guess, …` / `It's more likely that…`
- `I wouldn't go that far.` / `That's a bit of a stretch.`

**Warstwa treści:** dryl siedzi w warstwie pieniądze / dziennikarstwo / czego-nie-wiadomo.
Przestępstwa i teorie spiskowe wchodzą **wyłącznie w mowie zależnej** jako cudze
twierdzenia — kontynuacja zasady atrybucji z K4. W scence to lektor rzuca mocną tezą
(„I heard he was blackmailing half of Washington"), a zadaniem ucznia jest **grzecznie
się nie zgodzić i powołać na brak dowodów**.

**Świadomie odrzucone:** `shrouded in secrecy`, `fertile ground for`, `underscore the
mystery`, `a trove of`, `cast doubt on`, `opaque`, `a vacuum of transparency` — to język
PISANY Boyle'a. Krzysiek tego nie powie na głos, więc nie wchodzi do drylu.
Z tego samego powodu `be said to have + III forma` została w notatce, a nie w drylu:
użyje jej raz na rozmowę, a `reportedly` dziesięć razy.

**Łuk działu (5 grup, 75 par — 16/16/15/14/14):** G1 — pieniądze i to, czego nikt nie wie
(`fortune → worth → net worth` 5 wierszy, `no one really knows / it's still not clear` 4,
potem splot: `No one really knows how much he was actually worth`) → G2 — kto co twierdzi
(`reportedly` 4 + powrót, `allegedly` 3, `apparently` 2, `supposedly` 3, para kontrastowa
`reportedly … — and … supposedly …`, teza autora) → G3 — brak dowodu i stopniowanie
pewności (`no hard evidence / no proof` 5, `add up` 4, `if I had to guess` 2, grzeczna
niezgoda 2) → G4 — **grupa-kompresor**: zero nowej leksyki, same struktury zdaniowe
(`What I don't get is…` ×4, `…, which is why…` ×4, `I'm not saying X — I'm just saying Y`)
→ **G5 (scenka) — lektor pyta o film**, od streszczenia jednym zdaniem po grzeczną
niezgodę i domknięcie wnioskiem.

**Trzy iteracje recenzji (A poprawność · B naturalność · C wierność+przeplatanie):**
13 → 5 → 0 błędów krytycznych. Najkosztowniejsza poprawka strukturalna: rozdzielenie
polskiego „podobno" na cztery rozłączne wyzwalacze (patrz uwaga niżej). Najkosztowniejsza
poprawka treściowa: wycięcie z drylu `be said to have + III` i `a distorted view of
reality` — pierwsze to rejestr agencji prasowej, drugie było wypełniaczem.

**Wyjątek formatu:** G5 jest jedyną scenką w K5 (`<!-- mode: scenka -->`); G1–G4 to dryl
`pl2en`. Kontraktu pilnuje `tools/k5-content.test.mjs` w obie strony.

**Uwaga projektowa o polskiej kolumnie:** polskie „podobno" pokrywa naraz `reportedly`,
`supposedly` i `apparently` — czyli dokładnie tę trójkę, którą G2 ma rozdzielić. Dlatego
wyzwalacze są rozłączne: „według doniesień" → `reportedly`, „rzekomo" → `allegedly`,
„niby" → `supposedly`, „najwyraźniej" → `apparently`. Bez tego grupa nie działa.

**Lekki klej (bez obowiązku):** z K1 `I'd say…`, `What I mean is…`,
`to get my point across`; z K3 `common knowledge`; z K4 `According to the New York
Times…`, `Fair enough`, `I'd only be guessing`. Pozostałe 28 powrotów zaplanowanych
pierwotnie na `k5` przesunięto na `k6` (świeże z K4) i `k7` (starsze z K1–K3) —
wciśnięte w ten temat byłyby wypełniaczem.

## K6 - Pięć przecieków / The Five Leaks

**Źródło:** transkrypcja lekcji 2026-08-13 (64 min, rozmowa o manosferze i teoriach
spiskowych) — `~/Movies/2026-08-13 18-31-54 — transkrypcja.md`. Pełna diagnoza:
`docs/diagnoza-2026-08-13-top-bledy.md`.

**Pierwszy dział K zbudowany nie wokół TEMATU, tylko wokół BŁĘDÓW.** Materiał źródłowy
posłużył wyłącznie do diagnozy; zdania drylowe są w innym świecie (korki, kanał, MadreM),
bo target ma działać wszędzie, nie tylko w rozmowie o incelach.

**Diagnoza (5 soczewek analizy + 3 adwersarzy, ranking po ROI):** pięć targetów wybranych
z dziesięciu kandydatów. Odrzucone m.in.: anakolut (lektor robi to samo), „or something"
(lektor 7×, Krzysiek 15× — styl, nie poziom), „za dużo and/so/but" (lektor ma `so` 108×
na 5306 słów wobec 49× u Krzyśka). Ustalenie negatywne: **strona bierna jest zdrowa** —
nie budować na niej działu.

**Targety (w kolejności ROI):**

- rodzajniki `a / the / zero` (~25 usterek na godzinę — najgęstszy błąd nagrania)
- pytanie zależne: `I don't know what the reason is` (jedna reguła bez wyjątków)
- strefa nierzeczywista: `must have / couldn't have / if it weren't for` + warunek mieszany
  (w 4080 słowach: `would have` 0×, `must have` 0×, wszystkie `if` to warunki realne)
- wiązki ratunkowe: `I'm blanking on the word` / `What's the word for it in English?`
- hedging poza `I think`: `I'd say / I suppose / I tend to / arguably / I get the impression`

**Rozmiar — świadome odstępstwo od kontraktu 10–18 par na grupę:** 6 grup po 7–8 par
(44 pary łącznie) wobec 93–95 w K4/K5. Powód jest wprost od Krzyśka: „nie nadążam się
ich uczyć na następną lekcję". Kurs, którego nie da się skończyć przed lekcją, ma ROI zero.

**Wyjątek formatu:** G6 to scenka (`<!-- mode: scenka -->`), splatająca wszystkie pięć
targetów; G1–G5 to dryl `pl2en`, każda grupa = jeden target.

**Lekki klej:** z K1 `I'm blanking on the word`, `It's sort of like…`, `I'd say…`,
`I should have…`; z K5 `No one really knows how…`, `I wouldn't go that far`. Pozostałe
47 powrotów zaplanowanych na `k6` przesunięto na `k7` — to słownictwo tematyczne K4/K5
(incel, misogyny, echo chamber, radicalization), które w dziale o błędach byłoby
wypełniaczem. **Uwaga na przyszłość:** rejestr planuje powroty szybciej, niż działy są
w stanie je wchłonąć — przy K7 warto go przejrzeć, a nie znowu przesuwać.

## K7 - Masoni / The Freemasons

**Źródło:** cztery własnoręczne mapy myśli Krzyśka, narysowane po angielsku w przygotowaniu
do wypowiedzi na lekcji — skan `~/Downloads/Zeskanowany dokument 6.pdf`, 4 strony.
Nie transkrypt lekcji, nie materiał od lektora: **jego własne notatki**.
Od 2026-08-18 drugie źródło: transkrypcja samej lekcji
(`~/Movies/2026-08-17 18-38-00 — transkrypcja.md`, 55 min 33 s) → Grupy 7–8, patrz niżej.

**Powrót do budowania z TEMATU po dziale zbudowanym z BŁĘDÓW.** K6 wziął materiał źródłowy
wyłącznie do diagnozy i przeniósł dryl w inny świat. K7 robi coś przeciwnego, bo prośba
brzmiała dosłownie: „chcę umieć tłumaczyć to zgodnie z moimi notatkami". To ten sam wzorzec
co K2 i K4 — dział pod arkusz trenuje arkusz.

**Kluczowa obserwacja o materiale źródłowym — mapy myśli nie mają kleju narracyjnego.**
Między „AMERYKA" a „EUROPA" jest strzałka, nie zdanie. Na kartce strzałka wystarcza,
na głos nie — i to jest realna dziura, przez którą wypowiedź rozsypuje się na lekcji.
Dryl uczy cegieł; przejść nie uczy nikt. Stąd nowy element formatu, patrz niżej.

**Targety (w kolejności ROI):**

- rodzajniki przy nazwach historycznych (`the Declaration of Independence`,
  `the French Revolution`, `the Enlightenment` vs `Enlightenment ideas`, `the Illuminati`,
  zero przy `Freemasonry`) — poletko testowe dla `articles-system` z K6, najgęstszego
  błędu nagrania, na żywym tekście zamiast na ćwiczeniu
- `might have been + -ing` — piętro nad `must have` / `couldn't have` z K6; polskie „mogli"
  nie ma czasu, więc Polak ucieka w `might be pulling`
- atrybucja cudzej tezy: `It's said that` / `claiming that` / `supposed` / `supposedly` —
  trzecie piętro linii K4 (`According to the article`) → K5 (`reportedly / allegedly`)
- łańcuch przyczynowy `sparked` / `led … to` / `resulted in X being Y` — Polak zna jeden
  czasownik (`caused`), angielski ma trzy; `result in` nigdy nie bierze zdania z `that`
- `originated from` / `evolved into` / `dedicated to`, ramowane przez `over time` / `eventually`
- imiesłów zamiast `which was`: `ideas discussed in lodges`, `symbols seen on buildings`
- `involved in` / `linked to` / `remains a central theme in`, oraz `including` zamiast
  „for example there are…"
- most między akapitami: `As with America, we see something similar in Europe`

**Rozmiar:** 8 grup, 81 par (9/11/10/10/14/7/12/8) — pierwotnie 6 grup i 61 par;
G7–G8 dorobione po lekcji, patrz blok „Dodanie Grup 7–8".

**Wyjątek formatu — Grupa 5 to RECITAL, nowy tryb w kursie K.** Cały monolog w czternastu
taktach, w kolejności map I→II→III→IV. Kolumna polska to **hasła z mapy myśli, nie pełne
zdania** („Kamieniarze, katedry — i stąd wzięli się masoni"), bo takim bodźcem Krzysiek
będzie dysponował na lekcji. Kolumna angielska dokłada wyłącznie klej, którego notatki
nie mają: `So, …`, `Now, …`, `Take America, for example`, `For one thing, …`,
`Here's the thing, though`, `Even today, …`, `But to me, …`. Test pilnuje trzech rzeczy:
kolejności map, pokrycia wszystkich czterech, i **braku duplikatów wobec Grup 1–4** —
bo kopiuj-wklej z drylu oznaczałby, że kleju nie ma. Grupa 5 jest zwolniona z reguły
„otwarcie do 8 słów" (o pierwszym takcie decyduje monolog, nie drabinka trudności).
G1–G4 to dryl `pl2en`, każda grupa = jedna mapa. Scenki są dwie — G6 (obrona map
w rozmowie) i G8 (irrealis, dodana po lekcji) — a test pilnuje ich przez
`SCENKI = new Set([6, 8])` w obie strony i **egzekwuje reguły scenki dla każdej
z osobna** (`filter`, nie `find` — pierwotna wersja testu sprawdzała tylko pierwszą).

**Test wierności notatkom** (`tools/k7-content.test.mjs`, tablica `KANON`): wszystkie
**23 zdania z czterech map** muszą paść w kolumnie angielskiej. Bez tego trzy iteracje
recenzji odsunęłyby rozdział od skanu i nikt by tego nie zauważył. To najważniejsza
asercja działu i pierwsza tego typu w kursie.

**Przegląd rejestru — wykonany, nie przesunięty.** Sekcja K6 ostrzegała: „rejestr planuje
powroty szybciej, niż działy są w stanie je wchłonąć — przy K7 warto go przejrzeć, a nie
znowu przesuwać". Na `k7` zaplanowanych było **90 powrotów**; 61 par ich nie zmieści.
Zostało **15**, wybranych nie po dacie, tylko po dopasowaniu do materiału: `articles-system`,
`must-have`, `embedded-question`, `arguably`, `comes-down-to` (k6); `no-one-really-knows`,
`no-hard-evidence`, `apparently-supposedly`, `wouldnt-go-that-far`, `not-saying-just-saying`
(k5); `according-to-the-article`, `lead-to`, `only-be-guessing`, `tnij-na-dwa` (k4);
`id-say` (k1). Pozostałe **75 usunięto bez zastępnika** — żadne nie zostało przesunięte
na `k8`, bo każde miało już ≥3 zaplanowane powroty. To słownictwo tematyczne cudzych
działów (kintsugi z k2, Kraków i przedmieścia z k3, incel/manosfera z k4–k5); wróci wtedy,
gdy przyszły dział trafi w temat, dopisane świadomie.

**Nowe wyrażenia:** 45 wpisów `intro: k7` (32 z map przy budowie działu + 13 z lekcji przy
G7–G8), każdy z `review[]` na **maksymalnie trzy** działy zamiast dziesięciu. Klocki
strukturalne (conditionale, `there were no`) dostają dwa–trzy powroty, słownictwo
tematyczne (`masonic-lodge`, `founding-father`, `conspiracy-theory`, leksyka lockdownu)
jeden.

**Ograniczenie narzędzia, do zapamiętania:** `check-recykling.js` dopasowuje **słowa**, nie
**gramatykę** — buduje słowa kluczowe z pola `en` wpisu w rejestrze. Powroty strukturalne
(`must have`, pytanie zależne, rodzajniki, `tnij-na-dwa`) wracają w K7 z inną leksyką,
bo na tym polega wydobycie, więc checker ich nie widzi i zgłasza FAIL. Weryfikuje je
`tools/k7-content.test.mjs` (tablica `POWROTY`, regexy zamiast słów kluczowych). K6 ma
ten sam FAIL z tego samego powodu.

**Jedno odstępstwo od kanonu, świadome i zgłoszone:** mapa IV Krzyśka ma
`hidden elites could control a NWO`. Recenzja wykazała, że przy pisowni wielką literą
`a New World Order` jest wewnętrznie sprzeczne — wielka litera robi z tego nazwę własną,
a `a` ją odbiera. W rozdziale jest `the New World Order`; regex kanonu przyjmuje oba
warianty, żeby odstępstwo było jawne, a nie ciche. Wszystkie pozostałe 22 punkty map
są dosłowne.

**Trzy recenzje (opus) — co znalazły ponad zwykły przegląd:**
`mason` = MURARZ; polskie „mason" to wyłącznie `Freemason`, a rozdział w pierwszej wersji
nie ostrzegał o tym ani słowem (najgroźniejszy fałszywy przyjaciel działu). Kolumna polska
w Grupie 3 sabotowała własny target — rozdział pisał „polskie »mogli« nie ma czasu"
i mimo to dawał cue bez kotwicy czasowej; wszystkie wyzwalacze dostały „wtedy" /
„przez całe dekady". Blok EUROPA z mapy II (most + rewolucja francuska) nie miał ani jednej
pary do wyprodukowania — istniał tylko w recitalu; dosypano dwie pary do Grupy 2.

**Lekki klej:** patrz lista 15 powrotów wyżej — wszystkie padają w Grupach 4–6.

**Dodanie Grup 7–8 (2026-08-18):** 6 grup → 8 grup, 61 → 81 par. Lekcja o masonach odbyła
się 2026-08-17 o 18:38 — niecałe dwie godziny po ostatniej przebudowie działu (pierwsza
wersja: 2026-08-15) — była więc czystym testem materiału na żywo. Wynik: kanon map zadziałał (monolog niósł całą lekcję), zawiodła
leksyka codzienna pod obciążeniem i cała strefa irrealis. Mapowanie diagnozy na grupy:

| co zawiodło NA ŻYWO | timestamp | grupa |
|---|---|---|
| szukał „władz" dwa razy — doszedł do `authority`, lektor dołożył liczbę mnogą | 24:32–26:09 | G7 |
| „restrictions went… were cut off… lighter" zamiast `eased/loosened` | 49:13–49:23 | G7 |
| „so I resigned" o rzuceniu gry (kalka „zrezygnowałem") | 54:52 | G7 |
| szukał „dobrowolnie" — lektor podał `of your own free will` / `on your own terms` | 38:36–39:10 | G7 |
| „getting fines for walking" | 49:23 | G7 |
| „they made a hospital from it" (stadion → szpital polowy) | 53:09 | G7 |
| „parks taped around" | 49:39 | G7 |
| „there was special hours for old people" | 47:48 | G7 |
| „there was no people dying" | 47:27 | G7 |
| „walk with other person on the sidewalk" | 48:06 | G7 |
| **zero 2nd/3rd conditionali w całych 55 minutach** (grep: 0 trafień) | — | **G8** |

G7 = dryl `pl2en` (12 par, lockdown COVID + domknięcie masońskie o ujawnianiu się
`of his own free will`). G8 = scenka (8 wymian): każde pytanie lektora stoi w 2nd/3rd
conditional, podpowiedź PL wymusza gdybanie w odpowiedzi; dwa pytania celowo recyklingują
`the authorities` i `taped off` z G7 (dlatego targety lekcji żyją w testowej tablicy
`TARGETY_LEKCJA`, osobnej od `TARGETS` — reguła „scenka nie podaje targetu w pytaniu"
ich nie obejmuje). Czarna lista błędów z lekcji pilnowana testem per zdanie, granice słów.
Nowe testy: `TARGETY_LEKCJA`, czarna lista, wymuszenie irrealis w G8 (każda odpowiedź
z `would`, ≥5 z 8 w 3rd conditionalu), pytanie 4/3/2 dla każdej grupy.

## Dalszy rozwój

K8 i kolejne działy dostaną temat z następnej rozmowy lub materiału od lektora.

**Stan rejestru po przeglądzie przy K7:** korek został rozładowany tylko na `k7`.
Horyzont dalej jest fikcją — `k8` ma zaplanowane 72 powroty, `k9` 79, `k12` 71, `k18` 67,
a wpisy sięgają `k26` przy siedmiu istniejących działach. Reguła do zastosowania przy K8,
zanim znowu urośnie: **`review[]` trzyma najwyżej dwa najbliższe działy**, a wszystko
zaplanowane dalej niż `k9` — wyciąć. Powrót ma być zasłużony treścią, nie zaplanowany
na ślepo cztery lata naprzód.
