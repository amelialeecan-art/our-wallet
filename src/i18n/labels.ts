// ===== i18n 라벨 매핑 =====
// 저장은 영문 키, 표시는 여기서만 한글/영어로 변환한다.
// (전체 UI 번역은 2단계에서 확장. 1단계는 enum 라벨 + 새로 추가된 화면 문구만.)

import type { Lang } from '../domain/types'

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
    bank: { ko: '예금', en: 'Deposit' },
    cash: { ko: '우리 보관', en: 'Our cash' },
    savings: { ko: '적금', en: 'Savings' },
    investment: { ko: '주식 · 투자', en: 'Stocks · Invest' },
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
