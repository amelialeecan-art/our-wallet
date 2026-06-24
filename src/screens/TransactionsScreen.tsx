import { useState } from 'react'
import { useWallet } from '../store/WalletProvider.tsx'
import {
  formatMoney,
  getActiveMonth,
  getTransactionsForMonth,
} from '../domain/calculations.ts'
import { colorClass, paymentSourceTitle, tEnum } from '../i18n/labels.ts'
import type { ScreenId } from '../types'
import type { Transaction, TransactionType } from '../domain/types'

interface Props {
  active: boolean
  onGo: (id: ScreenId) => void
  onEdit: (id: string) => void
}

type Filter = 'all' | 'expense' | 'income'

export default function TransactionsScreen({ active, onGo, onEdit }: Props) {
  const { db, displayCurrency, fxRate, lang } = useWallet()
  const [filter, setFilter] = useState<Filter>('all')

  const month = getActiveMonth(db)
  const psById = new Map(db.paymentSources.map((p) => [p.id, p]))

  let rows = getTransactionsForMonth(db.transactions, month)
    .slice()
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt))
  if (filter !== 'all') rows = rows.filter((t) => t.type === filter)

  const typeSign = (type: TransactionType) => (type === 'income' ? '+' : type === 'expense' ? '−' : '')

  const row = (t: Transaction) => {
    const ps = psById.get(t.paymentSourceId)
    const cls = colorClass(t.usedFor)
    const cat = tEnum('category', t.categoryId, lang)
    // 반복항목으로 생성된 거래는 출처 라벨을 함께 보여준다.
    const recurringTag =
      t.sourceKind === 'recurring'
        ? t.type === 'income'
          ? '반복수입'
          : t.type === 'transfer'
            ? '저축 이체'
            : '고정지출'
        : null
    const sub = [
      recurringTag ?? cat,
      ps ? paymentSourceTitle(ps, lang) : null,
      tEnum('recordedBy', t.recordedBy, lang),
      t.date.slice(5),
    ]
      .filter(Boolean)
      .join(' · ')
    // 원본 통화 표시 (USD 등 KRW가 아닐 때만 작게)
    const origSmall = t.currency !== 'KRW'
      ? `${t.currency === 'USD' ? '$' + t.amountOriginal.toLocaleString('en-US') : t.amountOriginal} · ₩${t.amountKrw.toLocaleString('ko-KR')}`
      : null
    return (
      <div className="gl prow" key={t.id} onClick={() => onEdit(t.id)}>
        <div className="grow">
          <div className="aname">{t.memo || cat}</div>
          <div className="atype">{sub}</div>
        </div>
        <div className="r">
          <div className="m num">{typeSign(t.type)}{formatMoney(t.amountKrw, displayCurrency, fxRate)}</div>
          {origSmall ? <div className="atype" style={{ textAlign: 'right' }}>{origSmall}</div> : <span className={'who ' + cls}><i></i>{tEnum('usedFor', t.usedFor, lang)}</span>}
        </div>
      </div>
    )
  }

  return (
    <section className={'screen' + (active ? ' active' : '')} id="transactions">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>거래 내역</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={() => onGo('home')}>닫기</span>
        </div>

        <div className="seg" style={{ alignSelf: 'flex-start' }}>
          <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>전체</button>
          <button className={filter === 'expense' ? 'on' : ''} onClick={() => setFilter('expense')}>지출</button>
          <button className={filter === 'income' ? 'on' : ''} onClick={() => setFilter('income')}>수입</button>
        </div>

        <div className="prows">
          {rows.length === 0 ? <div className="cap">아직 기록이 없어요</div> : rows.map(row)}
        </div>
      </div>
    </section>
  )
}
