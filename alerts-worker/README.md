# J-LIVE email alerts Worker

This Worker stores verified subscriptions in Cloudflare D1 and checks J-LIVE's
published event data every hour. Email delivery uses Resend.

Verified subscribers can request a one-time recovery link from another browser.
Opening it rotates the management token and syncs that browser's saved artists
and events without exposing the token in the server request URL.

## Setup

1. Verify the sending subdomain `notify.j-live.kr` in Resend.
2. Copy `wrangler.example.jsonc` to `wrangler.jsonc`.
3. Create the D1 database and place the returned ID in `wrangler.jsonc`.
4. Apply the migration.
5. Add the Resend key and a random unsubscribe-signing secret.
6. Deploy the Worker.

```powershell
Copy-Item alerts-worker/wrangler.example.jsonc alerts-worker/wrangler.jsonc
npx.cmd wrangler d1 create j-live-alerts
npx.cmd wrangler d1 migrations apply j-live-alerts --remote --config alerts-worker/wrangler.jsonc
npx.cmd wrangler secret put RESEND_API_KEY --config alerts-worker/wrangler.jsonc
npx.cmd wrangler secret put UNSUBSCRIBE_SECRET --config alerts-worker/wrangler.jsonc
npx.cmd wrangler deploy --config alerts-worker/wrangler.jsonc
```

The Worker route is `https://j-live.kr/api/alerts/*`. Cron runs hourly in UTC;
notification dates are calculated in `Asia/Seoul`. Do not commit API keys or
the generated `wrangler.jsonc` file.

Official references:

- Cloudflare Cron Triggers: https://developers.cloudflare.com/workers/configuration/cron-triggers/
- Cloudflare D1 Worker API: https://developers.cloudflare.com/d1/worker-api/
- Resend domain verification: https://resend.com/docs/dashboard/domains/introduction
- Resend send email API: https://resend.com/docs/api-reference/emails/send-email
