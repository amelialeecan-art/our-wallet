// ===== 돈 계산 핵심 모듈 =====
// 철학: 모든 금액은 "원본 통화 + 원화 환산"을 동시에 보존한다.
// 환율은 고정. 1 USD = 1,500 KRW.

export const USD_TO_KRW = 1500

// 원본 통화·금액으로부터 표준 Money 객체를 만든다.
// 항상 krw(원화 환산)를 함께 들고 다녀 데이터 누락을 막는다.
export function makeMoney(amount, currency = 'KRW') {
  const a = Number(amount) || 0
  const krw = currency === 'USD' ? a * USD_TO_KRW : a
  return { amount: a, currency, krw }
}

// 원화 값(krw)을 원하는 표시 통화로 환산한 숫자를 돌려준다.
export function toCurrency(krw, currency) {
  return currency === 'USD' ? krw / USD_TO_KRW : krw
}

export function formatKRW(krw) {
  return '₩' + Math.round(krw).toLocaleString('ko-KR')
}

export function formatUSD(krw) {
  return '$' + Math.round(krw / USD_TO_KRW).toLocaleString('en-US')
}

// 원화 환산값(krw)을 받아 표시 통화에 맞게 포맷한다.
export function formatMoney(krw, currency) {
  return currency === 'USD' ? formatUSD(krw) : formatKRW(krw)
}
