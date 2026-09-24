"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const {
  buildSeries,
  dataReportHtml,
  renderEventPage,
  venueRelatedEventsMarkup,
  venuePageHtml
} = require("./generate-seo-pages");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const events = JSON.parse(read("calendar/data/events.json"));
const editorialContext = { window: {} };
vm.runInNewContext(read("calendar/content.js"), editorialContext);
const editorial = editorialContext.window.JLIVE_CONTENT;
const today = "2026-09-24";

test("homepage exposes compact paths to existing guides, report, updates and artists after the calendar", () => {
  const html = read("calendar/index.html");
  const calendarEnd = html.indexOf("</main>");
  const linksEnd = html.indexOf("<!-- SEO_UPCOMING_START -->");
  assert.ok(calendarEnd >= 0 && linksEnd > calendarEnd, "the resource links must follow the primary calendar");
  const resourceNav = html.slice(calendarEnd, linksEnd);
  for (const [href, file] of [
    ["./guides/venues/", "calendar/guides/venues/index.html"],
    ["./guides/standing-concert", "calendar/guides/standing-concert.html"],
    ["./guides/verification", "calendar/guides/verification.html"],
    ["./updates", "calendar/updates.html"],
    ["./reports/2026-jpop-live", "calendar/reports/2026-jpop-live.html"],
    ["./artists/", "calendar/artists/index.html"]
  ]) {
    assert.ok(resourceNav.includes(`href="${href}"`), `homepage must link to ${href}`);
    assert.ok(fs.existsSync(path.join(root, file)), `destination must exist: ${file}`);
  }
  assert.match(resourceNav, /aria-label="공연 관련 가이드와 자료"/);
});

test("each public event detail links to a matching venue guide or its directory and to ticket preparation", () => {
  const venueNames = new Set(Object.values(editorial.venueGuides).flatMap(guide => guide.venues || []));
  const mapped = events.find(event => event.status === "confirmed" && venueNames.has(event.venue));
  const unmapped = events.find(event => event.status === "confirmed" && !venueNames.has(event.venue));
  assert.ok(mapped && unmapped, "fixtures must include mapped and unmapped venues");

  for (const event of [mapped, unmapped]) {
    const { primaryById, groupById } = buildSeries([event], today);
    const html = renderEventPage({
      event,
      events,
      group: groupById.get(event.id),
      primary: primaryById.get(event.id),
      editorial,
      review: { evidenceSources: [], index: "noindex", ads: "none" },
      siteUrl: "https://j-live.kr",
      template: read("tools/event-page-template.html"),
      today
    });
    assert.match(html, /href="\.\.\/guides\/standing-concert"/);
    if (venueNames.has(event.venue)) {
      const venueEntry = Object.entries(editorial.venueGuides).find(([, guide]) => guide.venues?.includes(event.venue));
      assert.ok(html.includes(`href="../guides/venues/${venueEntry[0]}"`));
    } else {
      assert.match(html, /href="\.\.\/guides\/venues\/"/);
    }
  }
});

test("venue guides link to their matching upcoming public concerts without a per-guide opt-in", () => {
  const publicUpcoming = events.filter(event => event.status === "confirmed" && event.concertDate >= today);
  let linkedGuides = 0;
  for (const [slug, guide] of Object.entries(editorial.venueGuides)) {
    const related = publicUpcoming.filter(event => guide.venues?.includes(event.venue));
    const html = venuePageHtml(slug, guide, "https://j-live.kr", events, today);
    for (const event of related) assert.ok(html.includes(`../../events/${event.id}`), `${slug} must link ${event.id}`);
    if (related.length) linkedGuides++;
  }
  assert.ok(linkedGuides > 0, "at least one guide should link upcoming shows from the current dataset");
});

test("the report labels its J-LIVE-only scope and calculation date near the introduction", () => {
  const html = dataReportHtml(events, "https://j-live.kr", today);
  const scope = html.indexOf("class=\"report-scope-note\"");
  const methods = html.indexOf("먼저, 숫자를 세는 기준");
  assert.ok(scope >= 0 && methods > scope);
  const notice = html.slice(scope, methods);
  assert.match(notice, /J-LIVE가 공식 출처로 확인해 기록한 2026년 한국 공연/);
  assert.match(notice, /전체 한국 공연 시장 통계가 아닙니다/);
  assert.match(notice, /데이터 기준일:<\/strong> 2026-09-24/);
});

test("venues with no matching event omit the related-show module instead of showing a large empty panel", () => {
  const guide = { name: "No Match Hall", venues: ["No Match Hall"], summary: "Test", verifiedAt: "2026-09-01", sources: [] };
  assert.equal(venueRelatedEventsMarkup(guide, events, today), "");
});

test("internal links on the homepage, generated event details, venue guides and data report resolve to local files", () => {
  const documents = [
    { url: "https://j-live.kr/calendar/", html: read("calendar/index.html") },
    { url: "https://j-live.kr/calendar/reports/2026-jpop-live", html: read("calendar/reports/2026-jpop-live.html") },
    ...fs.readdirSync(path.join(root, "calendar/events"))
      .filter(file => file.endsWith(".html"))
      .map(file => ({ url: `https://j-live.kr/calendar/events/${file.replace(/\.html$/, "")}`, html: read(`calendar/events/${file}`) })),
    ...fs.readdirSync(path.join(root, "calendar/guides/venues"))
      .filter(file => file.endsWith(".html"))
      .map(file => ({ url: `https://j-live.kr/calendar/guides/venues/${file.replace(/\.html$/, "")}`, html: read(`calendar/guides/venues/${file}`) }))
  ];
  const missing = [];
  for (const document of documents) {
    for (const match of document.html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)) {
      const href = match[1].replaceAll("&amp;", "&");
      const target = new URL(href, document.url);
      if (target.origin !== "https://j-live.kr" || target.pathname === "/" || target.pathname === "/404") continue;
      let pathname;
      try { pathname = decodeURIComponent(target.pathname); } catch { pathname = target.pathname; }
      const base = path.join(root, pathname.replace(/^\/+/, ""));
      const candidates = pathname.endsWith("/")
        ? [path.join(base, "index.html")]
        : /\.[a-z0-9]+$/i.test(pathname)
          ? [base]
          : [`${base}.html`, path.join(base, "index.html"), base];
      if (!candidates.some(candidate => fs.existsSync(candidate))) missing.push(`${document.url} -> ${href}`);
    }
  }
  assert.deepEqual(missing, [], `unresolved internal links:\n${missing.join("\n")}`);
});
