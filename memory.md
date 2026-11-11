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
| zenbu loudcarnival / one-man | ぜんぶ君のせいだ。 11/13·11/14·11/15 | 2026-11-10 | 2026-11-11 | 합동 공연 시작 시각 TBA. 팬미팅 장소 비공개 | https://kiminosei.com/live/ | 아티스트 일정은 LOUDCARNIVAL 시각 TBA, 원맨 OPEN 18:00/START 18:30. mysub 11/13은 Vercel Security Checkpoint HTTP 429. 미등록 | 429 해소 후 예매 원문. 시각 확정 전 추가 금지 |
| ivy-2026-11-28 | iVy 2026-11-28 | 2026-10-18 | 2026-11-11 | 좌석 등급 명칭, 공식 한글 별칭 | https://4kor4kor4kor.com/tickets/ivy | 일정·예매 55,000원·일반예매 재확인. 선예매 문구 없음. 대표곡 3곡은 이번 신규 검증. pending 유지 | 등급명·한글 표기가 공식 페이지에 나오면 confirmed |
| zazen-boys-2026-12-06 | ZAZEN BOYS 2026-12-06 | 2026-09-23 | 2026-11-11 | 일반예매·선예매 일시, 대표곡 | https://www.highjinkx.com/show-list/zazen-boys | 17:00·무신사 개러지·전석 스탠딩 99,000원 재확인. YES24 상품은 접속 제한. 29CM는 시간 초과 | YES24 또는 29CM 상품 본문 |
| 발견만 | Blue Note Tokyo 11/26, Mass of the Fermenting Dregs 12/4, Khaki 12/5 | 2026-11-10 | 이번 미실시 | 상세 미조사 |  | 홀수일 재검증으로 예산 사용. 공식 페이지 미오픈 | 다음 신규 조사. Blue Note 11/26이 날짜상 앞섬 |
| yuki-kajiura-2026-11-22 | Yuki Kajiura 2026-11-22 | 2026-11-10 | 2026-11-10 | 대표곡 3곡, 티켓링크 상품 URL | http://yonsei-arts.com/product/521 | 일정·가격·일반예매 확인. 상품 URL은 연 공식 공지에 없음 | 공식 영상 3곡과 티켓링크 상품 페이지 |
| ellegarden-2026-11-28 / 11-29 | ELLEGARDEN 11/28·11/29 | 2026-11-10 | 2026-11-10 | 시작 시각, YES24 상품 URL, 대표곡, 공식 한글 별칭 | https://www.universal-music.co.jp/ellegarden/news/2026-08-10/ | 날짜·장소·88,000원·일반예매 9/1 19:00 확인. 시작 시각은 공지에 없음 | YES24 상품 페이지와 공식 영상 3곡 |
| kazumi 광주·성남·영등포·강동·대구 | 2026-12-19~25 | 2026-11-09 | 2026-11-10 | 일반예매·선예매 일시. 영등포 외 한국어 상품 페이지 | http://kazumitateishi.com/live.html | pending 등록. 영등포만 NOL 상품을 염. 곡은 2026-09-24 재사용 | 도시별 상품 페이지와 오픈 공지 |
| choqmay-2027-01-23 | ChoQMay 2027-01-23 | 2026-11-10 | 2026-11-11 | YES24 상품 본문은 시간 초과. 사실은 아티스트·멜론으로 재확인 | https://ticket.melon.com/performance/index.htm?prodId=214199 | confirmed. 일반예매 2026-11-11 20:00. 가격·일정 유지. 곡은 2026-11-10 재사용 | 예매 후 변경 공지만 |
| blu-swing-2026-11-15 | BLU-SWING 2026-11-15 | 2026-09-24 | 2026-11-09 | 공식 한글 별칭 | https://www.highjinkx.com/blu-swing-2026 | 7일 이내. 이번 미재오픈 | 한글 표기 나오면 confirmed |
| kinoue64-2026-11-14 / 11-15 | kinoue64 | 2026-10-18 | 2026-11-09 | 대표곡 3곡, 좌석등급 명칭 | https://4kor4kor4kor.com/tickets/kinoue64-2026day1 | 7일 이내. 이번 미재오픈 | 공식 영상 3곡 |
| kazumi-tateishi-trio-2026-11-22-suwon | Kazumi 수원 | 2026-09-24 | 2026-11-10 | 일반예매 일시 | http://kazumitateishi.com/live.html | 7일 이내. 이번 미재오픈 | 오픈 공지 |

## Run: 2026-11-11 (KST, 홀수일, 재검증 우선)

KST 날짜는 `TZ=Asia/Seoul date`로 `2026-11-11` 수요일을 재확인했다. 원격은 `https://github.com/ych061661-hash/j-live-korea.git`와 일치하고 작업 트리는 깨끗했다. 신규 상세 조사 0건. 기존 레코드와 직전 대기 후보를 재검증했다. 7일 이내 검증 건은 예매 당일 예외와 이미 막힌 임박 후보 재시도 외에는 건너뛰었다.

- `choqmay-2027-01-23` 사실 유지. 2027-01-23 오후 7:00, YES24 WANDERLOCH HALL. 일반예매 2026-11-11 수 오후 8:00. 선예매 문구 없음. VIP 110,000원, 1층 스탠딩석 99,000원, 2층 지정좌석 99,000원. 최저 일반 액면가 99,000원. 대표곡 3곡은 이번 영상을 다시 열지 않고 2026-11-10 검증을 재사용. 공연 근거: https://choqmay-official.com/contents/1123197 https://ticket.melon.com/performance/index.htm?prodId=214199 . 아티스트 공지가 링크한 YES24 https://ticket.yes24.com/Perf/60901 는 연결 시간 초과라 사실 근거로 쓰지 않았다. 곡 근거(기존 재사용): https://www.youtube.com/watch?v=dJhp6awU5Z8 https://www.youtube.com/watch?v=pDzdTzqqCGw https://www.youtube.com/watch?v=PLQAYzuxt08 .
- `ivy-2026-11-28` 일정 유지, pending 유지. 2026-11-28 19:00(open 18:30), Vel.R 벨르 (구. 벨로주), 예매 55,000원, 일반예매 2026-07-13 20:00. 선예매 문구가 없어 presaleStatus를 none으로 바꿨다. 좌석 등급명은 페이지에 없어 seatPrices는 비움. 대표곡 3곡은 이번 신규 검증, 채널 @ivy_atlantide. 채널 동영상 탭에 표시된 조회수 상위 공식 MV: ゆがむ ぴんく https://www.youtube.com/watch?v=ZxKgSX_TDlg (127K), セプタム https://www.youtube.com/watch?v=i9cGSedD3_Q (91K), kirakirakiller https://www.youtube.com/watch?v=d87IcvcyMak (43K). 라이브·라디오·다이제스트·트레일러는 제외. 채널 아바타는 og:image JPEG 900x900으로 저장. 공식 한글 표기는 연 페이지에 없어 confirmed로 올리지 않음. 공연 근거: https://4kor4kor4kor.com/tickets/ivy . 곡 근거: 위 3개 watch URL과 https://www.youtube.com/@ivy_atlantide/videos .
- `zazen-boys-2026-12-06` 시작 시각·장소·가격 유지. 2026-12-06 시작 17:00, 위젯 종료 시각은 18:30(KST, 캘린더 20261206T080000Z/093000Z)이라 시작 시각을 바꾸지 않음. 무신사 개러지, 기획사 문구는 전석 스탠딩 99,000원. 저장된 등급명 스탠딩석은 YES24에서 온 값이고 이번 YES24 재열람이 막혀 이름을 바꾸지 않음. 일반예매·선예매 일시는 여전히 없음. 대표곡은 이번 미검증. 공연 근거: https://www.highjinkx.com/show-list/zazen-boys . YES24 https://ticket.yes24.com/Perf/59963 는 "비정상적인 접근으로 일시적으로 서비스 접속이 제한". 29CM https://ticket.29cm.co.kr/catalog/4190403 는 시간 초과.
- `sunny-day-service-2026-12-03` 사실 유지. 2026-12-03 오후 8:00, 무신사 개러지, STANDING 예매 88,000원. 한국어 상품의 현매 99,000원은 같은 스탠딩의 당일가로 보고 등급에 넣지 않음. 예매대기 배지는 매진 공지로 쓰지 않음. 대표곡은 이번 미재오픈, 기존 3곡 유지. 소카베 뉴스 목록에는 이 서울 일정이 보이지 않았으나 취소 문구는 없었다. 공연 근거: https://tickets.interpark.com/goods/26011116 https://world.nol.com/en/ticket/products/26011116 . 곡 근거(기존): https://www.youtube.com/@SunnyDayServiceofficial/videos .
- `yuuri-2026-12-05` `yuuri-2026-12-06` 사실 유지. 12/05 6PM, 12/06 5PM, 인스파이어 아레나. R석 165,000원, S석 154,000원, A석 143,000원. 상품 페이지에 선예매·일반예매 시각은 없고, 오픈 공지 https://tickets.interpark.com/contents/notice/detail/14619 는 본문이 비어 기존 일반예매 2026-07-31 오후 8:00를 유지. 대표곡은 이번 미재오픈. 공연 근거: https://nol.yanolja.com/ticket/products/26010352 . 곡 근거(기존): 저장된 watch URL 3개.
- ぜんぶ君のせいだ。는 다시 열었으나 등록하지 않음. https://kiminosei.com/live/ 는 11/13·11/14 주간·11/14 야간 LOUDCARNIVAL을 ATELIER HALL, TIME TBA, DAY PASS 35,000원 / DOOR +5,000원으로 유지. 11/15 원맨은 BABYDOLL, OPEN 18:00 / START 18:30, 예매 30,000원 / 당일 35,000원. 팬미팅은 합정역 근처, 장소는 참가자에게만 공개, 13:00–15:00, 80,000원. mysub 11/13 https://mysub.kr/events/261113-loudcarnival-korea-tour 는 HTTP 429 Vercel Security Checkpoint.
- 신규 후보 상세 조사는 하지 않음. 다음 재확인: ぜんぶ君のせいだ。 예매 원문, ZAZEN BOYS 예매 오픈, iVy 등급명·한글 표기, 예매일 미확인 pending(紫 今, Penthouse), 7일 넘은 confirmed(KANA-BOON, CUTIE STREET, Kazumi 부산, Kenshi Yonezu, Fujii Kaze 가격 공지, Homecomings 오픈 공지), NEE·LUCK LIFE. 다음 신규: Blue Note Tokyo 2026-11-26, Mass of the Fermenting Dregs 2026-12-04, Khaki 2026-12-05.
- 접근 실패로 기존 값 삭제나 상태 하향 없음. 취소·연기 공지를 새로 확인하지 않음.

## Run: 2026-11-10 (KST, 짝수일, 신규 발견 우선)

KST 날짜는 `TZ=Asia/Seoul date`로 `2026-11-10` 화요일을 재확인했다. 신규 상세 조사 5건. 기존 미래 공연 재검증은 예매 임박·공식 변경이 아니면 하지 않았다. 저장된 일반예매일이 앞으로 30일 이내인 기존 레코드는 없었다. 7일 이내 검증 건은 건너뛰었다.

- `choqmay-2027-01-23` 신규 confirmed. 2027-01-23 오후 7:00, YES24 WANDERLOCH HALL. 일반예매 2026-11-11 수 오후 8:00. 선예매 문구 없음. 좌석: VIP 110,000원, 1층 스탠딩석 99,000원, 2층 지정좌석 99,000원. 최저 일반 액면가 99,000원. 공연 근거: https://choqmay-official.com/contents/1123197 https://ticket.melon.com/performance/index.htm?prodId=214199 . YES24 https://ticket.yes24.com/Perf/60901 는 2026-11-10 열람 시 "비정상적인 접근으로 일시적으로 서비스 접속이 제한"이라 본문을 사실 근거로 쓰지 않았다. 대표곡 3곡은 이번 신규 검증, 채널 @Cho_Q_May. 조회수를 연 공식 MV 중 상위 3곡: 貴方の恋人になりたい https://www.youtube.com/watch?v=dJhp6awU5Z8 (74,501,327), sister https://www.youtube.com/watch?v=pDzdTzqqCGw (869,627), 未恋 https://www.youtube.com/watch?v=PLQAYzuxt08 (771,568). 라이브 영상은 제외. `遊泳禁止、天ノ川` `十三月の銀河` watch 페이지는 HTTP 429라 순위에서 빠졌다. 곡 근거와 공연 근거를 분리했다. 별칭 초큐메이는 멜론 본문·공식 해시태그, チョーキューメイ는 공식 사이트 명칭. 채널 아바타는 이번 실행에서 이미지로 저장하지 못했다.
- `yuki-kajiura-2026-11-22` 신규 pending. 2026-11-22 오후 6:00, 연세대학교 대강당. 일반예매 2026-10-06 화 오후 8:00. 서울 공지에 선예매 문구 없음. VIP석 178,000원, R석 165,000원, S석 132,000원. 휠체어석은 연 공식 페이지에 없어 넣지 않음. 티켓링크 상품 URL은 연 공식 공지에 없었다. vendorUrl은 가격·오픈 시각이 있는 연세문화예술공간 페이지. 대표곡 3곡은 이번 미검증이라 confirmed 아님. 공연 근거: https://fictionjunction.com/live/13125/ https://fictionjunction.com/information/infotype/live/ http://yonsei-arts.com/product/521 . 별칭 카지우라 유키·梶浦由記는 같은 공식 공지.
- `ellegarden-2026-11-28` `ellegarden-2026-11-29` 신규 pending. 양일 YES24 LIVE HALL. 한국 공연 가격 KRW 88,000, 등급 1階スタンディング (整理番号付)와 2階指定席. 일반예매 2026-09-01 화 19:00, 한국 일정에 선예매 블록 없음. 시작 시각은 이 공지에 없다. YES24 개별 상품 번호는 공지에 없고, 같은 실행에서 YES24 상품 페이지가 접속 제한이라 추정하지 않음. 대표곡 미검증. 공식 한글 표기를 연 페이지에서 찾지 못해 별칭을 만들지 않음. 공연 근거: https://www.universal-music.co.jp/ellegarden/news/2026-08-10/ .
- Kazumi Tateishi Trio 추가 5도시 신규 pending. 아티스트 공식 라이브 페이지에서 일정·가격 확인. 일반예매·선예매 일시는 그 페이지에 없음. 대표곡 3곡은 이번 영상을 다시 열지 않고 2026-09-24 수원 검증을 재사용. 수원 11/22와 부산 12/26은 같은 페이지의 가격·시작 시각이 기존 값과 같아 레코드를 바꾸지 않음. 영등포만 NOL 상품을 열어 19:30, VIP석 88,000 / R석 77,000 / S석 66,000을 대조했다. `예매대기` 배지는 오픈 일시로 쓰지 않음. 나머지 도시 한국어 상품 페이지는 열지 않았고 가격은 아티스트 페이지의 VIP席·R席·S席·A席 금액이다. 등급 한글 표기는 같은 투어의 영등포 NOL 표기와 기존 레코드와 맞춘 것이다.
  - 광주 2026-12-19 오후 5:00 국립아시아문화전당 예술극장 극장2. VIP석 88,000 / R석 77,000 / S석 66,000. 예매 URL은 아티스트가 적은 https://triple.global .
  - 성남 2026-12-20 오후 3:00 성남아트센터 콘서트홀. VIP석 88,000 / R석 77,000 / S석 66,000 / A석 55,000.
  - 영등포 2026-12-22 오후 7:30 영등포아트홀. VIP석 88,000 / R석 77,000 / S석 66,000. 상품 https://nol.yanolja.com/ticket/products/26010060 .
  - 강동 2026-12-24 오후 7:30 강동아트센터 대극장 한강. VIP석 88,000 / R석 77,000 / S석 66,000 / A석 55,000.
  - 대구 2026-12-25 오후 5:00 대덕문화전당 드림홀. VIP석 88,000 / R석 77,000 / S석 66,000. A석은 이 회차 공지에 없음.
  - 공연 근거: http://kazumitateishi.com/live.html . 영등포 추가 근거: https://nol.yanolja.com/ticket/products/26010060 https://world.nol.com/en/ticket/products/26010060 . 곡 근거(기존 재사용): https://kazumitateishi-trio.com/ https://www.jvcmusic.co.jp/-/Artist/A023203.html .
- ぜんぶ君のせいだ。 한국 일정은 상세 조사했으나 등록하지 않음. 공식 https://kiminosei.com/live/ 는 11/13·11/14 주간·11/14 야간 LOUDCARNIVAL을 아틀리에홀로 적고 시각은 TBA, DAY PASS 35,000원 / DOOR +5,000원. 11/15 원맨은 BABYDOLL, OPEN 18:00 / START 18:30, 예매 30,000원 / 당일 35,000원. 같은 페이지가 연결한 mysub 예매 페이지 렌더에는 11/13 시작 10:00, 야간으로 제목이 붙은 11/14 페이지도 시작 10:00, 11/15 원맨도 시작 9:30으로 보여 시각이 충돌한다. 원문 HTML 재조회는 HTTP 429. 팬미팅은 장소가 참가자에게만 공개라 등록하지 않음. 티켓 링크: https://mysub.kr/events/261113-loudcarnival-korea-tour https://mysub.kr/events/261114-loudcarnival-korea-tour https://mysub.kr/events/261115-loudcarnival-zenbukiminoseida-korea-live .
- 집계 목록에서만 보고 공식 페이지를 열지 않은 후보: Blue Note Tokyo All-Star Jazz Orchestra 2026-11-26 세종, Mass of the Fermenting Dregs 2026-12-04, Khaki 2026-12-05. 다음 신규 조사.
- 접근 실패로 기존 값 삭제나 상태 하향 없음. 취소·연기 공지를 새로 확인하지 않음.

## Run: 2026-11-09 (KST, 홀수일, 재검증 우선)

KST 날짜는 `2026-11-09` 월요일로 재확인했다. 신규 상세 조사 0건. 기존 미래 공연 5건을 공식 페이지를 다시 열어 재검증했다. 7일 이내 검증 건은 없었다. 30일 이내 예매 오픈 예정 건은 없었다.

- `kinoue64-2026-11-14` / `kinoue64-2026-11-15`: 변경 없음. DAY1 2026-11-14 18:00 KT&G 상상마당 라이브홀, 예매 75,000원, 일반예매 2026-08-18 20:00. DAY2 2026-11-15 18:30 Gamma Hall, 예매 50,000원, 같은 오픈 시각. 선예매 문구 없음(`presaleStatus: none`). 좌석 등급명은 페이지에 없고 단일 예매가만 있어 seatPrices는 비움. 대표곡은 이번에도 공식 영상 3곡을 열지 못해 unverified 유지(기존 2026-10-18 기록 재사용 아님, 미검증 유지). 공연 근거: https://4kor4kor4kor.com/tickets/kinoue64-2026day1 https://4kor4kor4kor.com/tickets/kinoue64-2026day2 상태 ON SALE. 환불은 2026-11-09 22:00까지라고 적혀 있음.
- `blu-swing-2026-11-15`: 일반예매 2026-08-27 목 오후 12:00를 새로 기록. 일시 2026-11-15 17:00, 홍대 롤링홀, 전석 스탠딩 66,000원. 선예매 문구 없음. YES24 영문 상품은 Standing W66,000, 날짜 Nov 15, 2026. 대표곡 3곡은 이번 신규 검증(공식 채널 @BLUSWINGchannel): クラゲ https://www.youtube.com/watch?v=Vy7cxw8PaT0 (기존 링크를 다시 열어 채널 확인), BLUE MOON https://www.youtube.com/watch?v=gQw8ZNZBK_M , 悲しい自由 https://www.youtube.com/watch?v=D2jePJruUdA . 조회수는 연 페이지에 노출되지 않아 조회수 순위는 확정하지 않음. 곡 근거와 공연 근거를 분리했다. 공연 근거: https://www.highjinkx.com/blu-swing-2026 https://www.highjinkx.com/show-list/blu-swing2026 https://ticket.yes24.com/English/Perf/59831 https://www.blu-swing.com/posts/59173178/ . 곡 근거: 위 3개 watch URL과 https://www.blu-swing.com/posts/12835400/ . status는 pending. 필수 공연 사실은 채워졌으나 공식 한국 예매·기획사·아티스트 페이지에서 한글 표기를 찾지 못했고, 확정 아티스트는 한글 별칭이 있어야 해서 confirmed로 올리지 않음. 일본어 별칭 ブルースウィング·ブルースイング은 https://www.blu-swing.com/ 메타 키워드에서 확인.
- `lausbub-kirara-2026-11-20`: confirmed. 일반예매 2026-09-29 화 오후 12:00, 선예매 없음, 2026-11-20 20:00, KT&G 상상마당 홍대 라이브홀, 전석 스탠딩 66,000원. 같은 기획사 영문 줄의 `2027.11.20`은 요일(금)과 한글 본문·YES24 Nov 20, 2026과 어긋나 오기로 보고 2026을 유지. 대표곡 3곡은 이번 신규 검증, 채널 @LAUSBUB: Telefon https://www.youtube.com/watch?v=zbTUx2rIDy8 , sign https://www.youtube.com/watch?v=Cfta2wTJoZQ , higher https://www.youtube.com/watch?v=2I6iOmCvvmE . 라이브 영상은 제외. lazy 비주얼라이저는 oEmbed 채널이 @LAUSBUB_JP라 이번 3곡에서 제외. 조회수 미노출. 공연 근거: https://www.highjinkx.com/larara https://www.highjinkx.com/show-list/larara https://ticket.yes24.com/English/Perf/60323 . 곡 근거: https://lausbub.jp/movies/categories/video 와 위 watch URL. 별칭 키라라는 기획사 한글 본문, ラウスバブ는 https://lausbub.jp/ 메타 설명. 기존 `라우스법 & 키라라`는 삭제하지 않음.
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
