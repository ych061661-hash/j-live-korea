"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { buildSeries, isPublicEvent, renderEventPage, ticketDateDisplay } = require("./generate-seo-pages");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("redirects legacy Search Console URLs to canonical paths with specific rules first", () => {
  const lines = read("_redirects").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const expected = new Map([
    ["/about", "/calendar/about"],
    ["/privacy", "/calendar/privacy"],
    ["/terms", "/calendar/terms"],
    ["/calendar/index.html", "/calendar/"],
    ["/calendar/about.html", "/calendar/about"],
    ["/calendar/contact.html", "/calendar/contact"],
    ["/calendar/corrections.html", "/calendar/corrections"],
    ["/calendar/privacy.html", "/calendar/privacy"],
    ["/calendar/terms.html", "/calendar/terms"],
    ["/calendar/updates.html", "/calendar/updates"],
    ["/calendar", "/calendar/"],
    ["/calendar/artists", "/calendar/artists/"],
    ["/calendar/artists/index.html", "/calendar/artists/"],
    ["/calendar/guides/venues/index.html", "/calendar/guides/venues/"],
    ["/calendar/fanclubs", "/calendar/fanclubs/"],
    ["/calendar/fanclubs/index.html", "/calendar/fanclubs/"],
    ["/calendar/alerts", "/calendar/alerts/"],
    ["/calendar/alerts/index.html", "/calendar/alerts/"],
    ["/demo", "/calendar/"],
    ["/demo/", "/calendar/"],
    ["/demo/index.html", "/calendar/"],
    ["/demo/about.html", "/calendar/about"],
    ["/demo/contact.html", "/calendar/contact"],
    ["/demo/corrections.html", "/calendar/corrections"],
    ["/demo/privacy.html", "/calendar/privacy"],
    ["/demo/terms.html", "/calendar/terms"],
    ["/demo/events/:event.html", "/calendar/events/:event"],
    ["/demo/events/:event", "/calendar/events/:event"],
    ["/demo/data/events.json", "/calendar/data/events.json"],
    ["/calendar/weekly/:week.html", "/calendar/weekly/:week"],
    ["/calendar/guides/:guide.html", "/calendar/guides/:guide"],
    ["/calendar/reports/:report.html", "/calendar/reports/:report"],
    ["/calendar/stories/:story.html", "/calendar/stories/:story"],
    ["/calendar/festivals/:festival.html", "/calendar/festivals/:festival"],
    ["/calendar/guides/venues.html", "/calendar/guides/venues/"],
    ["/calendar/guides/venues/:venue.html", "/calendar/guides/venues/:venue"],
    ["/calendar/events/:event.html", "/calendar/events/:event"],
    ["/calendar/artists/:artist.html", "/calendar/artists/:artist"]
  ]);

  for (const [source, target] of expected) {
    const matches = lines.filter(line => new RegExp(`^${source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+${target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+301$`).test(line));
    assert.equal(matches.length, 1, `${source} must have exactly one canonical 301 rule`);
  }
  assert.ok(lines.indexOf("/calendar/guides/venues.html  /calendar/guides/venues/  301") < lines.indexOf("/calendar/guides/venues/:venue.html  /calendar/guides/venues/:venue  301"));
  assert.ok(lines.indexOf("/calendar/guides/olympic-park.html  /calendar/guides/venues/olympic-hall  301") < lines.indexOf("/calendar/guides/venues/:venue.html  /calendar/guides/venues/:venue  301"));
  const weeklyCanonical = read("calendar/weekly/index.html").match(/<link rel="canonical" href="https:\/\/j-live\.kr\/calendar\/weekly\/(\d{4}-\d{2}-\d{2})">/)?.[1];
  assert.ok(weeklyCanonical, "the current weekly page must have a dated canonical path");
  assert.ok(lines.indexOf(`/calendar/weekly/index.html  /calendar/weekly/${weeklyCanonical}  301`) < lines.indexOf("/calendar/weekly/:week.html  /calendar/weekly/:week  301"));
  assert.ok(lines.includes(`/calendar/weekly/  /calendar/weekly/${weeklyCanonical}  301`));
  assert.ok(lines.includes(`/calendar/weekly  /calendar/weekly/${weeklyCanonical}  301`));
  assert.equal(lines.includes("/demo/*  /calendar/:splat  301"), false, "unknown demo URLs must not be redirected to unrelated or nonexistent calendar paths");
  assert.doesNotMatch(read("_redirects"), /\s404!?\s*$/, "Cloudflare Pages _redirects cannot force an HTTP 404; retired assets must not be published");
  for (const retiredPath of [
    "calendar/event.html",
    "calendar/minimal-preview/index.html",
    "calendar/palette-preview/index.html",
    "calendar/original-calendar-frame.html",
    "calendar/original-calendar-frame.css"
  ]) assert.equal(fs.existsSync(path.join(root, retiredPath)), false, `${retiredPath} must not be deployed as a public asset`);
  assert.ok(fs.existsSync(path.join(root, "tools/event-page-template.html")), "the event generator template must remain available outside the public asset tree");
  for (const rule of [
    "/calendar/events/:event.html  /calendar/events/:event  301",
    "/demo/events/:event.html  /calendar/events/:event  301"
  ]) assert.ok(lines.includes(rule), `Expected route rule: ${rule}`);
  assert.doesNotMatch(read("sitemap.xml"), /\/demo\/|\.html<\/loc>|https:\/\/www\.j-live\.kr/);
  assert.match(read(".github/workflows/refresh-weekly.yml"), /git add _redirects /, "the daily weekly-page publisher must commit the generated redirect target");
});

test("publishes hosting-confirmed pending events as noindex pages without ads", () => {
  const event = {
    id: "pending-hosting",
    artist: "Pending Artist",
    concertDate: "2026-12-01",
    time: "오후 7:00",
    venue: "Pending Hall",
    status: "pending",
    hostingStatus: "confirmed",
    ticketingStatus: "pending_announcement",
    ticketDate: "",
    ticketTime: "",
    sources: ["https://official.example/show"],
    songs: []
  };
  const { primaryById, groupById } = buildSeries([event], "2026-09-18");
  const html = renderEventPage({
    event,
    events: [],
    group: groupById.get(event.id),
    primary: primaryById.get(event.id),
    editorial: { artists: {}, venues: {}, ticketGuides: {} },
    siteUrl: "https://j-live.kr",
    template: read("tools/event-page-template.html"),
    today: "2026-09-18"
  });

  assert.equal(isPublicEvent(event), true);
  assert.equal(ticketDateDisplay(event), "예매 일정 발표 대기");
  assert.match(html, /<meta name="robots" content="noindex,follow">/);
  assert.match(html, /<dd id="factTicket">예매 일정 발표 대기<\/dd>/);
  assert.doesNotMatch(html, /pagead2\.googlesyndication\.com/);
  assert.equal(isPublicEvent({ ...event, hostingStatus: "unverified" }), false);
});

test("keeps Vaundy event records available after the show without falsely advertising current ticket status", () => {
  const events = JSON.parse(read("calendar/data/events.json"));
  const sitemap = read("sitemap.xml");
  for (const id of ["vaundy-2026-09-19", "vaundy-2026-09-20"]) {
    const event = events.find(item => item.id === id);
    assert.equal(event.status, "confirmed");
    assert.equal(event.hostingStatus, "confirmed");
    assert.equal(event.ticketingStatus, "confirmed");
    assert.equal(event.ticketDate, "2026-03-11");
    assert.equal(event.ticketTime, "오후 8:00");
    assert.equal(event.presaleStatus, "none");
    assert.deepEqual(event.seatPrices.map(item => item.name), ["스탠딩석", "R석", "S석"]);
  }
  for (const id of ["vaundy-2026-09-19", "vaundy-2026-09-20"]) {
    const page = read(`calendar/events/${id}.html`);
    assert.doesNotMatch(sitemap, new RegExp(`/calendar/events/${id}(?:<|\\/)`));
    assert.match(page, /name="robots" content="noindex,follow"/);
    assert.doesNotMatch(page, /pagead2\.googlesyndication\.com/);
  }
  const series = events.filter(event => event.artist === "Vaundy");
  const event = events.find(item => item.id === "vaundy-2026-09-20");
  const { primaryById, groupById } = buildSeries(series, "2026-09-21");
  const context = { window: {} };
  vm.runInNewContext(read("calendar/content.js"), context);
  const options = { event, events: series, group: groupById.get(event.id), primary: primaryById.get(event.id), editorial: context.window.JLIVE_CONTENT, siteUrl: "https://j-live.kr", template: read("tools/event-page-template.html") };
  const endedHtml = renderEventPage({ ...options, today: "2026-09-21" });
  assert.match(endedHtml, /name="robots" content="noindex/);
  const upcoming = buildSeries(series, "2026-09-19");
  assert.match(renderEventPage({ ...options, primary: upcoming.primaryById.get(event.id), group: upcoming.groupById.get(event.id), today: "2026-09-19" }), /name="robots" content="noindex/);
  const html = read("calendar/events/vaundy-2026-09-20.html");
  assert.match(html, /2026년 3월 11일\(수\) 오후 8:00/);
  assert.match(html, /일반·글로벌 예매와 Play&amp;Stay 상품/);
  assert.match(html, /회차별 ID 1개당 1인 2매/);
  assert.match(html, /신분증 정보와 예매자 정보가 일치/);
  assert.match(html, /호텔에서 신분증 확인 후 티켓과 입장 팔찌/);
});
