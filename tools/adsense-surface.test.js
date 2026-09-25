const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const calendarRoot = path.join(__dirname, "..", "calendar");

function htmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? htmlFiles(target) : target.endsWith(".html") ? [target] : [];
  });
}

test("noindex public HTML pages do not load AdSense or Funding Choices", () => {
  const advertisingCode = /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js|<ins\b[^>]*\badsbygoogle\b/i;
  const consentLoader = /fundingchoicesmessages\.google\.com/i;

  for (const file of htmlFiles(calendarRoot)) {
    const html = fs.readFileSync(file, "utf8");
    if (!/<meta\s+name=["']robots["']\s+content=["']noindex/i.test(html)) continue;

    assert.doesNotMatch(html, advertisingCode, `${path.relative(calendarRoot, file)} is noindex but contains AdSense code`);
    assert.doesNotMatch(html, consentLoader, `${path.relative(calendarRoot, file)} is noindex but contains Funding Choices code`);
  }
});
