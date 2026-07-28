"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { buildSeries, hasEditorialGuide, humanDate, richEventGuideMarkup, seriesDatesMarkup, ticketGuideMarkup, venueGuideForEvent, venueIndexHtml, venuePageHtml } = require("./generate-seo-pages");

test("groups consecutive dates and selects the first future performance", () => {
  const base = { artist: "Artist", venue: "Venue", vendorUrl: "https://tickets.example/event" };
  const events = [
    { ...base, id: "past", concertDate: "2026-06-20", time: "오후 6:00" },
    { ...base, id: "future-2", concertDate: "2026-06-24", time: "오후 6:00" },
    { ...base, id: "future-1", concertDate: "2026-06-23", time: "오후 6:00" }
  ];
  const result = buildSeries(events, "2026-06-22");

  assert.equal(result.groups.size, 1);
  assert.equal(result.primaryById.get("past").id, "future-1");
  assert.deepEqual(result.groupById.get("past").map(event => event.id), ["past", "future-1", "future-2"]);
});

test("formats Korean dates without relying on UTC conversion", () => {
  assert.equal(humanDate("2026-07-18", "오후 6:00"), "2026년 7월 18일(토) 오후 6:00");
  assert.equal(humanDate(null), "미정");
});

test("renders artist-specific editorial content only when it exists", () => {
  const event = { artist: "Artist", verifiedAt: "2026-07-20" };
  const editorial = { eventGuides: { Artist: { focus: "관전 포인트", listening: "듣는 순서", plan: "동선 메모" } } };

  const html = richEventGuideMarkup(event, editorial);
  assert.match(html, /J-LIVE ORIGINAL/);
  assert.match(html, /관전 포인트/);
  assert.equal(hasEditorialGuide(event, editorial), true);
  assert.equal(hasEditorialGuide({ artist: "Unknown" }, editorial), false);
  assert.equal(richEventGuideMarkup({ artist: "Unknown" }, editorial), "");
});

test("renders ticket analysis and resolves a venue field guide", () => {
  const event = { artist: "Band", venue: "Hall", verifiedAt: "2026-07-20" };
  const editorial = {
    ticketGuides: { Band: { price: "R 100원", presale: "없음", identity: "확인", ticket: "현장수령", cancellation: "고정 시각 없음", verifiedAt: "2026-07-20" } },
    venueGuides: { hall: { name: "Hall", venues: ["Hall"] } }
  };
  assert.match(ticketGuideMarkup(event, editorial), /좌석 등급과 가격/);
  assert.equal(venueGuideForEvent(event, editorial)[0], "hall");
});

test("renders every requested venue section", () => {
  const guide = { name: "Hall", summary: "요약", seoTitle: "Hall 위치·좌석 안내", transit: "교통", capacity: "1,000석", arrival: "입장", restroom: "화장실", storage: "보관", parking: "관객 주차 없음", waiting: "대기", nearby: "식사", return: "귀가", verifiedAt: "2026-07-20", sources: [] };
  const html = venuePageHtml("hall", guide, "https://j-live.kr");
  for (const heading of ["지하철·버스에서 공연장까지", "좌석·수용 규모", "입장 줄까지의 동선", "화장실", "물품 보관", "관객 주차", "스탠딩·현장 대기", "주변 식사·카페", "귀가와 막차"]) assert.match(html, new RegExp(heading));
  assert.match(html, /<link rel="canonical" href="https:\/\/j-live\.kr\/calendar\/guides\/venues\/hall">/);
  assert.doesNotMatch(html, /hall\.html/);
});

test("generates extensionless public links", () => {
  assert.match(seriesDatesMarkup([{ id: "artist-2026-08-01", concertDate: "2026-08-01" }], "artist-2026-08-01"), /href="artist-2026-08-01"/);
  assert.doesNotMatch(seriesDatesMarkup([{ id: "artist-2026-08-01", concertDate: "2026-08-01" }], "artist-2026-08-01"), /\.html/);
  assert.doesNotMatch(venueIndexHtml({ hall: { name: "Hall", venues: ["Hall"], summary: "요약", verifiedAt: "2026-07-20" } }, "https://j-live.kr"), /\.html/);
});
