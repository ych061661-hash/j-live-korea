# J-LIVE Automation Memory / Checkpoint

This file is the run-to-run checkpoint referenced by the automation policy
("Use memory.md as the checkpoint"). It did not exist before the 2026-08-17
run, so it was created fresh at that time. No prior verification history is
fabricated here — entries only start from the run in which they were
actually performed.

Format: `- <event id> — verifiedAt=<date> — note`

## 후보 대기열 운영 형식

매 실행 시작에 아래 열로 대기열을 갱신한다. 과거 실행 기록을 현재의 확인 결과로 복사하지 않는다. 기존 events.json과 대조해 해결된 후보는 종료하며, KST 기준 과거 공연은 활성 대기열에서 제외한다. 신규 상세 조사 최대 5건, 7일 이내 검증 건 생략(예매 임박·공식 변경 예외), 홀짝 모드는 정책을 따른다.

| 후보 ID / 기존 ID | 아티스트·공연일·회차 | 발견일 | 마지막 시도(KST) | 누락 필드 | 확인한 공식 URL | 결과·접근 실패 원인 | 다음 행동·우선순위 |
| --- | --- | --- | --- | --- | --- | --- | --- |

2026-09-21 코드 보완 작업에서는 공연 검색이나 공식 출처 재검증을 수행하지 않았다. 아래 과거 pending 기록은 최신 데이터와 대조한 뒤 다음 실제 검색 실행에서 대기열에 편입한다. 현재 표가 비어 있다는 사실은 미해결 공연이 없다는 뜻이 아니다.

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

## Run: 2026-09-18 (KST, Search Console indexing correction)

- Vaundy 2026-09-19/20은 공식 투어·NOL 자료 기준으로 `status`, `hostingStatus`, `ticketingStatus`를 모두 `confirmed`로 유지함. 일반·글로벌·Play&Stay 오픈은 2026-03-11 20:00, 회차별 ID 1개당 1인 2매, 별도 선예매 없음으로 재확인함.
- Vaundy 좌석명을 현재 공식 표기인 스탠딩석 165000원, R석 165000원, S석 154000원으로 정정하고 글로벌 예매 본인정보 일치 및 Play&Stay 호텔 신분증 확인·티켓/입장 팔찌 배부 안내를 상세 콘텐츠에 반영함. Sources: https://member.vaundy.jp/feature/ASIAARENATOUR_2026, https://tickets.interpark.com/goods/26003199, https://tickets.interpark.com/contents/notice/detail/12910
- Takuya Kimura 2026-09-26은 공연 시각·장소·VIP/R/S 가격이 기존 값과 일치함을 확인해 값 변경 없이 `verifiedAt`과 `priceVerifiedAt`만 2026-09-18로 갱신함. Source: https://tickets.interpark.com/goods/26008115
- 개최만 확인된 `pending` 공연은 달력과 noindex 상세에서 공개할 수 있도록 생성·로딩 규칙을 분리함. 예매 발표 대기는 `발표 대기`로 표시하고, 해당 상세에는 광고를 넣지 않으며 사이트맵에서는 제외함. 개최 미확인 pending 후보는 계속 비공개임.
- 과거 `.html` 및 루트 정책 URL의 정식 301 규칙을 추가하고 구체적인 가이드 규칙이 와일드카드보다 앞서도록 유지함.
- 재검증일만 바뀐 사실로 신규 업데이트 기록을 만들지 않았으며 `calendar/data/updates.json`에는 의미 없는 변경이 발생하지 않음.

## Run: 2026-09-23 (KST, user-requested candidate registration)

- 깨끗한 격리 worktree를 `origin/main` (`53bf726`) 기준으로 생성해 작업함. 원래 작업 폴더의 사용자 변경사항은 수정·스테이징하지 않음.
- 오늘 이후 이벤트를 기준 데이터와 대조함. 아래 후보 다섯 건은 origin/main에 동일 공연 레코드가 없어 중복 아님.
- `hag-2026-10-17` — pending 등록. YES24에서 2026-10-17, WESTBRIDGE, VIP section 132000원, General section 99000원 확인. 공연 시작 시각·일반예매/선예매 일정·공식 YouTube 채널 및 대표곡 3개 미확인.
- `takase-toya-2026-10-18` — pending 등록. YES24 공식 목록에서 2026-10-18, YES24 WANDERLOCH HALL 확인. 개별 상품 페이지 접근이 Bot Manager에 의해 차단되어 공연 시작 시각·가격·예매 일정·공식 YouTube 정보 미확인.
- `flow-2026-10-28` — pending 등록. YES24 한국어 상품 페이지에서 2026-10-28 20:00, YES24 LIVE HALL 및 스탠딩 VIP석 165000원/지정석 110000원/스탠딩 일반석 99000원 확인. FLOW 공식 공지에서 일반예매 2026-09-10 12:00 확인. 공식 YouTube 채널/대표곡 3개 미확인.
- `zazen-boys-2026-12-06` — pending 등록. YES24 및 주최사 Highjinkx에서 2026-12-06 17:00, 무신사 개러지, 스탠딩석 99000원 확인. 예매 오픈 일정과 공식 YouTube 채널/대표곡 3개 미확인.
- `penthouse-2026-12-19` — pending 등록. YES24 한국어 상품 페이지에서 2026-12-19 19:00, YES24 LIVE HALL, 지정석 121000원/스탠딩석 110000원 확인. 예매 오픈 일정과 공식 YouTube 정보 미확인.
- 신규 상세 후보 상한 5건을 적용함. 다음 확인 대기: BLU-SWING, Coaltar of the Deepers, Mulasaki Ima, Kazumi Tateishi Trio 수원 회차, Hump Back, AKASAKI. 후속 실행에서 공식 판매·가격·회차 확인 및 중복 검토 필요.
- 미확인 가격을 추정하지 않았고 좌석 재고를 조회하지 않음.

## Run: 2026-09-23 (KST, candidate registration and deployment attempt)

- 격리 worktree의 origin/main 기준 데이터와 대조해 5개 신규 이벤트 레코드를 `pending`으로 추가함: H△G(10/17), TAKASE TOYA(10/18), FLOW(10/28), ZAZEN BOYS(12/06), Penthouse(12/19). 대표곡 3개/공식 채널 등 필수 요건이 미완료라 확정 공개 대상으로 지정하지 않음.
- FLOW YES24 한국어 상품 페이지에서 20:00, 스탠딩 VIP석 165000원/지정석 110000원/스탠딩 일반석 99000원 및 공식 공지상 일반예매 2026-09-10 12:00 확인. Penthouse YES24 한국어 상품 페이지에서 19:00, 지정석 121000원/스탠딩석 110000원 확인. H△G YES24 영문 상품 페이지에서 VIP section 132000원/General section 99000원 확인. ZAZEN BOYS 한국어 YES24 상품 페이지에서 스탠딩석 99000원, 17:00 확인. 공식 페이지에서 확인한 가격이며 실시간 재고는 조회하지 않음.
- TAKASE TOYA 개별 상품은 YES24 Bot Manager 제한으로 시간·예매 일정·가격 접근 실패. H△G 예매 일정/공연 시각, ZAZEN BOYS 예매 일정, Penthouse 예매 일정, 다섯 아티스트의 공식 YouTube 대표곡/채널은 미확인.
- 확인한 원문: https://ticket.yes24.com/English/Perf/59841, https://hag-official.com/, https://ticket.yes24.com/English/Perf/60065, https://ticket.yes24.com/Perf/59986, https://www.flow-official.jp/news/detail.php?id=2830, https://www.flow-official.jp/biography/, https://ticket.yes24.com/Perf/59963, https://www.highjinkx.com/show-list/zazen-boys, https://ticket.yes24.com/Perf/59886, https://www.jvcmusic.co.jp/sf/penthouse/.
- 후보 상세 조사 상한 5건을 넘긴 상태에서 BLU-SWING 공식 상품 링크를 추가로 열었음. 이를 등록하지 않고 다음 실행 대기열로 이관: BLU-SWING(11/15), Coaltar of the Deepers, Mulasaki Ima(12/12), Kazumi Tateishi Trio 수원(11/22), Hump Back(2027-01-23), AKASAKI(11/21).
- 기존 dirty worktree와 분리해 작업함. pending은 상세/검색 공개에서 제외. FLOW 및 Penthouse의 공식 가격/시간 누락을 보완함. 생성 결과에 이전 기준일로 갱신된 다수 HTML이 포함되어 있어 전체 검사와 diff 검토 통과 전 커밋/푸시/배포 금지.
