import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { buildEmailAlerts, buildWeeklyTicketSummary, normalizePreferences, renderAlertEmail } from "../alerts-worker/src/logic.mjs";
import { cleanupExpired, recover, runNotifications, subscribe, unsubscribeByManageToken } from "../alerts-worker/src/index.mjs";

const require = createRequire(import.meta.url);
const emailAlertsUi = require("../calendar/email-alerts.js");

const events = [
  { id: "a-live", artist: "A", status: "confirmed", ticketDate: "2026-08-09", ticketTime: "오후 8:00", presaleDate: "2026-08-09", presaleTime: "오후 7:00", vendor: "YES24" },
  { id: "b-live", artist: "B", status: "confirmed", ticketDate: "2026-08-09", vendor: "NOL" },
  { id: "pending", artist: "A", status: "pending", ticketDate: "2026-08-09", vendor: "NOL" }
];
const updates = [
  { id: "new-a", eventId: "a-live", artist: "A", date: "2026-08-08", kind: "announcement", label: "신규 공연", summary: "새 공연" },
  { id: "seat-a", eventId: "a-live", artist: "A", date: "2026-08-08", kind: "extra-seat", label: "추가 좌석", summary: "시야제한석 오픈" },
  { id: "new-pending", eventId: "pending", artist: "A", date: "2026-08-08", kind: "announcement", label: "신규 공연", summary: "미승인" }
];

test("classifies verification redirects without exposing personal data", () => {
  assert.deepEqual(emailAlertsUi.classifyReturnState("?email-alert=verified", ""), { type: "verified" });
  assert.deepEqual(emailAlertsUi.classifyReturnState("?email-alert=invalid", ""), { type: "invalid" });
  assert.deepEqual(emailAlertsUi.classifyReturnState("", "#email-alert=recovered&manage-token=one-time"), { type: "recovered", manageToken: "one-time" });
  assert.deepEqual(emailAlertsUi.classifyReturnState("?email-alert=unknown", ""), { type: "" });
});

test("merges saved and directly selected artists without duplicates", () => {
  assert.deepEqual(emailAlertsUi.mergeArtists({ artists: ["A", "B"] }, new Set(["B", "C"])), ["A", "B", "C"]);
});

test("normalizes multilingual artist search input", () => {
  assert.equal(emailAlertsUi.normalizeArtistSearch(" 킹・누 "), "킹누");
});

test("builds a deduplicated direct artist subscription payload", () => {
  assert.deepEqual(emailAlertsUi.buildSubscriptionPayload({
    email: " FAN@EXAMPLE.COM ", consent: 1, artists: ["A", "A"], events: ["event", "event"], kinds: ["ticket", "ticket"]
  }), { email: "fan@example.com", consent: true, artists: ["A"], events: ["event"], kinds: ["ticket"] });
});

test("uses the Korea date at a UTC day boundary", () => {
  assert.equal(emailAlertsUi.seoulDateKey("2026-08-24T15:30:00.000Z"), "2026-08-25");
});

test("builds all four alert types only for confirmed favorite artists", () => {
  const result = buildEmailAlerts(events, updates, { artists: ["A"], events: [], kinds: ["announcement", "presale", "ticket", "extra-seat"] }, "2026-08-08");
  assert.deepEqual(result.map(item => item.kind).sort(), ["announcement", "extra-seat", "presale", "ticket"]);
  assert.ok(result.every(item => item.artist === "A"));
  assert.ok(result.every(item => !item.id.includes("pending")));
});

test("builds a deduplicated Monday-to-Sunday ticket summary", () => {
  const weeklyEvents = [
    { id: "a-one", artist: "A", status: "confirmed", ticketDate: "2026-08-10", ticketTime: "오후 8:00", vendor: "YES24" },
    { id: "a-two", artist: "A", status: "confirmed", ticketDate: "2026-08-10", ticketTime: "오후 8:00", vendor: "YES24" },
    { id: "b-one", artist: "B", status: "confirmed", presaleDate: "2026-08-16", presaleTime: "오후 7:00", vendor: "NOL" },
    { id: "outside", artist: "C", status: "confirmed", ticketDate: "2026-08-17", vendor: "NOL" },
    { id: "pending", artist: "D", status: "pending", ticketDate: "2026-08-11", vendor: "NOL" }
  ];
  const result = buildWeeklyTicketSummary(weeklyEvents, { kinds: ["weekly"] }, "2026-08-10");
  assert.deepEqual(result.map(item => item.title), ["A 일반예매", "B 선예매"]);
  assert.ok(result.every(item => item.kind === "weekly"));
  assert.match(renderAlertEmail(result, "https://j-live.kr", "https://example.com/out"), /이번 주 예매 일정/);
  assert.deepEqual(buildWeeklyTicketSummary(weeklyEvents, { kinds: ["ticket"] }, "2026-08-10"), []);
});

test("normalizes preference values and renders safe email HTML", () => {
  assert.deepEqual(normalizePreferences({ artists: [" A ", "A"], events: ["one"], kinds: ["ticket", "invalid"] }), { artists: ["A"], events: ["one"], kinds: ["ticket"] });
  const html = renderAlertEmail([{ title: "<A>", body: "B & C", url: "/calendar/" }], "https://j-live.kr", "https://example.com/out");
  assert.match(html, /&lt;A&gt;/);
  assert.match(html, /B &amp; C/);
  assert.match(html, /이메일 알림 해지/);
});

test("unsubscribes browser clients with their local management token", async () => {
  let boundHash = "";
  const env = {
    SITE_URL: "https://j-live.kr",
    DB: {
      prepare(sql) {
        assert.match(sql, /DELETE FROM subscriptions WHERE manage_hash/);
        return {
          bind(value) {
            boundHash = value;
            return { run: async () => ({ meta: { changes: 1 } }) };
          }
        };
      }
    }
  };
  const request = new Request("https://j-live.kr/api/alerts/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://j-live.kr" },
    body: JSON.stringify({ manageToken: "local-secret" })
  });
  const response = await unsubscribeByManageToken(request, env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://j-live.kr");
  assert.equal(boundHash.length, 64);
});

test("sends a recovery email instead of exposing an existing subscriber token", async () => {
  const statements = [];
  const originalFetch = globalThis.fetch;
  let sentPayload;
  globalThis.fetch = async (_url, options) => {
    sentPayload = JSON.parse(options.body);
    return new Response(JSON.stringify({ id: "mail-id" }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  const env = {
    SITE_URL: "https://j-live.kr",
    API_URL: "https://j-live.kr/api/alerts",
    FROM_EMAIL: "J-LIVE <alerts@notify.j-live.kr>",
    RESEND_API_KEY: "test-key",
    UNSUBSCRIBE_SECRET: "test-signing-secret",
    DB: {
      prepare(sql) {
        statements.push(sql);
        return {
          bind(...values) {
            return {
              first: async () => sql.includes("signup_attempts") ? { count: 0 } : { id: "subscriber-id", verified_at: "2026-08-08T00:00:00.000Z" },
              run: async () => ({ meta: { changes: 1 }, values })
            };
          }
        };
      }
    }
  };
  try {
    const request = new Request("https://j-live.kr/api/alerts/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://j-live.kr" },
      body: JSON.stringify({ email: "fan@example.com", consent: true, artists: ["King Gnu"], events: [], kinds: ["announcement"] })
    });
    const response = await subscribe(request, env);
    const body = await response.json();
    assert.equal(response.status, 202);
    assert.equal(body.existing, true);
    assert.equal(body.manageToken, undefined);
    assert.match(sentPayload.subject, /관리 연결/);
    assert.match(sentPayload.html, /\/recover\?token=/);
    assert.ok(statements.some(sql => sql.includes("recovery_hash")));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rotates the management token through a one-time recovery link", async () => {
  let updateValues;
  const env = {
    SITE_URL: "https://j-live.kr",
    DB: {
      prepare(sql) {
        return {
          bind(...values) {
            if (sql.startsWith("SELECT")) return { first: async () => ({ id: "subscriber-id" }) };
            return { run: async () => { updateValues = values; return { meta: { changes: 1 } }; } };
          }
        };
      }
    }
  };
  const response = await recover(new URL("https://j-live.kr/api/alerts/recover?token=one-time-token"), env);
  const location = new URL(response.headers.get("Location"));
  const fragment = new URLSearchParams(location.hash.slice(1));
  assert.equal(response.status, 302);
  assert.equal(location.pathname, "/calendar/alerts/");
  assert.equal(fragment.get("email-alert"), "recovered");
  assert.ok(fragment.get("manage-token").length >= 40);
  assert.equal(updateValues[0].length, 64);
  assert.equal(updateValues[2], "subscriber-id");
});

test("continues delivering when one subscriber email fails", async () => {
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  let emailAttempts = 0;
  let recorded = 0;
  globalThis.fetch = async url => {
    const value = String(url);
    if (value.endsWith("/events.json")) return new Response(JSON.stringify([{ id: "show", artist: "A", status: "confirmed", ticketDate: "2026-08-09", ticketTime: "오후 8:00", vendor: "YES24" }]), { status: 200 });
    if (value.endsWith("/updates.json")) return new Response("[]", { status: 200 });
    emailAttempts += 1;
    return emailAttempts === 1 ? new Response("temporary failure", { status: 503 }) : new Response("{}", { status: 200 });
  };
  console.error = () => {};
  const subscribers = ["first", "second"].map(id => ({ id, email: `${id}@example.com`, artists: '["A"]', events: "[]", kinds: '["ticket"]' }));
  const env = {
    API_URL: "https://j-live.kr/api/alerts",
    DATA_BASE_URL: "https://j-live.kr/calendar/data",
    SITE_URL: "https://j-live.kr",
    FROM_EMAIL: "J-LIVE <alerts@notify.j-live.kr>",
    RESEND_API_KEY: "test-key",
    UNSUBSCRIBE_SECRET: "test-signing-secret",
    DB: {
      prepare(sql) {
        return {
          bind() {
            return { first: async () => null };
          },
          all: async () => ({ results: subscribers })
        };
      },
      batch: async statements => { recorded += statements.length; return []; }
    }
  };
  try {
    const result = await runNotifications(env, Date.parse("2026-08-08T00:00:00Z"));
    assert.deepEqual(result, { subscribers: 2, sent: 1, failed: 1 });
    assert.equal(emailAttempts, 2);
    assert.equal(recorded, 1);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
  }
});

test("sends the weekly ticket summary after 8 AM Monday in Korea", async () => {
  const originalFetch = globalThis.fetch;
  let subject = "";
  globalThis.fetch = async (url, options) => {
    const value = String(url);
    if (value.endsWith("/events.json")) return new Response(JSON.stringify([
      { id: "weekly-show", artist: "A", status: "confirmed", ticketDate: "2026-08-12", ticketTime: "오후 8:00", vendor: "YES24" }
    ]), { status: 200 });
    if (value.endsWith("/updates.json")) return new Response("[]", { status: 200 });
    subject = JSON.parse(options.body).subject;
    return new Response("{}", { status: 200 });
  };
  const env = {
    API_URL: "https://j-live.kr/api/alerts",
    DATA_BASE_URL: "https://j-live.kr/calendar/data",
    SITE_URL: "https://j-live.kr",
    FROM_EMAIL: "J-LIVE <alerts@notify.j-live.kr>",
    RESEND_API_KEY: "test-key",
    UNSUBSCRIBE_SECRET: "test-signing-secret",
    DB: {
      prepare() {
        return {
          bind() { return { first: async () => null }; },
          all: async () => ({ results: [{ id: "weekly-fan", email: "fan@example.com", artists: "[]", events: "[]", kinds: '["weekly"]' }] })
        };
      },
      batch: async () => []
    }
  };
  try {
    const result = await runNotifications(env, Date.parse("2026-08-09T23:00:00Z"));
    assert.equal(result.sent, 1);
    assert.equal(subject, "[J-LIVE] 이번 주 예매 일정 1건");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("cleans rate-limit rows after one day and unverified subscriptions after seven days", async () => {
  const statements = [];
  const env = {
    DB: {
      prepare(sql) {
        return { bind(value) { statements.push({ sql, value }); return { sql, value }; } };
      },
      batch: async values => values
    }
  };
  const now = Date.parse("2026-08-08T00:00:00Z");
  await cleanupExpired(env, now);
  assert.equal(statements.length, 2);
  assert.match(statements[0].sql, /signup_attempts/);
  assert.equal(statements[0].value, "2026-08-07T00:00:00.000Z");
  assert.match(statements[1].sql, /verified_at IS NULL/);
  assert.equal(statements[1].value, "2026-08-01T00:00:00.000Z");
});
