# Angielski — odtwarzacz audio

Prosta, statyczna strona do słuchania rozdziałów (audio + PDF). Dostęp z telefonu i każdego
komputera. Estetyka jak `~/Desktop/plan`.

## Lokalnie

```bash
npm run serve     # generuje oba manifesty i serwuje na http://localhost:8000
# albo:
npm run build:k   # tylko odśwież k-content.json
```

Kurs M działa pod `index.html`. Niezależny Kurs K działa pod `k.html` i korzysta wyłącznie
z katalogu `K/`, rejestru `K/slownik-k.json` oraz manifestu `k-content.json`.

## Dodanie nowego rozdziału

1. Wrzuć folder `NN-slug/` z `rozdzial.md` (nagłówek `# Polski / English`) i `rozdzial.pdf`.
2. Wygeneruj audio (skill `angielski-rozdzial`) — powstanie **format 2**:

```
NN-slug/
  rozdzial.md
  rozdzial.pdf
  audio.json              opis wszystkich par (wersja: 2)
  audio/
    g1-p01-cue.mp3        wyzwalacz: PL + cisza na Twoją produkcję
    g1-p01-en.mp3         wzorzec: zdanie EN + przerwa
    …
```

3. `npm run build` (odświeża `content.json` / `k-content.json`).
4. `git add -A && git commit -m "rozdział NN" && git push` → Render sam się przebuduje.

UI jest sterowane danymi — nowy rozdział pojawia się automatycznie, bez zmian w kodzie.

### Dwa formaty audio

| | format 1 (stary) | format 2 (nowy) |
|---|---|---|
| pliki | `grupa-1.mp3` … (~3 min każdy) | `audio/g{N}-p{NN}-{cue,en}.mp3` (po ~5–15 s) |
| opis | brak — skaner czyta nazwy plików | `audio.json` z tekstem każdej pary |
| fraza na ekranie | nie | tak (karta + ekran blokady) |
| gdzie | 39 działów Kursu M | 3 działy Kursu K |

Oba formaty działają równolegie i w tym samym odtwarzaczu — dział bez `audio.json` idzie
starą ścieżką. **Grupy słuchanki zostają jednym plikiem** także w formacie 2: nie ma tam
ciszy na produkcję, więc cięcie nic by nie dało; `audio.json` trzyma zamiast tego offsety zdań.

Istniejący dział formatu 1 przenosisz na format 2 przez `node tools/potnij.js <katalog działu>`
(najpierw `--na-sucho`). Narzędzie tnie ffmpegiem bez rekompresji i **bez ani jednego
wywołania TTS**; działa na zasadzie „cały dział albo nic".

## Wdrożenie na Render (Static Site)

Folder `~/angielski` nie jest częścią repo katalogu domowego, więc zrób z niego osobne repo:

```bash
cd ~/angielski
git init && git add -A && git commit -m "init: odtwarzacz audio"
# utwórz repo na GitHub i wypchnij (git remote add origin … ; git push -u origin main)
```

Na Render: **New → Blueprint** (wykryje `render.yaml`) albo **New → Static Site** ręcznie:

- Publish Directory: `.`
- Build Command: `npm run build`

Render serwuje HTML, `content.json`, MP3 i PDF-y. Strona jest **publiczna** (każdy z linkiem wejdzie).

## Na iPhonie

- Otwórz adres w Safari → udostępnij → **Dodaj do ekranu głównego** (ikona). Ikona otwiera
  stronę w Safari.
**Działy formatu 2 (Kurs K)** — cztery stany pętli, przełączane przyciskiem ↻:

| stan | co robi |
|---|---|
| **wył.** | gra parę po parze do końca grupy i staje |
| **para** | zapętla jedną parę (wyzwalacz → wzorzec → wyzwalacz…) — dryl jednego zdania |
| **grupa** | z ostatniej pary wraca na pierwszą |
| **cały** | po ostatniej parze przechodzi do następnej grupy (z zawinięciem) |

Przyciski **⇤ / ⇦ chodzą po parach**, nie po grupach: ⇦ przeskakuje na wyzwalacz następnej
pary, ⇤ wraca na wyzwalacz bieżącej (a jeśli minęły mniej niż 2 s — na poprzednią parę).
Oba działają też z ekranu blokady. Na ekranie blokady i na karcie widać aktualną frazę:
przy wyzwalaczu polskie zdanie, przy wzorcu — angielskie. **Angielskie nigdy nie pokazuje
się w trakcie ciszy** — inaczej dryl zamienia się w czytanie.

**Działy formatu 1 (Kurs M)** — trzy stany, bez zmian:

- **Pętla „jedna"** (domyślna): graj grupę, zablokuj telefon — gra w nieskończoność. To
  najpewniejszy tryb (natywne `audio.loop`, obsługiwane przez silnik mediów iOS).
- **Pętla „cały"**: przechodzi przez grupy rozdziału. Przy zablokowanym ekranie przeskok między
  grupami może wymagać tapnięcia **Następny** na ekranie blokady (ograniczenie iOS).

## Pliki

```
index.html              szkielet + element <audio> + pasek odtwarzacza
app.js                  router + silnik audio + Media Session
style.css               estetyka (te same tokeny co ~/Desktop/plan)
content.json            GENEROWANY manifest rozdziałów (nie edytuj ręcznie)
tools/generate.js       skaner folderów -> content.json
tools/generate-k.js     skaner katalogu K -> k-content.json
k.html / k-app.js       osobny interfejs i odtwarzacz Kursu K
pary.js                 wspólna logika par: kolejka, przejścia pętli, opis na ekran blokady
                        (czyste funkcje — używają jej oba odtwarzacze)
tools/potnij.js         migracja działu z formatu 1 na 2 (ffmpeg, bez TTS)
tools/build-podglad.js  generator podglad.html (nauka + gwiazdkowanie + eksport do Anki)
tools/make-icons.js     generator ikon PNG (uruchom przy zmianie ikony)
manifest.webmanifest    nazwa + ikony (PWA)
icons/                  ikony PNG (ekran główny + okładka na ekranie blokady)
render.yaml             konfiguracja Render
```
