"use strict";

(function exposeFavorites(root) {
  const STORAGE_KEY = "j-live-favorites-v1";
  const empty = () => ({ artists: [], events: [] });
  const uniqueStrings = values => [...new Set((Array.isArray(values) ? values : [])
    .filter(value => typeof value === "string" && value.trim())
    .map(value => value.trim()))];

  function normalize(value) {
    return {
      artists: uniqueStrings(value?.artists),
      events: uniqueStrings(value?.events)
    };
  }

  function read(storage) {
    try {
      return normalize(JSON.parse((storage || root.localStorage).getItem(STORAGE_KEY) || "null"));
    } catch {
      return empty();
    }
  }

  function write(value, storage) {
    const normalized = normalize(value);
    try {
      (storage || root.localStorage).setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      return normalized;
    }
    return normalized;
  }

  function toggle(values, value) {
    return values.includes(value)
      ? values.filter(item => item !== value)
      : [...values, value];
  }

  function upcoming(schedules, favorites, today) {
    const saved = normalize(favorites);
    return schedules
      .filter(schedule => schedule.concertDate >= today
        && (saved.events.includes(schedule.id) || saved.artists.includes(schedule.artist)))
      .sort((a, b) => a.concertDate.localeCompare(b.concertDate)
        || (a.time || "").localeCompare(b.time || "")
        || a.artist.localeCompare(b.artist));
  }

  const api = { STORAGE_KEY, normalize, read, toggle, upcoming, write };
  root.JLIVE_FAVORITES = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window === "object" ? window : globalThis);
