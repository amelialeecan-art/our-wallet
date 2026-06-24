// ===== 도메인 타입 =====
// 저장되는 모든 값은 안정적인 영문 enum/문자열 키다.
// 화면 표시 라벨(한글/영어)은 i18n 매핑(src/i18n/labels.ts)에서만 만든다.
//
// 핵심 철학:
//   돈은 하나다. 계좌·카드·사람 이름은 소유권이 아니라
//   보관위치(heldAt) / 결제통로(paidVia) / 기록자(recordedBy) / 사용대상(usedFor) 라벨일 뿐이다.

import type { Currency } from '../types'

// 표시 통화 타입을 도메인에서도 재노출 (도메인 모듈 하나만 import하면 되도록)
export type { Currency }

// 언어
export type Lang = 'ko' | 'en'

// 역할 = 이 기기에서 누구로 기록하는가. 소유권이 아니다.
export type Role = 'hyeonsu' | 'tanner'

// 거래 종류
export type TransactionType = 'expense' | 'income' | 'transfer' | 'adjustment'

// 사용대상 = 누구를 위한 지출/거래였나 (분석용 라벨)
export type UsedFor = 'shared' | 'hyeonsu' | 'tanner'

// 기록자 = 누가 입력했나
export type RecordedBy = 'hyeonsu' | 'tanner'

// 자산 성격: 쓸 수 있는 돈 / 모으는·불리는 돈
export type AssetTier = 'spendable' | 'saving'

// 보관 위치 종류
export type AccountKind = 'bank' | 'cash' | 'savings' | 'investment'

// 결제 통로 종류
export type PaymentKind = 'card' | 'transfer' | 'cash'

// 누구의 통로/보관인지 라벨 (소유권 아님)
export type HolderLabel = 'shared' | 'hyeonsu' | 'tanner'

// 기본 카테고리 id (안정적 영문 키)
export type CategoryId =
  | 'food'
  | 'cafe'
  | 'transport'
  | 'date'
  | 'shopping'
  | 'home'
  | 'other'

// ----- 사람 / 가구 -----
export interface Person {
  id: string
  role: Role
}

export interface Household {
  id: string
  createdAt: string
  members: Person[]
}

// ----- 보관 위치 (계좌·현금·적금·투자) -----
export interface Account {
  id: string
  holder: HolderLabel // 보관 위치 라벨 (소유권 아님)
  kind: AccountKind
  tier: AssetTier
  currency: Currency // 이 계좌의 기준 통화
  balanceOriginal: number // 원본 통화 잔액
  balanceKrw: number // 원화 환산 잔액 (항상 함께 보존)
}

// ----- 결제 통로 (카드·계좌이체·현금) -----
export interface PaymentSource {
  id: string
  kind: PaymentKind
  holder: HolderLabel
  currency: Currency
  linkedAccountId?: string
}

// ----- 카테고리 -----
export interface Category {
  id: CategoryId | string
  builtin: boolean
}

// ----- 거래 -----
// recordedBy(누가 입력) / paidVia(어디서 나감) / usedFor(누구를 위함)는
// 모두 분석용 라벨이며 소유권이 아니다.
export interface Transaction {
  id: string
  type: TransactionType
  amountOriginal: number // 원본 통화 금액
  currency: Currency
  fxRateUsed: number // 기록 시점에 적용된 USD→KRW 환율 (고정 1500)
  amountKrw: number // 원화 환산 금액 (항상 함께 보존)
  date: string // 'YYYY-MM-DD'
  categoryId: CategoryId | string
  usedFor: UsedFor
  paymentSourceId: string // 어디서 나갔는지
  accountId?: string // (선택) 직접 연결된 보관 위치
  recordedBy: RecordedBy // 누가 입력했는지
  memo?: string
  createdAt: string
  updatedAt: string
}

// ----- 예산 -----
export interface Budget {
  month: string // 'YYYY-MM'
  totalKrw: number
  byCategory: Partial<Record<string, number>> // categoryId → 한도(KRW)
}

// ----- 빠른 입력 버튼 -----
export interface QuickAction {
  id: string
  labelKey?: string // 기본 제공 항목은 i18n 키로
  label?: string // 사용자가 직접 만든 항목은 자유 텍스트로
  amountOriginal: number
  currency: Currency
  amountKrw: number
  categoryId: CategoryId | string
  usedFor?: UsedFor
  paymentSourceId?: string
}

// ----- 반복 항목 (월급·고정지출) -----
export type RecurringStatus = 'due' | 'done' | 'skip'

export interface RecurringItem {
  id: string
  direction: 'income' | 'expense'
  labelKey?: string
  label?: string
  amountOriginal: number
  currency: Currency
  amountKrw: number
  daysOfMonth: number[] // 예: [1, 15]
  categoryId?: CategoryId | string
  paymentSourceId?: string
  accountId?: string
  status: RecurringStatus
}

// ----- 앱(가구 공용) 설정 -----
export interface AppSettings {
  defaultCurrency: Currency // 입력 기본 통화
  fxRate: number // 고정환율 (1 USD = fxRate KRW)
}

// ----- 가구 공용 데이터베이스 (localStorage / 향후 Firebase에 저장될 단위) -----
export interface WalletDb {
  version: number
  household: Household
  settings: AppSettings
  accounts: Account[]
  paymentSources: PaymentSource[]
  categories: Category[]
  transactions: Transaction[]
  budgets: Budget[]
  recurringItems: RecurringItem[]
  quickActions: QuickAction[]
}

// ----- 기기 전용 상태 (사람마다 다를 수 있는 뷰 설정) -----
// 역할은 소유권이 아니라 기록 기본값/뷰 설정일 뿐이다.
export interface DeviceState {
  role: Role | null
  displayCurrency: Currency
  lang: Lang
}
