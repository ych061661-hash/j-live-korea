"use strict";

(function exposeAlerts(root) {
  const STORAGE_KEY = "j-live-alerts-v1";
  const specialKinds = new Set(["extra-show", "extra-seat", "restock", "cancellation", "postponement"]);
  const empty = () => ({ enabled: false, sent: [] });
  const dateAfter = (key, days) => {
    const [year, month, day] = key.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  const matches = (event, favorites) => favorites.events.includes(event.id) || favorites.artists.includes(event.artist);

  function read(storage) {
    try {
      const value = JSON.parse((storage || root.localStorage).getItem(STORAGE_KEY) || "null");
      return { enabled: Boolean(value?.enabled), sent: [...new Set(Array.isArray(value?.sent) ? value.sent.filter(String) : [])] };
    } catch {
      return empty();
    }
  }

  function write(value, storage) {
    const normalized = { enabled: Boolean(value?.enabled), sent: [...new Set(Array.isArray(value?.sent) ? value.sent.filter(String) : [])].slice(-300) };
    try {
      (storage || root.localStorage).setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch {}
    return normalized;
  }

  function buildAlerts(schedules, updates, favorites, today) {
    const tomorrow = dateAfter(today, 1);
    const alerts = [];
    for (const event of schedules.filter(item => matches(item, favorites))) {
      if (event.presaleDate === tomorrow) alerts.push({ id: `presale-${event.id}-${tomorrow}`, title: `${event.artist} 선예매 하루 전`, body: `${event.presaleTime || "시간 미정"} · ${event.vendor || "공식 예매처"}`, url: `/calendar/events/${event.id}` });
      if (event.ticketDate === tomorrow) alerts.push({ id: `ticket-${event.id}-${tomorrow}`, title: `${event.artist} ${event.ticketLabel || "일반예매"} 하루 전`, body: `${event.ticketTime || "시간 미정"} · ${event.vendor || "공식 예매처"}`, url: `/calendar/events/${event.id}` });
    }
    for (const update of updates.filter(item => item.date === today && specialKinds.has(item.kind))) {
      const event = schedules.find(item => item.id === update.eventId);
      if (event && matches(event, favorites)) alerts.push({ id: `update-${update.id}`, title: `${update.artist} · ${update.label}`, body: update.summary, url: `/calendar/updates` });
    }
    return alerts;
  }

  function upcoming(schedules, favorites, today) {
    const rows = [];
    for (const event of schedules.filter(item => matches(item, favorites))) {
      if (event.presaleDate >= today) rows.push({ id: `presale-${event.id}`, date: event.presaleDate, artist: event.artist, label: "선예매", time: event.presaleTime });
      if (event.ticketDate >= today) rows.push({ id: `ticket-${event.id}`, date: event.ticketDate, artist: event.artist, label: event.ticketLabel || "일반예매", time: event.ticketTime });
    }
    return rows.sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || "")).slice(0, 4);
  }

  const api = { STORAGE_KEY, buildAlerts, dateAfter, read, upcoming, write };
  root.JLIVE_ALERTS = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window === "object" ? window : globalThis);
