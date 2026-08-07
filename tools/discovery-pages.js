"use strict";

const fs = require("fs");
const path = require("path");

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

function pageShell({ title, description, canonical, body, siteUrl, depth = ".." }) {
  return `<!doctype html>
<html lang="ko"><head>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3081918168688274" crossorigin="anonymous"></script>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:type" content="website">
  <title>${escapeHtml(title)}</title><link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="stylesheet" href="${depth}/styles.css?v=20260806h">
  <script src="${depth}/site-config.js?v=20260729ga"></script><script src="${depth}/analytics.js" defer></script><script src="${depth}/site.js" defer></script>
</head><body><div class="shell info-shell">
  <header><a class="brand" href="${depth}/"><span class="brand-mark">J</span> 제이라이브 코리아</a><nav class="page-nav"><a href="${depth}/weekly">이번 주</a><a href="${depth}/updates">업데이트</a><a href="${depth}/artists">아티스트</a></nav></header>
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

function artistPageHtml({ artist, events, aliases, editorial, siteUrl, today }) {
  const sorted = [...events].sort((a, b) => a.concertDate.localeCompare(b.concertDate));
  const latest = [...sorted].reverse().find(event => event.songs?.length) || sorted[sorted.length - 1];
  const slug = artistSlug(sorted[0]);
  const upcoming = sorted.filter(event => event.concertDate >= today);
  const past = sorted.filter(event => event.concertDate < today).reverse();
  const names = languageNames(artist, aliases[artist]);
  const songs = (latest.songs || []).slice(0, 3);
  const venues = [...new Set(sorted.map(event => event.venue))];
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
    <section class="artist-profile-hero"><img src="${escapeHtml(imageUrl(latest, siteUrl))}" alt="${escapeHtml(artist)} 공식 프로필" loading="eager"><div><span class="section-kicker">ARTIST PROFILE</span><h1>${escapeHtml(artist)}</h1><p>${escapeHtml(intro)}</p></div></section>
    <section class="artist-name-grid" aria-label="아티스트 이름 표기"><div><small>한국어</small><strong>${escapeHtml(names.korean)}</strong></div><div><small>English</small><strong>${escapeHtml(names.english)}</strong></div><div><small>日本語</small><strong>${escapeHtml(names.japanese)}</strong></div></section>
    <div class="artist-profile-grid">
      <section><span class="section-kicker">NEXT CONCERT</span><h2>다음 한국 공연</h2><ul class="artist-event-list">${eventRows(nextEvent ? [nextEvent] : [])}</ul></section>
      <section class="artist-history"><span class="section-kicker">KOREA HISTORY</span><h2>공식 확인 내한 이력</h2><ol class="artist-history-list">${historyRows}</ol><p class="artist-history-note">J-LIVE가 공식 출처로 확인한 기록만 표시하며, 관객 수는 발표된 경우에만 제공합니다.</p></section>
    </div>
    <section class="artist-songs"><span class="section-kicker">START WITH 3 SONGS</span><h2>대표곡 3개</h2><div class="song-list">${songs.map(song => `<a class="song" href="${escapeHtml(song[2])}" target="_blank" rel="noopener noreferrer"><span class="play">▶</span><span>${escapeHtml(song[0])}</span><em>공식 YouTube</em></a>`).join("")}</div></section>
    <section class="artist-related"><div><h2>관련 공연장</h2><p>${venues.map(escapeHtml).join(" · ")}</p></div><div><h2>예매처</h2><p>${vendors.length ? vendors.map(([name, url]) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" data-track-vendor="${escapeHtml(name)}">${escapeHtml(name)} ↗</a>`).join(" · ") : "확인된 예매처가 없습니다."}</p></div></section>
  </main>`;
  return pageShell({
    title: `${artist} 내한 공연·대표곡·지난 기록 | 제이라이브 코리아`,
    description: `${artist}의 예정된 한국 공연, 지난 내한 기록, 대표곡 3개와 관련 공연장·예매처를 확인하세요.`,
    canonical: `${siteUrl}/calendar/artists/${encodeURIComponent(slug)}`,
    body, siteUrl
  });
}

function artistIndexHtml({ groups, aliases, siteUrl, today }) {
  const cards = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([artist, events]) => {
    const sorted = [...events].sort((a, b) => a.concertDate.localeCompare(b.concertDate));
    const next = sorted.find(event => event.concertDate >= today);
    const names = languageNames(artist, aliases[artist]);
    return `<a class="artist-index-card" href="./${encodeURIComponent(artistSlug(sorted[0]))}"><span>${escapeHtml(names.korean)}</span><strong>${escapeHtml(artist)}</strong><small>${next ? `다음 공연 ${escapeHtml(humanDate(next.concertDate))}` : `지난 내한 ${sorted.length}회 기록`}</small></a>`;
  }).join("");
  return pageShell({
    title: "J-POP 내한 아티스트 목록 | 제이라이브 코리아",
    description: "한국에서 공연하는 일본 아티스트의 예정 공연, 지난 내한 기록과 대표곡을 확인하세요.",
    canonical: `${siteUrl}/calendar/artists`,
    body: `<main class="directory-page"><span class="section-kicker">ARTIST DIRECTORY</span><h1>내한 아티스트</h1><p class="guide-lead">한국어·영어·일본어 이름과 공연 기록을 아티스트별로 모았습니다.</p><div class="artist-index-grid">${cards}</div></main>`,
    siteUrl
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
      body, siteUrl
    })
  };
}

const updateLabels = {
  announcement: "신규 공연", "ticket-change": "예매 일정 변경", "extra-show": "추가 회차",
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

function buildUpdateHistory(events, previousSnapshot = {}, previousUpdates = [], today) {
  const additions = [];
  const previousEvents = Object.values(previousSnapshot);
  if (Object.keys(previousSnapshot).length === 0) {
    const seededSeries = new Set();
    for (const event of events.filter(item => item.status === "confirmed")) {
      const series = `${event.artist}|${event.venue}|${event.vendorUrl || event.vendor || ""}`;
      if (!seededSeries.has(series)) {
        additions.push(makeUpdate(event, "announcement", event.verifiedAt || today, `${humanDate(event.concertDate, event.time)} ${event.venue} 공연이 공식 확인됐습니다.`));
        seededSeries.add(series);
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
        continue;
      }
      const status = String(event.status || "").toLowerCase();
      if (before.status !== event.status && /cancel|취소/.test(status)) additions.push(makeUpdate(event, "cancellation", date, `${humanDate(event.concertDate)} 공연 취소가 확인됐습니다.`));
      if (before.status !== event.status && /postpone|연기/.test(status)) additions.push(makeUpdate(event, "postponement", date, `${humanDate(event.concertDate)} 공연 연기가 확인됐습니다.`));
      if (["ticketDate", "ticketTime", "presaleDate", "presaleTime"].some(field => before[field] !== (event[field] ?? null))) {
        additions.push(makeUpdate(event, "ticket-change", date, `예매 일정이 변경됐습니다. 선예매 ${humanDate(event.presaleDate, event.presaleTime)}, 일반예매 ${humanDate(event.ticketDate, event.ticketTime)}.`));
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

function updatesPageHtml({ updates, siteUrl }) {
  const cards = updates.slice(0, 100).map(update => `<article class="update-card" data-kind="${escapeHtml(update.kind)}"><time>${escapeHtml(humanDate(update.date))}</time><span>${escapeHtml(update.label)}</span><h2>${escapeHtml(update.artist)}</h2><p>${escapeHtml(update.summary)}</p><div>${update.eventId ? `<a href="./events/${encodeURIComponent(update.eventId)}">공연 정보</a>` : ""}${update.url ? `<a href="${escapeHtml(update.url)}" target="_blank" rel="noopener noreferrer">공식 출처 ↗</a>` : ""}</div></article>`).join("");
  return pageShell({
    title: "J-POP 내한 공연 업데이트 | 제이라이브 코리아",
    description: "신규 공연, 예매 일정 변경, 추가 좌석·회차와 공연 취소·연기 기록을 날짜순으로 확인하세요.",
    canonical: `${siteUrl}/calendar/updates`,
    body: `<main class="updates-page"><span class="section-kicker">CHANGELOG</span><h1>공연 업데이트</h1><p class="guide-lead">무엇이 언제 바뀌었는지 공식 출처와 함께 기록합니다.</p><div class="update-feed">${cards || '<p class="empty-row">기록된 변경 사항이 없습니다.</p>'}</div></main>`,
    siteUrl,
    depth: "."
  });
}

module.exports = {
  artistIndexHtml, artistPageHtml, artistSlug, buildUpdateHistory, dateKey, humanDate,
  mondayFor, snapshotEvents, updatesPageHtml, weeklyPageHtml
};
