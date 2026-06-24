import type { Currency } from '../types'

interface Props {
  cur: Currency
  setCur: (c: Currency) => void
  variant?: 'symbol' | 'text'
}

// 통화 토글 (₩/$ 또는 KRW/USD). 전역 표시 통화를 바꾼다.
export default function CurrencyToggle({ cur, setCur, variant = 'symbol' }: Props) {
  const labels = variant === 'text' ? { KRW: 'KRW', USD: 'USD' } : { KRW: '₩', USD: '$' }
  return (
    <div className="seg" onClick={(e) => e.stopPropagation()}>
      <button className={cur === 'KRW' ? 'on' : ''} onClick={() => setCur('KRW')}>
        {labels.KRW}
      </button>
      <button className={cur === 'USD' ? 'on' : ''} onClick={() => setCur('USD')}>
        {labels.USD}
      </button>
    </div>
  )
}
