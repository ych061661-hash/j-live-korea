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
  return fileName && fs.existsSync(path.join(calendar, "assets", "artists", `${fileName}.jpg`))
    ? `${siteUrl}/calendar/assets/artists/${fileName}.jpg`
    : `${siteUrl}/calendar/assets/brand/j-live-app-logo.png`;
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
    .replace('<p id="artistIntro"></p>', `<p id="artistIntro">${escapeHtml(artistIntro)}</p><a class="artist-profile-link" href="../artists/${encodeURIComponent(artistSlug(event))}">${escapeHtml(event.artist)} 아티스트 페이지 →</a>`)
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
  return `<!doctype html>
<html lang="ko"><head>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3081918168688274" crossorigin="anonymous"></script>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)} | 제이라이브 코리아</title>
  <link rel="canonical" href="${escapeHtml(canonical)}"><link rel="stylesheet" href="../../styles.css?v=20260728g">
</head><body><div class="shell info-shell">
  <header><a class="brand" href="../../"><span class="brand-mark">J</span> 제이라이브 코리아</a><a class="ghost-button" href="../venues">공연장 목록</a></header>
  <main class="guide-article venue-article"><span class="section-kicker">VENUE FIELD GUIDE</span><h1>${escapeHtml(guide.name)}</h1>
    <p class="guide-lead">${escapeHtml(guide.summary)}</p>
    <nav class="venue-section-nav" aria-label="이 페이지 목차">${facilityMap ? '<a href="#facility-map">시설 지도</a>' : ""}${sections.map(([, title], index) => `<a href="#venue-${index + 1}">${escapeHtml(title)}</a>`).join("")}</nav>
    ${facilityMap}
    ${sections.map(([, title, body], index) => `<section id="venue-${index + 1}"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p></section>`).join("\n    ")}
    <section id="venue-sources"><h2>출처와 확인일</h2><div class="source-links">${venueSourcesMarkup(guide)}</div><p class="guide-updated">마지막 확인: ${escapeHtml(guide.verifiedAt)} · 공연 당일 운영은 주최사 공지를 우선합니다.</p></section>
  </main><footer class="site-footer"><nav><a href="../venues">공연장 가이드</a><a href="../../corrections">정보 수정 요청</a></nav></footer>
</div></body></html>\n`;
}

function venueIndexHtml(venueGuides, siteUrl) {
  const guides = Object.entries(venueGuides || {});
  return `<!doctype html>
<html lang="ko"><head>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3081918168688274" crossorigin="anonymous"></script>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="J-POP 내한 주요 공연장의 교통, 입장 동선, 화장실, 물품 보관과 귀가 정보를 공연장별로 확인하세요.">
  <title>J-POP 내한 공연장 현장 가이드 | 제이라이브 코리아</title>
  <link rel="canonical" href="${escapeHtml(siteUrl)}/calendar/guides/venues"><link rel="stylesheet" href="../styles.css?v=20260728g">
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
  const allEvents = JSON.parse(readUtf8(path.join(calendar, "data", "events.json")));
  const events = allEvents.filter(event => event.status === "confirmed");
  const aliases = JSON.parse(readUtf8(path.join(calendar, "data", "artist-aliases.json")));
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
  writeUtf8(path.join(calendar, "updates.html"), updatesPageHtml({ updates, siteUrl }));

  const weekly = weeklyPageHtml({ events, aliases, editorial, siteUrl, today });
  const weeklyDirectory = path.join(calendar, "weekly");
  fs.mkdirSync(weeklyDirectory, { recursive: true });
  writeUtf8(path.join(weeklyDirectory, `${weekly.start}.html`), weekly.html);
  writeUtf8(path.join(weeklyDirectory, "index.html"), weekly.html);

  const venuePaths = Object.keys(editorial.venueGuides || {}).map(slug => `/calendar/guides/venues/${encodeURIComponent(slug)}`);
  const artistPaths = [...artistGroups.values()].map(artistEvents => `/calendar/artists/${encodeURIComponent(artistSlug(artistEvents[0]))}`);
  const staticPaths = ["/calendar/", "/calendar/about", "/calendar/artists", ...artistPaths, "/calendar/updates", `/calendar/weekly/${weekly.start}`, "/calendar/guides/venues", ...venuePaths, "/calendar/guides/verification", "/calendar/guides/standing-concert"];
  const primaryEvents = events.filter(event => primaryById.get(event.id).id === event.id && groupById.get(event.id).some(item => item.concertDate >= today) && hasEditorialGuide(event, editorial));
  const lastmod = today;
  const urls = [...staticPaths.map(url => ({ loc: `${siteUrl}${url}`, lastmod })), ...primaryEvents.map(event => ({ loc: `${siteUrl}/calendar/events/${encodeURIComponent(event.id)}`, lastmod: event.verifiedAt || lastmod }))];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(item => `  <url><loc>${escapeHtml(item.loc)}</loc><lastmod>${item.lastmod}</lastmod></url>`).join("\n")}\n</urlset>\n`;
  writeUtf8(path.join(root, "sitemap.xml"), sitemap);
  writeUtf8(path.join(root, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /calendar/admin.html\nSitemap: ${siteUrl}/sitemap.xml\n`);
  console.log(`Generated ${events.length} pages; ${primaryEvents.length} future series are indexable for ${siteUrl}`);
}

if (require.main === module) main();
module.exports = { assertCleanText, buildSeries, hasEditorialGuide, humanDate, renderEventPage, richEventGuideMarkup, seriesDatesMarkup, seriesKey, ticketGuideMarkup, venueFacilityMapMarkup, venueGuideForEvent, venueIndexHtml, venuePageHtml };
