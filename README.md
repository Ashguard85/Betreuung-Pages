# v56 – saubere Historie und Update-Reihenfolge

- Bearbeitete Termine speichern ab jetzt den Vorher- und Nachher-Zustand.
- „Letzte Änderungen“ zeigt konkret Betreuung, Zeitraum und Bemerkung als `von → auf`.
- Alte History-Einträge bleiben erhalten und lesbar; es wird nichts gelöscht.
- Reines erneutes Speichern ohne fachliche Änderung erzeugt keinen zusätzlichen „Geändert“-Eintrag.
- Beim PWA-Start wird zuerst nach der neuesten Online-Version gesucht; erst danach wird ein wartender Worker aktiviert. Dadurch werden vermeidbare Zwischenversions-Sprünge verhindert.
- Updates bleiben weiterhin vor laufenden Schreibvorgängen/Formularen geschützt.

# v55 – zuverlässige PWA-Update-Erkennung

- Behebt die Race Condition beim Erkennen eines bereits laufenden `installing` Workers.
- Der manuelle Update-Check wartet jetzt bis zu 12 Sekunden auf `installed/waiting` statt pauschal nur 900 ms.
- `register()` prüft unmittelbar `waiting` und `installing`, auch wenn `updatefound` schon vor dem Listener ausgelöst wurde.
- Updates werden weiterhin nicht aggressiv mitten in einer Benutzersitzung aktiviert.

# v54 – Jahreskalender Runtime-Fix

- Behebt `entry is not defined` aus v53 im Jahreskalender.
- Die vollflächige Darstellung mehrtägiger Fortsetzungstage aus v53 bleibt unverändert.

# v53 – mehrtägige Einträge vollflächig im Jahresplan

- Reine Fortsetzungstage nutzen jetzt die ganze Betreuungsfläche der Zelle.
- Liegt am selben Tag zusätzlich ein eigener Eintrag, bleiben beide kompakt sichtbar.
- Am Endtag bleibt eine konkrete Endzeit sichtbar.

# v52 – kompakte Fortsetzungen im Jahresplan

- Bei mehrtägigen Einträgen zeigt ein vollständiger Zwischentag im Jahresplan nur noch den Namen, z. B. `Vreni`.
- Am letzten Tag bleibt eine konkrete Endzeit sichtbar, z. B. `Vreni · bis 12:00`.
- Liste und Detailansicht bleiben unverändert ausführlich.

# v51 – Mehrtägige Betreuung mit Von-/Bis-Datum

- Einzelne Betreuungseinträge können jetzt einen echten Start- und Endzeitpunkt über mehrere Kalendertage haben.
- Beispiele: 15.08. 19:00 → 16.08. 22:00 und 15.08. 07:00 → 20.08. 12:00.
- Bei Terminen mit Uhrzeit zeigt die Maske zusätzlich **Bis · Datum** mit dem nativen Datumspicker.
- Bestehende Übernacht-Einträge bleiben kompatibel: alte 22:00–05:00-Termine werden bei der Datenbankmigration automatisch auf den Folgetag abgebildet.
- Liste, nächste 7 Tage und Jahresübersicht zeigen Fortsetzungen an allen betroffenen Tagen.
- CSV, JSON-Backup/Restore, PDF und iCalendar verwenden das echte Enddatum.
- Ganztägige Einträge und die Batch-Erstellung bleiben unverändert.
- Keine vorhandenen Einträge, Personen, Tokens oder Einstellungen werden gelöscht.

# v50 – Datumspicker für Von/Bis

- Alle Datumsfelder besitzen jetzt einen sichtbaren Kalender-Button.
- Besonders die Von-/Bis-Felder lassen sich damit eindeutig per nativer Datumsauswahl öffnen.
- Der bisherige native Date-Input über das gesamte Feld bleibt erhalten.
- `showPicker()` wird genutzt, wenn der Browser es unterstützt; iOS/ältere Browser erhalten einen Focus/Click-Fallback.
- Keine Änderung an IndexedDB, localStorage, Serverdaten oder fachlicher Terminlogik.

# v48 – Navigation-/Service-Worker-Fix

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


## Diagnose ohne Serververbindung
Der blockierende Verbindungsdialog zeigt ab v48 immer die geladene PWA-Version und die Version des aktiven Service Workers. Die Anzeige funktioniert ohne Backend/Cloudflare-Verbindung. Über „PWA-Update prüfen“ kann direkt aus diesem Dialog eine Updateprüfung angestoßen werden.
