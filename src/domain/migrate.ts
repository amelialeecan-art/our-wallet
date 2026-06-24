// ===== DB 마이그레이션 =====
// 이전 버전이나 필드가 빠진 데이터를 현재 구조로 안전하게 보정한다.
// seed로 덮어쓰지 않고 기존 사용자 데이터를 최대한 보존한다.

import { USD_TO_KRW } from '../lib/money'
import { createSeedDb } from './seed'
import type {
  Account,
  AccountKind,
  Currency,
  HolderLabel,
  PaymentKind,
  PaymentSource,
  PersonDefaults,
  Role,
  WalletDb,
} from './types'

const CURRENT_VERSION = 2

function asCurrency(c: unknown): Currency {
  return c === 'USD' ? 'USD' : 'KRW'
}

// 구버전 계좌 종류(bank 등) → 현재 종류
function mapAccountKind(k: unknown): AccountKind {
  const allowed: AccountKind[] = ['cash', 'checking', 'savings', 'deposit', 'installment', 'investment', 'other']
  if (k === 'bank') return 'deposit'
  return (allowed as string[]).includes(k as string) ? (k as AccountKind) : 'other'
}

function mapPaymentKind(k: unknown): PaymentKind {
  if (k === 'transfer') return 'account'
  if (k === 'card' || k === 'cash' || k === 'account') return k
  return 'account'
}

function deriveAccountName(holder: HolderLabel, kind: AccountKind, lang: 'ko' | 'en'): string {
  if (kind === 'cash') return lang === 'ko' ? '현금' : 'Cash'
  const who = holder === 'hyeonsu' ? (lang === 'ko' ? '현수' : 'Hyeonsu') : holder === 'tanner' ? (lang === 'ko' ? '태너' : 'Tanner') : lang === 'ko' ? '우리' : 'Our'
  return lang === 'ko' ? `${who} 계좌` : `${who} Account`
}

function migrateAccount(a: Partial<Account>): Account {
  const holder: HolderLabel = a.holder === 'hyeonsu' || a.holder === 'tanner' ? a.holder : 'shared'
  const kind = mapAccountKind(a.kind)
  const currency = asCurrency(a.currency)
  const balanceKrwRaw = Number(a.balanceKrw)
  const balanceOriginalRaw = Number(a.balanceOriginal)
  // balanceOriginal이 없으면 통화에 맞게 KRW에서 역산
  const balanceOriginal = Number.isFinite(balanceOriginalRaw)
    ? balanceOriginalRaw
    : Number.isFinite(balanceKrwRaw)
      ? currency === 'USD'
        ? balanceKrwRaw / USD_TO_KRW
        : balanceKrwRaw
      : 0
  const balanceKrw = Number.isFinite(balanceKrwRaw)
    ? balanceKrwRaw
    : currency === 'USD'
      ? balanceOriginal * USD_TO_KRW
      : balanceOriginal
  return {
    id: a.id ?? 'acc_' + Math.random().toString(36).slice(2, 8),
    nameKo: a.nameKo ?? deriveAccountName(holder, kind, 'ko'),
    nameEn: a.nameEn ?? deriveAccountName(holder, kind, 'en'),
    holder,
    kind,
    tier: a.tier === 'saving' ? 'saving' : 'spendable',
    currency,
    balanceOriginal,
    balanceKrw,
    note: a.note,
  }
}

function migratePaymentSource(p: Partial<PaymentSource>): PaymentSource {
  const holder: HolderLabel = p.holder === 'hyeonsu' || p.holder === 'tanner' ? p.holder : 'shared'
  const kind = mapPaymentKind(p.kind)
  const who = holder === 'hyeonsu' ? '현수' : holder === 'tanner' ? '태너' : '우리'
  const koFallback = kind === 'card' ? `${who}카드` : kind === 'account' ? `${who} 계좌 이체` : '현금'
  const enFallback = kind === 'card' ? `${who} Card` : kind === 'account' ? `${who} transfer` : 'Cash'
  return {
    id: p.id ?? 'ps_' + Math.random().toString(36).slice(2, 8),
    nameKo: p.nameKo ?? koFallback,
    nameEn: p.nameEn ?? enFallback,
    kind,
    holder,
    currency: asCurrency(p.currency),
    linkedAccountId: p.linkedAccountId,
    isActive: p.isActive ?? true,
  }
}

function defaultPersonDefaults(paymentSources: PaymentSource[]): Record<Role, PersonDefaults> {
  const cardOf = (role: Role) =>
    paymentSources.find((p) => p.holder === role && p.kind === 'card')?.id ??
    paymentSources.find((p) => p.holder === role)?.id ??
    null
  return {
    hyeonsu: { paymentSourceId: cardOf('hyeonsu'), currency: 'KRW', lang: 'ko' },
    tanner: { paymentSourceId: cardOf('tanner'), currency: 'USD', lang: 'en' },
  }
}

export function migrateDb(raw: unknown): WalletDb {
  const seed = createSeedDb()
  const db = (raw ?? {}) as Partial<WalletDb>

  const accounts = (Array.isArray(db.accounts) ? db.accounts : seed.accounts).map((a) =>
    migrateAccount(a as Partial<Account>),
  )
  const paymentSources = (Array.isArray(db.paymentSources) ? db.paymentSources : seed.paymentSources).map((p) =>
    migratePaymentSource(p as Partial<PaymentSource>),
  )

  const prevSettings = (db.settings ?? {}) as Partial<WalletDb['settings']>
  const settings: WalletDb['settings'] = {
    defaultCurrency: asCurrency(prevSettings.defaultCurrency ?? 'KRW'),
    fxRate: typeof prevSettings.fxRate === 'number' ? prevSettings.fxRate : USD_TO_KRW,
    personDefaults: prevSettings.personDefaults ?? defaultPersonDefaults(paymentSources),
  }

  return {
    version: CURRENT_VERSION,
    household: db.household ?? seed.household,
    settings,
    accounts,
    paymentSources,
    categories: Array.isArray(db.categories) ? db.categories : seed.categories,
    transactions: Array.isArray(db.transactions) ? db.transactions : seed.transactions,
    budgets: Array.isArray(db.budgets) ? db.budgets : seed.budgets,
    recurringItems: Array.isArray(db.recurringItems) ? db.recurringItems : seed.recurringItems,
    quickActions: Array.isArray(db.quickActions) ? db.quickActions : seed.quickActions,
  }
}
