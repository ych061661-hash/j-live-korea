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

  function track(name, detail = {}, storage) {
    const data = read(storage);
    if (name === "artist_search") increment(data.searches, detail.artist);
    if (name === "empty_search") increment(data.emptySearches, detail.search_term);
    if (name === "ticket_click") increment(data.ticketClicks, detail.vendor);
    if (name === "favorite_save" && ["events", "artists"].includes(detail.type)) data.saves[detail.type] += 1;
    if (name === "favorites_snapshot") data.favorites = { events: Number(detail.events) || 0, artists: Number(detail.artists) || 0 };
    try {
      (storage || root.localStorage).setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
    if (typeof root.gtag === "function") root.gtag("event", name, detail);
    return data;
  }

  const api = { STORAGE_KEY, read, track };
  root.JLIVE_ANALYTICS = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window === "object" ? window : globalThis);
