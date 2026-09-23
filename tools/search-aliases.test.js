"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const events = require("../calendar/data/events.json");
const aliases = require("../calendar/data/artist-aliases.json");
const search = require("../calendar/search-utils.js");

test("every confirmed calendar artist has Korean, Latin and Japanese aliases", () => {
  const publiclySearchable = events.filter(event => (
    event.status === "confirmed"
  ));
  const artists = [...new Set(publiclySearchable.map(event => event.artist))];
  const missing = artists.filter(artist => {
    const names = [artist, ...(aliases[artist] || [])].join(" ");
    return !/[가-힣]/.test(names) || !/[A-Za-z]/.test(names) || !/[ぁ-んァ-ヶ一-龠々]/.test(names);
  });
  assert.deepEqual(missing, []);
});

test("new pending artists match every officially verified alias", () => {
  for (const event of events.filter(item => item.status === "pending" && item.hostingStatus === "confirmed")) {
    for (const alias of aliases[event.artist] || []) {
      assert.ok(search.findMatches([event], aliases, alias).some(match => match.id === event.id), `${event.id} does not match alias ${alias}`);
    }
  }
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
