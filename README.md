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
- localStorage 영속화 + **Firebase Firestore 실시간 동기화 (비밀 링크 공유)**
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

## 공동지갑 실시간 동기화 (Firebase Firestore)

현수와 태너가 **각자 폰에서 같은 우리지갑을 실시간으로 함께** 보고 입력할 수 있다.
로그인·회원가입 없이 **비밀 링크 하나**로 공유한다.

### 작동 방식

- 공유 링크는 `https://.../our-wallet/?wallet=긴랜덤ID` 형태다.
- 같은 `wallet` ID를 연 기기는 Firestore의 같은 문서(`wallets/{walletId}`)를 본다.
- 한쪽이 입력하면 곧바로(약 0.6초 디바운스 후) 저장되고, 상대 기기에 실시간 반영된다.
- 설정 → **공동지갑 공유** 에서 링크 복사 / 동기화 상태 / 공동지갑 만들기를 할 수 있다.
- **역할(현수/태너) 선택은 기기별**이고 기본 언어·통화·결제통로만 정한다. 두 기기 모두 같은 전체 지갑을 본다.
- Firebase 설정이 없으면 앱은 그대로 **이 기기에만 저장되는 로컬 모드**로 동작한다(앱이 비지 않음).

### 1. Firebase 프로젝트 만들기

1. [Firebase 콘솔](https://console.firebase.google.com) → **프로젝트 추가**
2. 좌측 **빌드 → Firestore Database** → **데이터베이스 만들기**
   - 위치는 가까운 리전(예: `asia-northeast3` 서울) 선택
   - 우선 **프로덕션 모드**로 시작해도 됨 (규칙은 아래에서 설정)
3. **프로젝트 설정(⚙️) → 일반 → 내 앱** 에서 **웹 앱(</>)** 추가
4. 표시되는 `firebaseConfig` 값(apiKey, authDomain, projectId, …)을 복사

### 2. 로컬 개발용 환경변수

```bash
cp .env.example .env
# .env 파일을 열어 Firebase 값 채우기
```

`.env` 는 `.gitignore` 에 의해 git에 올라가지 않는다. 절대 커밋하지 말 것.
값이 비어 있으면 로컬 모드로 동작한다.

### 3. GitHub Pages 배포용 시크릿

GitHub 저장소 → **Settings → Secrets and variables → Actions → New repository secret** 에
아래 6개를 추가한다(값은 `firebaseConfig` 에서):

| 시크릿 이름 | firebaseConfig 키 |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

GitHub Actions(`.github/workflows/deploy.yml`)가 빌드 시점에 이 값들을 주입한다.
시크릿을 넣은 뒤 `main` 에 다시 push(또는 Actions에서 수동 실행)하면 동기화가 켜진 채로 배포된다.

### 4. Firestore 보안 규칙

이 앱은 로그인이 없으므로 `wallets` 컬렉션 읽기/쓰기를 허용해야 한다.
**링크(문서 ID)를 아는 사람만 접근**하는 구조라, ID를 충분히 길게 만든다(앱이 자동 생성).
Firebase 콘솔 → Firestore → **규칙** 에 다음을 넣는다:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /wallets/{walletId} {
      allow read, write: if true;
    }
  }
}
```

> ⚠️ 위 규칙은 "링크를 아는 사람은 누구나 접근"이다(가족 둘이 쓰는 용도). 링크를 태너에게만 보내고 외부에 공개하지 말 것.
> 더 잠그고 싶으면 나중에 Firebase 익명 인증 + 멤버 검사 규칙으로 강화할 수 있다.

### 5. 사용

1. 한 기기에서 설정 → 공동지갑 공유 → **공동지갑 만들기**
2. **공유 링크 복사** → 태너에게 전송 (문자/카톡 등)
3. 태너가 그 링크를 열고 자기 역할을 고르면, 둘이 같은 지갑을 실시간으로 함께 쓴다.

## 데이터 보관 & 백업 (중요)

- 공동지갑을 쓰면 데이터는 **Firestore가 원본**이고, 각 기기 localStorage에 캐시된다.
- 공동지갑을 안 쓰면 데이터는 **이 기기의 브라우저 localStorage** 에만 저장된다.
- **휴대폰 변경 / 브라우저 캐시 삭제 전에는 백업**하세요. (특히 로컬 모드)
  - 설정 → 백업·복원·초기화 → "백업 파일 저장 (JSON)"
- 서비스워커는 **앱 껍데기 로딩용**일 뿐, 데이터 동기화가 아니다.

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
