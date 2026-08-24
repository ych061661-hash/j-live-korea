"use strict";

const fs = require("fs");
const path = require("path");
const { festflowFestivalsFor } = require("./festflow-links");

const artistAssets = path.resolve(__dirname, "../calendar/assets/artists");

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
})[character]);

const artistSlug = event => String(event.id).replace(/-\d{4}-\d{2}-\d{2}$/, "");
const parseDate = value => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};
const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const humanDate = (value, time = "") => {
  if (!value) return "미정";
  const date = parseDate(value);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일(${weekday})${time ? ` ${time}` : ""}`;
};

function pageShell({ title, description, canonical, body, siteUrl, depth = "..", robots = "index,follow,max-image-preview:large", includeAds = true, image = "" }) {
  const socialImage = image || `${siteUrl}/calendar/assets/brand/j-live-social-card.png`;
  return `<!doctype html>
<html lang="ko"><head>
${includeAds ? '  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3081918168688274" crossorigin="anonymous"></script>\n' : ""}  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="${escapeHtml(robots)}">
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:type" content="website">
  <meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="제이라이브 코리아">
  <meta property="og:image" content="${escapeHtml(socialImage)}"><meta property="og:image:alt" content="제이라이브 코리아 페이지 미리보기">
  <meta name="twitter:card" content="summary_large_image">
  <title>${escapeHtml(title)}</title><link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="stylesheet" href="${depth}/styles.css?v=20260825conversion1">
  <script src="${depth}/site-config.js?v=20260729ga"></script><script src="${depth}/analytics.js" defer></script><script src="${depth}/site.js?v=20260825conversion1" defer></script>
</head><body><div class="shell info-shell">
  <header><a class="brand" href="${depth}/"><span class="brand-mark">J</span> 제이라이브 코리아</a><nav class="page-nav"><a href="${depth}/weekly/">이번 주</a><a href="${depth}/updates">업데이트</a><a href="${depth}/artists/">아티스트</a></nav></header>
  ${body}
  <footer class="site-footer"><nav><a href="${depth}/about">소개</a><a href="${depth}/privacy">개인정보처리방침</a><a href="${depth}/corrections">정보 수정 요청</a></nav><p>${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))} · 공식 출처 기준 J-POP 내한 정보</p></footer>
</div></body></html>\n`;
}

function languageNames(artist, aliases = []) {
  const names = [artist, ...aliases];
  return {
    korean: names.find(name => /[가-힣]/.test(name)) || artist,
    english: names.find(name => /[A-Za-z]/.test(name)) || artist,
    japanese: names.find(name => /[\u3040-\u30ff\u3400-\u9fff]/.test(name)) || artist
  };
}

function imageUrl(event, siteUrl) {
  if (event.youtubeProfileImage && /^https?:\/\//i.test(event.youtubeProfileImage)) return event.youtubeProfileImage;
  if (event.youtubeProfileImage) return `${siteUrl}/calendar/${String(event.youtubeProfileImage).replace(/^\.\//, "")}`;
  const channel = String(event.youtubeChannel || "").replace(/^@/, "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return channel && fs.existsSync(path.join(artistAssets, `${channel}.jpg`))
    ? `${siteUrl}/calendar/assets/artists/${channel}.jpg`
    : `${siteUrl}/calendar/assets/brand/j-live-app-logo.png`;
}

function hasArtistImage(event) {
  if (event.youtubeProfileImage) return true;
  const channel = String(event.youtubeChannel || "").replace(/^@/, "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return Boolean(channel && fs.existsSync(path.join(artistAssets, `${channel}.jpg`)));
}

function artistPageHtml({ artist, events, aliases, editorial, siteUrl, today }) {
  const sorted = [...events].sort((a, b) => a.concertDate.localeCompare(b.concertDate));
  const latest = [...sorted].reverse().find(event => event.songs?.length) || sorted[sorted.length - 1];
  const slug = artistSlug(sorted[0]);
  const upcoming = sorted.filter(event => event.concertDate >= today);
  const past = sorted.filter(event => event.concertDate < today).reverse();
  const names = languageNames(artist, aliases[artist]);
  const songs = (latest.songs || []).slice(0, 3);
  const venues = [...new Set(sorted.map(event => event.venue))];
  const festflowFestivals = festflowFestivalsFor(artist);
  const vendors = [...new Map(sorted.filter(event => event.vendorUrl).map(event => [event.vendor, event.vendorUrl])).entries()];
  const intro = editorial.artists?.[artist] || `${artist}의 한국 내한 공연과 예매 기록을 공식 출처 기준으로 정리합니다.`;
  const eventRows = list => list.length ? list.map(event => `<li><a href="../events/${encodeURIComponent(event.id)}"><strong>${escapeHtml(humanDate(event.concertDate, event.time))}</strong><span>${escapeHtml(event.venue)} · ${escapeHtml(event.vendor || "예매처 미정")}</span></a></li>`).join("") : "<li class=\"empty-row\">확인된 일정이 없습니다.</li>";
  const historyGroups = new Map();
  for (const event of past) {
    const key = `${event.venue}\u0000${event.vendorUrl || event.vendor || event.id}`;
    if (!historyGroups.has(key)) historyGroups.set(key, []);
    historyGroups.get(key).push(event);
  }
  const historyRows = [...historyGroups.values()].map(group => {
    group.sort((a, b) => a.concertDate.localeCompare(b.concertDate));
    const first = group[0];
    const last = group[group.length - 1];
    const attendance = group.find(event => Number.isFinite(event.attendance) && event.attendance > 0);
    const dates = first.concertDate === last.concertDate
      ? humanDate(first.concertDate, first.time)
      : `${humanDate(first.concertDate)} ~ ${humanDate(last.concertDate)}`;
    return `<li><a class="artist-history-main" href="../events/${encodeURIComponent(first.id)}"><time>${escapeHtml(dates)}</time><strong>${escapeHtml(first.venue)}</strong><span>${group.length}회 공연</span></a><div class="artist-history-audience"><small>공식 관객 수</small><b>${attendance ? `${Number(attendance.attendance).toLocaleString("ko-KR")}명` : "미공개"}</b>${attendance?.attendanceScope ? `<span>${escapeHtml(attendance.attendanceScope)}</span>` : ""}${attendance?.attendanceSource ? `<a href="${escapeHtml(attendance.attendanceSource)}" target="_blank" rel="noopener noreferrer">공식 발표 확인 ↗</a>` : ""}</div></li>`;
  }).join("") || '<li class="empty-row">공식 확인된 지난 내한 기록이 없습니다.</li>';
  const nextEvent = upcoming[0];
  const body = `<main class="artist-profile">
    <section class="artist-profile-hero"><img src="${escapeHtml(imageUrl(latest, siteUrl))}" alt="${escapeHtml(hasArtistImage(latest) ? `${artist} 공식 프로필` : "J-LIVE 기본 아티스트 이미지")}" width="800" height="800" loading="eager" decoding="async"><div><span class="section-kicker">ARTIST PROFILE</span><h1>${escapeHtml(artist)}</h1><p>${escapeHtml(intro)}</p></div></section>
    <section class="artist-name-grid" aria-label="아티스트 이름 표기"><div><small>한국어</small><strong>${escapeHtml(names.korean)}</strong></div><div><small>English</small><strong>${escapeHtml(names.english)}</strong></div><div><small>日本語</small><strong>${escapeHtml(names.japanese)}</strong></div></section>
    <div class="artist-profile-grid">
      <section><span class="section-kicker">NEXT CONCERT</span><h2>다음 한국 공연</h2><ul class="artist-event-list">${eventRows(nextEvent ? [nextEvent] : [])}</ul></section>
      <section class="artist-history"><span class="section-kicker">KOREA HISTORY</span><h2>공식 확인 내한 이력</h2><ol class="artist-history-list">${historyRows}</ol><p class="artist-history-note">J-LIVE가 공식 출처로 확인한 기록만 표시하며, 관객 수는 발표된 경우에만 제공합니다.</p></section>
    </div>
    <section class="artist-songs"><span class="section-kicker">START WITH 3 SONGS</span><h2>대표곡 3개</h2><div class="song-list">${songs.map(song => `<a class="song" href="${escapeHtml(song[2])}" target="_blank" rel="noopener noreferrer"><span class="play">▶</span><span>${escapeHtml(song[0])}</span><em>공식 YouTube</em></a>`).join("")}</div></section>
    <section class="artist-related"><div><h2>관련 공연장</h2><p>${venues.map(escapeHtml).join(" · ")}</p></div><div><h2>예매처</h2><p>${vendors.length ? vendors.map(([name, url]) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" data-track-vendor="${escapeHtml(name)}">${escapeHtml(name)} ↗</a>`).join(" · ") : "확인된 예매처가 없습니다."}</p></div></section>${festflowFestivals.length ? `<section class="artist-festivals"><h2>페스티벌 출연</h2><p>${escapeHtml(artist)}의 일본 페스티벌 출연 라인업은 <a href="https://festflow.kr" target="_blank" rel="noopener noreferrer">페스플로우</a>에서 확인할 수 있습니다.</p><p>${festflowFestivals.map(f => `<a href="https://festflow.kr/festivals/${encodeURIComponent(f.slug)}" target="_blank" rel="noopener noreferrer">${escapeHtml(f.name)} ↗</a>`).join(" · ")}</p></section>` : ""}
  </main>`;
  return pageShell({
    title: `${artist} 내한 공연·대표곡·지난 기록 | 제이라이브 코리아`,
    description: `${artist}의 예정된 한국 공연, 지난 내한 기록, 대표곡 3개와 관련 공연장·예매처를 확인하세요.`,
    canonical: `${siteUrl}/calendar/artists/${encodeURIComponent(slug)}`,
    body, siteUrl,
    robots: "noindex,follow",
    includeAds: false,
    image: imageUrl(latest, siteUrl)
  });
}

function artistIndexHtml({ groups, aliases, siteUrl, today }) {
  const entries = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  const confirmedDates = entries.flatMap(([, events]) => events);
  const upcomingArtists = entries.filter(([, events]) => events.some(event => event.concertDate >= today)).length;
  const pastDates = confirmedDates.filter(event => event.concertDate < today).length;
  const cards = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([artist, events]) => {
    const sorted = [...events].sort((a, b) => a.concertDate.localeCompare(b.concertDate));
    const next = sorted.find(event => event.concertDate >= today);
    const names = languageNames(artist, aliases[artist]);
    return `<a class="artist-index-card" href="./${encodeURIComponent(artistSlug(sorted[0]))}"><span>${escapeHtml(names.korean)}</span><strong>${escapeHtml(artist)}</strong><small>${next ? `다음 공연 ${escapeHtml(humanDate(next.concertDate))}` : `지난 공연일 ${sorted.length}일 기록`}</small></a>`;
  }).join("");
  const body = `<main class="directory-page artist-directory-page">
    <section class="artist-directory-hero"><div><span class="section-kicker">ARTIST DIRECTORY</span><h1>내한 아티스트</h1><p class="guide-lead">한국어로 검색할 때와 공식 영문·일문 표기가 다르더라도 같은 아티스트를 찾을 수 있도록 이름과 한국 공연 기록을 연결했습니다. 공식 발표가 확인된 공연만 집계하며, 발표 전 소문이나 출처가 충돌하는 일정은 목록에 넣지 않습니다.</p><p class="guide-updated"><a href="../about" rel="author">여일육 편집</a> · 데이터 기준일 ${escapeHtml(today)}</p></div><div class="artist-directory-stats" aria-label="아티스트 디렉터리 요약"><div><span>확인된 아티스트</span><strong>${entries.length}</strong><small>공식 공연 기록 기준</small></div><div><span>예정 공연 보유</span><strong>${upcomingArtists}</strong><small>${escapeHtml(today)} 이후</small></div><div><span>지난 공연일 기록</span><strong>${pastDates}</strong><small>날짜별 공연 수</small></div></div></section>
    <section class="artist-directory-guide"><span class="section-kicker">HOW TO READ</span><h2>목록을 읽는 방법</h2><div class="artist-directory-guide-grid"><article><strong>한글명과 공식 표기</strong><p>카드 위쪽에는 국내에서 주로 쓰는 한글명을, 가운데에는 아티스트가 사용하는 공식 영문·일문 표기를 표시합니다. 캘린더 검색에서는 등록된 별칭도 함께 비교합니다.</p></article><article><strong>다음 공연 날짜</strong><p>오늘 이후 공식 확인된 한국 공연이 있으면 가장 가까운 날짜를 보여줍니다. 이틀 이상 이어지는 공연은 첫 공연일을 표시하고 상세페이지에서 전체 회차를 확인할 수 있습니다.</p></article><article><strong>지난 공연일 기록</strong><p>표시 숫자는 별도 내한 횟수가 아니라 J-LIVE에 확인된 실제 공연 날짜 수입니다. 같은 투어의 이틀 공연도 공연일 2일로 세며, 기록이 추가되면 수치가 바뀔 수 있습니다.</p></article></div></section>
    <section class="artist-directory-list"><div class="artist-directory-heading"><div><span class="section-kicker">CONFIRMED ARTISTS</span><h2>공식 확인 아티스트 목록</h2></div><p>카드를 선택하면 대표곡 3곡, 다음 한국 공연, 공식 확인된 지난 공연일과 예매처를 볼 수 있습니다.</p></div><div class="artist-index-grid">${cards}</div></section>
    <section class="artist-directory-policy"><span class="section-kicker">EDITORIAL STANDARD</span><h2>누구를 목록에 포함하나요</h2><p>한국에서 열리는 공연이 공식 예매처, 주최사 또는 아티스트 공식 채널에서 확인된 일본 아티스트를 다룹니다. 록·팝뿐 아니라 일본 재즈, 애니메이션 음악 연주 프로젝트와 한국 페스티벌 출연도 공식 공연 기록이 있으면 포함할 수 있습니다. 국적이나 장르만으로 자동 등록하지 않으며, 날짜·공연장·예매처가 서로 충돌하거나 아직 발표되지 않은 정보는 확정 목록에서 제외합니다.</p><div class="artist-directory-links"><a href="../guides/verification">검증 기준 자세히 보기 →</a><a href="../reports/2026-jpop-live">2026 내한 데이터 리포트 →</a><a href="../corrections">누락·오류 제보하기 →</a></div></section>
  </main>`;
  return pageShell({
    title: "J-POP 내한 아티스트 목록 | 제이라이브 코리아",
    description: "한국에서 공연하는 일본 아티스트의 예정 공연, 지난 내한 기록과 대표곡을 확인하세요.",
    canonical: `${siteUrl}/calendar/artists/`,
    body,
    siteUrl,
    includeAds: false
  });
}

function mondayFor(today) {
  const date = parseDate(today);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date;
}

function weeklyPageHtml({ events, aliases, editorial, siteUrl, today }) {
  const monday = mondayFor(today);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const start = dateKey(monday);
  const end = dateKey(sunday);
  const concerts = events.filter(event => event.concertDate >= start && event.concertDate <= end);
  const ticketItems = [];
  const seen = new Set();
  for (const event of events) {
    for (const [type, date, time] of [["선예매", event.presaleDate, event.presaleTime], [event.ticketLabel || "일반예매", event.ticketDate, event.ticketTime]]) {
      const key = `${type}|${event.artist}|${date}|${time || ""}`;
      if (!date || date < start || date > end || seen.has(key)) continue;
      seen.add(key);
      ticketItems.push({ event, type, date, time });
    }
  }
  ticketItems.sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));
  const eventCard = event => {
    const slug = artistSlug(event);
    return `<article class="weekly-card"><div><span class="section-kicker">${escapeHtml(humanDate(event.concertDate, event.time))}</span><h3><a href="../artists/${encodeURIComponent(slug)}">${escapeHtml(event.artist)}</a></h3><p>${escapeHtml(event.venue)} · ${escapeHtml(event.vendor || "예매처 미정")}</p></div><div class="weekly-songs">${(event.songs || []).slice(0, 3).map(song => `<a href="${escapeHtml(song[2])}" target="_blank" rel="noopener noreferrer">▶ ${escapeHtml(song[0])}</a>`).join("")}</div><div class="weekly-actions"><a href="../events/${encodeURIComponent(event.id)}">공연 정보</a>${event.vendorUrl ? `<a href="${escapeHtml(event.vendorUrl)}" target="_blank" rel="noopener noreferrer" data-track-vendor="${escapeHtml(event.vendor || "미정")}">예매처 ↗</a>` : ""}</div></article>`;
  };
  const body = `<main class="weekly-page"><span class="section-kicker">WEEKLY J-POP</span><h1>${monday.getMonth() + 1}월 ${monday.getDate()}일–${sunday.getMonth() + 1}월 ${sunday.getDate()}일</h1><p class="guide-lead">이번 주 한국에서 열리는 J-POP 공연과 티켓팅 일정을 한곳에 정리했습니다.</p><button class="share-page-button" type="button" data-share-page>이번 주 일정 공유</button>
    <section><h2>이번 주 공연</h2><div class="weekly-grid">${concerts.length ? concerts.map(eventCard).join("") : '<p class="empty-row">이번 주 확인된 공연이 없습니다.</p>'}</div></section>
    <section><h2>이번 주 티켓팅</h2><div class="weekly-ticket-list">${ticketItems.length ? ticketItems.map(item => `<article><time>${escapeHtml(humanDate(item.date, item.time))}</time><strong>${escapeHtml(item.event.artist)} · ${escapeHtml(item.type)}</strong><span>${escapeHtml(item.event.venue)}</span>${item.event.vendorUrl ? `<a href="${escapeHtml(item.event.vendorUrl)}" target="_blank" rel="noopener noreferrer" data-track-vendor="${escapeHtml(item.event.vendor || "미정")}">예매처 확인 ↗</a>` : ""}</article>`).join("") : '<p class="empty-row">이번 주 확인된 티켓팅이 없습니다.</p>'}</div></section>
  </main>`;
  return {
    start,
    html: pageShell({
      title: `[내한정보] ${monday.getMonth() + 1}월 ${Math.ceil(monday.getDate() / 7)}주차 J-POP 공연·티켓팅`,
      description: `${humanDate(start)}부터 ${humanDate(end)}까지의 J-POP 내한 공연, 선예매와 일반예매 일정입니다.`,
      canonical: `${siteUrl}/calendar/weekly/${start}`,
      body, siteUrl,
      robots: "noindex,follow",
      includeAds: false
    })
  };
}

const updateLabels = {
  announcement: "신규 공연", "ticket-open": "티켓 오픈", "ticket-change": "예매 일정 변경", "extra-show": "추가 회차",
  "extra-seat": "추가 좌석", restock: "취소표", cancellation: "취소", postponement: "연기"
};
const snapshotFields = ["artist", "concertDate", "time", "venue", "vendor", "vendorUrl", "ticketDate", "ticketTime", "presaleDate", "presaleTime", "status", "ticketLabel", "verifiedAt", "sources"];
const snapshotEvents = events => Object.fromEntries(events.map(event => [event.id, Object.fromEntries(snapshotFields.map(field => [field, event[field] ?? null]))]));
const updateId = (event, kind, date) => `${date}-${kind}-${event.id}`.replace(/[^a-zA-Z0-9가-힣._-]+/g, "-");
const makeUpdate = (event, kind, date, summary) => ({
  id: updateId(event, kind, date), date, kind, label: updateLabels[kind], artist: event.artist,
  eventId: event.id, concertDate: event.concertDate, summary,
  url: event.sources?.[0] || event.vendorUrl || "", verifiedAt: event.verifiedAt || date
});

function classifyTicketLabel(label = "") {
  if (/취소표/.test(label)) return "restock";
  if (/추가|시야/.test(label)) return "extra-seat";
  return "";
}

function ticketScheduleSummary(event, prefix) {
  const items = [];
  if (event.presaleDate) items.push(`선예매 ${humanDate(event.presaleDate, event.presaleTime)}`);
  if (event.ticketDate) items.push(`일반예매 ${humanDate(event.ticketDate, event.ticketTime)}`);
  return `${prefix} ${items.join(", ")}.`;
}

function buildUpdateHistory(events, previousSnapshot = {}, previousUpdates = [], today) {
  const additions = [];
  const previousEvents = Object.values(previousSnapshot);
  if (Object.keys(previousSnapshot).length === 0) {
    const seededSeries = new Set();
    const seededTickets = new Set();
    for (const event of events.filter(item => item.status === "confirmed")) {
      const series = `${event.artist}|${event.venue}|${event.vendorUrl || event.vendor || ""}`;
      if (!seededSeries.has(series)) {
        additions.push(makeUpdate(event, "announcement", event.verifiedAt || today, `${humanDate(event.concertDate, event.time)} ${event.venue} 공연이 공식 확인됐습니다.`));
        seededSeries.add(series);
      }
      const ticketSeries = `${series}|${event.presaleDate || ""}|${event.presaleTime || ""}|${event.ticketDate || ""}|${event.ticketTime || ""}`;
      if ((event.presaleDate || event.ticketDate) && !seededTickets.has(ticketSeries)) {
        additions.push(makeUpdate(event, "ticket-open", event.verifiedAt || today, ticketScheduleSummary(event, "예매 일정이 공개됐습니다.")));
        seededTickets.add(ticketSeries);
      }
      const special = classifyTicketLabel(event.ticketLabel);
      if (special) additions.push(makeUpdate(event, special, event.verifiedAt || today, `${event.ticketLabel} 일정이 ${humanDate(event.ticketDate, event.ticketTime)}로 확인됐습니다.`));
    }
  } else {
    for (const event of events) {
      const before = previousSnapshot[event.id];
      const date = event.verifiedAt || today;
      if (!before) {
        const kind = previousEvents.some(item => item.artist === event.artist) ? "extra-show" : "announcement";
        additions.push(makeUpdate(event, kind, date, kind === "extra-show" ? `${humanDate(event.concertDate, event.time)} 추가 회차가 발표됐습니다.` : `${humanDate(event.concertDate, event.time)} ${event.venue} 공연이 발표됐습니다.`));
        if (event.presaleDate || event.ticketDate) additions.push(makeUpdate(event, "ticket-open", date, ticketScheduleSummary(event, "예매 일정이 공개됐습니다.")));
        const special = classifyTicketLabel(event.ticketLabel);
        if (special) additions.push(makeUpdate(event, special, date, `${event.ticketLabel} 일정이 ${humanDate(event.ticketDate, event.ticketTime)}로 확인됐습니다.`));
        continue;
      }
      const status = String(event.status || "").toLowerCase();
      if (before.status !== event.status && /cancel|취소/.test(status)) additions.push(makeUpdate(event, "cancellation", date, `${humanDate(event.concertDate)} 공연 취소가 확인됐습니다.`));
      if (before.status !== event.status && /postpone|연기/.test(status)) additions.push(makeUpdate(event, "postponement", date, `${humanDate(event.concertDate)} 공연 연기가 확인됐습니다.`));
      if (["ticketDate", "ticketTime", "presaleDate", "presaleTime"].some(field => before[field] !== (event[field] ?? null))) {
        const hadSchedule = Boolean(before.ticketDate || before.presaleDate);
        const kind = hadSchedule ? "ticket-change" : "ticket-open";
        additions.push(makeUpdate(event, kind, date, ticketScheduleSummary(event, hadSchedule ? "예매 일정이 변경됐습니다." : "예매 일정이 공개됐습니다.")));
      }
      const special = classifyTicketLabel(event.ticketLabel);
      if (special && before.ticketLabel !== event.ticketLabel) additions.push(makeUpdate(event, special, date, `${event.ticketLabel} 일정이 ${humanDate(event.ticketDate, event.ticketTime)}로 확인됐습니다.`));
    }
  }
  const merged = new Map(previousUpdates.map(update => [update.id, update]));
  for (const update of additions) merged.set(update.id, update);
  const deduped = new Map();
  for (const update of merged.values()) {
    const key = `${update.kind}|${update.artist}|${update.date}|${update.summary}`;
    if (!deduped.has(key)) deduped.set(key, update);
  }
  return [...deduped.values()].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

function updatesPageHtml({ updates, siteUrl, validEventIds = null }) {
  const hasPage = eventId => eventId && (!validEventIds || validEventIds.has(eventId));
  const cards = updates.slice(0, 100).map(update => `<article class="update-card" data-kind="${escapeHtml(update.kind)}"><time>${escapeHtml(humanDate(update.date))}</time><span>${escapeHtml(update.label)}</span><h2>${escapeHtml(update.artist)}</h2><p>${escapeHtml(update.summary)}</p><div>${hasPage(update.eventId) ? `<a href="./events/${encodeURIComponent(update.eventId)}">공연 정보</a>` : update.eventId ? '<span class="update-pending">상세 검증 중</span>' : ""}${update.url ? `<a href="${escapeHtml(update.url)}" target="_blank" rel="noopener noreferrer">공식 출처 ↗</a>` : ""}</div></article>`).join("");
  return pageShell({
    title: "J-POP 내한 공연 업데이트 | 제이라이브 코리아",
    description: "신규 공연, 예매 일정 변경, 추가 좌석·회차와 공연 취소·연기 기록을 날짜순으로 확인하세요.",
    canonical: `${siteUrl}/calendar/updates`,
    body: `<main class="updates-page"><span class="section-kicker">CHANGELOG</span><h1>공연 업데이트</h1><p class="guide-lead">무엇이 언제 바뀌었는지 공식 출처와 함께 기록합니다.</p><div class="update-feed">${cards || '<p class="empty-row">기록된 변경 사항이 없습니다.</p>'}</div></main>`,
    siteUrl,
    depth: ".",
    robots: "noindex,follow",
    includeAds: false
  });
}

module.exports = {
  artistIndexHtml, artistPageHtml, artistSlug, buildUpdateHistory, dateKey, humanDate,
  mondayFor, snapshotEvents, updatesPageHtml, weeklyPageHtml
};
