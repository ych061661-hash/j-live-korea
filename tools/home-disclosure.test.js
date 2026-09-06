"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const page = fs.readFileSync(path.join(root, "calendar/index.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "calendar/styles.css"), "utf8");
const serviceWorker = fs.readFileSync(path.join(root, "calendar/service-worker.js"), "utf8");

test("keeps attendance and spending behind an explicit accessible disclosure", () => {
  assert.match(page, /<details class="attendance-ledger-disclosure" id="attendanceLedgerDisclosure">/);
  assert.match(page, /관람 기록·지출 보기/);
  assert.match(page, /id="myShowsRecordLink" href="#attendanceLedgerDisclosure"/);
  assert.match(page, /<section class="attendance-ledger" aria-labelledby="attendanceLedgerTitle">/);
  assert.match(page, /<summary>[\s\S]*관람 기록·지출 보기[\s\S]*열기/);
  assert.match(styles, /\.attendance-ledger-disclosure > summary:focus-visible/);
  assert.match(page, /<section class="my-shows" id="myShows" aria-labelledby="myShowsTitle" hidden>/);
  assert.match(page, /id="attendanceBoard" aria-labelledby="attendanceTitle" hidden/);
  assert.match(serviceWorker, /j-live-pwa-v85-content-freshness/);
  assert.match(serviceWorker, /styles\.css\?v=20260906content1/);
});
