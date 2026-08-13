# Betreuung PWA – GitHub Pages v42

Diese Version behebt die Navigation unter einer strikten Content-Security-Policy. Inline-`onclick`-Handler wurden entfernt und durch CSP-sichere Event-Listener ersetzt. Der Service-Worker-Cache wurde auf v42 erhöht.


Dieses Repository enthält **nur das statische Frontend**. Es enthält keine SQLite-Daten, keine Flask-App und keine Cloudflare-Zugangsdaten.

Beim ersten Start fragt die PWA nach:

- Datenserver, z. B. `https://betreuung.example.net`
- Cloudflare Access Client ID
- Cloudflare Access Client Secret

Die Werte werden lokal im Browser/der installierten PWA in IndexedDB gespeichert. Das Secret ist damit nicht im Git-Repository, aber es hat nicht die Schutzstufe des nativen iOS-Keychain. Pro iPhone ein eigenes Cloudflare Service Token verwenden.

## GitHub Pages aktivieren

1. Neues **öffentliches** GitHub-Repository erstellen.
2. Inhalt dieses ZIPs in die Repository-Wurzel pushen.
3. `Settings → Pages`.
4. `Source: Deploy from a branch`.
5. Branch `main`, Ordner `/(root)`.
6. Danach optional unter `Custom domain` die gewünschte Domain eintragen, z. B. `betreuung2.example.net`.
7. Bei Cloudflare DNS einen CNAME für `betreuung2` auf `<DEIN-GITHUB-NAME>.github.io` setzen.
8. HTTPS in GitHub Pages erzwingen.

Die Serveradresse wird **nicht** im Code fest eingebaut; sie wird auf jedem Gerät einmal eingegeben.

## iPhone/iPad

GitHub-Pages-URL in Safari öffnen → Teilen → Zum Home-Bildschirm → Als Web-App öffnen. Beim ersten Start Server + Service Token eintragen.

## Sicherheit

- Keine Secrets committen.
- Pro Gerät ein eigenes Service Token.
- Token bei Geräteverlust in Cloudflare widerrufen.
- Repository möglichst klein halten und keine Drittanbieter-Skripte ergänzen.
- Die eigentliche Docker-App bleibt hinter Cloudflare Access.
