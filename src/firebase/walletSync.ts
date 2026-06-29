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
  await setDoc(doc(firestore, 'wallets', walletId), payload)
}

export async function loadWalletOnce(walletId: string): Promise<WalletDoc | null> {
  if (!firestore) return null
  const snap = await getDoc(doc(firestore, 'wallets', walletId))
  return snap.exists() ? (snap.data() as WalletDoc) : null
}
