// ===== 전역 상태 (React Context) =====
// 가구 공용 DB와 기기 전용 상태를 들고, 변경 시 localStorage에 저장한다.
// 1단계에서는 역할/표시통화/언어 위주로 연결하고,
// 거래 추가·수정 등 쓰기 액션은 다음 단계에서 확장한다.

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { firebaseReady } from '../firebase/config'
import { loadWalletOnce, saveWallet, subscribeWallet } from '../firebase/walletSync'
import { buildShareUrl, genWalletId, setWalletIdInUrl, walletIdFromUrl } from '../lib/walletId'
import {
  loadDb,
  loadDevice,
  resetDb,
  saveDb,
  saveDevice,
} from '../storage/walletStore'
import {
  createAdjustmentTransaction,
  createTransactionFromInput,
  createTransactionFromRecurring,
  type NewTransactionInput,
} from '../domain/transactions'
import { applyTxToBalances, expenseFromAccount } from '../domain/balances'
import {
  classifyRecurring,
  getActiveMonth,
  isRecurringAppliedThisMonth,
  recurringTxType,
  toKrw,
} from '../domain/calculations'
import { recurringTitle } from '../i18n/labels'
import { migrateDb } from '../domain/migrate'
import { buildBackup, transactionsToCsv, validateBackup } from '../domain/backup'
import {
  applyRecurringPatch,
  createRecurringItem,
  type NewRecurringInput,
  type RecurringPatch,
} from '../domain/recurring'
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
export type RecurringDeleteResult = 'deleted' | 'hidden' | 'error'

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
  setMonthlyBudget: (krw: number) => void
  addTransaction: (input: NewTransactionInput) => boolean
  updateTransaction: (id: string, patch: UpdateTransactionPatch) => boolean
  deleteTransaction: (id: string) => boolean
  adjustAccountBalance: (accountId: string, newBalanceOriginal: number) => boolean
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
  // 반복항목
  addRecurringItem: (input: NewRecurringInput) => boolean
  updateRecurringItem: (id: string, patch: RecurringPatch) => boolean
  deleteRecurringItem: (id: string) => RecurringDeleteResult
  // 데이터 백업/복원/초기화
  exportBackupString: (includeDevice?: boolean) => string
  exportTransactionsCsv: () => string
  replaceDatabaseFromBackup: (parsed: unknown) => boolean
  resetDatabaseToSeed: () => void
  resetData: () => void
  // 공동지갑(Firestore) 동기화
  firebaseReady: boolean
  walletId: string | null
  shareUrl: string | null
  syncStatus: SyncStatus
  createSharedWallet: () => void
  uploadToShared: () => void
  reloadFromShared: () => void
}

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'offline'

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

  // 공동지갑 연결 id: URL 우선, 없으면 마지막 연결 id
  const [walletId, setWalletId] = useState<string | null>(
    () => walletIdFromUrl() ?? loadDevice().lastWalletId ?? null,
  )
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    firebaseReady && (walletIdFromUrl() ?? loadDevice().lastWalletId) ? 'syncing' : 'local',
  )

  // 최신 db 참조 (구독 콜백/저장에서 사용)
  const dbRef = useRef(db)
  dbRef.current = db
  // 마지막으로 동기화된(원격과 동일한) db의 JSON. 에코 루프 방지용.
  const lastSyncedJson = useRef<string | null>(null)

  // 변경 시 저장 (데이터 누락 방지)
  useEffect(() => {
    saveDb(db)
  }, [db])
  useEffect(() => {
    saveDevice(device)
  }, [device])

  // walletId가 바뀌면 주소창 쿼리 + 기기 기억값에 반영
  useEffect(() => {
    setWalletIdInUrl(walletId)
    setDevice((prev) => (prev.lastWalletId === walletId ? prev : { ...prev, lastWalletId: walletId }))
  }, [walletId])

  // Firestore 실시간 구독
  useEffect(() => {
    if (!firebaseReady || !walletId) {
      setSyncStatus('local')
      return
    }
    setSyncStatus('syncing')
    const updatedBy = device.role ?? 'unknown'
    const unsub = subscribeWallet(
      walletId,
      (remote) => {
        if (!remote) {
          // 원격 문서 없음 → 현재 로컬 db를 최초 업로드
          const current = dbRef.current
          lastSyncedJson.current = JSON.stringify(current)
          saveWallet(walletId, current, updatedBy)
            .then(() => setSyncStatus('synced'))
            .catch(() => setSyncStatus('offline'))
          return
        }
        // 원격 db를 마이그레이션해 현재 스키마로 맞춤
        const migrated = migrateDb(remote.db)
        const json = JSON.stringify(migrated)
        if (json !== lastSyncedJson.current) {
          lastSyncedJson.current = json // setDb 전에 기록 → 쓰기 effect가 동일 비교로 스킵
          setDb(migrated)
        }
        setSyncStatus('synced')
      },
      () => setSyncStatus('offline'),
    )
    return unsub
    // device.role은 최초 구독 시점 값만 쓰면 충분 (updatedBy 라벨용)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletId])

  // db 변경 시 원격에 디바운스 저장 (원격에서 받은 변경은 lastSyncedJson로 스킵)
  useEffect(() => {
    if (!firebaseReady || !walletId) return
    const json = JSON.stringify(db)
    if (json === lastSyncedJson.current) return
    setSyncStatus('syncing')
    const t = setTimeout(() => {
      lastSyncedJson.current = json
      saveWallet(walletId, db, device.role ?? 'unknown')
        .then(() => setSyncStatus('synced'))
        .catch(() => setSyncStatus('offline'))
    }, 600)
    return () => clearTimeout(t)
  }, [db, walletId, device.role])

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
    // 이번 달 총예산 (원화 환산값으로 저장)
    function setMonthlyBudget(krw: number) {
      const v = Number.isFinite(krw) && krw > 0 ? Math.round(krw) : 0
      setDb((prev) => ({ ...prev, settings: { ...prev.settings, monthlyBudgetKrw: v } }))
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

    const fxRate = db.settings.fxRate

    // 거래 추가 + 잔액 반영.
    // expense: immediate 정산이면 연결 계좌에서 차감 / income: 입금 계좌 증가 / transfer: from→to 이동
    function addTransaction(input: NewTransactionInput): boolean {
      try {
        if (!device.role) return false
        const amount = Number(input.amountOriginal)
        if (!amount || amount <= 0) return false
        const type = input.type ?? 'expense'

        const psId = input.paymentSourceId || defaultPaymentSourceId || ''
        let fromAccountId = input.fromAccountId
        let toAccountId = input.toAccountId
        if (type === 'expense') {
          fromAccountId = expenseFromAccount(db.paymentSources, psId)
          toAccountId = undefined
        }

        const tx = createTransactionFromInput(
          { ...input, type, fromAccountId, toAccountId },
          { role: device.role, fxRate, defaultPaymentSourceId },
        )
        setDb((prev) => ({
          ...prev,
          transactions: [...prev.transactions, tx],
          accounts: applyTxToBalances(prev.accounts, tx, 1, fxRate),
        }))
        return true
      } catch {
        return false
      }
    }

    // 거래 수정. 잔액은 옛 효과를 되돌리고 새 효과를 다시 적용한다.
    function updateTransaction(id: string, patch: UpdateTransactionPatch): boolean {
      try {
        const existing = db.transactions.find((t) => t.id === id)
        if (!existing) return false

        const currency: Currency =
          patch.currency === 'USD' || patch.currency === 'KRW' ? patch.currency : existing.currency
        const amountOriginal =
          patch.amountOriginal != null ? Number(patch.amountOriginal) : existing.amountOriginal
        if (!amountOriginal || amountOriginal <= 0) return false

        const paymentSourceId =
          (patch.paymentSourceId ?? existing.paymentSourceId) || defaultPaymentSourceId || existing.paymentSourceId

        // 잔액 연결 재계산: 지출은 정산방식 기준, 그 외(income/transfer/adjustment)는 기존 from/to 유지
        const fromAccountId =
          existing.type === 'expense' ? expenseFromAccount(db.paymentSources, paymentSourceId) : existing.fromAccountId
        const toAccountId = existing.type === 'expense' ? undefined : existing.toAccountId

        const updated: Transaction = {
          ...existing,
          ...patch,
          currency,
          amountOriginal,
          amountKrw: toKrw(amountOriginal, currency, fxRate),
          fxRateUsed: fxRate,
          categoryId: (patch.categoryId ?? existing.categoryId) || 'other',
          usedFor: (patch.usedFor ?? existing.usedFor) || 'shared',
          paymentSourceId,
          fromAccountId,
          toAccountId,
          updatedAt: new Date().toISOString(),
        }
        setDb((prev) => {
          const reverted = applyTxToBalances(prev.accounts, existing, -1, fxRate)
          const reapplied = applyTxToBalances(reverted, updated, 1, fxRate)
          return {
            ...prev,
            transactions: prev.transactions.map((t) => (t.id === id ? updated : t)),
            accounts: reapplied,
          }
        })
        return true
      } catch {
        return false
      }
    }

    // 거래 삭제 + 잔액 효과 되돌리기.
    function deleteTransaction(id: string): boolean {
      try {
        const existing = db.transactions.find((t) => t.id === id)
        if (!existing) return false
        setDb((prev) => ({
          ...prev,
          transactions: prev.transactions.filter((t) => t.id !== id),
          accounts: applyTxToBalances(prev.accounts, existing, -1, fxRate),
        }))
        return true
      } catch {
        return false
      }
    }

    // 잔액 맞추기: 앱 잔액과 실제 잔액이 다를 때 보정. adjustment 거래로 기록.
    function adjustAccountBalance(accountId: string, newBalanceOriginal: number): boolean {
      try {
        if (!device.role) return false
        const acc = db.accounts.find((a) => a.id === accountId)
        if (!acc) return false
        const newOrig = Number(newBalanceOriginal)
        if (!Number.isFinite(newOrig) || newOrig < 0) return false
        const newKrw = toKrw(newOrig, acc.currency, fxRate)
        const origDelta = newOrig - acc.balanceOriginal
        const krwDelta = newKrw - acc.balanceKrw
        if (krwDelta === 0) return true // 변화 없음
        const tx = createAdjustmentTransaction(accountId, acc.currency, origDelta, krwDelta, {
          role: device.role,
          fxRate,
          label: device.lang === 'en' ? 'Balance match' : '잔액 맞추기',
        })
        setDb((prev) => ({
          ...prev,
          // 잔액은 입력한 실제 값으로 직접 설정 (소수 오차 방지). tx는 차액을 기록해 삭제 시 되돌릴 수 있게.
          accounts: prev.accounts.map((a) =>
            a.id === accountId ? { ...a, balanceOriginal: newOrig, balanceKrw: newKrw } : a,
          ),
          transactions: [...prev.transactions, tx],
        }))
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
        const kind = classifyRecurring(item)

        // 잔액 연결 해석
        const firstSpendable = db.accounts.find((a) => a.tier === 'spendable')?.id
        let fromAccountId: string | undefined
        let toAccountId: string | undefined
        if (kind === 'income') {
          toAccountId = item.accountId ?? firstSpendable
        } else if (kind === 'expense') {
          fromAccountId = expenseFromAccount(db.paymentSources, item.paymentSourceId)
        } else {
          // savingTransfer: 출발(연결 계좌) → 도착(item.accountId). 둘 다 있어야 잔액 이동.
          fromAccountId = expenseFromAccount(db.paymentSources, item.paymentSourceId)
          toAccountId = item.accountId
          if (!fromAccountId || !toAccountId) {
            fromAccountId = undefined
            toAccountId = undefined
          }
        }

        const tx = createTransactionFromRecurring(item, {
          role: device.role,
          fxRate,
          type: recurringTxType(kind),
          date,
          label: recurringTitle(item, device.lang),
          fromAccountId,
          toAccountId,
        })
        setDb((prev) => ({
          ...prev,
          transactions: [...prev.transactions, tx],
          accounts: applyTxToBalances(prev.accounts, tx, 1, fxRate),
        }))
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

    // ----- 반복항목 -----
    function addRecurringItem(input: NewRecurringInput): boolean {
      try {
        const item = createRecurringItem(input, db.settings.fxRate)
        if (!item) return false
        setDb((prev) => ({ ...prev, recurringItems: [...prev.recurringItems, item] }))
        return true
      } catch {
        return false
      }
    }
    function updateRecurringItem(id: string, patch: RecurringPatch): boolean {
      try {
        const existing = db.recurringItems.find((r) => r.id === id)
        if (!existing) return false
        const updated = applyRecurringPatch(existing, patch, db.settings.fxRate)
        if (!updated) return false
        setDb((prev) => ({ ...prev, recurringItems: prev.recurringItems.map((r) => (r.id === id ? updated : r)) }))
        return true
      } catch {
        return false
      }
    }
    // 반영된 적 있는 항목은 실제 삭제 대신 숨김(거래 보존). 안 쓰던 것만 삭제.
    function deleteRecurringItem(id: string): RecurringDeleteResult {
      try {
        if (!db.recurringItems.some((r) => r.id === id)) return 'error'
        const wasApplied = db.transactions.some((t) => t.sourceRecurringItemId === id)
        if (wasApplied) {
          setDb((prev) => ({
            ...prev,
            recurringItems: prev.recurringItems.map((r) => (r.id === id ? { ...r, active: false } : r)),
          }))
          return 'hidden'
        }
        setDb((prev) => ({ ...prev, recurringItems: prev.recurringItems.filter((r) => r.id !== id) }))
        return 'deleted'
      } catch {
        return 'error'
      }
    }

    // ----- 데이터 백업/복원/초기화 -----
    function exportBackupString(includeDevice = false): string {
      return JSON.stringify(buildBackup(db, includeDevice ? device : undefined), null, 2)
    }
    function exportTransactionsCsv(): string {
      return transactionsToCsv(db, device.lang)
    }
    // 백업 파일로 현재 DB 교체. 실패하면 기존 데이터 유지(setDb 호출 안 함).
    function replaceDatabaseFromBackup(parsed: unknown): boolean {
      try {
        const result = validateBackup(parsed)
        if (!result.ok) return false
        // 구버전 백업도 migrate로 맞춰 복원
        const migrated = migrateDb(result.db)
        setDb(migrated)
        return true
      } catch {
        return false
      }
    }
    // seed(빈 지갑)로 초기화 (기기 역할/표시설정은 유지)
    function resetDatabaseToSeed(): void {
      setDb(resetDb())
    }

    // ----- 공동지갑(Firestore) -----
    // 새 공동지갑 생성: 새 id를 만들고 현재 db를 그 지갑으로 연결. 구독 effect가 최초 업로드.
    function createSharedWallet(): void {
      if (!firebaseReady) return
      lastSyncedJson.current = null
      setWalletId(genWalletId())
    }
    // 현재 로컬 db를 공동지갑에 강제 업로드(덮어쓰기).
    function uploadToShared(): void {
      if (!firebaseReady || !walletId) return
      setSyncStatus('syncing')
      const json = JSON.stringify(db)
      lastSyncedJson.current = json
      saveWallet(walletId, db, device.role ?? 'unknown')
        .then(() => setSyncStatus('synced'))
        .catch(() => setSyncStatus('offline'))
    }
    // 공동지갑에서 한번 다시 읽어와 로컬을 덮어씀.
    function reloadFromShared(): void {
      if (!firebaseReady || !walletId) return
      setSyncStatus('syncing')
      loadWalletOnce(walletId)
        .then((remote) => {
          if (remote) {
            const migrated = migrateDb(remote.db)
            lastSyncedJson.current = JSON.stringify(migrated)
            setDb(migrated)
          }
          setSyncStatus('synced')
        })
        .catch(() => setSyncStatus('offline'))
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
      setMonthlyBudget,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      adjustAccountBalance,
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
      addRecurringItem,
      updateRecurringItem,
      deleteRecurringItem,
      exportBackupString,
      exportTransactionsCsv,
      replaceDatabaseFromBackup,
      resetDatabaseToSeed,
      resetData,
      firebaseReady,
      walletId,
      shareUrl: walletId ? buildShareUrl(walletId) : null,
      syncStatus,
      createSharedWallet,
      uploadToShared,
      reloadFromShared,
    }
  }, [db, device, walletId, syncStatus])

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within <WalletProvider>')
  return ctx
}
