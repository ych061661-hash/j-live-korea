"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { buildSeries, eventPageDecision, seoulDateKey } = require("./generate-seo-pages");

const root = path.join(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

test("privacy policy discloses Google prior-visit ad cookies and controls", () => {
  const privacy = read("calendar/privacy.html");
  assert.match(privacy, /이 사이트 또는 다른 사이트 방문 기록을 바탕으로 광고/);
  assert.match(privacy, /href="https:\/\/adssettings\.google\.com\//);
  assert.match(privacy, /developers\.google\.com\/third-party-ads\/googleads-vendors/);
  assert.match(privacy, /www\.aboutads\.info\/choices/);
  assert.match(privacy, /모든 업체가 J-LIVE에서 광고를 제공한다는 뜻은 아닙니다/);
  assert.match(privacy, /현재 계정에서 실제 허용한 업체 목록이 포함되어 있지 않으므로/);
  assert.match(privacy, /일치하지 않은 검색어의 원문은 저장하거나 Google Analytics로 보내지 않고/);
  assert.match(privacy, /이 검색·예매처·저장 관련 집계는 브라우저 저장소에 누적될 수 있으며/);
  assert.match(privacy, /저장·삭제 동작과 내보내기 시 기록 수만 기능 이용 통계/);
  assert.match(privacy, /생성 후 7일이 지난 뒤 Worker의 시간별 정리 작업에서 삭제/);
  assert.match(privacy, /24시간이 지난 기록은 같은 시간별 정리 작업에서 삭제/);
  assert.match(privacy, /다음 정리 실행 때 삭제될 수 있습니다/);
  assert.match(read("alerts-worker/wrangler.example.jsonc"), /"crons": \["0 \* \* \* \*"\]/);
});

test("updated analytics code must revalidate across all static page templates", () => {
  const headers = read("_headers");
  assert.match(headers, /\/calendar\/analytics\.js\r?\n\s+Cache-Control: public, max-age=0, must-revalidate/);
});

test("local-only admin and source notes are not offered as search-result pages", () => {
  const admin = read("tools/admin/index.html");
  const template = read("tools/event-page-template.html");
  const headers = read("_headers");
  assert.match(admin, /<meta name="robots" content="noindex,nofollow">/);
  assert.doesNotMatch(admin, /pagead2\.googlesyndication\.com/);
  assert.match(template, /<meta name="robots" content="noindex,follow">/);
  assert.doesNotMatch(template, /pagead2\.googlesyndication\.com/);
  assert.match(headers, /\/tools\/\*\r?\n\s+X-Robots-Tag: noindex, nofollow/);
  assert.match(headers, /\/\*\.md\r?\n\s+X-Robots-Tag: noindex, nofollow/);
});

test("event AdSense loaders match the explicit review decision", () => {
  const events = JSON.parse(read("calendar/data/events.json"));
  const reviews = JSON.parse(read("calendar/data/page-reviews.json")).reviews;
  const today = seoulDateKey();
  const { primaryById } = buildSeries(events, today);

  for (const event of events) {
    const file = path.join(root, "calendar", "events", event.id + ".html");
    const exists = fs.existsSync(file);
    const primary = primaryById.get(event.id);
    const expected = Boolean(primary
      && event.id === primary.id
      && eventPageDecision(primary, {}, reviews[primary.id], today).adsAllowed);
    assert.ok(exists || !expected, event.id + " has approved ads but no generated page");
    if (!exists) continue;

    const html = read(path.relative(root, file));
    const hasAdsLoader = /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/i.test(html);
    const hasFundingChoices = /fundingchoicesmessages\.google\.com\/i\/pub-3081918168688274\?ers=1/i.test(html);
    assert.equal(hasAdsLoader, expected, event.id + " loader must match its explicit page review");
    assert.equal(hasFundingChoices, expected, event.id + " Funding Choices loader must match its explicit page review");
    if (!event.articleUpdatedAt) assert.doesNotMatch(html, /본문 수정 미기록/, event.id);
  }
});

test("event detail data errors hide the article and remove auto-ad loader and inserted slots", () => {
  const script = read("calendar/event.js");
  const errorHandler = script.match(/initializeEvent\(\)\.catch\(error => \{([\s\S]*?)\n\}\);/)?.[1] || "";
  assert.match(errorHandler, /document\.querySelector\("#eventArticle"\)\.hidden = true/);
  assert.match(errorHandler, /\.google-auto-placed, ins\.adsbygoogle, \[data-ad-status\]/);
  assert.match(errorHandler, /script\[src\*="pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js"\]/);
  assert.match(errorHandler, /공연 정보를 표시할 수 없습니다/);
});

test("functional and empty states do not load AdSense", () => {
  const home = read("calendar/index.html");
  const app = read("calendar/app.js");
  const contact = read("calendar/contact.html");
  const alerts = read("calendar/alerts/index.html");
  const adsLoader = /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/i;

  assert.doesNotMatch(home, adsLoader, "search and saved-list empty states share the non-monetized home shell");
  assert.doesNotMatch(app, adsLoader, "client-side search and saved-list rendering must not inject AdSense");
  assert.match(app, /검색 결과가 없습니다/);
  assert.match(home, /아직 저장한 공연이 없습니다/);
  assert.doesNotMatch(contact, adsLoader, "contact form and its success anchor must stay ad-free");
  assert.match(contact, /id="sent" role="status"/);
  assert.match(contact, /j-live\.kr\/calendar\/contact#sent/);
  assert.doesNotMatch(alerts, adsLoader, "the utility alert screen must not load AdSense");
});
