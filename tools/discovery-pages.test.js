"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  artistIndexHtml,
  artistPageHtml,
  buildUpdateHistory,
  updatesPageHtml,
  weeklyPageHtml
} = require("./discovery-pages");

const event = {
  id: "band-2026-08-01",
  artist: "Band",
  concertDate: "2026-08-01",
  time: "19:00",
  venue: "Hall",
  vendor: "Vendor",
  vendorUrl: "https://tickets.example/show",
  status: "confirmed",
  verifiedAt: "2026-07-29",
  youtubeProfileImage: "./assets/artists/band.jpg",
  songs: [
    ["One", "", "https://youtube.com/watch?v=1"],
    ["Two", "", "https://youtube.com/watch?v=2"],
    ["Three", "", "https://youtube.com/watch?v=3"],
    ["Four", "", "https://youtube.com/watch?v=4"]
  ],
  sources: ["https://tickets.example/show"]
};

test("renders artist pages with three songs and correct directory links", () => {
  const html = artistPageHtml({
    artist: "Band",
    events: [event],
    aliases: { Band: ["밴드", "バンド"] },
    editorial: {},
    siteUrl: "https://j-live.kr",
    today: "2026-07-29"
  });
  assert.equal((html.match(/youtube\.com\/watch/g) || []).length, 3);

  const directory = artistIndexHtml({
    groups: new Map([["Band", [event]]]),
    aliases: {},
    siteUrl: "https://j-live.kr",
    today: "2026-07-29"
  });
  assert.match(directory, /href="\.\/band"/);
  assert.doesNotMatch(directory, /href="\.\/artists\/band"/);
});

test("uses the brand image when a channel avatar is not cached", () => {
  const html = artistPageHtml({
    artist: "Band",
    events: [{ ...event, youtubeProfileImage: "", youtubeChannel: "@missing-avatar" }],
    aliases: {},
    editorial: {},
    siteUrl: "https://j-live.kr",
    today: "2026-07-29"
  });

  assert.match(html, /assets\/brand\/j-live-app-logo\.png/);
});

test("renders the next concert and verified Korea attendance history", () => {
  const html = artistPageHtml({
    artist: "Band",
    events: [
      { ...event, concertDate: "2026-08-01" },
      { ...event, id: "band-2025-05-03", concertDate: "2025-05-03", attendance: 1200, attendanceScope: "단독 공연", attendanceSource: "https://artist.example/news" }
    ],
    aliases: {}, editorial: {}, siteUrl: "https://j-live.kr", today: "2026-07-29"
  });

  assert.match(html, /NEXT CONCERT/);
  assert.match(html, /KOREA HISTORY/);
  assert.match(html, /1,200명/);
  assert.match(html, /https:\/\/artist\.example\/news/);
});

test("renders the current Monday-to-Sunday weekly page", () => {
  const page = weeklyPageHtml({
    events: [event],
    aliases: {},
    editorial: {},
    siteUrl: "https://j-live.kr",
    today: "2026-07-29"
  });
  assert.equal(page.start, "2026-07-27");
  assert.match(page.html, /Band/);
  assert.match(page.html, /https:\/\/tickets\.example\/show/);
});

test("deduplicates identical series-level ticket updates", () => {
  const events = [
    { ...event, ticketLabel: "시야제한석 추가", ticketDate: "2026-07-30", ticketTime: "20:00" },
    { ...event, id: "band-2026-08-02", concertDate: "2026-08-02", ticketLabel: "시야제한석 추가", ticketDate: "2026-07-30", ticketTime: "20:00" }
  ];
  const updates = buildUpdateHistory(events, {}, [], "2026-07-29");
  assert.equal(updates.filter(item => item.kind === "announcement").length, 1);
  assert.equal(updates.filter(item => item.kind === "ticket-open").length, 1);
  assert.equal(updates.filter(item => item.kind === "extra-seat").length, 1);
});

test("creates ticket opening posts and keeps later schedule changes separate", () => {
  const withoutSale = { ...event, ticketDate: null, ticketTime: null };
  const opened = { ...event, ticketDate: "2026-07-30", ticketTime: "20:00" };
  const previous = { [event.id]: withoutSale };
  const openedUpdates = buildUpdateHistory([opened], previous, [], "2026-07-29");
  assert.equal(openedUpdates[0].kind, "ticket-open");
  assert.doesNotMatch(openedUpdates[0].summary, /선예매 미정/);

  const changed = { ...opened, ticketTime: "21:00" };
  const changedUpdates = buildUpdateHistory([changed], { [event.id]: opened }, [], "2026-07-30");
  assert.equal(changedUpdates[0].kind, "ticket-change");
});

test("uses calendar-relative assets on the update page", () => {
  const html = updatesPageHtml({ updates: [], siteUrl: "https://j-live.kr" });
  assert.match(html, /href="\.\/styles\.css/);
  assert.match(html, /src="\.\/site\.js"/);
});
