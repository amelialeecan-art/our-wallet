import { useState } from 'react'
import { useWallet } from '../store/WalletProvider.tsx'
import {
  formatMoney,
  getActiveMonth,
  getTransactionsForMonth,
} from '../domain/calculations.ts'
import { categoryLabel, colorClass, formatDateLabel, paymentSourceTitle, tEnum, tUi } from '../i18n/labels.ts'
import type { ScreenId } from '../types'
import type { Transaction } from '../domain/types'

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

  const typeSign = (t: Transaction) => {
    if (t.type === 'income') return '+'
    if (t.type === 'expense') return '−'
    if (t.type === 'adjustment') return t.toAccountId ? '+' : '−'
    return '' // transfer
  }

  const row = (t: Transaction) => {
    const ps = psById.get(t.paymentSourceId)
    const cls = colorClass(t.usedFor)
    const cat = categoryLabel(t.categoryId, db.categories, lang)
    // 거래 종류/출처 라벨
    let leadLabel: string
    if (t.sourceKind === 'recurring') {
      leadLabel = t.type === 'income' ? tUi('tx.recurringIncome', lang) : t.type === 'transfer' ? tUi('tx.savingsTransfer', lang) : tUi('tx.fixedExpense', lang)
    } else if (t.type === 'adjustment') {
      leadLabel = tUi('tx.adjustment', lang)
    } else if (t.type === 'income') {
      leadLabel = tUi('tx.income', lang)
    } else if (t.type === 'transfer') {
      leadLabel = tUi('tx.transfer', lang)
    } else {
      leadLabel = cat
    }
    const sub = [
      leadLabel,
      t.type === 'expense' && ps ? paymentSourceTitle(ps, lang) : null,
      tEnum('recordedBy', t.recordedBy, lang),
      formatDateLabel(t.date, lang),
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
          <div className="aname">{t.memo || leadLabel}</div>
          <div className="atype">{sub}</div>
        </div>
        <div className="r">
          <div className="m num">{typeSign(t)}{formatMoney(t.amountKrw, displayCurrency, fxRate)}</div>
          {origSmall ? <div className="atype" style={{ textAlign: 'right' }}>{origSmall}</div> : <span className={'who ' + cls}><i></i>{tEnum('usedFor', t.usedFor, lang)}</span>}
        </div>
      </div>
    )
  }

  return (
    <section className={'screen' + (active ? ' active' : '')} id="transactions">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>{tUi('tx.title', lang)}</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={() => onGo('home')}>{tUi('common.close', lang)}</span>
        </div>

        <div className="seg" style={{ alignSelf: 'flex-start' }}>
          <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>{tUi('tx.filterAll', lang)}</button>
          <button className={filter === 'expense' ? 'on' : ''} onClick={() => setFilter('expense')}>{tUi('tx.filterExpense', lang)}</button>
          <button className={filter === 'income' ? 'on' : ''} onClick={() => setFilter('income')}>{tUi('tx.filterIncome', lang)}</button>
        </div>

        <div className="prows">
          {rows.length === 0 ? <div className="cap">{tUi('tx.empty', lang)}</div> : rows.map(row)}
        </div>
      </div>
    </section>
  )
}
