"use strict";

(function exposeAttendance(root) {
  const STORAGE_KEY = "j-live-attendance-v1";
  const text = (value, max = 80) => String(value || "").trim().slice(0, max);
  const money = value => Math.max(0, Math.round(Number(value) || 0));
  const count = value => Math.min(20, Math.max(1, Math.round(Number(value) || 1)));

  function normalizeRecord(value) {
    const eventId = text(value?.eventId, 120);
    if (!eventId) return null;
    return {
      id: text(value?.id, 160) || `${eventId}-${Date.now()}`,
      eventId,
      artist: text(value?.artist),
      venue: text(value?.venue, 120),
      concertDate: /^\d{4}-\d{2}-\d{2}$/.test(value?.concertDate || "") ? value.concertDate : "",
      seat: text(value?.seat, 60) || "좌석 미입력",
      unitPrice: money(value?.unitPrice),
      quantity: count(value?.quantity),
      createdAt: text(value?.createdAt, 30) || new Date().toISOString()
    };
  }

  function normalize(value) {
    const records = Array.isArray(value) ? value.map(normalizeRecord).filter(Boolean) : [];
    return [...new Map(records.map(record => [record.id, record])).values()];
  }

  function read(storage) {
    try {
      return normalize(JSON.parse((storage || root.localStorage).getItem(STORAGE_KEY) || "[]"));
    } catch {
      return [];
    }
  }

  function write(value, storage) {
    const records = normalize(value);
    try { (storage || root.localStorage).setItem(STORAGE_KEY, JSON.stringify(records)); } catch {}
    return records;
  }

  const totalFor = record => record.unitPrice * record.quantity;

  function summarize(value) {
    const records = normalize(value);
    return {
      shows: new Set(records.map(record => record.eventId)).size,
      tickets: records.reduce((sum, record) => sum + record.quantity, 0),
      total: records.reduce((sum, record) => sum + totalFor(record), 0)
    };
  }

  function upsert(records, value) {
    const record = normalizeRecord(value);
    if (!record) return normalize(records);
    return normalize([...normalize(records).filter(item => item.id !== record.id), record]);
  }

  function remove(records, id) {
    return normalize(records).filter(record => record.id !== id);
  }

  const api = { STORAGE_KEY, normalize, read, remove, summarize, totalFor, upsert, write };
  root.JLIVE_ATTENDANCE = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window === "object" ? window : globalThis);
