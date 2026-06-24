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
import type {
  Currency,
  Lang,
  Role,
  WalletDb,
  DeviceState,
} from '../domain/types'

interface WalletContextValue {
  // 데이터
  db: WalletDb
  device: DeviceState
  // 자주 쓰는 파생 값
  role: Role | null
  lang: Lang
  displayCurrency: Currency
  fxRate: number
  // 액션
  setRole: (role: Role) => void
  clearRole: () => void
  setDisplayCurrency: (c: Currency) => void
  setLang: (l: Lang) => void
  setDefaultCurrency: (c: Currency) => void
  resetData: () => void
}

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

    return {
      db,
      device,
      role: device.role,
      lang: device.lang,
      displayCurrency: device.displayCurrency,
      fxRate: db.settings.fxRate,
      setRole,
      clearRole,
      setDisplayCurrency,
      setLang,
      setDefaultCurrency,
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
