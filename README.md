# J-Live Korea

Static production files for [j-live.kr](https://j-live.kr).

## Cloudflare Pages

- Production branch: `main`
- Root directory: `/`
- Build command: `node tools/build-site.js`
- Build output directory: `dist`

Cloudflare Pages uploads the generated `dist/` directory. The build copies only
the public root files and `calendar/`; local tools, tests, Markdown sources, and
the admin UI are excluded. `_redirects` and `_headers` are copied into `dist/`
for Pages to apply during deployment.

## Local event admin

The event manager API runs locally and is not a production backend. The local
admin UI is intentionally excluded from the production artifact; verify
`/tools/admin/` returns 404 after the first deployment using this build config.
`noindex` alone is not access control.

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
