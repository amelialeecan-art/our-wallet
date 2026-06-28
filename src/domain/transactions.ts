// ===== 입력 → Transaction 생성 =====
// AddScreen의 입력값을 받아 저장 가능한 완전한 Transaction을 만든다.
// 원본 금액(amountOriginal)과 KRW 환산(amountKrw)을 항상 함께 보존한다.

import { toKrw } from './calculations'
import type {
  Currency,
  RecordedBy,
  RecurringItem,
  Transaction,
  TransactionType,
  UsedFor,
} from './types'

export interface NewTransactionInput {
  type?: TransactionType // 기본 expense
  amountOriginal: number
  currency: Currency
  categoryId: string
  usedFor: UsedFor
  paymentSourceId?: string
  fromAccountId?: string // 잔액 반영용 (provider에서 해석해 주입)
  toAccountId?: string
  memo?: string
  date?: string // 'YYYY-MM-DD' (없으면 오늘)
}

export interface TransactionContext {
  role: RecordedBy // 기록자 = 현재 역할
  fxRate: number
  defaultPaymentSourceId: string | null
}

function makeId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  if (c?.randomUUID) return 'tx_' + c.randomUUID()
  return 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

export function createTransactionFromInput(
  input: NewTransactionInput,
  ctx: TransactionContext,
): Transaction {
  const currency = input.currency
  const amountOriginal = Number(input.amountOriginal) || 0
  const amountKrw = toKrw(amountOriginal, currency, ctx.fxRate)
  const now = new Date().toISOString()
  const date = input.date ?? now.slice(0, 10)

  return {
    id: makeId(),
    type: input.type ?? 'expense',
    amountOriginal,
    currency,
    fxRateUsed: ctx.fxRate,
    amountKrw,
    date,
    categoryId: input.categoryId || 'other',
    usedFor: input.usedFor || 'shared',
    paymentSourceId: input.paymentSourceId || ctx.defaultPaymentSourceId || '',
    fromAccountId: input.fromAccountId,
    toAccountId: input.toAccountId,
    recordedBy: ctx.role,
    memo: input.memo?.trim() ? input.memo.trim() : undefined,
    sourceKind: 'manual',
    createdAt: now,
    updatedAt: now,
  }
}

// 잔액 맞추기(보정) 거래 생성. krwDelta 부호로 from/to 결정.
export function createAdjustmentTransaction(
  accountId: string,
  currency: Currency,
  origDelta: number, // 계좌 통화 기준 차액 (부호 포함)
  krwDelta: number, // KRW 기준 차액 (부호 포함)
  ctx: { role: RecordedBy; fxRate: number; label: string },
): Transaction {
  const now = new Date().toISOString()
  return {
    id: makeId(),
    type: 'adjustment',
    amountOriginal: Math.abs(origDelta),
    currency,
    fxRateUsed: ctx.fxRate,
    amountKrw: Math.abs(krwDelta),
    date: now.slice(0, 10),
    categoryId: 'other',
    usedFor: 'shared',
    paymentSourceId: '',
    fromAccountId: krwDelta < 0 ? accountId : undefined,
    toAccountId: krwDelta > 0 ? accountId : undefined,
    recordedBy: ctx.role,
    memo: ctx.label,
    sourceKind: 'adjustment',
    sourceLabel: ctx.label,
    createdAt: now,
    updatedAt: now,
  }
}

export interface RecurringTransactionContext {
  role: RecordedBy
  fxRate: number
  type: TransactionType // 호출부에서 분류(income/expense/transfer) 결정
  date: string // 'YYYY-MM-DD'
  label: string // 표시용 라벨 (반복항목 이름)
  fromAccountId?: string
  toAccountId?: string
}

// 반복항목을 실제 거래로 확정한다. (사용자가 '반영'을 눌렀을 때만 호출)
export function createTransactionFromRecurring(
  item: RecurringItem,
  ctx: RecurringTransactionContext,
): Transaction {
  const now = new Date().toISOString()
  return {
    id: makeId(),
    type: ctx.type,
    amountOriginal: item.amountOriginal,
    currency: item.currency,
    fxRateUsed: ctx.fxRate,
    amountKrw: toKrw(item.amountOriginal, item.currency, ctx.fxRate),
    date: ctx.date,
    categoryId: item.categoryId || 'other',
    usedFor: 'shared', // 반복 수입·지출은 모두 '우리'
    paymentSourceId: item.paymentSourceId || '',
    accountId: item.accountId,
    fromAccountId: ctx.fromAccountId,
    toAccountId: ctx.toAccountId,
    recordedBy: ctx.role,
    memo: ctx.label,
    sourceKind: 'recurring',
    sourceRecurringItemId: item.id,
    sourceLabel: ctx.label,
    createdAt: now,
    updatedAt: now,
  }
}
