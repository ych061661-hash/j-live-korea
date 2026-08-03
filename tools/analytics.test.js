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
