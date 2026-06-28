// ===== Seed 데이터 (빈 지갑) =====
// 최초 실행 시(localStorage 없음) 또는 초기화 시 사용하는 최소 기본 구조.
// 샘플 자산/거래/월급/고정지출/빠른버튼은 넣지 않는다 — 사용자가 직접 채운다.

import { USD_TO_KRW } from '../lib/money'
import type { WalletDb } from './types'

const NOW = '2026-01-01T00:00:00.000Z'

export function createSeedDb(): WalletDb {
  return {
    version: 2,
    household: {
      id: 'household_1',
      createdAt: NOW,
      members: [
        { id: 'hyeonsu', role: 'hyeonsu' },
        { id: 'tanner', role: 'tanner' },
      ],
    },

    settings: {
      defaultCurrency: 'KRW',
      fxRate: USD_TO_KRW, // 1 USD = 1,500 KRW (고정)
      personDefaults: {
        hyeonsu: { paymentSourceId: 'ps_hyeonsu_card', currency: 'KRW', lang: 'ko' },
        tanner: { paymentSourceId: 'ps_tanner_card', currency: 'USD', lang: 'en' },
      },
    },

    // 보관 위치 — 빈 잔액
    accounts: [
      { id: 'acc_hyeonsu_bank', nameKo: '현수 입출금', nameEn: 'Hyeonsu Checking', holder: 'hyeonsu', kind: 'checking', tier: 'spendable', currency: 'KRW', balanceOriginal: 0, balanceKrw: 0 },
      { id: 'acc_tanner_bank', nameKo: '태너 입출금', nameEn: 'Tanner Checking', holder: 'tanner', kind: 'checking', tier: 'spendable', currency: 'USD', balanceOriginal: 0, balanceKrw: 0 },
      { id: 'acc_cash', nameKo: '현금', nameEn: 'Cash', holder: 'shared', kind: 'cash', tier: 'spendable', currency: 'KRW', balanceOriginal: 0, balanceKrw: 0 },
    ],

    // 결제 통로 — 입출금 계좌 연결, 즉시 차감(immediate)
    paymentSources: [
      { id: 'ps_hyeonsu_card', nameKo: '현수카드', nameEn: 'Hyeonsu Card', kind: 'card', holder: 'hyeonsu', currency: 'KRW', linkedAccountId: 'acc_hyeonsu_bank', settlementType: 'immediate', isActive: true },
      { id: 'ps_tanner_card', nameKo: 'Tanner Card', nameEn: 'Tanner Card', kind: 'card', holder: 'tanner', currency: 'KRW', linkedAccountId: 'acc_tanner_bank', settlementType: 'immediate', isActive: true },
    ],

    // 기본 카테고리 (영문 id, 표시 이름은 nameKo/nameEn) — 예산은 비움
    categories: [
      { id: 'food', nameKo: '식비', nameEn: 'Food', isActive: true, builtin: true },
      { id: 'cafe', nameKo: '카페', nameEn: 'Cafe', isActive: true, builtin: true },
      { id: 'transport', nameKo: '교통', nameEn: 'Transport', isActive: true, builtin: true },
      { id: 'date', nameKo: '데이트', nameEn: 'Date', isActive: true, builtin: true },
      { id: 'shopping', nameKo: '쇼핑', nameEn: 'Shopping', isActive: true, builtin: true },
      { id: 'home', nameKo: '집/생활', nameEn: 'Home', isActive: true, builtin: true },
      { id: 'other', nameKo: '기타', nameEn: 'Other', isActive: true, builtin: true },
    ],

    transactions: [],
    budgets: [],
    recurringItems: [],
    quickActions: [],
  }
}
