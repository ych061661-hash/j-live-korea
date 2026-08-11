# J-LIVE email alerts Worker

This Worker stores verified subscriptions in Cloudflare D1 and checks J-LIVE's
published event data every hour. Email delivery uses Resend. Subscribers can
also opt in to a Monday morning summary of that week's general sales and
presales.

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

## GA4 가입 퍼널

프런트엔드는 이메일 주소를 GA4로 보내지 않고 아래 행동만 측정한다.

| 이벤트 | 의미 |
| --- | --- |
| `email_alert_form_view` | 가입 영역 노출 |
| `email_alert_signup_submit` | 인증 메일 요청 시도 |
| `email_alert_signup_sent` | 서버가 인증 또는 관리 연결 메일을 정상 발송 |
| `email_alert_verified` | 이메일 링크 인증 완료 |
| `email_alert_signup_error` | 관심 항목 누락, 알림 종류 누락 또는 요청 실패 |
| `email_alert_verification_error` | 만료되거나 잘못된 인증 링크 |
| `email_alert_preferences_update` | 기존 구독 알림 설정 변경 |
| `email_alert_unsubscribe` | 이메일 링크 또는 브라우저에서 구독 해지 |

GA4 관리 화면에서 최종 전환인 `email_alert_verified`를 주요 이벤트로 지정하고,
`form_view → signup_submit → signup_sent → verified` 순서로 퍼널을 확인한다.
