"use strict";

const form = document.querySelector("#eventForm");
const cards = document.querySelector("#cards");
const message = document.querySelector("#message");
const statusLabels = { pending: "검수 중", confirmed: "확정", rejected: "반려" };
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
})[char]);

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "요청을 처리하지 못했습니다.");
  return data;
}

async function loadEvents() {
  const events = await request("/api/events");
  const totals = events.reduce((result, event) => {
    result[event.status] = (result[event.status] || 0) + 1;
    return result;
  }, {});
  document.querySelector("#counts").innerHTML = ["pending", "confirmed", "rejected"]
    .map(status => `<span class="count">${statusLabels[status]} ${totals[status] || 0}</span>`).join("");

  const rank = { pending: 0, confirmed: 1, rejected: 2 };
  events.sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9) || b.concertDate.localeCompare(a.concertDate));
  cards.innerHTML = events.length ? events.map(event => `
    <article class="card">
      <div class="card-top">
        <div><h3>${escapeHtml(event.artist)}</h3>
          <div class="meta">${escapeHtml(event.concertDate)} · ${escapeHtml(event.venue)} · ${escapeHtml(event.vendor || "예매처 미정")}</div>
        </div>
        <span class="status ${escapeHtml(event.status)}">${statusLabels[event.status] || escapeHtml(event.status)}</span>
      </div>
      <div class="sources">${(event.sources || []).map((source, index) =>
        `<a class="source" href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">출처 ${index + 1}: ${escapeHtml(source)}</a>`
      ).join("") || '<span class="source">공식 출처 없음</span>'}</div>
      <div class="actions">
        <button class="action confirm" data-id="${event.id}" data-status="confirmed">확정</button>
        <button class="action" data-id="${event.id}" data-status="pending">검수 중</button>
        <button class="action" data-id="${event.id}" data-status="rejected">반려</button>
        <button class="action delete" data-id="${event.id}" data-delete>삭제</button>
      </div>
    </article>`).join("") : '<div class="empty">등록된 일정이 없습니다.</div>';
}

function showMessage(text, type = "") {
  message.className = `form-message ${type}`;
  message.textContent = text;
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(form));
  payload.sources = [payload.source1, payload.source2].filter(Boolean);
  delete payload.source1;
  delete payload.source2;
  try {
    showMessage("저장 중...");
    await request("/api/events", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    form.reset();
    showMessage("검수함에 저장했습니다.", "success");
    await loadEvents();
  } catch (error) { showMessage(error.message, "error"); }
});

cards.addEventListener("click", async event => {
  const button = event.target.closest("[data-id]");
  if (!button) return;
  try {
    if (button.hasAttribute("data-delete")) {
      await request(`/api/events/${encodeURIComponent(button.dataset.id)}`, { method: "DELETE" });
      showMessage("일정을 삭제했습니다.", "success");
    } else {
      await request("/api/events/status", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: button.dataset.id, status: button.dataset.status })
      });
      showMessage("상태를 변경했습니다.", "success");
    }
    await loadEvents();
  } catch (error) { showMessage(error.message, "error"); }
});

loadEvents().catch(error => { cards.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`; });
