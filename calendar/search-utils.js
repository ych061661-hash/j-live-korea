"use strict";

(function exposeSearchUtils(root) {
  function normalize(value) {
    return String(value || "")
      .normalize("NFKC")
      .toLocaleLowerCase()
      .replace(/[\s\p{P}\p{S}]/gu, "");
  }

  function fieldsFor(schedule, aliases = {}) {
    return [
      schedule.artist,
      ...(aliases[schedule.artist] || []),
      schedule.venue,
      schedule.concertDate,
      schedule.ticketDate,
      schedule.presaleDate
    ].filter(Boolean).map(normalize);
  }

  function findMatches(schedules, aliases, value) {
    const query = normalize(value);
    if (!query) return [];
    return schedules.filter(schedule => fieldsFor(schedule, aliases)
      .some(field => field.includes(query)));
  }

  function distance(left, right) {
    const row = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let i = 1; i <= left.length; i += 1) {
      let diagonal = row[0];
      row[0] = i;
      for (let j = 1; j <= right.length; j += 1) {
        const above = row[j];
        row[j] = left[i - 1] === right[j - 1]
          ? diagonal
          : Math.min(row[j] + 1, row[j - 1] + 1, diagonal + 1);
        diagonal = above;
      }
    }
    return row[right.length];
  }

  function suggestions(schedules, aliases, value, limit = 3) {
    const query = normalize(value);
    if (query.length < 2) return [];
    const threshold = query.length <= 4 ? 1 : query.length <= 8 ? 2 : 3;
    const candidates = new Map();
    schedules.forEach(schedule => {
      const names = [schedule.artist, ...(aliases[schedule.artist] || [])]
        .filter(Boolean)
        .map(name => ({ name, normalized: normalize(name) }));
      names.forEach(candidate => {
        const valueDistance = distance(query, candidate.normalized);
        const contains = candidate.normalized.includes(query) || query.includes(candidate.normalized);
        if (!contains && (valueDistance > threshold || valueDistance / Math.max(query.length, candidate.normalized.length) > 0.34)) return;
        const current = candidates.get(schedule.artist);
        if (!current || valueDistance < current.distance) candidates.set(schedule.artist, { schedule, distance: contains ? 0 : valueDistance });
      });
    });
    return [...candidates.values()]
      .sort((left, right) => left.distance - right.distance || left.schedule.artist.localeCompare(right.schedule.artist))
      .slice(0, limit)
      .map(item => item.schedule);
  }

  const api = { normalize, findMatches, suggestions };
  root.JLIVE_SEARCH = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window === "object" ? window : globalThis);
