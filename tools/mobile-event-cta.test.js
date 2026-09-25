"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const css = fs.readFileSync(path.join(root, "calendar", "styles.css"), "utf8");
const eventTemplate = fs.readFileSync(path.join(root, "tools", "event-page-template.html"), "utf8");
const calendarHome = fs.readFileSync(path.join(root, "calendar", "index.html"), "utf8");

test("mobile sticky ticket CTA is scoped to the scrollable calendar detail panel", () => {
  const stickyRule = css.match(/\.detail-content\s+\.ticket-button\s*\{([^}]*)\}/);
  assert.ok(stickyRule, "calendar detail panel keeps its sticky ticket action");
  assert.match(stickyRule[1], /position\s*:\s*sticky/);

  const baseRule = css.match(/^\s*\.ticket-button\s*\{([^}]*)\}/m);
  assert.ok(baseRule, "base ticket button rule exists");
  assert.doesNotMatch(baseRule[1], /position\s*:\s*sticky/);
  assert.match(eventTemplate, /<main class="event-page"[\s\S]*?id="eventTicket"/);
  assert.match(calendarHome, /class="detail-content"[\s\S]*?class="ticket-button"/);
});
