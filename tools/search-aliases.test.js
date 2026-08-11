"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const events = require("../calendar/data/events.json");
const aliases = require("../calendar/data/artist-aliases.json");

test("every calendar artist is searchable in Korean, Latin and Japanese scripts", () => {
  const artists = [...new Set(events.map(event => event.artist))];
  const missing = artists.filter(artist => {
    const names = [artist, ...(aliases[artist] || [])].join(" ");
    return !/[가-힣]/.test(names) || !/[A-Za-z]/.test(names) || !/[ぁ-んァ-ヶ一-龠々]/.test(names);
  });
  assert.deepEqual(missing, []);
});
