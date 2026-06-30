import { useState } from 'react'
import { useWallet } from '../store/WalletProvider.tsx'
import { getActiveMonth, getTransactionsForMonth } from '../domain/calculations.ts'
import { tUi } from '../i18n/labels.ts'
import TransactionList from '../components/TransactionList.tsx'
import type { ScreenId } from '../types'

interface Props {
  active: boolean
  onGo: (id: ScreenId) => void
  onEdit: (id: string) => void
}

type Filter = 'all' | 'expense' | 'income'

export default function TransactionsScreen({ active, onGo, onEdit }: Props) {
  const { db, lang } = useWallet()
  const [filter, setFilter] = useState<Filter>('all')

  const month = getActiveMonth(db)

  let rows = getTransactionsForMonth(db.transactions, month)
    .slice()
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt))
  if (filter !== 'all') rows = rows.filter((t) => t.type === filter)

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
          <TransactionList rows={rows} onEdit={onEdit} />
        </div>
      </div>
    </section>
  )
}
