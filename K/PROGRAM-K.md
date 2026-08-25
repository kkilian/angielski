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

## K7 - Cztery dziury / Four Gaps

**Przepisany od zera 2026-08-22.** Poprzednia wersja — 81 par w 8 grupach o masonach,
zbudowana z czterech własnoręcznych map myśli — leży w commicie `805ecde`.

**Źródło:** pomiar, nie temat. Trzy transkrypcje lekcji (2026-08-03 kintsugi,
2026-08-13 manosfera, 2026-08-17 masoni), ~9200 słów mowy spontanicznej Krzyśka po
odsianiu fragmentów czytanych z artykułu na głos.

**Co pokazał pomiar.** Twarde metryki stoją w miejscu: udział w rozmowie 49→50→50%,
bogactwo słownictwa (TTR na próbce 2000 słów) 0,229→0,243→0,242. Pozorny skok tempa
w 08-17 okazał się własnością formatu lekcji, nie postępem — lektor poruszył się
identycznie (43→39→54 vs 45→39→53 słów/min). Rośnie piętro abstrakcji tematu
i strategia omijania luki opisem; **gramatyka nie rusza się wcale**:

| dziura | dane |
|---|---|
| strefa irrealis | `would have` 0×, `could have` 0×, `I wish` 0×, `unless` 0× |
| czasy Perfect | past perfect 0×, present perfect ~2× |
| rodzajniki | „different culture", „you have problem", „made hospital from it", „It is conspiracy theory" |
| mgła zamiast precyzji | „or something" 51×, „right?" 57×, „I think" 69×, „I feel like" 20× |

Ostatni wiersz to jego własna diagnoza z 08-03 (`01:00:18`): *„I sometimes feel like
I'm going in circles — I want to describe something but I can't find a way to say it
in one sentence instead of five."*

**Odwrotka, która jest tu najciekawszym faktem.** K6 zbudowany z BŁĘDÓW → K7 zbudowany
z TEMATU (mapy myśli) → K7 przepisany z powrotem z BŁĘDÓW. Wersja tematyczna zadziałała
na żywo — monolog z map poniósł całą lekcję 08-17 i to jest ustalenie, nie porażka.
Ale dział pod temat nie trenuje niczego poza tym tematem, a diagnoza pokazała cztery
dziury konstrukcyjne, które przeżyły trzy lekcje bez zadrapania. Prośba brzmiała
dosłownie: „krótszy, celujący w moje słabości, drylujący je mocno i boleśnie".

**Rozmiar:** 4 grupy × 8 par = **32 pary** (było 81). Po jednej grupie na dziurę,
5 wierszy zasiewu + 3 splotu.

| grupa | cel | tryb |
|---|---|---|
| G1 | irrealis: 3rd / mieszany / `I wish` / `unless` / `if it hadn't been for` | `pl2en` |
| G2 | perfekty: past perfect, `by the time`, present perfect z `since`/`for`, `must have` | `pl2en` |
| G3 | rodzajniki: brak `a` (×5), potem `a`→zero, `the`→`a`, `a`→`the` | `pl2en` |
| G4 | precyzja: `or something` (×5), potem `right?`, `I feel like`, własna diagnoza | `pl2en` |

**Format karty: taki sam jak w każdym innym dziale (decyzja z 25.08).** Wszystkie
cztery grupy idą w `pl2en` — polski cue, cisza, wzorzec EN.

Pierwsza wersja (22.08) stawiała G3 i G4 w trybie `en-only`: kolumna pierwsza trzymała
**dosłowny cytat z lekcji** z datą i znacznikiem czasu, w kształcie klapsa filmowego —
`August 3rd, 6:14 — you said, "it's completely different culture." Add the missing article.`
Technicznie działało (`en-only` istnieje w `assemble-audio.js`, a `build-podglad.js:342`
eksportuje kolumnę 1 jako przód karty), ale **odpadło po zderzeniu z użyciem**: w Anki
przód karty czytał się jak protokół z posiedzenia, a nie jak zdanie do wypowiedzenia,
i łamał nawyk wspólny wszystkim pozostałym działom kursu. Do tego dochodził priming —
nagranie odtwarzało błąd pewnym głosem native'a.

Wniosek szerszy niż ten dział: **cel dydaktyczny („to są TWOJE błędy") nie usprawiedliwia
zmiany interfejsu karty.** Materiał może pochodzić z transkrypcji; kształt karty ma zostać
jeden. Ślad po błędzie żyje w tabeli metryki w rozdziale — do przeczytania raz —
a nie w tym, co Krzysiek powtarza codziennie.

Odrzucona po drodze była też **`scenka`**: `build-podglad.js:332` eksportuje do Anki
`plPL = plain(row.prompt)`, czyli samą podpowiedź polską, więc pytanie lektora nie
trafiłoby na kartę wcale.

**`CYTATY` zastępuje `KANON` jako najważniejszy test działu.** Stary test gwarantował,
że rozdział uczy dokładnie jego notatek (23 zdania z map). Nowy gwarantuje, że dryluje
dokładnie jego błędy: 16 wpisów `{grupa, wiersz, data, czas, cytat, blad}`, każdy
zweryfikowany dosłownie w transkrypcji przed wpisaniem. Po zmianie formatu cytat nie
stoi już na karcie, więc test pilnuje dwóch rzeczy: że **tabela metryki** w rozdziale
dokumentuje wszystkie 16 (data, znacznik, plik transkrypcji) i że `blad` nigdy nie wraca
w kolumnie odpowiedzi (granice słów, nie `includes`, bo każdy błąd jest podłańcuchem
swojej poprawnej wersji).

Wiersze 3/4 i 4/4 dzielą znacznik `00:53:09` — jedna wypowiedź o stadionie zamienionym
na szpital polowy, dwa różne błędy naraz. Dlatego unikalność jest egzekwowana na
cytacie, nie na znaczniku.

**Pozostałe nowe testy:** G1 wymusza irrealis (każda odpowiedź, ≥5 z 8 w pełnym 3rd
conditionalu, zakaz `if … would` w jednym zdaniu); G2 wymusza perfekty (≥5 past perfect,
≥3 present perfect, zero wierszy w samym past simple); G3 zasiew pięciu dostawionych `a`
plus trzy kontrasty per wiersz; G4 — wiersze 2–4 mają polskie przybliżenie („jakieś",
„mniej więcej"), które **musi** wyjść jako `about` / `around` / `roughly`, żadna odpowiedź
nie niesie mgły i **każda jest dokładnie jednym zdaniem** (sedno grupy); każdy wyzwalacz
jest polski i bez 4-wyrazowego wspólnego ciągu z odpowiedzią.

**Zabezpieczenie przed cloze.** `tools/k67-luki.js` migruje notatki K6/K7 z EN ≥21 słów
i ≥1 klockiem `<b>` na typ `angielski-k-luka`. Nowe karty mają zostać klasyczne, więc
test trzyma każdą odpowiedź **≤20 słów** i nie wpuszcza `<b>` do tabel par. Bez tego
ponowne uruchomienie migracji zmieniłoby typ świeżych notatek.

**Operacja na rejestrze — 45 wpisów `intro: k7` rozłożone na trzy stosy:**

- **19 skasowanych bez zastępnika** — czysta leksyka masońska (`stone-mason`,
  `masonic-lodge`, `founding-father`, `pull-political-strings`, `desire-for-order`,
  `originate-from`, `evolve-into`…). Precedens: przy budowie K7 wycięto tak 75 wpisów.
- **21 przeniesionych na `intro: k8`** — klocki strukturalne (`its-said-that`,
  `claiming-that`, `result-in`, `might-have-been-doing`, `supposed-adj`, `involved-in`,
  `linked-to`, `lead-sb-to-do`, `including-lista`) plus leksyka, której Krzysiek szukał
  NA ŻYWO na lekcji 08-17 (`ease-restrictions`, `get-fined-for`, `taped-off`,
  `the-elderly`, `of-your-own-free-will`, `on-your-own-terms`, `another-person`,
  `there-were-no`) plus trzy klocki konwersacyjne. **To nie jest materiał masoński —
  to realnie nauczone rzeczy z zaplanowanymi powrotami.** Skasowanie ich razem
  z tematem byłoby cichą stratą programu; test pilnuje, że jedenaście z nich dalej
  istnieje w rejestrze.
- **5 zostało jako `k7`**, bo ich `en` nadal pada w nowym rozdziale: `the-authorities`
  (G1/w4), `turn-into` (G3/w4), `give-up-quit` (G1/w3), `conspiracy-theory` (G3/w2),
  `third-conditional` (G1/w1–5).

Do tego **16 nowych wpisów** `intro: k7` (conditionale, perfekty, trzy reguły rodzajnika,
zamienniki mgły), każdy z `review[]` na najwyżej trzy działy. Razem 21 — próg testu to 20.

**Powroty na k7 skurczone z 15 do 7**: `articles-system` (G3 to jego dosłowny ciąg dalszy),
`must-have`, `comes-down-to`, `no-hard-evidence`, `id-say`, `tnij-na-dwa` oraz
`mixed-conditional` (wprowadzony w K6, drylowany w G1/w8). Pozostałe dziewięć
przestawione na `k8`.

**Świadome straty, zapisane, żeby za miesiąc nie wyglądały na przeoczenie:**
kanon 23 zdań z map myśli (K7 przestaje gwarantować wierność notatkom Krzyśka),
leksyka masońska, 295 powtórek historii w Anki przy kasowaniu starych 81 kart
(interwały były płytkie: mediana 2 dni, maks 11), oraz materiał tematyczny do rozmowy
o masonach — PDF i 162 mp3 zostają wyłącznie w commicie-snapshotcie.

**Odstępstwo od skilla, świadome:** `angielski-rozdzial/SKILL.md` każe 10–18 par
na grupę; K7 ma 8. Kontraktem kursu K są jego testy (stara G6 miała 7 par), a przy
czterech celach i 32 parach 8 to minimum, przy którym zasiew 5 + splot 3 w ogóle działa.


## K8 - Pięć sufitów / Five Ceilings

**Zbudowany 2026-08-24, tego samego dnia co transkrypcja i diagnoza lekcji.** Wzorzec: K7
(dryl własnych błędów), ale cel wybrany INACZEJ — nie „cztery dziury zmierzone na trzech
lekcjach", tylko Top 5 z jednej diagnozy, ważonej po ROI przez trzech adwersarzy.

**Źródło:** `~/Movies/2026-08-24 18-27-47 — transkrypcja.md` (56 min lekcji z lektorem, ok. 22 min
i ~4000 słów mowy Krzyśka poza czytaniem artykułu). Diagnoza dopisana na końcu tego pliku:
5 soczewek (gramatyka, słownictwo, płynność, dyskurs, postęp od 13.08) + 3 sędziów CEFR równolegle
→ 29 kandydatów → 3 adwersarzy (sceptyk ASR, egzaminator, trener ROI) → ranking. **Poziom: B2−**
(sędziowie: „B1+ na progu B2" / „IELTS ≈ 6.5" / „dolne B2"). Trzy z pięciu targetów diagnoza
nazywa dosłownie SUFITEM (Grammar, Lexical Resource, Range) — stąd tytuł.

**Postęp od 13.08 wyznaczył metodę.** Dryle na ZAMKNIĘTĄ REGUŁĘ przeniosły się do mowy w dwa
tygodnie (pytanie zależne 6:2 → 2:6 na korzyść poprawnych; „how do you call it" 0×). Dryle na
SYSTEM (rodzajniki: bez zmian, ~28 usterek) i na ZACHOWANIE (irrealis: `would have` / `must have`
dalej 0×; pytanie o słowo: forma lepsza, zachowanie bez zmian) — forma wykuta, mowa nietknięta.
Dlatego K8 wraca do rodzajników i irrealis po K7, ale nie regułą i nie gdybaniem z podręcznika:
rodzajniki na JEGO zdaniach z 24.08 w pięciu ramach, irrealis jako przeróbka JEGO narracji
o akademiku na `must have`.

**Rozmiar: 5 grup × 8 par = 40 kart** (decyzja Krzyśka; K7 = 32).

**Tryb: `pl2en` we wszystkich pięciu grupach (od 2026-08-25).** Pierwotny zamysł był mieszany —
BŁĘDY (rodzajniki G1, przyimki G4) jako cytaty do poprawienia w trybie `en-only`, UNIKANIA
(słowo brakujące, rejestr ocen, irrealis) jako produkcja z polskiego. Połowa `en-only` odpadła
razem z tym samym eksperymentem w K7: **cel dydaktyczny nie usprawiedliwia zmiany interfejsu
karty.** Materiał dalej pochodzi z transkrypcji, ale kształt karty jest jeden przez cały kurs.
Szczegóły i wnioski: sekcja K7.

Dryl błędu przeżył zmianę trybu, bo przeniósł się do **polskiego cue jako pułapka**: G4 podaje
polski przyimek, który tłumaczy się NIE tak, jak podpowiada odruch („w telewizji" → `on TV`,
„na patelni" → `in a pan`, „do przedmiotów" → `for`), a G1 korzysta z tego, że polski w ogóle
nie ma rodzajników. Test pilnuje tych pułapek per wiersz (`PULAPKI_PL`).

| G | target (typ, częstotliwość na godzinę JEGO mowy) | tryb |
|---|---|---|
| 1 | rodzajnik przed policzalnym l.poj. w pięciu ramach: `a bit of a`, `it was a`, `was a <zawód>`, `the same as an`, `a N-minute`, `there was a`, `make a mess`, `another` (błąd, 50–76/godz.) | `pl2en` |
| 2 | słowo codzienne zamiast apelu do lektora — principal, janitor, elementary school, dorm, feature, em dash, dead giveaway, take advantage of, let it go, could only get better + wiązki `I'm blanking on the word` / `I'm not sure how to put it` / `sort of like` (unikanie, 11 zatrzymań w 22 min) | `pl2en` |
| 3 | rejestr ocen zamiast terrible ×6 / nice ×6 / weird ×6 / crazy / bullshit — nasty, filthy, run-down, in rough shape, a disaster, a disgrace, depressing, decent, upscale, well kept, pricey, grew on me, brutal (unikanie) | `pl2en` |
| 4 | przyimek i kolokacja 1:1 z polskiego — in TV → on TV, on universities → at, on the pan → in a pan, using it to → for, generates me → for me, allowed me to participate → let me take the exam, in these days → these days, get to → get into (błąd, 16–25/godz.) | `pl2en` |
| 5 | strefa irrealis — must have + III ×5, couldn't have been worse, 3rd conditional z kotwicą czasową, If I had to guess + might have been -ing (unikanie, 0× w 4000 słów drugi raz z rzędu) | `pl2en` |

**Cytaty (16) — najważniejszy test działu, jak w K7.** Każdy zweryfikowany dosłownie w transkrypcji
z numerem linii (`tools/k8-content.test.mjs`, tablica `CYTATY`); `blad` nigdy nie wraca w odpowiedzi;
tabela proweniencji w `## Typowe błędy Polaka`. Po przejściu na `pl2en` cytat nie stoi już na karcie —
test wiąże go z wierszem, którego wzorzec go prostuje, i wymusza obecność w tabeli metryki.
Decyzje przy doborze, które przeżyły: (1) trzy cytaty z „fucking terrible" (00:09:56, 00:26:58, 00:31:03) świadomie NIE weszły
do kart — wulgaryzm na przodzie karty czytany przez TTS; rejestr ocen idzie w nowym kontekście.
Wiersz 1/1 (00:01:06) padł w rozmowie z ChatGPT przed lekcją — zostaje, bo to jego zdanie, a błąd
wrócił trzy razy w kwadrans. Dwie poprawki z diagnozy odrzucone jako brytyjskie: `sit the exam`
→ `take the exam`, `neighbourhood` → `neighborhood` (test ma strażnika BrE).

**Wyzwalacze pl2en sprawdzane OSOBNYM recenzentem D** (lekcja K6: „Chyba tak" wyciąga `I think
so`). Kotwice: G2 rzeczownik o jednym odpowiedniku (*woźny*, *podstawówka*, *funkcja aplikacji*,
*długi myślnik*); G3 przymiotnik konkretny (*paskudny*, *zasyfiony*, *zapuszczony*, *w opłakanym stanie*,
*z wyższej półki*; „z czasem SAMA zaczęła mi się podobać" przenosi podmiot na rzecz → `it grew on me`) i zakaz *okropny/straszny/fajny/dziwny/szalony* w cue (test); G5 każde *musiał* z ogonem
wnioskowania („— inaczej…", „bo…", „tylko nikt nie wie") zamykającym `had to`, zakaz *może/pewnie/
chyba/myślę* w cue (test), 3rd conditional z kotwicą *w październiku*.

**Recenzja (4 agenty Opus, 2026-08-24/25):** A poprawność — 7 × BŁĄD, wszystkie tej samej klasy co
w K7: polecenie en-only NIE zapowiadało zmiany, którą odpowiedź robiła (scalenie zdań, `15`→`fifteen`,
wycięte `Because` / `Now` / `then`). Naprawa po stronie POLECENIA (albo cytat przycięty tak, by zmiana
nie była potrzebna — G4/w7 bez „Now"). B naturalność — rejestr G3 był słownikowy i brytyjski
(`grim`, `squalid`, `a shambles`) → wymiana na `nasty` / `filthy` / `in rough shape` / `depressing` /
`a disaster`, strażnik w teście; polecenia en-only przepisane z „etykiet kompilatora" na zdania
lektora. D wyzwalacze — 8 × BŁĄD: „funkcja" → `function` (u matematyka pierwszy odruch) → „ficzer";
„pewny znak" → `a sure sign` zabijał `dead giveaway` → „zdradza na kilometr"; „Nie wiem, jak to ująć"
ciągnęło `I don't know` → „Nie jestem pewien"; „trochę jak" → `a bit like` → „coś jakby";
„skorzystała z okazji" → `took the opportunity` → „wykorzystała to, że…" (dopełnienie zdaniowe
wymusza `take advantage of`); „z czasem ją polubiłem" → `I grew to like it` → podmiot na rzecz;
„mogli palić" = POZWOLENIE → „niewykluczone, że palili"; G5/w2 ogon „inaczej włączałby się" był
zgodny z obowiązkiem → dopisany dowód „a nie odezwał się ani razu". C wierność — pierwsza próba padła
na limicie sesji, powtórzona po poprawkach. Klaps z datą w cue (B: „balast w audio") ZOSTAJE —
to konwencja K7, którą Krzysiek przyjął.

**Testy (`tools/k8-content.test.mjs`, 25):** port K7 (struktura 5×8, 4/3/2 ×5, CYTATY, ≤20 słów
i zero `<b>` = poniżej progu cloze, otwarcie ≤8, najdłuższa w ostatniej trzeciej, kalki K7,
hedging) + nowe: ramy rodzajników per wiersz G1; leksyka i trzy wiązki ratunkowe G2 (+ negatyw
na „what do you call it" i fałszywych przyjaciół *academic/gymnasium/minus*); strażnik monokultury
G3 (zero terrible/nice/weird/crazy/bullshit/fucking), zasiew = same negatywy, splot = negatyw +
pozytyw; poprawka per wiersz G4 + jedno zdanie + zero mgły (z `you know`); sloty G5 (must have ×5
bez `had to`, couldn't have been worse, 3rd cond z przecinkiem przed `would`, If I had to guess +
might have been -ing); czarna lista kalek 24.08 i `I don't know` w odpowiedziach; strażnik BrE;
rejestr: powroty na k8 ≤20 i tylko realizowane, intro k8 ≥20 z `review` 1–2 i `en` padającym
DOSŁOWNIE w odpowiedzi, 16 skasowanych id nie może zmartwychwstać, horyzont ≤k9 dla wpisów sprzed K7.

**Operacja na rejestrze (`tools/k8-przytnij-rejestr.js`, dry-run domyślny) — poczekalnia
PRZYCIĘTA, nie przesunięta**, dokładnie tak, jak nakazywała sekcja „Dalszy rozwój" po K7:
- 16 wpisów `intro: k8` SKASOWANYCH: `i-guess-so` (furtka „Chyba tak"), klocki strukturalne
  z masonów (`involved-in`, `linked-to`, `including-lista`, `lead-sb-to-do`, `result-in`,
  `its-said-that`, `claiming-that`, `supposed-adj`), leksyka lockdownu z lekcji 08-17
  (`ease-restrictions`, `get-fined-for`, `taped-off`, `the-elderly`, `of-your-own-free-will`,
  `on-your-own-terms`) i `second-conditional` (G5 poszła w must have / 3rd cond).
  Test K7 `wymagane` zawężony z 11 do 5 id z komentarzem.
- 5 wpisów `intro: k8` ZOSTAŁO z odświeżonym przykładem z K8: `another-person`, `there-were-no`,
  `might-have-been-doing`, `not-sure-how-to-put-it`, `honestly`.
- Powroty na k8: 60 → **9** (`articles-system`, `must-have`, `couldnt-have`, `blanking-on-word`,
  `sort-of-like`, `commute`, `if-i-had-to-guess`, `no-one-really-knows` + `let-it-go`, który
  planu nie miał, a K8 go realizuje — zapis faktu, nie długu). 52 wycięte BEZ zastępnika
  (leksyka tematyczna K2–K5, frazy prowadzenia rozmowy z K4, `a-few`, `embedded-question`,
  `if-it-werent-for`, `mixed-conditional`, `tend-to`, `arguably`, `wouldnt-have`).
- 39 nowych `intro: k8`, każdy `review: [k9, k10]`, `en` = dosłowna fraza z odpowiedzi (lekcja
  K7: przykłady z wielokropkami nie dają się pogrubiać ani sprawdzać).
- Reguła globalna WYKONANA: dla wpisów sprzed K7 przyszłe powroty = najwyżej {k8 jeśli
  realizowany, k9}; dla intro k7/k8 — dwa najbliższe zaplanowane. Wpisy sięgające `k26` obcięte.
  Horyzont po operacji: k9 = 110, k10 = 46, k11 = 11, k12 = 4, dalej nic.

**Anki:** `tools/k8-do-anki.js` → `tmp/k8-grupa-{1..5}.json` → `angielski-k::K8::Grupa N`,
klasyczny typ `angielski-pl-en`, audio z kursu (zero TTS), 40 kart. Kontrola kolizji pola `PL`
z wszystkimi 120 notatkami `angielski-pl-en` / `angielski-k-luka` PRZED importem: zero.

**Świadome straty:** 16 wpisów wyżej po nazwie; 52 powroty bez zastępnika; `check-recykling.js`
daje FAIL na `sort-of-like`, `no-one-really-knows`, `couldnt-have` (dopasowuje słowa z przykładów:
„It's sort of like…", „She couldn't have known" — dział ma `sort of like a prison`, `couldn't have
been worse`), kontraktem jest tablica `POWROTY` w teście, jak przy K6/K7. Odstępstwo od skilla:
8 par na grupę zamiast 10–18 — to samo uzasadnienie co K6/K7 (kurs, którego nie da się skończyć
przed lekcją, ma ROI zero).

## Dalszy rozwój

K9 dostanie target z następnej lekcji — po transkrypcji i diagnozie tym samym torem co K8
(workflow: 5 soczewek + 3 sędziów → 3 adwersarzy → ranking; rozdział z Top N po ROI).

**Poczekalnia k8 rozładowana przy K8 (2026-08-24), reguła „dwa najbliższe działy" jest teraz
w teście** (`k8-content.test.mjs`: dla wpisów sprzed K7 żaden powrót dalej niż k9). Ale objętości
reguła nie trzyma: `k9` ma zaplanowane **110** powrotów (39 nowych z K8 + 5 odświeżonych + wszystko,
co miało k9 wcześniej), `k10` 46. Przy K9 powtórzyć procedurę z `k8-przytnij-rejestr.js`:
zostawić ≤20 powrotów, które dział realizuje, resztę wyciąć bez zastępnika, a nie przesunąć na k10.
