# v47 – Navigation-/Service-Worker-Fix

- Direkte Aufrufe von `service-worker.js`, `manifest.webmanifest`, Icons und anderen Dateien werden nicht mehr fälschlich auf `index.html` umgeschrieben.
- Nur die eigentliche App-Start-URL (`/` bzw. `index.html` innerhalb des Pages-Scopes) verwendet den Offline-App-Shell-Fallback.
- `version.txt` liefert die veröffentlichte Pages-Version als einfache Diagnose.
- Einmalige Cache-Recovery wurde auf v43–v46 erweitert.

# v46 – iOS Cache-Recovery / sichere Folgeupdates

**Ursache des Safari/PWA-Unterschieds:** Seit v43 wurde die Navigation der installierten PWA absichtlich cache-first. Auf iOS konnte dadurch ein alter aktiver Worker mitsamt v43/v44/v45-App-Shell weiterlaufen, während Safari bereits die aktuelle Hosting-Version verwendete. Cross-Origin-API-Requests wurden vom Worker nie abgefangen; betroffen war die geladene Frontend-Version selbst.

**v46 behebt das so:**
- Einmalige Self-Healing-Aktivierung beim Upgrade von v43-v45 auf v46.
- Keine `clients.claim()`-Übernahme und kein automatischer Reload mitten in der laufenden Sitzung.
- Beim nächsten Start wird v46 aus seinem eigenen atomaren Shell-Cache geladen.
- Künftige vollständig heruntergeladene Updates werden beim nächsten sicheren App-Start automatisch aktiviert.
- `Jetzt aktualisieren` aktiviert kontrolliert und lädt höchstens einmal neu.
- Statische Dateien werden nur noch aus dem Cache der aktiven Version gelesen; alte Versions-Caches können nicht versehentlich Assets liefern.
- Cross-Origin-Backend-Requests bleiben vollständig außerhalb des Service Workers.

# Betreuung PWA – GitHub Pages v46

## v45 – Service-Token sicher ersetzen

- Der Verbindungstest im Setup läuft jetzt unabhängig vom globalen Online-/Backend-Status der App. Ein abgelaufener oder falscher alter Token kann dadurch den Test eines neuen Tokens nicht mehr beeinflussen.
- Der Test verwendet die im Dialog eingegebene Server-URL, Client ID und das neue Client Secret direkt.
- Nach erfolgreichem Speichern werden die Daten ohne `location.reload()` neu geladen; offene Navigation und der Service-Worker-Updatezustand werden dadurch nicht unnötig verändert.
- Beim Löschen der Verbindung bleibt die App-Shell geöffnet und fordert direkt zur Neueingabe auf, statt einen Reload auszulösen.
- Cloudflare-/CORS-/HTML-Fehler werden als kurze verständliche Diagnose angezeigt statt als rohe HTML-Seite.
- Bei einer Netzwerk-/CORS-Störung nennt die Meldung gezielt `PWA_ALLOWED_ORIGIN`, Cloudflare `OPTIONS` und `Service Auth` als Prüfpunkte.


## Robuste Offline-/Update-Architektur

- Die komplette statische App-Shell (`index.html`, JS, CSS, Manifest, Icons und Offline-Seite) wird versioniert lokal gecacht.
- Navigation verwendet die aktive App-Shell **cache-first**. Ein temporärer GitHub-Pages-Ausfall verhindert deshalb nach erfolgreicher Installation den App-Start nicht.
- API-Aufrufe bleiben unabhängig davon normale HTTPS-Aufrufe zum konfigurierten Docker-Backend. Ist das Backend nicht erreichbar, bleibt die App-Shell offen und Schreib-/Serveraktionen werden deaktiviert; die Verbindung wird periodisch erneut geprüft.
- Neue Service Worker laden die nächste App-Shell vollständig im Hintergrund, bleiben danach aber `waiting`. Es gibt **kein automatisches `skipWaiting()` und kein `clients.claim()`**.
- Ein laufender Client wird nicht automatisch neu geladen. Im Setup erscheint bei einem Update „Neue Version verfügbar“ plus „Jetzt aktualisieren“.
- Der Button aktiviert nur nach Benutzeraktion und blockiert bei laufenden Schreib-/Importvorgängen bzw. offenen Dialogen. Ein `controllerchange` darf nur nach dieser bewussten Aktion genau einen Reload auslösen.
- Ohne Button wird die neue Version nach dem normalen Schließen/Neustart der PWA aktiv, sobald keine alte Client-Sitzung mehr läuft.
- IndexedDB mit Server/Cloudflare-Zugangsdaten wird nicht verändert oder gelöscht.

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


## v45: iPhone-PWA / Cloudflare Diagnose

Der Verbindungsdialog zeigt den tatsächlichen `location.origin` und ob die App als Home-Screen-PWA läuft. Cloudflare-Preflight sollte bevorzugt mit **Bypass OPTIONS requests to origin** zum Flask-Backend durchgereicht werden. Das Backend v45 unterstützt `PWA_ALLOWED_ORIGINS` als kommaseparierte Liste; `PWA_ALLOWED_ORIGIN` bleibt kompatibel.
