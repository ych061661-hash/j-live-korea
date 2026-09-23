"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { articleStructuredData, buildSeries, dataReportHtml, eventPageDecision, hasEditorialGuide, hasIndexableEventContent, homepageMeta, homepageScheduleMarkup, humanDate, isFreshlyVerified, relatedEvents, renderEventPage, richEventGuideMarkup, seoulDateKey, seriesDatesMarkup, songsMarkup, sourceLabel, structuredData, ticketGuideMarkup, ticketGroups, ticketGroupsMarkup, venueGuideForEvent, venueIndexHtml, venuePageHtml } = require("./generate-seo-pages");

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

test("derives homepage year copy from the build date", () => {
  assert.equal(homepageMeta("2026-12-31").title, "2026 J-POP 내한 공연·티켓팅 일정 | J-LIVE");
  assert.equal(homepageMeta("2027-01-01").title, "2027 J-POP 내한 공연·티켓팅 일정 | J-LIVE");
  assert.equal(homepageMeta("2027-01-01").headingYear, "2027");
});

test("calculates freshness for review queues independently from editorial approval", () => {
  assert.equal(isFreshlyVerified({ verifiedAt: "2026-09-18" }, "2026-09-19"), true);
  assert.equal(isFreshlyVerified({ verifiedAt: "2026-08-19" }, "2026-09-19"), false);
  assert.equal(isFreshlyVerified({ verifiedAt: "" }, "2026-09-19"), false);
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

test("keeps only future confirmed events in the related list", () => {
  const event = { id: "current", artist: "Current", concertDate: "2026-08-10", status: "confirmed" };
  const events = [event, { id: "cancelled", artist: "Cancelled", concertDate: "2026-08-11", status: "cancelled" }, { id: "past", artist: "Past", concertDate: "2026-08-01", status: "confirmed" }, { id: "future", artist: "Future", concertDate: "2026-08-12", status: "confirmed" }];
  assert.deepEqual(relatedEvents(event, events, "2026-08-10").map(item => item.id), ["future"]);
});

test("matches song notes by official video id before legacy title fallback", () => {
  const html = songsMarkup({ songs: [["Same title", "", "https://www.youtube.com/watch?v=official-id"]] }, [
    { title: "Same title", videoId: "wrong-id", note: "wrong title match" },
    { title: "Different title", videoId: "official-id", note: "official video match" }
  ]);
  assert.match(html, /official video match/);
  assert.doesNotMatch(html, /wrong title match/);
  const noReasons = songsMarkup({ songs: [["Song", "", "https://www.youtube.com/watch?v=id"]] });
  assert.match(noReasons, /Song/);
  assert.doesNotMatch(noReasons, /<em>/);
});

test("keeps event-specific ticket conditions, omits price duplication, and skips generic artist/song sections", () => {
  const template = '<!-- EVENT_TICKET_ANALYSIS --><!-- EVENT_ARTIST_INTRO --><!-- EVENT_VENUE_GUIDE --><!-- EVENT_SONGS --><dd id="factPrice"></dd>';
  const html = renderEventPage({
    event: { id: "artist-2026-09-01", artist: "Artist", concertDate: "2026-09-01", time: "오후 7:00", venue: "Hall", status: "confirmed", songs: [], sources: [] },
    events: [], group: [{ id: "artist-2026-09-01", concertDate: "2026-09-01", time: "오후 7:00" }], primary: { id: "artist-2026-09-01" },
    editorial: { ticketGuides: { Artist: { price: "R 100원", identity: "실명 확인", ticket: "현장 수령" } }, artists: {}, venues: {}, songGuides: {} }, siteUrl: "https://j-live.kr", template, today: "2026-08-01"
  });
  assert.match(html, /예매 조건·티켓 안내/);
  assert.match(html, /실명 확인/);
  assert.doesNotMatch(html, /공연별 실제 예매 분석|Artist의 한국 공연입니다|입문용 추천 순서/);
  assert.doesNotMatch(ticketGuideMarkup({ artist: "Artist", seatPrices: [{ name: "R", price: 100000 }] }, { ticketGuides: { Artist: { price: "R 100,000원" } } }), /R 100/);
  assert.match(html, /<dd id="factPrice">R 100원<\/dd>/);
});

test("uses an existing artist introduction and leaves shared show-day guidance as one link", () => {
  const template = '<!-- EVENT_TICKET_ANALYSIS --><!-- EVENT_ARTIST_INTRO --><!-- EVENT_VENUE_GUIDE --><!-- EVENT_SONGS --><section><a href="../guides/standing-concert">공연 당일 공통 준비 체크리스트</a></section>';
  const html = renderEventPage({
    event: { id: "artist-2026-09-01", artist: "Artist", concertDate: "2026-09-01", time: "오후 7:00", venue: "Hall", status: "confirmed", songs: [["Track", "", "https://www.youtube.com/watch?v=track-id"]], sources: ["https://official.example/show"] },
    events: [], group: [{ id: "artist-2026-09-01", concertDate: "2026-09-01", time: "오후 7:00" }], primary: { id: "artist-2026-09-01" },
    editorial: { artists: { Artist: "저장소에 이미 등록된 편집자 소개입니다." }, venues: {}, songGuides: {} }, siteUrl: "https://j-live.kr", template, today: "2026-08-01"
  });
  assert.match(html, /저장소에 이미 등록된 편집자 소개입니다\./);
  assert.match(html, /공식 대표곡 영상/);
  assert.match(html, /공연 당일 공통 준비 체크리스트/);
  assert.doesNotMatch(html, /입장구와 집합 시각|최신 판매 상태와 관람 조건|위 예매 분석/);
});

test("renders artist-specific editorial content only when it exists", () => {
  const event = { artist: "Artist", verifiedAt: "2026-07-20" };
  const editorial = { eventGuides: { Artist: { focus: "관전 포인트", listening: "듣는 순서", plan: "동선 메모" } } };

  const html = richEventGuideMarkup(event, editorial);
  assert.match(html, /J-LIVE ORIGINAL/);
  assert.match(html, /관전 포인트/);
  assert.doesNotMatch(html, /듣는 순서/);
  assert.match(html, /동선 메모/);
  assert.equal(hasEditorialGuide(event, editorial), true);
  assert.equal(hasEditorialGuide({ artist: "Unknown" }, editorial), false);
  assert.equal(richEventGuideMarkup({ artist: "Unknown" }, editorial), "");
});

test("uses documented editorial judgment rather than word or song-count thresholds", () => {
  const event = {
    id: "artist-2026-09-20", artist: "Artist", venue: "Venue", status: "confirmed",
    concertDate: "2026-09-20", verifiedAt: "2026-09-19", sources: ["https://tickets.example/show"],
    songs: [["Song A", "", "https://youtube.com/watch?v=a"]],
    ticketDate: "2026-08-01", seatPrices: [{ name: "일반", price: 99000 }]
  };
  const editorial = {
    eventGuides: { Artist: { focus: "이번 회차 안내", plan: "공식 장소 안내" } }
  };
  const review = { quality: "approved", index: "approved", ads: "approved", duplicateCheck: "clear", reviewedAt: "2026-09-19", readerTasks: ["회차 확인"], specificValue: ["해당 공연의 좌석별 가격 비교"], evidenceSources: ["https://tickets.example/show"] };
  assert.equal(hasIndexableEventContent(event, editorial, review), true);
  assert.equal(hasIndexableEventContent(event, { eventGuides: { Artist: { focus: "일반적인 공연은 즐겁습니다.", plan: "즐겁게 관람하세요." } } }, undefined), false);
  assert.equal(hasIndexableEventContent({ ...event, sources: [] }, editorial, review), false);
  assert.equal(hasIndexableEventContent({ ...event, ticketingStatus: "conflict" }, editorial, review), false);
});

test("separates index and ad approval; archive pages require an explicit record review", () => {
  const event = { id: "archive-show", artist: "Band", venue: "Hall", status: "confirmed", concertDate: "2026-01-01", verifiedAt: "2025-12-01", sources: ["https://official.example/show"], ticketDate: "2025-10-01" };
  const editorial = { eventGuides: { Band: { focus: "Show-specific decisions", plan: "Venue details" } } };
  const review = { quality: "approved", index: "approved", ads: "not-approved", duplicateCheck: "clear", archive: "approved", reviewedAt: "2026-09-20", readerTasks: ["Past ticket conditions"], specificValue: ["Record of this show"], evidenceSources: ["https://official.example/show"] };
  const decision = eventPageDecision(event, editorial, review, "2026-09-23");
  assert.equal(decision.indexable, true);
  assert.equal(decision.adsAllowed, false);
  assert.equal(decision.archive, true);
  assert.equal(decision.needsRecheck, true);
  assert.equal(eventPageDecision(event, editorial, { ...review, archive: undefined }, "2026-09-23").indexable, false);
  assert.equal(eventPageDecision({ ...event, concertDate: "2026-10-01" }, editorial, { ...review, archive: undefined }, "2026-09-23").indexable, true);
});

test("attributes indexable event articles to the named author and policy", () => {
  const event = { artist: "Artist", id: "artist-2026-09-01", concertDate: "2026-09-01", verifiedAt: "2026-08-15" };
  const article = articleStructuredData(event, "https://j-live.kr/calendar/events/artist-2026-09-01", "https://j-live.kr");
  const guide = richEventGuideMarkup(event, { eventGuides: { Artist: { focus: "관전", listening: "대표곡 내용을 반복하는 설명", plan: "동선" } }, songGuides: { Artist: [] } });
  assert.match(article, /"@type":"Article"/);
  assert.match(article, /"name":"여일육"/);
  assert.match(guide, /rel="author">여일육 작성/);
  assert.match(guide, /href="\.\.\/guides\/verification">편집·검증 기준/);
  assert.doesNotMatch(guide, /대표곡 내용을 반복하는 설명/);
});

test("does not publish unverified ticket inventory in structured data", () => {
  const base = { artist: "Artist", concertDate: "2026-09-01", time: "오후 7:00", venue: "Hall", vendorUrl: "https://tickets.example/show", ticketDate: "2026-08-01", ticketTime: "오후 8:00", price: 99000 };
  const unknown = JSON.parse(structuredData(base, [base], "https://j-live.kr/calendar/events/artist", "https://j-live.kr"));
  assert.equal(unknown.offers.availability, undefined);
  const soldOut = JSON.parse(structuredData({ ...base, ticketAvailability: "sold_out" }, [base], "https://j-live.kr/calendar/events/artist", "https://j-live.kr"));
  assert.equal(soldOut.offers.availability, undefined);
  const verifiedSoldOut = JSON.parse(structuredData({ ...base, ticketAvailability: "sold_out", ticketStatusVerifiedAt: "2026-08-15T10:00:00+09:00", ticketStatusSource: "https://tickets.example/show" }, [base], "https://j-live.kr/calendar/events/artist", "https://j-live.kr"));
  assert.equal(verifiedSoldOut.offers.availability, "https://schema.org/SoldOut");
  assert.equal(JSON.parse(structuredData({ ...base, status: "cancelled" }, [base], "https://j-live.kr/calendar/events/artist", "https://j-live.kr")).eventStatus, "https://schema.org/EventCancelled");
});

test("matches song notes by title and labels sources by verified vendor or exact domain", () => {
  const html = songsMarkup({ songs: [["B", "기본 B", "https://www.youtube.com/watch?v=b"], ["A", "기본 A", "https://www.youtube.com/watch?v=a"]] }, [{ title: "A", note: "A에 맞는 설명" }, { title: "B", note: "B에 맞는 설명" }]);
  assert.match(html, /B에 맞는 설명/);
  assert.match(html, /A에 맞는 설명/);
  assert.doesNotMatch(html, /기본 [AB]/);
  assert.equal(sourceLabel("https://ticket.yes24.com/Perf/1"), "YES24 예매 페이지");
  assert.equal(sourceLabel("https://official.example/path"), "official.example");
});

test("renders all public upcoming concert facts and ticket schedules on the homepage", () => {
  const html = homepageScheduleMarkup([{
    id: "artist-2026-09-01", artist: "Artist", genre: "J-POP", concertDate: "2026-09-01", time: "오후 7:00", status: "confirmed",
    venue: "Venue", ticketDate: "2026-09-02", ticketTime: "오후 8:00", presaleDate: "", ticketingStatus: "confirmed", verifiedAt: "2026-08-15", seatPrices: [{ name: "일반", price: 99000, priceCurrency: "KRW" }]
  }, { id: "hold", artist: "Hold", concertDate: "2026-09-03", status: "pending", hostingStatus: "confirmed", ticketingStatus: "conflict" }], { Artist: ["아티스트"] }, "2026-09-01");
  assert.match(html, /전체 예정 공연/);
  assert.match(html, /2026년 9월 1일/);
  assert.match(html, /일반예매/);
  assert.match(html, /예매 오픈 예정도 보기/);
  assert.match(html, /아티스트 \(Artist\)/);
  assert.doesNotMatch(html, />Hold</);
  assert.match(html, /\.\/events\/artist-2026-09-01/);
});

test("omits past concerts and groups shared ticket openings", () => {
  const html = homepageScheduleMarkup([
    { id: "past", artist: "Past", concertDate: "2026-09-05", status: "confirmed" },
    { id: "future", artist: "Future", venue: "Hall", vendorUrl: "https://ticket.example/future", concertDate: "2026-09-07", ticketDate: "2026-09-06", ticketTime: "오후 8:00", ticketingStatus: "confirmed", status: "confirmed" },
    { id: "future-2", artist: "Future", venue: "Hall", vendorUrl: "https://ticket.example/future", concertDate: "2026-09-08", ticketDate: "2026-09-06", ticketTime: "오후 8:00", ticketingStatus: "confirmed", status: "confirmed" }
  ], {}, "2026-09-06");
  assert.doesNotMatch(html, /Past/);
  assert.match(html, /Future/);
  assert.equal(ticketGroups([{ artist: "Future", venue: "Hall", vendorUrl: "https://ticket.example/future", concertDate: "2026-09-07", ticketDate: "2026-09-06", ticketTime: "오후 8:00", ticketingStatus: "confirmed" }, { artist: "Future", venue: "Hall", vendorUrl: "https://ticket.example/future", concertDate: "2026-09-08", ticketDate: "2026-09-06", ticketTime: "오후 8:00", ticketingStatus: "confirmed" }], "2026-09-06")[0].events.length, 2);
});

test("keeps separate presales with different eligibility and does not invent a missing time", () => {
  const groups = ticketGroups([
    { artist: "Future", venue: "Hall", concertDate: "2026-09-07", presaleDate: "2026-09-06", ticketingStatus: "confirmed", presaleStatus: "membership", presaleEligibility: "A" },
    { artist: "Future", venue: "Hall", concertDate: "2026-09-08", presaleDate: "2026-09-06", ticketingStatus: "confirmed", presaleStatus: "membership", presaleEligibility: "B" }
  ], "2026-09-06");
  assert.equal(groups.length, 2);
  assert.match(ticketGroupsMarkup([{ artist: "Future", venue: "Hall", concertDate: "2026-09-07", ticketDate: "2026-09-06", ticketingStatus: "confirmed" }], {}, "2026-09-06"), /시간 미확인/);
});

test("publishes an original annual data report without double-counting multi-date series", () => {
  const shared = { artist: "Band", venue: "Hall", vendor: "YES24", vendorUrl: "https://ticket.example/show", status: "confirmed", ticketDate: "2026-01-01", price: 99000, priceCurrency: "KRW", seatPrices: [{ name: "VIP", price: 154000 }, { name: "일반", price: 99000 }] };
  const html = dataReportHtml([
    { ...shared, id: "band-1", concertDate: "2026-03-01", presaleDate: "2025-12-20" },
    { ...shared, id: "band-2", concertDate: "2026-03-02", presaleDate: "2025-12-20" },
    { ...shared, id: "other", artist: "Other", vendorUrl: "https://ticket.example/other", concertDate: "2026-04-01", price: 88000, presaleDate: "" }
  ], "https://j-live.kr", "2026-08-15");
  assert.match(html, /확인된 공연 시리즈<\/span><strong>2<\/strong>/);
  assert.match(html, /확인된 공연 회차<\/span><strong>3<\/strong>/);
  assert.match(html, /서로 다른 공연 날짜<\/span><strong>3<\/strong>/);
  assert.match(html, /기록된 아티스트 표기<\/span><strong>2<\/strong>/);
  assert.match(html, /선예매는 1\/2개 시리즈/);
  assert.match(html, /전체 2개 시리즈 원자료 표 보기/);
  assert.match(html, /일반 99,000원/);
  assert.match(html, /공식 자료 출처/);
  assert.match(html, /99,000원/);
  assert.match(html, /"@type":"Dataset"/);
  assert.match(html, /3월<\/strong><span>2회차/);
  assert.match(html, /분석에 사용한 전체 공연 기록/);
  assert.match(html, /원자료 생성일/);
  assert.match(html, /전체 한국 공연 시장 통계가 아닙니다/);
  assert.doesNotMatch(html, /pagead2\.googlesyndication\.com/);
});

test("renders ticket analysis and resolves a venue field guide", () => {
  const event = { artist: "Band", venue: "Hall", verifiedAt: "2026-07-20" };
  const editorial = {
    ticketGuides: { Band: { price: "R 100원", presale: "없음", identity: "확인", ticket: "현장수령", cancellation: "고정 시각 없음", verifiedAt: "2026-07-20" } },
    venueGuides: { hall: { name: "Hall", venues: ["Hall"] } }
  };
  assert.match(ticketGuideMarkup(event, editorial), /예매 조건·티켓 안내/);
  assert.doesNotMatch(ticketGuideMarkup(event, editorial), /좌석 등급과 가격|R 100원/);
  assert.equal(venueGuideForEvent(event, editorial)[0], "hall");
});

test("groups the same multi-date show while preserving one detail link per occurrence", () => {
  const html = homepageScheduleMarkup([
    { id: "series-1", artist: "Series", venue: "Hall", vendorUrl: "https://ticket.example/series", concertDate: "2026-10-03", time: "오후 6:00", ticketingStatus: "confirmed", status: "confirmed", seatPrices: [{ name: "일반", price: 10000 }] },
    { id: "series-2", artist: "Series", venue: "Hall", vendorUrl: "https://ticket.example/series", concertDate: "2026-10-04", time: "오후 5:00", ticketingStatus: "confirmed", status: "confirmed", seatPrices: [{ name: "일반", price: 12000 }] },
    { id: "other-series", artist: "Series", venue: "Arena", vendorUrl: "https://ticket.example/other", concertDate: "2026-10-05", status: "confirmed" }
  ], {}, "2026-09-23");
  assert.match(html, /3일\(토\) 오후 6:00/);
  assert.match(html, /4일\(일\) 오후 5:00/);
  assert.match(html, /series-1/);
  assert.match(html, /series-2/);
  assert.match(html, /10,000원/);
  assert.match(html, /12,000원/);
  assert.equal((html.match(/data-home-event-id="series-1"/g) || []).length, 1);
  assert.equal((html.match(/data-home-event-id="other-series"/g) || []).length, 1);
});

test("compares showtimes and named ticket tiers without inventing benefits", () => {
  const group = [
    { concertDate: "2026-10-03", time: "오후 6:00" },
    { concertDate: "2026-10-04", time: "오후 5:00" }
  ];
  const event = { artist: "Band", seatPrices: [{ name: "M&G석", price: 253000 }, { name: "일반석", price: 165000 }] };
  const html = ticketGuideMarkup(event, {}, group);
  assert.match(html, /회차별 시작 시각/);
  assert.match(html, /오후 6:00/);
  assert.match(html, /오후 5:00/);
  assert.doesNotMatch(html, /M&amp;G석|88,000원 높음/);
  assert.doesNotMatch(html, /특전 제공|사운드체크 참여권 제공/);
});

test("does not duplicate verified seat prices in the ticket-conditions section", () => {
  const event = {
    artist: "Band",
    priceVerifiedAt: "2026-08-12",
    seatPrices: [
      { name: "VIP", price: 132000, priceCurrency: "KRW" },
      { name: "일반", price: 99000, priceCurrency: "KRW" }
    ]
  };
  const html = ticketGuideMarkup(event, {});
  assert.equal(html, "");
});

test("renders every requested venue section", () => {
  const guide = { name: "Hall", summary: "요약", seoTitle: "Hall 위치·좌석 안내", firstDecision: "교통편과 좌석층을 먼저 정합니다.", variable: "당일 입장구와 보관 운영을 다시 확인합니다.", officialFacts: "공식 도면에서 확인한 시설입니다.", eventSpecific: "당일 게이트는 공연마다 다릅니다.", unknownAction: "공식 출처를 다시 확인하세요.", transit: "교통", capacity: "1,000석", arrival: "입장", restroom: "화장실", storage: "보관", parking: "관객 주차 없음", waiting: "대기", nearby: "식사", return: "귀가", verifiedAt: "2026-07-20", sources: [] };
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
  assert.match(html, /확인된 정보와 당일 확인 항목/);
  assert.match(html, /공식 도면에서 확인한 시설입니다/);
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
  assert.doesNotMatch(html, /pagead2\.googlesyndication\.com/);
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
