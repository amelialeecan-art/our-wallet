// ===== 입력 → Transaction 생성 =====
// AddScreen의 입력값을 받아 저장 가능한 완전한 Transaction을 만든다.
// 원본 금액(amountOriginal)과 KRW 환산(amountKrw)을 항상 함께 보존한다.

import { toKrw } from './calculations'
import type { Currency, RecordedBy, Transaction, UsedFor } from './types'

export interface NewTransactionInput {
  amountOriginal: number
  currency: Currency
  categoryId: string
  usedFor: UsedFor
  paymentSourceId?: string
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
    type: 'expense',
    amountOriginal,
    currency,
    fxRateUsed: ctx.fxRate,
    amountKrw,
    date,
    categoryId: input.categoryId || 'other',
    usedFor: input.usedFor || 'shared',
    paymentSourceId: input.paymentSourceId || ctx.defaultPaymentSourceId || '',
    recordedBy: ctx.role,
    memo: input.memo?.trim() ? input.memo.trim() : undefined,
    createdAt: now,
    updatedAt: now,
  }
}
