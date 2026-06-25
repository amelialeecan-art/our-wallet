// ===== 카테고리 / 빠른버튼 생성·수정 헬퍼 =====
// 이름 누락·NaN·통화 검증을 한곳에서. 빠른버튼 amountKrw는 고정환율로 재계산.

import { toKrw } from './calculations'
import type { Category, Currency, QuickAction, UsedFor } from './types'

function makeId(prefix: string): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  if (c?.randomUUID) return prefix + '_' + c.randomUUID()
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

function validCurrency(c: unknown): Currency {
  return c === 'USD' ? 'USD' : 'KRW'
}
function validUsedFor(u: unknown): UsedFor {
  return u === 'hyeonsu' || u === 'tanner' ? u : 'shared'
}

// ----- 카테고리 -----
export interface NewCategoryInput {
  nameKo: string
  nameEn?: string
  icon?: string
  budgetMonthly?: number
  isActive?: boolean
}
export type CategoryPatch = Partial<NewCategoryInput>

function cleanBudget(v: unknown): number | undefined {
  if (v == null || v === '') return undefined
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) return undefined
  return n
}

export function createCategory(input: NewCategoryInput): Category | null {
  const nameKo = (input.nameKo ?? '').trim()
  const nameEn = (input.nameEn ?? '').trim()
  if (!nameKo && !nameEn) return null
  return {
    id: makeId('cat'),
    nameKo: nameKo || nameEn,
    nameEn: nameEn || nameKo,
    icon: input.icon?.trim() || undefined,
    budgetMonthly: cleanBudget(input.budgetMonthly),
    isActive: input.isActive ?? true,
    builtin: false,
  }
}

export function applyCategoryPatch(existing: Category, patch: CategoryPatch): Category | null {
  const nameKo = (patch.nameKo ?? existing.nameKo ?? '').trim()
  const nameEn = (patch.nameEn ?? existing.nameEn ?? '').trim()
  if (!nameKo && !nameEn) return null
  return {
    ...existing,
    nameKo: nameKo || nameEn,
    nameEn: nameEn || nameKo,
    icon: (patch.icon ?? existing.icon)?.trim() || undefined,
    budgetMonthly: 'budgetMonthly' in patch ? cleanBudget(patch.budgetMonthly) : existing.budgetMonthly,
    isActive: patch.isActive ?? existing.isActive ?? true,
  }
}

// ----- 빠른버튼 -----
export interface NewQuickActionInput {
  titleKo: string
  titleEn?: string
  amountOriginal: number
  currency: Currency
  categoryId: string
  usedFor?: UsedFor
  paymentSourceId?: string
  memo?: string
  isActive?: boolean
  sortOrder?: number
}
export type QuickActionPatch = Partial<NewQuickActionInput>

export function createQuickAction(input: NewQuickActionInput, fxRate: number): QuickAction | null {
  const titleKo = (input.titleKo ?? '').trim()
  const titleEn = (input.titleEn ?? '').trim()
  if (!titleKo && !titleEn) return null
  const amountOriginal = Number(input.amountOriginal)
  if (!Number.isFinite(amountOriginal) || amountOriginal <= 0) return null
  const currency = validCurrency(input.currency)
  return {
    id: makeId('q'),
    titleKo: titleKo || titleEn,
    titleEn: titleEn || titleKo,
    amountOriginal,
    currency,
    amountKrw: toKrw(amountOriginal, currency, fxRate),
    categoryId: input.categoryId || 'other',
    usedFor: validUsedFor(input.usedFor),
    paymentSourceId: input.paymentSourceId || undefined,
    memo: input.memo?.trim() || undefined,
    isActive: input.isActive ?? true,
    sortOrder: input.sortOrder ?? 0,
  }
}

export function applyQuickActionPatch(existing: QuickAction, patch: QuickActionPatch, fxRate: number): QuickAction | null {
  const titleKo = (patch.titleKo ?? existing.titleKo ?? '').trim()
  const titleEn = (patch.titleEn ?? existing.titleEn ?? '').trim()
  if (!titleKo && !titleEn) return null
  const currency = validCurrency(patch.currency ?? existing.currency)
  const amountOriginal = patch.amountOriginal != null ? Number(patch.amountOriginal) : existing.amountOriginal
  if (!Number.isFinite(amountOriginal) || amountOriginal <= 0) return null
  return {
    ...existing,
    titleKo: titleKo || titleEn,
    titleEn: titleEn || titleKo,
    amountOriginal,
    currency,
    amountKrw: toKrw(amountOriginal, currency, fxRate),
    categoryId: (patch.categoryId ?? existing.categoryId) || 'other',
    usedFor: validUsedFor(patch.usedFor ?? existing.usedFor),
    paymentSourceId: (patch.paymentSourceId ?? existing.paymentSourceId) || undefined,
    memo: (patch.memo ?? existing.memo)?.trim() || undefined,
    isActive: patch.isActive ?? existing.isActive ?? true,
    sortOrder: patch.sortOrder ?? existing.sortOrder ?? 0,
  }
}
