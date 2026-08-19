"use strict";

// Manual snapshot of which J-LIVE artists also appear in FestFlow
// (festflow.kr, a K-festival playlist-matching site) festival lineups, and
// which festival(s) they're on. FestFlow has no API — this needs a manual
// re-sync against its prisma/seed-data/festivals.json whenever either
// site's artist roster changes.
const FESTFLOW_FESTIVALS_BY_ARTIST = {
  "go!go!vanillas": [
    { slug: "rock-in-japan-festival-2026", name: "ROCK IN JAPAN FESTIVAL 2026" },
    { slug: "greenroom-festival-2026", name: "GREENROOM FESTIVAL '26" },
    { slug: "metrock-tokyo-2026", name: "METROCK 2026 (Tokyo)" }
  ],
  "Chilli Beans.": [
    { slug: "rock-in-japan-festival-2026", name: "ROCK IN JAPAN FESTIVAL 2026" },
    { slug: "metrock-tokyo-2026", name: "METROCK 2026 (Tokyo)" }
  ],
  natori: [
    { slug: "rock-in-japan-festival-2026", name: "ROCK IN JAPAN FESTIVAL 2026" },
    { slug: "rising-sun-rock-festival-2026", name: "RISING SUN ROCK FESTIVAL 2026 in EZO" },
    { slug: "viva-la-rock-2026", name: "VIVA LA ROCK 2026" }
  ],
  Vaundy: [
    { slug: "rock-in-japan-festival-2026", name: "ROCK IN JAPAN FESTIVAL 2026" },
    { slug: "rising-sun-rock-festival-2026", name: "RISING SUN ROCK FESTIVAL 2026 in EZO" }
  ],
  "『ユイカ』": [
    { slug: "rock-in-japan-festival-2026", name: "ROCK IN JAPAN FESTIVAL 2026" },
    { slug: "rising-sun-rock-festival-2026", name: "RISING SUN ROCK FESTIVAL 2026 in EZO" },
    { slug: "arabaki-rock-fest-2026", name: "ARABAKI ROCK FEST.26" }
  ],
  YUURI: [
    { slug: "rock-in-japan-festival-2026", name: "ROCK IN JAPAN FESTIVAL 2026" },
    { slug: "metrock-tokyo-2026", name: "METROCK 2026 (Tokyo)" },
    { slug: "arabaki-rock-fest-2026", name: "ARABAKI ROCK FEST.26" }
  ],
  "KANA-BOON": [
    { slug: "rock-in-japan-festival-2026", name: "ROCK IN JAPAN FESTIVAL 2026" },
    { slug: "metrock-tokyo-2026", name: "METROCK 2026 (Tokyo)" },
    { slug: "viva-la-rock-2026", name: "VIVA LA ROCK 2026" }
  ],
  "CUTIE STREET": [{ slug: "rock-in-japan-festival-2026", name: "ROCK IN JAPAN FESTIVAL 2026" }],
  Novelbright: [
    { slug: "rock-in-japan-festival-2026", name: "ROCK IN JAPAN FESTIVAL 2026" },
    { slug: "metrock-tokyo-2026", name: "METROCK 2026 (Tokyo)" }
  ],
  "NOMELON NOLEMON": [{ slug: "rock-in-japan-festival-2026", name: "ROCK IN JAPAN FESTIVAL 2026" }],
  muque: [
    { slug: "rock-in-japan-festival-2026", name: "ROCK IN JAPAN FESTIVAL 2026" },
    { slug: "metrock-tokyo-2026", name: "METROCK 2026 (Tokyo)" }
  ],
  ano: [
    { slug: "rock-in-japan-festival-2026", name: "ROCK IN JAPAN FESTIVAL 2026" },
    { slug: "rising-sun-rock-festival-2026", name: "RISING SUN ROCK FESTIVAL 2026 in EZO" }
  ],
  "Fujii Kaze": [{ slug: "fuji-rock-festival-2026", name: "FUJI ROCK FESTIVAL '26" }],
  "Sunny Day Service": [{ slug: "fuji-rock-festival-2026", name: "FUJI ROCK FESTIVAL '26" }],
  yutori: [{ slug: "metrock-tokyo-2026", name: "METROCK 2026 (Tokyo)" }],
  "Dannie May": [{ slug: "metrock-tokyo-2026", name: "METROCK 2026 (Tokyo)" }],
  luv: [{ slug: "arabaki-rock-fest-2026", name: "ARABAKI ROCK FEST.26" }]
};

function festflowFestivalsFor(artist) {
  return FESTFLOW_FESTIVALS_BY_ARTIST[artist] || [];
}

module.exports = { festflowFestivalsFor };
