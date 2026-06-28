// ===== 잔액 반영 엔진 =====
// 거래의 fromAccountId/toAccountId 기준으로 계좌 잔액을 증감한다.
// sign=+1 적용(추가), sign=-1 되돌리기(삭제/수정 전 복구).
// balanceKrw는 거래 amountKrw로, balanceOriginal은 계좌 통화로 환산해 함께 갱신.

import type { Account, Transaction } from './types'

function adjustOne(accounts: Account[], id: string, krwDelta: number, fxRate: number): Account[] {
  return accounts.map((a) => {
    if (a.id !== id) return a
    const origDelta = a.currency === 'USD' ? krwDelta / fxRate : krwDelta
    return { ...a, balanceKrw: a.balanceKrw + krwDelta, balanceOriginal: a.balanceOriginal + origDelta }
  })
}

export function applyTxToBalances(
  accounts: Account[],
  tx: Pick<Transaction, 'amountKrw' | 'fromAccountId' | 'toAccountId'>,
  sign: 1 | -1,
  fxRate: number,
): Account[] {
  let next = accounts
  const amt = tx.amountKrw * sign
  if (tx.fromAccountId) next = adjustOne(next, tx.fromAccountId, -amt, fxRate)
  if (tx.toAccountId) next = adjustOne(next, tx.toAccountId, amt, fxRate)
  return next
}

// 지출 시 즉시 차감될 계좌 (immediate 정산 + 연결 계좌가 있을 때만)
export function expenseFromAccount(
  paymentSources: { id: string; linkedAccountId?: string; settlementType?: string }[],
  paymentSourceId: string | undefined,
): string | undefined {
  if (!paymentSourceId) return undefined
  const ps = paymentSources.find((p) => p.id === paymentSourceId)
  if (!ps) return undefined
  const settlement = ps.settlementType ?? 'immediate'
  if (settlement === 'immediate' && ps.linkedAccountId) return ps.linkedAccountId
  return undefined
}
