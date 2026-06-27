# 우리지갑 · Our Wallet

부부 공동 자산 관리 웹앱.

## 핵심 철학

> **우리 돈은 하나다.** 계좌와 카드는 여러 개일 뿐이다.

현수 계좌에 있어도, 태너 계좌에 있어도 모두 **우리 자산**이다.
현수 카드에서 나가도, 태너 카드에서 나가도 모두 **우리 지출**이다.

이 앱은 절대 "현수 자산 / 태너 자산"처럼 개인별 재산을 나누지 않는다.
기본 관점은 항상 **우리 총자산 / 우리 수입 / 우리 지출 / 우리 예산**이다.

`현수 / 태너` 이름은 소유권이 아니라 4가지 분석 라벨일 뿐이다:
- **결제통로** (`paidVia`) — 어느 카드/계좌로 나갔나
- **보관위치** (`heldAt`) — 어느 계좌에 들어있나
- **기록자** (`recordedBy`) — 누가 입력했나
- **사용대상** (`forWhom`) — 우리/현수/태너 중 누구를 위한 지출인가

## 기술 스택

- React 18 + Vite + TypeScript
- localStorage 영속화 (최종 목표: Firebase Firestore 실시간 동기화)
- 고정환율 **1 USD = 1,500 KRW** (자동 환율 API 미사용)
- PWA (오프라인 앱 껍데기 + 홈 화면 설치)

## 로컬 실행 / 빌드

```bash
npm install
npm run dev      # 개발 서버 (http://localhost:5173, base '/')
npm run build    # 프로덕션 빌드 (base '/our-wallet/')
npm run preview  # 빌드 결과 미리보기
```

## GitHub Pages 배포

이 저장소는 `main` 브랜치에 push하면 GitHub Actions가 자동으로 빌드·배포한다.

**최초 1회 설정 (필수):**
1. GitHub 저장소 → **Settings → Pages**
2. **Build and deployment → Source** 를 **GitHub Actions** 로 변경
3. `main` 브랜치에 push (또는 Actions 탭에서 `Deploy to GitHub Pages` 수동 실행)

배포 URL: `https://amelialeecan-art.github.io/our-wallet/`

- Vite `base` 는 빌드 시 `/our-wallet/` 로 설정됨 (`vite.config.js`)
- 커스텀 도메인을 쓸 경우 `base` 를 `/` 로 바꾸고 manifest 경로를 확인할 것

## PWA 설치 방법

- **iPhone (Safari):** 공유 버튼 → "홈 화면에 추가"
- **Android (Chrome):** 메뉴 → "앱 설치" 또는 "홈 화면에 추가"

설치하면 주소창 없이 앱처럼 실행되고, 한 번 연 뒤에는 오프라인에서도 열린다.
(설정 → 데이터 화면에도 같은 안내가 있다.)

## 데이터 보관 & 백업 (중요)

- 현재 모든 데이터는 **이 기기의 브라우저 localStorage** 에만 저장된다.
- **휴대폰 변경 / 브라우저 캐시 삭제 전에는 반드시 백업**하세요.
  - 설정 → 백업·복원·초기화 → "백업 파일 저장 (JSON)"
- 서비스워커는 **앱 껍데기 로딩용**일 뿐, 데이터 동기화가 아니다.
- Firebase 실시간 동기화(비밀 링크로 둘이 공유)는 **다음 단계 예정**.

## 폴더 구조

```
src/
├── main.tsx, App.tsx
├── styles/global.css          # 글래스/물방울 디자인 시스템 (프로토타입 보존)
├── components/                # PhoneFrame, TabBar, CurrencyToggle 등 공용 UI
├── screens/                   # Home / Add / Assets / Spending / Budget / Schedule / Settings + 관리 화면
├── domain/                    # 타입·계산·seed·마이그레이션·백업
├── store/                     # WalletProvider (Context + localStorage)
├── storage/                   # adapter + repository
└── i18n/                      # 한/영 라벨 사전
public/
├── manifest.webmanifest       # PWA manifest
├── sw.js                      # 서비스워커 (오프라인 앱 껍데기)
└── icon-*.png                 # PWA 아이콘 (192/512/maskable/apple-touch)
```

## 개발 원칙
- 한 번에 다 만들지 않고 단계별로. 각 단계는 항상 동작 가능한 상태.
- 디자인 변경 최소화. 안정성·직관성·데이터 누락 방지 우선.
- 모든 금액은 원본 통화와 환산 금액을 모두 보존.
- 삭제·초기화는 확인 절차 필수.
- 계좌번호·주민번호 등 민감정보는 저장하지 않는다.
- 저장 key는 영문 enum/id, 화면 라벨만 i18n으로 표시.
