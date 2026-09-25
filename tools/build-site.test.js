"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { buildSite, assertSafeOutputPath } = require("./build-site");

const ROOT = path.resolve(__dirname, "..");

test("production build includes public site files but excludes source and admin tools", (t) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "jlive-public-build-"));
  const output = path.join(tempRoot, "dist");
  t.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }));

  assert.equal(buildSite({ rootDir: ROOT, outputDir: output }), output);
  for (const entry of ["_headers", "_redirects", "ads.txt", "robots.txt", "sitemap.xml", "calendar/index.html", "calendar/data/events.json"]) {
    assert.equal(fs.existsSync(path.join(output, entry)), true, `${entry} should be deployed`);
  }
  assert.equal(
    fs.readFileSync(path.join(output, "ads.txt"), "utf8"),
    fs.readFileSync(path.join(ROOT, "ads.txt"), "utf8"),
    "the deployed root ads.txt should exactly match the verified source file",
  );
  for (const entry of ["tools", "alerts-worker", "README.md", "memory.md", "DAILY-SEARCH-POLICY.md", ".github", ".git"]) {
    assert.equal(fs.existsSync(path.join(output, entry)), false, `${entry} must not be deployed`);
  }
});

test("production build refuses to delete the project root or its parent", () => {
  assert.throws(() => assertSafeOutputPath(ROOT, ROOT), /unsafe build output path/);
  assert.throws(() => assertSafeOutputPath(ROOT, path.dirname(ROOT)), /unsafe build output path/);
  assert.throws(() => assertSafeOutputPath(ROOT, path.join(ROOT, "calendar")), /unsafe build output path/);
});
