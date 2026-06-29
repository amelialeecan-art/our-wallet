// 공동지갑 Firestore 동기화 (wallets/{walletId} 단일 문서).
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { firestore } from './config'
import type { WalletDb } from '../domain/types'

export interface WalletDoc {
  db: WalletDb
  updatedAt: number
  updatedBy: string
  schemaVersion: number
}

// Firestore는 undefined 값을 거부한다(Unsupported field value: undefined).
// 저장 전에 payload 전체를 정리:
//  - object의 undefined 속성 제거
//  - array의 undefined 항목 제거
//  - NaN/Infinity 숫자는 0으로 방어
//  - null/number/string/boolean은 그대로 유지
export function sanitizeForFirestore<T>(value: T): T {
  return sanitize(value) as T
}

function sanitize(value: unknown): unknown {
  if (value === undefined) return undefined // 호출부(배열 filter / object continue)에서 제거됨
  if (value === null) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (Array.isArray(value)) {
    return value.map(sanitize).filter((v) => v !== undefined)
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue
      const s = sanitize(v)
      if (s !== undefined) out[k] = s
    }
    return out
  }
  return value
}

// 실시간 구독. 문서 없으면 onData(null). cleanup 함수 반환.
export function subscribeWallet(
  walletId: string,
  onData: (doc: WalletDoc | null) => void,
  onError?: (e: unknown) => void,
): () => void {
  if (!firestore) return () => {}
  return onSnapshot(
    doc(firestore, 'wallets', walletId),
    (snap) => onData(snap.exists() ? (snap.data() as WalletDoc) : null),
    (err) => onError?.(err),
  )
}

export async function saveWallet(walletId: string, db: WalletDb, updatedBy: string): Promise<void> {
  if (!firestore) throw new Error('firestore unavailable')
  const payload: WalletDoc = { db, updatedAt: Date.now(), updatedBy, schemaVersion: db.version }
  // undefined 제거 후 저장 (Firestore가 undefined를 거부하므로)
  const clean = sanitizeForFirestore(payload)
  try {
    await setDoc(doc(firestore, 'wallets', walletId), clean)
  } catch (e) {
    // 저장 실패 원인을 콘솔에 남긴다 (예: Unsupported field value: undefined)
    console.error('[ourwallet] saveWallet failed:', e)
    throw e
  }
}

export async function loadWalletOnce(walletId: string): Promise<WalletDoc | null> {
  if (!firestore) return null
  const snap = await getDoc(doc(firestore, 'wallets', walletId))
  return snap.exists() ? (snap.data() as WalletDoc) : null
}
