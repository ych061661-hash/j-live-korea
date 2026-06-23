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
  return sandbox.window.JLIVE_CONTENT || { artists: {}, venues: {}, ticketTips: {} };
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
  return group.map(item => `<li${item.id === activeId ? ' class="active"' : ""}><a href="${encodeURIComponent(item.id)}.html">${escapeHtml(humanDate(item.concertDate, item.time))}</a></li>`).join("\n");
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


function listText(items) {
  return items.filter(Boolean).join(", ");
}

function venueFacilityGuide(venue) {
  const guides = {
    "KSPO DOME": "KSPO DOME은 대형 공연장이라 객석층과 로비/콘코스 쪽 화장실 이용 동선이 분산됩니다. 입장 직후보다 공연 시작 30분 전부터 줄이 길어질 수 있으니, 도착하면 먼저 가장 가까운 화장실 위치와 퇴장 동선을 확인해 두는 편이 좋습니다. 올림픽공원역과 공원 안 공용 화장실도 입장 전 대기 시간에 활용할 수 있지만, 공연장 재입장이 제한될 수 있으니 입장 후에는 내부 안내를 우선 확인하세요.",
    "올림픽공원 올림픽홀": "올림픽홀은 올림픽공원 안에 있어 입장 전에는 공원 내 공용 화장실과 역사 주변 시설을 함께 확인할 수 있습니다. 다만 입장 후에는 재입장 가능 여부가 공연마다 다르므로, 좌석에 들어가기 전에 로비 화장실과 물품 보관 위치를 먼저 봐두는 것이 안전합니다.",
    "고척스카이돔": "고척스카이돔은 야구장형 대형 venue라 내부 층별 화장실과 매점이 여러 구역에 나뉘어 있습니다. 공연 시작 직전과 종료 직후에는 같은 층 화장실 줄이 길어질 수 있으니, 좌석 구역과 가까운 화장실뿐 아니라 한 구역 옆 동선도 미리 확인해 두면 좋습니다.",
    "YES24 LIVE HALL": "YES24 LIVE HALL은 스탠딩 공연이 많아 입장 대기 중 화장실과 물품 보관 동선이 특히 중요합니다. 번호별 대기 시작 전 건물 내 화장실 위치를 확인하고, 입장 직전에는 줄을 이탈하기 어려울 수 있으니 여유 있게 다녀오는 것을 권합니다.",
    "YES24 원더로크홀": "YES24 원더로크홀은 홍대권 공연장 특성상 입장 전 주변 유동 인구가 많습니다. 공연장 내부 화장실 위치와 대기 줄 위치가 가까운지 먼저 확인하고, 스탠딩 공연이라면 입장 시작 전에 화장실을 다녀오는 것이 좋습니다.",
    "KT&G 상상마당 라이브홀": "KT&G 상상마당 라이브홀은 홍대 건물형 공연장이라 층 이동과 대기 동선 확인이 중요합니다. 공연장 층의 화장실 위치, 물품 보관 가능 여부, 입장 줄 위치를 함께 확인해 두면 입장 직전에 움직이는 일을 줄일 수 있습니다.",
    "무신사 개러지": "무신사 개러지는 홍대권 스탠딩 공연이 많은 venue입니다. 입장 번호 대기 중 줄을 오래 비우기 어려울 수 있으니, 도착 직후 화장실과 물품 보관 위치를 먼저 확인하고 대기하는 편이 좋습니다.",
    "장충체육관": "장충체육관은 실내 체육관형 venue라 객석층과 로비 쪽 화장실 동선이 나뉩니다. 공연 종료 후 지하철역 방향으로 인파가 몰릴 수 있으니, 앙코르 전후 이동 계획과 가까운 출구를 함께 확인하세요.",
    "인스파이어 아레나": "인스파이어 아레나는 공연장과 복합 리조트 동선이 연결되는 venue입니다. 화장실과 매점은 내부 안내 표지판을 따라 확인하는 것이 가장 정확하고, 서울 복귀 교통 시간이 길 수 있으니 공연 전 물과 화장실을 미리 챙기는 편이 좋습니다.",
    "킨텍스 제2전시장 10홀": "킨텍스 전시장 공연은 홀 입구, 로비, 전시장 공용 화장실 동선 확인이 중요합니다. 전시장 규모가 커서 같은 건물 안에서도 이동 시간이 길 수 있으니, 입장 게이트와 가까운 화장실을 먼저 체크하세요.",
    "킨텍스 제2전시장 9홀": "킨텍스 제2전시장 공연은 로비와 홀 주변 공용 화장실을 함께 확인하는 것이 좋습니다. 공연 종료 후 셔틀, 버스, 지하철 연계 이동이 몰릴 수 있어 퇴장 전 화장실 이용 시간을 조금 앞당기는 편이 안전합니다.",
    "킨텍스 제2전시장 후면광장": "야외 또는 광장형 공연은 임시 화장실, 전시장 내부 화장실, 운영 구역 제한이 공연마다 달라질 수 있습니다. 현장 안내판과 주최 측 공지를 우선 확인하고, 비나 더위에 대비해 물과 대기 시간을 함께 고려하세요."
  };
  return guides[venue] || venue + " 방문 전에는 공식 공연장 안내도에서 화장실, 물품 보관, 입장 게이트 위치를 먼저 확인하세요. 공연 시작 직전과 종료 직후에는 화장실 줄이 길어질 수 있으니 도착 직후 한 번, 입장 직전 한 번 동선을 확인해 두면 편합니다.";
}

function richEventGuideMarkup(event, group) {
  const songs = (event.songs || []).map(song => song[0]).filter(Boolean).slice(0, 3);
  const dateList = group.map(item => humanDate(item.concertDate, item.time)).join(" / ");
  const multiDayNote = group.length > 1
    ? "이번 내한은 " + group.length + "회차로 잡혀 있어 날짜별 시작 시간과 예매 조건을 따로 확인해야 합니다."
    : "현재 확인된 한국 공연은 1회차 중심이라 일반 예매 이후 잔여석 변동을 자주 확인하는 편이 좋습니다.";
  const songLine = songs.length
    ? "공연 전에는 " + listText(songs) + " 순서로 먼저 들어보면 " + event.artist + "의 대표적인 보컬 톤, 편곡 스타일, 라이브 에너지를 빠르게 파악할 수 있습니다."
    : event.artist + "의 공식 채널과 최근 라이브 영상을 먼저 확인하면 공연 분위기와 관객 반응을 예상하기 쉽습니다.";
  const facilityGuide = venueFacilityGuide(event.venue);

  const paragraphs = [
    event.artist + " 내한 공연은 " + dateList + " " + event.venue + "에서 열리는 일정으로 정리되어 있습니다. " + multiDayNote + " 이 페이지는 공연 날짜, 예매처, 공연장, 대표곡, 공식 출처를 한곳에서 확인하도록 만든 준비용 안내입니다.",
    "처음 가는 관객이라면 공연 당일 아침에 예매처 공지, 주최 측 안내, 공연장 입장 공지를 다시 확인하는 것이 좋습니다. 스탠딩 번호 대기, 모바일 티켓 확인, 신분증 확인, 팬클럽 선예매 조건은 공연마다 달라질 수 있어 캡처본보다 공식 페이지를 우선해야 합니다.",
    "예매 준비는 판매 시작 전부터 해두는 편이 안전합니다. " + (event.vendor || "공식 예매처") + " 로그인 상태, 본인 인증, 결제 수단, 팝업 차단 여부를 미리 확인하고 한 브라우저에서 안정적으로 진행하세요. 선예매 정보가 없다면 일반 예매를 기준으로 보고, SNS에 올라온 비공식 좌석표나 재판매 글은 주의하는 것이 좋습니다.",
    songLine,
    facilityGuide,
    "예매 후에는 공식 출처 링크와 마지막 검증일을 함께 저장해 두세요. 공연 시간이 바뀌거나, 입장 게이트와 물품 보관 방식이 변경되는 경우는 보통 예매처 또는 아티스트 공식 공지에 먼저 올라옵니다. J-LIVE는 이런 변경을 추적하기 쉽도록 각 상세페이지에 출처와 검증 기록을 계속 남깁니다."
  ];

  return `<section class="editorial-section deep-guide">
              <div class="section-kicker">J-LIVE ORIGINAL GUIDE</div>
              <h2>${escapeHtml(event.artist)} 내한 준비 가이드</h2>
              ${paragraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join("\n              ")}
            </section>`;
}

function structuredData(event, group, canonical, siteUrl) {
  const offer = event.vendorUrl ? {
    "@type": "Offer",
    url: event.vendorUrl,
    availability: "https://schema.org/InStock",
    validFrom: isoDateTime(event.ticketDate, event.ticketTime) || isoDateTime(event.concertDate, event.time),
    priceCurrency: event.priceCurrency || "KRW",
    price: event.price || 0
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
  const canonical = `${siteUrl}/calendar/events/${encodeURIComponent(primary.id)}.html`;
  const indexable = event.id === primary.id && group.some(item => item.concertDate >= today);
  const years = [...new Set(group.map(item => item.concertDate.slice(0, 4)))].join("·");
  const title = `${event.artist} 내한 ${years} 일정·예매·공연장 정보 | 제이라이브 코리아`;
  const dates = group.map(item => humanDate(item.concertDate, item.time)).join(", ");
  const description = `${event.artist} 내한 공연은 ${dates} ${event.venue}에서 열립니다. 예매 일정, 교통, 대표곡과 공식 출처를 확인하세요.`;
  const artistIntro = editorial.artists[event.artist] || `${event.artist}의 한국 공연입니다. 공식 발표와 예매처 정보를 기준으로 일정을 정리했습니다.`;
  const venueGuide = editorial.venues[event.venue] || `${event.venue} 방문 전 공식 공연장 안내에서 대중교통, 주차와 입장 게이트를 확인하세요.`;
  const ticketTip = editorial.ticketTips[event.vendor] || "공식 예매처 로그인과 본인인증, 결제수단을 미리 점검하고 예매 제한 매수를 확인하세요.";
  const songs = (event.songs || []).map(song => song[0]).filter(Boolean);
  const songGuide = songs.length ? `${songs.join(", ")} 순서로 들어보면 ${event.artist}의 음악 색깔을 빠르게 파악할 수 있습니다. 각 곡은 공식 YouTube 영상으로 연결됩니다.` : `${event.artist}의 공식 YouTube 채널에서 최근 대표곡과 라이브 영상을 확인하세요.`;
  const seriesSummary = group.length > 1 ? `이번 내한은 ${group.length}회 공연으로 진행됩니다. 날짜별 공연 시각과 예매 조건이 달라질 수 있으므로 선택한 회차를 확인하세요.` : "현재 공식 확인된 한국 공연은 1회입니다. 추가 회차나 운영 변경은 연결된 공식 출처에서 다시 확인합니다.";
  const robots = indexable ? "index,follow,max-image-preview:large" : "noindex,follow";

  return template
    .replace("<title>공연 상세 | 제이라이브 코리아</title>", `<title>${escapeHtml(title)}</title>`)
    .replace('content="J-POP 내한 공연 일정, 예매 정보, 공연장 교통과 대표곡을 확인하세요."', `content="${escapeHtml(description)}"`)
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
    .replace('<p id="venueGuide"></p>', `<p id="venueGuide">${escapeHtml(venueGuide)}</p>`)
    .replace('<p id="ticketTip"></p>', `<p id="ticketTip">${escapeHtml(ticketTip)}</p>`)
    .replace('<ul class="check-list" id="dayChecklist"></ul>', `<ul class="check-list" id="dayChecklist">${checklistMarkup(event)}</ul>`)
    .replace('<p id="songGuide"></p>', `<p id="songGuide">${escapeHtml(songGuide)}</p>`)
    .replace('<div class="song-list" id="eventSongs"></div>', `<div class="song-list" id="eventSongs">${songsMarkup(event)}</div>`)
    .replace(/<section class="editorial-section">\s*<div class="section-kicker">SOURCES<\/div>/, `${richEventGuideMarkup(event, group)}\n            <section class="editorial-section">\n              <div class="section-kicker">SOURCES</div>`)
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

  const staticPaths = ["/calendar/index.html", "/calendar/about.html", "/calendar/contact.html", "/calendar/privacy.html", "/calendar/terms.html", "/calendar/corrections.html", "/calendar/guides/ticketing.html", "/calendar/guides/venues.html", "/calendar/guides/verification.html", "/calendar/guides/yes24-ticketing.html", "/calendar/guides/melon-ticketing.html", "/calendar/guides/standing-concert.html", "/calendar/guides/olympic-park.html", "/calendar/guides/first-jpop-concert.html", "/calendar/guides/venue-facilities.html"];
  const primaryEvents = events.filter(event => primaryById.get(event.id).id === event.id && groupById.get(event.id).some(item => item.concertDate >= today));
  const lastmod = today;
  const urls = [...staticPaths.map(url => ({ loc: `${siteUrl}${url}`, lastmod })), ...primaryEvents.map(event => ({ loc: `${siteUrl}/calendar/events/${encodeURIComponent(event.id)}.html`, lastmod: event.verifiedAt || lastmod }))];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(item => `  <url><loc>${escapeHtml(item.loc)}</loc><lastmod>${item.lastmod}</lastmod></url>`).join("\n")}\n</urlset>\n`;
  writeUtf8(path.join(root, "sitemap.xml"), sitemap);
  writeUtf8(path.join(root, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /calendar/admin.html\nSitemap: ${siteUrl}/sitemap.xml\n`);
  console.log(`Generated ${events.length} pages; ${primaryEvents.length} future series are indexable for ${siteUrl}`);
}

if (require.main === module) main();
module.exports = { assertCleanText, buildSeries, humanDate, renderEventPage, seriesKey };
