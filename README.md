# J-Live Korea

Static production files for [j-live.kr](https://j-live.kr).

## Cloudflare Pages

- Production branch: `main`
- Build command: none
- Build output directory: `/`
- Root directory: `/`

Cloudflare Pages reads `_redirects` and `_headers` directly from the repository.

## Local event admin

The event manager API runs locally and is not a production backend. The current
Cloudflare Pages configuration is documented with the repository root (`/`) as
its output directory, which means source files under `tools/` may also be
served as static files unless the deployed project excludes them. The admin UI
and Markdown source files are marked `noindex`, but that is not access control.
Do not treat `/tools/admin/` as private until the production output excludes
`tools/` or an access-control layer is confirmed.

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
