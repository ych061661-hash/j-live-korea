"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const lineups = require("../calendar/data/festival-lineups.json");
const aliases = require("../calendar/data/artist-aliases.json");
const profiles = require("../calendar/data/festival-artist-profiles.json");
const page = fs.readFileSync(path.join(root, "calendar/festivals/wonderlivet-2026.html"), "utf8");
const app = fs.readFileSync(path.join(root, "calendar/app.js"), "utf8");
const festivalScript = fs.readFileSync(path.join(root, "calendar/festivals/wonderlivet.js"), "utf8");

test("keeps the WONDERLIVET lineup at three days and 42 unique artists", () => {
  const festival = lineups.find(item => item.id === "wonderlivet-2026");
  assert.ok(festival);
  assert.deepEqual(festival.dates, ["2026-11-20", "2026-11-21", "2026-11-22"]);
  assert.equal(festival.days.length, 3);
  assert.deepEqual(festival.days.map(day => day.artists.length), [14, 14, 14]);
  const artists = festival.days.flatMap(day => day.artists);
  assert.equal(new Set(artists).size, 42);
  assert.ok(festival.officialUrl);
  assert.ok(festival.ticketUrl);
});

test("registers every WONDERLIVET artist in the searchable alias catalog", () => {
  const festival = lineups.find(item => item.id === "wonderlivet-2026");
  const missing = festival.days.flatMap(day => day.artists).filter(artist => !Object.hasOwn(aliases, artist));
  assert.deepEqual(missing, []);
});

test("publishes every WONDERLIVET artist and official action on the lineup page", () => {
  const festival = lineups.find(item => item.id === "wonderlivet-2026");
  festival.days.flatMap(day => day.artists).forEach(artist => {
    const htmlArtist = artist.replace(/&/g, "&amp;");
    assert.match(page, new RegExp(htmlArtist.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });
  assert.match(page, /ticket\.melon\.com\/csoon\/detail\.htm\?csoonId=12762/);
  assert.match(page, /litt\.ly\/wonderlivet/);
  assert.match(page, /festflow\.kr\/festivals\/wonderlivet-2026/);
  assert.match(page, /assets\/festivals\/wonderlivet-2026-mark\.png/);
  assert.match(page, /assets\/festivals\/wonderlivet-2026-lineup\.png/);
  assert.match(page, /WONDERLIVET 2026 11월 20일, 21일, 22일 KINTEX 공연 라인업 포스터/);
  assert.match(page, /href="\/calendar\/styles\.css\?v=20260828record-disclosure1"/);
  assert.match(page, /src="\/calendar\/festivals\/wonderlivet\.js\?v=20260827profiles1"/);
  assert.match(festivalScript, /fetch\("\/calendar\/data\/festival-lineups\.json"\)/);
  assert.ok(fs.existsSync(path.join(root, "calendar/assets/festivals/wonderlivet-2026-mark.png")));
  assert.ok(fs.existsSync(path.join(root, "calendar/assets/festivals/wonderlivet-2026-lineup.png")));
});

test("places WONDERLIVET on each announced date in the calendar", () => {
  const festival = lineups.find(item => item.id === "wonderlivet-2026");
  festival.days.forEach(day => assert.match(app, /type: "festival"/));
  assert.match(app, /day\.date === key/);
  assert.match(app, /festivalUrl: `\.\/festivals\/\$\{encodeURIComponent\(lineup\.id\)\}`/);
  assert.equal(festival.festflowUrl, "https://festflow.kr/festivals/wonderlivet-2026");
});

test("provides an introduction and three representative songs for every artist", () => {
  const festival = lineups.find(item => item.id === "wonderlivet-2026");
  const artists = festival.days.flatMap(day => day.artists);
  const missing = artists.filter(artist => !Object.hasOwn(profiles, artist));
  assert.deepEqual(missing, []);
  artists.forEach(artist => {
    const profile = profiles[artist];
    assert.ok(profile.intro.length >= 35, `${artist} intro is too short`);
    assert.equal(profile.songs.length, 3, `${artist} must have three songs`);
    profile.songs.forEach(song => assert.ok(song.trim(), `${artist} has an empty song`));
  });
  assert.match(page, /wonderlivetArtistProfiles/);
  assert.match(page, /wonderlivet\.js\?v=20260827profiles1/);
});
