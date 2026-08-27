"use strict";

const profileRoot = document.querySelector("#wonderlivetArtistProfiles");

if (profileRoot) {
  const escapeHtml = value => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const dateLabel = date => {
    const parsed = new Date(`${date}T00:00:00+09:00`);
    return `${parsed.getMonth() + 1}월 ${parsed.getDate()}일 · ${parsed.toLocaleDateString("en-US", { weekday: "short", timeZone: "Asia/Seoul" }).toUpperCase()}`;
  };

  const youtubeSearch = (artist, song) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist} ${song} official`)}`;

  Promise.all([
    fetch("/calendar/data/festival-lineups.json").then(response => response.json()),
    fetch("/calendar/data/festival-artist-profiles.json").then(response => response.json())
  ]).then(([lineups, profiles]) => {
    const festival = lineups.find(item => item.id === "wonderlivet-2026");
    if (!festival) throw new Error("WONDERLIVET lineup not found");

    const dateByArtist = new Map();
    festival.days.forEach(day => day.artists.forEach(artist => dateByArtist.set(artist, day.date)));
    const artists = festival.days.flatMap(day => day.artists);

    profileRoot.innerHTML = artists.map(artist => {
      const profile = profiles[artist];
      if (!profile) return "";
      const songs = profile.songs.map(song => `<a href="${youtubeSearch(artist, song)}" target="_blank" rel="noopener noreferrer">▶ ${escapeHtml(song)} ↗</a>`).join("");
      return `<article class="festival-artist-profile"><div class="festival-artist-profile-heading"><span>${escapeHtml(dateLabel(dateByArtist.get(artist)))}</span><h3>${escapeHtml(artist)}</h3></div><p>${escapeHtml(profile.intro)}</p><div class="festival-artist-songs"><span>대표곡 3곡</span>${songs}</div></article>`;
    }).join("");
  }).catch(() => {
    profileRoot.innerHTML = "<p class=\"festival-profile-error\">아티스트 소개를 불러오지 못했습니다. 위의 날짜별 라인업을 먼저 확인해 주세요.</p>";
  });
}
