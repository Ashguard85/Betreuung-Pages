# Cloudflare Access / CORS

Für die Access Application deines Datenservers (Beispiel `https://betreuung.example.net`) brauchst du zwei Zugangswege:

- **Allow** für deinen normalen OTP-Zugang
- **Service Auth** für das jeweilige iPhone-Service-Token

Da diese PWA von einer anderen Domain kommt, muss Cloudflare den anonymen CORS-Preflight am Edge beantworten. Verwende als erlaubten Origin ausschließlich deine GitHub-Pages-Custom-Domain, z. B.:

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

Im Portainer-Container exakt denselben Origin setzen:

```text
PWA_ALLOWED_ORIGIN=https://betreuung2.example.net
AUTH_ENABLED=false
```

`AUTH_ENABLED=false` ist wichtig, weil Cloudflare Access hier die Authentifizierung übernimmt. Andernfalls würde Flask zusätzlich seine eigene Login-Session verlangen.

`/calendar.ics` kann von Apple Kalender keine Cloudflare-Custom-Header erhalten. Falls du Kalender-Abos nutzt, den bereits vorhandenen gezielten Bypass für genau diesen Pfad plus langen iCal-Token beibehalten.
