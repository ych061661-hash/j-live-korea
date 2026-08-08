const state = { events: [], filter: "pending", selectedId: null };
const $ = selector => document.querySelector(selector);
const form = $("#eventForm");
const labels = { pending: "승인 대기", confirmed: "공개", cancelled: "취소", rejected: "반려" };

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const body = await response.json();
  if (!response.ok) throw new Error((body.errors || [body.error || "요청 실패"]).join("\n"));
  return body;
}

function showMessage(text, error = false) {
  const box = $("#message");
  box.textContent = text;
  box.classList.toggle("error", error);
  box.hidden = false;
}

function counts() {
  for (const status of ["pending", "confirmed", "cancelled", "rejected"]) {
    $(`#${status}Count`).textContent = state.events.filter(event => event.status === status).length;
  }
  $("#allCount").textContent = state.events.length;
}

function renderList() {
  counts();
  const query = $("#search").value.trim().toLowerCase();
  const today = new Date().toISOString().slice(0, 10);
  const events = state.events
    .filter(event => state.filter === "all" || event.status === state.filter)
    .filter(event => `${event.artist} ${event.venue} ${event.vendor}`.toLowerCase().includes(query))
    .sort((a, b) => Number(a.concertDate < today) - Number(b.concertDate < today) || a.concertDate.localeCompare(b.concertDate));
  $("#queueTitle").textContent = state.filter === "all" ? "전체 일정" : labels[state.filter];
  $("#eventList").innerHTML = events.length ? events.map(event => `
    <button class="event-card ${event.id === state.selectedId ? "active" : ""}" type="button" data-id="${escapeHtml(event.id)}">
      <div><time>${escapeHtml(event.concertDate)} · ${escapeHtml(event.time)}</time><strong>${escapeHtml(event.artist)}</strong></div>
      <span class="badge">${escapeHtml(labels[event.status] || event.status)}</span>
      <p>${escapeHtml(event.venue)} · ${escapeHtml(event.vendor)}</p>
    </button>`).join("") : '<p class="empty">해당 상태의 일정이 없습니다.</p>';
}

function setField(name, value = "") {
  const input = form.elements.namedItem(name);
  if (input) input.value = value ?? "";
}

function editEvent(event) {
  state.selectedId = event?.id || null;
  form.reset();
  for (const name of ["id", "artist", "genre", "concertDate", "time", "venue", "ticketDate", "ticketTime", "presaleDate", "presaleTime", "vendor", "vendorUrl", "price", "priceCurrency", "youtubeChannel", "verifiedAt", "status", "cancellationReason"]) {
    setField(name, event?.[name] ?? (name === "status" ? "pending" : name === "priceCurrency" ? "KRW" : ""));
  }
  setField("sources", (event?.sources || []).join("\n"));
  document.querySelectorAll("[data-song]").forEach((row, index) => {
    row.querySelector("[data-song-title]").value = event?.songs?.[index]?.[0] || "";
    row.querySelector("[data-song-duration]").value = event?.songs?.[index]?.[1] || "";
    row.querySelector("[data-song-url]").value = event?.songs?.[index]?.[2] || "";
  });
  form.elements.id.readOnly = Boolean(event);
  $("#editorTitle").textContent = event ? `${event.artist} 수정` : "공연 추가";
  $("#editorStatus").textContent = labels[event?.status || "pending"];
  $("#editorStatus").className = `status ${event?.status || "pending"}`;
  $("#cancellationField").hidden = event?.status !== "cancelled";
  $("#cancelEvent").disabled = !event;
  $("#rejectEvent").disabled = !event;
  $("#verifyEvent").disabled = !event;
  $("#approveEvent").disabled = !event;
  $("#message").hidden = true;
  renderList();
}

function formData() {
  const data = Object.fromEntries(new FormData(form));
  data.sources = data.sources.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
  data.songs = [...document.querySelectorAll("[data-song]")].map(row => [
    row.querySelector("[data-song-title]").value.trim(),
    row.querySelector("[data-song-duration]").value.trim(),
    row.querySelector("[data-song-url]").value.trim()
  ]).filter(song => song[0] || song[2]);
  return data;
}

async function save(data = formData(), message = "저장했습니다.") {
  try {
    const existing = Boolean(state.selectedId);
    const result = await api(existing ? `/api/events/${encodeURIComponent(state.selectedId)}` : "/api/events", {
      method: existing ? "PUT" : "POST",
      body: JSON.stringify(data)
    });
    await load(result.event.id);
    showMessage(message);
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function load(selectId = state.selectedId) {
  const result = await api("/api/events");
  state.events = result.events;
  counts();
  const selected = state.events.find(event => event.id === selectId);
  if (selected) editEvent(selected);
  else renderList();
}

document.querySelector(".summary").addEventListener("click", event => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  state.filter = button.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach(item => item.classList.toggle("active", item === button));
  renderList();
});
$("#eventList").addEventListener("click", event => {
  const card = event.target.closest("[data-id]");
  if (card) editEvent(state.events.find(item => item.id === card.dataset.id));
});
$("#search").addEventListener("input", renderList);
$("#newEvent").addEventListener("click", () => editEvent(null));
form.addEventListener("submit", event => { event.preventDefault(); save(); });
$("#verifyEvent").addEventListener("click", () => save({ ...formData(), verifiedAt: new Date().toISOString().slice(0, 10) }, "검증일을 갱신했습니다."));
$("#approveEvent").addEventListener("click", () => save({ ...formData(), status: "confirmed", verifiedAt: form.elements.verifiedAt.value || new Date().toISOString().slice(0, 10) }, "승인했습니다. 공개 데이터와 SEO 페이지를 갱신했습니다."));
$("#cancelEvent").addEventListener("click", () => {
  const reason = window.prompt("공식 취소 사유를 입력하세요.", form.elements.cancellationReason.value || "");
  if (reason?.trim()) save({ ...formData(), status: "cancelled", cancellationReason: reason.trim() }, "취소 처리했습니다. 공개 일정에서 제외했습니다.");
});
$("#rejectEvent").addEventListener("click", () => save({ ...formData(), status: "rejected" }, "후보를 반려했습니다."));

load().catch(error => showMessage(error.message, true));
