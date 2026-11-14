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
| penthouse-2026-12-19 | Penthouse 2026-12-19 | 2026-09-23 | 2026-11-13 | 대표곡 3곡 | https://penthouse-tokyo.com/news/1662/ | pending. 일반예매 2026-09-01 12:00를 공식 사이트에서 확인. 선예매 문구 없음. YES24 한국어 상품은 접속 제한 | 공식 영상 3곡. YES24는 제한 해제 후 |
| mulasaki-ima-2026-12-12 | 紫 今 2026-12-12 | 2026-09-24 | 2026-11-13 | 시작 시각, 대표곡 3곡. 가격은 이번 미재확인 | https://www.threads.com/@mulasakiima/post/DdTjbtmkq8G | pending. 일반예매 2026-09-23 20:00. YES24 상품은 시간 초과 | 시작 시각과 공식 영상 3곡 |
| hump-back-2027-01-23 | Hump Back 2027-01-23 | 2026-09-24 | 2026-11-13 | 대표곡 3곡 | https://humpback.jp/contents/1073598 | pending. 일정·전석 132,000원·일반예매 유지. 등급명을 1층 스탠딩·2층 지정석으로 맞춤. 선예매 문구 없음 | 공식 영상 3곡 |
| nee-2026-12-18 | NEE 2026-12-18 | 2026-10-18 | 2026-11-13 | 시작 시각, 일반예매 시각, 좌석 등급명, 대표곡 3곡 | https://neeofficial.jp/contents/1109451 | pending. 날짜·장소·88,000원·판매일 2026-09-29 재확인. 시각은 공지에 없음 | 시작 시각·판매 시각·공식 영상 3곡 |
| luck-life-2026-12-19 / 12-20 | LUCK LIFE | 2026-10-18 | 2026-11-13 | 대표곡 3곡 | https://luck-life.com/news/2026/09/30/9023 | pending. 양일 일정·가격·일반예매 2026-10-01 12:00 재확인. 선예매 문구 없음 | 공식 영상 3곡 |
| zenbu loudcarnival / one-man | ぜんぶ君のせいだ。 11/14·11/15 | 2026-11-10 | 2026-11-13 | 11/14 시작 시각 TBA. 11/15 시각 충돌. 팬미팅 장소 비공개 | https://kiminosei.com/live/ | 미등록. 11/13은 오늘이라 대상 아님. 11/15 mysub는 OPEN 9:00/START 9:30, 아티스트 페이지는 18:00/18:30 | 시각 충돌 해소 전 추가 금지 |
| blue-note-tokyo-all-star-jazz-orchestra-2026-11-26 | Blue Note Tokyo All-Star Jazz Orchestra 2026-11-26 | 2026-11-10 | 2026-11-12 | 일반예매·선예매 일시, 대표곡 3곡, 공식 한글·일본어 별칭 | https://nol.yanolja.com/ticket/products/26012128 | 7일 이내. 이번 미재오픈 | 오픈 공지와 공식 영상 3곡 |
| mass-of-the-fermenting-dregs-2026-12-04 | Mass Of The Fermenting Dregs 2026-12-04 | 2026-11-10 | 2026-11-12 | 일반예매·선예매 일시, 대표곡 3곡 | https://ticket.melon.com/performance/index.htm?prodId=213843 | 7일 이내. 이번 미재오픈 | 오픈 공지와 공식 채널 영상 3곡 |
| sui-sui-duck-2026-12-20 | sui sui duck 2026-12-20 | 2026-11-12 | 2026-11-12 | 일반예매·선예매 일시, 대표곡 3곡, 일본어 별칭 | https://ticket.melon.com/performance/index.htm?prodId=214128 | 7일 이내. 이번 미재오픈 | 오픈 공지와 공식 영상 3곡 |
| runidre-2027-01-16 | RUNIDRE 2027-01-16 | 2026-11-12 | 2026-11-12 | 일반예매·선예매 일시, 대표곡 3곡, 한글·일본어 별칭 | https://ticket.melon.com/performance/index.htm?prodId=214040 | 7일 이내. 이번 미재오픈 | 오픈 공지와 공식 영상 3곡 |
| yukiguni-2026-12-17 | 雪国 2026-12-17 | 2026-11-12 | 2026-11-14 | 일반예매·선예매 일시 | https://ticket.melon.com/performance/index.htm?prodId=214216 | pending 신규. 상품 본문·포스터에 예매 오픈 일시 없음. 11/06 20:00은 집계 사이트에만 있음. 아티스트 공식 https://ykq2.jp/ 은 curl·fetch HTTP 403 | 멜론 오픈 공지 또는 기획사(테잎스) 공지 |
| nothings-carved-in-stone-2026-12-20 | Nothing's Carved In Stone 2026-12-20 | 2026-11-14 | 2026-11-14 | 일반예매·선예매 일시 | https://www.ncis.jp/news/one-man-live-korea/ https://nol.yanolja.com/ticket/products/26015587 | pending 신규. 공식 공지 본문·포스터에 오픈 일시 없음. 한국어 NOL 상단 표기 "예매대기" | NOL 오픈 공지 재확인 (판매 개시 여부 포함) |
| kurayamisaka-2027-01-09 | kurayamisaka (with parannoul) 2027-01-09 | 2026-11-14 | 2026-11-14 | 공식 일본어 표기(별칭) | https://www.highjinkx.com/aosaka https://kurayamisaka.com/live/ | pending 신규. 다른 필수 사실은 공식 확인. confirmed 별칭 테스트가 일본어 별칭을 요구하나 공식 일본어 표기를 찾지 못해 지어내지 않음. YES24 https://ticket.yes24.com/Perf/60147 은 접속 제한 | 공식 일본어 표기 확인 시 confirmed |
| myth-and-roid-2026-12-25 (미등록) | MYTH & ROID 2026-12-25 KT&G 상상마당 홍대 | 2026-11-14 | 2026-11-14 | 시작 시각, 예매처, 가격, 예매 일시 | https://mythandroid.com/contents/1109283 | 미등록. 공식 공지는 날짜·장소만 있고 "詳細が決まり次第お知らせ" (발표 대기). 예매처 미정이라 레코드 생성 보류 | 공식 상세 발표 후 등록 |
| zazen-boys-2026-12-06 | ZAZEN BOYS 2026-12-06 | 2026-09-23 | 2026-11-11 | 일반예매·선예매 일시, 대표곡 | https://www.highjinkx.com/show-list/zazen-boys | 7일 이내. 이번 미재오픈. YES24 접속 제한은 2026-11-11 기록 | YES24 또는 29CM 상품 본문 |
| yuki-kajiura-2026-11-22 | Yuki Kajiura 2026-11-22 | 2026-11-10 | 2026-11-10 | 대표곡 3곡, 티켓링크 상품 URL | http://yonsei-arts.com/product/521 | 7일 이내. 이번 미재오픈 | 공식 영상 3곡과 티켓링크 상품 페이지 |
| ellegarden-2026-11-28 / 11-29 | ELLEGARDEN 11/28·11/29 | 2026-11-10 | 2026-11-10 | 시작 시각, YES24 상품 URL, 대표곡, 공식 한글 별칭 | https://www.universal-music.co.jp/ellegarden/news/2026-08-10/ | 7일 이내. 이번 미재오픈 | YES24 상품 페이지와 공식 영상 3곡 |
| kazumi 광주·성남·영등포·강동·대구·부산 | 2026-12-19~26 | 2026-11-09 | 2026-11-10 | 추가 도시 일반예매 일시. 부산은 2026-11-10 같은 공식 페이지에서 가격이 기존과 같아 레코드 미변경 | http://kazumitateishi.com/live.html | 7일 이내. 이번 미재오픈 | 도시별 오픈 공지 |
| kazumi-tateishi-trio-2026-12-26 | Kazumi 부산 | 2026-08-12 | 2026-11-10 | 이번 실행에서 상품 페이지는 다시 열지 않음 | http://kazumitateishi.com/live.html | 2026-11-10에 아티스트 라이브 페이지의 부산 일정·가격이 기존 값과 같았음 | 다음 홀수일 상품 페이지 재오픈 |

## Run: 2026-11-14 (KST, 짝수일, 신규 발견 우선)

KST 날짜는 `date`로 `2026-11-14` 토요일 09:00을 재확인했다. 원격은 `https://github.com/ych061661-hash/j-live-korea.git`와 일치하고 새 클론의 작업 트리는 깨끗했다. 열린 PR은 #1(NEE 2026-09-29), #2(2026-11-06 초안)로 이번 일일 작업과 무관하며 진행 중인 같은 목적의 실행은 없었다. 신규 상세 조사 5건(雪国, Nothing's Carved In Stone, kurayamisaka, コレサワ, MYTH & ROID). 기존 레코드는 예매 임박(30일 이내 오픈)·공식 변경 신호가 없어 재검증하지 않았다. 대표곡은 각 영상 watch 페이지의 channelId·업로더와 공식 채널 externalId를 대조했고, 조회수는 watch 페이지 공개 viewCount로 비교했다(라이브·가사·티저 제외). 프로필 이미지는 공식 채널 og:image(900x900)를 캐시했다.

- `koresawa-2027-02-27` 신규 confirmed. 2027-02-27 토 개장 17:30 / 시작 18:00, YES24 WANDERLOCH HALL. 일반예매 2026-10-22 목 20:00 (아티스트 공식). 선예매 문구 없음. VIP(1층 스탠딩) 110,000 / 1층 스탠딩석 99,000 / 2층 지정석 99,000. 최저 일반 액면가 99,000원. VIP 혜택은 굿즈 선구매·선입장·사인 포스터. 공식 사이트 SOLDOUT 표기는 HTML 주석 처리되어 있어 매진으로 기록하지 않음. 공연 근거: https://www.koresawa.jp/live.html https://ticket.melon.com/performance/index.htm?prodId=214074 https://ticket.yes24.com/Perf/60647 (YES24는 미열람). 곡(이번 검증, @koresawa UCY47aDuWPpH18NJlidLg04A): たばこ https://www.youtube.com/watch?v=7B_PVsPvcg0 , あたしを彼女にしたいなら https://www.youtube.com/watch?v=e3857A5uuCA , 恋人失格 https://www.youtube.com/watch?v=3EIHuC5e21k . 곡 선정 근거: https://www.koresawa.jp/video.html 삽입 영상 50개의 공개 조회수 비교(元彼女のみなさまへ는 Lyric Video라 제외).
- `kurayamisaka-2027-01-09` 신규 pending. AOSAKA: kurayamisaka & parannoul, 2027-01-09 토 18:30, KT&G 상상마당 라이브홀, 전석 스탠딩 88,000원, YES24, 일반예매 2026-09-17 목 12:00. 선예매 문구 없음. 밴드 공식 라이브 페이지가 Seoul을 sold out으로 표기해 ticketAvailability sold_out. 공식 일본어 표기를 찾지 못해 confirmed 보류. 공연 근거: https://www.highjinkx.com/aosaka https://kurayamisaka.com/live/ . YES24 https://ticket.yes24.com/Perf/60147 은 "비정상적인 접근으로 일시적으로 서비스 접속이 제한". 곡(이번 검증, @kurayamisaka_official UC1Sw2amYkOROo1OEoImlOjA): farewell https://www.youtube.com/watch?v=igHx-8HpK14 , sekisei inko https://www.youtube.com/watch?v=dBOT-TLz0Zg , metro https://www.youtube.com/watch?v=DPTg3D80cOI (채널 최근 업로드 중 MV 조회수 상위). 별칭 쿠라야미사카는 Highjinkx 공지 표기.
- `nothings-carved-in-stone-2026-12-20` 신규 pending. 2026-12-20 일 개장 17:30 / 시작 18:00, 롤링홀, 전석 스탠딩 88,000원, NOL 티켓. 일반예매·선예매 일시는 공식 공지 본문·포스터·NOL 본문에 없음. 공연 근거: https://www.ncis.jp/news/one-man-live-korea/ https://nol.yanolja.com/ticket/products/26015587 https://world.nol.com/en/ticket/products/26015587 . 곡(이번 검증, ncis.jp가 링크한 @ncisofficialchannel UComXMjbFG2EyY_-A47KkWZw): Will https://www.youtube.com/watch?v=NdMjsZOzeEQ , Freedom https://www.youtube.com/watch?v=wpVZ4y3N4_Q , May https://www.youtube.com/watch?v=jdrr6PgidNI . 채널 동영상 탭 최근 30개 기준 비교라 과거 업로드 인기곡은 미비교. 같은 이름의 다른 채널(UCPjkfFD4u9kLL1_s8Jygb5w, @ncisofficialchannel-g4y) 영상은 쓰지 않음. 별칭 낫띵스 카브드 인 스톤은 NOL 한국어 표기.
- `yukiguni-2026-12-17` 신규 pending. 雪国 One Man Tour 2026 “claras” in Seoul - with Ghost Bookstore, 2026-12-17 목 20:00, 얼라이브홀, 스탠딩 66,000원, 멜론티켓, 주최 테잎스. 오픈 일시는 공식 근거 없음. 공연 근거: https://ticket.melon.com/performance/index.htm?prodId=214216 . 아티스트 공식 사이트는 HTTP 403. 곡(이번 검증, @ykq2_band UChaJgmvmEGlZmuEZNLIo5Vw): 東京 https://www.youtube.com/watch?v=-p5fSjGXUVI , ひぐらしの夢 https://www.youtube.com/watch?v=w50-b2OhWjw , クララ https://www.youtube.com/watch?v=L8XgNc_MimY (공식 MV 조회수 상위 3). 별칭 유키구니는 멜론 상품 표기.
- MYTH & ROID 2026-12-25는 공식 https://mythandroid.com/contents/1109283 가 날짜·장소만 발표해 미등록.
- 집계 목록에서만 보고 열지 않은 후보: 사이토 슈카, 하나미야 니나, NIGHT HIKE TOURS in SEOUL 12/19, Rain Tree, 도비비 12/26·27, Pile 12/26·27, 마츠오 코지 12/27, 러블리서머짱 2027-01-11, 타카하시 요코 2027-02-27, 美波 2027-03-27, 네크라이토키 2027-03-27, 결속밴드 2027-05-08, 오오하시 아야카 2027-07-03, KIMCHIKURA × ANISAMA 2027-01-23(11/18 19:00 오픈 표기). 다음 신규 조사 대상.
- 접근 실패로 기존 값 삭제나 상태 하향 없음. 취소·연기 공지를 새로 확인하지 않음.

## Run: 2026-11-13 (KST, 홀수일, 재검증 우선)

KST 날짜는 `TZ=Asia/Seoul date`로 `2026-11-13` 금요일을 재확인했다. 원격은 `https://github.com/ych061661-hash/j-live-korea.git`와 일치하고 작업 트리는 깨끗했다. 같은 목적의 열린 일일 작업 PR은 없었다. 기존 열린 PR은 2026-09-29 NEE 등록과 2026-11-06 초안이며 이번 일일 재검증이 아니다. 신규 상세 조사 0건. 7일 이내 검증 건은 예매 임박·공식 변경 신호가 없어 건너뛰었다. 저장된 일반예매일이 오늘부터 30일 이내인 미래 오픈 건은 없었다. 대표곡 영상은 이번 실행에서 다시 열지 않았다. 접근 실패로 기존 가격·곡·출처를 지우거나 상태를 내리지 않았다.

- `kana-boon-2026-12-05` 사실 유지, verifiedAt 2026-11-13. 2026-12-05 토 18:00, YES24 LIVE HALL, 전석 138,000원. 일반예매 2026-08-10 월 20:00. 선예매 문구 없음. 대표곡 3곡은 이번 미재오픈, 기존 링크 재사용. 공연 근거: https://m.ticket.yes24.com/Notice/18262 https://sp.kanaboon.jp/news/detail/2781 . 아티스트 예매 단축 주소 https://to.livet.one/KANA-BOON26 는 본문이 비어 사실 근거로 쓰지 않았다. 곡 근거(기존 재사용): https://www.youtube.com/watch?v=ZFoJYI7Q4iA https://www.youtube.com/watch?v=UgS7vgquBvo1 https://www.youtube.com/watch?v=JiVXh3hsI4k .
- `homecomings-2026-12-13` 사실 유지. 2026-12-13 일 오후 5시, 무신사 개러지, 전석 스탠딩 88,000원. 일반예매 2026-08-31 월 19:00. 선예매 문구 없음. 대표곡은 이번 미재오픈. 공연 근거: https://ticket.melon.com/csoon/detail.htm?csoonId=12775 https://ticket.melon.com/performance/index.htm?prodId=213806 . 곡 근거(기존): https://www.youtube.com/watch?v=vGtRxwQOzlo https://www.youtube.com/watch?v=ztZEy5htxLI https://www.youtube.com/watch?v=f191jgQX1UA .
- `fujii-kaze-2027-01-09` 사실 유지. 2027-01-09 토 개장 16:30/시작 18:00, 고척스카이돔. 로컬 예매 2026-06-17 19:00, 글로벌 예매 2026-06-18 19:00. 가격은 플로어 FR 210,000 / 플로어 SR 198,000 / 플로어 R 187,000 / 지정석 S 165,000 / 지정석 A 154,000 / 지정석 B 132,000. 최저 일반 액면가 132,000원. 대표곡은 이번 미재오픈. 공연 근거: https://hehn.fujiikaze.com/pwt/ https://ticket.melon.com/csoon/detail.htm?csoonId=12366 . 곡 근거(기존): https://www.youtube.com/watch?v=dawrQnvwMTY https://www.youtube.com/watch?v=TcLLpZBWsck https://www.youtube.com/watch?v=SfPkl7lol7g .
- `cutie-street-2027-01-23` 사실 유지. 2027-01-23 토 오후 6시, 일산 킨텍스(KINTEX) HALL 9A, 전석 135,000원. 선예매 2026-08-21 금 20:00, 일반예매 2026-08-24 월 20:00. 선예매 대상 조건은 연 공지 본문에 없다. 대표곡은 이번 미재오픈. 공연 근거: https://ticket.melon.com/csoon/detail.htm?csoonId=12672 https://ticket.melon.com/performance/index.htm?prodId=213705 . 곡 근거(기존): https://www.youtube.com/watch?v=CfwGsFV7jNc https://www.youtube.com/watch?v=YI2jG7rnrys https://www.youtube.com/watch?v=mNNRlG8aqIs .
- `kenshi-yonezu-2027-01-14` `kenshi-yonezu-2027-01-16` `kenshi-yonezu-2027-01-17` 일정·가격 유지. 1/14 목 19:30, 1/16 토 19:00, 1/17 일 19:00, 인스파이어 아레나. 플로어석 172,000 / 지정석 P 165,000 / 지정석 R 154,000 / 지정석 S 143,000. 최저 일반 액면가 143,000원. 이번 NOL 본문은 휠체어석 전화예매를 2026-10-22 12:00으로 적고 일반예매 시각을 다시 적지 않아 기존 일반예매 일시는 유지하고 ticketing 검증일은 2026-10-19로 남겼다. 대표곡은 이번 미재오픈. 공연 근거: https://nol.yanolja.com/ticket/products/26015024 . Live Nation https://www.livenation.kr/event/kenshi-yonezu-2026-2027-world-tour-ghost-seoul-tickets-edp1705322 는 HTTP 403. 곡 근거(기존): https://www.youtube.com/watch?v=SX_ViT4Ra7k https://www.youtube.com/watch?v=NMA_isZYsYQ https://www.youtube.com/watch?v=LmZD-TU96q4 .
- `penthouse-2026-12-19` 일반예매를 채움. pending 유지. 2026-12-19 토 19:00, YES24 LIVE HALL. 일반예매 2026-09-01 화 12:00. 선예매 문구 없음. 1층 스탠딩 110,000원, 2층 지정석 121,000원. 저장된 한국어 등급명 지정석 121,000 / 스탠딩석 110,000은 YES24를 이번에도 열지 못해 유지. 최저 일반 액면가 110,000원. 대표곡 미검증. 공연 근거: https://penthouse-tokyo.com/news/1662/ . YES24 https://ticket.yes24.com/Perf/59886 는 "비정상적인 접근으로 일시적으로 서비스 접속이 제한".
- `mulasaki-ima-2026-12-12` 일반예매를 채움. pending 유지. 2026-12-12 토, YES24 WANDERLOCH HALL. 일반예매 2026-09-23 수 20:00. 시작 시각은 연 공식 게시물에 없다. 선예매 문구 없음. 스탠딩석·지정석 각 99,000원은 이번 YES24 재열람이 시간 초과라 2026-09-24 값을 유지. 대표곡은 1곡만 있고 이번 미재오픈. 공연 근거: https://www.threads.com/@mulasakiima/post/DdTjbtmkq8G . YES24 https://ticket.yes24.com/Perf/60203 는 시간 초과. 소니 대만 아티스트 페이지에는 이 서울 일정·가격이 없었다.
- `hump-back-2027-01-23` 등급명만 변경. pending 유지. 2027-01-23 토 오후 6시, YES24 LIVE HALL. 일반예매 2026-10-07 수 12:00. 선예매 문구 없음. 1층 스탠딩 132,000원, 2층 지정석 132,000원. 최저 일반 액면가 132,000원. 대표곡은 1곡만 있고 이번 미재오픈. 공연 근거: https://humpback.jp/contents/1073598 .
- `nee-2026-12-18` 사실 유지. pending 유지. 2026-12-18, KT&G SANGSANGMADANG LIVE HALL HONGDAE, 88,000원, 멜론 티켓, 판매일 2026-09-29. 시작 시각과 판매 시각은 공지에 없다. 선예매 문구 없음. 좌석 등급명과 대표곡 없음. 공연 근거: https://neeofficial.jp/contents/1109451 .
- `luck-life-2026-12-19` `luck-life-2026-12-20` 사실 유지. pending 유지. 12/19 개장 17:15/시작 18:00, 12/20 개장 16:15/시작 17:00, 무신사 개러지. SVIP 198,000원, VIP 154,000원, 일반(一般) 99,000원. 일반예매 2026-10-01 목 12:00 선착순. 선예매 문구 없음. 대표곡 없음. 공연 근거: https://luck-life.com/news/2026/09/30/9023 https://ticket.melon.com/csoon/detail.htm?csoonId=12884 .
- ぜんぶ君のせいだ。는 등록하지 않음. https://kiminosei.com/live/ 는 11/14 주간·야간을 ATELIER HALL, TIME TBA, DAY PASS 35,000원 / DOOR +5,000원으로 유지. 11/15 원맨은 BABYDOLL, OPEN 18:00 / START 18:30, 예매 30,000원 / 당일 35,000원. 같은 페이지가 연결한 https://mysub.kr/events/261115-loudcarnival-zenbukiminoseida-korea-live 는 OPEN 오전 9:00 / START 오전 9:30이라 시각이 충돌한다. 시간대 환산으로 맞추지 않음. 11/13 합동은 실행일 당일이라 추가하지 않음. 팬미팅 장소는 참가자에게만 공개.
- 신규 후보 상세 조사는 하지 않음. 다음 신규: 雪国 One Man Tour 2026 claras in Seoul. 다음 재확인: Penthouse·Hump Back·LUCK LIFE 공식 영상 3곡, 紫 今 시작 시각, NEE 시작·판매 시각, ぜんぶ君のせいだ。 시각 충돌, 7일 넘으면 ZAZEN BOYS·ELLEGARDEN·Yuki Kajiura·Kazumi 추가 도시 오픈 공지.

## Run: 2026-11-12 (KST, 짝수일, 신규 발견 우선)

KST 날짜는 `TZ=Asia/Seoul date`로 `2026-11-12` 목요일을 재확인했다. 원격은 `https://github.com/ych061661-hash/j-live-korea.git`와 일치하고 작업 트리는 깨끗했다. 실행 중인 다른 일일 검증 에이전트는 없었다. 신규 상세 조사 5건. 기존 미래 공연 재검증은 예매 임박·공식 변경 신호가 없어 하지 않았다. 저장된 일반예매일이 오늘부터 30일 이내인 기존 레코드는 없었다. 7일 이내 검증 건은 건너뛰었다. 대표곡 3곡은 다섯 건 모두 이번 미검증이라 confirmed로 올리지 않았다. 접근 실패로 기존 값 삭제나 상태 하향 없음.

- `blue-note-tokyo-all-star-jazz-orchestra-2026-11-26` 신규 pending. 2026-11-26 목 19:30, 세종예술의전당. R석 60,000원, S석 40,000원. 최저 일반 액면가 40,000원. 선예매·일반예매 일시는 연 상품 본문과 공식 포스터에 없다. 공연 근거: https://nol.yanolja.com/ticket/products/26012128 . 같은 URL curl은 HTTP 403. 곡은 미검증.
- `mass-of-the-fermenting-dregs-2026-12-04` 신규 pending. 2026-12-04 금 오후 7:30, KT&G 상상마당 홍대 라이브홀, 전석 77,000원. 아티스트 공식 투어 페이지는 서울을 SOLDOUT으로 적는다. 멜론 상품의 예매 공지 본문은 비어 있어 오픈 일시를 넣지 않았다. 현장가 88,000원은 연 공식 페이지에 없어 넣지 않음. 공연 근거: https://ticket.melon.com/performance/index.htm?prodId=213843 https://www.motfd.com/iwaouthetour . 멜론 curl은 HTTP 423. 공식 사이트 유튜브 채널 ID는 `UC8HQ1Us0QsSb1i3UW6dJ26g`이나 채널 동영상 목록이 렌더되지 않아 대표곡은 비움. `@Motfd` 영상은 그 채널과 같은지 확인하지 못해 쓰지 않음.
- `khaki-2026-12-05` 신규 cancelled. 2026-12-05 토 오후 7:00, KT&G 상상마당 홍대 라이브홀. 한국어 NOL 상품의 THE VAULT 공지는 나카시오 히로토 건강 문제로 2026년 라이브 활동 중단과 공연 취소, 예매처 일괄 취소를 알린다. 판매 상태는 판매취소. 전석 스탠딩 88,000원은 같은 상품의 영문 NOL에 있다. 선예매·일반예매 일시는 연 페이지에 없다. 대표곡 미검증. 별칭 카키는 한국어 상품명. 공연 근거: https://nol.yanolja.com/ticket/products/26012829 https://world.nol.com/en/ticket/places/24000730/products/26012829 . NOL curl은 HTTP 403.
- `sui-sui-duck-2026-12-20` 신규 pending. 2026-12-20 일 오후 7:00, Vel.R(벨르), 전석 44,000원. 선예매·일반예매 일시는 예매 공지 본문이 비어 확인하지 못함. 별칭 스이스이덕은 멜론 상품명. 일본어 표기는 연 페이지에 없음. 대표곡 미검증. 공연 근거: https://ticket.melon.com/performance/index.htm?prodId=214128 .
- `runidre-2027-01-16` 신규 pending. 2027-01-16 토 오후 3:00, 큐브컨벤션센터. Happy Clover 254,000원, Smile Clover 176,000원, Enjoy Clover 66,000원. 최저 일반 액면가 66,000원. 선예매·일반예매 일시와 한글·일본어 별칭은 연 페이지에 없음. 대표곡 미검증. 공연 근거: https://ticket.melon.com/performance/index.htm?prodId=214040 .
- 다음 신규: 멜론 콘서트 목록에만 보인 雪国 One Man Tour 2026 “claras” in Seoul. 상품 페이지는 열지 않음. 다음 재확인: 위 5건의 예매 오픈 공지와 공식 영상, 예매일 미확인 pending(ZAZEN BOYS, 紫 今, Penthouse, Kazumi 추가 도시), 7일 넘은 confirmed(KANA-BOON, CUTIE STREET, Kazumi 부산, Kenshi Yonezu, Fujii Kaze 가격 공지, Homecomings 오픈 공지).

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
