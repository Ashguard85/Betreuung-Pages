# Cloudflare Access / CORS

Für die Access Application deines Datenservers (Beispiel `https://betreuung.example.net`) brauchst du zwei Zugangswege:

- **Allow** für deinen normalen OTP-Zugang
- **Service Auth** für das jeweilige iPhone-Service-Token

Da diese PWA von einer anderen Domain kommt, entsteht ein CORS-Preflight. Für iPhone/Home-Screen-PWAs ist die robusteste Variante, in der Access Application unter **Advanced settings → CORS** `Bypass OPTIONS requests to origin` zu aktivieren. Flask prüft den Origin danach selbst. Das vermeidet Unterschiede zwischen einer Browser-Sitzung und einer installierten PWA.

Die PWA zeigt im Verbindungsdialog ihren **aktuellen Origin** an. Genau dieser Origin muss im Backend erlaubt sein.

```text
https://betreuung2.example.net
```

Erlaubte Methoden:

```text
GET, POST, PUT, PATCH, DELETE, OPTIONS
```

Erlaubte Request-Header:

```text
Content-Type, CF-Access-Client-ID, CF-Access-Client-Secret
```

Exponierte Response-Header:

```text
Content-Disposition, Content-Type
```

Im Portainer-Container den angezeigten Origin setzen:

```text
PWA_ALLOWED_ORIGINS=https://betreuung2.example.net
AUTH_ENABLED=false
```

Falls eine bereits installierte PWA noch von einem älteren Host stammt, können mehrere **explizite** Origins kommasepariert erlaubt werden:

```text
PWA_ALLOWED_ORIGINS=https://betreuung2.example.net,https://ashguard85.github.io
```

`PWA_ALLOWED_ORIGIN` bleibt aus Kompatibilitätsgründen weiterhin unterstützt.

`AUTH_ENABLED=false` ist wichtig, weil Cloudflare Access hier die Authentifizierung übernimmt. Andernfalls würde Flask zusätzlich seine eigene Login-Session verlangen.

`/calendar.ics` kann von Apple Kalender keine Cloudflare-Custom-Header erhalten. Falls du Kalender-Abos nutzt, den bereits vorhandenen gezielten Bypass für genau diesen Pfad plus langen iCal-Token beibehalten.

## Apple-Kalender-Direktimport

Der Direktimport verwendet denselben `/calendar.ics`-Pfad wie das bestehende Apple-Kalender-Abo. Wenn dieser Pfad bereits exakt per Access-Bypass freigegeben und mit langem `ICAL_TOKEN` geschützt ist, ist **keine weitere Cloudflare-Regel** nötig. `/export.ics` muss nicht öffentlich freigegeben werden.
