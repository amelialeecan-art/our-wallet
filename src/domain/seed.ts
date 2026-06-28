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

    // 보관 위치 — 쓸 수 있는 돈 29,000,000 + 모으는·불리는 돈 19,000,000 = 48,000,000
    accounts: [
      { id: 'acc_hyeonsu_bank', nameKo: '현수 입출금', nameEn: 'Hyeonsu Checking', holder: 'hyeonsu', kind: 'checking', tier: 'spendable', currency: 'KRW', balanceOriginal: 18000000, balanceKrw: 18000000 },
      { id: 'acc_tanner_bank', nameKo: '태너 입출금', nameEn: 'Tanner Checking', holder: 'tanner', kind: 'checking', tier: 'spendable', currency: 'USD', balanceOriginal: 6000, balanceKrw: 9000000 },
      { id: 'acc_cash', nameKo: '현금', nameEn: 'Cash', holder: 'shared', kind: 'cash', tier: 'spendable', currency: 'KRW', balanceOriginal: 2000000, balanceKrw: 2000000 },
      { id: 'acc_hyeonsu_savings', nameKo: '현수 적금', nameEn: 'Hyeonsu Savings', holder: 'hyeonsu', kind: 'installment', tier: 'saving', currency: 'KRW', balanceOriginal: 8000000, balanceKrw: 8000000 },
      { id: 'acc_tanner_invest', nameKo: '태너 투자', nameEn: 'Tanner Investment', holder: 'tanner', kind: 'investment', tier: 'saving', currency: 'KRW', balanceOriginal: 11000000, balanceKrw: 11000000 },
    ],

    // 결제 통로
    paymentSources: [
      { id: 'ps_hyeonsu_card', nameKo: '현수카드', nameEn: 'Hyeonsu Card', kind: 'card', holder: 'hyeonsu', currency: 'KRW', linkedAccountId: 'acc_hyeonsu_bank', settlementType: 'deferred', isActive: true },
      { id: 'ps_tanner_card', nameKo: 'Tanner Card', nameEn: 'Tanner Card', kind: 'card', holder: 'tanner', currency: 'KRW', linkedAccountId: 'acc_tanner_bank', settlementType: 'deferred', isActive: true },
      { id: 'ps_hyeonsu_transfer', nameKo: '현수 계좌 이체', nameEn: 'Hyeonsu transfer', kind: 'account', holder: 'hyeonsu', currency: 'KRW', linkedAccountId: 'acc_hyeonsu_bank', settlementType: 'immediate', isActive: true },
    ],

    // 카테고리 (영문 id, 표시 이름은 nameKo/nameEn)
    categories: [
      { id: 'food', nameKo: '식비', nameEn: 'Food', budgetMonthly: 800000, isActive: true, builtin: true },
      { id: 'cafe', nameKo: '카페', nameEn: 'Cafe', budgetMonthly: 150000, isActive: true, builtin: true },
      { id: 'transport', nameKo: '교통', nameEn: 'Transport', budgetMonthly: 100000, isActive: true, builtin: true },
      { id: 'date', nameKo: '데이트', nameEn: 'Date', budgetMonthly: 400000, isActive: true, builtin: true },
      { id: 'shopping', nameKo: '쇼핑', nameEn: 'Shopping', budgetMonthly: 500000, isActive: true, builtin: true },
      { id: 'home', nameKo: '집/생활', nameEn: 'Home', budgetMonthly: 300000, isActive: true, builtin: true },
      { id: 'other', nameKo: '기타', nameEn: 'Other', isActive: true, builtin: true },
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

    // 반복 항목 (월급 / 고정지출 / 저축이체)
    recurringItems: [
      { id: 'rec_tanner_pay', type: 'income', labelKey: 'recurring.tanner_pay', amountOriginal: 2700000, currency: 'KRW', fxRateUsed: USD_TO_KRW, amountKrw: 2700000, daysOfMonth: [1, 15], active: true, status: 'due' },
      { id: 'rec_hyeonsu_salary', type: 'income', labelKey: 'recurring.hyeonsu_salary', amountOriginal: 3200000, currency: 'KRW', fxRateUsed: USD_TO_KRW, amountKrw: 3200000, daysOfMonth: [25], active: true, status: 'due' },
      { id: 'rec_rent', type: 'expense', labelKey: 'recurring.rent', amountOriginal: 900000, currency: 'KRW', fxRateUsed: USD_TO_KRW, amountKrw: 900000, daysOfMonth: [1], categoryId: 'home', active: true, status: 'due' },
      { id: 'rec_maintenance', type: 'expense', labelKey: 'recurring.maintenance', amountOriginal: 180000, currency: 'KRW', fxRateUsed: USD_TO_KRW, amountKrw: 180000, daysOfMonth: [5], categoryId: 'home', active: true, status: 'due' },
      { id: 'rec_netflix', type: 'expense', labelKey: 'recurring.netflix', amountOriginal: 17000, currency: 'KRW', fxRateUsed: USD_TO_KRW, amountKrw: 17000, daysOfMonth: [15], categoryId: 'other', active: true, status: 'due' },
      { id: 'rec_card_bill', type: 'expense', labelKey: 'recurring.card_bill', amountOriginal: 1400000, currency: 'KRW', fxRateUsed: USD_TO_KRW, amountKrw: 1400000, daysOfMonth: [12], active: true, status: 'done' },
      { id: 'rec_savings_transfer', type: 'transfer', labelKey: 'recurring.savings_transfer', amountOriginal: 500000, currency: 'KRW', fxRateUsed: USD_TO_KRW, amountKrw: 500000, daysOfMonth: [25], accountId: 'acc_hyeonsu_savings', active: true, status: 'skip' },
    ],

    // 빠른 입력 버튼 (sortOrder 순서대로 표시)
    quickActions: [
      { id: 'q_lunch', labelKey: 'quick.lunch', amountOriginal: 12000, currency: 'KRW', amountKrw: 12000, categoryId: 'food', isActive: true, sortOrder: 0 },
      { id: 'q_cafe', labelKey: 'quick.cafe', amountOriginal: 6000, currency: 'KRW', amountKrw: 6000, categoryId: 'cafe', isActive: true, sortOrder: 1 },
      { id: 'q_subway', labelKey: 'quick.subway', amountOriginal: 1500, currency: 'KRW', amountKrw: 1500, categoryId: 'transport', isActive: true, sortOrder: 2 },
      { id: 'q_coupang', labelKey: 'quick.coupang', amountOriginal: 25000, currency: 'KRW', amountKrw: 25000, categoryId: 'shopping', isActive: true, sortOrder: 3 },
      { id: 'q_tanner_snack', labelKey: 'quick.tanner_snack', amountOriginal: 10000, currency: 'KRW', amountKrw: 10000, categoryId: 'food', usedFor: 'tanner', isActive: true, sortOrder: 4 },
      { id: 'q_date_meal', labelKey: 'quick.date_meal', amountOriginal: 50000, currency: 'KRW', amountKrw: 50000, categoryId: 'date', isActive: true, sortOrder: 5 },
    ],
  }
}
