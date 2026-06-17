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

function songTitles(event) {
  return (event.songs || [])
    .map(song => song[0])
    .filter(Boolean);
}

function buildFirstTimerGuide(event) {
  const songs = songTitles(event);
  const songText = songs.length
    ? `대표곡은 ${songs.slice(0, 3).join(", ")} 순서로 먼저 들어보면 공연 분위기를 잡기 좋습니다.`
    : "공연 전 공식 채널의 최근 라이브 영상과 대표곡을 먼저 들어보면 현장 분위기를 이해하기 좋습니다.";
  return `${event.artist} 내한 공연을 처음 보는 팬이라면 공연일과 예매일을 따로 체크하는 것이 좋습니다. ${songText} 스탠딩 공연은 입장 번호와 대기 동선이 중요하고, 지정석 공연도 공연장 입구와 물품보관 안내를 미리 확인하면 당일 이동이 훨씬 편합니다.`;
}

function buildSongGuide(event) {
  const songs = songTitles(event);
  if (!songs.length) {
    return `${event.artist}의 대표곡 링크가 확인되는 대로 업데이트합니다. 공연 전에는 공식 YouTube 채널과 예매처 안내를 함께 확인하세요.`;
  }
  return `${songs[0]}을 먼저 듣고, 이어서 ${songs.slice(1).join(", ")}까지 이어 들으면 ${event.artist}의 사운드와 무대 흐름을 빠르게 파악할 수 있습니다. 각 링크는 YouTube로 바로 연결됩니다.`;
}

function buildChecklist(event) {
  const ticketText = event.ticketDate
    ? `일반예매는 ${humanDate(event.ticketDate, event.ticketTime)} 기준으로 기록되어 있습니다. 예매 전 ${event.vendor || "공식 예매처"} 로그인, 본인인증, 결제수단을 미리 확인하세요.`
    : "일반예매 일정은 아직 미정이거나 공식 공지에서 재확인이 필요합니다. 예매처 알림과 주최사 공지를 함께 확인하세요.";
  const presaleText = event.presaleDate
    ? `선예매가 있다면 ${humanDate(event.presaleDate, event.presaleTime)} 일정과 대상 조건을 먼저 확인하세요.`
    : "선예매 정보가 없는 공연은 공식 팬클럽, 주최사, 예매처 공지가 추가로 나오는지 확인하세요.";
  return [
    `${humanDate(event.concertDate, event.time)} 공연 기준으로 최소 1시간 전 도착을 목표로 잡으면 입장 대기와 물품보관에 여유가 있습니다.`,
    `${event.venue}까지의 대중교통 막차, 환승 경로, 공연 종료 후 이동 시간을 미리 확인하세요.`,
    ticketText,
    presaleText,
    "공식 출처와 마지막 검증일을 확인하고, 일정이나 예매 방식이 바뀐 경우 정보 수정 요청으로 알려주세요."
  ];
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

function addStructuredData(event) {
  const canonical = location.pathname.includes("/calendar/events/")
    ? `${config.siteUrl || location.origin}/calendar/events/${encodeURIComponent(event.id)}.html`
    : `${config.siteUrl || location.origin}/calendar/event.html?id=${encodeURIComponent(event.id)}`;
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: `${event.artist} 내한 공연`,
    startDate: isoDateTime(event.concertDate, event.time),
    eventStatus: "https://schema.org/EventScheduled",
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
      availability: "https://schema.org/InStock",
      validFrom: isoDateTime(event.ticketDate, event.ticketTime)
    } : undefined,
    url: canonical
  });
  document.head.append(script);
}

function renderEvent(event) {
  const title = `${event.artist} 내한 공연 일정·예매 | 제이라이브 코리아`;
  const description = `${humanDate(event.concertDate, event.time)}, ${event.venue}에서 열리는 ${event.artist} 내한 공연의 예매 일정과 공식 출처입니다.`;
  document.title = title;
  document.querySelector('meta[name="description"]').content = description;
  const canonical = location.pathname.includes("/calendar/events/")
    ? `${config.siteUrl || location.origin}/calendar/events/${encodeURIComponent(event.id)}.html`
    : `${config.siteUrl || location.origin}/calendar/event.html?id=${encodeURIComponent(event.id)}`;
  document.querySelector("#canonicalLink").href = canonical;

  document.querySelector("#eventArtist").textContent = event.artist;
  document.querySelector("#eventGenre").textContent = event.genre || "J-POP";
  document.querySelector("#eventSummary").textContent = `${humanDate(event.concertDate, event.time)} · ${event.venue}`;
  document.querySelector("#artistIntro").textContent = editorial.artists[event.artist] ||
    `${event.artist}의 한국 공연입니다. 제이라이브 코리아는 공식 발표와 예매처 정보를 기준으로 공연 일정을 정리합니다.`;
  document.querySelector("#venueGuide").textContent = editorial.venues[event.venue] ||
    `${event.venue} 방문 전 공식 공연장 안내에서 대중교통, 주차와 입장 게이트를 확인하세요.`;
  document.querySelector("#ticketTip").textContent = editorial.ticketTips[event.vendor] ||
    "공식 예매처 로그인과 본인인증, 결제수단을 미리 점검하고 공지된 예매 시작 시각보다 여유 있게 접속하세요.";
  document.querySelector("#firstTimerGuide").textContent = buildFirstTimerGuide(event);
  document.querySelector("#songGuide").textContent = buildSongGuide(event);
  document.querySelector("#dayChecklist").innerHTML = buildChecklist(event)
    .map(item => `<li>${escapeHtml(item)}</li>`)
    .join("");

  document.querySelector("#factDate").textContent = humanDate(event.concertDate, event.time);
  document.querySelector("#factVenue").textContent = event.venue;
  document.querySelector("#factPresale").textContent = humanDate(event.presaleDate, event.presaleTime);
  document.querySelector("#factTicket").textContent = humanDate(event.ticketDate, event.ticketTime);
  document.querySelector("#factVendor").textContent = event.vendor || "미정";
  document.querySelector("#eventVerified").textContent = event.verifiedAt
    ? `마지막 검증일: ${event.verifiedAt} · 이후 공식 발표로 정보가 변경될 수 있습니다.`
    : "검증일이 기록되지 않았습니다.";

  const ticket = document.querySelector("#eventTicket");
  ticket.hidden = !event.vendorUrl;
  ticket.href = event.vendorUrl || "#";
  const correctionBase = location.pathname.includes("/calendar/events/") ? "../corrections.html" : "./corrections.html";
  document.querySelector("#correctionLink").href = `${correctionBase}?event=${encodeURIComponent(event.id)}&artist=${encodeURIComponent(event.artist)}`;

  document.querySelector("#eventSongs").innerHTML = (event.songs || []).map(song => `
    <a class="song" href="${escapeHtml(song[2])}" target="_blank" rel="noopener noreferrer">
      <span class="play">▶</span><span>${escapeHtml(song[0])}</span><em>${escapeHtml(song[1] || "")}</em>
    </a>`).join("");
  document.querySelector("#eventSources").innerHTML = (event.sources || []).map((source, index) =>
    `<a class="source-link" href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">공식 출처 ${index + 1} 확인 ↗</a>`
  ).join("");

  const photo = document.querySelector("#eventPhoto");
  photo.alt = `${event.artist} 공식 YouTube 프로필`;
  const localPhoto = window.JLIVE_ARTIST_IMAGES.localUrl(event);
  const remotePhoto = window.JLIVE_ARTIST_IMAGES.remoteUrl(event);
  photo.src = localPhoto || remotePhoto;
  photo.onerror = () => {
    if (remotePhoto && photo.src !== remotePhoto) {
      photo.src = remotePhoto;
      return;
    }
    photo.hidden = true;
  };

  addStructuredData(event);
  document.querySelector("#eventLoading").hidden = true;
  document.querySelector("#eventArticle").hidden = false;
}

async function initializeEvent() {
  if (!eventId) throw new Error("공연 식별자가 없습니다.");
  let response = await fetch("/api/events", { cache: "no-store" });
  if (!response.ok) {
    const fallback = location.pathname.includes("/calendar/events/") ? "../data/events.json" : "./data/events.json";
    response = await fetch(fallback, { cache: "no-store" });
  }
  if (!response.ok) throw new Error("공연 데이터를 불러오지 못했습니다.");
  const events = await response.json();
  const event = events.find(item => item.id === eventId && item.status === "confirmed");
  if (!event) throw new Error("공연을 찾을 수 없습니다.");
  renderEvent(event);
}

initializeEvent().catch(error => {
  const indexPath = location.pathname.includes("/calendar/events/") ? "../index.html" : "./index.html";
  document.querySelector("#eventLoading").innerHTML = `<strong>공연 정보를 표시할 수 없습니다.</strong><span>${escapeHtml(error.message)}</span><a href="${indexPath}">전체 달력으로 돌아가기</a>`;
});
