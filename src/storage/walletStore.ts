// ===== 우리지갑 저장소 (repository) =====
// 가구 공용 DB와 기기 전용 상태를 localStorage에 읽고 쓴다.
// - 최초 실행: seed 저장 후 사용
// - 저장된 데이터가 있으면 그것을 사용
// - 데이터가 깨졌으면 안전하게 seed로 복구
// - 모든 키는 앱 전용 prefix 사용
// - 저장 매체(localStorage)는 adapter 뒤에 숨겨 두어 Firebase 전환을 쉽게 함

import { storage } from './adapter'
import { createSeedDb } from '../domain/seed'
import { migrateDb } from '../domain/migrate'
import type { DeviceState, WalletDb } from '../domain/types'

const PREFIX = 'ourwallet.v1'
const DB_KEY = `${PREFIX}.db`
const DEVICE_KEY = `${PREFIX}.device`

// 최소 형태만 확인 (정밀 보정은 migrateDb가 담당). 손상 감지용.
function looksLikeDb(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const db = value as Partial<WalletDb>
  return Array.isArray(db.accounts) && Array.isArray(db.transactions)
}

// ----- 가구 공용 DB -----
export function loadDb(): WalletDb {
  const raw = storage.read(DB_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (looksLikeDb(parsed)) {
        // 이전 버전/누락 필드는 마이그레이션으로 보정 (seed로 덮어쓰지 않음)
        const migrated = migrateDb(parsed)
        saveDb(migrated)
        return migrated
      }
    } catch {
      // 파싱 실패 → 아래에서 seed로 복구
    }
  }
  const seed = createSeedDb()
  saveDb(seed)
  return seed
}

export function saveDb(db: WalletDb): void {
  storage.write(DB_KEY, JSON.stringify(db))
}

// 사용자 확인을 거친 뒤 호출 (실수 방지). seed로 되돌린다.
export function resetDb(): WalletDb {
  const seed = createSeedDb()
  saveDb(seed)
  return seed
}

// ----- 기기 전용 상태 -----
const DEFAULT_DEVICE: DeviceState = {
  role: null,
  displayCurrency: 'KRW',
  lang: 'ko',
}

function isValidDevice(value: unknown): value is DeviceState {
  if (!value || typeof value !== 'object') return false
  const d = value as Partial<DeviceState>
  const roleOk = d.role === null || d.role === 'hyeonsu' || d.role === 'tanner'
  const curOk = d.displayCurrency === 'KRW' || d.displayCurrency === 'USD'
  const langOk = d.lang === 'ko' || d.lang === 'en'
  return roleOk && curOk && langOk
}

export function loadDevice(): DeviceState {
  const raw = storage.read(DEVICE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (isValidDevice(parsed)) return parsed
    } catch {
      // 무시하고 기본값
    }
  }
  return { ...DEFAULT_DEVICE }
}

export function saveDevice(device: DeviceState): void {
  storage.write(DEVICE_KEY, JSON.stringify(device))
}
