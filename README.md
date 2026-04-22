# Workflow Planner

Moderne React-Webapp, die Google Tasks und Google Kalender in einer fokussierten Planungsoberflaeche zusammenfuehrt.

## Setup

1. In Google Cloud eine OAuth Client ID fuer eine Webanwendung erstellen.
2. Google Calendar API und Google Tasks API aktivieren.
3. `.env.example` nach `.env.local` kopieren und `VITE_GOOGLE_CLIENT_ID` setzen.
4. App starten:

```bash
npm install
npm run dev
```

## GitHub Pages

Die App ist fuer GitHub Pages als Repository-Seite unter `/Workflow/` konfiguriert.

1. In GitHub unter `Settings > Pages` als Source `GitHub Actions` auswaehlen.
2. Unter `Settings > Secrets and variables > Actions > Variables` eine Repository Variable anlegen:
   `VITE_GOOGLE_CLIENT_ID=deine-client-id.apps.googleusercontent.com`
3. In Google Cloud beim OAuth Web Client als Authorized JavaScript Origin eintragen:
   `https://<github-user>.github.io`
4. Push auf `main` startet `.github/workflows/deploy.yml` und deployed `dist/`.

Wenn das Repository nicht `Workflow` heisst oder eine eigene Domain genutzt wird, muss `base` in `vite.config.ts` passend geaendert werden.

## Funktionen

- Google OAuth im Browser ueber Google Identity Services.
- Alle Tasklisten und alle lesbaren Kalender laden.
- Tasks erstellen, bearbeiten, abhaken und mit Google Tasks synchronisieren.
- Termine erstellen, bearbeiten und per Drag-and-drop verschieben.
- PWA App-Shell mit Offline-Start.
- Zuletzt synchronisierte Daten werden offline read-only angezeigt.

## Checks

```bash
npm test
npm run build
```
