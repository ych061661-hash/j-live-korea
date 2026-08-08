# J-Live Korea

Static production files for [j-live.kr](https://j-live.kr).

## Cloudflare Pages

- Production branch: `main`
- Build command: none
- Build output directory: `/`
- Root directory: `/`

Cloudflare Pages reads `_redirects` and `_headers` directly from the repository.

## Local event admin

The event manager is local-only and never deployed as a public admin page.

```powershell
node tools/admin-server.js
```

Open `http://127.0.0.1:4173`. Pending automation results can be edited, verified,
approved, cancelled, or rejected. Approval writes `calendar/data/events.json` and
regenerates SEO pages. Production changes still follow the normal Git and
Cloudflare Pages deployment flow.

## Email alerts

The email alert backend lives in `alerts-worker/`. It uses Cloudflare Workers
Cron Triggers, D1, and Resend to send verified subscribers alerts for new
concerts, presales, general sales, and additional seat releases. See
`alerts-worker/README.md` for setup and deployment.
