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
| blu-swing-2026-11-15 | BLU-SWING 2026-11-15 1회 | 2026-09-24 | 2026-11-09 | 공식 한글 별칭. 공연 사실·대표곡 3곡은 이번 확인 | https://www.highjinkx.com/blu-swing-2026 | 예매·가격·곡은 확인. 공식 페이지에 한글 표기가 없어 confirmed 보류 | 공식 한글 표기가 나오면 confirmed |
| lausbub-kirara-2026-11-20 | LAUSBUB & KIRARA, 기록된 공연일 2026-11-20 | 2026-10-18 | 2026-11-09 | 공연 연도. 날짜 값·가격·영상·출처는 유지 | https://www.highjinkx.com/larara · https://www.highjinkx.com/show-list/larara · https://ticket.yes24.com/English/Perf/60323 | larara 한글 2026 / 같은 페이지 영문 2027.11.20. 쇼리스트 2026-11-20. YES24 Nov 20, 2026. 정정 공지·수정 시각 없음. 포스터는 11.20.Fri이고 연도 없음 | 공식 정정 전까지 status pending, hostingStatus·concertDate conflict |
| kinoue64-2026-11-14 / kinoue64-2026-11-15 | kinoue64 11/14·11/15 | 2026-10-18 | 2026-11-09 | 공식 유튜브 대표곡 3곡, 좌석등급 명칭 | https://4kor4kor4kor.com/tickets/kinoue64-2026day1 | 일정·단일가 재확인. 등급명 없는 단일가. 곡 미검증 | 공식 채널 영상 3곡 |
| kazumi-tateishi-trio-2026-11-22-suwon | Kazumi 수원 2026-11-22 | 2026-09-24 | 2026-11-09 | 일반예매 일시. 선예매 공지 없음은 미확인 | https://tickets.interpark.com/goods/26009224 | 상품 페이지에 오픈 일시 없음. 예매대기 배지는 일시장 아님 | 오픈 공지 재확인 |
| kazumi 추가 도시 | 광주·성남·영등포·강동·대구 | 2026-11-09 | 2026-11-09 | 상세 미조사 | https://tickets.interpark.com/goods/26009224 | 관련 공연 목록만 봄. 각 상품 페이지는 열지 않음 | 다음 신규 조사. 부산 12/26은 기존 레코드 |
| ivy-2026-11-28 | iVy 2026-11-28 | 2026-10-18 | 이번 미실시 | 대표곡, 좌석등급명 |  | 재검증 예산상 다음 순위 | 4KOR 공식 페이지 재오픈 |
| let-me-know-2026-11-28 | LET ME KNOW 2026-11-28 | 기존 | 2026-11-09 | 없음. 사실 유지 | https://nol.yanolja.com/ticket/products/26010681 | 일정·선예매·가격 재확인 | 변경 신호 없으면 7일 후 |

## Run: 2026-11-09 (KST, 홀수일, 재검증 우선)

KST 날짜는 `2026-11-09` 월요일로 재확인했다. 신규 상세 조사 0건. 기존 미래 공연 5건을 공식 페이지를 다시 열어 재검증했다. 7일 이내 검증 건은 없었다. 30일 이내 예매 오픈 예정 건은 없었다.

- `kinoue64-2026-11-14` / `kinoue64-2026-11-15`: 변경 없음. DAY1 2026-11-14 18:00 KT&G 상상마당 라이브홀, 예매 75,000원, 일반예매 2026-08-18 20:00. DAY2 2026-11-15 18:30 Gamma Hall, 예매 50,000원, 같은 오픈 시각. 선예매 문구 없음(`presaleStatus: none`). 좌석 등급명은 페이지에 없고 단일 예매가만 있어 seatPrices는 비움. 대표곡은 이번에도 공식 영상 3곡을 열지 못해 unverified 유지(기존 2026-10-18 기록 재사용 아님, 미검증 유지). 공연 근거: https://4kor4kor4kor.com/tickets/kinoue64-2026day1 https://4kor4kor4kor.com/tickets/kinoue64-2026day2 상태 ON SALE. 환불은 2026-11-09 22:00까지라고 적혀 있음.
- `blu-swing-2026-11-15`: 일반예매 2026-08-27 목 오후 12:00를 새로 기록. 일시 2026-11-15 17:00, 홍대 롤링홀, 전석 스탠딩 66,000원. 선예매 문구 없음. YES24 영문 상품은 Standing W66,000, 날짜 Nov 15, 2026. 대표곡 3곡은 이번 신규 검증(공식 채널 @BLUSWINGchannel): クラゲ https://www.youtube.com/watch?v=Vy7cxw8PaT0 (기존 링크를 다시 열어 채널 확인), BLUE MOON https://www.youtube.com/watch?v=gQw8ZNZBK_M , 悲しい自由 https://www.youtube.com/watch?v=D2jePJruUdA . 조회수는 연 페이지에 노출되지 않아 조회수 순위는 확정하지 않음. 곡 근거와 공연 근거를 분리했다. 공연 근거: https://www.highjinkx.com/blu-swing-2026 https://www.highjinkx.com/show-list/blu-swing2026 https://ticket.yes24.com/English/Perf/59831 https://www.blu-swing.com/posts/59173178/ . 곡 근거: 위 3개 watch URL과 https://www.blu-swing.com/posts/12835400/ . status는 pending. 필수 공연 사실은 채워졌으나 공식 한국 예매·기획사·아티스트 페이지에서 한글 표기를 찾지 못했고, 확정 아티스트는 한글 별칭이 있어야 해서 confirmed로 올리지 않음. 일본어 별칭 ブルースウィング·ブルースイング은 https://www.blu-swing.com/ 메타 키워드에서 확인.
- `lausbub-kirara-2026-11-20`: 같은 날 먼저 `confirmed`로 올렸으나, 공연 연도는 공식 정정 없이 충돌이므로 그 결론을 유지하지 않는다. 기록된 공연일 `2026-11-20`, 오후 8:00, KT&G 상상마당 홍대 라이브홀, 전석 스탠딩 66,000원, 일반예매 2026-09-29 화 오후 12:00, 선예매 없음, 대표곡 3곡과 출처는 지우지 않았다. 상태만 `pending`, `hostingStatus`와 `verification.concertDate.status`는 `conflict`다. 출처별 연도: https://www.highjinkx.com/larara 한글 본문 `2026년 11월 20일 금요일 오후 8시`, 같은 페이지 영문 `Date : 2027.11.20. FRI @ 8:00pm`. https://www.highjinkx.com/show-list/larara 는 `2026-11-20` (`2026. 11. 20. FRI. 20:00`, startDate `2026-11-20T20:00:00+0900`)이고 2027은 없다. https://ticket.yes24.com/English/Perf/60323 는 `Nov 20, 2026`, Standing W66,000. 세 페이지에 정정·오기 정정 공지가 없고, 게시 수정 시각으로 어느 연도가 나중 공지인지 확인되지 않았다. 공식 포스터 `LA・RA・RA_v2.jpg`는 `11.20.Fri`만 있고 연도가 없다. 정책 §3은 해소되지 않은 공식 충돌을 해당 필드 `conflict`로 기록하고 공개 승인을 보류하며, 출처 우선순위·요일·다수 출처로 오타를 고르는 조항은 없다. 대표곡은 이번 감사에서 다시 열지 않았고 기존 3곡을 유지한다. 채널 @LAUSBUB: Telefon https://www.youtube.com/watch?v=zbTUx2rIDy8 , sign https://www.youtube.com/watch?v=Cfta2wTJoZQ , higher https://www.youtube.com/watch?v=2I6iOmCvvmE . 곡 근거: https://lausbub.jp/movies/categories/video 와 위 watch URL. 별칭 키라라·ラウスバブ와 기존 `라우스법 & 키라라`는 그대로다.
- `kazumi-tateishi-trio-2026-11-22-suwon`: 일정·장소·가격 재확인. 2026-11-22 17:00, 경기아트센터 소극장, VIP석 88,000 / R석 77,000 / S석 66,000. 일반예매 일시는 NOL·인터파크 상품과 경기아트센터 페이지에 없어 ticketing은 unverified. `예매대기` 배지를 오픈 일시로 쓰지 않음. 선예매 유무도 그 페이지들로는 확인되지 않아 checking 유지. 대표곡 3곡은 이번 영상을 다시 열지 않았고 2026-09-24 검증을 재사용. 공연 근거: https://nol.yanolja.com/ticket/products/26009224 https://tickets.interpark.com/goods/26009224 https://www.ggac.or.kr/ggac/M0000281/show/view.do?idx=SM000135 . 곡 근거(기존): https://kazumitateishi-trio.com/ https://www.jvcmusic.co.jp/-/Artist/A023203.html . 같은 상품의 관련 공연으로 광주·성남·영등포·강동·대구가 보였으나 각 페이지는 열지 않음.
- 색인 대상이라 이어서 재연 공연: `kawasaki-takaya-2026-12-20` 사실 유지. 2026-12-20 개장 17:00/시작 18:00, YES24 라이브홀, 1층 스탠딩 110,000원, 2층 지정석 121,000원, 일반예매 2026-08-19 정오 선착순, 팬클럽 티켓 없음. 근거 https://kawasaki-takaya.com/live/live-in-seoul-2026/ . `let-me-know-2026-11-28` 사실 유지. 2026-11-28 18:00 명화라이브홀, 스탠딩·지정석 각 99,000원, 팬클럽 선예매 2026-07-27 18:00–07-30 23:59(7/24 10:00까지 가입, 7/27 12:00 인증, 1인 2매), 일반예매 2026-07-31 18:00. NOL은 11/9–11/10 일괄 배송이라고 표시. 근거 https://letmeknowmusic.jp/live_information/let-me-know-live-tour-2026-re-still-romance-korea/ https://nol.yanolja.com/ticket/products/26010681 . `homecomings-2026-12-13` 상품 페이지에서 2026-12-13 17:00, 무신사 개러지, 전석 스탠딩 88,000원 재확인. 오픈 공지 https://ticket.melon.com/csoon/detail.htm?csoonId=12775 는 500이라 일반예매 2026-08-31 19:00 검증일은 2026-09-25로 유지. 상품 근거 https://ticket.melon.com/performance/index.htm?prodId=213806 . `fujii-kaze-2027-01-09` 공식 투어 페이지에서 2027-01-09 고척스카이돔, 개장 16:30/시작 18:00, 로컬 예매 2026-06-17 19:00, 글로벌 예매 2026-06-18 19:00 재확인. 좌석 가격 공지 https://ticket.melon.com/csoon/detail.htm?csoonId=12366 는 500이라 가격 검증일은 2026-09-25로 유지. 일정 근거 https://hehn.fujiikaze.com/pwt/ .
- 신규 후보 상세 조사는 하지 않음. 다음 재확인: iVy 2026-11-28, 예매일 미확인 pending(ZAZEN BOYS, 紫 今, Penthouse), 후지이 카제·홈커밍스 가격/오픈 공지 재오픈.
- 접근 실패로 기존 값을 지우거나 상태를 내리지 않음. YES24 영문 상품 페이지는 열렸고 오픈 시각은 없었다. 오픈 시각은 기획사 페이지에서 확인.

## Run: 2026-10-18 (KST, user-requested registrations)

- 신규 상세 조사 후보 5건을 처리함(kinoue64의 양일 공연을 한 후보로 묶음). 데이터 중복 확인 후 7개 회차 레코드를 `pending`으로 추가함. 대표곡/공식 YouTube 채널을 이번 실행에 검증하지 않았으므로 confirmed 처리하지 않음.
- `kinoue64-2026-11-14`: 11/14 18:00, KT&G 상상마당 라이브홀, 예매 오픈 8/18 20:00, 75,000원. 출연: kinoue64, Parannoul, Lilly Eat Machine. 공식 주최사 상세: https://4kor4kor4kor.com/tickets/kinoue64-2026day1
- `kinoue64-2026-11-15`: 11/15 18:30, Gamma Hall, 예매 오픈 8/18 20:00, 50,000원. 출연: kinoue64, Cultgazer. 공식 주최사 상세: https://4kor4kor4kor.com/tickets/kinoue64-2026day2
- `lausbub-kirara-2026-11-20`: 11/20 20:00, KT&G 상상마당 홍대 라이브홀, 전석 스탠딩 66,000원. YES24 개별 상품(https://ticket.yes24.com/English/Perf/60323)은 2026-10-18 열람 시 bot manager 제한으로 차단됨. YES24 공식 공연목록과 주최사 상세(https://www.highjinkx.com/show-list/larara)에서 공연/일정/가격 확인. 티켓 오픈일·시각 미확인.
- `ivy-2026-11-28`: 11/28 19:00(입장 18:30), Vel.R 벨르, 55,000원, 예매 오픈 7/13 20:00. 주최사 상세 https://4kor4kor4kor.com/tickets/ivy 에서 확인. Google Forms 예매 링크는 연결만 확인했으며 폼에 진입하거나 제출하지 않음.
- `nee-2026-12-18`: 12/18, KT&G SANGSANGMADANG LIVE HALL HONGDAE, 88,000원, 멜론 티켓, 티켓 판매일 9/29(공식 공지에 시각 없음). 공연 시작 시각과 좌석 등급명 미확인. 공식 아티스트 공지 https://neeofficial.jp/contents/1109451. 멜론 글로벌 상품 페이지 접근 제한으로 상세 재확인은 못함.
- `luck-life-2026-12-19` / `luck-life-2026-12-20`: 양일 무신사 개러지, 각각 18:00 / 17:00 시작(입장 17:15 / 16:15), SVIP 198,000원·VIP 154,000원·일반 99,000원, 일반예매 10/1 12:00. 아티스트 공지 https://luck-life.com/news/2026/09/30/9023 및 Melon 공식 오픈 공지 https://ticket.melon.com/csoon/detail.htm?csoonId=12884.
- 남은 사용자 목록은 다음 실행으로 이관: NANAOAKARI(2027-01-30; 예매 오픈 예정일은 이미 지났으므로 변경 여부 공식 재검증 우선), AOSAKA: kurayamisaka & parannoul(2027-01-09), Minami(2027-03-27~28, 장소/시각/예매 정보). XMF는 2026-10-03~04 공연으로 과거라 정책상 미처리. Hump Back은 기존 `hump-back-2027-01-23`과 중복 방지.

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

## Run: 2026-09-24 (KST, additional missing-event registration)

- 원래 작업 폴더의 변경을 보존하기 위해 깨끗한 임시 worktree `j-live-cloudflare-deploy-scout-worktree` (`origin/main` 기준)에서만 작업.
- origin/main 데이터와 대조한 신규 5건: Coaltar of the Deepers(2026-10-24), BLU-SWING(2026-11-15), Kazumi Tateishi Trio 수원(2026-11-22), 紫 今 / Mulasaki Ima(2026-12-12), Hump Back(2027-01-23). 전부 `pending`/`hostingStatus: confirmed`로 추가; 티켓 오픈일 미확인 공연은 값을 비워 두고 `ticketingStatus: unverified`로 유지.
- 검증 가격: Coaltar 스탠딩석 77,000원; BLU-SWING 전석 스탠딩 66,000원; Kazumi 수원 VIP석 88,000원/R석 77,000원/S석 66,000원; 紫 今 스탠딩석·지정석 각 99,000원; Hump Back 스탠딩석·지정석 각 132,000원. Hump Back 일반예매 2026-10-07 12:00 KST.
- 대표곡: Hump Back `拝啓、少年よ` 1곡, Coaltar of the Deepers `SUMMER GAZER '92` 1곡, BLU-SWING `クラゲ (Kurage)` 1곡, 紫 今 `魔性の女A` 1곡을 반영. Kazumi는 동일 아티스트의 기존 검증 채널/곡 3개를 재사용. Coaltar 업로더는 레이블 U-desper Records로 표시된 공식 MV, BLU-SWING은 아티스트 공식 사이트의 MV 공지·영상 링크로 확인.
- 공식 출처: https://ticket.yes24.com/Perf/59686 ; https://www.highjinkx.com/show-list/cotd ; https://ticket.yes24.com/English/Perf/59831 ; https://www.highjinkx.com/show-list/blu-swing2026 ; https://nol.yanolja.com/ticket/products/26009224 ; https://www.ggac.or.kr/ggac/M0000281/show/view.do?idx=SM000135 ; https://ticket.yes24.com/Perf/60203 ; https://www.sonymusic.com.tw/artist/mulasaki-ima/ ; https://ticket.yes24.com/Perf/60207 ; https://humpback.jp/contents/1073598 ; https://humpback.jp/movies/categories/youtube .
- 다음 재확인: Coaltar, BLU-SWING 대표곡/예매일시; Kazumi 수원 예매일시; 紫 今 공연시각/예매일시; Hump Back 공식 채널 URL 및 추가 대표곡. 다음 신규 상세 후보는 이전 대기열의 AKASAKI이며, 이번 실행의 신규 후보 상한 5건을 소진함.

## Run: 2026-09-23 (KST, candidate registration and deployment attempt)

- 격리 worktree의 origin/main 기준 데이터와 대조해 5개 신규 이벤트 레코드를 `pending`으로 추가함: H△G(10/17), TAKASE TOYA(10/18), FLOW(10/28), ZAZEN BOYS(12/06), Penthouse(12/19). 대표곡 3개/공식 채널 등 필수 요건이 미완료라 확정 공개 대상으로 지정하지 않음.
- FLOW YES24 한국어 상품 페이지에서 20:00, 스탠딩 VIP석 165000원/지정석 110000원/스탠딩 일반석 99000원 및 공식 공지상 일반예매 2026-09-10 12:00 확인. Penthouse YES24 한국어 상품 페이지에서 19:00, 지정석 121000원/스탠딩석 110000원 확인. H△G YES24 영문 상품 페이지에서 VIP section 132000원/General section 99000원 확인. ZAZEN BOYS 한국어 YES24 상품 페이지에서 스탠딩석 99000원, 17:00 확인. 공식 페이지에서 확인한 가격이며 실시간 재고는 조회하지 않음.
- TAKASE TOYA 개별 상품은 YES24 Bot Manager 제한으로 시간·예매 일정·가격 접근 실패. H△G 예매 일정/공연 시각, ZAZEN BOYS 예매 일정, Penthouse 예매 일정, 다섯 아티스트의 공식 YouTube 대표곡/채널은 미확인.
- 확인한 원문: https://ticket.yes24.com/English/Perf/59841, https://hag-official.com/, https://ticket.yes24.com/English/Perf/60065, https://ticket.yes24.com/Perf/59986, https://www.flow-official.jp/news/detail.php?id=2830, https://www.flow-official.jp/biography/, https://ticket.yes24.com/Perf/59963, https://www.highjinkx.com/show-list/zazen-boys, https://ticket.yes24.com/Perf/59886, https://www.jvcmusic.co.jp/sf/penthouse/.
- 후보 상세 조사 상한 5건을 넘긴 상태에서 BLU-SWING 공식 상품 링크를 추가로 열었음. 이를 등록하지 않고 다음 실행 대기열로 이관: BLU-SWING(11/15), Coaltar of the Deepers, Mulasaki Ima(12/12), Kazumi Tateishi Trio 수원(11/22), Hump Back(2027-01-23), AKASAKI(11/21).
- 기존 dirty worktree와 분리해 작업함. pending은 상세/검색 공개에서 제외. FLOW 및 Penthouse의 공식 가격/시간 누락을 보완함. 생성 결과에 이전 기준일로 갱신된 다수 HTML이 포함되어 있어 전체 검사와 diff 검토 통과 전 커밋/푸시/배포 금지.
