# Streaming-Neuheiten

Statische Webseite, die pro Monat zeigt, welche Filme und Serien in Deutschland neu zu
**Netflix, Disney+, Prime Video und RTL+** dazugekommen sind.

## Aufbau

```
packages/data-collector   Holt Katalogänderungen und schreibt Monats-JSONs
packages/frontend         Vite + React, liest ausschließlich die fertigen JSONs
```

Ein täglicher GitHub-Actions-Job ruft den Collector auf, committet die neuen Daten zurück
und deployt das Frontend auf GitHub Pages.

## Datenquelle

Einzige Quelle ist die
[Streaming Availability API](https://docs.movieofthenight.com/resource/changes)
(`/v4/changes`, `country=de`). Sie liefert Katalog-Neuzugänge samt Titel, Beschreibung,
Genres und Bewertung. Die Texte werden in zwei Durchläufen geholt (`output_language=de`
und `en`), damit die Oberfläche zweisprachig bleibt.

Bewusst **ohne Poster**: die Bild-URLs der API sind laut
[Doku](https://docs.movieofthenight.com/guide/images) nur 6–12 Monate gültig und wären im
wachsenden Archiv nach und nach tote Links.

**Wichtige Einschränkung:** Die Changes-Schnittstelle liefert nur ein Fenster von ±31 Tagen.
Historische Monate lassen sich deshalb nicht nachtragen — das Archiv wächst ab dem ersten
Lauf. Fällt der Cron-Job länger als 31 Tage aus, entsteht eine Lücke.

## API-Key

Der Key ist kostenlos und wird nur im Collector verwendet, nie im Browser. Konto auf
<https://developers.movieofthenight.com/> anlegen (Free-Plan, 1.000 Requests/Monat, keine
Zahlungsdaten). Der Collector verbraucht rund 500 Requests im Monat.

Lokal in eine `.env` im Wurzelverzeichnis (nicht eingecheckt):

```
STREAMING_API_KEY=...
```

In GitHub unter *Settings → Secrets and variables → Actions* denselben Namen als
Repository-Secret hinterlegen.

## Befehle

```bash
npm install
npm run collect   # Daten holen und Monats-JSONs schreiben
npm run dev       # Frontend lokal starten
npm run build     # Produktions-Build nach packages/frontend/dist
```

## Rechtliches

Inoffizielles, nicht-kommerzielles Projekt. Netflix, Disney+, Prime Video und RTL+ sowie alle
Titel und Marken gehören ihren jeweiligen Rechteinhabern.
