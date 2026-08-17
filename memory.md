# J-LIVE Automation Memory / Checkpoint

This file is the run-to-run checkpoint referenced by the automation policy
("Use memory.md as the checkpoint"). It did not exist before the 2026-08-17
run, so it was created fresh at that time. No prior verification history is
fabricated here — entries only start from the run in which they were
actually performed.

Format: `- <event id> — verifiedAt=<date> — note`

## Run: 2026-08-17 (KST, Monday)

Reverified / updated (official sources reopened and checked this run):

- andteam-2026-10-03 — verifiedAt=2026-08-17 — status pending→confirmed (general sale opened 2026-08-11 as scheduled; price/venue/dates unchanged). Source: https://tickets.interpark.com/contents/notice/detail/14782
- andteam-2026-10-04 — verifiedAt=2026-08-17 — same as above.
- cutie-street-2027-01-23 — verifiedAt=2026-08-17 — status pending→confirmed (all required facts present and match official Melon notice; presale 2026-08-21 / general 2026-08-24 still upcoming, unchanged). Sources: https://ticket.melon.com/csoon/detail.htm?csoonId=12672, https://ticket.melon.com/performance/index.htm?prodId=213705
- kento-nakajima-2026-10-03 — verifiedAt=2026-08-17 — CORRECTED time: "오후 6:00" → "오후 5:00" per official YES24 product page (m.ticket.yes24.com/Perf/58653). Price/venue unchanged.
- kento-nakajima-2026-10-04 — verifiedAt=2026-08-17 — CORRECTED time: "오후 5:00" → "오후 4:00" per same source.
- vaundy-2026-09-19 — verifiedAt=2026-08-17 — reconfirmed unchanged via https://member.vaundy.jp/feature/ASIAARENATOUR_2026 (開場/開演 times consistent with stored 오후 5:00).
- vaundy-2026-09-20 — verifiedAt=2026-08-17 — reconfirmed unchanged, same source (stored 오후 4:00 confirmed).
- takuya-kimura-2026-09-26 — verifiedAt=2026-08-17 — reconfirmed unchanged via https://tickets.interpark.com/contents/notice/detail/14058.
- let-me-know-2026-11-28 — verifiedAt=2026-08-17 — reconfirmed unchanged via https://letmeknowmusic.jp/live_information/let-me-know-live-tour-2026-re-still-romance-korea/.
- fujii-kaze-2027-01-09 — verifiedAt=2026-08-17 — reconfirmed unchanged via https://fujiikaze.com/news-article/news260610/.

New event added (1 of the 5-candidate discovery cap used this run):

- kawasaki-takaya-2026-12-20 — verifiedAt=2026-08-17 — new confirmed event added. Discovered via WebSearch (KAWASAKI TAKAYA LIVE IN SEOUL 2026), verified via official artist site (https://kawasaki-takaya.com/live/live-in-seoul-2026/) and https://ticket.yes24.com/Perf/59669. Ticket general on-sale 2026-08-19 12:00, not yet open at verification time (facts read from pre-open listing pages, not from inside a purchase flow).
  - Caveat: could not independently confirm exact YouTube view-count ranking for the 2nd/3rd songs (366日, 君の為のキミノウタ) beyond consistent official-channel title formatting ("【OFFICIAL MUSIC VIDEO】") and search-result attribution to the artist's official channel (川崎鷹也【公式】, handle @kawasaki_takaya) — YouTube channel/video pages are JS-rendered and did not expose view counts to the fetch tool. 魔法の絨毯 (song #1) is independently confirmed as his most-viewed/signature track (~90M+ views per third-party music-ranking source).

Checked but left unchanged — official page inaccessible (NOL/Interpark ticket product pages are JS-rendered SPAs; WebFetch could not extract content; no alternate official source found this run):

- paris-match-2026-10-31 — still `pending`. NOL ticket page (https://tickets.interpark.com/goods/26011570) not renderable by fetch tool; no official promoter/artist confirmation found via search this run.
- hamano-haruki-2026-10-16 — still `pending`. Same NOL rendering limitation (https://tickets.interpark.com/goods/26011287); no alternate official source found.

Discovered but NOT investigated this run (discovery-only, over the 5-candidate cap after Kawasaki Takaya was fully verified — candidates for a future run):

- Gen Hoshino (호시노 겐) — reported 2026-02-06 Inspire Arena solo show (mentioned in theqoo/Namuwiki-adjacent search results). Not verified against any official source. Not in events.json.
- ZUTOMAYO (즛토마요) — reported 2026-03-14 Korea University Hwajeong Gymnasium show. Not verified against any official source. Not in events.json.

## Notes on process

- Namuwiki and blog/community search results (theqoo, cjybiz, etc.) were used only as discovery pointers; every fact actually stored was cross-checked against an official ticket/artist/promoter page before being written to events.json, per policy.
- Today's KST weekday for this run was Monday (2026-08-17) — the historical-events Sunday sweep was skipped per policy.
