// ===== i18n 라벨 매핑 =====
// 저장은 영문 키, 표시는 여기서만 한글/영어로 변환한다.
// (전체 UI 번역은 2단계에서 확장. 1단계는 enum 라벨 + 새로 추가된 화면 문구만.)

import type {
  Account,
  Category,
  HolderLabel,
  Lang,
  PaymentSource,
  QuickAction,
  RecurringItem,
  RecurringStatus,
  UsedFor,
} from '../domain/types'

type Pair = { ko: string; en: string }
type Group = Record<string, Pair>

// enum / id → 표시 라벨
const ENUMS: Record<string, Group> = {
  usedFor: {
    shared: { ko: '우리', en: 'Shared' },
    hyeonsu: { ko: '현수', en: 'Hyeonsu' },
    tanner: { ko: '태너', en: 'Tanner' },
  },
  recordedBy: {
    hyeonsu: { ko: '현수', en: 'Hyeonsu' },
    tanner: { ko: '태너', en: 'Tanner' },
  },
  role: {
    hyeonsu: { ko: '현수', en: 'Hyeonsu' },
    tanner: { ko: '태너', en: 'Tanner' },
  },
  category: {
    food: { ko: '식비', en: 'Food' },
    cafe: { ko: '카페', en: 'Cafe' },
    transport: { ko: '교통', en: 'Transport' },
    date: { ko: '데이트', en: 'Date' },
    shopping: { ko: '쇼핑', en: 'Shopping' },
    home: { ko: '집/생활', en: 'Home' },
    other: { ko: '기타', en: 'Other' },
  },
  txType: {
    expense: { ko: '지출', en: 'Expense' },
    income: { ko: '수입', en: 'Income' },
    transfer: { ko: '이체', en: 'Transfer' },
    adjustment: { ko: '조정', en: 'Adjustment' },
  },
  accountKind: {
    cash: { ko: '현금', en: 'Cash' },
    checking: { ko: '입출금', en: 'Checking' },
    savings: { ko: '저축예금', en: 'Savings' },
    deposit: { ko: '예금', en: 'Deposit' },
    installment: { ko: '적금', en: 'Installment' },
    investment: { ko: '주식 · 투자', en: 'Stocks · Invest' },
    other: { ko: '기타', en: 'Other' },
  },
  paymentKind: {
    card: { ko: '카드', en: 'Card' },
    account: { ko: '계좌 이체', en: 'Transfer' },
    cash: { ko: '현금', en: 'Cash' },
  },
  tier: {
    spendable: { ko: '쓸 수 있는 돈', en: 'Spendable' },
    saving: { ko: '모으는·불리는 돈', en: 'Saving' },
  },
  recurringStatus: {
    due: { ko: '예정', en: 'Due' },
    done: { ko: '완료', en: 'Done' },
    skip: { ko: '건너뜀', en: 'Skipped' },
  },
  recurringType: {
    income: { ko: '수입', en: 'Income' },
    expense: { ko: '지출', en: 'Expense' },
    transfer: { ko: '이체', en: 'Transfer' },
  },
  currency: {
    KRW: { ko: '원화 KRW', en: 'KRW' },
    USD: { ko: '달러 USD', en: 'USD' },
  },
}

// 기본 제공 빠른 입력 / 반복 항목 라벨 (labelKey 로 참조)
const KEYS: Group = {
  'quick.lunch': { ko: '점심', en: 'Lunch' },
  'quick.cafe': { ko: '카페', en: 'Cafe' },
  'quick.subway': { ko: '지하철', en: 'Subway' },
  'quick.coupang': { ko: '쿠팡', en: 'Coupang' },
  'quick.tanner_snack': { ko: '태너 간식', en: 'Tanner snack' },
  'quick.date_meal': { ko: '데이트 식비', en: 'Date meal' },
  'recurring.tanner_pay': { ko: 'Tanner Pay', en: 'Tanner Pay' },
  'recurring.hyeonsu_salary': { ko: '현수 월급', en: 'Hyeonsu salary' },
  'recurring.rent': { ko: '월세', en: 'Rent' },
  'recurring.maintenance': { ko: '관리비', en: 'Maintenance' },
  'recurring.netflix': { ko: '넷플릭스', en: 'Netflix' },
  'recurring.card_bill': { ko: '카드값', en: 'Card bill' },
  'recurring.savings_transfer': { ko: '적금 이체', en: 'Savings transfer' },
}

// 1단계에서 새로 추가된 화면 문구 (역할 선택 / 설정 일부)
const UI: Group = {
  'app.name': { ko: '우리지갑', en: 'Our Wallet' },
  'app.tagline': { ko: '우리 돈은 하나', en: 'Our money is one' },
  'role.title': { ko: '이 기기에서 누구로 사용할까요?', en: 'Who is using this device?' },
  'role.useHyeonsu': { ko: '현수로 사용', en: 'Use as Hyeonsu' },
  'role.useTanner': { ko: '태너로 사용', en: 'Use as Tanner' },
  'role.note': {
    ko: '역할은 소유권이 아니에요. 누구로 들어와도 우리 전체 자산과 전체 지출을 함께 봅니다.',
    en: 'A role is not ownership. Either way you both see all our assets and spending.',
  },
  'settings.role': { ko: '사용 역할', en: 'Role' },
  'settings.change': { ko: '변경', en: 'Change' },
}

export function tEnum(group: keyof typeof ENUMS | string, key: string, lang: Lang): string {
  const g = ENUMS[group as string]
  return g?.[key]?.[lang] ?? key
}

export function tKey(labelKey: string, lang: Lang): string {
  return KEYS[labelKey]?.[lang] ?? labelKey
}

export function tUi(key: string, lang: Lang): string {
  return UI[key]?.[lang] ?? key
}

// labelKey 또는 자유 텍스트 label 을 가진 항목의 표시 이름
export function tItemLabel(item: { labelKey?: string; label?: string }, lang: Lang): string {
  if (item.label) return item.label
  if (item.labelKey) return tKey(item.labelKey, lang)
  return ''
}

// ----- 색상 클래스 (디자인의 us/hy/ta 점·바 색을 그대로 사용) -----
// shared → us, hyeonsu → hy, tanner → ta
export function colorClass(key: UsedFor | HolderLabel): 'us' | 'hy' | 'ta' {
  if (key === 'hyeonsu') return 'hy'
  if (key === 'tanner') return 'ta'
  return 'us'
}

export function recurringStatusLabel(status: RecurringStatus, lang: Lang): string {
  return tEnum('recurringStatus', status, lang)
}

// ----- 계좌/결제통로 표시 이름 (사용자가 지정한 nameKo/nameEn 사용) -----
export function accountTitle(acc: Account, lang: Lang): string {
  return (lang === 'ko' ? acc.nameKo : acc.nameEn) || acc.nameKo || acc.nameEn || ''
}

// 계좌 부제: 종류(+USD 통화 표시)
export function accountSubtitle(acc: Account, lang: Lang): string {
  const kind = acc.kind === 'cash' ? (lang === 'ko' ? '우리 보관' : 'Our cash') : tEnum('accountKind', acc.kind, lang)
  return acc.currency === 'USD' ? `${kind} · USD` : kind
}

export function paymentSourceTitle(ps: PaymentSource, lang: Lang): string {
  return (lang === 'ko' ? ps.nameKo : ps.nameEn) || ps.nameKo || ps.nameEn || ''
}

// 카테고리 라벨: 저장된 이름 우선, 없으면 기본 카테고리 i18n, 그것도 없으면 id.
// 숨겨진(inactive) 카테고리도 과거 거래 표시를 위해 라벨이 나와야 한다.
export function categoryLabel(categoryId: string, categories: Category[], lang: Lang): string {
  const c = categories.find((x) => x.id === categoryId)
  if (c && (c.nameKo || c.nameEn)) return (lang === 'ko' ? c.nameKo : c.nameEn) || c.nameKo || c.nameEn || categoryId
  return tEnum('category', categoryId, lang)
}

// 빠른버튼 이름: titleKo/En 우선, 없으면 구버전 labelKey/label
export function quickActionTitle(q: QuickAction, lang: Lang): string {
  if (q.titleKo || q.titleEn) return (lang === 'ko' ? q.titleKo : q.titleEn) || q.titleKo || q.titleEn || ''
  return tItemLabel(q, lang)
}

// 반복항목 이름: titleKo/En 우선, 없으면 구버전 labelKey/label
export function recurringTitle(r: RecurringItem, lang: Lang): string {
  if (r.titleKo || r.titleEn) return (lang === 'ko' ? r.titleKo : r.titleEn) || r.titleKo || r.titleEn || ''
  return tItemLabel(r, lang)
}

// 반복 항목 날짜 표기: [1,15] → '매월 1·15일'
export function recurringDaysLabel(days: number[], lang: Lang): string {
  if (lang === 'ko') return `매월 ${days.join('·')}일`
  return `Monthly: ${days.map((d) => 'day ' + d).join(', ')}`
}
