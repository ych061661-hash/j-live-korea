"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { weeklyRedirectRules } = require("./generate-seo-pages");
const { articleStructuredData, buildSeries, dataReportHtml, eventPageDecision, hasEditorialGuide, hasIndexableEventContent, homepageMeta, homepageScheduleMarkup, humanDate, isFreshlyVerified, relatedEvents, renderEventPage, richEventGuideMarkup, seoulDateKey, seriesDatesMarkup, songsMarkup, sourceLabel, structuredData, ticketGuideMarkup, ticketGroups, ticketGroupsMarkup, venueGuideForEvent, venueIndexHtml, venuePageHtml, venueRelatedEventsMarkup } = require("./generate-seo-pages");

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

test("redirects the weekly index to its current dated canonical page", () => {
  const rules = weeklyRedirectRules("# BEGIN GENERATED WEEKLY REDIRECTS\n# END GENERATED WEEKLY REDIRECTS\n", "2026-09-21");
  assert.match(rules, /\/calendar\/weekly\/index\.html  \/calendar\/weekly\/2026-09-21  301/);
  assert.match(rules, /\/calendar\/weekly\/  \/calendar\/weekly\/2026-09-21  301/);
  assert.match(rules, /\/calendar\/weekly  \/calendar\/weekly\/2026-09-21  301/);
  assert.throws(() => weeklyRedirectRules("", "2026-09-21"), /Missing generated weekly redirect markers/);
  assert.throws(() => weeklyRedirectRules("# BEGIN GENERATED WEEKLY REDIRECTS\n# END GENERATED WEEKLY REDIRECTS\n", "not-a-date"), /Invalid weekly redirect date/);
});

test("omits missing artist photos from event content and structured data instead of substituting a brand image", () => {
  const event = {
    id: "artist-without-avatar-2026-10-01", artist: "Artist Without Avatar", concertDate: "2026-10-01",
    time: "오후 7:00", venue: "Hall", status: "confirmed", youtubeChannel: "",
    youtubeProfileImage: "", sources: [], songs: []
  };
  const html = renderEventPage({
    event, events: [event], group: [event], primary: event, editorial: { artists: {}, venues: {} },
    review: undefined, siteUrl: "https://j-live.kr",
    template: '<html><head><title>공연 상세 | 제이라이브 코리아</title><meta name="description" content="J-POP 내한 공연 일정, 예매 정보, 공연장 교통과 대표곡을 확인하세요."><meta name="robots" content="noindex,follow"><link rel="canonical" id="canonicalLink" href=""></head><body><article id="eventArticle" hidden><section class="event-hero"><img id="eventPhoto" alt="" referrerpolicy="no-referrer" width="1200" height="675" decoding="async" fetchpriority="high"></section></article></body></html>',
    today: "2026-09-25"
  });

  assert.doesNotMatch(html, /<img id="eventPhoto"|<meta property="og:image"|j-live-(?:social-card|app-logo)\.png/);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json" id="(?:event|article)StructuredData">([\s\S]*?)<\/script>/g)];
  assert.equal(schemas.length, 2);
  for (const [, serialized] of schemas) assert.equal(Object.hasOwn(JSON.parse(serialized), "image"), false);
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

test("shows linked song titles without unsupported per-song editorial notes", () => {
  const html = songsMarkup({ songs: [["Same title", "Unverified note", "https://www.youtube.com/watch?v=official-id"]] });
  assert.match(html, /Same title/);
  assert.match(html, /href="https:\/\/www\.youtube\.com\/watch\?v=official-id"/);
  assert.match(html, /YouTube 영상/);
  assert.doesNotMatch(html, /Unverified note|<em>.*감상/);
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

test("uses an artist introduction only with its official source and keeps shared show-day guidance as a link", () => {
  const template = '<!-- EVENT_TICKET_ANALYSIS --><!-- EVENT_ARTIST_INTRO --><!-- EVENT_VENUE_GUIDE --><!-- EVENT_SONGS --><section><a href="../guides/standing-concert">공연 당일 공통 준비 체크리스트</a></section>';
  const html = renderEventPage({
    event: { id: "artist-2026-09-01", artist: "Artist", concertDate: "2026-09-01", time: "오후 7:00", venue: "Hall", status: "confirmed", songs: [["Track", "", "https://www.youtube.com/watch?v=track-id"]], sources: ["https://official.example/show"] },
    events: [], group: [{ id: "artist-2026-09-01", concertDate: "2026-09-01", time: "오후 7:00" }], primary: { id: "artist-2026-09-01" },
    editorial: { artists: { Artist: "출처가 없는 기존 소개입니다." }, artistProfiles: { Artist: { summary: "공식 프로필로 확인된 소개입니다.", source: "https://official.example/profile" } }, venues: {}, songGuides: {} }, siteUrl: "https://j-live.kr", template, today: "2026-08-01"
  });
  assert.match(html, /공식 프로필로 확인된 소개입니다/);
  assert.match(html, /href="https:\/\/official\.example\/profile"[^>]*>아티스트 공식 프로필/);
  assert.doesNotMatch(html, /출처가 없는 기존 소개입니다/);
  assert.match(html, /관련 곡 영상/);
  assert.match(html, /공연 당일 공통 준비 체크리스트/);
  assert.doesNotMatch(html, /입장구와 집합 시각|최신 판매 상태와 관람 조건|위 예매 분석/);
});

test("links event pages to the venue guide without repeating generic venue copy", () => {
  const template = '<!-- EVENT_TICKET_ANALYSIS --><!-- EVENT_ARTIST_INTRO --><!-- EVENT_VENUE_GUIDE --><!-- EVENT_SONGS -->';
  const html = renderEventPage({
    event: { id: "artist-2026-09-01", artist: "Artist", concertDate: "2026-09-01", time: "오후 7:00", venue: "Hall", status: "confirmed", songs: [], sources: [] },
    events: [], group: [{ id: "artist-2026-09-01", concertDate: "2026-09-01", time: "오후 7:00" }], primary: { id: "artist-2026-09-01" },
    editorial: {
      artists: {},
      venues: { Hall: "상세 페이지마다 되풀이되던 일반 교통 안내입니다." },
      venueGuides: { hall: { name: "Hall", venues: ["Hall"] } }
    },
    siteUrl: "https://j-live.kr", template, today: "2026-08-01"
  });
  assert.match(html, /href="\.\.\/guides\/venues\/hall">Hall 방문 가이드 보기/);
  assert.doesNotMatch(html, /되풀이되던 일반 교통 안내|id="venueGuide"/);
});

test("renders artist-specific editorial content only when it exists", () => {
  const event = { artist: "Artist", verifiedAt: "2026-07-20" };
  const editorial = { eventGuides: { Artist: { focus: "관전 포인트", listening: "듣는 순서", plan: "동선 메모" } } };

  const html = richEventGuideMarkup(event, editorial);
  assert.match(html, /EDITORIAL NOTE/);
  assert.match(html, /주관적 편집 해석이며 공식 발표나 공연 세트리스트를 뜻하지 않습니다/);
  assert.match(html, /음악에서 살펴볼 점/);
  assert.match(html, /관전 포인트/);
  assert.doesNotMatch(html, /듣는 순서/);
  assert.doesNotMatch(html, /동선 메모/);
  assert.equal(hasEditorialGuide(event, editorial), true);
  assert.equal(hasEditorialGuide({ artist: "Unknown" }, editorial), false);
  assert.equal(richEventGuideMarkup({ artist: "Unknown" }, editorial), "");
});

test("does not repeat artist-level editorial or venue plans on secondary series pages", () => {
  const html = richEventGuideMarkup(
    { id: "show-2", artist: "Artist" },
    { eventGuides: { Artist: { focus: "Artist-wide music analysis", plan: "Unverified venue plan" } } },
    { id: "show-1" }
  );
  assert.match(html, /공연 시리즈 공통 음악 감상 노트/);
  assert.match(html, /href="\.\/events\/show-1"/);
  assert.doesNotMatch(html, /Artist-wide music analysis|Unverified venue plan/);
});

test("uses documented editorial judgment rather than word or song-count thresholds", () => {
  const event = {
    id: "artist-2026-09-20", artist: "Artist", venue: "Venue", status: "confirmed", ticketingStatus: "confirmed",
    concertDate: "2026-09-20", verifiedAt: "2026-09-19", sources: ["https://tickets.example/show"],
    priceVerifiedAt: "2026-09-19", songs: [["Song A", "", "https://youtube.com/watch?v=a"]],
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
  assert.equal(hasIndexableEventContent({ ...event, seatPrices: [], ticketDate: "", ticketingStatus: "" }, editorial, review), false);
  assert.equal(hasIndexableEventContent({ ...event, verification: { price: { status: "unverified" } }, ticketDate: "", ticketingStatus: "" }, editorial, review), false);
});

test("separates index and ad approval; archive pages require an explicit record review", () => {
  const event = { id: "archive-show", artist: "Band", venue: "Hall", status: "confirmed", ticketingStatus: "confirmed", concertDate: "2026-01-01", verifiedAt: "2025-12-01", sources: ["https://official.example/show"], ticketDate: "2025-10-01" };
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

test("stale schedule or ticket facts suspend ads without removing the useful event page from the index", () => {
  const event = {
    id: "freshness-show", artist: "Band", venue: "Hall", status: "confirmed", ticketingStatus: "confirmed",
    concertDate: "2026-10-01", verifiedAt: "2026-08-25", scheduleVerifiedAt: "2026-08-25",
    ticketDate: "2026-08-01", priceVerifiedAt: "2026-09-19", sources: ["https://official.example/show"],
    seatPrices: [{ name: "일반", price: 99000 }],
    verification: {
      concertDate: { status: "confirmed", verifiedAt: "2026-08-25" },
      ticketDate: { status: "confirmed", verifiedAt: "2026-09-19" },
      price: { status: "confirmed", verifiedAt: "2026-09-19" }
    }
  };
  const review = { quality: "approved", index: "approved", ads: "approved", duplicateCheck: "clear", reviewedAt: "2026-09-20", readerTasks: ["좌석 가격 비교"], specificValue: ["검증된 좌석 가격"], evidenceSources: ["https://official.example/show"] };
  const editorial = {};

  const stale = eventPageDecision(event, editorial, review, "2026-09-25");
  assert.equal(stale.needsRecheck, true);
  assert.equal(stale.indexable, true);
  assert.equal(stale.adsAllowed, false);

  const atBoundary = eventPageDecision({
    ...event, verifiedAt: "2026-08-26", scheduleVerifiedAt: "2026-08-26",
    verification: { ...event.verification, concertDate: { status: "confirmed", verifiedAt: "2026-08-26" } }
  }, editorial, review, "2026-09-25");
  assert.equal(atBoundary.needsRecheck, false);
  assert.equal(atBoundary.adsAllowed, true);

  const stalePrice = eventPageDecision({
    ...event, verifiedAt: "2026-09-23", scheduleVerifiedAt: "2026-09-23", priceVerifiedAt: "2026-08-25",
    verification: { ...event.verification, concertDate: { status: "confirmed", verifiedAt: "2026-09-23" }, price: { status: "confirmed", verifiedAt: "2026-08-25" } }
  }, editorial, review, "2026-09-25");
  assert.equal(stalePrice.needsRecheck, false);
  assert.equal(stalePrice.indexable, true);
  assert.equal(stalePrice.adsAllowed, false);

  const missingPriceCheck = eventPageDecision({
    ...event, verifiedAt: "2026-09-23", scheduleVerifiedAt: "2026-09-23", priceVerifiedAt: undefined,
    verification: { ...event.verification, concertDate: { status: "confirmed", verifiedAt: "2026-09-23" }, price: undefined }
  }, editorial, review, "2026-09-25");
  assert.equal(missingPriceCheck.indexable, true);
  assert.equal(missingPriceCheck.adsAllowed, false);

  const archived = eventPageDecision({ ...event, concertDate: "2026-01-01" }, editorial, { ...review, archive: "approved" }, "2026-09-25");
  assert.equal(archived.indexable, true);
  assert.equal(archived.adsAllowed, false);
});

test("attributes indexable event articles to the named author and policy", () => {
  const event = { artist: "Artist", id: "artist-2026-09-01", concertDate: "2026-09-01", verifiedAt: "2026-08-15" };
  const article = articleStructuredData(event, "https://j-live.kr/calendar/events/artist-2026-09-01", "https://j-live.kr");
  const guide = richEventGuideMarkup(event, { eventGuides: { Artist: { focus: "관전", listening: "대표곡 내용을 반복하는 설명", plan: "동선" } }, songGuides: { Artist: [] } });
  assert.match(article, /"@type":"Article"/);
  assert.match(article, /"name":"여일육"/);
  assert.doesNotMatch(article, /"dateModified"/);
  assert.match(articleStructuredData({ ...event, articleUpdatedAt: "2026-09-22" }, "https://j-live.kr/calendar/events/artist-2026-09-01", "https://j-live.kr"), /"dateModified":"2026-09-22"/);
  assert.match(guide, /rel="author">여일육 작성/);
  assert.match(guide, /href="\.\.\/guides\/verification">편집·검증 기준/);
  assert.doesNotMatch(guide, /대표곡 내용을 반복하는 설명/);
});

test("does not publish unverified or historical ticket inventory in structured data", () => {
  const base = { artist: "Artist", concertDate: "2026-10-10", time: "오후 7:00", venue: "Hall", vendorUrl: "https://tickets.example/show", ticketDate: "2026-08-01", ticketTime: "오후 8:00", price: 99000 };
  const unknown = JSON.parse(structuredData(base, [base], "https://j-live.kr/calendar/events/artist", "https://j-live.kr"));
  assert.equal(unknown.offers.availability, undefined);
  assert.equal(unknown.offers.validFrom, undefined);
  assert.equal(unknown.offers.price, undefined);
  const verifiedOffer = JSON.parse(structuredData({ ...base, ticketingStatus: "confirmed" }, [base], "https://j-live.kr/calendar/events/artist", "https://j-live.kr"));
  assert.equal(verifiedOffer.offers.validFrom, "2026-08-01T20:00:00+09:00");
  assert.equal(verifiedOffer.offers.price, 99000);
  const soldOut = JSON.parse(structuredData({ ...base, ticketAvailability: "sold_out" }, [base], "https://j-live.kr/calendar/events/artist", "https://j-live.kr"));
  assert.equal(soldOut.offers.availability, undefined);
  const verifiedSoldOut = JSON.parse(structuredData({ ...base, ticketAvailability: "sold_out", ticketStatusVerifiedAt: "2026-08-15T10:00:00+09:00", ticketStatusSource: "https://tickets.example/show" }, [base], "https://j-live.kr/calendar/events/artist", "https://j-live.kr"));
  assert.equal(verifiedSoldOut.offers.availability, "https://schema.org/SoldOut");
  const pastSoldOut = JSON.parse(structuredData({ ...base, concertDate: "2026-09-01", ticketAvailability: "sold_out", ticketStatusVerifiedAt: "2026-08-15T10:00:00+09:00", ticketStatusSource: "https://tickets.example/show" }, [base], "https://j-live.kr/calendar/events/artist", "https://j-live.kr"));
  assert.equal(pastSoldOut.offers.availability, undefined);
  assert.equal(JSON.parse(structuredData({ ...base, status: "cancelled" }, [base], "https://j-live.kr/calendar/events/artist", "https://j-live.kr")).eventStatus, "https://schema.org/EventCancelled");
});

test("omits unverified song descriptions and labels sources by verified vendor or exact domain", () => {
  const html = songsMarkup({ songs: [["B", "확인되지 않은 설명 B", "https://www.youtube.com/watch?v=b"], ["A", "확인되지 않은 설명 A", "https://www.youtube.com/watch?v=a"]] });
  assert.match(html, /B/);
  assert.match(html, /A/);
  assert.doesNotMatch(html, /확인되지 않은 설명/);
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

test("publishes an endDate only from the current event's verified endTime", () => {
  const base = { artist: "Artist", concertDate: "2026-11-07", time: "오후 7:00", venue: "Hall", vendorUrl: "https://tickets.example/show" };
  const neighboringEvent = {
    ...base,
    id: "neighboring-show",
    endTime: "21:00",
    verification: { endTime: { status: "confirmed", sources: ["https://official.example/neighboring-show"] } }
  };
  const currentWithoutEndTime = { ...base, id: "current-show" };
  const omitted = JSON.parse(structuredData(currentWithoutEndTime, [currentWithoutEndTime, neighboringEvent], "https://j-live.kr/calendar/events/current-show", "https://j-live.kr"));
  assert.equal(omitted.endDate, undefined);

  const regallily = {
    ...base,
    id: "regallily-2026-11-07",
    endTime: "20:30",
    verification: { endTime: { status: "confirmed", verifiedAt: "2026-09-25", sources: ["https://www.highjinkx.com/show-list/regallily"] } }
  };
  const verified = JSON.parse(structuredData(regallily, [regallily], "https://j-live.kr/calendar/events/regallily-2026-11-07", "https://j-live.kr"));
  assert.equal(verified.endDate, "2026-11-07T20:30:00+09:00");
});

test("Fujii Kaze detail separates verified ticket conditions and never labels the ticket vendor as organizer", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const vm = require("node:vm");
  const events = JSON.parse(fs.readFileSync(path.join(__dirname, "../calendar/data/events.json"), "utf8"));
  const content = fs.readFileSync(path.join(__dirname, "../calendar/content.js"), "utf8");
  const event = events.find(item => item.id === "fujii-kaze-2027-01-09");
  const window = {};
  vm.runInNewContext(content, { window });
  const guide = window.JLIVE_CONTENT.ticketGuides["Fujii Kaze"];
  assert.ok(event && guide, "Fujii Kaze source data and ticket guide must exist");
  const detail = ticketGuideMarkup(event, { ticketGuides: { "Fujii Kaze": guide } });
  assert.match(detail, /만 7세 이상/);
  assert.match(detail, /장애인 할인/);
  assert.match(detail, /본인 확인·증빙 조건/);
  assert.match(detail, /현장 수령/);
  assert.match(detail, /일반 예매자의 구매 매수 제한이 표시되어 있지 않습니다/);
  assert.doesNotMatch(detail, /4매|12월 8일|전 관객 본인 확인/);

  const jsonLd = JSON.parse(structuredData(event, [event], "https://j-live.kr/calendar/events/fujii-kaze-2027-01-09", "https://j-live.kr"));
  assert.deepEqual(jsonLd.organizer, {
    "@type": "Organization", name: "AEG Presents Asia", url: "https://asia.aegpresents.com/"
  });
  assert.notEqual(jsonLd.organizer.url, event.vendorUrl);
});

test("event review content for Homecomings and Kawasaki Takaya preserves source-specific audience conditions", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const vm = require("node:vm");
  const events = JSON.parse(fs.readFileSync(path.join(__dirname, "../calendar/data/events.json"), "utf8"));
  const reviews = JSON.parse(fs.readFileSync(path.join(__dirname, "../calendar/data/page-reviews.json"), "utf8")).reviews;
  const window = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../calendar/content.js"), "utf8"), { window });
  for (const [id, expected] of [
    ["kento-nakajima-2026-10-03", [/총 120분/, /관람 연령이 만 8세 이상/]],
    ["homecomings-2026-12-13", [/전석 스탠딩/, /90분/, /만 8세/, /첫 단독 내한/]],
    ["let-me-know-2026-11-28", [/70분/, /스탠딩과 지정석은 모두 99,000원/, /1인 최대 2매/, /11월 9일/, /4,000원/, /30%/]],
    ["kawasaki-takaya-2026-12-20", [/최대 4매/, /미취학 아동 입장 불가/, /Global URL/, /여권 원본/, /입장 번호/, /펜라이트/]],
    ["regallily-2026-11-07", [/전체관람가/, /문 열림 18:30/, /시작 19:00/, /약 90분/, /현장 수령 또는 등기우편/, /별도 선예매.*미확인/]]
  ]) {
    const event = events.find(item => item.id === id);
    const review = reviews[id];
    const guide = window.JLIVE_CONTENT.ticketGuides[event.artist];
    const html = ticketGuideMarkup(event, { ticketGuides: { [event.artist]: guide } });
    for (const pattern of expected) assert.match(html, pattern, `${id} should retain ${pattern}`);
    assert.equal(eventPageDecision(event, {}, review, "2026-09-25").indexable, true, `${id} has an approved source-backed editorial record`);
    assert.equal(eventPageDecision(event, {}, review, "2026-09-25").adsAllowed, true, `${id} has fresh schedule, price and ticket-date evidence`);
    if (id === "let-me-know-2026-11-28") {
      assert.deepEqual(event.seatPrices.map(item => item.name), ["스탠딩", "지정석"]);
      assert.deepEqual(event.seatPrices.map(item => item.price), [99000, 99000]);
    }
  }
  const regallily = events.find(item => item.id === "regallily-2026-11-07");
  const template = fs.readFileSync(path.join(__dirname, "event-page-template.html"), "utf8");
  const regallilyHtml = renderEventPage({
    event: regallily, events, group: [regallily], primary: regallily, editorial: window.JLIVE_CONTENT,
    review: reviews[regallily.id], siteUrl: "https://j-live.kr", template, today: "2026-09-25"
  });
  const eventJsonLd = JSON.parse(regallilyHtml.match(/<script type="application\/ld\+json" id="eventStructuredData">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(eventJsonLd.organizer, { "@type": "Organization", name: "Highjinkx", url: "https://www.highjinkx.com/" });
  assert.match(regallilyHtml, /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/);
  assert.doesNotMatch(regallilyHtml, /매진|판매 중|잔여석/);
  assert.doesNotMatch(regallilyHtml, /토요일 저녁에는.*혼잡|물품 보관을 마친 뒤/);
});

test("homepage labels announcement wait separately from unknown prices and unverified sales", () => {
  const event = {
    id: "wait-2026-10-10", artist: "Wait Artist", concertDate: "2026-10-10", time: "오후 7:00", venue: "Hall",
    status: "pending", hostingStatus: "confirmed", ticketingStatus: "pending_announcement", ticketDate: "", ticketTime: "",
    price: 0, vendorUrl: "https://tickets.example/wait", verifiedAt: "2026-09-20", sources: ["https://official.example/wait"]
  };
  const html = homepageScheduleMarkup([event], {}, "2026-09-24");
  assert.match(html, /예매 일정 발표 대기/);
  assert.match(html, /가격 미확인/);
  assert.match(html, /현재 판매 상태는 공식 예매처에서 확인/);
  assert.match(html, /일정 확인 2026-09-20 · 가격 확인 미기록 · 판매 상태 확인 미확인/);
  assert.doesNotMatch(html, /본문 수정 2026-09-20/);
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

test("keeps the event-series showtime comparison inside narrow mobile viewports", () => {
  const css = fs.readFileSync(path.join(__dirname, "../calendar/styles.css"), "utf8");
  assert.match(css, /@media\s*\(max-width:\s*600px\)\s*\{[\s\S]*?\.series-comparison \.venue-table-wrap\s*\{\s*overflow-x:\s*visible;/);
  assert.match(css, /\.series-comparison \.venue-compare-table\s*\{\s*min-width:\s*0;\s*table-layout:\s*fixed;/);
  assert.match(css, /\.series-comparison \.venue-compare-table tbody th\s*\{\s*width:\s*44%;/);
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
  assert.match(html, /공연장별 접근·시설 정보 한눈에 비교/);
  assert.match(html, /venue-compare-table/);
  assert.match(html, /canonical" href="https:\/\/j-live\.kr\/calendar\/guides\/venues\/"/);
  assert.match(html, /href="\.\/hall"/);
  assert.doesNotMatch(html, /href="\.\/venues\//);
  assert.match(html, /href="\.\.\/\.\.\/about"/);
  assert.match(html, /지하철역에서 공연장까지/);
  assert.match(html, /물품보관함/);
  assert.doesNotMatch(html, /pagead2\.googlesyndication\.com/);
});

test("uses the official KSPO DOME location map instead of an inferred event layout", () => {
  const guide = { name: "KSPO DOME", summary: "요약", officialMapUrl: "https://official.example/map", officialMapLabel: "공식 위치도", transit: "교통", arrival: "입장", restroom: "화장실", storage: "보관", waiting: "대기", nearby: "식사", return: "귀가", verifiedAt: "2026-07-28", sources: [] };
  const html = venuePageHtml("kspo-dome", guide, "https://j-live.kr");
  assert.match(html, /공식 위치도 ↗/);
  assert.match(html, /href="https:\/\/official\.example\/map"/);
  assert.doesNotMatch(html, /venue-site-map-svg|map-wc|map-gate/);
});

test("uses official maps for target venues and retains documented diagrams elsewhere", () => {
  const guide = { name: "공연장", summary: "요약", transit: "교통", arrival: "입장", restroom: "화장실", storage: "보관", waiting: "대기", nearby: "식사", return: "귀가", verifiedAt: "2026-07-28", sources: [] };
  for (const slug of ["olympic-hall", "jangchung-gymnasium", "gonggam-hall", "wanderloch-hall", "gocheok-sky-dome"]) {
    const html = venuePageHtml(slug, guide, "https://j-live.kr");
    assert.match(html, /venue-site-map-svg/, slug);
    assert.match(html, /화장실 안내 보기/, slug);
    assert.match(html, /전체 출처 보기/, slug);
  }
  for (const slug of ["kintex-second-exhibition", "kspo-dome", "inspire-arena"]) {
    assert.doesNotMatch(venuePageHtml(slug, guide, "https://j-live.kr"), /venue-site-map-svg|map-wc|map-gate/);
  }
  assert.doesNotMatch(venuePageHtml("kintex-second-exhibition", guide, "https://j-live.kr"), /10홀 앞 물품보관함/);
  assert.match(venuePageHtml("jangchung-gymnasium", guide, "https://j-live.kr"), /2F 안내·매표·물품보관/);
  assert.doesNotMatch(venuePageHtml("gonggam-hall", guide, "https://j-live.kr"), /승강기/);
  for (const slug of ["olympic-hall", "jangchung-gymnasium", "inspire-arena", "gonggam-hall", "wanderloch-hall", "gocheok-sky-dome"]) {
    assert.doesNotMatch(venuePageHtml(slug, guide, "https://j-live.kr"), /매점|카페|카페테리아|편의점|식사|자판기/, slug);
  }
});

test("links venue guides to matching public confirmed concert detail pages", () => {
  const guide = { name: "KSPO DOME", venues: ["KSPO DOME"] };
  const events = [
    { id: "andteam-2026-10-03", artist: "&TEAM", concertDate: "2026-10-03", time: "오후 6:00", venue: "KSPO DOME", status: "confirmed" },
    { id: "past-show", artist: "Past Act", concertDate: "2026-09-01", time: "오후 7:00", venue: "KSPO DOME", status: "confirmed" },
    { id: "other-venue", artist: "Other", concertDate: "2026-10-04", venue: "Other Hall", status: "confirmed" },
    { id: "pending", artist: "Candidate", concertDate: "2026-10-05", venue: "KSPO DOME", status: "pending" }
  ];
  const html = venueRelatedEventsMarkup(guide, events, "2026-09-24");
  assert.match(html, /href="\.\.\/\.\.\/events\/andteam-2026-10-03"/);
  assert.match(html, /지난 공연 상세 1건 보기/);
  assert.match(html, /href="\.\.\/\.\.\/events\/past-show"/);
  assert.doesNotMatch(html, /other-venue|pending/);
  assert.match(html, /2026년 10월 3일/);
});

test("generates extensionless public links", () => {
  assert.match(seriesDatesMarkup([{ id: "artist-2026-08-01", concertDate: "2026-08-01" }], "artist-2026-08-01"), /href="artist-2026-08-01"/);
  assert.doesNotMatch(seriesDatesMarkup([{ id: "artist-2026-08-01", concertDate: "2026-08-01" }], "artist-2026-08-01"), /\.html/);
  assert.doesNotMatch(venueIndexHtml({ hall: { name: "Hall", venues: ["Hall"], summary: "요약", verifiedAt: "2026-07-20" } }, "https://j-live.kr"), /\.html/);
});
