"use strict";

const typeLabels = { concert: "공연", ticket: "일반예매", presale: "선예매" };
const weekdays = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
const filters = new Set(Object.keys(typeLabels));
const calendar = document.querySelector("#calendar");
const weekendEvents = document.querySelector("#weekendEvents");
const weekendSpotlight = document.querySelector(".weekend-spotlight");
const weekendKicker = document.querySelector("#weekendKicker")
  || document.querySelector(".weekend-heading .section-kicker");
const weekendTitle = document.querySelector("#weekendTitle");
const weekendCopy = document.querySelector("#weekendCopy")
  || document.querySelector(".weekend-heading > p");
const attendanceRanking = document.querySelector("#attendanceRanking");
const attendanceEmpty = document.querySelector("#attendanceEmpty");
const artistSearch = document.querySelector("#artistSearch");
const artistSearchResults = document.querySelector("#artistSearchResults");
const myShowEvents = document.querySelector("#myShowEvents");
const myShowsEmpty = document.querySelector("#myShowsEmpty");
const myShowsSummary = document.querySelector("#myShowsSummary");
const myShowsUpcomingCount = document.querySelector("#myShowsUpcomingCount");
const myShowsWeeklySales = document.querySelector("#myShowsWeeklySales");
const myShowsAttendanceCount = document.querySelector("#myShowsAttendanceCount");
const myShowsFeature = document.querySelector("#myShowsFeature");
const myShowsFeatureImage = document.querySelector("#myShowsFeatureImage");
const myShowsFeatureArtist = document.querySelector("#myShowsFeatureArtist");
const myShowsFeatureMeta = document.querySelector("#myShowsFeatureMeta");
const myShowsFeatureDday = document.querySelector("#myShowsFeatureDday");
const myShowsAlerts = document.querySelector("#myShowsAlerts");
const savedArtists = document.querySelector("#savedArtists");
const saveEventButton = document.querySelector("#saveEventButton");
const saveArtistButton = document.querySelector("#saveArtistButton");
const alertButton = document.querySelector("#alertButton");
const alertPlan = document.querySelector("#alertPlan");
const attendanceAddButton = document.querySelector("#attendanceAddButton");
const attendanceFormWrap = document.querySelector("#attendanceFormWrap");
const attendanceForm = document.querySelector("#attendanceForm");
const attendanceCancelButton = document.querySelector("#attendanceCancelButton");
const attendanceFormTotal = document.querySelector("#attendanceFormTotal");
const attendanceEventSearch = document.querySelector("#attendanceEventSearch");
const attendanceEventResults = document.querySelector("#attendanceEventResults");
const attendanceShowCount = document.querySelector("#attendanceShowCount");
const attendanceTicketCount = document.querySelector("#attendanceTicketCount");
const attendanceTotal = document.querySelector("#attendanceTotal");
const attendanceRecords = document.querySelector("#attendanceRecords");
const attendanceRecordsEmpty = document.querySelector("#attendanceRecordsEmpty");
let artistAliases = {};
let schedules = [];
let updates = [];
let selectedId = "";
let selectedType = "concert";
let selectedDateKey = "";
let viewDate = new Date();
let savedFavorites = window.JLIVE_FAVORITES.read();
let attendanceLog = window.JLIVE_ATTENDANCE.read();
let alertSettings = window.JLIVE_ALERTS.read();
let emptySearchTimer = 0;
const mobileQuery = window.matchMedia("(max-width: 820px)");

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
})[char]);
const typeLabel = (type, schedule) => type === "ticket" && schedule.ticketLabel
  ? schedule.ticketLabel
  : typeLabels[type];

function parseDate(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(key) {
  if (!key) return "미정";
  const date = parseDate(key);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${weekdays[date.getDay()]}`;
}

function formatScheduleDate(key, time = "") {
  const formatted = formatDate(key);
  return key && time ? `${formatted} · ${time}` : formatted;
}

function eventsForDate(key) {
  const events = schedules.flatMap(schedule => [
    schedule.concertDate === key && { type: "concert", schedule },
    schedule.ticketDate === key && { type: "ticket", schedule },
    schedule.presaleDate === key && { type: "presale", schedule }
  ].filter(Boolean));
  const seenTicketEvents = new Set();
  return events.filter(({ type, schedule }) => {
    if (type === "concert") return true;
    const time = type === "ticket" ? schedule.ticketTime : schedule.presaleTime;
    const eventKey = `${type}|${schedule.artist}|${time || ""}`;
    if (seenTicketEvents.has(eventKey)) return false;
    seenTicketEvents.add(eventKey);
    return true;
  });
}

const formatWon = value => `${Math.max(0, Number(value) || 0).toLocaleString("ko-KR")}원`;

function eligibleAttendanceEvents() {
  const today = dateKey(new Date());
  return schedules.filter(schedule => schedule.concertDate <= today)
    .sort((a, b) => b.concertDate.localeCompare(a.concertDate) || a.artist.localeCompare(b.artist));
}

function updateAttendanceFormTotal() {
  const data = new FormData(attendanceForm);
  const total = Math.max(0, Number(data.get("unitPrice")) || 0)
    * Math.min(20, Math.max(1, Number(data.get("quantity")) || 1));
  attendanceFormTotal.textContent = formatWon(Math.round(total));
}

function closeAttendanceForm() {
  attendanceFormWrap.hidden = true;
  attendanceAddButton.setAttribute("aria-expanded", "false");
  attendanceAddButton.textContent = "＋ 관람 기록";
  attendanceForm.reset();
  attendanceForm.elements.recordId.value = "";
  attendanceForm.elements.eventId.value = "";
  attendanceForm.elements.quantity.value = "1";
  attendanceEventSearch.setCustomValidity("");
  attendanceEventResults.hidden = true;
  attendanceEventSearch.setAttribute("aria-expanded", "false");
  updateAttendanceFormTotal();
}

function openAttendanceForm(record = null) {
  const events = eligibleAttendanceEvents();
  const recordSchedule = record && schedules.find(schedule => schedule.id === record.eventId);
  attendanceForm.elements.recordId.value = record?.id || "";
  attendanceForm.elements.eventId.value = record?.eventId || "";
  attendanceEventSearch.value = record
    ? `${formatDate(recordSchedule?.concertDate || record.concertDate)} · ${recordSchedule?.artist || record.artist}`
    : "";
  attendanceEventSearch.placeholder = events.length
    ? "아티스트, 공연장 또는 날짜 검색"
    : "기록 가능한 지난 공연이 없습니다";
  attendanceForm.elements.seat.value = record?.seat === "좌석 미입력" ? "" : record?.seat || "";
  attendanceForm.elements.unitPrice.value = record?.unitPrice || "";
  attendanceForm.elements.quantity.value = record?.quantity || 1;
  attendanceFormWrap.hidden = false;
  attendanceAddButton.setAttribute("aria-expanded", "true");
  attendanceAddButton.textContent = record ? "기록 수정 중" : "기록 입력 중";
  updateAttendanceFormTotal();
  (record ? attendanceForm.elements.seat : attendanceEventSearch).focus();
}

function renderAttendanceLog() {
  const summary = window.JLIVE_ATTENDANCE.summarize(attendanceLog);
  attendanceShowCount.textContent = String(summary.shows);
  attendanceTicketCount.textContent = String(summary.tickets);
  attendanceTotal.textContent = formatWon(summary.total);
  attendanceRecordsEmpty.hidden = attendanceLog.length > 0;
  attendanceRecords.innerHTML = [...attendanceLog]
    .sort((a, b) => (b.concertDate || "").localeCompare(a.concertDate || "") || b.createdAt.localeCompare(a.createdAt))
    .map(record => {
      const schedule = schedules.find(item => item.id === record.eventId);
      const artist = schedule?.artist || record.artist || "공연 정보 없음";
      const venue = schedule?.venue || record.venue || "공연장 미입력";
      const concertDate = schedule?.concertDate || record.concertDate;
      const total = window.JLIVE_ATTENDANCE.totalFor(record);
      return `<article class="attendance-record">
        <div class="attendance-record-main"><time>${escapeHtml(formatDate(concertDate))}</time><strong>${escapeHtml(artist)}</strong><span>${escapeHtml(venue)}</span></div>
        <div class="attendance-record-seat"><small>좌석·구역</small><strong>${escapeHtml(record.seat)}</strong></div>
        <div class="attendance-record-price"><small>${formatWon(record.unitPrice)} × ${record.quantity}매</small><strong>${formatWon(total)}</strong></div>
        <div class="attendance-record-actions"><button type="button" data-edit-attendance="${escapeHtml(record.id)}">수정</button><button type="button" data-delete-attendance="${escapeHtml(record.id)}">삭제</button></div>
      </article>`;
    }).join("");
}

const normalizeSearchText = value => String(value || "")
  .normalize("NFKC")
  .toLocaleLowerCase()
  .replace(/[\s\p{P}\p{S}]/gu, "");

function attendanceEventLabel(schedule) {
  return `${formatDate(schedule.concertDate)} · ${schedule.artist} · ${schedule.venue}`;
}

function renderAttendanceEventSearch() {
  const query = normalizeSearchText(attendanceEventSearch.value);
  const matches = eligibleAttendanceEvents().filter(schedule => !query || [
    schedule.artist,
    schedule.venue,
    schedule.concertDate,
    formatDate(schedule.concertDate),
    ...(artistAliases[schedule.artist] || [])
  ].some(value => normalizeSearchText(value).includes(query))).slice(0, 8);
  attendanceEventResults.innerHTML = matches.length
    ? matches.map(schedule => `<button type="button" role="option" data-attendance-event="${escapeHtml(schedule.id)}"><strong>${escapeHtml(schedule.artist)}</strong><span>${escapeHtml(schedule.venue)}</span><time>${escapeHtml(formatDate(schedule.concertDate))}</time></button>`).join("")
    : '<p>검색 결과가 없습니다.</p>';
  attendanceEventResults.hidden = false;
  attendanceEventSearch.setAttribute("aria-expanded", "true");
}

function selectAttendanceEvent(schedule) {
  if (!schedule) return;
  attendanceForm.elements.eventId.value = schedule.id;
  attendanceEventSearch.value = attendanceEventLabel(schedule);
  attendanceEventSearch.setCustomValidity("");
  attendanceEventResults.hidden = true;
  attendanceEventSearch.setAttribute("aria-expanded", "false");
}

function renderArtistSearch() {
  const query = normalizeSearchText(artistSearch.value);
  artistSearchResults.hidden = !query;
  artistSearch.setAttribute("aria-expanded", String(Boolean(query)));
  if (!query) return;

  const matches = schedules.filter(schedule =>
    [schedule.artist, ...(artistAliases[schedule.artist] || [])]
      .some(name => normalizeSearchText(name).includes(query))
  );
  artistSearchResults.innerHTML = matches.length
    ? matches.map(schedule => `
      <button class="artist-search-result" type="button" role="option" data-id="${escapeHtml(schedule.id)}">
        <strong>${escapeHtml(schedule.artist)}</strong>
        <small>${escapeHtml(schedule.venue)}</small>
        <time>${escapeHtml(formatDate(schedule.concertDate))}</time>
      </button>`).join("")
    : '<p class="artist-search-empty">검색 결과가 없습니다.</p>';
}

function weekendRangeFor(key) {
  const date = parseDate(key);
  const saturday = new Date(date);
  saturday.setDate(date.getDate() + (date.getDay() === 0 ? -1 : 6 - date.getDay()));
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  return { saturday, sunday };
}

function formatWeekendKicker(saturday, sunday) {
  const month = saturday.toLocaleDateString("en-US", { month: "long" }).toUpperCase();
  return saturday.getMonth() === sunday.getMonth()
    ? `${month} ${saturday.getDate()}-${sunday.getDate()}`
    : `${month} ${saturday.getDate()}-${sunday.toLocaleDateString("en-US", { month: "long" }).toUpperCase()} ${sunday.getDate()}`;
}

function formatWeekendTitle(saturday, sunday) {
  const start = `${saturday.getMonth() + 1}월 ${saturday.getDate()}일`;
  const end = saturday.getMonth() === sunday.getMonth()
    ? `${sunday.getDate()}일`
    : `${sunday.getMonth() + 1}월 ${sunday.getDate()}일`;
  return `${start}-${end} 주말 공연`;
}

function renderWeekendSpotlight() {
  const today = dateKey(new Date());
  const nextWeekendEvent = schedules.find(schedule => {
    if (schedule.concertDate < today) return false;
    const day = parseDate(schedule.concertDate).getDay();
    return day === 0 || day === 6;
  });

  if (!nextWeekendEvent) {
    weekendSpotlight.hidden = true;
    return;
  }

  const { saturday, sunday } = weekendRangeFor(nextWeekendEvent.concertDate);
  const saturdayKey = dateKey(saturday);
  const sundayKey = dateKey(sunday);
  const events = schedules
    .filter(schedule => schedule.concertDate === saturdayKey || schedule.concertDate === sundayKey)
    .sort((a, b) => a.concertDate.localeCompare(b.concertDate)
      || (a.time || "").localeCompare(b.time || "")
      || a.artist.localeCompare(b.artist));

  weekendKicker.textContent = formatWeekendKicker(saturday, sunday);
  weekendTitle.textContent = formatWeekendTitle(saturday, sunday);
  weekendCopy.textContent = `다가오는 주말 한국에서 열리는 J-POP 공연 ${events.length}개를 바로 확인하세요.`;
  weekendSpotlight.hidden = false;

  weekendEvents.innerHTML = events.map(schedule => {
    const photoUrl = window.JLIVE_ARTIST_IMAGES.localUrl(schedule);
    return `
      <a class="weekend-card" href="./events/${encodeURIComponent(schedule.id)}"
        aria-label="${escapeHtml(schedule.artist)} ${escapeHtml(formatDate(schedule.concertDate))} 공연 상세 보기">
        ${photoUrl ? `<img src="${escapeHtml(photoUrl)}" alt="" loading="eager">` : ""}
        <span class="weekend-card-shade"></span>
        <span class="weekend-card-content">
          <small>${escapeHtml(formatDate(schedule.concertDate))} · ${escapeHtml(schedule.time || "시간 미정")}</small>
          <strong>${escapeHtml(schedule.artist)}</strong>
          <em>${escapeHtml(schedule.venue)}</em>
        </span>
        <span class="weekend-card-arrow" aria-hidden="true">↗</span>
      </a>`;
  }).join("");

  weekendEvents.querySelectorAll("img").forEach((image, index) => {
    image.addEventListener("error", () => {
      const remoteUrl = window.JLIVE_ARTIST_IMAGES.remoteUrl(events[index]);
      if (remoteUrl && image.src !== remoteUrl) {
        image.src = remoteUrl;
        return;
      }
      image.hidden = true;
    });
  });
}

function updateSaveButtons(schedule) {
  const eventSaved = savedFavorites.events.includes(schedule.id);
  const artistSaved = savedFavorites.artists.includes(schedule.artist);
  saveEventButton.setAttribute("aria-pressed", String(eventSaved));
  saveArtistButton.setAttribute("aria-pressed", String(artistSaved));
  saveEventButton.textContent = eventSaved ? "✓ 공연 저장됨" : "＋ 공연 저장";
  saveArtistButton.textContent = artistSaved ? "♥ 관심 아티스트" : "♡ 아티스트 관심";
}

function renderMyShows() {
  const today = dateKey(new Date());
  const upcoming = window.JLIVE_FAVORITES.upcoming(schedules, savedFavorites, today);
  const savedCount = savedFavorites.artists.length + savedFavorites.events.length;
  const now = parseDate(today);
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const mondayKey = dateKey(monday);
  const sundayKey = dateKey(sunday);
  const matchesSaved = schedule => savedFavorites.events.includes(schedule.id) || savedFavorites.artists.includes(schedule.artist);
  const weeklySales = schedules.reduce((count, schedule) => count
    + (matchesSaved(schedule) && schedule.presaleDate >= mondayKey && schedule.presaleDate <= sundayKey ? 1 : 0)
    + (matchesSaved(schedule) && schedule.ticketDate >= mondayKey && schedule.ticketDate <= sundayKey ? 1 : 0), 0);

  myShowsSummary.textContent = savedCount
    ? `관심 아티스트 ${savedFavorites.artists.length}명 · 저장 공연 ${savedFavorites.events.length}개`
    : "로그인 없이 이 브라우저에만 저장됩니다.";
  myShowsUpcomingCount.textContent = String(upcoming.length);
  myShowsWeeklySales.textContent = String(weeklySales);
  myShowsAttendanceCount.textContent = String(window.JLIVE_ATTENDANCE.summarize(attendanceLog).shows);

  myShowsFeature.hidden = upcoming.length === 0;
  if (upcoming.length) {
    const nextShow = upcoming[0];
    const daysUntil = Math.max(0, Math.round((parseDate(nextShow.concertDate) - parseDate(today)) / 86400000));
    const localPhoto = window.JLIVE_ARTIST_IMAGES.localUrl(nextShow);
    const remotePhoto = window.JLIVE_ARTIST_IMAGES.remoteUrl(nextShow);
    myShowsFeature.href = `./events/${encodeURIComponent(nextShow.id)}`;
    myShowsFeatureArtist.textContent = nextShow.artist;
    myShowsFeatureMeta.textContent = `${formatDate(nextShow.concertDate)} · ${nextShow.venue}`;
    myShowsFeatureDday.textContent = daysUntil ? `D-${daysUntil}` : "D-DAY";
    myShowsFeatureImage.alt = `${nextShow.artist} 프로필`;
    myShowsFeatureImage.src = localPhoto || remotePhoto;
    myShowsFeatureImage.hidden = !localPhoto && !remotePhoto;
    myShowsFeatureImage.onerror = () => {
      if (remotePhoto && myShowsFeatureImage.src !== remotePhoto) {
        myShowsFeatureImage.src = remotePhoto;
        return;
      }
      myShowsFeatureImage.hidden = true;
    };
  }

  savedArtists.hidden = savedFavorites.artists.length === 0;
  savedArtists.innerHTML = savedFavorites.artists.map(artist => `
    <span><b>${escapeHtml(artist)}</b><button type="button" data-remove-artist="${escapeHtml(artist)}"
      aria-label="${escapeHtml(artist)} 관심 해제">×</button></span>
  `).join("");

  myShowsEmpty.hidden = upcoming.length > 0;
  myShowsEmpty.innerHTML = savedCount
    ? "<strong>저장한 항목의 예정 공연이 없습니다.</strong><span>새 내한 일정이 추가되면 이곳에 자동으로 표시됩니다.</span>"
    : "<strong>아직 저장한 공연이 없습니다.</strong><span>달력에서 공연을 선택한 뒤 공연이나 아티스트를 저장해 보세요.</span><a href=\"#calendar\">캘린더에서 찾기</a>";

  myShowEvents.innerHTML = upcoming.map(schedule => {
    const savedByArtist = savedFavorites.artists.includes(schedule.artist);
    const savedEvent = savedFavorites.events.includes(schedule.id);
    return `
      <article class="my-show-card">
        <button class="my-show-open" type="button" data-open-saved="${escapeHtml(schedule.id)}">
          <span class="my-show-card-top">
            <small>${escapeHtml(savedByArtist ? "관심 아티스트" : "저장 공연")}</small>
            <time>${escapeHtml(formatDate(schedule.concertDate))}</time>
          </span>
          <strong>${escapeHtml(schedule.artist)}</strong>
          <em>${escapeHtml(schedule.venue)} · ${escapeHtml(schedule.time || "시간 미정")}</em>
          <span class="my-show-sales">
            <span><i class="presale"></i>선예매 <b>${escapeHtml(formatScheduleDate(schedule.presaleDate, schedule.presaleTime))}</b></span>
            <span><i class="ticket"></i>일반예매 <b>${escapeHtml(formatScheduleDate(schedule.ticketDate, schedule.ticketTime))}</b></span>
          </span>
        </button>
        ${savedEvent ? `<button class="my-show-remove" type="button" data-remove-event="${escapeHtml(schedule.id)}"
          aria-label="${escapeHtml(schedule.artist)} 공연 저장 해제">저장 해제</button>` : ""}
      </article>`;
  }).join("");
  renderAlertPlan();
}

function renderAlertPlan() {
  const rows = window.JLIVE_ALERTS.upcoming(schedules, savedFavorites, dateKey(new Date()));
  myShowsAlerts.hidden = rows.length === 0;
  alertPlan.innerHTML = rows.map(row => `<span><b>${escapeHtml(formatDate(row.date))}</b> · ${escapeHtml(row.artist)} ${escapeHtml(row.label)} ${escapeHtml(row.time || "")}</span>`).join("");
  if (!("Notification" in window)) {
    alertButton.hidden = true;
    return;
  }
  const active = alertSettings.enabled && Notification.permission === "granted";
  alertButton.hidden = false;
  alertButton.setAttribute("aria-pressed", String(active));
  alertButton.textContent = Notification.permission === "denied" ? "브라우저에서 알림 차단됨" : active ? "예매 알림 켜짐" : "예매 알림 켜기";
}

async function sendDueAlerts() {
  if (!alertSettings.enabled || !("Notification" in window) || Notification.permission !== "granted") return;
  const due = window.JLIVE_ALERTS.buildAlerts(schedules, updates, savedFavorites, dateKey(new Date()))
    .filter(alert => !alertSettings.sent.includes(alert.id));
  if (!due.length) return;
  const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.ready.catch(() => null) : null;
  for (const alert of due) {
    const options = { body: alert.body, icon: "./assets/brand/j-live-app-logo.png", data: { url: alert.url } };
    if (registration) await registration.showNotification(alert.title, options);
    else new Notification(alert.title, options);
  }
  alertSettings = window.JLIVE_ALERTS.write({ ...alertSettings, sent: [...alertSettings.sent, ...due.map(alert => alert.id)] });
}

function renderAttendanceRanking() {
  if (!attendanceRanking) return;
  const today = dateKey(new Date());
  const ranked = schedules
    .filter(schedule => schedule.concertDate < today
      && Number.isFinite(schedule.attendance)
      && schedule.attendance > 0
      && schedule.attendanceSource)
    .sort((a, b) => b.attendance - a.attendance)
    .slice(0, 1);

  attendanceRanking.innerHTML = ranked.map((schedule, index) => `
    <li>
      <span class="rank">${index + 1}</span>
      <div>
        <a href="./events/${encodeURIComponent(schedule.id)}"><strong>${escapeHtml(schedule.artist)}</strong></a>
        <small>${escapeHtml(schedule.attendanceScope || formatDate(schedule.concertDate))} · ${escapeHtml(schedule.venue)}</small>
        <a class="attendance-source" href="${escapeHtml(schedule.attendanceSource)}" target="_blank" rel="noopener noreferrer">출처 · ${escapeHtml(schedule.attendanceVerifiedAt || "검증일 미정")} ↗</a>
      </div>
      <b>${schedule.attendance.toLocaleString("ko-KR")}명</b>
    </li>
  `).join("");
  attendanceEmpty.hidden = ranked.length > 0;
}

function renderCalendar() {
  calendar.innerHTML = "";
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  document.querySelector("#monthTitle").textContent = `${year}년 ${month + 1}월`;
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  let visibleCount = 0;

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = dateKey(date);
    const events = eventsForDate(key);
    if (date.getMonth() === month) visibleCount += events.length;
    const day = document.createElement("article");
    day.className = [
      "day",
      date.getMonth() !== month ? "outside" : "",
      events.length ? "has-event" : "",
      key === dateKey(new Date()) ? "today" : "",
      key === selectedDateKey ? "selected" : ""
    ].filter(Boolean).join(" ");
    day.dataset.date = key;
    day.tabIndex = 0;
    day.setAttribute("role", "gridcell");
    day.setAttribute("aria-selected", String(key === selectedDateKey));
    day.setAttribute("aria-label", `${formatDate(key)}${events.length ? `, 일정 ${events.length}개` : ", 등록된 일정 없음"}`);
    if (events.length > 2) {
      const visibleRows = Math.min(events.length, 6);
      const expandedStackHeight = Math.max(150, visibleRows * 27 - 5);
      day.classList.add("has-many");
      day.style.setProperty("--expanded-stack-height", `${expandedStackHeight}px`);
      day.style.setProperty("--expand-by", `${Math.max(96, expandedStackHeight - 44)}px`);
    }
    day.innerHTML = `<span class="day-number">${date.getDate()}</span><div class="event-stack"></div>`;
    const stack = day.querySelector(".event-stack");

    events.forEach(({ type, schedule }) => {
      if (!filters.has(type)) return;
      const chip = document.createElement("a");
      chip.href = `./events/${encodeURIComponent(schedule.id)}`;
      chip.className = `event-chip ${type}`;
      chip.innerHTML = `<span>${escapeHtml(typeLabel(type, schedule))}</span><span>${escapeHtml(schedule.artist)}</span>`;
      chip.addEventListener("click", () => window.JLIVE_ANALYTICS.track("event_detail_open", {
        event_id: schedule.id,
        artist: schedule.artist,
        source: "calendar"
      }));
      stack.append(chip);
    });
    calendar.append(day);
  }
  document.querySelector("#emptyCalendar").hidden = visibleCount > 0;
}

function renderLineup(key) {
  const lineup = document.querySelector("#dayLineup");
  lineup.innerHTML = eventsForDate(key).map(({ type, schedule }) => `
    <button type="button" class="lineup-button ${schedule.id === selectedId && type === selectedType ? "active" : ""}"
      data-id="${escapeHtml(schedule.id)}" data-type="${type}">
      <strong>${escapeHtml(schedule.artist)}</strong>
      <small>${escapeHtml(typeLabel(type, schedule))} · ${escapeHtml(schedule.time || "시간 미정")}</small>
    </button>`).join("");
}

function renderDetail(schedule, type) {
  document.querySelector("#detailEmpty").hidden = true;
  document.querySelector("#detailBody").hidden = false;
  document.querySelector("#detailLabel").textContent = typeLabel(type, schedule);
  document.querySelector("#detailGenre").textContent = schedule.genre || "J-POP";
  document.querySelector("#detailArtist").textContent = schedule.artist;
  document.querySelector("#detailDate").textContent = `${formatDate(schedule.concertDate)} · ${schedule.time || "시간 미정"}`;
  document.querySelector("#detailVenue").textContent = schedule.venue;
  document.querySelector("#detailPresale").textContent = formatScheduleDate(schedule.presaleDate, schedule.presaleTime);
  document.querySelector("#detailTicket").textContent = formatScheduleDate(schedule.ticketDate, schedule.ticketTime);
  document.querySelector("#detailVendor").textContent = schedule.vendor || "미정";
  document.querySelector("#verifiedAt").textContent = schedule.verifiedAt ? `마지막 확인 ${schedule.verifiedAt}` : "";
  document.querySelector("#sourceLinks").innerHTML = (schedule.sources || []).map((url, index) =>
    `<a class="source-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">공식 출처 ${index + 1} ↗</a>`
  ).join("");

  const photo = document.querySelector("#artistPhoto");
  photo.alt = `${schedule.artist} YouTube 프로필`;
  photo.hidden = !schedule.youtubeChannel && !schedule.youtubeProfileImage;
  const localPhoto = window.JLIVE_ARTIST_IMAGES.localUrl(schedule);
  const remotePhoto = window.JLIVE_ARTIST_IMAGES.remoteUrl(schedule);
  photo.src = localPhoto || remotePhoto;
  photo.onerror = () => {
    if (remotePhoto && photo.src !== remotePhoto) {
      photo.src = remotePhoto;
      return;
    }
    photo.hidden = true;
  };

  const songs = Array.isArray(schedule.songs) ? schedule.songs : [];
  document.querySelector("#songsSection").hidden = songs.length === 0;
  document.querySelector("#songList").innerHTML = songs.map(song => `
    <a class="song" href="${escapeHtml(song[2])}" target="_blank" rel="noopener noreferrer">
      <span class="play">▶</span><span>${escapeHtml(song[0])}</span><em>${escapeHtml(song[1] || "")}</em>
    </a>`).join("");

  const ticketButton = document.querySelector("#ticketButton");
  ticketButton.hidden = !schedule.vendorUrl;
  ticketButton.href = schedule.vendorUrl || "#";
  document.querySelector("#detailPageButton").href = `./events/${encodeURIComponent(schedule.id)}`;
  updateSaveButtons(schedule);
}

function openMobileDetail() {
  if (!mobileQuery.matches) return;
  document.body.classList.add("mobile-detail-open");
}

function closeMobileDetail() {
  document.body.classList.remove("mobile-detail-open");
}

function selectSchedule(schedule, type = "concert", key = schedule.concertDate, openDetail = true) {
  selectedId = schedule.id;
  selectedType = type;
  selectedDateKey = key;
  renderDetail(schedule, type);
  renderLineup(key);
  renderCalendar();
  if (openDetail) openMobileDetail();
}

function selectCalendarDate(key) {
  const firstEvent = eventsForDate(key).find(({ type }) => filters.has(type));
  if (firstEvent) {
    selectSchedule(firstEvent.schedule, firstEvent.type, key);
    return;
  }
  selectedId = "";
  selectedType = "concert";
  selectedDateKey = key;
  document.querySelector("#detailBody").hidden = true;
  const empty = document.querySelector("#detailEmpty");
  empty.hidden = false;
  empty.innerHTML = `<strong>${escapeHtml(formatDate(key))}</strong><span>이 날짜에는 등록된 공연이나 예매 일정이 없습니다.</span>`;
  renderCalendar();
  window.JLIVE_ANALYTICS.track("calendar_empty_date_select", { date: key });
  openMobileDetail();
}

document.querySelector("#dayLineup").addEventListener("click", event => {
  const button = event.target.closest("[data-id]");
  if (!button) return;
  const schedule = schedules.find(item => item.id === button.dataset.id);
  if (schedule) selectSchedule(schedule, button.dataset.type, selectedDateKey);
});

function saveFavorites(next) {
  savedFavorites = window.JLIVE_FAVORITES.write(next);
  window.dispatchEvent(new CustomEvent("jlive:favorites-changed", { detail: savedFavorites }));
  window.JLIVE_EMAIL_ALERTS?.sync(savedFavorites).catch(() => {});
  window.JLIVE_ANALYTICS.track("favorites_snapshot", { events: savedFavorites.events.length, artists: savedFavorites.artists.length });
  renderMyShows();
  const selected = schedules.find(schedule => schedule.id === selectedId);
  if (selected) updateSaveButtons(selected);
}

saveEventButton.addEventListener("click", () => {
  if (!selectedId) return;
  const saving = !savedFavorites.events.includes(selectedId);
  saveFavorites({
    ...savedFavorites,
    events: window.JLIVE_FAVORITES.toggle(savedFavorites.events, selectedId)
  });
  if (saving) window.JLIVE_ANALYTICS.track("favorite_save", { type: "events", event_id: selectedId });
});

saveArtistButton.addEventListener("click", () => {
  const schedule = schedules.find(item => item.id === selectedId);
  if (!schedule) return;
  const saving = !savedFavorites.artists.includes(schedule.artist);
  saveFavorites({
    ...savedFavorites,
    artists: window.JLIVE_FAVORITES.toggle(savedFavorites.artists, schedule.artist)
  });
  if (saving) window.JLIVE_ANALYTICS.track("favorite_save", { type: "artists", artist: schedule.artist });
});

alertButton.addEventListener("click", async () => {
  if (!("Notification" in window) || Notification.permission === "denied") return;
  if (alertSettings.enabled && Notification.permission === "granted") {
    alertSettings = window.JLIVE_ALERTS.write({ ...alertSettings, enabled: false });
    renderAlertPlan();
    return;
  }
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  alertSettings = window.JLIVE_ALERTS.write({ ...alertSettings, enabled: permission === "granted" });
  renderAlertPlan();
  await sendDueAlerts();
});

savedArtists.addEventListener("click", event => {
  const button = event.target.closest("[data-remove-artist]");
  if (!button) return;
  saveFavorites({
    ...savedFavorites,
    artists: savedFavorites.artists.filter(artist => artist !== button.dataset.removeArtist)
  });
});

myShowEvents.addEventListener("click", event => {
  const removeButton = event.target.closest("[data-remove-event]");
  if (removeButton) {
    saveFavorites({
      ...savedFavorites,
      events: savedFavorites.events.filter(id => id !== removeButton.dataset.removeEvent)
    });
    return;
  }

  const openButton = event.target.closest("[data-open-saved]");
  const schedule = openButton && schedules.find(item => item.id === openButton.dataset.openSaved);
  if (!schedule) return;
  viewDate = parseDate(schedule.concertDate);
  selectSchedule(schedule, "concert", schedule.concertDate);
  document.querySelector(".app").scrollIntoView({ behavior: "smooth", block: "start" });
});

attendanceAddButton.addEventListener("click", () => {
  if (attendanceFormWrap.hidden) openAttendanceForm();
  else closeAttendanceForm();
});
attendanceCancelButton.addEventListener("click", closeAttendanceForm);
attendanceForm.addEventListener("input", updateAttendanceFormTotal);
attendanceEventSearch.addEventListener("focus", renderAttendanceEventSearch);
attendanceEventSearch.addEventListener("input", () => {
  attendanceForm.elements.eventId.value = "";
  attendanceEventSearch.setCustomValidity("");
  renderAttendanceEventSearch();
});
attendanceEventSearch.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  attendanceEventResults.hidden = true;
  attendanceEventSearch.setAttribute("aria-expanded", "false");
});
attendanceEventResults.addEventListener("click", event => {
  const button = event.target.closest("[data-attendance-event]");
  if (!button) return;
  selectAttendanceEvent(schedules.find(schedule => schedule.id === button.dataset.attendanceEvent));
});
attendanceForm.addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(attendanceForm);
  const schedule = schedules.find(item => item.id === data.get("eventId"));
  const existing = attendanceLog.find(record => record.id === data.get("recordId"));
  const keepsUnavailableEvent = existing && data.get("eventId") === existing.eventId;
  if (!schedule && !keepsUnavailableEvent) {
    attendanceEventSearch.setCustomValidity("검색 결과에서 관람한 공연을 선택해 주세요.");
    attendanceEventSearch.reportValidity();
    return;
  }
  const record = {
    id: existing?.id || `${data.get("eventId")}-${Date.now()}`,
    eventId: data.get("eventId"),
    artist: schedule?.artist || existing?.artist,
    venue: schedule?.venue || existing?.venue,
    concertDate: schedule?.concertDate || existing?.concertDate,
    seat: data.get("seat"),
    unitPrice: data.get("unitPrice"),
    quantity: data.get("quantity"),
    createdAt: existing?.createdAt || new Date().toISOString()
  };
  attendanceLog = window.JLIVE_ATTENDANCE.write(window.JLIVE_ATTENDANCE.upsert(attendanceLog, record));
  window.JLIVE_ANALYTICS.track("attendance_record_save", { edit: Boolean(existing) });
  closeAttendanceForm();
  renderAttendanceLog();
  renderMyShows();
});
attendanceRecords.addEventListener("click", event => {
  const editButton = event.target.closest("[data-edit-attendance]");
  if (editButton) {
    const record = attendanceLog.find(item => item.id === editButton.dataset.editAttendance);
    if (record) openAttendanceForm(record);
    return;
  }
  const deleteButton = event.target.closest("[data-delete-attendance]");
  if (!deleteButton || !window.confirm("이 관람 기록을 삭제할까요?")) return;
  attendanceLog = window.JLIVE_ATTENDANCE.write(window.JLIVE_ATTENDANCE.remove(attendanceLog, deleteButton.dataset.deleteAttendance));
  window.JLIVE_ANALYTICS.track("attendance_record_delete");
  renderAttendanceLog();
  renderMyShows();
});

artistSearch.addEventListener("input", renderArtistSearch);
artistSearch.addEventListener("input", () => {
  clearTimeout(emptySearchTimer);
  const value = artistSearch.value.trim();
  emptySearchTimer = setTimeout(() => {
    const query = normalizeSearchText(value);
    const match = schedules.find(schedule =>
      [schedule.artist, ...(artistAliases[schedule.artist] || [])].some(name => normalizeSearchText(name).includes(query)));
    if (query && value === artistSearch.value.trim() && match) {
      window.JLIVE_ANALYTICS.track("artist_search", { artist: match.artist });
    } else if (query && value === artistSearch.value.trim()) {
      const searchTerm = window.JLIVE_ANALYTICS.safeSearchTerm(value);
      if (searchTerm) window.JLIVE_ANALYTICS.track("empty_search", {
        search_term: searchTerm,
        search_language: window.JLIVE_ANALYTICS.searchLanguage(searchTerm),
        term_length: [...searchTerm].length
      });
    }
  }, 800);
});
artistSearch.addEventListener("focus", renderArtistSearch);
artistSearch.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  artistSearch.value = "";
  renderArtistSearch();
});
artistSearchResults.addEventListener("click", event => {
  const button = event.target.closest("[data-id]");
  const schedule = button && schedules.find(item => item.id === button.dataset.id);
  if (!schedule) return;
  window.JLIVE_ANALYTICS.track("artist_result_open", { artist: schedule.artist });
  viewDate = parseDate(schedule.concertDate);
  artistSearchResults.hidden = true;
  artistSearch.setAttribute("aria-expanded", "false");
  selectSchedule(schedule, "concert", schedule.concertDate);
});

document.querySelector("#ticketButton").addEventListener("click", () => {
  const schedule = schedules.find(item => item.id === selectedId);
  if (schedule) window.JLIVE_ANALYTICS.track("ticket_click", {
    vendor: schedule.vendor || "미정",
    event_id: schedule.id,
    artist: schedule.artist,
    link_url: schedule.vendorUrl
  });
});

document.querySelector("#detailPageButton").addEventListener("click", () => {
  const schedule = schedules.find(item => item.id === selectedId);
  if (schedule) window.JLIVE_ANALYTICS.track("event_detail_open", { event_id: schedule.id, artist: schedule.artist });
});

document.querySelectorAll(".filter").forEach(button => button.addEventListener("click", () => {
  filters.has(button.dataset.type) ? filters.delete(button.dataset.type) : filters.add(button.dataset.type);
  button.classList.toggle("active", filters.has(button.dataset.type));
  renderCalendar();
}));

document.querySelector("#prevMonth").addEventListener("click", () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  renderCalendar();
});
document.querySelector("#nextMonth").addEventListener("click", () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  renderCalendar();
});
document.querySelector("#notifyButton").addEventListener("click", async event => {
  try {
    await navigator.clipboard.writeText(location.href);
    event.currentTarget.textContent = "주소 복사 완료";
  } catch {
    event.currentTarget.textContent = "주소창에서 복사해 주세요";
  }
  setTimeout(() => { event.currentTarget.textContent = "일정 공유"; }, 1800);
});
document.querySelector("#closeDetail").addEventListener("click", closeMobileDetail);
document.querySelector("#mobileDetailBackdrop").addEventListener("click", closeMobileDetail);
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeMobileDetail();
});
mobileQuery.addEventListener("change", event => {
  if (!event.matches) closeMobileDetail();
});
window.addEventListener("storage", event => {
  if (event.key === window.JLIVE_FAVORITES.STORAGE_KEY) {
    savedFavorites = window.JLIVE_FAVORITES.read();
    renderMyShows();
    const selected = schedules.find(schedule => schedule.id === selectedId);
    if (selected) updateSaveButtons(selected);
  }
  if (event.key === window.JLIVE_ATTENDANCE.STORAGE_KEY) {
    attendanceLog = window.JLIVE_ATTENDANCE.read();
    renderAttendanceLog();
    renderMyShows();
  }
});

calendar.addEventListener("mousemove", event => {
  if (innerWidth <= 820) return;
  const hoveredDay = event.target.closest(".day");
  document.querySelectorAll(".day").forEach(day => {
    if (hoveredDay) {
      day.style.setProperty("--scale", day === hoveredDay ? "1.045" : "1");
      day.style.setProperty("--z", day === hoveredDay ? "20" : "1");
      return;
    }
    const rect = day.getBoundingClientRect();
    const distance = Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2));
    const influence = Math.max(0, 1 - distance / 175);
    day.style.setProperty("--scale", (1 + influence * .13).toFixed(3));
    day.style.setProperty("--z", String(Math.round(influence * 10) + 1));
  });
});
calendar.addEventListener("mouseleave", () => document.querySelectorAll(".day").forEach(day => {
  day.style.removeProperty("--scale");
  day.style.removeProperty("--z");
}));
calendar.addEventListener("click", event => {
  if (event.target.closest(".event-chip")) return;
  const day = event.target.closest(".day");
  if (day) selectCalendarDate(day.dataset.date);
});
calendar.addEventListener("keydown", event => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const day = event.target.closest(".day");
  if (!day || event.target.closest(".event-chip")) return;
  event.preventDefault();
  selectCalendarDate(day.dataset.date);
});

async function initialize() {
  try {
    let response;
    try {
      response = await fetch("/api/events", { cache: "no-store" });
      if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
        throw new Error("API response is unavailable");
      }
    } catch {
      response = await fetch("./data/events.json", { cache: "no-store" });
    }
    if (!response.ok) throw new Error("공연 데이터를 불러오지 못했습니다.");
    schedules = (await response.json()).filter(event => event.status === "confirmed");
    const [aliasResponse, updateResponse] = await Promise.all([
      fetch("./data/artist-aliases.json", { cache: "no-store" }).catch(() => null),
      fetch("./data/updates.json", { cache: "no-store" }).catch(() => null)
    ]);
    artistAliases = aliasResponse?.ok ? await aliasResponse.json() : {};
    updates = updateResponse?.ok ? await updateResponse.json() : [];
    schedules.sort((a, b) => a.concertDate.localeCompare(b.concertDate));
    window.JLIVE_ARTIST_IMAGES.preload(schedules);
    renderWeekendSpotlight();
    renderMyShows();
    renderAttendanceLog();
    window.JLIVE_ANALYTICS.track("favorites_snapshot", { events: savedFavorites.events.length, artists: savedFavorites.artists.length });
    await sendDueAlerts();
    renderAttendanceRanking();
    const upcoming = schedules.find(event => event.concertDate >= dateKey(new Date())) || schedules[0];
    if (!upcoming) {
      document.querySelector("#detailEmpty").innerHTML = "<strong>공식 확인된 공연이 없습니다.</strong><span>새로운 일정이 확인되면 이곳에 표시됩니다.</span>";
      renderCalendar();
      return;
    }
    viewDate = parseDate(upcoming.concertDate);
    selectSchedule(upcoming, "concert", upcoming.concertDate, false);
  } catch (error) {
    document.querySelector("#detailEmpty").innerHTML = `<strong>데이터 연결 오류</strong><span>${escapeHtml(error.message)}</span>`;
    renderCalendar();
  }
}
initialize();

{
  const originalShareButton = document.querySelector("#notifyButton");
  const shareButton = originalShareButton.cloneNode(true);
  originalShareButton.replaceWith(shareButton);

  shareButton.addEventListener("click", async () => {
    const shareData = {
      title: document.title || "J-LIVE Korea",
      text: "J-POP 내한 공연 일정을 확인해보세요.",
      url: location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        shareButton.textContent = "공유창 열림";
        window.JLIVE_ANALYTICS.track("schedule_share", { method: "web_share", content_type: "calendar" });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(location.href);
        shareButton.textContent = "주소 복사 완료";
        window.JLIVE_ANALYTICS.track("schedule_share", { method: "clipboard", content_type: "calendar" });
      } else {
        prompt("이 주소를 복사해 주세요.", location.href);
        shareButton.textContent = "주소 복사";
        window.JLIVE_ANALYTICS.track("schedule_share", { method: "prompt", content_type: "calendar" });
      }
    } catch (error) {
      shareButton.textContent = error.name === "AbortError" ? "공유 취소됨" : "주소창에서 복사해 주세요";
    }

    setTimeout(() => {
      shareButton.textContent = "일정 공유";
    }, 1800);
  });
}
