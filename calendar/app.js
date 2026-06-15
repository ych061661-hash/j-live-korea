"use strict";

const typeLabels = { concert: "공연", ticket: "일반예매", presale: "선예매" };
const weekdays = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
const filters = new Set(Object.keys(typeLabels));
const calendar = document.querySelector("#calendar");
let schedules = [];
let selectedId = "";
let selectedType = "concert";
let selectedDateKey = "";
let viewDate = new Date();
const mobileQuery = window.matchMedia("(max-width: 820px)");

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
})[char]);

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
  return schedules.flatMap(schedule => [
    schedule.concertDate === key && { type: "concert", schedule },
    schedule.ticketDate === key && { type: "ticket", schedule },
    schedule.presaleDate === key && { type: "presale", schedule }
  ].filter(Boolean));
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
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `event-chip ${type}`;
      chip.innerHTML = `<span>${typeLabels[type]}</span><span>${escapeHtml(schedule.artist)}</span>`;
      chip.addEventListener("click", () => selectSchedule(schedule, type, key));
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
      <small>${typeLabels[type]} · ${escapeHtml(schedule.time || "시간 미정")}</small>
    </button>`).join("");
}

function renderDetail(schedule, type) {
  document.querySelector("#detailEmpty").hidden = true;
  document.querySelector("#detailBody").hidden = false;
  document.querySelector("#detailLabel").textContent = typeLabels[type];
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
  document.querySelector("#detailPageButton").href = `./events/${encodeURIComponent(schedule.id)}.html`;
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

document.querySelector("#dayLineup").addEventListener("click", event => {
  const button = event.target.closest("[data-id]");
  if (!button) return;
  const schedule = schedules.find(item => item.id === button.dataset.id);
  if (schedule) selectSchedule(schedule, button.dataset.type, selectedDateKey);
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

async function initialize() {
  try {
    let response = await fetch("/api/events", { cache: "no-store" });
    if (!response.ok) response = await fetch("./data/events.json", { cache: "no-store" });
    if (!response.ok) throw new Error("공연 데이터를 불러오지 못했습니다.");
    schedules = (await response.json()).filter(event => event.status === "confirmed");
    schedules.sort((a, b) => a.concertDate.localeCompare(b.concertDate));
    window.JLIVE_ARTIST_IMAGES.preload(schedules);
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
