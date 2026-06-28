// ===== 계좌 / 결제통로 생성·수정 헬퍼 =====
// 이름 누락·NaN·통화 검증을 한곳에서 처리한다. balanceKrw는 고정환율로 재계산.

import { toKrw } from './calculations'
import type {
  Account,
  AccountKind,
  AssetTier,
  Currency,
  HolderLabel,
  PaymentKind,
  PaymentSource,
  SettlementType,
} from './types'

function validSettlement(s: unknown, kind: PaymentKind): SettlementType {
  if (s === 'immediate' || s === 'deferred' || s === 'none') return s
  return kind === 'card' ? 'deferred' : 'immediate'
}

function makeId(prefix: string): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  if (c?.randomUUID) return prefix + '_' + c.randomUUID()
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

function validCurrency(c: unknown): Currency {
  return c === 'USD' ? 'USD' : 'KRW'
}

// ----- 계좌 -----
export interface NewAccountInput {
  nameKo: string
  nameEn?: string
  holder: HolderLabel
  kind: AccountKind
  tier: AssetTier
  currency: Currency
  balanceOriginal: number
  note?: string
}
export type AccountPatch = Partial<NewAccountInput>

export function createAccount(input: NewAccountInput, fxRate: number): Account | null {
  const nameKo = (input.nameKo ?? '').trim()
  if (!nameKo) return null
  const currency = validCurrency(input.currency)
  const balanceOriginal = Number(input.balanceOriginal)
  if (!Number.isFinite(balanceOriginal) || balanceOriginal < 0) return null
  return {
    id: makeId('acc'),
    nameKo,
    nameEn: (input.nameEn ?? '').trim() || nameKo,
    holder: input.holder,
    kind: input.kind,
    tier: input.tier,
    currency,
    balanceOriginal,
    balanceKrw: toKrw(balanceOriginal, currency, fxRate),
    note: input.note?.trim() || undefined,
  }
}

export function applyAccountPatch(existing: Account, patch: AccountPatch, fxRate: number): Account | null {
  const nameKo = (patch.nameKo ?? existing.nameKo).trim()
  if (!nameKo) return null
  const currency = validCurrency(patch.currency ?? existing.currency)
  const balanceOriginal = patch.balanceOriginal != null ? Number(patch.balanceOriginal) : existing.balanceOriginal
  if (!Number.isFinite(balanceOriginal) || balanceOriginal < 0) return null
  const nameEn = (patch.nameEn ?? existing.nameEn).trim() || nameKo
  return {
    ...existing,
    ...patch,
    nameKo,
    nameEn,
    currency,
    balanceOriginal,
    balanceKrw: toKrw(balanceOriginal, currency, fxRate),
    note: (patch.note ?? existing.note)?.trim() || undefined,
  }
}

// ----- 결제통로 -----
export interface NewPaymentSourceInput {
  nameKo: string
  nameEn?: string
  kind: PaymentKind
  holder: HolderLabel
  currency: Currency
  linkedAccountId?: string
  settlementType?: SettlementType
  isActive?: boolean
}
export type PaymentSourcePatch = Partial<NewPaymentSourceInput>

export function createPaymentSource(input: NewPaymentSourceInput): PaymentSource | null {
  const nameKo = (input.nameKo ?? '').trim()
  if (!nameKo) return null
  return {
    id: makeId('ps'),
    nameKo,
    nameEn: (input.nameEn ?? '').trim() || nameKo,
    kind: input.kind,
    holder: input.holder,
    currency: validCurrency(input.currency),
    linkedAccountId: input.linkedAccountId || undefined,
    settlementType: validSettlement(input.settlementType, input.kind),
    isActive: input.isActive ?? true,
  }
}

export function applyPaymentSourcePatch(existing: PaymentSource, patch: PaymentSourcePatch): PaymentSource | null {
  const nameKo = (patch.nameKo ?? existing.nameKo).trim()
  if (!nameKo) return null
  const nameEn = (patch.nameEn ?? existing.nameEn).trim() || nameKo
  const kind = patch.kind ?? existing.kind
  return {
    ...existing,
    ...patch,
    nameKo,
    nameEn,
    kind,
    currency: validCurrency(patch.currency ?? existing.currency),
    linkedAccountId: (patch.linkedAccountId ?? existing.linkedAccountId) || undefined,
    settlementType: validSettlement(patch.settlementType ?? existing.settlementType, kind),
    isActive: patch.isActive ?? existing.isActive ?? true,
  }
}
