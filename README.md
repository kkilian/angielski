# Angielski — odtwarzacz audio

Prosta, statyczna strona do słuchania rozdziałów (audio + PDF). Dostęp z telefonu i każdego
komputera. Estetyka jak `~/Desktop/plan`.

## Lokalnie

```bash
npm run serve     # generuje content.json i serwuje na http://localhost:8000
# albo:
node tools/generate.js   # tylko odśwież content.json
```

## Dodanie nowego rozdziału

1. Wrzuć folder `NN-slug/` z `rozdzial.md` (nagłówek `# Polski / English`), `rozdzial.pdf`
   i plikami `grupa-1.mp3`, `grupa-2.mp3`, … (audio może też leżeć w podfolderze, np. `aa/`).
2. `npm run build` (odświeża `content.json`).
3. `git add -A && git commit -m "rozdział NN" && git push` → Render sam się przebuduje.

UI jest sterowane danymi — nowy rozdział pojawia się automatycznie, bez zmian w kodzie.

## Wdrożenie na Render (Static Site)

Folder `~/angielski` nie jest częścią repo katalogu domowego, więc zrób z niego osobne repo:

```bash
cd ~/angielski
git init && git add -A && git commit -m "init: odtwarzacz audio"
# utwórz repo na GitHub i wypchnij (git remote add origin … ; git push -u origin main)
```

Na Render: **New → Blueprint** (wykryje `render.yaml`) albo **New → Static Site** ręcznie:

- Publish Directory: `.`
- Build Command: `node tools/generate.js`

Render serwuje HTML, `content.json`, MP3 i PDF-y. Strona jest **publiczna** (każdy z linkiem wejdzie).

## Na iPhonie

- Otwórz adres w Safari → udostępnij → **Dodaj do ekranu głównego** (ikona). Ikona otwiera
  stronę w Safari.
- **Pętla „jedna"** (domyślna): graj grupę, zablokuj telefon — gra w nieskończoność. To
  najpewniejszy tryb.
- **Pętla „cały"**: przechodzi przez grupy rozdziału. Przy zablokowanym ekranie przeskok między
  grupami może wymagać tapnięcia **Następny** na ekranie blokady (ograniczenie iOS).

## Pliki

```
index.html              szkielet + element <audio> + pasek odtwarzacza
app.js                  router + silnik audio + Media Session
style.css               estetyka (te same tokeny co ~/Desktop/plan)
content.json            GENEROWANY manifest rozdziałów (nie edytuj ręcznie)
tools/generate.js       skaner folderów -> content.json
tools/make-icons.js     generator ikon PNG (uruchom przy zmianie ikony)
manifest.webmanifest    nazwa + ikony (PWA)
icons/                  ikony PNG (ekran główny + okładka na ekranie blokady)
render.yaml             konfiguracja Render
```
