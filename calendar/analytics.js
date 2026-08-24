"use strict";

(function exposeAnalytics(root) {
  const STORAGE_KEY = "j-live-analytics-v1";
  const empty = () => ({ searches: {}, emptySearches: {}, ticketClicks: {}, saves: { events: 0, artists: 0 }, favorites: { events: 0, artists: 0 } });

  function read(storage) {
    try {
      return { ...empty(), ...JSON.parse((storage || root.localStorage).getItem(STORAGE_KEY) || "null") };
    } catch {
      return empty();
    }
  }

  function increment(bucket, key) {
    if (!key) return;
    bucket[key] = (Number(bucket[key]) || 0) + 1;
  }

  function safeSearchTerm(value) {
    const term = String(value || "").normalize("NFKC").trim().replace(/\s+/g, " ").slice(0, 60);
    if (!term || /https?:\/\/|www\./i.test(term) || /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/.test(term)) return "";
    if ((term.match(/\d/g) || []).length >= 8) return "";
    return term;
  }

  function searchLanguage(value) {
    const term = String(value || "");
    const scripts = [/[가-힣]/.test(term), /[ぁ-んァ-ヶ一-龠々]/.test(term), /[A-Za-z]/.test(term)].filter(Boolean).length;
    if (scripts > 1) return "mixed";
    if (/[가-힣]/.test(term)) return "korean";
    if (/[ぁ-んァ-ヶ一-龠々]/.test(term)) return "japanese";
    if (/[A-Za-z]/.test(term)) return "latin";
    return "other";
  }

  function sanitizeDetail(name, detail = {}) {
    const safe = { ...detail };
    if (name === "email_alert_artist_select") delete safe.artist;
    return safe;
  }

  function track(name, detail = {}, storage) {
    const safeDetail = sanitizeDetail(name, detail);
    const data = read(storage);
    if (name === "artist_search") increment(data.searches, safeDetail.artist);
    if (name === "empty_search") increment(data.emptySearches, safeDetail.search_term);
    if (name === "ticket_click") increment(data.ticketClicks, safeDetail.vendor);
    if (name === "favorite_save" && ["events", "artists"].includes(safeDetail.type)) data.saves[safeDetail.type] += 1;
    if (name === "favorites_snapshot") data.favorites = { events: Number(safeDetail.events) || 0, artists: Number(safeDetail.artists) || 0 };
    try {
      (storage || root.localStorage).setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
    if (typeof root.gtag === "function") root.gtag("event", name, safeDetail);
    return data;
  }

  const api = { STORAGE_KEY, read, safeSearchTerm, sanitizeDetail, searchLanguage, track };
  root.JLIVE_ANALYTICS = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window === "object" ? window : globalThis);
