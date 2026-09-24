"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

test("privacy policy discloses Google prior-visit ad cookies and controls", () => {
  const privacy = read("calendar/privacy.html");
  assert.match(privacy, /이 사이트 또는 다른 사이트 방문 기록을 바탕으로 광고/);
  assert.match(privacy, /href="https:\/\/adssettings\.google\.com\//);
  assert.match(privacy, /일치하지 않은 검색어의 원문은 저장하거나 Google Analytics로 보내지 않고/);
  assert.match(privacy, /이 검색·예매처·저장 관련 집계는 브라우저 저장소에 누적될 수 있으며/);
  assert.match(privacy, /저장·삭제 동작과 내보내기 시 기록 수만 기능 이용 통계/);
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
