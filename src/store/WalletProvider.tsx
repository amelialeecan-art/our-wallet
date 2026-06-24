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
  type NewTransactionInput,
} from '../domain/transactions'
import { toKrw } from '../domain/calculations'
import type {
  Currency,
  Lang,
  PaymentSource,
  Role,
  Transaction,
  WalletDb,
  DeviceState,
} from '../domain/types'

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
  resetData: () => void
}

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
    // 역할 선택 시 기기 기본값(표시통화·언어)을 함께 정해준다. 소유권이 아니라 기본값일 뿐.
    function setRole(role: Role) {
      setDevice((prev) => ({
        ...prev,
        role,
        displayCurrency: role === 'tanner' ? 'USD' : 'KRW',
        lang: role === 'tanner' ? 'en' : 'ko',
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

    const defaultPaymentSourceId = deriveDefaultPaymentSource(db.paymentSources, device.role)

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
