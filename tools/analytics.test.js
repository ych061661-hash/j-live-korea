"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const analytics = require("../calendar/analytics");

test("aggregates search, ticket and save actions without storing raw visits", () => {
  let value = "";
  const storage = { getItem: () => value, setItem: (_key, next) => { value = next; } };
  analytics.track("artist_search", { artist: "King Gnu" }, storage);
  analytics.track("ticket_click", { vendor: "YES24" }, storage);
  analytics.track("favorite_save", { type: "events" }, storage);
  const result = analytics.track("favorites_snapshot", { events: 2, artists: 1 }, storage);
  assert.equal(result.searches["King Gnu"], 1);
  assert.equal(result.ticketClicks.YES24, 1);
  assert.deepEqual(result.favorites, { events: 2, artists: 1 });
});

test("forwards contact form conversions to GA4", () => {
  const calls = [];
  const storage = { getItem: () => null, setItem: () => {} };
  globalThis.gtag = (...args) => calls.push(args);
  analytics.track("form_submit", { form_name: "form_submit" }, storage);
  analytics.track("correction_submit", { form_name: "correction_submit" }, storage);
  delete globalThis.gtag;
  assert.deepEqual(calls, [
    ["event", "form_submit", { form_name: "form_submit" }],
    ["event", "correction_submit", { form_name: "correction_submit" }]
  ]);
});

test("forwards email signup and verification conversions without an email address", () => {
  const calls = [];
  const storage = { getItem: () => null, setItem: () => {} };
  globalThis.gtag = (...args) => calls.push(args);
  analytics.track("email_alert_signup_sent", { favorite_count: 2, kind_count: 4 }, storage);
  analytics.track("email_alert_verified", { subscriber_state: "verified" }, storage);
  delete globalThis.gtag;
  assert.deepEqual(calls, [
    ["event", "email_alert_signup_sent", { favorite_count: 2, kind_count: 4 }],
    ["event", "email_alert_verified", { subscriber_state: "verified" }]
  ]);
  assert.equal(JSON.stringify(calls).includes("@"), false);
});

test("does not forward selected artist names to GA4", () => {
  const calls = [];
  const storage = { getItem: () => null, setItem: () => {} };
  globalThis.gtag = (...args) => calls.push(args);
  analytics.track("email_alert_artist_select", { artist: "King Gnu", selected: true, artist_count: 1 }, storage);
  delete globalThis.gtag;
  assert.deepEqual(calls, [["event", "email_alert_artist_select", { selected: true, artist_count: 1 }]]);
  assert.equal(analytics.sanitizeDetail("email_alert_artist_select", { artist: "King Gnu" }).artist, undefined);
});

test("sanitizes empty search terms and classifies their writing system", () => {
  assert.equal(analytics.safeSearchTerm("  킹누  "), "킹누");
  assert.equal(analytics.searchLanguage("킹누"), "korean");
  assert.equal(analytics.searchLanguage("King Gnu"), "latin");
  assert.equal(analytics.searchLanguage("キングヌー"), "japanese");
  assert.equal(analytics.safeSearchTerm("fan@example.com"), "");
  assert.equal(analytics.safeSearchTerm("https://example.com"), "");
  assert.equal(analytics.safeSearchTerm("010-1234-5678"), "");
});

test("stores and sends only language and coarse length for unmatched searches", () => {
  const query = "내가 입력한 상세한 검색 문장";
  let value = JSON.stringify({ emptySearches: { [query]: 2 } });
  const calls = [];
  const storage = { getItem: () => value, setItem: (_key, next) => { value = next; } };
  globalThis.gtag = (...args) => calls.push(args);
  const result = analytics.track("empty_search", { search_term: query }, storage);
  delete globalThis.gtag;

  assert.deepEqual(calls, [["event", "empty_search", { search_language: "korean", search_length_bucket: "11-20" }]]);
  assert.equal(JSON.stringify(result).includes(query), false);
  assert.equal(value.includes(query), false);
  assert.equal(result.emptySearches["korean:11-20"], 3);
});

test("does not send saved event or artist identifiers to analytics", () => {
  const calls = [];
  const storage = { getItem: () => null, setItem: () => {} };
  globalThis.gtag = (...args) => calls.push(args);
  analytics.track("favorite_save", { type: "events", event_id: "private-event-id" }, storage);
  analytics.track("favorite_save", { type: "artists", artist: "Private Artist Choice" }, storage);
  delete globalThis.gtag;

  assert.deepEqual(calls, [
    ["event", "favorite_save", { type: "events" }],
    ["event", "favorite_save", { type: "artists" }]
  ]);
  assert.equal(JSON.stringify(calls).includes("private-event-id"), false);
  assert.equal(JSON.stringify(calls).includes("Private Artist Choice"), false);
});
