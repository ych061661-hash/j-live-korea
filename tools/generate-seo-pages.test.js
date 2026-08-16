"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { articleStructuredData, buildSeries, dataReportHtml, hasEditorialGuide, hasIndexableEventContent, homepageUpcomingMarkup, humanDate, relatedEvents, richEventGuideMarkup, seoulDateKey, seriesDatesMarkup, structuredData, ticketGuideMarkup, venueGuideForEvent, venueIndexHtml, venuePageHtml } = require("./generate-seo-pages");

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
  assert.equal(seoulDateKey(new Date("2026-08-14T16:00:00Z")), "2026-08-15");
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

test("indexes only events with complete original editorial content", () => {
  const event = {
    artist: "Artist", venue: "Venue", sources: ["https://tickets.example/show"],
    songs: [1, 2, 3].map(index => [`Song ${index}`, "", `https://www.youtube.com/watch?v=${index}`])
  };
  const editorial = {
    artists: { Artist: "아티스트를 직접 소개하는 충분히 구체적인 문장입니다. 음악적 특징과 공연 맥락을 독자가 이해할 수 있도록 설명합니다." },
    venues: { Venue: "공연장의 교통과 입장 동선을 직접 확인해 충분히 구체적으로 작성한 현장 안내 문장입니다. 귀가 방법도 함께 안내합니다." },
    eventGuides: { Artist: {
      focus: "공연에서 집중해서 볼 부분을 실제 음악과 무대 구성을 토대로 직접 작성한 설명입니다. 반복 템플릿이 아니라 아티스트만의 연주와 보컬 특성을 충분히 설명합니다. 라이브에서 음원과 달라지는 지점도 구체적으로 짚습니다.",
      listening: "대표곡을 어떤 순서로 들으면 좋은지 곡별 차이와 공연의 흐름을 연결해 직접 작성한 설명입니다. 처음 보는 관객에게 필요한 맥락을 충분히 전달합니다. 세 곡의 편곡과 감정선 차이도 함께 설명합니다.",
      plan: "공연장 도착과 입장, 화장실 이용과 귀가 방법을 해당 장소의 실제 동선에 맞춰 직접 작성한 안내입니다. 관객이 현장에서 바로 활용할 수 있게 설명합니다. 공연 종료 뒤 혼잡을 피할 대체 교통편도 덧붙입니다."
    } },
    songGuides: { Artist: [1, 2, 3].map(index => ({ title: `Song ${index}`, note: "곡의 구성과 보컬, 라이브에서 들을 지점을 구체적으로 설명한 고유한 감상 안내입니다." })) }
  };
  assert.equal(hasIndexableEventContent(event, editorial), true);
  assert.equal(hasIndexableEventContent(event, { ...editorial, songGuides: {} }), false);
  assert.equal(hasIndexableEventContent({ ...event, sources: [] }, editorial), false);
});

test("attributes indexable event articles to the named author and policy", () => {
  const event = { artist: "Artist", id: "artist-2026-09-01", concertDate: "2026-09-01", verifiedAt: "2026-08-15" };
  const article = articleStructuredData(event, "https://j-live.kr/calendar/events/artist-2026-09-01", "https://j-live.kr");
  const guide = richEventGuideMarkup(event, { eventGuides: { Artist: { focus: "관전", listening: "듣기", plan: "동선" } }, songGuides: { Artist: [] } });
  assert.match(article, /"@type":"Article"/);
  assert.match(article, /"name":"여일육"/);
  assert.match(guide, /rel="author">여일육 작성/);
  assert.match(guide, /href="\.\.\/guides\/verification">편집·검증 기준/);
});

test("publishes ticket availability only when it was explicitly verified", () => {
  const base = { artist: "Artist", concertDate: "2026-09-01", time: "오후 7:00", venue: "Hall", vendorUrl: "https://tickets.example/show", ticketDate: "2026-08-01", ticketTime: "오후 8:00", price: 99000 };
  const unknown = JSON.parse(structuredData(base, [base], "https://j-live.kr/calendar/events/artist", "https://j-live.kr"));
  const soldOut = JSON.parse(structuredData({ ...base, ticketAvailability: "sold_out" }, [base], "https://j-live.kr/calendar/events/artist", "https://j-live.kr"));
  assert.equal(unknown.offers.availability, undefined);
  assert.equal(soldOut.offers.availability, "https://schema.org/SoldOut");
});

test("renders crawlable upcoming concert facts on the homepage", () => {
  const html = homepageUpcomingMarkup([{
    id: "artist-2026-09-01", artist: "Artist", genre: "J-POP", concertDate: "2026-09-01", time: "오후 7:00",
    venue: "Venue", ticketDate: "2026-08-01", ticketTime: "오후 8:00", presaleDate: "", verifiedAt: "2026-08-15"
  }]);
  assert.match(html, /직접 확인한 다가오는 공연/);
  assert.match(html, /2026년 9월 1일/);
  assert.match(html, /공식 발표 없음/);
  assert.match(html, /\.\/events\/artist-2026-09-01/);
});

test("publishes an original annual data report without double-counting multi-date series", () => {
  const shared = { artist: "Band", venue: "Hall", vendor: "YES24", vendorUrl: "https://ticket.example/show", status: "confirmed", ticketDate: "2026-01-01", price: 99000, priceCurrency: "KRW", seatPrices: [{ name: "VIP", price: 154000 }] };
  const html = dataReportHtml([
    { ...shared, id: "band-1", concertDate: "2026-03-01", presaleDate: "2025-12-20" },
    { ...shared, id: "band-2", concertDate: "2026-03-02", presaleDate: "2025-12-20" },
    { ...shared, id: "other", artist: "Other", vendorUrl: "https://ticket.example/other", concertDate: "2026-04-01", price: 88000, presaleDate: "" }
  ], "https://j-live.kr", "2026-08-15");
  assert.match(html, /확인된 공연 시리즈<\/span><strong>2<\/strong>/);
  assert.match(html, /실제 공연일<\/span><strong>3<\/strong>/);
  assert.match(html, /참여 아티스트<\/span><strong>2<\/strong>/);
  assert.match(html, /선예매는 1\/2개 시리즈/);
  assert.match(html, /93,500원/);
  assert.match(html, /"@type":"Dataset"/);
  assert.doesNotMatch(html, /pagead2\.googlesyndication\.com/);
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

test("renders verified seat prices without a handwritten ticket guide", () => {
  const event = {
    artist: "Band",
    priceVerifiedAt: "2026-08-12",
    seatPrices: [
      { name: "VIP", price: 132000, priceCurrency: "KRW" },
      { name: "일반", price: 99000, priceCurrency: "KRW" }
    ]
  };
  const html = ticketGuideMarkup(event, {});
  assert.match(html, /VIP 132,000원 · 일반 99,000원/);
  assert.match(html, /마지막 확인 2026-08-12/);
});

test("renders every requested venue section", () => {
  const guide = { name: "Hall", summary: "요약", seoTitle: "Hall 위치·좌석 안내", firstDecision: "교통편과 좌석층을 먼저 정합니다.", variable: "당일 입장구와 보관 운영을 다시 확인합니다.", transit: "교통", capacity: "1,000석", arrival: "입장", restroom: "화장실", storage: "보관", parking: "관객 주차 없음", waiting: "대기", nearby: "식사", return: "귀가", verifiedAt: "2026-07-20", sources: [] };
  const html = venuePageHtml("hall", guide, "https://j-live.kr");
  for (const heading of ["지하철·버스에서 공연장까지", "좌석·수용 규모", "입장 줄까지의 동선", "화장실", "물품 보관", "관객 주차", "스탠딩·현장 대기", "귀가와 막차"]) assert.match(html, new RegExp(heading));
  assert.doesNotMatch(html, /주변 식사·카페/);
  assert.doesNotMatch(html, /시설 지도/);
  assert.doesNotMatch(html, /venue-site-map-svg/);
  assert.match(html, /<link rel="canonical" href="https:\/\/j-live\.kr\/calendar\/guides\/venues\/hall">/);
  assert.match(html, /<meta name="author" content="여일육">/);
  assert.match(html, /여일육 작성/);
  assert.match(html, /처음 가기 전에 먼저 정할 것/);
  assert.match(html, /공연별로 다시 확인할 것/);
  assert.match(html, /교통편과 좌석층을 먼저 정합니다/);
  assert.match(html, /"@type":"Article"/);
  assert.match(html, /"@type":"BreadcrumbList"/);
  assert.doesNotMatch(html, /pagead2\.googlesyndication\.com/);
  assert.doesNotMatch(html, /hall\.html/);
});

test("renders a useful venue comparison table on the venue index", () => {
  const html = venueIndexHtml({ hall: { name: "Hall", venues: ["Hall"], summary: "요약", transit: "지하철역에서 공연장까지 공식 이동 경로를 확인한 내용입니다.", storage: "공식 안내에서 물품보관함을 확인했습니다.", verifiedAt: "2026-08-15" } }, "https://j-live.kr");
  assert.match(html, /공연장별 접근·물품 보관 한눈에 비교/);
  assert.match(html, /venue-compare-table/);
  assert.match(html, /canonical" href="https:\/\/j-live\.kr\/calendar\/guides\/venues\/"/);
  assert.match(html, /href="\.\/hall"/);
  assert.doesNotMatch(html, /href="\.\/venues\//);
  assert.match(html, /href="\.\.\/\.\.\/about"/);
  assert.match(html, /지하철역에서 공연장까지/);
  assert.match(html, /물품보관함/);
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
