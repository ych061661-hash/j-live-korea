const EXTRA_KINDS = new Set(["extra-seat", "extra-show", "restock"]);

export function dateAfter(key, days) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function normalizePreferences(value = {}) {
  const unique = items => [...new Set((Array.isArray(items) ? items : []).filter(item => typeof item === "string" && item.trim()).map(item => item.trim()))].slice(0, 100);
  const allowedKinds = new Set(["announcement", "presale", "ticket", "extra-seat"]);
  return {
    artists: unique(value.artists),
    events: unique(value.events),
    kinds: unique(value.kinds).filter(kind => allowedKinds.has(kind))
  };
}

function matches(event, preferences) {
  return preferences.events.includes(event.id) || preferences.artists.includes(event.artist);
}

export function buildEmailAlerts(events, updates, rawPreferences, today) {
  const preferences = normalizePreferences(rawPreferences);
  const tomorrow = dateAfter(today, 1);
  const yesterday = dateAfter(today, -1);
  const confirmed = events.filter(event => event.status === "confirmed");
  const byId = new Map(confirmed.map(event => [event.id, event]));
  const alerts = [];

  for (const event of confirmed.filter(item => matches(item, preferences))) {
    if (preferences.kinds.includes("presale") && event.presaleDate === tomorrow) {
      alerts.push({ id: `presale-${event.id}-${tomorrow}`, kind: "presale", artist: event.artist, title: `${event.artist} 선예매 하루 전`, body: `${event.presaleTime || "시간 미정"} · ${event.vendor || "공식 예매처"}`, url: `/calendar/events/${event.id}` });
    }
    const extraTicket = /추가|시야|취소표/.test(event.ticketLabel || "");
    if (event.ticketDate === tomorrow && preferences.kinds.includes(extraTicket ? "extra-seat" : "ticket")) {
      alerts.push({ id: `${extraTicket ? "extra" : "ticket"}-${event.id}-${tomorrow}`, kind: extraTicket ? "extra-seat" : "ticket", artist: event.artist, title: `${event.artist} ${event.ticketLabel || "일반예매"} 하루 전`, body: `${event.ticketTime || "시간 미정"} · ${event.vendor || "공식 예매처"}`, url: `/calendar/events/${event.id}` });
    }
  }

  for (const update of updates.filter(item => item.date >= yesterday && item.date <= today)) {
    const event = byId.get(update.eventId);
    if (!event || !matches(event, preferences)) continue;
    if (update.kind === "announcement" && preferences.kinds.includes("announcement")) {
      alerts.push({ id: `announcement-${update.id}`, kind: "announcement", artist: event.artist, title: `${event.artist} 신규 내한`, body: update.summary, url: `/calendar/events/${event.id}` });
    }
    if (EXTRA_KINDS.has(update.kind) && preferences.kinds.includes("extra-seat")) {
      alerts.push({ id: `update-${update.id}`, kind: "extra-seat", artist: event.artist, title: `${event.artist} · ${update.label}`, body: update.summary, url: "/calendar/updates" });
    }
  }
  return alerts.sort((a, b) => a.id.localeCompare(b.id));
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

export function renderAlertEmail(alerts, siteUrl, unsubscribeUrl) {
  const rows = alerts.map(alert => `<li style="margin:0 0 14px;padding:16px;border:1px solid #303238;border-radius:12px;list-style:none"><strong style="display:block;color:#d7ff4f">${escapeHtml(alert.title)}</strong><span style="display:block;margin-top:7px;color:#c4c5ca;line-height:1.6">${escapeHtml(alert.body)}</span><a href="${escapeHtml(siteUrl + alert.url)}" style="display:inline-block;margin-top:10px;color:#d7ff4f">자세히 보기</a></li>`).join("");
  return `<!doctype html><html lang="ko"><body style="margin:0;padding:28px;background:#0c0d10;color:#f4f2ed;font-family:Arial,sans-serif"><div style="max-width:620px;margin:auto"><p style="color:#d7ff4f;font-size:12px;font-weight:700">J-LIVE 맞춤 알림</p><h1 style="margin:8px 0 22px;font-size:28px">관심 아티스트의 새로운 일정</h1><ul style="margin:0;padding:0">${rows}</ul><p style="margin-top:28px;color:#888;font-size:12px;line-height:1.6">공식 예매처의 최신 정보를 다시 확인하세요.<br><a href="${escapeHtml(unsubscribeUrl)}" style="color:#aaa">이메일 알림 해지</a></p></div></body></html>`;
}
