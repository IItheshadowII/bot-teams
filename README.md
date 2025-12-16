# bot-teams

Bot para enviar IDs de AnyDesk a Teams Personal.

Descripción
---------
Este repositorio contiene un pequeño bot que automatiza el envío de IDs de AnyDesk a una cuenta de Teams Personal usando `enviar_teams.js`.

Cómo usar
--------
1. Instala dependencias:

```bash
npm install
```

2. Ejecuta:

```bash
npm start
```

Notas
----
- `puppeteer` puede descargar una versión grande de Chromium. Asegúrate de tener suficiente espacio.
- Si tu código requiere credenciales (webhooks, tokens), guárdalas en un archivo `.env` y no las subas al repositorio.
