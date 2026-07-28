"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const alerts = require("../calendar/alerts");

test("creates day-before ticket alerts only for saved events and artists", () => {
  const schedules = [
    { id: "saved-event", artist: "A", ticketDate: "2026-07-30", ticketTime: "오후 8:00", vendor: "YES24" },
    { id: "saved-artist", artist: "B", presaleDate: "2026-07-30", presaleTime: "오후 7:00", vendor: "NOL" },
    { id: "other", artist: "C", ticketDate: "2026-07-30" }
  ];
  const result = alerts.buildAlerts(schedules, [], { events: ["saved-event"], artists: ["B"] }, "2026-07-29");
  assert.deepEqual(result.map(item => item.id), ["ticket-saved-event-2026-07-30", "presale-saved-artist-2026-07-30"]);
});

test("creates immediate special update alerts for followed artists", () => {
  const schedules = [{ id: "event", artist: "A" }];
  const updates = [
    { id: "extra", eventId: "event", artist: "A", date: "2026-07-29", kind: "extra-seat", label: "추가 좌석", summary: "시야제한석 오픈" },
    { id: "old", eventId: "event", artist: "A", date: "2026-07-28", kind: "restock", label: "취소표", summary: "취소표" }
  ];
  assert.deepEqual(alerts.buildAlerts(schedules, updates, { events: [], artists: ["A"] }, "2026-07-29").map(item => item.id), ["update-extra"]);
});
