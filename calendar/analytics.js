"use strict";

(function exposeAnalytics(root) {
  const STORAGE_KEY = "j-live-analytics-v1";
  const empty = () => ({ searches: {}, emptySearches: {}, ticketClicks: {}, saves: { events: 0, artists: 0 }, favorites: { events: 0, artists: 0 } });

  function read(storage) {
    try {
      const stored = JSON.parse((storage || root.localStorage).getItem(STORAGE_KEY) || "null") || {};
      return {
        ...empty(),
        ...stored,
        emptySearches: sanitizeEmptySearches(stored.emptySearches)
      };
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

  function searchLengthBucket(value) {
    const length = [...String(value || "").normalize("NFKC").trim()].length;
    if (length === 0) return "0";
    if (length <= 4) return "1-4";
    if (length <= 10) return "5-10";
    if (length <= 20) return "11-20";
    return "21+";
  }

  function searchBucketKey(language, lengthBucket) {
    return `${language}:${lengthBucket}`;
  }

  function sanitizeEmptySearches(searches = {}) {
    const safe = {};
    for (const [storedKey, count] of Object.entries(searches || {})) {
      const currentBucket = storedKey.match(/^(korean|japanese|latin|mixed|other):(0|1-4|5-10|11-20|21\+)$/);
      const key = currentBucket
        ? storedKey
        : searchBucketKey(searchLanguage(storedKey), searchLengthBucket(storedKey));
      safe[key] = (Number(safe[key]) || 0) + (Number(count) || 0);
    }
    return safe;
  }

  function sanitizeDetail(name, detail = {}) {
    const safe = { ...detail };
    if (name === "email_alert_artist_select") delete safe.artist;
    if (name === "empty_search") {
      const term = String(detail.search_term || "");
      return term
        ? {
          search_language: searchLanguage(term),
          search_length_bucket: searchLengthBucket(term)
        }
        : {};
    }
    if (name === "favorite_save") {
      return ["events", "artists"].includes(detail.type) ? { type: detail.type } : {};
    }
    return safe;
  }

  function track(name, detail = {}, storage) {
    const safeDetail = sanitizeDetail(name, detail);
    const data = read(storage);
    if (name === "artist_search") increment(data.searches, safeDetail.artist);
    if (name === "empty_search" && safeDetail.search_language && safeDetail.search_length_bucket) {
      increment(data.emptySearches, searchBucketKey(safeDetail.search_language, safeDetail.search_length_bucket));
    }
    if (name === "ticket_click") increment(data.ticketClicks, safeDetail.vendor);
    if (name === "favorite_save" && ["events", "artists"].includes(safeDetail.type)) data.saves[safeDetail.type] += 1;
    if (name === "favorites_snapshot") data.favorites = { events: Number(safeDetail.events) || 0, artists: Number(safeDetail.artists) || 0 };
    try {
      (storage || root.localStorage).setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
    if (typeof root.gtag === "function") root.gtag("event", name, safeDetail);
    return data;
  }

  const api = { STORAGE_KEY, read, safeSearchTerm, sanitizeDetail, searchLanguage, searchLengthBucket, track };
  root.JLIVE_ANALYTICS = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window === "object" ? window : globalThis);
