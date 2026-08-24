"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const events = require("../calendar/data/events.json");
const aliases = require("../calendar/data/artist-aliases.json");
const search = require("../calendar/search-utils.js");

test("every calendar artist is searchable in Korean, Latin and Japanese scripts", () => {
  const artists = [...new Set(events.map(event => event.artist))];
  const missing = artists.filter(artist => {
    const names = [artist, ...(aliases[artist] || [])].join(" ");
    return !/[가-힣]/.test(names) || !/[A-Za-z]/.test(names) || !/[ぁ-んァ-ヶ一-龠々]/.test(names);
  });
  assert.deepEqual(missing, []);
});

test("matches aliases and venue/date fields", () => {
  const matches = search.findMatches(events, aliases, "킹 누");
  assert.ok(matches.some(event => event.artist === "King Gnu"));
  assert.ok(search.findMatches(events, aliases, "킨텍스").length > 0);
});

test("suggests a nearby artist name when the query has a small typo", () => {
  const result = search.suggestions([{ artist: "SPYAIR", venue: "Hall" }], { SPYAIR: ["스파이에어"] }, "spyairr");
  assert.equal(result[0].artist, "SPYAIR");
});
