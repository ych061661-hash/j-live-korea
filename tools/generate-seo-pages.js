"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const calendar = path.join(root, "calendar");
const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
const mojibakePattern = /\uFFFD|[\u0080-\u009F]|(?:Ã.|Â.|ì.|ë.|ê.){2,}/u;

function assertCleanText(text, filename) {
  if (mojibakePattern.test(text)) {
    throw new Error(`Refusing to publish suspected mojibake from ${filename}`);
  }
  return text.normalize("NFC");
}

function readUtf8(filename) {
  return assertCleanText(utf8Decoder.decode(fs.readFileSync(filename)), filename);
}

function writeUtf8(filename, text) {
  const cleanText = assertCleanText(text, filename);
  fs.writeFileSync(filename, Buffer.from(cleanText, "utf8"));
}

const eventsPath = path.join(calendar, "data", "events.json");
const events = JSON.parse(readUtf8(eventsPath))
  .filter(event => event.status === "confirmed");
const configText = readUtf8(path.join(calendar, "site-config.js"));
const siteUrlMatch = configText.match(/siteUrl:\s*"([^"]+)"/);
const siteUrl = (siteUrlMatch ? siteUrlMatch[1] : "https://example.com").replace(/\/$/, "");
const template = readUtf8(path.join(calendar, "event.html"));
readUtf8(path.join(calendar, "index.html"));
const eventsDirectory = path.join(calendar, "events");

fs.mkdirSync(eventsDirectory, { recursive: true });

const escapeHtml = value => String(value || "").replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
})[character]);

for (const filename of fs.readdirSync(eventsDirectory)) {
  if (filename.endsWith(".html")) fs.unlinkSync(path.join(eventsDirectory, filename));
}

for (const event of events) {
  const title = `${event.artist} 내한 공연 일정·예매 | 제이라이브 코리아`;
  const description = `${event.concertDate} ${event.time || ""}, ${event.venue}에서 열리는 ${event.artist} 내한 공연의 예매 일정과 공식 출처입니다.`;
  const canonical = `${siteUrl}/calendar/events/${encodeURIComponent(event.id)}.html`;
  const html = template
    .replace("<title>공연 상세 | 제이라이브 코리아</title>", `<title>${escapeHtml(title)}</title>`)
    .replace('content="J-POP 내한 공연 일정, 예매 정보, 공연장 교통과 대표곡을 확인하세요."', `content="${escapeHtml(description)}"`)
    .replace('<link rel="canonical" id="canonicalLink" href="">', `<link rel="canonical" id="canonicalLink" href="${escapeHtml(canonical)}">`)
    .replace("<body>", `<body data-event-id="${escapeHtml(event.id)}">`)
    .replaceAll('href="./', 'href="../')
    .replaceAll('src="./', 'src="../');
  writeUtf8(path.join(eventsDirectory, `${event.id}.html`), html);
}

const staticPaths = [
  "/calendar/index.html",
  "/calendar/about.html",
  "/calendar/contact.html",
  "/calendar/privacy.html",
  "/calendar/terms.html",
  "/calendar/corrections.html"
];
const urls = [
  ...staticPaths.map(url => ({ loc: `${siteUrl}${url}`, lastmod: new Date().toISOString().slice(0, 10) })),
  ...events.map(event => ({
    loc: `${siteUrl}/calendar/events/${encodeURIComponent(event.id)}.html`,
    lastmod: event.verifiedAt || new Date().toISOString().slice(0, 10)
  }))
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(item => `  <url><loc>${escapeHtml(item.loc)}</loc><lastmod>${item.lastmod}</lastmod></url>`).join("\n") +
  `\n</urlset>\n`;
writeUtf8(path.join(root, "sitemap.xml"), sitemap);
writeUtf8(path.join(root, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /calendar/admin.html\nSitemap: ${siteUrl}/sitemap.xml\n`);

console.log(`Generated ${events.length} event pages and sitemap.xml for ${siteUrl}`);
