import { buildEmailAlerts, normalizePreferences, renderAlertEmail } from "./logic.mjs";

const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...headers } });
const token = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const hash = async value => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))].map(byte => byte.toString(16).padStart(2, "0")).join("");
const base64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function hmac(env, value) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.UNSUBSCRIBE_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64url(signature);
}

async function unsubscribeToken(env, id) {
  return `${id}.${await hmac(env, id)}`;
}

async function verifyUnsubscribeToken(env, value) {
  const separator = value.lastIndexOf(".");
  if (separator < 1) return null;
  const id = value.slice(0, separator);
  const expected = await unsubscribeToken(env, id);
  return expected === value ? id : null;
}

function cors(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = new Set([env.SITE_URL, "http://127.0.0.1:18766", "http://localhost:18766"]);
  return allowed.has(origin) ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS", Vary: "Origin" } : {};
}

function validEmail(value) {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function sendEmail(env, payload, idempotencyKey) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey, "User-Agent": "J-LIVE-Alerts/1.0" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
  return response.json();
}

async function sendVerificationEmail(env, email, id, verifyToken) {
  const verifyUrl = `${env.API_URL}/verify?token=${encodeURIComponent(verifyToken)}`;
  const unsubscribeUrl = `${env.API_URL}/unsubscribe?token=${encodeURIComponent(await unsubscribeToken(env, id))}`;
  return sendEmail(env, {
    from: env.FROM_EMAIL,
    to: [email],
    subject: "[J-LIVE] 맞춤 알림 이메일을 인증해 주세요",
    html: `<p>J-LIVE 맞춤 알림 신청을 완료하려면 아래 링크를 눌러 주세요.</p><p><a href="${verifyUrl}">이메일 인증하기</a></p><p>신청하지 않았다면 <a href="${unsubscribeUrl}">신청 삭제</a>를 눌러 주세요.</p>`
  }, `verify-${id}-${await hash(verifyToken)}`);
}

async function sendRecoveryEmail(env, email, recoveryToken) {
  const recoveryUrl = `${env.API_URL}/recover?token=${encodeURIComponent(recoveryToken)}`;
  return sendEmail(env, {
    from: env.FROM_EMAIL,
    to: [email],
    subject: "[J-LIVE] 맞춤 알림 관리 연결",
    html: `<p>다른 브라우저에서 J-LIVE 맞춤 알림을 관리하려면 아래 링크를 눌러 주세요.</p><p><a href="${recoveryUrl}">이 브라우저에서 알림 관리하기</a></p><p>요청하지 않았다면 이 메일을 무시해 주세요. 기존 알림은 그대로 유지됩니다.</p>`
  }, `recover-${await hash(recoveryToken)}`);
}

async function subscribe(request, env) {
  const body = await request.json();
  if (!validEmail(body.email) || body.consent !== true) return json({ error: "이메일과 개인정보 수집 동의가 필요합니다." }, 422, cors(request, env));
  const preferences = normalizePreferences(body);
  if (!preferences.artists.length && !preferences.events.length) return json({ error: "관심 아티스트나 공연을 하나 이상 저장해 주세요." }, 422, cors(request, env));
  if (!preferences.kinds.length) return json({ error: "알림 종류를 하나 이상 선택해 주세요." }, 422, cors(request, env));

  const ipKey = await hmac(env, request.headers.get("CF-Connecting-IP") || "local");
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const rate = await env.DB.prepare("SELECT COUNT(*) AS count FROM signup_attempts WHERE ip_hash = ?1 AND created_at > ?2").bind(ipKey, cutoff).first();
  if (Number(rate?.count) >= 5) return json({ error: "요청이 너무 많습니다. 한 시간 뒤 다시 시도해 주세요." }, 429, cors(request, env));
  await env.DB.prepare("INSERT INTO signup_attempts (ip_hash, created_at) VALUES (?1, ?2)").bind(ipKey, new Date().toISOString()).run();

  const email = body.email.trim().toLowerCase();
  const existing = await env.DB.prepare("SELECT id, verified_at FROM subscriptions WHERE email = ?1").bind(email).first();
  if (existing?.verified_at) {
    const recoveryToken = token();
    await env.DB.prepare("UPDATE subscriptions SET recovery_hash=?1,updated_at=?2 WHERE id=?3")
      .bind(await hash(recoveryToken), new Date().toISOString(), existing.id).run();
    try {
      await sendRecoveryEmail(env, email, recoveryToken);
    } catch (error) {
      await env.DB.prepare("UPDATE subscriptions SET recovery_hash=NULL WHERE id=?1").bind(existing.id).run();
      throw error;
    }
    return json({ ok: true, existing: true, message: "등록된 주소입니다. 알림 관리 연결 메일을 보냈습니다." }, 202, cors(request, env));
  }

  if (existing) {
    const manageToken = token();
    const verifyToken = token();
    const now = new Date().toISOString();
    await env.DB.prepare("UPDATE subscriptions SET artists=?1,events=?2,kinds=?3,manage_hash=?4,verify_hash=?5,consent_at=?6,updated_at=?6 WHERE id=?7")
      .bind(JSON.stringify(preferences.artists), JSON.stringify(preferences.events), JSON.stringify(preferences.kinds), await hash(manageToken), await hash(verifyToken), now, existing.id).run();
    await sendVerificationEmail(env, email, existing.id, verifyToken);
    return json({ ok: true, manageToken, message: "인증 메일을 다시 보냈습니다." }, 202, cors(request, env));
  }

  const id = crypto.randomUUID();
  const manageToken = token();
  const verifyToken = token();
  const now = new Date().toISOString();
  await env.DB.prepare("INSERT INTO subscriptions (id,email,artists,events,kinds,manage_hash,verify_hash,consent_at,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?8,?8)")
    .bind(id, email, JSON.stringify(preferences.artists), JSON.stringify(preferences.events), JSON.stringify(preferences.kinds), await hash(manageToken), await hash(verifyToken), now).run();
  try {
    await sendVerificationEmail(env, email, id, verifyToken);
  } catch (error) {
    await env.DB.prepare("DELETE FROM subscriptions WHERE id = ?1").bind(id).run();
    throw error;
  }
  return json({ ok: true, manageToken, message: "인증 메일을 보냈습니다." }, 201, cors(request, env));
}

async function updateSubscription(request, env) {
  const body = await request.json();
  const manageHash = await hash(body.manageToken || "");
  const preferences = normalizePreferences(body);
  if (!preferences.kinds.length) return json({ error: "알림 종류가 하나 이상 필요합니다." }, 422, cors(request, env));
  const result = await env.DB.prepare("UPDATE subscriptions SET artists=?1,events=?2,kinds=?3,updated_at=?4 WHERE manage_hash=?5")
    .bind(JSON.stringify(preferences.artists), JSON.stringify(preferences.events), JSON.stringify(preferences.kinds), new Date().toISOString(), manageHash).run();
  return result.meta.changes ? json({ ok: true }, 200, cors(request, env)) : json({ error: "구독 정보를 찾을 수 없습니다." }, 404, cors(request, env));
}

async function verify(url, env) {
  const verifyHash = await hash(url.searchParams.get("token") || "");
  const now = new Date().toISOString();
  const result = await env.DB.prepare("UPDATE subscriptions SET verified_at=?1,verify_hash=NULL,updated_at=?1 WHERE verify_hash=?2").bind(now, verifyHash).run();
  return Response.redirect(`${env.SITE_URL}/calendar/?email-alert=${result.meta.changes ? "verified" : "invalid"}`, 302);
}

async function recover(url, env) {
  const recoveryHash = await hash(url.searchParams.get("token") || "");
  const subscription = await env.DB.prepare("SELECT id FROM subscriptions WHERE recovery_hash=?1").bind(recoveryHash).first();
  if (!subscription) return Response.redirect(`${env.SITE_URL}/calendar/?email-alert=invalid`, 302);
  const manageToken = token();
  await env.DB.prepare("UPDATE subscriptions SET manage_hash=?1,recovery_hash=NULL,updated_at=?2 WHERE id=?3")
    .bind(await hash(manageToken), new Date().toISOString(), subscription.id).run();
  return Response.redirect(`${env.SITE_URL}/calendar/#email-alert=recovered&manage-token=${encodeURIComponent(manageToken)}`, 302);
}

async function unsubscribe(url, env) {
  const id = await verifyUnsubscribeToken(env, url.searchParams.get("token") || "");
  const result = id ? await env.DB.prepare("DELETE FROM subscriptions WHERE id=?1").bind(id).run() : null;
  return Response.redirect(`${env.SITE_URL}/calendar/?email-alert=${result?.meta.changes ? "unsubscribed" : "invalid"}`, 302);
}

async function unsubscribeByManageToken(request, env) {
  const body = await request.json();
  const manageHash = await hash(body.manageToken || "");
  const result = await env.DB.prepare("DELETE FROM subscriptions WHERE manage_hash=?1").bind(manageHash).run();
  return result.meta.changes
    ? json({ ok: true }, 200, cors(request, env))
    : json({ error: "구독 정보를 찾을 수 없습니다." }, 404, cors(request, env));
}

function koreaDate(timestamp) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function runNotifications(env, timestamp = Date.now()) {
  const [eventsResponse, updatesResponse] = await Promise.all([fetch(`${env.DATA_BASE_URL}/events.json`), fetch(`${env.DATA_BASE_URL}/updates.json`)]);
  if (!eventsResponse.ok || !updatesResponse.ok) throw new Error("J-LIVE 공개 데이터를 불러오지 못했습니다.");
  const [events, updates] = await Promise.all([eventsResponse.json(), updatesResponse.json()]);
  const { results: subscriptions } = await env.DB.prepare("SELECT id,email,artists,events,kinds FROM subscriptions WHERE verified_at IS NOT NULL").all();
  const today = koreaDate(timestamp);
  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    try {
      const preferences = { artists: JSON.parse(subscription.artists), events: JSON.parse(subscription.events), kinds: JSON.parse(subscription.kinds) };
      const due = buildEmailAlerts(events, updates, preferences, today);
      const unsent = [];
      for (const alert of due) {
        const row = await env.DB.prepare("SELECT 1 AS found FROM sent_notifications WHERE subscription_id=?1 AND alert_id=?2").bind(subscription.id, alert.id).first();
        if (!row) unsent.push(alert);
      }
      if (!unsent.length) continue;
      const unsubscribeUrl = `${env.API_URL}/unsubscribe?token=${encodeURIComponent(await unsubscribeToken(env, subscription.id))}`;
      const key = `alerts-${subscription.id}-${today}-${await hash(unsent.map(item => item.id).join("|"))}`.slice(0, 256);
      await sendEmail(env, { from: env.FROM_EMAIL, to: [subscription.email], subject: `[J-LIVE] ${unsent[0].title}${unsent.length > 1 ? ` 외 ${unsent.length - 1}건` : ""}`, html: renderAlertEmail(unsent, env.SITE_URL, unsubscribeUrl) }, key);
      await env.DB.batch(unsent.map(alert => env.DB.prepare("INSERT OR IGNORE INTO sent_notifications (subscription_id,alert_id,sent_at) VALUES (?1,?2,?3)").bind(subscription.id, alert.id, new Date().toISOString())));
      sent += unsent.length;
    } catch (error) {
      failed += 1;
      console.error(`Notification failed for subscription ${subscription.id}`, error);
    }
  }
  return { subscribers: subscriptions.length, sent, failed };
}

async function cleanupExpired(env, timestamp = Date.now()) {
  const signupCutoff = new Date(timestamp - 24 * 60 * 60 * 1000).toISOString();
  const unverifiedCutoff = new Date(timestamp - 7 * 24 * 60 * 60 * 1000).toISOString();
  return env.DB.batch([
    env.DB.prepare("DELETE FROM signup_attempts WHERE created_at < ?1").bind(signupCutoff),
    env.DB.prepare("DELETE FROM subscriptions WHERE verified_at IS NULL AND created_at < ?1").bind(unverifiedCutoff)
  ]);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(request, env) });
    try {
      if (request.method === "POST" && url.pathname.endsWith("/subscriptions")) return subscribe(request, env);
      if (request.method === "PUT" && url.pathname.endsWith("/subscriptions")) return updateSubscription(request, env);
      if (request.method === "GET" && url.pathname.endsWith("/verify")) return verify(url, env);
      if (request.method === "GET" && url.pathname.endsWith("/recover")) return recover(url, env);
      if (request.method === "GET" && url.pathname.endsWith("/unsubscribe")) return unsubscribe(url, env);
      if (request.method === "POST" && url.pathname.endsWith("/unsubscribe")) return unsubscribeByManageToken(request, env);
      if (request.method === "GET" && url.pathname.endsWith("/health")) return json({ ok: true });
      return json({ error: "Not found" }, 404, cors(request, env));
    } catch (error) {
      console.error(error);
      return json({ error: "알림 처리 중 오류가 발생했습니다." }, 500, cors(request, env));
    }
  },
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(Promise.all([
      runNotifications(env, controller.scheduledTime),
      cleanupExpired(env, controller.scheduledTime)
    ]));
  }
};

export { cleanupExpired, recover, runNotifications, subscribe, unsubscribeByManageToken };
