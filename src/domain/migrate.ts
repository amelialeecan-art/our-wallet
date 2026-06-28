// ===== DB 마이그레이션 =====
// 이전 버전이나 필드가 빠진 데이터를 현재 구조로 안전하게 보정한다.
// seed로 덮어쓰지 않고 기존 사용자 데이터를 최대한 보존한다.

import { USD_TO_KRW } from '../lib/money'
import { createSeedDb } from './seed'
import type {
  Account,
  AccountKind,
  Budget,
  Category,
  Currency,
  HolderLabel,
  PaymentKind,
  PaymentSource,
  PersonDefaults,
  QuickAction,
  RecurringItem,
  RecurringType,
  Role,
  WalletDb,
} from './types'

// 기본 카테고리 이름 (구버전 데이터에 nameKo/nameEn이 없을 때 채움)
const BUILTIN_CATEGORY_NAMES: Record<string, { ko: string; en: string }> = {
  food: { ko: '식비', en: 'Food' },
  cafe: { ko: '카페', en: 'Cafe' },
  transport: { ko: '교통', en: 'Transport' },
  date: { ko: '데이트', en: 'Date' },
  shopping: { ko: '쇼핑', en: 'Shopping' },
  home: { ko: '집/생활', en: 'Home' },
  other: { ko: '기타', en: 'Other' },
}

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
  // 정산 방식 기본값: 카드는 deferred(나중에 카드값), 그 외는 immediate
  const settlementType =
    p.settlementType === 'immediate' || p.settlementType === 'deferred' || p.settlementType === 'none'
      ? p.settlementType
      : kind === 'card'
        ? 'deferred'
        : 'immediate'
  return {
    id: p.id ?? 'ps_' + Math.random().toString(36).slice(2, 8),
    nameKo: p.nameKo ?? koFallback,
    nameEn: p.nameEn ?? enFallback,
    kind,
    holder,
    currency: asCurrency(p.currency),
    linkedAccountId: p.linkedAccountId,
    settlementType,
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

// 구버전 카테고리 → 현재 구조 (이름/예산/활성 채움)
function migrateCategory(c: Partial<Category>, budgets: Budget[]): Category {
  const id = c.id ?? 'cat_' + Math.random().toString(36).slice(2, 8)
  const builtinName = BUILTIN_CATEGORY_NAMES[id]
  // 예산: category.budgetMonthly가 없으면 옛 budget.byCategory에서 가져온다
  const legacyBudget = budgets[0]?.byCategory?.[id]
  return {
    id,
    nameKo: c.nameKo ?? builtinName?.ko ?? id,
    nameEn: c.nameEn ?? builtinName?.en ?? id,
    icon: c.icon,
    budgetMonthly: c.budgetMonthly ?? (typeof legacyBudget === 'number' ? legacyBudget : undefined),
    isActive: c.isActive ?? true,
    builtin: c.builtin ?? !!builtinName,
  }
}

function migrateQuickAction(q: Partial<QuickAction>, index: number): QuickAction {
  return {
    id: q.id ?? 'q_' + Math.random().toString(36).slice(2, 8),
    labelKey: q.labelKey,
    label: q.label,
    titleKo: q.titleKo,
    titleEn: q.titleEn,
    amountOriginal: Number(q.amountOriginal) || 0,
    currency: asCurrency(q.currency),
    amountKrw: Number(q.amountKrw ?? (q.currency === 'USD' ? Number(q.amountOriginal) * USD_TO_KRW : Number(q.amountOriginal))) || 0,
    categoryId: q.categoryId ?? 'other',
    usedFor: q.usedFor,
    paymentSourceId: q.paymentSourceId,
    memo: q.memo,
    isActive: q.isActive ?? true,
    sortOrder: q.sortOrder ?? index,
  }
}

// 구버전 반복항목(direction) → 현재 구조(type). 저축 계좌로 가는 지출은 transfer로.
function migrateRecurring(r: Partial<RecurringItem> & { direction?: string }, savingAccountIds: Set<string>): RecurringItem {
  let type: RecurringType
  if (r.type === 'income' || r.type === 'expense' || r.type === 'transfer') {
    type = r.type
  } else if (r.direction === 'income') {
    type = 'income'
  } else if (r.accountId && savingAccountIds.has(r.accountId)) {
    type = 'transfer'
  } else {
    type = 'expense'
  }
  const currency = asCurrency(r.currency)
  const amountOriginal = Number(r.amountOriginal) || 0
  const amountKrw = Number(r.amountKrw ?? (currency === 'USD' ? amountOriginal * USD_TO_KRW : amountOriginal)) || 0
  const days = Array.isArray(r.daysOfMonth)
    ? r.daysOfMonth.map((d) => Math.trunc(Number(d))).filter((d) => d >= 1 && d <= 31)
    : []
  return {
    id: r.id ?? 'rec_' + Math.random().toString(36).slice(2, 8),
    type,
    titleKo: r.titleKo,
    titleEn: r.titleEn,
    labelKey: r.labelKey,
    label: r.label,
    amountOriginal,
    currency,
    fxRateUsed: r.fxRateUsed ?? USD_TO_KRW,
    amountKrw,
    daysOfMonth: days.length ? days : [1],
    categoryId: r.categoryId,
    paymentSourceId: r.paymentSourceId,
    accountId: r.accountId,
    active: r.active ?? true,
    status: r.status,
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
  const budgets = Array.isArray(db.budgets) ? db.budgets : seed.budgets
  const categories = (Array.isArray(db.categories) ? db.categories : seed.categories).map((c) =>
    migrateCategory(c as Partial<Category>, budgets),
  )
  const quickActions = (Array.isArray(db.quickActions) ? db.quickActions : seed.quickActions).map((q, i) =>
    migrateQuickAction(q as Partial<QuickAction>, i),
  )
  const savingAccountIds = new Set(accounts.filter((a) => a.tier === 'saving').map((a) => a.id))
  const recurringItems = (Array.isArray(db.recurringItems) ? db.recurringItems : seed.recurringItems).map((r) =>
    migrateRecurring(r as Partial<RecurringItem>, savingAccountIds),
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
    categories,
    transactions: Array.isArray(db.transactions) ? db.transactions : seed.transactions,
    budgets,
    recurringItems,
    quickActions,
  }
}
