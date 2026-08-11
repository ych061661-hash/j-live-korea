"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { buildSeries, hasEditorialGuide, humanDate, relatedEvents, richEventGuideMarkup, seriesDatesMarkup, ticketGuideMarkup, venueGuideForEvent, venueIndexHtml, venuePageHtml } = require("./generate-seo-pages");

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

test("recommends three future similar concerts without duplicate artists", () => {
  const event = { id: "current", artist: "Current", concertDate: "2026-08-10", genre: "Rock", venue: "Hall A", vendor: "YES24", status: "confirmed" };
  const events = [
    event,
    { id: "same-artist", artist: "Current", concertDate: "2026-08-11", genre: "Rock", venue: "Hall A", vendor: "YES24", status: "confirmed" },
    { id: "best", artist: "Best", concertDate: "2026-08-12", genre: "Rock", venue: "Hall A", vendor: "YES24", status: "confirmed" },
    { id: "best-second-date", artist: "Best", concertDate: "2026-08-13", genre: "Rock", venue: "Hall A", vendor: "YES24", status: "confirmed" },
    { id: "second", artist: "Second", concertDate: "2026-08-14", genre: "Rock", venue: "Hall B", vendor: "YES24", status: "confirmed" },
    { id: "third", artist: "Third", concertDate: "2026-09-20", genre: "Pop", venue: "Hall C", vendor: "Melon", status: "confirmed" },
    { id: "past", artist: "Past", concertDate: "2026-07-01", genre: "Rock", venue: "Hall A", vendor: "YES24", status: "confirmed" }
  ];
  assert.deepEqual(relatedEvents(event, events, "2026-08-05").map(item => item.id), ["best", "second", "third"]);
});

test("renders artist-specific editorial content only when it exists", () => {
  const event = { artist: "Artist", verifiedAt: "2026-07-20" };
  const editorial = { eventGuides: { Artist: { focus: "관전 포인트", listening: "듣는 순서", plan: "동선 메모" } } };

  const html = richEventGuideMarkup(event, editorial);
  assert.match(html, /J-LIVE ORIGINAL/);
  assert.match(html, /관전 포인트/);
  assert.match(html, /듣는 순서/);
  assert.match(html, /동선 메모/);
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
  for (const heading of ["지하철·버스에서 공연장까지", "좌석·수용 규모", "입장 줄까지의 동선", "화장실", "물품 보관", "관객 주차", "스탠딩·현장 대기", "귀가와 막차"]) assert.match(html, new RegExp(heading));
  assert.doesNotMatch(html, /주변 식사·카페/);
  assert.doesNotMatch(html, /시설 지도/);
  assert.doesNotMatch(html, /venue-site-map-svg/);
  assert.match(html, /<link rel="canonical" href="https:\/\/j-live\.kr\/calendar\/guides\/venues\/hall">/);
  assert.doesNotMatch(html, /hall\.html/);
});

test("renders the verified KSPO DOME site map", () => {
  const guide = { name: "KSPO DOME", summary: "요약", transit: "교통", arrival: "입장", restroom: "화장실", storage: "보관", waiting: "대기", nearby: "식사", return: "귀가", verifiedAt: "2026-07-28", sources: [] };
  const html = venuePageHtml("kspo-dome", guide, "https://j-live.kr");
  assert.match(html, /KSPO DOME 화장실·게이트 약도/);
  assert.match(html, /venue-site-map-svg/);
  assert.match(html, /올림픽수영장/);
  assert.match(html, /href="#venue-3"/);
  assert.match(html, /올림픽공원 공식 지도/);
});

test("renders site maps for every supported venue", () => {
  const guide = { name: "공연장", summary: "요약", transit: "교통", arrival: "입장", restroom: "화장실", storage: "보관", waiting: "대기", nearby: "식사", return: "귀가", verifiedAt: "2026-07-28", sources: [] };
  for (const slug of ["kintex-second-exhibition", "kspo-dome", "olympic-hall", "jangchung-gymnasium", "inspire-arena", "gonggam-hall", "wanderloch-hall", "gocheok-sky-dome"]) {
    const html = venuePageHtml(slug, guide, "https://j-live.kr");
    assert.match(html, /venue-site-map-svg/, slug);
    assert.match(html, /화장실 안내 보기/, slug);
    assert.match(html, /전체 출처 보기/, slug);
  }
  assert.match(venuePageHtml("kintex-second-exhibition", guide, "https://j-live.kr"), /10홀 앞 물품보관함/);
  assert.match(venuePageHtml("jangchung-gymnasium", guide, "https://j-live.kr"), /2F 안내·매표·물품보관/);
  assert.doesNotMatch(venuePageHtml("gonggam-hall", guide, "https://j-live.kr"), /승강기/);
  for (const slug of ["olympic-hall", "jangchung-gymnasium", "inspire-arena", "gonggam-hall", "wanderloch-hall", "gocheok-sky-dome"]) {
    assert.doesNotMatch(venuePageHtml(slug, guide, "https://j-live.kr"), /매점|카페|카페테리아|편의점|식사|자판기/, slug);
  }
});

test("generates extensionless public links", () => {
  assert.match(seriesDatesMarkup([{ id: "artist-2026-08-01", concertDate: "2026-08-01" }], "artist-2026-08-01"), /href="artist-2026-08-01"/);
  assert.doesNotMatch(seriesDatesMarkup([{ id: "artist-2026-08-01", concertDate: "2026-08-01" }], "artist-2026-08-01"), /\.html/);
  assert.doesNotMatch(venueIndexHtml({ hall: { name: "Hall", venues: ["Hall"], summary: "요약", verifiedAt: "2026-07-20" } }, "https://j-live.kr"), /\.html/);
});
