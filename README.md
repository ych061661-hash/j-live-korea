# J-Live Korea

Static production files for [j-live.kr](https://j-live.kr).

## Cloudflare Pages

- Production branch: `main`
- Root directory: `/`

Cloudflare Pages reads `_redirects` and `_headers` directly from the repository.
The existing production settings were documented as no build command and `/`
output. Before the next deployment, change them in the Pages project settings to:

- Build command: `node tools/build-site.js`
- Build output directory: `dist`

## Local event admin

The event manager API runs locally and is not a production backend. Once the
Pages build settings above are applied, the build script copies only the public
root files and `calendar/` into `dist/`; local tools, tests, Markdown source
files, and the admin UI are excluded. `noindex` is not access control; verify
`/tools/admin/` returns 404 after changing those Pages settings and deploying.

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
