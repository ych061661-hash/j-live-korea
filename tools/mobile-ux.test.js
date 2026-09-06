"use strict";

const fs = require("fs");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");

const styles = fs.readFileSync(path.join(__dirname, "..", "calendar", "styles.css"), "utf8");

test("keeps compact mobile links finger-sized", () => {
  assert.match(styles, /\.home-page \.seo-upcoming-link,[\s\S]*?min-height:44px;/);
  assert.match(styles, /\.source-link,[\s\S]*?\.event-page \.correction-link \{[\s\S]*?min-height:44px;/);
  assert.match(styles, /\.festival-lineup-page \.breadcrumb a \{[\s\S]*?min-width:24px;[\s\S]*?min-height:32px;/);
  assert.match(styles, /\.site-footer nav a,[\s\S]*?min-height:44px;[\s\S]*?\.site-footer nav a \{[\s\S]*?min-width:44px;/);
  assert.match(styles, /\.event-chip \{ min-height:24px; \}/);
});
