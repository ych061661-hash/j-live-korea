"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const favorites = require("../calendar/favorites");

function memoryStorage(initial = null) {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_key, next) => { value = next; }
  };
}

test("stores only unique artist names and event ids", () => {
  const storage = memoryStorage();
  const saved = favorites.write({
    artists: ["King Gnu", "King Gnu", ""],
    events: ["king-gnu-1", "king-gnu-1", null]
  }, storage);

  assert.deepEqual(saved, { artists: ["King Gnu"], events: ["king-gnu-1"] });
  assert.deepEqual(favorites.read(storage), saved);
});

test("recovers from malformed browser storage", () => {
  assert.deepEqual(favorites.read(memoryStorage("{broken")), { artists: [], events: [] });
});

test("shows future events saved directly or through an artist", () => {
  const schedules = [
    { id: "past", artist: "A", concertDate: "2026-07-01", time: "오후 7:00" },
    { id: "artist-later", artist: "A", concertDate: "2026-09-02", time: "오후 7:00" },
    { id: "event-sooner", artist: "B", concertDate: "2026-08-01", time: "오후 6:00" },
    { id: "other", artist: "C", concertDate: "2026-08-02", time: "오후 6:00" }
  ];

  assert.deepEqual(
    favorites.upcoming(schedules, { artists: ["A"], events: ["event-sooner"] }, "2026-07-29")
      .map(schedule => schedule.id),
    ["event-sooner", "artist-later"]
  );
});
