"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { buildSite, assertSafeOutputPath } = require("./build-site");

const ROOT = path.resolve(__dirname, "..");

function htmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? htmlFiles(target) : target.endsWith(".html") ? [target] : [];
  });
}

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

test("production artifact preserves noindex/ad separation and sitemap membership", (t) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "jlive-ad-policy-build-"));
  const output = path.join(tempRoot, "dist");
  t.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }));
  buildSite({ rootDir: ROOT, outputDir: output });

  const html = htmlFiles(path.join(output, "calendar"));
  const sitemap = fs.readFileSync(path.join(output, "sitemap.xml"), "utf8");
  const advertisingCode = /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js|<ins\b[^>]*\badsbygoogle\b/i;
  const consentLoader = /fundingchoicesmessages\.google\.com/i;
  let indexedAdPages = 0;

  for (const file of html) {
    const source = fs.readFileSync(file, "utf8");
    const relative = path.relative(output, file);
    const noindex = /<meta\s+name=["']robots["']\s+content=["']noindex/i.test(source);
    const hasAds = advertisingCode.test(source) || consentLoader.test(source);
    if (noindex) {
      assert.equal(hasAds, false, `${relative} is noindex but the deploy artifact contains advertising or consent code`);
    }
    if (advertisingCode.test(source)) {
      const canonicalTag = (source.match(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i) || [])[0] || "";
      const canonical = (canonicalTag.match(/\bhref=["']([^"']+)["']/i) || [])[1];
      assert.ok(canonical, `${relative} contains AdSense code but has no canonical`);
      assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), `${relative} contains AdSense code but is absent from the deploy sitemap`);
      assert.equal(noindex, false, `${relative} contains AdSense code but is noindex`);
      indexedAdPages += 1;
    }
  }

  assert.ok(html.length > 0, "the public calendar artifact should contain HTML pages");
  assert.ok(indexedAdPages > 0, "the test must exercise at least one reviewed ad-bearing page");
});

test("production build refuses to delete the project root or its parent", () => {
  assert.throws(() => assertSafeOutputPath(ROOT, ROOT), /unsafe build output path/);
  assert.throws(() => assertSafeOutputPath(ROOT, path.dirname(ROOT)), /unsafe build output path/);
  assert.throws(() => assertSafeOutputPath(ROOT, path.join(ROOT, "calendar")), /unsafe build output path/);
});
