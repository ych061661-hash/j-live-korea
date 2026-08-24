"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const {
  artistIndexHtml, artistPageHtml, artistSlug, buildUpdateHistory,
  snapshotEvents, updatesPageHtml, weeklyPageHtml
} = require("./discovery-pages");

const root = path.resolve(__dirname, "..");
const calendar = path.join(root, "calendar");
const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
const mojibakePattern = /\uFFFD|[\u0080-\u009F]|(?:Ã.|Â.|ì.|ë.|ê.){2,}/u;

function assertCleanText(text, filename) {
  if (mojibakePattern.test(text)) throw new Error(`Refusing to publish suspected mojibake from ${filename}`);
  return text.normalize("NFC");
}

function readUtf8(filename) {
  const text = assertCleanText(utf8Decoder.decode(fs.readFileSync(filename)), filename);
  return text.replace(/\r\n/g, "\n");
}

function writeUtf8(filename, text) {
  fs.writeFileSync(filename, Buffer.from(assertCleanText(text, filename), "utf8"));
}

function seoulDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
})[character]);

const fundingChoicesSnippet = `  <script async src="https://fundingchoicesmessages.google.com/i/pub-3081918168688274?ers=1"></script>
  <script>(function() {function signalGooglefcPresent() {if (!window.frames['googlefcPresent']) {if (document.body) {const iframe = document.createElement('iframe'); iframe.style = 'width:0;height:0;border:none;display:none;'; iframe.name = 'googlefcPresent'; document.body.appendChild(iframe);} else {setTimeout(signalGooglefcPresent, 0);}}}signalGooglefcPresent();})();</script>`;

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

function artistImageInfo(event, siteUrl) {
  if (event.youtubeProfileImage && /^https?:\/\//i.test(event.youtubeProfileImage)) return { url: event.youtubeProfileImage, fallback: false };
  if (event.youtubeProfileImage) return { url: `${siteUrl}/calendar/${String(event.youtubeProfileImage).replace(/^\.\//, "")}`, fallback: false };
  const fileName = fileNameForChannel(event.youtubeChannel);
  return fileName && fs.existsSync(path.join(calendar, "assets", "artists", `${fileName}.jpg`))
    ? { url: `${siteUrl}/calendar/assets/artists/${fileName}.jpg`, fallback: false }
    : { url: `${siteUrl}/calendar/assets/brand/j-live-social-card.png`, fallback: true };
}

function artistImageUrl(event, siteUrl) {
  return artistImageInfo(event, siteUrl).url;
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

function relatedEvents(event, events, today) {
  const seenArtists = new Set();
  return events
    .filter(item => item.status === "confirmed" && item.id !== event.id && item.artist !== event.artist && item.concertDate >= today)
    .map(item => ({
      item,
      score: (item.genre === event.genre ? 4 : 0)
        + (item.venue === event.venue ? 3 : 0)
        + (item.vendor === event.vendor ? 2 : 0)
        + (Math.abs(new Date(`${item.concertDate}T00:00:00`) - new Date(`${event.concertDate}T00:00:00`)) <= 30 * 86400000 ? 2 : 0)
    }))
    .sort((left, right) => right.score - left.score || left.item.concertDate.localeCompare(right.item.concertDate))
    .filter(({ item }) => !seenArtists.has(item.artist) && seenArtists.add(item.artist))
    .slice(0, 3)
    .map(({ item }) => item);
}

function relatedEventsMarkup(event, events, today) {
  return relatedEvents(event, events, today).map(item => `<a href="./events/${encodeURIComponent(item.id)}" data-related-event="${escapeHtml(item.id)}"><span>${escapeHtml(item.genre || "J-POP")}</span><strong>${escapeHtml(item.artist)}</strong><p>${escapeHtml(humanDate(item.concertDate, item.time))}</p><em>${escapeHtml(item.venue)}</em></a>`).join("\n");
}

function ticketGuideMarkup(event, editorial) {
  const guide = editorial.ticketGuides?.[event.artist];
  const verifiedPrices = Array.isArray(event.seatPrices) && event.seatPrices.length
    ? event.seatPrices.map(item => `${item.name} ${Number(item.price).toLocaleString("ko-KR")}원`).join(" · ")
    : "";
  if (!guide && !verifiedPrices) return "";
  const rows = [
    ["좌석 등급과 가격", verifiedPrices || guide?.price],
    ["선예매·일반예매 조건", guide?.presale],
    ["본인 확인", guide?.identity],
    ["티켓 수령·모바일 티켓", guide?.ticket],
    ["취소표가 풀리는 방식", guide?.cancellation]
  ].filter(([, value]) => value);
  return `<section class="editorial-section ticket-analysis">
              <div class="section-kicker">TICKET ANALYSIS</div>
              <h2>공연별 실제 예매 분석</h2>
              <p class="content-note">공식 예매처 기준 · 마지막 확인 ${escapeHtml(event.priceVerifiedAt || guide?.verifiedAt || event.verifiedAt || "기록 없음")}</p>
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
  const optionalSection = (title, value) => value ? `<h3>${title}</h3><p>${escapeHtml(value)}</p>` : "";
  return `<section class="editorial-section deep-guide">
              <div class="section-kicker">J-LIVE ORIGINAL</div>
              <h2>${escapeHtml(event.artist)} 공연을 더 잘 즐기는 법</h2>
              <p class="content-note"><a href="../about" rel="author">여일육 작성</a> · <a href="../guides/verification">편집·검증 기준</a> · 마지막 일정 검증 ${escapeHtml(event.verifiedAt || "기록 없음")}</p>
              <h3>이번 공연의 관전 포인트</h3>
              <p>${escapeHtml(guide.focus)}</p>
              ${optionalSection("공연 전에 듣는 순서", guide.listening)}
              <h3>조회수 높은 대표곡 3곡 입문 순서</h3>
              <ol class="track-guide">${songs.map(song => `<li><strong>${escapeHtml(song.title)}</strong><p>${escapeHtml(song.note)}</p></li>`).join("")}</ol>
              ${optionalSection("공연장 도착과 귀가 계획", guide.plan)}
            </section>`;
}

const hasEditorialGuide = (event, editorial) => Boolean(editorial.eventGuides?.[event.artist]);

function hasIndexableEventContent(event, editorial) {
  const guide = editorial.eventGuides?.[event.artist];
  const songGuides = editorial.songGuides?.[event.artist] || [];
  const songs = event.songs || [];
  return String(editorial.artists?.[event.artist] || "").length >= 40
    && [guide?.focus, guide?.listening, guide?.plan].every(value => String(value || "").length >= 100)
    && songGuides.length === 3
    && songGuides.every(song => String(song.title || "").trim() && String(song.note || "").length >= 35)
    && String(editorial.venues?.[event.venue] || "").length >= 50
    && songs.length === 3
    && songs.every(song => /^https:\/\/(?:www\.)?youtube\.com\/watch\?/i.test(String(song[2] || "")))
    && Array.isArray(event.sources)
    && event.sources.length > 0;
}

function homepageUpcomingMarkup(events) {
  const cards = [...events]
    .sort((a, b) => a.concertDate.localeCompare(b.concertDate) || (a.time || "").localeCompare(b.time || ""))
    .slice(0, 8)
    .map(event => `<article class="seo-upcoming-card">
          <div><span class="section-kicker">${escapeHtml(event.genre || "J-POP")}</span><h3><a href="./events/${encodeURIComponent(event.id)}">${escapeHtml(event.artist)}</a></h3></div>
          <dl>
            <div><dt>공연</dt><dd>${escapeHtml(humanDate(event.concertDate, event.time))}</dd></div>
            <div><dt>공연장</dt><dd>${escapeHtml(event.venue)}</dd></div>
            <div><dt>일반예매</dt><dd>${escapeHtml(humanDate(event.ticketDate, event.ticketTime))}</dd></div>
            <div><dt>선예매</dt><dd>${escapeHtml(event.presaleDate ? humanDate(event.presaleDate, event.presaleTime) : "공식 발표 없음")}</dd></div>
          </dl>
          <p>공식 출처 마지막 확인 ${escapeHtml(event.verifiedAt || "기록 없음")}</p>
          <a class="seo-upcoming-link" href="./events/${encodeURIComponent(event.id)}">직접 작성한 공연 가이드 보기 →</a>
        </article>`).join("\n");
  return `<section class="seo-upcoming" aria-labelledby="seoUpcomingTitle">
      <div class="seo-upcoming-heading">
        <div><span class="section-kicker">EDITOR'S VERIFIED PICKS</span><h2 id="seoUpcomingTitle"><span class="seo-upcoming-title-full">직접 확인한 다가오는 공연</span><span class="seo-upcoming-title-mobile">직접 확인한 공연</span></h2></div>
        <div class="seo-upcoming-heading-copy"><p>공식 예매처와 주최사 발표를 대조하고, 아티스트별 관전 포인트와 공연장 이동 계획까지 직접 작성한 일정만 모았습니다.</p><a class="seo-upcoming-all" href="#calendar">전체 일정 보기 <span aria-hidden="true">→</span></a></div>
      </div>
      <div class="seo-upcoming-grid">${cards}</div>
    </section>`;
}

function structuredData(event, group, canonical, siteUrl) {
  const availability = event.ticketAvailability === "sold_out"
    ? "https://schema.org/SoldOut"
    : event.ticketAvailability === "in_stock"
      ? "https://schema.org/InStock"
      : undefined;
  const offer = event.vendorUrl ? {
    "@type": "Offer",
    url: event.vendorUrl,
    ...(availability ? { availability } : {}),
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

function articleStructuredData(event, canonical, siteUrl) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${event.artist} 내한 공연 일정·예매·관람 가이드`,
    description: `${event.artist} 내한 공연의 공식 일정, 예매 정보, 공연장 이동과 대표곡을 직접 확인해 정리했습니다.`,
    image: [artistImageUrl(event, siteUrl)],
    dateModified: event.verifiedAt || event.concertDate,
    author: { "@type": "Person", name: "여일육", url: `${siteUrl}/calendar/about` },
    publisher: { "@type": "Organization", name: "제이라이브 코리아", url: `${siteUrl}/calendar/` },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical }
  }).replace(/</g, "\\u003c");
}

function renderEventPage({ event, events, group, primary, editorial, siteUrl, template, today }) {
  const canonical = `${siteUrl}/calendar/events/${encodeURIComponent(primary.id)}`;
  const image = artistImageInfo(event, siteUrl);
  const socialImage = image.url;
  const pageImage = image.fallback
    ? "../assets/brand/j-live-app-logo.png"
    : socialImage.startsWith(`${siteUrl}/calendar/`)
      ? `../${socialImage.slice(`${siteUrl}/calendar/`.length)}`
      : socialImage;
  const imageAlt = image.fallback ? "J-LIVE 기본 공연 이미지" : `${event.artist} 공식 프로필`;
  const imageSize = image.fallback ? 'width="512" height="512"' : 'width="1200" height="675"';
  const imageClass = image.fallback ? ' class="event-photo-fallback"' : "";
  const indexable = event.id === primary.id && group.some(item => item.concertDate >= today) && hasIndexableEventContent(event, editorial);
  const years = [...new Set(group.map(item => item.concertDate.slice(0, 4)))].join("·");
  const [, month, day] = event.concertDate.split("-").map(Number);
  const title = `${event.artist} 내한 ${years} 예매 일정 | ${month}월 ${day}일 공연 정보`;
  const dates = group.map(item => humanDate(item.concertDate, item.time)).join(", ");
  const description = `${event.artist} 내한 공연은 ${dates} ${event.venue}에서 열립니다. 예매 일정, 교통, 대표곡과 공식 출처를 확인하세요.`;
  const artistIntro = editorial.artists[event.artist] || `${event.artist}의 한국 공연입니다. 공식 발표와 예매처 정보를 기준으로 일정을 정리했습니다.`;
  const venueGuide = editorial.venues[event.venue] || `${event.venue} 방문 전 공식 공연장 안내에서 대중교통, 주차와 입장 게이트를 확인하세요.`;
  const ticketTip = editorial.ticketTips[event.vendor] || "공식 예매처 로그인과 본인인증, 결제수단을 미리 점검하고 예매 제한 매수를 확인하세요.";
  const songs = (event.songs || []).map(song => song[0]).filter(Boolean);
  const songGuide = songs.length ? `${songs.join(", ")} 순서로 들어보면 ${event.artist}의 음악 색깔을 빠르게 파악할 수 있습니다. 각 곡은 공식 YouTube 영상으로 연결됩니다.` : `${event.artist}의 공식 YouTube 채널에서 최근 대표곡과 라이브 영상을 확인하세요.`;
  const seriesSummary = group.length > 1 ? `이번 내한은 ${group.length}회 공연으로 진행됩니다. 날짜별 공연 시각과 예매 조건이 달라질 수 있으므로 선택한 회차를 확인하세요.` : "현재 공식 확인된 한국 공연은 1회입니다. 추가 회차나 운영 변경은 연결된 공식 출처에서 다시 확인합니다.";
  const robots = indexable ? "index,follow,max-image-preview:large" : "noindex,follow";
  const detailGuides = [richEventGuideMarkup(event, editorial), ticketGuideMarkup(event, editorial)].filter(Boolean).join("\n            ");

  return template
    .replace("<head>", `<head>${indexable ? `\n  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3081918168688274" crossorigin="anonymous"></script>\n${fundingChoicesSnippet}` : ""}`)
    .replace("<title>공연 상세 | 제이라이브 코리아</title>", `<title>${escapeHtml(title)}</title>`)
    .replace('content="J-POP 내한 공연 일정, 예매 정보, 공연장 교통과 대표곡을 확인하세요."', `content="${escapeHtml(description)}"`)
    .replace('  <meta name="robots" content="noindex,follow">\n', "")
    .replace('<link rel="canonical" id="canonicalLink" href="">', `<link rel="canonical" id="canonicalLink" href="${escapeHtml(canonical)}">\n  <meta name="author" content="여일육">\n  <meta name="robots" content="${robots}">\n  <meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="제이라이브 코리아">\n  <meta property="og:type" content="article"><meta property="og:title" content="${escapeHtml(title)}">\n  <meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonical)}">\n  <meta property="og:image" content="${escapeHtml(socialImage)}"><meta property="og:image:alt" content="${escapeHtml(imageAlt)}">\n  <meta name="twitter:card" content="summary_large_image">\n  <script type="application/ld+json" id="eventStructuredData">${structuredData(event, group, canonical, siteUrl)}</script>\n  <script type="application/ld+json" id="articleStructuredData">${articleStructuredData(event, canonical, siteUrl)}</script>`)
    .replace("<body>", `<body data-event-id="${escapeHtml(event.id)}">`)
    .replace('<article id="eventArticle" hidden>', '<article id="eventArticle">')
    .replace('<img id="eventPhoto" alt="" referrerpolicy="no-referrer" width="1200" height="675" decoding="async" fetchpriority="high">', `<img id="eventPhoto"${imageClass} src="${escapeHtml(pageImage)}" alt="${escapeHtml(imageAlt)}" referrerpolicy="no-referrer" ${imageSize} decoding="async" fetchpriority="high">`)
    .replace('<p id="eventGenre"></p>', `<p id="eventGenre">${escapeHtml(event.genre || "J-POP")}</p>`)
    .replace('<h1 id="eventArtist"></h1>', `<h1 id="eventArtist">${escapeHtml(event.artist)}</h1>`)
    .replace('<strong id="eventSummary"></strong>', `<strong id="eventSummary">${escapeHtml(`${dates} · ${event.venue}`)}</strong>`)
    .replace('<p id="seriesSummary"></p>', `<p id="seriesSummary">${escapeHtml(seriesSummary)}</p>`)
    .replace('<ul class="series-date-list" id="seriesDates"></ul>', `<ul class="series-date-list" id="seriesDates">${seriesDatesMarkup(group, event.id)}</ul>`)
    .replace('<p id="artistIntro"></p>', `<p id="artistIntro">${escapeHtml(artistIntro)}</p><a class="artist-profile-link" href="../artists/${encodeURIComponent(artistSlug(event))}">${escapeHtml(event.artist)} 아티스트 페이지 →</a>`)
    .replace('<p id="venueGuide"></p>', `<p id="venueGuide">${escapeHtml(venueGuide)}</p>${venueGuideLink(event, editorial)}`)
    .replace('<p id="ticketTip"></p>', `<p id="ticketTip">${escapeHtml(ticketTip)}</p>`)
    .replace('<ul class="check-list" id="dayChecklist"></ul>', `<ul class="check-list" id="dayChecklist">${checklistMarkup(event)}</ul>`)
    .replace('<p id="songGuide"></p>', `<p id="songGuide">${escapeHtml(songGuide)}</p>`)
    .replace('<div class="song-list" id="eventSongs"></div>', `<div class="song-list" id="eventSongs">${songsMarkup(event)}</div>`)
    .replace('<div class="related-event-grid" id="relatedEvents"></div>', `<div class="related-event-grid" id="relatedEvents">${relatedEventsMarkup(event, events, today)}</div>`)
    .replace(/<section class="editorial-section">\s*<div class="section-kicker">SOURCES<\/div>/, `${detailGuides ? `${detailGuides}\n            ` : ""}<section class="editorial-section">\n              <div class="section-kicker">SOURCES</div>`)
    .replace('<div class="source-links" id="eventSources"></div>', `<div class="source-links" id="eventSources">${sourcesMarkup(event)}</div>`)
    .replace('<p class="verified-copy" id="eventVerified"></p>', `<p class="verified-copy" id="eventVerified">마지막 검증일: ${escapeHtml(event.verifiedAt || "기록 없음")} · 이후 공식 발표로 정보가 변경될 수 있습니다.</p>`)
    .replace('<dd id="factDate"></dd>', `<dd id="factDate">${escapeHtml(humanDate(event.concertDate, event.time))}</dd>`)
    .replace('<dd id="factVenue"></dd>', `<dd id="factVenue">${escapeHtml(event.venue)}</dd>`)
    .replace('<dd id="factPresale"></dd>', `<dd id="factPresale">${escapeHtml(humanDate(event.presaleDate, event.presaleTime))}</dd>`)
    .replace('<dd id="factTicket"></dd>', `<dd id="factTicket">${escapeHtml(humanDate(event.ticketDate, event.ticketTime))}</dd>`)
    .replace('<dd id="factVendor"></dd>', `<dd id="factVendor">${escapeHtml(event.vendor || "미정")}</dd>`)
    .replace('<dd id="factAvailability"></dd>', `<dd id="factAvailability">${escapeHtml(event.ticketAvailability === "sold_out" ? "매진" : event.ticketAvailability === "in_stock" ? "판매 중" : "공식 예매처 확인")}</dd>`)
    .replace('id="eventTicket" target=', `id="eventTicket" href="${escapeHtml(event.vendorUrl || "#")}" data-track-vendor="${escapeHtml(event.vendor || "미정")}" target=`)
    .replaceAll('href="./', 'href="../').replaceAll('src="./', 'src="../');
}

function venueSourcesMarkup(guide) {
  return (guide.sources || []).map(source => `<a class="source-link" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)} ↗</a>`).join("");
}

function venueFacilityMapMarkup(slug, sections) {
  const sectionTarget = key => {
    const index = sections.findIndex(([sectionKey]) => sectionKey === key);
    return index < 0 ? "#venue-sources" : `#venue-${index + 1}`;
  };
  const wc = (x, y, label) => `<a href="${sectionTarget("restroom")}" aria-label="${escapeHtml(label)}"><g class="map-wc"><circle cx="${x}" cy="${y}" r="27"/><text x="${x}" y="${y + 6}">WC</text></g></a>`;
  const gate = (x, y, text, label = `${text} 입장구`) => `<a href="${sectionTarget("arrival")}" aria-label="${escapeHtml(label)}"><g class="map-gate"><rect x="${x}" y="${y}" width="70" height="34" rx="9"/><text x="${x + 35}" y="${y + 23}">${escapeHtml(text)}</text></g></a>`;
  const maps = {
    "kspo-dome": {
      title: "KSPO DOME 화장실·게이트 약도",
      note: "올림픽공원 공식 안내도와 사용자가 제공한 2026 KING GNU 공연 현장 안내도를 바탕으로 단순화했습니다. WC는 해당 공연의 참고 위치이며 상시 개방 위치가 아닙니다.",
      source: "https://www.ksponco.or.kr/sports/map",
      sourceLabel: "올림픽공원 공식 지도",
      svg: `<path class="map-road" d="M18 174 C155 124 192 34 340 22 S610 76 742 42"/><path class="map-road" d="M32 544 C158 465 230 486 337 584"/><path class="map-road" d="M548 596 C588 505 676 486 748 458"/>
        <rect class="map-landmark" x="250" y="20" width="304" height="86" rx="28"/><text class="map-landmark-label" x="402" y="70">올림픽수영장</text>
        <path class="map-landmark" d="M18 214 Q138 146 222 214 V438 Q100 476 18 410Z"/><text class="map-landmark-label" x="116" y="324">88잔디마당</text>
        <rect class="map-landmark" x="66" y="492" width="266" height="92" rx="44"/><text class="map-landmark-label" x="199" y="532">티켓링크 라이브 아레나</text>
        <rect class="map-landmark" x="523" y="499" width="212" height="82" rx="28"/><text class="map-landmark-label" x="629" y="536">핸드볼경기장</text>
        <circle class="map-dome-ring" cx="428" cy="316" r="190"/><circle class="map-dome" cx="428" cy="316" r="158"/><text class="map-dome-title" x="428" y="305">KSPO DOME</text><text class="map-dome-subtitle" x="428" y="333">올림픽체조경기장</text>
        ${gate(536, 138, "2-3")}${gate(228, 292, "2-2")}${gate(526, 454, "2-1")}${wc(242, 132, "북서쪽 화장실 안내")}${wc(446, 506, "남쪽 화장실 안내")}
        <g class="map-parking"><path d="M620 92 H704"/><path d="M696 84 L710 92 L696 100"/><circle cx="606" cy="92" r="26"/><text x="606" y="98">P5</text></g><text class="map-small-label" x="654" y="72">동2문·P5 방향</text>
        <g class="map-temporary"><circle cx="644" cy="410" r="23"/><text x="644" y="416">!</text></g><text class="map-small-label" x="644" y="447">임시 부스</text>`
    },
    "olympic-hall": {
      title: "올림픽홀 1층 시설 약도",
      note: "공식 1층 평면도의 관객 로비·객석·화장실 위치 관계를 단순화했습니다.",
      source: "https://www.ksponco.or.kr/attachFiles/download/kspo/olympichall_1.pdf",
      sourceLabel: "올림픽홀 공식 1층 도면",
      svg: `<rect class="map-building" x="58" y="42" width="644" height="520" rx="30"/>
        <rect class="map-zone service" x="92" y="226" width="170" height="98" rx="18"/><text class="map-zone-label" x="177" y="281">로비</text>
        <rect class="map-zone primary" x="292" y="94" width="356" height="342" rx="80"/><rect class="map-detail-box dark" x="370" y="116" width="200" height="52" rx="12"/><text class="map-detail-label light" x="470" y="148">무대</text><path class="map-detail-line light" d="M330 194 H610"/><text class="map-zone-label light" x="470" y="265">올림픽홀 객석</text><text class="map-zone-sub light" x="470" y="294">1층 객석 · 후면 조정실</text>
        <rect class="map-zone secondary" x="292" y="456" width="356" height="72" rx="22"/><text class="map-zone-label" x="470" y="499">대중음악전시관·VIP실</text>
        ${wc(251, 424, "1층 로비 인근 화장실 안내")}${gate(92, 412, "ENT", "올림픽홀 관객 입구")}`
    },
    "kintex-second-exhibition": {
      title: "킨텍스 제2전시장 9·10홀 약도",
      note: "공식 제2전시장 안내도와 주최자 매뉴얼을 기준으로 9홀·10홀과 10홀 앞 물품보관함을 표시했습니다. WC 아이콘은 각 홀 지원 화장실의 개념 표시이며 정확한 좌표는 공식 도면을 확인해야 합니다.",
      source: "https://www.kintex.com/web/ko/html/facility/exhibition_facility_02.do",
      sourceLabel: "킨텍스 제2전시장 공식 도면",
      svg: `<rect class="map-building" x="42" y="54" width="676" height="500" rx="24"/>
        <rect class="map-zone muted" x="76" y="92" width="108" height="300" rx="12"/><text class="map-zone-label" x="130" y="248">8홀</text>
        <rect class="map-zone primary" x="200" y="92" width="218" height="300" rx="12"/><path class="map-detail-line light" d="M309 92 V392"/><text class="map-detail-label light" x="255" y="222">9A</text><text class="map-detail-label light" x="364" y="222">9B</text><text class="map-zone-sub light" x="309" y="126">9홀</text>
        <rect class="map-zone primary" x="434" y="92" width="218" height="300" rx="12"/><path class="map-detail-line light" d="M543 92 V392"/><text class="map-detail-label light" x="489" y="222">10A</text><text class="map-detail-label light" x="598" y="222">10B</text><text class="map-zone-sub light" x="543" y="126">10홀</text>
        <rect class="map-zone service" x="76" y="420" width="576" height="76" rx="18"/><text class="map-zone-label" x="364" y="453">관객 로비·중앙 통로</text><text class="map-zone-sub" x="222" y="480">홀별 지원시설</text><text class="map-zone-sub" x="505" y="480">10홀 앞 물품보관함</text>
        ${wc(426, 452, "9홀과 10홀 사이 로비 화장실 안내")}${wc(664, 452, "10홀 로비 화장실 안내")}${gate(270, 510, "ENTRY", "제2전시장 관객 진입 방향")}`
    },
    "jangchung-gymnasium": {
      title: "장충체육관 출입·편의시설 약도",
      note: "공식 시설 안내의 동대입구역 연결통로와 주출입구를 단순화했습니다. WC 아이콘은 공식 안내된 1층 장애인 전용 화장실 2개소를 뜻하며 정확한 좌표는 아닙니다.",
      source: "https://www.sisul.or.kr/open_content/jangchung/introduce/facility.jsp",
      sourceLabel: "장충체육관 공식 시설 안내",
      svg: `<path class="map-flow" d="M40 300 H174"/><text class="map-small-label" x="106" y="276">동대입구역 5번 출구</text>
        <ellipse class="map-dome-ring" cx="430" cy="300" rx="244" ry="214"/><ellipse class="map-level-ring" cx="430" cy="300" rx="220" ry="190"/><ellipse class="map-dome" cx="430" cy="300" rx="174" ry="144"/>
        <text class="map-dome-title" x="430" y="290">장충체육관</text><text class="map-dome-subtitle" x="430" y="320">주경기장</text><text class="map-small-label light" x="430" y="104">3F 경기장·라운지</text><text class="map-small-label light" x="430" y="478">2F 안내·매표·물품보관</text>
        ${gate(174, 282, "연결", "지하철 연결통로 입구")}${gate(624, 282, "주출입", "장충체육관 주출입구")}${wc(284, 126, "1층 장애인 전용 화장실")}${wc(576, 126, "1층 장애인 전용 화장실")}<text class="map-small-label" x="690" y="230">P1·P2 주차 방향</text>`
    },
    "inspire-arena": {
      title: "인스파이어 아레나 리조트 동선 약도",
      note: "공식 리조트 교통·아레나 안내를 기준으로 셔틀 도착부터 아레나까지의 실내 이동 관계를 표시했습니다. 화장실 세부 좌표는 공개되지 않았습니다.",
      source: "https://www.inspireresorts.com/ko/entertainment/inspire-arena",
      sourceLabel: "인스파이어 아레나 공식 안내",
      svg: `<rect class="map-zone service" x="48" y="228" width="150" height="92" rx="28"/><text class="map-zone-label" x="123" y="266">셔틀 하차</text><text class="map-zone-sub" x="123" y="292">오션타워</text>
        <path class="map-flow" d="M198 274 H310"/><rect class="map-zone secondary" x="310" y="190" width="172" height="168" rx="34"/><text class="map-zone-label" x="396" y="266">리조트 내부</text><text class="map-zone-sub" x="396" y="292">오로라 통로</text>
        <path class="map-flow" d="M482 274 H552"/><rect class="map-zone primary" x="552" y="90" width="160" height="368" rx="64"/><rect class="map-detail-box dark" x="576" y="124" width="112" height="64" rx="16"/><text class="map-detail-label light" x="632" y="153">2~4F</text><text class="map-zone-sub light" x="632" y="174">스탠드</text><rect class="map-detail-box dark" x="576" y="214" width="112" height="116" rx="22"/><text class="map-detail-label light" x="632" y="265">1F 플로어</text><text class="map-zone-sub light" x="632" y="290">공연별 배치</text><text class="map-zone-sub light" x="632" y="390">아레나 로비</text>
        ${gate(520, 257, "GATE", "아레나 관객 입구")}${wc(396, 394, "리조트 공용 화장실 위치 현장 확인")}
        <g class="map-temporary"><circle cx="632" cy="510" r="23"/><text x="632" y="516">!</text></g><text class="map-small-label" x="632" y="548">층별 WC·임시 부스 확인</text>`
    },
    "gonggam-hall": {
      title: "공감센터 공감홀 층별 약도",
      note: "공식 홈페이지에 공개된 1층 관객 로비, 1·2층 객석과 3층 부대공간 관계를 표시했습니다. 화장실 세부 좌표는 현장에서 확인해야 합니다.",
      source: "https://www.gongamcenter.com/",
      sourceLabel: "공감센터 공식 시설 안내",
      svg: `<rect class="map-building" x="112" y="54" width="536" height="500" rx="24"/>
        <rect class="map-zone secondary" x="148" y="88" width="464" height="82" rx="16"/><text class="map-zone-label" x="380" y="137">3F 부대 공간</text>
        <rect class="map-zone primary" x="148" y="190" width="464" height="108" rx="18"/><text class="map-zone-label light" x="380" y="240">2F 객석 300석</text>
        <rect class="map-zone primary" x="148" y="318" width="464" height="120" rx="18"/><rect class="map-detail-box dark" x="166" y="336" width="94" height="84" rx="12"/><text class="map-detail-label light" x="213" y="382">무대</text><path class="map-detail-line light" d="M280 336 V420"/><text class="map-zone-label light" x="444" y="374">1F 객석 702석</text><text class="map-zone-sub light" x="444" y="401">고정 객석</text>
        <rect class="map-zone service" x="148" y="458" width="464" height="62" rx="16"/><text class="map-zone-label" x="380" y="497">1F 관객 로비</text>
        ${gate(345, 522, "ENTRY", "공감홀 관객 입구")}<g class="map-temporary"><circle cx="644" cy="488" r="23"/><text x="644" y="494">!</text></g><text class="map-small-label" x="684" y="494">WC 확인</text>`
    },
    "wanderloch-hall": {
      title: "YES24 원더로크홀 B3 약도",
      note: "공식 시설 설명의 엘리베이터, 인포메이션 데스크, 로비, 보관함 138개와 공연장 관계를 단순화했습니다. 무대 방향은 이해를 위한 표현이며 공연별 배치가 우선합니다.",
      source: "https://www.wanderlochhall.com/index",
      sourceLabel: "원더로크홀 공식 시설 안내",
      svg: `<rect class="map-building" x="56" y="62" width="648" height="470" rx="28"/>
        <rect class="map-zone service" x="90" y="98" width="154" height="100" rx="20"/><text class="map-zone-label" x="167" y="138">엘리베이터</text><text class="map-zone-sub" x="167" y="164">B3 도착</text>
        <rect class="map-zone secondary" x="266" y="98" width="192" height="100" rx="20"/><text class="map-zone-label" x="362" y="138">인포 데스크</text><text class="map-zone-sub" x="362" y="164">티켓·MD</text>
        <rect class="map-zone service" x="480" y="98" width="190" height="100" rx="20"/><text class="map-zone-label" x="575" y="138">물품보관함</text><text class="map-zone-sub" x="575" y="164">138개</text>
        <rect class="map-zone secondary" x="90" y="224" width="580" height="92" rx="22"/><text class="map-zone-label" x="380" y="276">200㎡ 로비·실내 대기</text>
        <rect class="map-zone primary" x="90" y="342" width="580" height="150" rx="34"/><rect class="map-detail-box dark" x="112" y="365" width="112" height="104" rx="20"/><text class="map-detail-label light" x="168" y="421">무대</text><path class="map-detail-line light" d="M244 365 V469"/><text class="map-zone-label light" x="424" y="398">1F 스탠딩 플로어</text><text class="map-zone-sub light" x="424" y="426">최대 540명</text><text class="map-zone-sub light" x="424" y="454">2F A~E열 111석</text>
        ${gate(345, 300, "HALL", "공연장 입장구")}<g class="map-temporary"><circle cx="700" cy="272" r="23"/><text x="700" y="278">!</text></g><text class="map-small-label" x="650" y="312">WC 현장 확인</text>`
    },
    "gocheok-sky-dome": {
      title: "고척스카이돔 관객 동선 약도",
      note: "공식 시설 안내를 기준으로 구일역 보행로, 외부광장, 돔 관람층과 화장실 관계를 표시했습니다. WC 아이콘은 층별 이용 지점의 개념 표시이며 정확한 좌표와 콘서트 게이트는 현장 안내가 우선입니다.",
      source: "https://www.sisul.or.kr/open_content/skydome/introduce/facility.jsp",
      sourceLabel: "고척스카이돔 공식 시설 안내",
      svg: `<rect class="map-zone service" x="34" y="250" width="128" height="74" rx="20"/><text class="map-zone-label" x="98" y="281">구일역</text><text class="map-zone-sub" x="98" y="305">보행로</text><path class="map-flow" d="M162 287 H242"/>
        <ellipse class="map-dome-ring" cx="470" cy="292" rx="250" ry="220"/><ellipse class="map-level-ring" cx="470" cy="292" rx="222" ry="194"/><ellipse class="map-dome" cx="470" cy="292" rx="176" ry="146"/>
        <text class="map-dome-title" x="470" y="272">고척스카이돔</text><text class="map-dome-subtitle" x="470" y="302">1F 플로어·공연별 무대</text><text class="map-small-label light" x="470" y="117">2F 관람석</text><text class="map-small-label light" x="470" y="480">3F 스카이박스 · 4F 관람층</text>
        ${gate(220, 270, "PLAZA", "외부 보행광장 진입")} ${wc(332, 126, "관람층 화장실 안내")}${wc(608, 126, "관람층 화장실 안내")}${wc(332, 458, "관람층 화장실 안내")}${wc(608, 458, "관람층 화장실 안내")}
        <g class="map-temporary"><circle cx="714" cy="292" r="23"/><text x="714" y="298">!</text></g><text class="map-small-label" x="682" y="336">게이트 현장 확인</text>`
    }
  };
  const map = maps[slug];
  if (!map) return "";
  return `<section class="venue-site-map" id="facility-map" aria-labelledby="facility-map-title">
      <div class="site-map-heading"><div><span class="section-kicker">VENUE SITE MAP</span><h2 id="facility-map-title">${escapeHtml(map.title)}</h2></div><span>축척 아님 · 2026-07-28 확인</span></div>
      <p class="site-map-note">${escapeHtml(map.note)}</p>
      <div class="site-map-layout">
        <ul class="site-map-legend" aria-label="약도 범례">
          <li><span class="map-key wc">WC</span><strong>화장실</strong></li>
          <li><span class="map-key gate">IN</span><strong>관객 입장·이동</strong></li>
          <li><span class="map-key parking">■</span><strong>공식 확인 시설</strong></li>
          <li><span class="map-key temporary">!</span><strong>공연별·현장 확인</strong></li>
        </ul>
        <div class="site-map-canvas">
          <svg class="venue-site-map-svg" viewBox="0 0 760 620" role="img" aria-label="${escapeHtml(map.title)}">${map.svg}</svg>
        </div>
      </div>
      <div class="site-map-actions"><a href="${sectionTarget("restroom")}">화장실 안내 보기</a><a href="${escapeHtml(map.source)}" target="_blank" rel="noopener noreferrer">${escapeHtml(map.sourceLabel)} ↗</a><a href="#venue-sources">전체 출처 보기</a></div>
    </section>`;
}

function venuePageHtml(slug, guide, siteUrl) {
  const canonical = `${siteUrl}/calendar/guides/venues/${encodeURIComponent(slug)}`;
  const sections = [
    ["transit", "지하철·버스에서 공연장까지", guide.transit],
    ["capacity", "좌석·수용 규모", guide.capacity],
    ["arrival", "입장 줄까지의 동선", guide.arrival],
    ["restroom", "화장실", guide.restroom],
    ["storage", "물품 보관", guide.storage],
    ["parking", "관객 주차", guide.parking],
    ["waiting", "스탠딩·현장 대기", guide.waiting],
    ["return", "귀가와 막차", guide.return]
  ].filter(([, , body]) => body);
  const description = guide.seoDescription || `${guide.name} 교통, 입장 동선, 화장실, 물품 보관과 귀가 정보를 공식 출처 기준으로 정리했습니다.`;
  const title = guide.seoTitle || `${guide.name} 교통·화장실·물품보관 가이드`;
  const facilityMap = venueFacilityMapMarkup(slug, sections);
  const decisionGuide = guide.firstDecision && guide.variable ? `<section class="venue-decision-guide">
      <span class="section-kicker">BEFORE YOU GO</span><h2>처음 가기 전에 먼저 정할 것</h2><p>${escapeHtml(guide.firstDecision)}</p>
      <h3>공연별로 다시 확인할 것</h3><p>${escapeHtml(guide.variable)}</p>
    </section>` : "";
  const socialImage = `${siteUrl}/calendar/assets/brand/j-live-social-card.png`;
  const articleData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${guide.name} 공연장 현장 가이드`,
    description,
    image: [`${siteUrl}/calendar/assets/brand/j-live-app-logo.png`],
    dateModified: guide.verifiedAt,
    author: { "@type": "Person", name: "여일육", url: `${siteUrl}/calendar/about` },
    publisher: { "@type": "Organization", name: "제이라이브 코리아", url: `${siteUrl}/calendar/` },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    inLanguage: "ko-KR"
  };
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "J-LIVE", item: `${siteUrl}/calendar/` },
      { "@type": "ListItem", position: 2, name: "공연장 가이드", item: `${siteUrl}/calendar/guides/venues/` },
      { "@type": "ListItem", position: 3, name: guide.name, item: canonical }
    ]
  };
  return `<!doctype html>
<html lang="ko"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="author" content="여일육"><meta name="robots" content="index,follow,max-image-preview:large">
  <meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="제이라이브 코리아">
  <meta property="og:type" content="article"><meta property="og:title" content="${escapeHtml(title)} | 제이라이브 코리아">
  <meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(socialImage)}"><meta property="og:image:alt" content="제이라이브 코리아 로고">
  <meta name="twitter:card" content="summary_large_image">
  <title>${escapeHtml(title)} | 제이라이브 코리아</title>
  <link rel="canonical" href="${escapeHtml(canonical)}"><link rel="stylesheet" href="../../styles.css?v=20260825conversion1">
  <script type="application/ld+json">${JSON.stringify(articleData)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbData)}</script>
</head><body><div class="shell info-shell">
  <header><a class="brand" href="../../"><span class="brand-mark">J</span> 제이라이브 코리아</a><a class="ghost-button" href="./">공연장 목록</a></header>
  <main class="guide-article venue-article"><span class="section-kicker">VENUE FIELD GUIDE</span><h1>${escapeHtml(guide.name)}</h1>
    <p class="guide-lead">${escapeHtml(guide.summary)}</p>
    <p class="guide-updated"><a href="../../about" rel="author">여일육 작성</a> · <a href="../verification">편집·검증 기준</a> · 마지막 시설 확인 ${escapeHtml(guide.verifiedAt)}</p>
    ${decisionGuide}
    <nav class="venue-section-nav" aria-label="이 페이지 목차">${facilityMap ? '<a href="#facility-map">시설 지도</a>' : ""}${sections.map(([, title], index) => `<a href="#venue-${index + 1}">${escapeHtml(title)}</a>`).join("")}</nav>
    ${facilityMap}
    ${sections.map(([, title, body], index) => `<section id="venue-${index + 1}"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p></section>`).join("\n    ")}
    <section id="venue-sources"><h2>출처와 확인일</h2><div class="source-links">${venueSourcesMarkup(guide)}</div><p class="guide-updated">마지막 확인: ${escapeHtml(guide.verifiedAt)} · 공연 당일 운영은 주최사 공지를 우선합니다.</p></section>
  </main><footer class="site-footer"><nav><a href="./">공연장 가이드</a><a href="../../corrections">정보 수정 요청</a></nav></footer>
</div></body></html>\n`;
}

function venueIndexHtml(venueGuides, siteUrl) {
  const guides = Object.entries(venueGuides || {});
  const canonical = `${siteUrl}/calendar/guides/venues/`;
  const title = "J-POP 내한 공연장 현장 가이드 | 제이라이브 코리아";
  const description = "J-POP 내한 주요 공연장의 교통, 입장 동선, 화장실, 물품 보관과 귀가 정보를 공연장별로 확인하세요.";
  const socialImage = `${siteUrl}/calendar/assets/brand/j-live-social-card.png`;
  const brief = (value, limit = 105) => {
    const text = String(value || "확인된 정보 없음").trim();
    return text.length > limit ? `${text.slice(0, limit).replace(/\s+\S*$/, "")}…` : text;
  };
  const comparisonRows = guides.map(([slug, guide]) => `<tr><th scope="row"><a href="./${encodeURIComponent(slug)}">${escapeHtml(guide.name)}</a></th><td>${escapeHtml(brief(guide.transit))}</td><td>${escapeHtml(brief(guide.storage))}</td><td>${escapeHtml(guide.verifiedAt)}</td></tr>`).join("");
  return `<!doctype html>
<html lang="ko"><head>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3081918168688274" crossorigin="anonymous"></script>
${fundingChoicesSnippet}
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="제이라이브 코리아">
  <meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(socialImage)}"><meta property="og:image:alt" content="제이라이브 코리아 로고">
  <meta name="twitter:card" content="summary_large_image">
  <title>${escapeHtml(title)}</title>
  <link rel="canonical" href="${escapeHtml(canonical)}"><link rel="stylesheet" href="../../styles.css?v=20260825conversion1">
</head><body><div class="shell info-shell">
  <header><a class="brand" href="../../"><span class="brand-mark">J</span> 제이라이브 코리아</a><a class="ghost-button" href="../../">공연 달력</a></header>
  <main class="guide-article venue-index"><span class="section-kicker">VENUE CATEGORY</span><h1>공연장 현장 가이드</h1>
    <p class="guide-lead">교통만 적지 않았습니다. 입장 줄, 화장실, 물품 보관, 식사와 공연 종료 뒤 귀가까지 공연장별로 확인합니다.</p>
    <section class="venue-compare-section" aria-labelledby="venueCompareTitle"><h2 id="venueCompareTitle">공연장별 접근·물품 보관 한눈에 비교</h2><p>공식 시설 안내에서 확인되는 정보만 요약했습니다. 보관함이 확인되지 않은 공연장은 공연별 임시 보관소가 열릴 수 있으므로 주최사 당일 공지를 다시 확인하세요.</p><div class="venue-table-wrap"><table class="venue-compare-table"><thead><tr><th>공연장</th><th>대중교통·접근 핵심</th><th>물품 보관 확인</th><th>확인일</th></tr></thead><tbody>${comparisonRows}</tbody></table></div></section>
    <div class="venue-card-grid">${guides.map(([slug, guide]) => `<a class="venue-card" href="./${encodeURIComponent(slug)}"><span>${escapeHtml(guide.venues.join(" · "))}</span><strong>${escapeHtml(guide.name)}</strong><p>${escapeHtml(guide.summary)}</p><em>마지막 확인 ${escapeHtml(guide.verifiedAt)}</em></a>`).join("")}</div>
  </main><footer class="site-footer"><nav><a href="../../about">소개</a><a href="../../corrections">정보 수정 요청</a></nav></footer>
</div></body></html>\n`;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function rankedCounts(values) {
  const counts = new Map();
  for (const value of values.filter(Boolean)) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts].map(([label, count]) => ({ label, count })).sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, "ko"));
}

function reportBars(items, formatter) {
  const maximum = Math.max(...items.map(item => item.count), 1);
  return `<div class="report-bars">${items.map(item => `<div class="report-bar"><div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(formatter(item.count))}</span></div><span class="report-bar-track"><i style="width:${Math.max(6, Math.round(item.count / maximum * 100))}%"></i></span></div>`).join("")}</div>`;
}

function dataReportHtml(events, siteUrl, today) {
  const year = "2026";
  const yearEvents = events.filter(event => event.status === "confirmed" && event.concertDate?.startsWith(`${year}-`));
  const seriesGroups = [...buildSeries(yearEvents, `${year}-01-01`).groups.values()];
  const series = seriesGroups.map(group => group[0]);
  const monthCounts = Array.from({ length: 12 }, (_, index) => ({ label: `${index + 1}월`, count: yearEvents.filter(event => Number(event.concertDate.slice(5, 7)) === index + 1).length }));
  const activeMonths = monthCounts.filter(item => item.count > 0);
  const venueCounts = rankedCounts(yearEvents.map(event => event.venue));
  const vendorCounts = rankedCounts(series.map(event => event.vendor));
  const artists = new Set(yearEvents.map(event => event.artist));
  const priced = seriesGroups.map(group => {
    const prices = group.filter(event => !event.priceCurrency || event.priceCurrency === "KRW").map(event => Number(event.price)).filter(price => Number.isFinite(price) && price > 0);
    return prices.length ? Math.min(...prices) : null;
  }).filter(price => price !== null);
  const highestSeats = seriesGroups.flatMap(group => group[0].seatPrices || []).map(item => Number(item.price)).filter(Number.isFinite);
  const presales = seriesGroups.filter(group => group.some(event => event.presaleDate)).length;
  const ticketed = seriesGroups.filter(group => group.some(event => event.ticketDate)).length;
  const leadDays = seriesGroups.map(group => {
    const ticketDate = group.find(event => event.ticketDate)?.ticketDate;
    if (!ticketDate) return null;
    const days = Math.round((new Date(`${group[0].concertDate}T00:00:00Z`) - new Date(`${ticketDate}T00:00:00Z`)) / 86400000);
    return days >= 0 ? days : null;
  }).filter(value => value !== null);
  const busiestMonth = [...activeMonths].sort((left, right) => right.count - left.count)[0];
  const topVenue = venueCounts[0];
  const topVendor = vendorCounts[0];
  const medianPrice = median(priced);
  const maxPrice = highestSeats.length ? Math.max(...highestSeats) : null;
  const medianLead = median(leadDays);
  const canonical = `${siteUrl}/calendar/reports/2026-jpop-live`;
  const title = "2026 J-POP 내한 공연 데이터 리포트 | 제이라이브 코리아";
  const description = `공식 출처로 확인한 2026년 일본 아티스트 내한 ${series.length}개 공연 시리즈의 월별 일정, 공연장, 예매처, 가격과 선예매 현황을 분석했습니다.`;
  const socialImage = `${siteUrl}/calendar/assets/brand/j-live-social-card.png`;
  const reportLinks = seriesGroups.slice(0, 12).map(group => `<a href="../events/${encodeURIComponent(group[0].id)}"><strong>${escapeHtml(group[0].artist)}</strong><span>${escapeHtml(group.map(event => humanDate(event.concertDate)).join(" · "))}</span></a>`).join("");
  const datasetData = {
    "@context": "https://schema.org", "@type": "Dataset", name: title, description, url: canonical,
    creator: { "@type": "Person", name: "여일육", url: `${siteUrl}/calendar/about` },
    publisher: { "@type": "Organization", name: "제이라이브 코리아", url: `${siteUrl}/calendar/` },
    dateModified: today, temporalCoverage: "2026-01-01/2026-12-31", inLanguage: "ko-KR",
    variableMeasured: ["공연 시리즈 수", "공연일 수", "아티스트 수", "월별 공연일", "공연장별 공연일", "예매처별 공연 시리즈", "티켓 가격", "선예매 공개 여부"]
  };
  const breadcrumbData = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "J-LIVE", item: `${siteUrl}/calendar/` },
    { "@type": "ListItem", position: 2, name: "데이터 리포트", item: canonical }
  ] };
  return `<!doctype html>
<html lang="ko"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}"><meta name="author" content="여일육"><meta name="robots" content="index,follow,max-image-preview:large">
  <meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="제이라이브 코리아"><meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(socialImage)}"><meta property="og:image:alt" content="제이라이브 코리아 2026 J-POP 내한 데이터 리포트"><meta name="twitter:card" content="summary_large_image">
  <title>${escapeHtml(title)}</title><link rel="canonical" href="${escapeHtml(canonical)}"><link rel="stylesheet" href="../styles.css?v=20260825conversion1">
  <script type="application/ld+json">${JSON.stringify(datasetData)}</script><script type="application/ld+json">${JSON.stringify(breadcrumbData)}</script>
</head><body><div class="shell info-shell">
  <header><a class="brand" href="../"><span class="brand-mark">J</span> 제이라이브 코리아</a><a class="ghost-button" href="../">공연 달력</a></header>
  <main class="guide-article data-report"><span class="section-kicker">J-LIVE ORIGINAL DATA</span><h1>2026 J-POP 내한<br>데이터 리포트</h1>
    <p class="guide-lead">공식 예매처·주최사·아티스트 발표를 대조해 축적한 J-LIVE 공연 기록을 직접 분석했습니다. 단순 목록이 아니라 공연이 언제 집중되고, 어떤 공연장과 예매처가 많이 쓰이며, 티켓 가격과 선예매가 어떻게 구성되는지 보여줍니다.</p>
    <p class="guide-updated"><a href="../about" rel="author">여일육 작성·분석</a> · <a href="../guides/verification">집계·검증 기준</a> · 데이터 기준일 ${escapeHtml(today)}</p>
    <section class="report-method"><h2>먼저, 숫자를 세는 기준</h2><p><strong>공연 시리즈</strong>는 같은 아티스트·공연장·예매 페이지로 열린 여러 회차를 하나로 셉니다. <strong>공연일</strong>은 실제 무대가 열리는 날짜별로 셉니다. 가격 통계에는 공식 페이지에서 원화 가격이 확인된 시리즈만 포함하며, ‘매진’이나 공연장 최대 수용 인원으로 관객 수를 추정하지 않습니다.</p></section>
    <section class="report-summary" aria-labelledby="reportSummaryTitle"><h2 id="reportSummaryTitle">한눈에 보는 2026년</h2><div class="report-stat-grid">
      <div><span>확인된 공연 시리즈</span><strong>${series.length}</strong><small>같은 투어 다회차 중복 제외</small></div><div><span>실제 공연일</span><strong>${yearEvents.length}</strong><small>날짜별 무대 횟수</small></div><div><span>참여 아티스트</span><strong>${artists.size}</strong><small>페스티벌 출연진 포함</small></div><div><span>가격 확인률</span><strong>${series.length ? Math.round(priced.length / series.length * 100) : 0}%</strong><small>${priced.length}/${series.length}개 시리즈</small></div>
    </div></section>
    <section><span class="section-kicker">WHEN</span><h2>공연은 언제 집중됐나</h2><p>${busiestMonth ? `${busiestMonth.label}이 ${busiestMonth.count}개 공연일로 가장 많았습니다.` : "확인된 공연일이 없습니다."} 월별 수치는 발표가 확인된 공연만 반영하므로 새 공연이 추가되면 달라집니다.</p>${reportBars(activeMonths, count => `${count}일`)}</section>
    <section><span class="section-kicker">WHERE</span><h2>가장 많이 쓰인 공연장</h2><p>${topVenue ? `${topVenue.label}에서 ${topVenue.count}개 공연일이 확인됐습니다.` : "확인된 공연장이 없습니다."} 다회차 공연은 실제 날짜 수만큼 반영해 현장 운영 부담과 관객 이동 수요를 함께 볼 수 있게 했습니다.</p>${reportBars(venueCounts.slice(0, 8), count => `${count}일`)}</section>
    <section><span class="section-kicker">TICKETING</span><h2>예매처와 선예매 공개 현황</h2><p>${topVendor ? `${topVendor.label}가 ${topVendor.count}개 시리즈로 가장 많이 사용됐습니다.` : "확인된 예매처가 없습니다."} 일반예매 날짜는 ${ticketed}/${series.length}개, 선예매는 ${presales}/${series.length}개 시리즈에서 공식 발표가 확인됐습니다. 선예매가 없다는 뜻이 아니라, 공개된 일정이 확인된 경우만 셌습니다.</p>${reportBars(vendorCounts, count => `${count}개 시리즈`)}</section>
    <section><span class="section-kicker">PRICE</span><h2>티켓 가격은 어느 정도였나</h2><div class="report-price-grid"><div><span>시리즈별 최저가 중앙값</span><strong>${medianPrice ? `${medianPrice.toLocaleString("ko-KR")}원` : "자료 부족"}</strong></div><div><span>확인된 최고 좌석가</span><strong>${maxPrice ? `${maxPrice.toLocaleString("ko-KR")}원` : "자료 부족"}</strong></div><div><span>일반예매→첫 공연 중앙값</span><strong>${medianLead !== null ? `${medianLead}일 전` : "자료 부족"}</strong></div></div><p>중앙값은 극단적으로 비싼 VIP석이나 저가 권종 하나에 전체 결과가 흔들리지 않도록 사용했습니다. 최고 좌석가는 특전·사운드체크가 포함된 등급일 수 있으므로 공연 간 단순 품질 비교에는 적합하지 않습니다.</p></section>
    <section><span class="section-kicker">WHAT THIS MEANS</span><h2>팬 입장에서 읽을 수 있는 것</h2><ul><li>공연이 몰리는 달에는 같은 예매처의 티켓 오픈과 공연장 귀가 수요가 겹칠 수 있어 일정 저장이 더 중요합니다.</li><li>선예매는 모든 공연의 기본 절차가 아닙니다. 팬클럽 가입 전 실제 한국 공연 공지의 대상 회원·가입 마감일을 먼저 확인해야 합니다.</li><li>표시 가격은 예매 수수료·배송비를 제외한 티켓 액면가 기준입니다. 최종 결제 금액은 예매 단계에서 다시 확인해야 합니다.</li></ul></section>
    <section><h2>분석에 사용한 공연 기록</h2><p>각 기록의 공식 출처와 마지막 확인일은 공연 상세페이지에서 볼 수 있습니다. 아래는 일부이며 전체 일정은 캘린더에 공개됩니다.</p><div class="report-source-grid">${reportLinks}</div><a class="inline-guide-link" href="../">전체 공연 캘린더 보기 →</a></section>
    <section><h2>한계와 수정 원칙</h2><p>이 리포트는 ${escapeHtml(today)}까지 J-LIVE에서 공식 출처를 확인한 자료의 스냅샷입니다. 발표 전 공연, 비공개 초청 행사, 가격이 이미지로만 제공되어 아직 검증하지 못한 권종은 빠질 수 있습니다. 공식 공지가 바뀌면 원자료와 리포트를 함께 갱신하며, 오류는 정보 수정 요청으로 접수합니다.</p><a class="inline-guide-link" href="../corrections">데이터 오류 제보하기 →</a></section>
  </main><footer class="site-footer"><nav><a href="../about">소개</a><a href="../guides/verification">검증 기준</a><a href="../corrections">정보 수정 요청</a></nav></footer>
</div></body></html>\n`;
}

function main() {
  const today = process.env.BUILD_DATE || seoulDateKey();
  const allEvents = JSON.parse(readUtf8(path.join(calendar, "data", "events.json")));
  const events = allEvents.filter(event => event.status === "confirmed");
  const aliases = JSON.parse(readUtf8(path.join(calendar, "data", "artist-aliases.json")));
  const editorial = loadEditorial(path.join(calendar, "content.js"));
  const configText = readUtf8(path.join(calendar, "site-config.js"));
  const siteUrlMatch = configText.match(/siteUrl:\s*"([^"]+)"/);
  const siteUrl = (siteUrlMatch ? siteUrlMatch[1] : "https://example.com").replace(/\/$/, "");
  const template = readUtf8(path.join(calendar, "event.html"));
  const homepageTemplate = readUtf8(path.join(calendar, "index.html"));
  const eventsDirectory = path.join(calendar, "events");
  fs.mkdirSync(eventsDirectory, { recursive: true });
  for (const filename of fs.readdirSync(eventsDirectory)) if (filename.endsWith(".html")) fs.unlinkSync(path.join(eventsDirectory, filename));

  const { primaryById, groupById } = buildSeries(events, today);
  const futurePrimaryEvents = events.filter(event => primaryById.get(event.id).id === event.id && groupById.get(event.id).some(item => item.concertDate >= today));
  for (const event of events) {
    const html = renderEventPage({ event, events: futurePrimaryEvents, group: groupById.get(event.id), primary: primaryById.get(event.id), editorial, siteUrl, template, today });
    writeUtf8(path.join(eventsDirectory, `${event.id}.html`), html);
  }

  const venueDirectory = path.join(calendar, "guides", "venues");
  fs.mkdirSync(venueDirectory, { recursive: true });
  for (const filename of fs.readdirSync(venueDirectory)) if (filename.endsWith(".html")) fs.unlinkSync(path.join(venueDirectory, filename));
  for (const [slug, guide] of Object.entries(editorial.venueGuides || {})) writeUtf8(path.join(venueDirectory, `${slug}.html`), venuePageHtml(slug, guide, siteUrl));
  writeUtf8(path.join(venueDirectory, "index.html"), venueIndexHtml(editorial.venueGuides, siteUrl));
  writeUtf8(path.join(calendar, "guides", "venues.html"), `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${siteUrl}/calendar/guides/venues/"><meta http-equiv="refresh" content="0;url=./venues/"><title>공연장 가이드로 이동</title></head><body><a href="./venues/">공연장 가이드로 이동</a></body></html>\n`);

  const reportDirectory = path.join(calendar, "reports");
  fs.mkdirSync(reportDirectory, { recursive: true });
  writeUtf8(path.join(reportDirectory, "2026-jpop-live.html"), dataReportHtml(events, siteUrl, today));

  const artistGroups = new Map();
  for (const event of events) {
    if (!artistGroups.has(event.artist)) artistGroups.set(event.artist, []);
    artistGroups.get(event.artist).push(event);
  }
  const artistDirectory = path.join(calendar, "artists");
  fs.mkdirSync(artistDirectory, { recursive: true });
  for (const filename of fs.readdirSync(artistDirectory)) if (filename.endsWith(".html")) fs.unlinkSync(path.join(artistDirectory, filename));
  for (const [artist, artistEvents] of artistGroups) {
    writeUtf8(path.join(artistDirectory, `${artistSlug(artistEvents[0])}.html`), artistPageHtml({ artist, events: artistEvents, aliases, editorial, siteUrl, today }));
  }
  writeUtf8(path.join(artistDirectory, "index.html"), artistIndexHtml({ groups: artistGroups, aliases, siteUrl, today }));

  const snapshotFile = path.join(calendar, "data", "event-snapshot.json");
  const updatesFile = path.join(calendar, "data", "updates.json");
  const previousSnapshot = fs.existsSync(snapshotFile) ? JSON.parse(readUtf8(snapshotFile)) : {};
  const previousUpdates = fs.existsSync(updatesFile) ? JSON.parse(readUtf8(updatesFile)) : [];
  const updates = buildUpdateHistory(allEvents, previousSnapshot, previousUpdates, today);
  writeUtf8(snapshotFile, `${JSON.stringify(snapshotEvents(allEvents), null, 2)}\n`);
  writeUtf8(updatesFile, `${JSON.stringify(updates, null, 2)}\n`);
  writeUtf8(path.join(calendar, "updates.html"), updatesPageHtml({ updates, siteUrl, validEventIds: new Set(events.map(event => event.id)) }));

  const weekly = weeklyPageHtml({ events, aliases, editorial, siteUrl, today });
  const weeklyDirectory = path.join(calendar, "weekly");
  fs.mkdirSync(weeklyDirectory, { recursive: true });
  for (const filename of fs.readdirSync(weeklyDirectory)) {
    if (/^\d{4}-\d{2}-\d{2}\.html$/.test(filename)) fs.unlinkSync(path.join(weeklyDirectory, filename));
  }
  writeUtf8(path.join(weeklyDirectory, `${weekly.start}.html`), weekly.html);
  writeUtf8(path.join(weeklyDirectory, "index.html"), weekly.html);

  const venuePaths = Object.entries(editorial.venueGuides || {}).map(([slug, guide]) => ({
    path: `/calendar/guides/venues/${encodeURIComponent(slug)}`,
    lastmod: guide.verifiedAt || today
  }));
  const staticPaths = ["/calendar/", "/calendar/about", "/calendar/artists/", "/calendar/fanclubs/", "/calendar/guides/venues/", "/calendar/guides/verification", "/calendar/reports/2026-jpop-live", "/calendar/stories/why-j-live"];
  const primaryEvents = futurePrimaryEvents.filter(event => hasIndexableEventContent(event, editorial));
  const homepage = homepageTemplate.replace(
    /<!-- SEO_UPCOMING_START -->[\s\S]*?<!-- SEO_UPCOMING_END -->/,
    `<!-- SEO_UPCOMING_START -->\n    ${homepageUpcomingMarkup(primaryEvents)}\n    <!-- SEO_UPCOMING_END -->`
  );
  writeUtf8(path.join(calendar, "index.html"), homepage);
  const lastmod = today;
  const urls = [
    ...staticPaths.map(url => ({ loc: `${siteUrl}${url}`, lastmod })),
    ...venuePaths.map(venue => ({ loc: `${siteUrl}${venue.path}`, lastmod: venue.lastmod })),
    ...primaryEvents.map(event => ({ loc: `${siteUrl}/calendar/events/${encodeURIComponent(event.id)}`, lastmod: event.verifiedAt || lastmod }))
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(item => `  <url><loc>${escapeHtml(item.loc)}</loc><lastmod>${item.lastmod}</lastmod></url>`).join("\n")}\n</urlset>\n`;
  writeUtf8(path.join(root, "sitemap.xml"), sitemap);
  writeUtf8(path.join(root, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /calendar/admin.html\nSitemap: ${siteUrl}/sitemap.xml\n`);
  console.log(`Generated ${events.length} pages; ${primaryEvents.length} future series are indexable for ${siteUrl}`);
}

if (require.main === module) main();
module.exports = { articleStructuredData, assertCleanText, buildSeries, dataReportHtml, hasEditorialGuide, hasIndexableEventContent, homepageUpcomingMarkup, humanDate, relatedEvents, renderEventPage, richEventGuideMarkup, seoulDateKey, seriesDatesMarkup, seriesKey, structuredData, ticketGuideMarkup, venueFacilityMapMarkup, venueGuideForEvent, venueIndexHtml, venuePageHtml };
