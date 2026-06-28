// ===== 계산 로직 =====
// UI 컴포넌트는 여기 함수의 결과만 표시한다. (컴포넌트 안에서 직접 계산하지 않음)
// 모든 금액은 KRW 환산값(amountKrw / balanceKrw)을 기준으로 합산하고,
// 표시할 때만 displayCurrency + fxRate로 변환한다. 고정환율 1 USD = 1,500 KRW.

import type {
  Account,
  Category,
  Currency,
  HolderLabel,
  PaymentSource,
  RecurringItem,
  Transaction,
  WalletDb,
} from './types'

// ---------- 1. 통화/금액 ----------

export function toKrw(amountOriginal: number, currency: Currency, fxRate: number): number {
  return currency === 'USD' ? amountOriginal * fxRate : amountOriginal
}

export function fromKrw(amountKrw: number, displayCurrency: Currency, fxRate: number): number {
  return displayCurrency === 'USD' ? amountKrw / fxRate : amountKrw
}

export function formatMoney(amountKrw: number, displayCurrency: Currency, fxRate: number): string {
  const v = fromKrw(amountKrw, displayCurrency, fxRate)
  if (displayCurrency === 'USD') return '$' + Math.round(v).toLocaleString('en-US')
  return '₩' + Math.round(v).toLocaleString('ko-KR')
}

// ---------- 2. 자산 계산 ----------

export function getTotalAssets(accounts: Account[]): number {
  return accounts.reduce((sum, a) => sum + a.balanceKrw, 0)
}

// 쓸 수 있는 돈
export function getLiquidAssets(accounts: Account[]): number {
  return accounts.filter((a) => a.tier === 'spendable').reduce((sum, a) => sum + a.balanceKrw, 0)
}

// 모으는·불리는(묶인) 돈
export function getLockedAssets(accounts: Account[]): number {
  return accounts.filter((a) => a.tier === 'saving').reduce((sum, a) => sum + a.balanceKrw, 0)
}

export function getAssetsByAccount(accounts: Account[]): { accountId: string; krw: number }[] {
  return accounts.map((a) => ({ accountId: a.id, krw: a.balanceKrw }))
}

export function getAssetsByHolder(accounts: Account[]): Record<HolderLabel, number> {
  const out: Record<HolderLabel, number> = { shared: 0, hyeonsu: 0, tanner: 0 }
  for (const a of accounts) out[a.holder] += a.balanceKrw
  return out
}

// ---------- 3. 월별 수입/지출 ----------

// month: 'YYYY-MM'
export function getTransactionsForMonth(transactions: Transaction[], month: string): Transaction[] {
  return transactions.filter((t) => t.date.startsWith(month))
}

export function getMonthlyExpenseTotal(transactions: Transaction[], month: string): number {
  return getTransactionsForMonth(transactions, month)
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amountKrw, 0)
}

export function getMonthlyIncomeTotal(transactions: Transaction[], month: string): number {
  return getTransactionsForMonth(transactions, month)
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amountKrw, 0)
}

export function getNetCashflow(transactions: Transaction[], month: string): number {
  return getMonthlyIncomeTotal(transactions, month) - getMonthlyExpenseTotal(transactions, month)
}

// 추정 최대 저축 = 수입 − 지출 − (이미 잡힌 고정저축). 음수면 0.
export function getEstimatedMaxSavings(
  monthlyIncome: number,
  monthlyExpense: number,
  recurringSavings = 0,
): number {
  return Math.max(0, monthlyIncome - monthlyExpense - recurringSavings)
}

// ---------- 4. 예산 계산 ----------
// 총예산은 settings.monthlyBudgetKrw(원화 환산) 하나로 관리. 카테고리별은 선택.

export interface CategoryBudgetUsage {
  categoryId: string
  usedKrw: number
  limitKrw: number
  rate: number // 0~1+ (한도 0이면 0)
}

// 카테고리별 예산 한도는 category.budgetMonthly에서 가져온다.
export function getBudgetUsedByCategory(
  transactions: Transaction[],
  categories: Category[],
  month: string,
): CategoryBudgetUsage[] {
  const monthTx = getTransactionsForMonth(transactions, month).filter((t) => t.type === 'expense')

  const usedByCat = new Map<string, number>()
  for (const t of monthTx) {
    usedByCat.set(t.categoryId, (usedByCat.get(t.categoryId) ?? 0) + t.amountKrw)
  }

  return categories
    .filter((c) => (c.budgetMonthly ?? 0) > 0)
    .map((c) => {
      const limitKrw = c.budgetMonthly ?? 0
      const usedKrw = usedByCat.get(c.id) ?? 0
      const rate = limitKrw > 0 ? usedKrw / limitKrw : 0
      return { categoryId: c.id, usedKrw, limitKrw, rate }
    })
}

export function getBudgetRemaining(
  totalKrw: number,
  transactions: Transaction[],
  month: string,
): number {
  return totalKrw - getMonthlyExpenseTotal(transactions, month)
}

// 0~1 (예산 0이면 0). 100% 초과 가능.
export function getBudgetUsageRate(
  totalKrw: number,
  transactions: Transaction[],
  month: string,
): number {
  if (totalKrw <= 0) return 0
  return getMonthlyExpenseTotal(transactions, month) / totalKrw
}

// ---------- 5. 분석 계산 ----------

export interface Breakdown {
  key: string
  krw: number
  pct: number // 0~100, 합계 0이면 모두 0 (NaN 방어)
}

// 이번 달 지출을 keyFn 기준으로 묶어 비율(%)까지 계산
function groupExpenses(
  transactions: Transaction[],
  month: string,
  keyFn: (t: Transaction) => string | null,
): Breakdown[] {
  const expenses = getTransactionsForMonth(transactions, month).filter((t) => t.type === 'expense')
  const total = expenses.reduce((sum, t) => sum + t.amountKrw, 0)

  const map = new Map<string, number>()
  for (const t of expenses) {
    const key = keyFn(t)
    if (key == null) continue
    map.set(key, (map.get(key) ?? 0) + t.amountKrw)
  }

  return Array.from(map.entries())
    .map(([key, krw]) => ({ key, krw, pct: total > 0 ? (krw / total) * 100 : 0 }))
    .sort((a, b) => b.krw - a.krw)
}

export function getSpendingByUsedFor(transactions: Transaction[], month: string): Breakdown[] {
  return groupExpenses(transactions, month, (t) => t.usedFor)
}

export function getSpendingByCategory(transactions: Transaction[], month: string): Breakdown[] {
  return groupExpenses(transactions, month, (t) => t.categoryId)
}

export function getSpendingByPaymentSource(
  transactions: Transaction[],
  _paymentSources: PaymentSource[],
  month: string,
): Breakdown[] {
  return groupExpenses(transactions, month, (t) => t.paymentSourceId)
}

export function getSpendingByAccount(
  transactions: Transaction[],
  paymentSources: PaymentSource[],
  _accounts: Account[],
  month: string,
): Breakdown[] {
  const psById = new Map(paymentSources.map((p) => [p.id, p]))
  return groupExpenses(transactions, month, (t) => {
    // 거래에 직접 연결된 계좌가 있으면 그것, 없으면 결제통로가 연결된 계좌
    return t.accountId ?? psById.get(t.paymentSourceId)?.linkedAccountId ?? null
  })
}

export function getSpendingByCurrency(transactions: Transaction[], month: string): Breakdown[] {
  return groupExpenses(transactions, month, (t) => t.currency)
}

// ---------- 보조 ----------

// 활성 월: 예산이 있으면 그 달, 없으면 가장 최근 거래의 달, 그것도 없으면 오늘
export function getActiveMonth(db: WalletDb): string {
  if (db.budgets[0]) return db.budgets[0].month
  const dates = db.transactions.map((t) => t.date).sort()
  if (dates.length) return dates[dates.length - 1].slice(0, 7)
  return new Date().toISOString().slice(0, 7)
}

// 최근 지출 n건 (날짜·생성시각 내림차순)
export function getRecentExpenses(transactions: Transaction[], n: number): Transaction[] {
  return transactions
    .filter((t) => t.type === 'expense')
    .slice()
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt))
    .slice(0, n)
}

// 이번 달 고정저축(이체 타입 반복항목) 합계
export function getRecurringSavingsTotal(db: WalletDb): number {
  return db.recurringItems
    .filter((r) => r.type === 'transfer')
    .reduce((sum, r) => sum + r.amountKrw, 0)
}

// ---------- 6. 반복항목 (반영/상태/월말 전망) ----------

export type RecurringKind = 'income' | 'expense' | 'savingTransfer'
export type RecurringComputedStatus = 'due' | 'done' | 'skip'

// 반복항목 분류: 수입 / 일반지출 / 저축이체
export function classifyRecurring(item: RecurringItem): RecurringKind {
  if (item.type === 'income') return 'income'
  if (item.type === 'transfer') return 'savingTransfer'
  return 'expense'
}

// 반복항목 → 실제 거래 타입
export function recurringTxType(kind: RecurringKind): Transaction['type'] {
  if (kind === 'income') return 'income'
  if (kind === 'savingTransfer') return 'transfer'
  return 'expense'
}

// 이번 달에 이미 반영된 반복항목인지 (sourceRecurringItemId + 월 기준)
export function isRecurringAppliedThisMonth(
  transactions: Transaction[],
  recurringItemId: string,
  month: string,
): boolean {
  return transactions.some(
    (t) => t.sourceRecurringItemId === recurringItemId && t.date.startsWith(month),
  )
}

// 화면 표시용 상태: 반영완료(done) / 건너뜀(skip) / 예정(due)
export function getRecurringStatus(
  item: RecurringItem,
  transactions: Transaction[],
  month: string,
): RecurringComputedStatus {
  if (isRecurringAppliedThisMonth(transactions, item.id, month)) return 'done'
  if (item.status === 'skip') return 'skip'
  return 'due'
}

// 아직 반영되지 않은(예정) 반복항목들. 숨김(active=false)·skip 제외.
export function getPendingRecurring(db: WalletDb, month: string): RecurringItem[] {
  return db.recurringItems.filter(
    (r) => r.active !== false && getRecurringStatus(r, db.transactions, month) === 'due',
  )
}

export interface MonthlyOutlook {
  actualIncome: number // 이번 달 실제 수입
  actualExpense: number // 이번 달 실제 지출
  pendingIncome: number // 아직 반영 안 된 예정 수입
  pendingExpense: number // 아직 반영 안 된 예정 지출(저축이체 제외)
  pendingSavingTransfer: number // 아직 반영 안 된 예정 저축이체(별도 표시)
  expectedLeftover: number // 예상 월말 남는 돈
  maxSavings: number // 최대저축 가능액 (>= 0)
}

// 이번 달 월말 전망 + 최대저축 가능액
export function getMonthlyOutlook(db: WalletDb, month: string): MonthlyOutlook {
  const actualIncome = getMonthlyIncomeTotal(db.transactions, month)
  const actualExpense = getMonthlyExpenseTotal(db.transactions, month)

  let pendingIncome = 0
  let pendingExpense = 0
  let pendingSavingTransfer = 0
  for (const item of getPendingRecurring(db, month)) {
    const kind = classifyRecurring(item)
    if (kind === 'income') pendingIncome += item.amountKrw
    else if (kind === 'savingTransfer') pendingSavingTransfer += item.amountKrw
    else pendingExpense += item.amountKrw
  }

  // 예상 월말 남는 돈 = 실제수입 + 남은예정수입 − 실제지출 − 남은예정지출
  // (저축이체는 '남기는 돈'이라 별도 표시, 차감하지 않음)
  const expectedLeftover = actualIncome + pendingIncome - actualExpense - pendingExpense
  const maxSavings = Math.max(0, expectedLeftover)

  return {
    actualIncome,
    actualExpense,
    pendingIncome,
    pendingExpense,
    pendingSavingTransfer,
    expectedLeftover,
    maxSavings,
  }
}
