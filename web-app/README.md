# Hymn web app

Node.js maintenance desk for the hymn library. It lists hymns from the existing API and has add and delete routes ready to wire up.

## Run

From `web-app`:

```bash
npm install
copy .env.example .env
npm run dev
```

Open http://localhost:3001

The hymn API should already be running (`npm run api` from the repo root) so the list can load.

| Path | Purpose |
|------|---------|
| `GET /health` | Web app health check |
| `GET /api/hymns` | Proxy to the hymn API list |
| `POST /api/hymns` | Add a hymn (not wired to storage yet) |
| `DELETE /api/hymns/:id` | Delete a hymn (not wired to storage yet) |
