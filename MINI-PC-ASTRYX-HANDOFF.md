# J-LIVE Astryx 목업 — 미니 PC 인수인계

작성일: 2026-11-20 (KST)

이 문서는 J-LIVE 원본 사이트를 건드리지 않고 별도 폴더에서 만들고 있는 UI/UX 목업을 다른 Windows 미니 PC에서 이어 작업하기 위한 안내입니다. 여기서 Astryx는 **Meta의 Astryx CLI**를 말합니다.

## 저장소와 전달 브랜치

- GitHub 저장소: <https://github.com/ych061661-hash/j-live-korea>
- 인수인계 브랜치: `handoff/astryx-minipc-mockup`
- 인수인계 파일: `MINI-PC-ASTRYX-HANDOFF.md`
- 목업 소스 묶음: `MINI-PC-ASTRYX-SOURCE.zip`
- 목업 폴더: `apps-in-toss/mockups/jlive-uiux`

인수인계 브랜치는 새 작업용입니다. `main`에는 직접 반영하지 않았으며, 이 브랜치의 정적 사이트 파일 변경도 요청 없이 배포하지 마세요. 원본 사이트와 목업을 분리해서 유지하고, 목업 작업은 `apps-in-toss/mockups/jlive-uiux` 안에서 진행합니다.

## 새 Windows 미니 PC 준비

### 1. 기본 도구 설치

다음 프로그램을 설치합니다.

- Git for Windows: <https://git-scm.com/download/win>
- Node.js 22 LTS: <https://nodejs.org/en/download>

설치 후 새 PowerShell 창에서 버전을 확인합니다.

```powershell
git --version
node --version
npm --version
```

이 프로젝트는 Node 22 계열을 기준으로 작업했습니다. Node.js 설치 후 터미널을 새로 열어야 `node`, `npm` 명령을 인식합니다.

### 2. 인수인계 브랜치 받기

```powershell
git clone --branch handoff/astryx-minipc-mockup https://github.com/ych061661-hash/j-live-korea.git
cd .\j-live-korea
```

저장소 안의 `MINI-PC-ASTRYX-SOURCE.zip`을 압축 해제합니다.

```powershell
Expand-Archive -LiteralPath .\MINI-PC-ASTRYX-SOURCE.zip -DestinationPath . -Force
```

압축 안의 `apps-in-toss` 폴더가 저장소 루트에 생겼는지 확인합니다.

### 3. 의존성과 Meta Astryx CLI 설치

Astryx CLI는 전역 설치가 아니라 `apps-in-toss/package.json`에 고정된 프로젝트 로컬 개발 의존성으로 설치합니다. 전역 `npm install -g astryx`는 필요하지 않습니다.

```powershell
cd .\apps-in-toss
npm ci
```

설치된 CLI가 동작하는지 확인합니다.

```powershell
npm run astryx -- --help
npm run astryx -- search Calendar
npm run astryx -- component TextInput
```

컴포넌트나 템플릿 API를 추측하지 말고 먼저 CLI에서 검색하거나 상세를 확인합니다.

```powershell
npm run astryx -- search "검색할 UI"
npm run astryx -- component Button
npm run astryx -- template library
npm run astryx -- docs getting-started
```

저장소의 `apps-in-toss/AGENTS.md`가 Astryx 사용 규칙의 기준입니다. 템플릿의 프레임·간격을 유지하고, 이미 있는 페이지를 새로 만들지 말고 해당 섹션에 필요한 블록을 추가합니다. 실제 전달 전에는 지침에 따라 빌드와 `doctor` 검증을 확인합니다.

### 4. 목업 로컬 실행

```powershell
cd .\mockups\jlive-uiux
npm run dev
```

브라우저에서 <http://127.0.0.1:5173/#top>을 엽니다. 서버를 종료하려면 PowerShell에서 `Ctrl+C`를 누릅니다. 다른 PC/휴대전화에서 같은 네트워크로 열어야 할 때만 다음처럼 실행하고 Windows 방화벽의 로컬 네트워크 허용 여부를 확인합니다.

```powershell
npm run dev -- --host 0.0.0.0
```

### 5. 빌드와 확인

목업 폴더에서 실행합니다.

```powershell
npm run build
```

빌드 산출물은 `apps-in-toss/mockups/jlive-uiux/dist`에 만들어집니다. `node_modules`와 `dist`는 전달물에 포함하지 않습니다.

## 현재 목업 상태

- J-LIVE 원본 운영 사이트의 코드는 목업 작업 중 수정하지 않습니다.
- 공연 검색, 달력 필터와 일정 표시, 날짜 선택, 공연 상세 펼침, 일정 공유와 정보 영역을 포함한 별도 React/Vite 목업입니다.
- 같은 날짜의 여러 공연은 달력에 각각 점으로 나타냅니다.
- `UPCOMING WEEKEND` 영역은 실제 주말만 보여주는 섹션이 아니라, KST 기준 가장 가까운 예정 공연 시리즈를 최대 3개 보여줍니다. 공연일이 지나면 다음 공연이 그 자리를 채웁니다.
- 동일 아티스트·공연장·공식 예매 URL을 공유하는 회차는 한 시리즈로 묶습니다. 연속 날짜는 `11.20–11.22 금·토·일`, 비연속 날짜는 날짜별로 표시합니다. 각 항목에는 D-day가 표시됩니다.
- `public/data/mockEvents.json`은 2026-11-16 기준의 정적 스냅샷입니다. 최신 운영 데이터로 자동 동기화되지 않습니다. 새 일정 사실은 별도 공식 출처 확인 없이 추가하지 않습니다.
- 이미지 파일은 목업에 포함되어 있지만, 이미지 권리 확인이 완료됐다는 뜻은 아닙니다. 권리 자료는 보류 상태로 유지합니다.
- 최근 로컬 빌드(`npm run build`)는 통과했습니다. Vite는 500 kB보다 큰 JavaScript 번들 경고를 출력하므로 후속 성능 개선 후보로 기록합니다.

## 작업 규칙

1. UI 수정은 `apps-in-toss/mockups/jlive-uiux`에서만 합니다. 원본 운영 사이트 파일을 바꾸려면 별도 요청과 범위 확인이 필요합니다.
2. 데이터 사실은 저장된 목업 스냅샷과 공식 출처를 구분합니다. 확인일이나 예매 상태를 추측하지 않습니다.
3. 모바일 360/390px 및 데스크톱에서 변경한 흐름을 확인합니다.
4. 변경 전 `git status`를 확인하고, 사용자 변경을 덮어쓰지 않습니다.
5. 작업 브랜치에서 커밋하고 PR로 검토합니다. `main` 병합과 Cloudflare 배포는 별도 명시 요청 없이 하지 않습니다.
6. Astryx 버전 업그레이드는 필요할 때만 수행하고, 올린 뒤 `npm run astryx -- upgrade --from <이전 버전> --apply` 안내를 따릅니다.
7. 계정 토큰, 비밀번호, `.env`, Cloudflare/Google 자격 증명을 저장소나 인수인계 문서에 넣지 않습니다. 새 기기에서 서비스 계정이 필요하면 사용자가 직접 로그인합니다.

## 자주 발생하는 문제

- `npm`을 찾지 못함: Node.js 설치가 끝난 뒤 PowerShell을 닫고 새로 엽니다.
- `npm ci` 실패: `apps-in-toss` 폴더에서 실행 중인지 확인합니다. `package.json`과 `package-lock.json`은 함께 유지합니다.
- Astryx 명령을 찾지 못함: 먼저 `npm ci`를 완료하고 `apps-in-toss` 폴더에서 `npm run astryx -- --help`를 실행합니다.
- 목업 주소 접속 실패: Vite 서버가 실행 중인지 확인하고 브라우저 주소가 `http://127.0.0.1:5173/#top`인지 확인합니다. 포트 충돌이면 `npm run dev -- --port 5174`로 실행합니다.
- 이미지가 보이지 않음: 압축을 저장소 루트에 풀었는지 확인합니다. 이미지 경로는 목업의 `public/assets` 기준입니다.

## 이어서 작업할 때 첫 확인

```powershell
git status --short --branch
cd .\apps-in-toss
npm ci
npm run astryx -- --help
cd .\mockups\jlive-uiux
npm run dev
```

먼저 목업 화면과 데이터를 확인한 뒤 요청된 범위만 수정합니다. 작업이 끝나면 빌드, 변경된 화면 확인, `git diff --check`를 실행하고 수정 파일과 미확인 사항을 기록합니다.

