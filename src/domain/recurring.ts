// ===== 반복항목 생성·수정 헬퍼 =====
// 제목 누락·금액·통화·반복일(1~31) 검증. amountKrw는 고정환율로 재계산.

import { toKrw } from './calculations'
import type { Currency, RecurringItem, RecurringType } from './types'

function makeId(prefix: string): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  if (c?.randomUUID) return prefix + '_' + c.randomUUID()
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

function validCurrency(c: unknown): Currency {
  return c === 'USD' ? 'USD' : 'KRW'
}
function validType(t: unknown): RecurringType | null {
  return t === 'income' || t === 'expense' || t === 'transfer' ? t : null
}
// 1~31 정수만, 중복 제거, 오름차순. 유효한 날이 없으면 null.
function cleanDays(days: unknown): number[] | null {
  if (!Array.isArray(days)) return null
  const set = new Set<number>()
  for (const d of days) {
    const n = Math.trunc(Number(d))
    if (Number.isFinite(n) && n >= 1 && n <= 31) set.add(n)
  }
  const arr = Array.from(set).sort((a, b) => a - b)
  return arr.length ? arr : null
}

export interface NewRecurringInput {
  type: RecurringType
  titleKo: string
  titleEn?: string
  amountOriginal: number
  currency: Currency
  daysOfMonth: number[]
  categoryId?: string
  paymentSourceId?: string
  accountId?: string
  active?: boolean
}
export type RecurringPatch = Partial<NewRecurringInput>

export function createRecurringItem(input: NewRecurringInput, fxRate: number): RecurringItem | null {
  const type = validType(input.type)
  if (!type) return null
  const titleKo = (input.titleKo ?? '').trim()
  const titleEn = (input.titleEn ?? '').trim()
  if (!titleKo && !titleEn) return null
  const amountOriginal = Number(input.amountOriginal)
  if (!Number.isFinite(amountOriginal) || amountOriginal <= 0) return null
  const days = cleanDays(input.daysOfMonth)
  if (!days) return null
  const currency = validCurrency(input.currency)
  return {
    id: makeId('rec'),
    type,
    titleKo: titleKo || titleEn,
    titleEn: titleEn || titleKo,
    amountOriginal,
    currency,
    fxRateUsed: fxRate,
    amountKrw: toKrw(amountOriginal, currency, fxRate),
    daysOfMonth: days,
    categoryId: input.categoryId || undefined,
    paymentSourceId: input.paymentSourceId || undefined,
    accountId: input.accountId || undefined,
    active: input.active ?? true,
  }
}

export function applyRecurringPatch(existing: RecurringItem, patch: RecurringPatch, fxRate: number): RecurringItem | null {
  const type = patch.type ? validType(patch.type) : existing.type
  if (!type) return null
  const titleKo = (patch.titleKo ?? existing.titleKo ?? '').trim()
  const titleEn = (patch.titleEn ?? existing.titleEn ?? '').trim()
  if (!titleKo && !titleEn) return null
  const currency = validCurrency(patch.currency ?? existing.currency)
  const amountOriginal = patch.amountOriginal != null ? Number(patch.amountOriginal) : existing.amountOriginal
  if (!Number.isFinite(amountOriginal) || amountOriginal <= 0) return null
  const days = patch.daysOfMonth ? cleanDays(patch.daysOfMonth) : existing.daysOfMonth
  if (!days || !days.length) return null
  return {
    ...existing,
    type,
    titleKo: titleKo || titleEn,
    titleEn: titleEn || titleKo,
    amountOriginal,
    currency,
    fxRateUsed: fxRate,
    amountKrw: toKrw(amountOriginal, currency, fxRate),
    daysOfMonth: days,
    categoryId: 'categoryId' in patch ? patch.categoryId || undefined : existing.categoryId,
    paymentSourceId: 'paymentSourceId' in patch ? patch.paymentSourceId || undefined : existing.paymentSourceId,
    accountId: 'accountId' in patch ? patch.accountId || undefined : existing.accountId,
    active: patch.active ?? existing.active ?? true,
  }
}
