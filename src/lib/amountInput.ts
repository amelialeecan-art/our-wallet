// 금액 입력(키패드) 공용 로직. KRW=정수, USD=소수 2자리 허용.
import type { Currency } from '../types'

export function parseAmount(raw: string): number {
  if (!raw) return 0
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : 0
}

// 입력 중 표시: 정수부에 천단위 콤마, 소수부/마지막 '.'은 보존
export function formatAmountDisplay(raw: string, currency: Currency): string {
  if (raw === '' || raw === '.') return '0'
  const [intPart, decPart] = raw.split('.')
  const intStr = (parseInt(intPart || '0', 10) || 0).toLocaleString(currency === 'KRW' ? 'ko-KR' : 'en-US')
  return decPart !== undefined ? `${intStr}.${decPart}` : intStr
}

// 키 입력 → 새 raw 문자열
export function pressAmountKey(prev: string, key: string, currency: Currency): string {
  if (key === 'del') return prev.slice(0, -1)
  if (key === '.') {
    if (currency === 'USD' && !prev.includes('.')) return prev === '' ? '0.' : prev + '.'
    return prev
  }
  if (key === '00') {
    if (prev === '' || prev.includes('.')) return prev
    return cap(prev + '00')
  }
  // 숫자
  let next = prev + key
  if (currency === 'USD' && next.includes('.')) {
    const dec = next.split('.')[1]
    if (dec.length > 2) return prev // 소수 2자리 제한
  }
  if (!next.includes('.')) next = next.replace(/^0+(?=\d)/, '')
  return cap(next)
}

function cap(s: string): string {
  return s.replace('.', '').length > 9 ? s.slice(0, -1) : s
}

// 통화 전환 시 입력값 환산 (고정환율). KRW1500 ↔ USD1
export function convertRaw(raw: string, from: Currency, to: Currency, fxRate: number): string {
  if (from === to) return raw
  const n = parseAmount(raw)
  if (!n) return ''
  if (to === 'USD') {
    const usd = Math.round((n / fxRate) * 100) / 100
    return usd ? String(usd) : ''
  }
  const krw = Math.round(n * fxRate)
  return krw ? String(krw) : ''
}
