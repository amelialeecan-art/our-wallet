// ===== Seed 데이터 =====
// 현재 디자인에 보이는 예시 값을 안정적인 영문 키로 옮긴 것.
// 최초 실행 시(또는 데이터 손상 복구 시) 이 값으로 시작한다.

import { USD_TO_KRW } from '../lib/money'
import type { WalletDb } from './types'

const NOW = '2026-06-24T09:41:00.000Z'
const TODAY = '2026-06-24'
const MONTH = '2026-06'

export function createSeedDb(): WalletDb {
  return {
    version: 1,
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
    },

    // 보관 위치 — 쓸 수 있는 돈 29,000,000 + 모으는·불리는 돈 19,000,000 = 48,000,000
    accounts: [
      { id: 'acc_hyeonsu_bank', holder: 'hyeonsu', kind: 'bank', tier: 'spendable', currency: 'KRW', balanceOriginal: 18000000, balanceKrw: 18000000 },
      { id: 'acc_tanner_bank', holder: 'tanner', kind: 'bank', tier: 'spendable', currency: 'USD', balanceOriginal: 6000, balanceKrw: 9000000 },
      { id: 'acc_cash', holder: 'shared', kind: 'cash', tier: 'spendable', currency: 'KRW', balanceOriginal: 2000000, balanceKrw: 2000000 },
      { id: 'acc_hyeonsu_savings', holder: 'hyeonsu', kind: 'savings', tier: 'saving', currency: 'KRW', balanceOriginal: 8000000, balanceKrw: 8000000 },
      { id: 'acc_tanner_invest', holder: 'tanner', kind: 'investment', tier: 'saving', currency: 'KRW', balanceOriginal: 11000000, balanceKrw: 11000000 },
    ],

    // 결제 통로
    paymentSources: [
      { id: 'ps_hyeonsu_card', kind: 'card', holder: 'hyeonsu', currency: 'KRW', linkedAccountId: 'acc_hyeonsu_bank' },
      { id: 'ps_tanner_card', kind: 'card', holder: 'tanner', currency: 'KRW', linkedAccountId: 'acc_tanner_bank' },
      { id: 'ps_hyeonsu_transfer', kind: 'transfer', holder: 'hyeonsu', currency: 'KRW', linkedAccountId: 'acc_hyeonsu_bank' },
    ],

    // 카테고리 (영문 id, 화면 라벨은 i18n)
    categories: [
      { id: 'food', builtin: true },
      { id: 'cafe', builtin: true },
      { id: 'transport', builtin: true },
      { id: 'date', builtin: true },
      { id: 'shopping', builtin: true },
      { id: 'home', builtin: true },
      { id: 'other', builtin: true },
    ],

    // 최근 우리 지출
    transactions: [
      { id: 'tx_1', type: 'expense', amountOriginal: 12000, currency: 'KRW', fxRateUsed: USD_TO_KRW, amountKrw: 12000, date: TODAY, categoryId: 'food', usedFor: 'shared', paymentSourceId: 'ps_hyeonsu_card', accountId: 'acc_hyeonsu_bank', recordedBy: 'hyeonsu', memo: '점심', createdAt: NOW, updatedAt: NOW },
      { id: 'tx_2', type: 'expense', amountOriginal: 6000, currency: 'KRW', fxRateUsed: USD_TO_KRW, amountKrw: 6000, date: TODAY, categoryId: 'cafe', usedFor: 'shared', paymentSourceId: 'ps_tanner_card', accountId: 'acc_tanner_bank', recordedBy: 'tanner', memo: '카페', createdAt: NOW, updatedAt: NOW },
      { id: 'tx_3', type: 'expense', amountOriginal: 10000, currency: 'KRW', fxRateUsed: USD_TO_KRW, amountKrw: 10000, date: TODAY, categoryId: 'food', usedFor: 'tanner', paymentSourceId: 'ps_tanner_card', accountId: 'acc_tanner_bank', recordedBy: 'tanner', memo: '간식', createdAt: NOW, updatedAt: NOW },
    ],

    // 이번 달 예산 (총 3,000,000)
    budgets: [
      {
        month: MONTH,
        totalKrw: 3000000,
        byCategory: {
          date: 400000,
          food: 800000,
          shopping: 500000,
          cafe: 150000,
          transport: 100000,
          home: 300000,
        },
      },
    ],

    // 반복 항목 (월급 / 고정지출)
    recurringItems: [
      { id: 'rec_tanner_pay', direction: 'income', labelKey: 'recurring.tanner_pay', amountOriginal: 2700000, currency: 'KRW', amountKrw: 2700000, daysOfMonth: [1, 15], status: 'due' },
      { id: 'rec_hyeonsu_salary', direction: 'income', labelKey: 'recurring.hyeonsu_salary', amountOriginal: 3200000, currency: 'KRW', amountKrw: 3200000, daysOfMonth: [25], status: 'due' },
      { id: 'rec_rent', direction: 'expense', labelKey: 'recurring.rent', amountOriginal: 900000, currency: 'KRW', amountKrw: 900000, daysOfMonth: [1], categoryId: 'home', status: 'due' },
      { id: 'rec_maintenance', direction: 'expense', labelKey: 'recurring.maintenance', amountOriginal: 180000, currency: 'KRW', amountKrw: 180000, daysOfMonth: [5], categoryId: 'home', status: 'due' },
      { id: 'rec_netflix', direction: 'expense', labelKey: 'recurring.netflix', amountOriginal: 17000, currency: 'KRW', amountKrw: 17000, daysOfMonth: [15], categoryId: 'other', status: 'due' },
      { id: 'rec_card_bill', direction: 'expense', labelKey: 'recurring.card_bill', amountOriginal: 1400000, currency: 'KRW', amountKrw: 1400000, daysOfMonth: [12], status: 'done' },
      { id: 'rec_savings_transfer', direction: 'expense', labelKey: 'recurring.savings_transfer', amountOriginal: 500000, currency: 'KRW', amountKrw: 500000, daysOfMonth: [25], accountId: 'acc_hyeonsu_savings', status: 'skip' },
    ],

    // 빠른 입력 버튼
    quickActions: [
      { id: 'q_lunch', labelKey: 'quick.lunch', amountOriginal: 12000, currency: 'KRW', amountKrw: 12000, categoryId: 'food' },
      { id: 'q_cafe', labelKey: 'quick.cafe', amountOriginal: 6000, currency: 'KRW', amountKrw: 6000, categoryId: 'cafe' },
      { id: 'q_subway', labelKey: 'quick.subway', amountOriginal: 1500, currency: 'KRW', amountKrw: 1500, categoryId: 'transport' },
      { id: 'q_coupang', labelKey: 'quick.coupang', amountOriginal: 25000, currency: 'KRW', amountKrw: 25000, categoryId: 'shopping' },
      { id: 'q_tanner_snack', labelKey: 'quick.tanner_snack', amountOriginal: 10000, currency: 'KRW', amountKrw: 10000, categoryId: 'food', usedFor: 'tanner' },
      { id: 'q_date_meal', labelKey: 'quick.date_meal', amountOriginal: 50000, currency: 'KRW', amountKrw: 50000, categoryId: 'date' },
    ],
  }
}
