"use strict";

const config = window.JLIVE_CONFIG || {};
const editorial = window.JLIVE_CONTENT || { artists: {}, venues: {}, ticketTips: {} };
const params = new URLSearchParams(location.search);
const eventId = params.get("id") || document.body.dataset.eventId || "";
const weekdaysLong = ["일", "월", "화", "수", "목", "금", "토"];

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
})[character]);

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function humanDate(value, time = "") {
  if (!value) return "미정";
  const date = parseDate(value);
  const text = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일(${weekdaysLong[date.getDay()]})`;
  return time ? `${text} ${time}` : text;
}

function isPublicEvent(event) {
  return ["confirmed", "cancelled", "postponed"].includes(event.status)
    || (event.status === "pending" && event.hostingStatus === "confirmed");
}

function ticketDateDisplay(event) {
  if (!event.ticketDate) return window.JLIVE_VISITOR?.ticketStatus(event).label || "정보 미확인";
  if (!window.JLIVE_VISITOR?.isVerifiedDate(event, "ticketDate")) return "예매 일정 미확인";
  return humanDate(event.ticketDate, event.ticketTime);
}

function presaleDisplay(event) {
  if (event.presaleDate) return window.JLIVE_VISITOR?.isVerifiedDate(event, "presaleDate") ? humanDate(event.presaleDate, event.presaleTime) : "예매 일정 미확인";
  if (event.presaleStatus === "none") return "없음";
  if (event.presaleStatus === "checking") return "예매 일정 확인 중";
  if (event.ticketingStatus === "pending_announcement" || event.verification?.ticketing?.status === "pending_announcement") return "예매 일정 발표 대기";
  if (event.ticketingStatus === "conflict" || event.verification?.ticketing?.status === "conflict") return "예매 일정 확인 중";
  return "예매 일정 미확인";
}

function ticketAvailabilityDisplay(event) {
  const status = window.JLIVE_VISITOR?.ticketAvailability(event);
  return status ? `${status.label}${status.note ? ` · ${status.note}` : ""}` : "현재 판매 상태는 공식 예매처에서 확인";
}

function priceDisplay(event) {
  if (Array.isArray(event.seatPrices) && event.seatPrices.length) {
    return event.seatPrices.map(item => `${item.name} ${Number(item.price).toLocaleString("ko-KR")}원`).join(" · ");
  }
  return editorial.ticketGuides?.[event.artist]?.price || window.JLIVE_VISITOR?.priceStatus(event).label || "가격 미확인";
}

function sourceLabel(source) {
  if (source && typeof source === "object") return source.label || source.url || "출처 URL";
  try {
    const host = new URL(source).hostname.replace(/^(www|m)\./i, "");
    return ({ "ticket.yes24.com": "YES24 예매 페이지", "ticket.melon.com": "멜론티켓 예매 페이지", "tickets.interpark.com": "NOL 티켓 공지", "ticketlink.co.kr": "티켓링크 예매 페이지", "youtube.com": "YouTube" })[host] || host;
  } catch {
    return String(source);
  }
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

function sameSeries(left, right) {
  return left.artist === right.artist
    && left.venue === right.venue
    && (left.vendorUrl || left.vendor || "") === (right.vendorUrl || right.vendor || "");
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
        + (Math.abs(parseDate(item.concertDate) - parseDate(event.concertDate)) <= 30 * 86400000 ? 2 : 0)
    }))
    .sort((left, right) => right.score - left.score || left.item.concertDate.localeCompare(right.item.concertDate))
    .filter(({ item }) => !seenArtists.has(item.artist) && seenArtists.add(item.artist))
    .slice(0, 3)
    .map(({ item }) => item);
}

function renderRelatedEvents(event, events) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const base = location.pathname.includes("/calendar/events/") ? "./" : "./events/";
  const related = relatedEvents(event, events, today);
  const section = document.querySelector(".related-events-section");
  section.hidden = related.length === 0;
  document.querySelector("#relatedEvents").innerHTML = related.map(item => `
    <a href="${base}${encodeURIComponent(item.id)}" data-related-event="${escapeHtml(item.id)}">
      <span>${escapeHtml(item.genre || "J-POP")}</span>
      <strong>${escapeHtml(item.artist)}</strong>
      <p>${escapeHtml(humanDate(item.concertDate, item.time))}</p>
      <em>${escapeHtml(item.venue)}</em>
    </a>`).join("");
}

function renderSeries(event, events) {
  const series = events
    .filter(item => isPublicEvent(item) && sameSeries(item, event))
    .sort((a, b) => a.concertDate.localeCompare(b.concertDate) || (a.time || "").localeCompare(b.time || ""));
  const summary = document.querySelector("#seriesSummary");
  const dates = document.querySelector("#seriesDates");
  if (!summary || !dates) return series;
  summary.textContent = series.length > 1
    ? `이번 내한은 ${series.length}회 공연으로 진행됩니다. 날짜별 공연 시각과 예매 조건을 확인하세요.`
    : "";
  const base = location.pathname.includes("/calendar/events/") ? "./" : "./events/";
  dates.innerHTML = series.map(item => `
    <li class="${item.id === event.id ? "active" : ""}">
      <a href="${base}${encodeURIComponent(item.id)}">${escapeHtml(humanDate(item.concertDate, item.time))}</a>
    </li>`).join("");
  return series;
}

function addStructuredData(event) {
  const canonicalElement = document.querySelector("#canonicalLink");
  const canonical = canonicalElement?.getAttribute("href") || (location.pathname.includes("/calendar/events/")
    ? `${config.siteUrl || location.origin}/calendar/events/${encodeURIComponent(event.id)}`
    : `${config.siteUrl || location.origin}/calendar/event?id=${encodeURIComponent(event.id)}`);
  const existingScript = document.querySelector("#eventStructuredData");
  if (document.body.dataset.eventId && existingScript?.textContent.trim()) return;
  const script = existingScript || document.createElement("script");
  script.type = "application/ld+json";
  script.id = "eventStructuredData";
  const eventStatus = event.status === "cancelled" ? "https://schema.org/EventCancelled" : event.status === "postponed" ? "https://schema.org/EventPostponed" : "https://schema.org/EventScheduled";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: `${event.artist} 내한 공연`,
    startDate: isoDateTime(event.concertDate, event.time),
    eventStatus,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue,
      address: { "@type": "PostalAddress", addressCountry: "KR" }
    },
    performer: { "@type": "MusicGroup", name: event.artist },
    offers: event.vendorUrl ? {
      "@type": "Offer",
      url: event.vendorUrl,
      validFrom: isoDateTime(event.ticketDate, event.ticketTime)
    } : undefined,
    url: canonical
  });
  if (!script.isConnected) document.head.append(script);
}

function renderEvent(event, events) {
  const [year, month, day] = event.concertDate.split("-").map(Number);
  document.body.dataset.eventId = event.id;
  const title = `${event.artist} 내한 ${year} | ${month}월 ${day}일 공연·예매 정보`;
  const description = `${humanDate(event.concertDate, event.time)}, ${event.venue}에서 열리는 ${event.artist} 내한 공연의 예매 일정과 공식 출처입니다.`;
  document.title = title;
  document.querySelector('meta[name="description"]').content = description;
  const canonicalElement = document.querySelector("#canonicalLink");
  const canonical = canonicalElement.getAttribute("href") || (location.pathname.includes("/calendar/events/")
    ? `${config.siteUrl || location.origin}/calendar/events/${encodeURIComponent(event.id)}`
    : `${config.siteUrl || location.origin}/calendar/event?id=${encodeURIComponent(event.id)}`);
  canonicalElement.href = canonical;

  document.querySelector("#eventArtist").textContent = event.artist;
  document.querySelector("#eventGenre").textContent = event.genre || "J-POP";
  const statusPrefix = event.status === "cancelled" ? "공식 취소 · " : event.status === "postponed" ? "공식 연기 · " : "";
  document.querySelector("#eventSummary").textContent = `${statusPrefix}${humanDate(event.concertDate, event.time)} · ${event.venue}`;
  renderSeries(event, events);
  const artistIntro = document.querySelector("#artistIntro");
  if (artistIntro) artistIntro.textContent = editorial.artistProfiles?.[event.artist]?.summary || "";
  const venueGuide = document.querySelector("#venueGuide");
  if (venueGuide) venueGuide.textContent = editorial.venues[event.venue] || "";
  const ticketTip = document.querySelector("#ticketTip");
  if (ticketTip) ticketTip.textContent = editorial.ticketTips[event.vendor] ||
    "공식 예매처 로그인과 본인인증, 결제수단을 미리 점검하고 공지된 예매 시작 시각보다 여유 있게 접속하세요.";

  document.querySelector("#factDate").textContent = humanDate(event.concertDate, event.time);
  document.querySelector("#factVenue").textContent = event.venue;
  document.querySelector("#factPresale").textContent = presaleDisplay(event);
  document.querySelector("#factTicket").textContent = ticketDateDisplay(event);
  document.querySelector("#factVendor").textContent = event.vendor || "미정";
  document.querySelector("#factPrice").textContent = priceDisplay(event);
  document.querySelector("#factAvailability").textContent = ticketAvailabilityDisplay(event);
  const verificationDates = window.JLIVE_VISITOR?.verificationDates(event) || {};
  document.querySelector("#factScheduleVerified").textContent = verificationDates.schedule || "미기록";
  document.querySelector("#factPriceVerified").textContent = verificationDates.price || "미기록";
  document.querySelector("#eventVerified").textContent = window.JLIVE_VISITOR?.verificationSummary(event) || `일정 확인 ${verificationDates.schedule || "미기록"} · 가격 확인 ${verificationDates.price || "미기록"} · 판매 상태 확인 ${verificationDates.availability || "미확인"}`;

  const ticket = document.querySelector("#eventTicket");
  ticket.hidden = !event.vendorUrl;
  if (event.vendorUrl) ticket.href = event.vendorUrl;
  else ticket.removeAttribute("href");
  ticket.dataset.trackVendor = event.vendor || "미정";
  const correctionBase = location.pathname.includes("/calendar/events/") ? "../corrections" : "./corrections";
  document.querySelector("#correctionLink").href = `${correctionBase}?event=${encodeURIComponent(event.id)}&artist=${encodeURIComponent(event.artist)}`;

  const songsElement = document.querySelector("#eventSongs");
  if (songsElement) songsElement.innerHTML = (event.songs || []).slice(0, 3).map(song => {
    return `
    <a class="song" href="${escapeHtml(song[2])}" target="_blank" rel="noopener noreferrer">
      <span class="play">▶</span><span>${escapeHtml(song[0])}</span><em>YouTube 영상</em>
    </a>`;
  }).join("");
  document.querySelector("#eventSources").innerHTML = (event.sources || []).map(source => {
    const url = typeof source === "object" ? source.url : source;
    return `<a class="source-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sourceLabel(source))} ↗</a>`;
  }).join("");
  renderRelatedEvents(event, events);

  const photo = document.querySelector("#eventPhoto");
  if (photo) {
    const staticPhoto = photo.getAttribute("src");
    const localPhoto = window.JLIVE_ARTIST_IMAGES.localUrl(event);
    const photoUrl = staticPhoto || localPhoto;
    photo.hidden = !photoUrl;
    if (photoUrl && !staticPhoto) photo.src = photoUrl;
    if (photoUrl) photo.onerror = () => {
      photo.onerror = null;
      photo.removeAttribute("src");
      photo.hidden = true;
    };
  }

  addStructuredData(event);
  const loading = document.querySelector("#eventLoading");
  loading.replaceChildren();
  loading.hidden = true;
  document.querySelector("#eventArticle").hidden = false;
}

async function initializeEvent() {
  if (!eventId) throw new Error("공연 식별자가 없습니다.");
  const loading = document.querySelector("#eventLoading");
  if (document.querySelector("#eventArticle").hidden) {
    loading.textContent = "공연 정보를 불러오는 중입니다.";
    loading.hidden = false;
  }
  let response = await fetch("/api/events", { cache: "no-store" });
  if (!response.ok) {
    const fallback = location.pathname.includes("/calendar/events/") ? "../data/events.json" : "./data/events.json";
    response = await fetch(fallback, { cache: "no-store" });
  }
  if (!response.ok) throw new Error("공연 데이터를 불러오지 못했습니다.");
  const events = await response.json();
  const event = events.find(item => item.id === eventId && isPublicEvent(item));
  if (!event) throw new Error("공연을 찾을 수 없습니다.");
  renderEvent(event, events);
}

document.querySelector("#relatedEvents").addEventListener("click", clickEvent => {
  const link = clickEvent.target.closest("[data-related-event]");
  if (link) window.JLIVE_ANALYTICS.track("event_detail_open", { event_id: link.dataset.relatedEvent, source: "related_events" });
});

initializeEvent().catch(error => {
  const indexPath = location.pathname.includes("/calendar/events/") ? "../" : "./";
  const loading = document.querySelector("#eventLoading");
  document.querySelector("#eventArticle").hidden = true;
  document.querySelectorAll(".google-auto-placed, ins.adsbygoogle, [data-ad-status]").forEach(element => element.remove());
  document.querySelectorAll('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]').forEach(element => element.remove());
  loading.hidden = false;
  loading.innerHTML = `<strong>공연 정보를 표시할 수 없습니다.</strong><span>${escapeHtml(error.message)}</span><a href="${indexPath}">전체 달력으로 돌아가기</a>`;
});
