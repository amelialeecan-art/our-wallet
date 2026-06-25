// ===== 전역 상태 (React Context) =====
// 가구 공용 DB와 기기 전용 상태를 들고, 변경 시 localStorage에 저장한다.
// 1단계에서는 역할/표시통화/언어 위주로 연결하고,
// 거래 추가·수정 등 쓰기 액션은 다음 단계에서 확장한다.

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  loadDb,
  loadDevice,
  resetDb,
  saveDb,
  saveDevice,
} from '../storage/walletStore'
import {
  createTransactionFromInput,
  createTransactionFromRecurring,
  type NewTransactionInput,
} from '../domain/transactions'
import {
  classifyRecurring,
  getActiveMonth,
  isRecurringAppliedThisMonth,
  recurringTxType,
  toKrw,
} from '../domain/calculations'
import { tItemLabel } from '../i18n/labels'
import {
  applyAccountPatch,
  applyPaymentSourcePatch,
  createAccount,
  createPaymentSource,
  type AccountPatch,
  type NewAccountInput,
  type NewPaymentSourceInput,
  type PaymentSourcePatch,
} from '../domain/accounts'
import {
  applyCategoryPatch,
  applyQuickActionPatch,
  createCategory,
  createQuickAction,
  type CategoryPatch,
  type NewCategoryInput,
  type NewQuickActionInput,
  type QuickActionPatch,
} from '../domain/catalog'
import type {
  Currency,
  Lang,
  PaymentSource,
  PersonDefaults,
  Role,
  Transaction,
  WalletDb,
  DeviceState,
} from '../domain/types'

// 삭제 결과 (데이터 무결성 안내용)
export type AccountDeleteResult = 'deleted' | 'linked-payment' | 'used-in-tx' | 'error'
export type PaymentSourceDeleteResult = 'deleted' | 'used-in-tx' | 'is-default' | 'error'
export type CategoryDeleteResult = 'deleted' | 'used-in-tx' | 'error'

// 현재 역할 기준 기본 결제통로: 같은 보관자의 카드 → 같은 보관자의 통로 → 첫 통로
function deriveDefaultPaymentSource(sources: PaymentSource[], role: Role | null): string | null {
  if (!role) return null
  const card = sources.find((p) => p.holder === role && p.kind === 'card')
  if (card) return card.id
  const any = sources.find((p) => p.holder === role)
  if (any) return any.id
  return sources[0]?.id ?? null
}

interface WalletContextValue {
  // 데이터
  db: WalletDb
  device: DeviceState
  // 자주 쓰는 파생 값
  role: Role | null
  lang: Lang
  displayCurrency: Currency
  fxRate: number
  defaultPaymentSourceId: string | null
  // 액션
  setRole: (role: Role) => void
  clearRole: () => void
  setDisplayCurrency: (c: Currency) => void
  setLang: (l: Lang) => void
  setDefaultCurrency: (c: Currency) => void
  addTransaction: (input: NewTransactionInput) => boolean
  updateTransaction: (id: string, patch: UpdateTransactionPatch) => boolean
  deleteTransaction: (id: string) => boolean
  applyRecurringItem: (recurringItemId: string, options?: { date?: string }) => ApplyRecurringResult
  // 계좌
  addAccount: (input: NewAccountInput) => boolean
  updateAccount: (id: string, patch: AccountPatch) => boolean
  deleteAccount: (id: string) => AccountDeleteResult
  // 결제통로
  addPaymentSource: (input: NewPaymentSourceInput) => boolean
  updatePaymentSource: (id: string, patch: PaymentSourcePatch) => boolean
  deletePaymentSource: (id: string) => PaymentSourceDeleteResult
  // 역할별 기본값
  updatePersonDefaults: (role: Role, patch: Partial<PersonDefaults>) => void
  // 카테고리
  addCategory: (input: NewCategoryInput) => boolean
  updateCategory: (id: string, patch: CategoryPatch) => boolean
  setCategoryActive: (id: string, isActive: boolean) => boolean
  deleteCategory: (id: string) => CategoryDeleteResult
  // 빠른버튼
  addQuickAction: (input: NewQuickActionInput) => boolean
  updateQuickAction: (id: string, patch: QuickActionPatch) => boolean
  deleteQuickAction: (id: string) => boolean
  moveQuickAction: (id: string, direction: 'up' | 'down') => boolean
  resetData: () => void
}

// 반복항목 반영 결과
export type ApplyRecurringResult = 'applied' | 'already' | 'error'

// 수정 가능한 거래 필드 (금액/통화가 바뀌면 amountKrw는 자동 재계산)
export type UpdateTransactionPatch = Partial<
  Pick<
    Transaction,
    'amountOriginal' | 'currency' | 'usedFor' | 'categoryId' | 'paymentSourceId' | 'date' | 'memo'
  >
>

const WalletContext = createContext<WalletContextValue | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<WalletDb>(() => loadDb())
  const [device, setDevice] = useState<DeviceState>(() => loadDevice())

  // 변경 시 저장 (데이터 누락 방지)
  useEffect(() => {
    saveDb(db)
  }, [db])
  useEffect(() => {
    saveDevice(device)
  }, [device])

  const value = useMemo<WalletContextValue>(() => {
    // 역할 선택 시 기기 기본값(표시통화·언어)을 역할별 설정에서 가져온다. 소유권이 아니라 기본값일 뿐.
    function setRole(role: Role) {
      const d = db.settings.personDefaults?.[role]
      setDevice((prev) => ({
        ...prev,
        role,
        displayCurrency: d?.currency ?? (role === 'tanner' ? 'USD' : 'KRW'),
        lang: d?.lang ?? (role === 'tanner' ? 'en' : 'ko'),
      }))
    }
    function clearRole() {
      setDevice((prev) => ({ ...prev, role: null }))
    }
    function setDisplayCurrency(c: Currency) {
      setDevice((prev) => ({ ...prev, displayCurrency: c }))
    }
    function setLang(l: Lang) {
      setDevice((prev) => ({ ...prev, lang: l }))
    }
    function setDefaultCurrency(c: Currency) {
      setDb((prev) => ({ ...prev, settings: { ...prev.settings, defaultCurrency: c } }))
    }
    function resetData() {
      setDb(resetDb())
    }

    // 기본 결제통로: 역할별 설정값(유효·활성)을 우선, 없으면 보관자 카드로 자동 선택
    const activeSources = db.paymentSources.filter((p) => p.isActive !== false)
    const configuredDefault = device.role ? db.settings.personDefaults?.[device.role]?.paymentSourceId : null
    const defaultPaymentSourceId =
      configuredDefault && activeSources.some((p) => p.id === configuredDefault)
        ? configuredDefault
        : deriveDefaultPaymentSource(activeSources, device.role)

    // 지출 거래 추가. 이번 단계에서는 거래만 추가하고 계좌 잔액은 건드리지 않는다.
    function addTransaction(input: NewTransactionInput): boolean {
      try {
        if (!device.role) return false
        const amount = Number(input.amountOriginal)
        if (!amount || amount <= 0) return false
        const tx = createTransactionFromInput(input, {
          role: device.role,
          fxRate: db.settings.fxRate,
          defaultPaymentSourceId,
        })
        setDb((prev) => ({ ...prev, transactions: [...prev.transactions, tx] }))
        return true
      } catch {
        return false
      }
    }

    // 거래 수정. 금액/통화가 바뀌면 amountKrw를 고정환율로 다시 계산한다.
    function updateTransaction(id: string, patch: UpdateTransactionPatch): boolean {
      try {
        const existing = db.transactions.find((t) => t.id === id)
        if (!existing) return false

        const currency: Currency =
          patch.currency === 'USD' || patch.currency === 'KRW' ? patch.currency : existing.currency
        const amountOriginal =
          patch.amountOriginal != null ? Number(patch.amountOriginal) : existing.amountOriginal
        if (!amountOriginal || amountOriginal <= 0) return false

        const fxRate = db.settings.fxRate
        const updated: Transaction = {
          ...existing,
          ...patch,
          currency,
          amountOriginal,
          amountKrw: toKrw(amountOriginal, currency, fxRate),
          fxRateUsed: fxRate,
          categoryId: (patch.categoryId ?? existing.categoryId) || 'other',
          usedFor: (patch.usedFor ?? existing.usedFor) || 'shared',
          paymentSourceId:
            (patch.paymentSourceId ?? existing.paymentSourceId) ||
            defaultPaymentSourceId ||
            existing.paymentSourceId,
          updatedAt: new Date().toISOString(),
        }
        setDb((prev) => ({
          ...prev,
          transactions: prev.transactions.map((t) => (t.id === id ? updated : t)),
        }))
        return true
      } catch {
        return false
      }
    }

    // 거래 삭제 (id 기준). 없는 id는 무시.
    function deleteTransaction(id: string): boolean {
      try {
        if (!db.transactions.some((t) => t.id === id)) return false
        setDb((prev) => ({ ...prev, transactions: prev.transactions.filter((t) => t.id !== id) }))
        return true
      } catch {
        return false
      }
    }

    // 반복항목을 거래로 확정(반영). 자동 아님 — 사용자가 누를 때만.
    // 같은 항목을 같은 달에 두 번 반영하지 않도록 방어.
    function applyRecurringItem(
      recurringItemId: string,
      options?: { date?: string },
    ): ApplyRecurringResult {
      try {
        if (!device.role) return 'error'
        const item = db.recurringItems.find((r) => r.id === recurringItemId)
        if (!item) return 'error'

        const month = getActiveMonth(db)
        if (isRecurringAppliedThisMonth(db.transactions, item.id, month)) return 'already'

        const day = String(item.daysOfMonth[0] ?? 1).padStart(2, '0')
        const date = options?.date ?? `${month}-${day}`
        const kind = classifyRecurring(item, db.accounts)

        const tx = createTransactionFromRecurring(item, {
          role: device.role,
          fxRate: db.settings.fxRate,
          type: recurringTxType(kind),
          date,
          label: tItemLabel(item, device.lang),
        })
        setDb((prev) => ({ ...prev, transactions: [...prev.transactions, tx] }))
        return 'applied'
      } catch {
        return 'error'
      }
    }

    // ----- 계좌 -----
    function addAccount(input: NewAccountInput): boolean {
      try {
        const acc = createAccount(input, db.settings.fxRate)
        if (!acc) return false
        setDb((prev) => ({ ...prev, accounts: [...prev.accounts, acc] }))
        return true
      } catch {
        return false
      }
    }
    function updateAccount(id: string, patch: AccountPatch): boolean {
      try {
        const existing = db.accounts.find((a) => a.id === id)
        if (!existing) return false
        const updated = applyAccountPatch(existing, patch, db.settings.fxRate)
        if (!updated) return false
        setDb((prev) => ({ ...prev, accounts: prev.accounts.map((a) => (a.id === id ? updated : a)) }))
        return true
      } catch {
        return false
      }
    }
    function deleteAccount(id: string): AccountDeleteResult {
      try {
        if (!db.accounts.some((a) => a.id === id)) return 'error'
        // 무결성: 연결된 결제통로/사용 중인 거래가 있으면 삭제 차단
        if (db.paymentSources.some((p) => p.linkedAccountId === id)) return 'linked-payment'
        if (db.transactions.some((t) => t.accountId === id)) return 'used-in-tx'
        setDb((prev) => ({ ...prev, accounts: prev.accounts.filter((a) => a.id !== id) }))
        return 'deleted'
      } catch {
        return 'error'
      }
    }

    // ----- 결제통로 -----
    function addPaymentSource(input: NewPaymentSourceInput): boolean {
      try {
        const ps = createPaymentSource(input)
        if (!ps) return false
        setDb((prev) => ({ ...prev, paymentSources: [...prev.paymentSources, ps] }))
        return true
      } catch {
        return false
      }
    }
    function updatePaymentSource(id: string, patch: PaymentSourcePatch): boolean {
      try {
        const existing = db.paymentSources.find((p) => p.id === id)
        if (!existing) return false
        const updated = applyPaymentSourcePatch(existing, patch)
        if (!updated) return false
        setDb((prev) => ({ ...prev, paymentSources: prev.paymentSources.map((p) => (p.id === id ? updated : p)) }))
        return true
      } catch {
        return false
      }
    }
    function deletePaymentSource(id: string): PaymentSourceDeleteResult {
      try {
        if (!db.paymentSources.some((p) => p.id === id)) return 'error'
        // 무결성: 거래에서 사용 중이면 삭제 차단 (과거 내역 보존)
        if (db.transactions.some((t) => t.paymentSourceId === id)) return 'used-in-tx'
        // 무결성: 역할 기본 결제통로면 삭제 차단
        const pd = db.settings.personDefaults
        if (pd && (pd.hyeonsu.paymentSourceId === id || pd.tanner.paymentSourceId === id)) return 'is-default'
        setDb((prev) => ({ ...prev, paymentSources: prev.paymentSources.filter((p) => p.id !== id) }))
        return 'deleted'
      } catch {
        return 'error'
      }
    }

    // ----- 역할별 기본값 -----
    function updatePersonDefaults(role: Role, patch: Partial<PersonDefaults>) {
      setDb((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          personDefaults: {
            ...prev.settings.personDefaults,
            [role]: { ...prev.settings.personDefaults[role], ...patch },
          },
        },
      }))
      // 현재 기기 역할의 기본값을 바꾸면 보기 설정(표시통화·언어)도 맞춰준다.
      if (role === device.role) {
        if (patch.currency) setDisplayCurrency(patch.currency)
        if (patch.lang) setLang(patch.lang)
      }
    }

    // ----- 카테고리 -----
    function addCategory(input: NewCategoryInput): boolean {
      try {
        const cat = createCategory(input)
        if (!cat) return false
        setDb((prev) => ({ ...prev, categories: [...prev.categories, cat] }))
        return true
      } catch {
        return false
      }
    }
    function updateCategory(id: string, patch: CategoryPatch): boolean {
      try {
        const existing = db.categories.find((c) => c.id === id)
        if (!existing) return false
        const updated = applyCategoryPatch(existing, patch)
        if (!updated) return false
        setDb((prev) => ({ ...prev, categories: prev.categories.map((c) => (c.id === id ? updated : c)) }))
        return true
      } catch {
        return false
      }
    }
    function setCategoryActive(id: string, isActive: boolean): boolean {
      try {
        if (!db.categories.some((c) => c.id === id)) return false
        setDb((prev) => ({
          ...prev,
          categories: prev.categories.map((c) => (c.id === id ? { ...c, isActive } : c)),
        }))
        return true
      } catch {
        return false
      }
    }
    // 거래에서 쓰는 카테고리는 실제 삭제 대신 숨김(데이터 무결성). 안 쓰는 것만 삭제.
    function deleteCategory(id: string): CategoryDeleteResult {
      try {
        if (!db.categories.some((c) => c.id === id)) return 'error'
        if (db.transactions.some((t) => t.categoryId === id)) return 'used-in-tx'
        setDb((prev) => ({ ...prev, categories: prev.categories.filter((c) => c.id !== id) }))
        return 'deleted'
      } catch {
        return 'error'
      }
    }

    // ----- 빠른버튼 -----
    function addQuickAction(input: NewQuickActionInput): boolean {
      try {
        const nextOrder = db.quickActions.reduce((m, q) => Math.max(m, q.sortOrder ?? 0), -1) + 1
        const qa = createQuickAction({ sortOrder: nextOrder, ...input }, db.settings.fxRate)
        if (!qa) return false
        setDb((prev) => ({ ...prev, quickActions: [...prev.quickActions, qa] }))
        return true
      } catch {
        return false
      }
    }
    function updateQuickAction(id: string, patch: QuickActionPatch): boolean {
      try {
        const existing = db.quickActions.find((q) => q.id === id)
        if (!existing) return false
        const updated = applyQuickActionPatch(existing, patch, db.settings.fxRate)
        if (!updated) return false
        setDb((prev) => ({ ...prev, quickActions: prev.quickActions.map((q) => (q.id === id ? updated : q)) }))
        return true
      } catch {
        return false
      }
    }
    function deleteQuickAction(id: string): boolean {
      try {
        if (!db.quickActions.some((q) => q.id === id)) return false
        setDb((prev) => ({ ...prev, quickActions: prev.quickActions.filter((q) => q.id !== id) }))
        return true
      } catch {
        return false
      }
    }
    // 위/아래 이동: sortOrder 기준 정렬 후 이웃과 순서값 교환
    function moveQuickAction(id: string, direction: 'up' | 'down'): boolean {
      try {
        const sorted = [...db.quickActions].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        const idx = sorted.findIndex((q) => q.id === id)
        if (idx < 0) return false
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1
        if (swapIdx < 0 || swapIdx >= sorted.length) return false
        const a = sorted[idx]
        const b = sorted[swapIdx]
        const ao = a.sortOrder ?? idx
        const bo = b.sortOrder ?? swapIdx
        setDb((prev) => ({
          ...prev,
          quickActions: prev.quickActions.map((q) =>
            q.id === a.id ? { ...q, sortOrder: bo } : q.id === b.id ? { ...q, sortOrder: ao } : q,
          ),
        }))
        return true
      } catch {
        return false
      }
    }

    return {
      db,
      device,
      role: device.role,
      lang: device.lang,
      displayCurrency: device.displayCurrency,
      fxRate: db.settings.fxRate,
      defaultPaymentSourceId,
      setRole,
      clearRole,
      setDisplayCurrency,
      setLang,
      setDefaultCurrency,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      applyRecurringItem,
      addAccount,
      updateAccount,
      deleteAccount,
      addPaymentSource,
      updatePaymentSource,
      deletePaymentSource,
      updatePersonDefaults,
      addCategory,
      updateCategory,
      setCategoryActive,
      deleteCategory,
      addQuickAction,
      updateQuickAction,
      deleteQuickAction,
      moveQuickAction,
      resetData,
    }
  }, [db, device])

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within <WalletProvider>')
  return ctx
}
