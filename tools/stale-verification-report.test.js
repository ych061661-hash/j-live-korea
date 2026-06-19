"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { buildReport } = require("./stale-verification-report");

const options = {
  asOf: "2026-06-19",
  thresholdDays: 7,
  from: "2026-07-01",
  through: "2026-10-31"
};

test("selects only future confirmed stale events in the refresh window", () => {
  const base = { artist: "Artist", venue: "Venue", sources: ["https://example.com/1"] };
  const report = buildReport([
    { ...base, id: "stale", status: "confirmed", concertDate: "2026-07-20", verifiedAt: "2026-06-11" },
    { ...base, id: "fresh", status: "confirmed", concertDate: "2026-07-20", verifiedAt: "2026-06-12" },
    { ...base, id: "pending", status: "pending", concertDate: "2026-07-20", verifiedAt: "2026-01-01" },
    { ...base, id: "june", status: "confirmed", concertDate: "2026-06-25", verifiedAt: "2026-01-01" },
    { ...base, id: "november", status: "confirmed", concertDate: "2026-11-01", verifiedAt: "2026-01-01" }
  ], options);

  assert.deepEqual(report.targets.map(event => event.id), ["stale"]);
});

test("groups missing verification and near concerts by urgency", () => {
  const base = { status: "confirmed", artist: "Artist", venue: "Venue", sources: [] };
  const report = buildReport([
    { ...base, id: "missing", concertDate: "2026-10-20", verifiedAt: null },
    { ...base, id: "near", concertDate: "2026-07-10", verifiedAt: "2026-06-01" },
    { ...base, id: "standard", concertDate: "2026-10-20", verifiedAt: "2026-06-11" }
  ], options);

  assert.deepEqual(report.groups.critical.map(event => event.id), ["near", "missing"]);
  assert.deepEqual(report.groups.standard.map(event => event.id), ["standard"]);
});
