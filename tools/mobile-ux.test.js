"use strict";

const fs = require("fs");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");

const styles = fs.readFileSync(path.join(__dirname, "..", "calendar", "styles.css"), "utf8");
const app = fs.readFileSync(path.join(__dirname, "..", "calendar", "app.js"), "utf8");

test("keeps compact mobile links finger-sized", () => {
  assert.match(styles, /\.home-page \.seo-upcoming-link,[\s\S]*?min-height:44px;/);
  assert.match(styles, /\.source-link,[\s\S]*?\.event-page \.correction-link \{[\s\S]*?min-height:44px;/);
  assert.match(styles, /\.festival-lineup-page \.breadcrumb a \{[\s\S]*?min-width:24px;[\s\S]*?min-height:32px;/);
  assert.match(styles, /\.site-footer nav a,[\s\S]*?min-height:44px;[\s\S]*?\.site-footer nav a \{[\s\S]*?min-width:44px;/);
  assert.match(styles, /\.event-chip \{ min-height:24px; \}/);
});

test("gives mobile detail a browser-back state and restores scroll", () => {
  assert.match(app, /history\.pushState\(\{ jLiveMobileDetail: true/);
  assert.match(app, /window\.addEventListener\("popstate"/);
  assert.match(app, /window\.scrollTo\(\{ top: mobileDetailScrollY/);
  assert.match(app, /mobileDetailReturnFocusSelector = activeDay\?\.dataset\.date/);
  assert.match(app, /document\.querySelector\(mobileDetailReturnFocusSelector\)/);
  assert.match(app, /const returnFocus = document\.activeElement;/);
  assert.match(app, /openMobileDetail\(schedule, returnFocus\)/);
  assert.match(app, /setMobileDetailIsolation\(true\)/);
  assert.match(app, /toggleAttribute\("inert", open\)/);
  assert.match(app, /#closeDetail"\)\?\.focus/);
  assert.doesNotMatch(app, /beforeinstallprompt/);
});

test("keeps the mobile detail close target and ticket CTA clear of overlap", () => {
  assert.match(styles, /\.mobile-detail-handle button \{ width:44px; height:44px;/);
  assert.match(styles, /\.ticket-button \{ position:sticky; bottom:max\(10px,env\(safe-area-inset-bottom\)\); z-index:2;/);
  const index = fs.readFileSync(path.join(__dirname, "..", "calendar", "index.html"), "utf8");
  assert.match(index, /id="mobileDetailBackdrop"[^>]+tabindex="-1"/);
  assert.ok(index.indexOf('id="detailPageButton"') < index.indexOf('id="ticketButton"'));
});

test("keeps the homepage hero within narrow mobile viewports", () => {
  assert.match(styles, /\.home-page \.hero-main \{ width:min\(100%,900px\); min-width:0;/);
  assert.match(styles, /\.home-page \.hero h1 \{ max-width:620px; margin-top:16px; font-size:clamp\(46px,12vw,66px\); overflow-wrap:anywhere;/);
  assert.match(styles, /\.home-page \.hero-copy \{ width:100%; max-width:620px; margin-top:20px; overflow-wrap:anywhere;/);
  assert.match(styles, /\.home-page \.hero-main \{ width:calc\(100vw - 32px\); max-width:none; \}/);
  assert.match(styles, /\.home-page \.hero h1 \{ width:100%; max-width:none; margin-right:auto; margin-left:auto; font-size:32px;/);
});
