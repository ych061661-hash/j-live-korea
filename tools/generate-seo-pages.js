"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const calendar = path.join(root, "calendar");
const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
const mojibakePattern = /\uFFFD|[\u0080-\u009F]|(?:Ã.|Â.|ì.|ë.|ê.){2,}/u;

function assertCleanText(text, filename) {
  if (mojibakePattern.test(text)) throw new Error(`Refusing to publish suspected mojibake from ${filename}`);
  return text.normalize("NFC");
}

function readUtf8(filename) {
  return assertCleanText(utf8Decoder.decode(fs.readFileSync(filename)), filename);
}

function writeUtf8(filename, text) {
  fs.writeFileSync(filename, Buffer.from(assertCleanText(text, filename), "utf8"));
}

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
})[character]);

function loadEditorial(filename) {
  const sandbox = { window: {} };
  vm.runInNewContext(readUtf8(filename), sandbox, { filename });
  return sandbox.window.JLIVE_CONTENT || { artists: {}, venues: {}, ticketTips: {}, eventGuides: {}, songGuides: {}, ticketGuides: {}, venueGuides: {} };
}

function seriesKey(event) {
  return [event.artist, event.venue, event.vendorUrl || event.vendor || ""].join("\u0000");
}

function buildSeries(events, today) {
  const groups = new Map();
  for (const event of events) {
    const key = seriesKey(event);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(event);
  }
  const primaryById = new Map();
  const groupById = new Map();
  for (const group of groups.values()) {
    group.sort((a, b) => a.concertDate.localeCompare(b.concertDate) || (a.time || "").localeCompare(b.time || ""));
    const primary = group.find(event => event.concertDate >= today) || group[group.length - 1];
    for (const event of group) {
      primaryById.set(event.id, primary);
      groupById.set(event.id, group);
    }
  }
  return { groups, primaryById, groupById };
}

function humanDate(value, time = "") {
  if (!value) return "미정";
  const [year, month, day] = value.split("-").map(Number);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][new Date(year, month - 1, day).getDay()];
  return `${year}년 ${month}월 ${day}일(${weekday})${time ? ` ${time}` : ""}`;
}

function isoDateTime(date, time) {
  if (!date) return "";
  const matched = String(time || "").match(/(오전|오후|낮)\s*(\d{1,2}):(\d{2})/);
  if (!matched) return date;
  let hour = Number(matched[2]);
  if (matched[1] === "오후" && hour < 12) hour += 12;
  if (matched[1] === "오전" && hour === 12) hour = 0;
  return `${date}T${String(hour).padStart(2, "0")}:${matched[3]}:00+09:00`;
}

function addHoursToIso(value, hours) {
  if (!value) return "";
  if (!value.includes("T")) return value;
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\+09:00$/);
  if (!matched) return value;
  const [, year, month, day, hour, minute, second] = matched.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour + hours, minute, second));
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toISOString().slice(0, 19)}+09:00`;
}

function fileNameForChannel(channel) {
  return String(channel || "")
    .replace(/^@/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function artistImageUrl(event, siteUrl) {
  if (event.youtubeProfileImage && /^https?:\/\//i.test(event.youtubeProfileImage)) return event.youtubeProfileImage;
  if (event.youtubeProfileImage) return `${siteUrl}/calendar/${String(event.youtubeProfileImage).replace(/^\.\//, "")}`;
  const fileName = fileNameForChannel(event.youtubeChannel);
  return fileName ? `${siteUrl}/calendar/assets/artists/${fileName}.jpg` : `${siteUrl}/calendar/assets/brand/j-live-app-logo.png`;
}

function eventEndDate(group) {
  const last = group[group.length - 1];
  return addHoursToIso(isoDateTime(last.concertDate, last.time), 2);
}

function seriesDatesMarkup(group, activeId) {
  return group.map(item => `<li${item.id === activeId ? ' class="active"' : ""}><a href="${encodeURIComponent(item.id)}">${escapeHtml(humanDate(item.concertDate, item.time))}</a></li>`).join("\n");
}

function checklistMarkup(event) {
  const items = [
    `${humanDate(event.concertDate, event.time)} 공연입니다. 현장 수령과 입장 대기를 고려해 여유 있게 도착하세요.`,
    `${event.venue}까지의 이동 경로와 공연 종료 뒤 이용할 교통편을 함께 확인하세요.`,
    event.ticketDate ? `일반예매 기록은 ${humanDate(event.ticketDate, event.ticketTime)}입니다. ${event.vendor || "공식 예매처"}의 최신 공지를 다시 확인하세요.` : "일반예매 일정은 공식 예매처의 추가 공지를 확인해야 합니다.",
    event.presaleDate ? `선예매 기록은 ${humanDate(event.presaleDate, event.presaleTime)}입니다. 참여 조건과 인증 방법을 먼저 확인하세요.` : "현재 기록된 선예매 일정이 없습니다. 팬클럽과 주최사 공지를 함께 확인하세요."
  ];
  return items.map(item => `<li>${escapeHtml(item)}</li>`).join("\n");
}

function songsMarkup(event) {
  return (event.songs || []).map(song => `<a class="song" href="${escapeHtml(song[2])}" target="_blank" rel="noopener noreferrer"><span class="play">▶</span><span>${escapeHtml(song[0])}</span><em>${escapeHtml(song[1] || "")}</em></a>`).join("\n");
}

function sourcesMarkup(event) {
  return (event.sources || []).map((source, index) => `<a class="source-link" href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">공식 출처 ${index + 1} 확인 ↗</a>`).join("\n");
}

function ticketGuideMarkup(event, editorial) {
  const guide = editorial.ticketGuides?.[event.artist];
  if (!guide) return "";
  const rows = [
    ["좌석 등급과 가격", guide.price],
    ["선예매·일반예매 조건", guide.presale],
    ["본인 확인", guide.identity],
    ["티켓 수령·모바일 티켓", guide.ticket],
    ["취소표가 풀리는 방식", guide.cancellation]
  ];
  return `<section class="editorial-section ticket-analysis">
              <div class="section-kicker">TICKET ANALYSIS</div>
              <h2>공연별 실제 예매 분석</h2>
              <p class="content-note">공식 예매처 기준 · 마지막 확인 ${escapeHtml(guide.verifiedAt || event.verifiedAt || "기록 없음")}</p>
              <dl class="analysis-list">${rows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>
            </section>`;
}

function venueGuideForEvent(event, editorial) {
  return Object.entries(editorial.venueGuides || {}).find(([, guide]) => guide.venues?.includes(event.venue));
}

function venueGuideLink(event, editorial) {
  const entry = venueGuideForEvent(event, editorial);
  return entry ? `<a class="inline-guide-link" href="../guides/venues/${encodeURIComponent(entry[0])}">${escapeHtml(entry[1].name)} 현장 가이드 보기 →</a>` : "";
}

function richEventGuideMarkup(event, editorial) {
  const guide = editorial.eventGuides?.[event.artist];
  if (!guide) return "";
  const songs = editorial.songGuides?.[event.artist] || [];
  return `<section class="editorial-section deep-guide">
              <div class="section-kicker">J-LIVE ORIGINAL</div>
              <h2>${escapeHtml(event.artist)} 공연을 더 잘 즐기는 법</h2>
              <p class="content-note">J-LIVE 편집부 작성 · 마지막 일정 검증 ${escapeHtml(event.verifiedAt || "기록 없음")}</p>
              <h3>이번 공연의 관전 포인트</h3>
              <p>${escapeHtml(guide.focus)}</p>
              <h3>조회수 높은 대표곡 3곡 입문 순서</h3>
              <ol class="track-guide">${songs.map(song => `<li><strong>${escapeHtml(song.title)}</strong><p>${escapeHtml(song.note)}</p></li>`).join("")}</ol>
            </section>
            ${ticketGuideMarkup(event, editorial)}`;
}

const hasEditorialGuide = (event, editorial) => Boolean(editorial.eventGuides?.[event.artist]);

function structuredData(event, group, canonical, siteUrl) {
  const offer = event.vendorUrl ? {
    "@type": "Offer",
    url: event.vendorUrl,
    availability: "https://schema.org/InStock",
    validFrom: isoDateTime(event.ticketDate, event.ticketTime) || isoDateTime(event.concertDate, event.time),
    ...(event.price ? { priceCurrency: event.priceCurrency || "KRW", price: event.price } : {})
  } : undefined;

  return JSON.stringify({
    "@context": "https://schema.org", "@type": "MusicEvent",
    name: `${event.artist} 내한 공연`,
    description: `${event.artist} 내한 공연 일정, 예매 정보, 공연장 안내와 대표곡을 정리했습니다.`,
    startDate: isoDateTime(event.concertDate, event.time),
    endDate: eventEndDate(group),
    image: [artistImageUrl(event, siteUrl)],
    eventStatus: "https://schema.org/EventScheduled", eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: event.venue, address: { "@type": "PostalAddress", addressCountry: "KR" } },
    performer: { "@type": "MusicGroup", name: event.artist },
    organizer: { "@type": "Organization", name: event.vendor || "J-LIVE Korea", url: event.vendorUrl || siteUrl },
    offers: offer,
    url: canonical
  }).replace(/</g, "\\u003c");
}

function renderEventPage({ event, group, primary, editorial, siteUrl, template, today }) {
  const canonical = `${siteUrl}/calendar/events/${encodeURIComponent(primary.id)}`;
  const indexable = event.id === primary.id && group.some(item => item.concertDate >= today) && hasEditorialGuide(event, editorial);
  const years = [...new Set(group.map(item => item.concertDate.slice(0, 4)))].join("·");
  const [, month, day] = event.concertDate.split("-").map(Number);
  const title = `${event.artist} 내한 ${years} | ${month}월 ${day}일 공연·예매 정보`;
  const dates = group.map(item => humanDate(item.concertDate, item.time)).join(", ");
  const description = `${event.artist} 내한 공연은 ${dates} ${event.venue}에서 열립니다. 예매 일정, 교통, 대표곡과 공식 출처를 확인하세요.`;
  const artistIntro = editorial.artists[event.artist] || `${event.artist}의 한국 공연입니다. 공식 발표와 예매처 정보를 기준으로 일정을 정리했습니다.`;
  const venueGuide = editorial.venues[event.venue] || `${event.venue} 방문 전 공식 공연장 안내에서 대중교통, 주차와 입장 게이트를 확인하세요.`;
  const ticketTip = editorial.ticketTips[event.vendor] || "공식 예매처 로그인과 본인인증, 결제수단을 미리 점검하고 예매 제한 매수를 확인하세요.";
  const songs = (event.songs || []).map(song => song[0]).filter(Boolean);
  const songGuide = songs.length ? `${songs.join(", ")} 순서로 들어보면 ${event.artist}의 음악 색깔을 빠르게 파악할 수 있습니다. 각 곡은 공식 YouTube 영상으로 연결됩니다.` : `${event.artist}의 공식 YouTube 채널에서 최근 대표곡과 라이브 영상을 확인하세요.`;
  const seriesSummary = group.length > 1 ? `이번 내한은 ${group.length}회 공연으로 진행됩니다. 날짜별 공연 시각과 예매 조건이 달라질 수 있으므로 선택한 회차를 확인하세요.` : "현재 공식 확인된 한국 공연은 1회입니다. 추가 회차나 운영 변경은 연결된 공식 출처에서 다시 확인합니다.";
  const robots = indexable ? "index,follow,max-image-preview:large" : "noindex,follow";
  const richGuide = richEventGuideMarkup(event, editorial);

  return template
    .replace("<title>공연 상세 | 제이라이브 코리아</title>", `<title>${escapeHtml(title)}</title>`)
    .replace('content="J-POP 내한 공연 일정, 예매 정보, 공연장 교통과 대표곡을 확인하세요."', `content="${escapeHtml(description)}"`)
    .replace('  <meta name="robots" content="noindex,follow">\n', "")
    .replace('<link rel="canonical" id="canonicalLink" href="">', `<link rel="canonical" id="canonicalLink" href="${escapeHtml(canonical)}">\n  <meta name="robots" content="${robots}">\n  <script type="application/ld+json" id="eventStructuredData">${structuredData(event, group, canonical, siteUrl)}</script>`)
    .replace("<body>", `<body data-event-id="${escapeHtml(event.id)}">`)
    .replace('<div class="event-loading" id="eventLoading">', '<div class="event-loading" id="eventLoading" hidden>')
    .replace('<article id="eventArticle" hidden>', '<article id="eventArticle">')
    .replace('<p id="eventGenre"></p>', `<p id="eventGenre">${escapeHtml(event.genre || "J-POP")}</p>`)
    .replace('<h1 id="eventArtist"></h1>', `<h1 id="eventArtist">${escapeHtml(event.artist)}</h1>`)
    .replace('<strong id="eventSummary"></strong>', `<strong id="eventSummary">${escapeHtml(`${dates} · ${event.venue}`)}</strong>`)
    .replace('<p id="seriesSummary"></p>', `<p id="seriesSummary">${escapeHtml(seriesSummary)}</p>`)
    .replace('<ul class="series-date-list" id="seriesDates"></ul>', `<ul class="series-date-list" id="seriesDates">${seriesDatesMarkup(group, event.id)}</ul>`)
    .replace('<p id="artistIntro"></p>', `<p id="artistIntro">${escapeHtml(artistIntro)}</p>`)
    .replace('<p id="venueGuide"></p>', `<p id="venueGuide">${escapeHtml(venueGuide)}</p>${venueGuideLink(event, editorial)}`)
    .replace('<p id="ticketTip"></p>', `<p id="ticketTip">${escapeHtml(ticketTip)}</p>`)
    .replace('<ul class="check-list" id="dayChecklist"></ul>', `<ul class="check-list" id="dayChecklist">${checklistMarkup(event)}</ul>`)
    .replace('<p id="songGuide"></p>', `<p id="songGuide">${escapeHtml(songGuide)}</p>`)
    .replace('<div class="song-list" id="eventSongs"></div>', `<div class="song-list" id="eventSongs">${songsMarkup(event)}</div>`)
    .replace(/<section class="editorial-section">\s*<div class="section-kicker">SOURCES<\/div>/, `${richGuide ? `${richGuide}\n            ` : ""}<section class="editorial-section">\n              <div class="section-kicker">SOURCES</div>`)
    .replace('<div class="source-links" id="eventSources"></div>', `<div class="source-links" id="eventSources">${sourcesMarkup(event)}</div>`)
    .replace('<p class="verified-copy" id="eventVerified"></p>', `<p class="verified-copy" id="eventVerified">마지막 검증일: ${escapeHtml(event.verifiedAt || "기록 없음")} · 이후 공식 발표로 정보가 변경될 수 있습니다.</p>`)
    .replace('<dd id="factDate"></dd>', `<dd id="factDate">${escapeHtml(humanDate(event.concertDate, event.time))}</dd>`)
    .replace('<dd id="factVenue"></dd>', `<dd id="factVenue">${escapeHtml(event.venue)}</dd>`)
    .replace('<dd id="factPresale"></dd>', `<dd id="factPresale">${escapeHtml(humanDate(event.presaleDate, event.presaleTime))}</dd>`)
    .replace('<dd id="factTicket"></dd>', `<dd id="factTicket">${escapeHtml(humanDate(event.ticketDate, event.ticketTime))}</dd>`)
    .replace('<dd id="factVendor"></dd>', `<dd id="factVendor">${escapeHtml(event.vendor || "미정")}</dd>`)
    .replace('id="eventTicket" target=', `id="eventTicket" href="${escapeHtml(event.vendorUrl || "#")}" target=`)
    .replaceAll('href="./', 'href="../').replaceAll('src="./', 'src="../');
}

function venueSourcesMarkup(guide) {
  return (guide.sources || []).map(source => `<a class="source-link" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)} ↗</a>`).join("");
}

function venuePageHtml(slug, guide, siteUrl) {
  const canonical = `${siteUrl}/calendar/guides/venues/${encodeURIComponent(slug)}`;
  const sections = [
    ["지하철·버스에서 공연장까지", guide.transit],
    guide.capacity && ["좌석·수용 규모", guide.capacity],
    ["입장 줄까지의 동선", guide.arrival],
    ["화장실", guide.restroom],
    ["물품 보관", guide.storage],
    guide.parking && ["관객 주차", guide.parking],
    ["스탠딩·현장 대기", guide.waiting],
    ["주변 식사·카페", guide.nearby],
    ["귀가와 막차", guide.return]
  ].filter(Boolean);
  const description = guide.seoDescription || `${guide.name} 교통, 입장 동선, 화장실, 물품 보관, 식사와 귀가 정보를 공식 출처 기준으로 정리했습니다.`;
  const title = guide.seoTitle || `${guide.name} 교통·화장실·물품보관 가이드`;
  return `<!doctype html>
<html lang="ko"><head>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3081918168688274" crossorigin="anonymous"></script>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)} | 제이라이브 코리아</title>
  <link rel="canonical" href="${escapeHtml(canonical)}"><link rel="stylesheet" href="../../styles.css">
</head><body><div class="shell info-shell">
  <header><a class="brand" href="../../"><span class="brand-mark">J</span> 제이라이브 코리아</a><a class="ghost-button" href="../venues">공연장 목록</a></header>
  <main class="guide-article venue-article"><span class="section-kicker">VENUE FIELD GUIDE</span><h1>${escapeHtml(guide.name)}</h1>
    <p class="guide-lead">${escapeHtml(guide.summary)}</p>
    <nav class="venue-section-nav" aria-label="이 페이지 목차">${sections.map(([title], index) => `<a href="#venue-${index + 1}">${escapeHtml(title)}</a>`).join("")}</nav>
    ${sections.map(([title, body], index) => `<section id="venue-${index + 1}"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p></section>`).join("\n    ")}
    <section><h2>출처와 확인일</h2><div class="source-links">${venueSourcesMarkup(guide)}</div><p class="guide-updated">마지막 확인: ${escapeHtml(guide.verifiedAt)} · 공연 당일 운영은 주최사 공지를 우선합니다.</p></section>
  </main><footer class="site-footer"><nav><a href="../venues">공연장 가이드</a><a href="../../corrections">정보 수정 요청</a></nav></footer>
</div></body></html>\n`;
}

function venueIndexHtml(venueGuides, siteUrl) {
  const guides = Object.entries(venueGuides || {});
  return `<!doctype html>
<html lang="ko"><head>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3081918168688274" crossorigin="anonymous"></script>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="J-POP 내한 주요 공연장의 교통, 입장 동선, 화장실, 물품 보관, 식사와 귀가 정보를 공연장별로 확인하세요.">
  <title>J-POP 내한 공연장 현장 가이드 | 제이라이브 코리아</title>
  <link rel="canonical" href="${escapeHtml(siteUrl)}/calendar/guides/venues"><link rel="stylesheet" href="../styles.css">
</head><body><div class="shell info-shell">
  <header><a class="brand" href="../"><span class="brand-mark">J</span> 제이라이브 코리아</a><a class="ghost-button" href="../">공연 달력</a></header>
  <main class="guide-article venue-index"><span class="section-kicker">VENUE CATEGORY</span><h1>공연장 현장 가이드</h1>
    <p class="guide-lead">교통만 적지 않았습니다. 입장 줄, 화장실, 물품 보관, 식사와 공연 종료 뒤 귀가까지 공연장별로 확인합니다.</p>
    <div class="venue-card-grid">${guides.map(([slug, guide]) => `<a class="venue-card" href="./venues/${encodeURIComponent(slug)}"><span>${escapeHtml(guide.venues.join(" · "))}</span><strong>${escapeHtml(guide.name)}</strong><p>${escapeHtml(guide.summary)}</p><em>마지막 확인 ${escapeHtml(guide.verifiedAt)}</em></a>`).join("")}</div>
  </main><footer class="site-footer"><nav><a href="../about">소개</a><a href="../corrections">정보 수정 요청</a></nav></footer>
</div></body></html>\n`;
}

function main() {
  const today = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);
  const events = JSON.parse(readUtf8(path.join(calendar, "data", "events.json"))).filter(event => event.status === "confirmed");
  const editorial = loadEditorial(path.join(calendar, "content.js"));
  const configText = readUtf8(path.join(calendar, "site-config.js"));
  const siteUrlMatch = configText.match(/siteUrl:\s*"([^"]+)"/);
  const siteUrl = (siteUrlMatch ? siteUrlMatch[1] : "https://example.com").replace(/\/$/, "");
  const template = readUtf8(path.join(calendar, "event.html"));
  readUtf8(path.join(calendar, "index.html"));
  const eventsDirectory = path.join(calendar, "events");
  fs.mkdirSync(eventsDirectory, { recursive: true });
  for (const filename of fs.readdirSync(eventsDirectory)) if (filename.endsWith(".html")) fs.unlinkSync(path.join(eventsDirectory, filename));

  const { primaryById, groupById } = buildSeries(events, today);
  for (const event of events) {
    const html = renderEventPage({ event, group: groupById.get(event.id), primary: primaryById.get(event.id), editorial, siteUrl, template, today });
    writeUtf8(path.join(eventsDirectory, `${event.id}.html`), html);
  }

  const venueDirectory = path.join(calendar, "guides", "venues");
  fs.mkdirSync(venueDirectory, { recursive: true });
  for (const filename of fs.readdirSync(venueDirectory)) if (filename.endsWith(".html")) fs.unlinkSync(path.join(venueDirectory, filename));
  for (const [slug, guide] of Object.entries(editorial.venueGuides || {})) writeUtf8(path.join(venueDirectory, `${slug}.html`), venuePageHtml(slug, guide, siteUrl));
  writeUtf8(path.join(calendar, "guides", "venues.html"), venueIndexHtml(editorial.venueGuides, siteUrl));

  const venuePaths = Object.keys(editorial.venueGuides || {}).map(slug => `/calendar/guides/venues/${encodeURIComponent(slug)}`);
  const staticPaths = ["/calendar/", "/calendar/about", "/calendar/guides/venues", ...venuePaths, "/calendar/guides/verification", "/calendar/guides/standing-concert"];
  const primaryEvents = events.filter(event => primaryById.get(event.id).id === event.id && groupById.get(event.id).some(item => item.concertDate >= today) && hasEditorialGuide(event, editorial));
  const lastmod = today;
  const urls = [...staticPaths.map(url => ({ loc: `${siteUrl}${url}`, lastmod })), ...primaryEvents.map(event => ({ loc: `${siteUrl}/calendar/events/${encodeURIComponent(event.id)}`, lastmod: event.verifiedAt || lastmod }))];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(item => `  <url><loc>${escapeHtml(item.loc)}</loc><lastmod>${item.lastmod}</lastmod></url>`).join("\n")}\n</urlset>\n`;
  writeUtf8(path.join(root, "sitemap.xml"), sitemap);
  writeUtf8(path.join(root, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /calendar/admin.html\nSitemap: ${siteUrl}/sitemap.xml\n`);
  console.log(`Generated ${events.length} pages; ${primaryEvents.length} future series are indexable for ${siteUrl}`);
}

if (require.main === module) main();
module.exports = { assertCleanText, buildSeries, hasEditorialGuide, humanDate, renderEventPage, richEventGuideMarkup, seriesDatesMarkup, seriesKey, ticketGuideMarkup, venueGuideForEvent, venueIndexHtml, venuePageHtml };
