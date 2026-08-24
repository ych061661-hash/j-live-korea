"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const visibleText = html => html
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&[^;]+;/g, " ")
  .replace(/[^가-힣A-Za-z0-9]+/g, " ")
  .toLowerCase()
  .trim();

function indexedFileFor(url) {
  const pathname = new URL(url).pathname.replace(/^\//, "");
  const candidates = pathname.endsWith("/")
    ? [path.join(pathname, "index.html")]
    : [`${pathname}.html`, path.join(pathname, "index.html"), pathname];
  return candidates
    .map(candidate => path.join(root, candidate))
    .find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}

function shingles(text, size = 5) {
  const words = text.split(/\s+/).filter(Boolean);
  const values = new Set();
  for (let index = 0; index <= words.length - size; index += 1) values.add(words.slice(index, index + size).join(" "));
  return values;
}

function similarity(left, right) {
  let shared = 0;
  for (const value of left) if (right.has(value)) shared += 1;
  return shared / (left.size + right.size - shared);
}

test("keeps every indexed event substantial and distinct", () => {
  const sitemap = read("sitemap.xml");
  const ids = [...sitemap.matchAll(/<loc>https:\/\/j-live\.kr\/calendar\/events\/([^<]+)<\/loc>/g)].map(match => decodeURIComponent(match[1]));
  assert.ok(ids.length >= 15, `expected a useful event collection, found ${ids.length}`);

  const documents = ids.map(id => {
    const text = visibleText(read(`calendar/events/${id}.html`));
    const words = text.split(/\s+/).filter(Boolean);
    assert.ok(words.length >= 600, `${id} is too thin at ${words.length} words`);
    return { id, values: shingles(text) };
  });

  for (let left = 0; left < documents.length; left += 1) {
    for (let right = left + 1; right < documents.length; right += 1) {
      const score = similarity(documents[left].values, documents[right].values);
      assert.ok(score < 0.45, `${documents[left].id} and ${documents[right].id} are too similar (${score.toFixed(3)})`);
    }
  }
});

test("keeps every indexed venue guide practical and substantial", () => {
  const sitemap = read("sitemap.xml");
  const urls = [...sitemap.matchAll(/<loc>(https:\/\/j-live\.kr\/calendar\/guides\/venues\/[^<]+)<\/loc>/g)]
    .map(match => match[1])
    .filter(url => !url.endsWith("/venues/"));
  assert.equal(urls.length, 8, `expected 8 venue guides, found ${urls.length}`);

  for (const url of urls) {
    const file = indexedFileFor(url);
    const html = fs.readFileSync(file, "utf8");
    const words = visibleText(html).split(/\s+/).filter(Boolean);
    assert.ok(words.length >= 325, `${url} is too thin at ${words.length} words`);
    assert.match(html, /처음 가기 전에 먼저 정할 것/, url);
    assert.match(html, /공연별로 다시 확인할 것/, url);
    assert.match(html, /마지막 시설 확인/, url);
    assert.match(html, /출처와 확인일/, url);
  }
});

test("keeps the indexed artist directory explanatory rather than link-only", () => {
  const html = read("calendar/artists/index.html");
  const words = visibleText(html).split(/\s+/).filter(Boolean);
  assert.ok(words.length >= 550, `artist directory is too thin at ${words.length} words`);
  assert.ok((html.match(/<h2\b/gi) || []).length >= 3, "artist directory needs explanatory sections");
  assert.match(html, /목록을 읽는 방법/);
  assert.match(html, /누구를 목록에 포함하나요/);
  assert.match(html, /데이터 기준일/);
  assert.doesNotMatch(html, /지난 내한 \d+회 기록/);
  assert.doesNotMatch(html, /pagead2\.googlesyndication\.com/);
});

test("keeps complete Event structured data after client rendering", () => {
  const sitemap = read("sitemap.xml");
  const ids = [...sitemap.matchAll(/<loc>https:\/\/j-live\.kr\/calendar\/events\/([^<]+)<\/loc>/g)].map(match => decodeURIComponent(match[1]));
  for (const id of ids) {
    const html = read(`calendar/events/${id}.html`);
    const encoded = (html.match(/id="eventStructuredData">([\s\S]*?)<\/script>/) || [])[1];
    assert.ok(encoded, `${id} is missing Event JSON-LD`);
    const event = JSON.parse(encoded);
    for (const field of ["description", "startDate", "endDate", "image", "organizer", "offers"]) {
      assert.ok(event[field], `${id} is missing ${field}`);
    }
    for (const field of ["url", "validFrom", "priceCurrency", "price"]) {
      assert.ok(event.offers[field] || event.offers[field] === 0, `${id} is missing offers.${field}`);
    }
  }
  const client = read("calendar/event.js");
  assert.match(client, /document\.body\.dataset\.eventId && existingScript\?\.textContent\.trim\(\)/);
});

test("keeps indexed events free of unfinished-state copy", () => {
  const sitemap = read("sitemap.xml");
  const ids = [...sitemap.matchAll(/<loc>https:\/\/j-live\.kr\/calendar\/events\/([^<]+)<\/loc>/g)].map(match => decodeURIComponent(match[1]));
  for (const id of ids) {
    const html = read(`calendar/events/${id}.html`);
    assert.doesNotMatch(html, /공연 정보를 불러오는 중|승인 후 사이드 광고|광고 영역입니다/, id);
    assert.match(html, /<!-- ADSENSE_SLOT_TOP -->/, id);
    assert.match(html, /<!-- ADSENSE_SLOT_INLINE -->/, id);
    assert.match(html, /<!-- ADSENSE_SLOT_SIDE -->/, id);
  }
});

test("keeps noindex pages free of AdSense code", () => {
  const violations = [];
  const visit = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.name.endsWith(".html")) {
        const html = fs.readFileSync(file, "utf8");
        if (/name="robots"[^>]*noindex/i.test(html) && /pagead2\.googlesyndication\.com/i.test(html)) violations.push(path.relative(root, file));
      }
    }
  };
  visit(path.join(root, "calendar"));
  assert.deepEqual(violations, []);
});

test("keeps advertising limited to indexed content pages", () => {
  const sitemap = read("sitemap.xml");
  const indexedFiles = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(match => indexedFileFor(match[1]))
    .filter(Boolean)
    .map(file => path.resolve(file)));
  const violations = [];
  const visit = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.name.endsWith(".html")) {
        const html = fs.readFileSync(file, "utf8");
        if (/pagead2\.googlesyndication\.com/i.test(html) && !indexedFiles.has(path.resolve(file))) {
          violations.push(path.relative(root, file));
        }
      }
    }
  };
  visit(path.join(root, "calendar"));
  assert.deepEqual(violations, []);
});

test("keeps editorial trust pages free of advertising code", () => {
  for (const page of ["calendar/about.html", "calendar/guides/verification.html"]) {
    assert.doesNotMatch(read(page), /pagead2\.googlesyndication\.com/, page);
  }
  const about = read("calendar/about.html");
  const aboutWords = visibleText(about).split(/\s+/).filter(Boolean);
  assert.ok(aboutWords.length >= 450, `about page is too thin at ${aboutWords.length} words`);
  assert.match(about, /광고와 편집은 분리합니다/);
  assert.match(about, /정보 수정 요청/);
  assert.match(about, /소개 페이지 마지막 수정/);
});

test("publishes the required ads.txt record and Google privacy disclosures", () => {
  assert.equal(read("ads.txt").trim(), "google.com, pub-3081918168688274, DIRECT, f08c47fec0942fa0");
  const privacy = read("calendar/privacy.html");
  assert.match(privacy, /policies\.google\.com\/technologies\/partner-sites/);
  assert.match(privacy, /adssettings\.google\.com/);
  assert.match(privacy, /tools\.google\.com\/dlpage\/gaoptout/);
  assert.match(privacy, /쿠키/);
  assert.match(privacy, /웹 비콘/);
  assert.match(privacy, /IP 주소/);
  assert.match(privacy, /최대 1년간 보관한 뒤 삭제/);
  for (const page of ["calendar/contact.html", "calendar/corrections.html"]) {
    assert.match(read(page), /name="privacy_consent" value="동의함" required/, page);
  }
});

test("reserves image space on every indexed page", () => {
  const sitemap = read("sitemap.xml");
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);

  for (const url of urls) {
    const file = indexedFileFor(url);
    assert.ok(file, `missing indexed file for ${url}`);
    const html = fs.readFileSync(file, "utf8");
    for (const match of html.matchAll(/<img\b([^>]*)>/gi)) {
      assert.match(match[1], /\bwidth="\d+"/i, `${url} image is missing width`);
      assert.match(match[1], /\bheight="\d+"/i, `${url} image is missing height`);
      assert.match(match[1], /\balt="[^"]+"/i, `${url} image is missing meaningful alt text`);
    }
  }
});

test("keeps every indexed page complete and canonical", () => {
  const sitemap = read("sitemap.xml");
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  const titles = new Set();
  const descriptions = new Set();

  for (const url of urls) {
    const file = indexedFileFor(url);
    assert.ok(file, `missing indexed file for ${url}`);
    const html = fs.readFileSync(file, "utf8");
    const title = (html.match(/<title>([^<]+)<\/title>/i) || [])[1];
    const description = (html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i) || [])[1];
    const canonical = (html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i) || [])[1];

    assert.ok(title && !titles.has(title), `${url} has a missing or duplicate title`);
    assert.ok(description && !descriptions.has(description), `${url} has a missing or duplicate description`);
    assert.equal(canonical, url, `${url} has a mismatched canonical`);
    assert.equal((html.match(/<h1\b/gi) || []).length, 1, `${url} must have exactly one h1`);
    assert.doesNotMatch(html, /name="robots"[^>]+content="[^"]*noindex/i, `${url} is noindex but listed in the sitemap`);
    assert.doesNotMatch(html, /공연 정보를 불러오는 중|승인 후 사이드 광고|광고 영역입니다|Lorem ipsum|\bTODO\b/i, `${url} contains unfinished-state copy`);
    for (const match of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
      assert.doesNotThrow(() => JSON.parse(match[1]), `${url} has invalid JSON-LD`);
    }
    titles.add(title);
    descriptions.add(description);
  }
});

test("keeps every public HTML page either curated in the sitemap or explicitly noindex", () => {
  const sitemap = read("sitemap.xml");
  const indexedPaths = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname.replace(/\/$/, "")));
  const violations = [];
  const visit = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (["minimal-preview", "palette-preview"].includes(entry.name)) continue;
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.name.endsWith(".html")) {
        const relative = path.relative(root, file).replace(/\\/g, "/");
        let pathname = `/${relative.replace(/\/index\.html$/, "/").replace(/\.html$/, "").replace(/\/$/, "")}`;
        if (pathname === "/calendar/index") pathname = "/calendar";
        const html = fs.readFileSync(file, "utf8");
        const noindex = /name="robots"[^>]+content="[^"]*noindex/i.test(html);
        const redirect = /<meta[^>]+http-equiv="refresh"/i.test(html);
        if (!indexedPaths.has(pathname) && !noindex && !redirect) violations.push(relative);
      }
    }
  };
  visit(path.join(root, "calendar"));
  assert.deepEqual(violations, []);
});

test("publishes complete social previews for every indexed page", () => {
  const sitemap = read("sitemap.xml");
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  const meta = (html, key) => (html.match(new RegExp(`<meta[^>]+(?:property|name)="${key}"[^>]+content="([^"]+)"`, "i")) || [])[1];

  for (const url of urls) {
    const file = indexedFileFor(url);
    const html = fs.readFileSync(file, "utf8");
    assert.ok(meta(html, "og:title"), `${url} is missing og:title`);
    assert.ok(meta(html, "og:description"), `${url} is missing og:description`);
    assert.equal(meta(html, "og:url"), url, `${url} has a mismatched og:url`);
    assert.match(meta(html, "og:image") || "", /^https:\/\//, `${url} needs an absolute og:image`);
    assert.ok(meta(html, "og:image:alt"), `${url} is missing og:image:alt`);
    assert.equal(meta(html, "twitter:card"), "summary_large_image", `${url} needs a large Twitter card`);
  }

  const socialCard = fs.readFileSync(path.join(root, "calendar", "assets", "brand", "j-live-social-card.png"));
  assert.equal(socialCard.readUInt32BE(16), 1200);
  assert.equal(socialCard.readUInt32BE(20), 630);
});

test("keeps the shared app icon lightweight and correctly declared", () => {
  const icon = fs.readFileSync(path.join(root, "calendar", "assets", "brand", "j-live-app-logo.png"));
  assert.equal(icon.readUInt32BE(16), 512);
  assert.equal(icon.readUInt32BE(20), 512);
  assert.ok(icon.length < 250 * 1024, `app icon is too heavy at ${icon.length} bytes`);
  const manifest = JSON.parse(read("calendar/manifest.webmanifest"));
  assert.equal(manifest.icons[0].sizes, "512x512");
});

test("uses local artist images without third-party avatar fallbacks", () => {
  const site = read("calendar/site.js");
  const event = read("calendar/event.js");
  const app = read("calendar/app.js");
  assert.doesNotMatch(site, /unavatar\.io/);
  assert.match(site, /j-live-app-logo\.png/);
  assert.match(event, /const staticPhoto = photo\.getAttribute\("src"\)/);
  assert.match(event, /J-LIVE 기본 공연 이미지/);
  assert.match(app, /JLIVE_ARTIST_IMAGES\.fallbackUrl\(\)/);
  const events = JSON.parse(read("calendar/data/events.json"));
  for (const event of events.filter(item => item.status === "confirmed")) {
    assert.doesNotMatch(event.youtubeProfileImage || "", /^https?:\/\//i, `${event.id} must cache its profile image locally`);
  }
});

test("keeps confirmed concert evidence direct, secure, and non-aggregated", () => {
  const events = JSON.parse(read("calendar/data/events.json")).filter(event => event.status === "confirmed");
  const discoveryOnlyDomains = new Set([
    "namu.wiki", "www.namu.wiki", "blog.naver.com", "cafe.naver.com",
    "reddit.com", "www.reddit.com", "setlist.fm", "www.setlist.fm",
    "songkick.com", "www.songkick.com", "bandsintown.com", "www.bandsintown.com",
    "ticketjam.jp", "www.ticketjam.jp"
  ]);

  for (const event of events) {
    assert.match(event.verifiedAt || "", /^\d{4}-\d{2}-\d{2}$/, `${event.id} needs a verification date`);
    assert.match(event.vendorUrl || "", /^https:\/\//, `${event.id} needs a secure official ticket URL`);
    assert.ok(Array.isArray(event.sources) && event.sources.length > 0, `${event.id} needs official sources`);
    assert.equal(new Set(event.sources).size, event.sources.length, `${event.id} has duplicate sources`);

    for (const source of event.sources) {
      const url = new URL(source);
      assert.equal(url.protocol, "https:", `${event.id} has an insecure source: ${source}`);
      assert.ok(!discoveryOnlyDomains.has(url.hostname), `${event.id} uses a discovery-only source: ${source}`);
      assert.doesNotMatch(url.pathname, /\/search(?:\/|$)/i, `${event.id} links to search results: ${source}`);
    }

    assert.equal(event.songs?.length, 3, `${event.id} needs exactly three representative songs`);
    for (const [, , songUrl] of event.songs) {
      const url = new URL(songUrl);
      assert.ok(["youtube.com", "www.youtube.com"].includes(url.hostname), `${event.id} song must use YouTube`);
      assert.equal(url.pathname, "/watch", `${event.id} song must use a direct watch URL`);
      assert.ok(url.searchParams.get("v"), `${event.id} song URL needs a video id`);
    }
  }
});

test("keeps concerts within two weeks freshly reverified", () => {
  const todayKey = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit"
  }).format(new Date());
  const today = new Date(`${todayKey}T00:00:00Z`);
  const events = JSON.parse(read("calendar/data/events.json")).filter(event => event.status === "confirmed");

  for (const event of events) {
    const concert = new Date(`${event.concertDate}T00:00:00Z`);
    const daysUntil = Math.floor((concert - today) / 86400000);
    if (daysUntil < 0 || daysUntil > 14) continue;
    const verified = new Date(`${event.verifiedAt}T00:00:00Z`);
    const age = Math.floor((today - verified) / 86400000);
    assert.ok(age <= 7, `${event.id} is ${daysUntil} days away but was last verified ${age} days ago`);
  }
});

test("labels the homepage search and attendance inputs", () => {
  const homepage = read("calendar/index.html");
  assert.match(homepage, /id="artistSearch"[^>]+aria-label="아티스트 이름 검색"/);
  assert.match(homepage, /name="unitPrice"[^>]+aria-label="티켓 1매 가격"/);
  assert.match(homepage, /name="quantity"[^>]+aria-label="티켓 매수"/);
});

test("makes the publisher experience and verification responsibility visible on the homepage", () => {
  const homepage = read("calendar/index.html");
  assert.match(homepage, /<section class="home-editorial-trust"/);
  assert.match(homepage, /팬이 직접 확인하고 씁니다/);
  assert.match(homepage, /href="\.\/stories\/why-j-live" rel="author"/);
  assert.match(homepage, /href="\.\/guides\/verification"/);
  assert.match(homepage, /확인되지 않은 일정은 확정 캘린더와 검색 색인에서 제외/);
});

test("publishes a substantial first-hand story without invented experience claims", () => {
  const story = read("calendar/stories/why-j-live.html");
  const words = visibleText(story).split(/\s+/).filter(Boolean);
  assert.ok(words.length >= 700, `first-hand story is too thin at ${words.length} words`);
  assert.match(story, /2024년 4월 19일|2024\.04\.19/);
  assert.match(story, /2026년에는 6월 20일과 21일/);
  assert.match(story, /2024년 12월 14일 고척스카이돔/);
  assert.match(story, /정확한 좌석 번호와 층별 이동 시간을 별도로 기록하지 않았기 때문에/);
  assert.match(story, /기억하지 못하는 것은 그럴듯하게 채우지 않습니다/);
  assert.match(story, /"@type":"Article"/);
  assert.match(story, /"name":"여일육"/);
  assert.doesNotMatch(story, /pagead2\.googlesyndication\.com/);
  assert.match(read("sitemap.xml"), /<loc>https:\/\/j-live\.kr\/calendar\/stories\/why-j-live<\/loc>/);
});

test("keeps the fan-club directory decision-oriented and ad-free", () => {
  const page = read("calendar/fanclubs/index.html");
  const words = visibleText(page).split(/\s+/).filter(Boolean);
  assert.ok(words.length >= 950, `fan-club guide is too thin at ${words.length} words`);
  assert.match(page, /한국 팬은 회비보다 가입 목적을 먼저 봐야 합니다/);
  assert.match(page, /해외 가입 경로가 확인된 6개 멤버십/);
  assert.match(page, /해외 가입 지원.*한국 공연 선예매 보장이 아니라/s);
  assert.match(page, /월간 440엔을 12개월 유지하면 단순 합계는 5,280엔/);
  assert.match(page, /한국에서 실제 결제를 완료해 모든 멤버십의 가입 과정을 시험한 자료는 아닙니다/);
  assert.match(page, /여일육 조사·편집/);
  assert.match(page, /가격·가입 조건 마지막 확인: 2026년 8월 5일/);
  assert.match(page, /비교 해설 마지막 수정: 2026년 8월 15일/);
  assert.match(page, /"@type":"Article"/);
  assert.doesNotMatch(page, /pagead2\.googlesyndication\.com/);
});

test("keeps the original data report substantial, transparent, and connected", () => {
  const report = read("calendar/reports/2026-jpop-live.html");
  assert.ok(visibleText(report).split(/\s+/).length >= 500, "annual report is too thin");
  assert.match(report, /공연 시리즈/);
  assert.match(report, /같은 아티스트·공연장·예매 페이지/);
  assert.match(report, /가격 통계에는 공식 페이지에서 원화 가격이 확인된/);
  assert.match(report, /한계와 수정 원칙/);
  assert.match(report, /rel="author">여일육 작성·분석/);
  assert.match(report, /"@type":"Dataset"/);
  assert.match(report, /href="\.\.\/styles\.css\?v=20260825conversion1"/);
  assert.match(report, /href="\.\.\/events\//);
  assert.doesNotMatch(report, /href="\.\.\/\.\.\//);
  assert.doesNotMatch(report, /pagead2\.googlesyndication\.com/);
  assert.match(read("calendar/index.html"), /href="\.\/reports\/2026-jpop-live"/);
  assert.match(read("sitemap.xml"), /<loc>https:\/\/j-live\.kr\/calendar\/reports\/2026-jpop-live<\/loc>/);
});

test("uses verified venue dates instead of build dates in the sitemap", () => {
  const sitemap = read("sitemap.xml");
  assert.match(sitemap, /<loc>https:\/\/j-live\.kr\/calendar\/guides\/venues\/kspo-dome<\/loc><lastmod>2026-07-20<\/lastmod>/);
});
