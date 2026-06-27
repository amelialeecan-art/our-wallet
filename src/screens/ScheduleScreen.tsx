import { useWallet } from '../store/WalletProvider.tsx'
import { showToast } from '../lib/feedback.ts'
import { formatMoney, getActiveMonth, getRecurringStatus } from '../domain/calculations.ts'
import { recurringDaysLabel, recurringStatusLabel, recurringTitle, tUi } from '../i18n/labels.ts'
import type { RecurringItem } from '../domain/types'
import type { ScreenId } from '../types'

interface Props {
  active: boolean
  onGo: (id: ScreenId) => void
}

export default function ScheduleScreen({ active, onGo }: Props) {
  const { db, displayCurrency, fxRate, lang, applyRecurringItem } = useWallet()
  const month = getActiveMonth(db)

  // 기본은 active 항목만 표시
  const items = db.recurringItems.filter((r) => r.active !== false)
  const incomes = items.filter((r) => r.type === 'income')
  const expenses = items.filter((r) => r.type === 'expense')
  const transfers = items.filter((r) => r.type === 'transfer')

  function apply(id: string) {
    const res = applyRecurringItem(id)
    if (res === 'applied') showToast(tUi('toast.applied', lang))
    else if (res === 'already') showToast(tUi('toast.alreadyApplied', lang))
    else showToast(tUi('toast.applyFailed', lang))
  }

  const row = (r: RecurringItem) => {
    const sign = r.type === 'income' ? '+' : r.type === 'transfer' ? '→' : '−'
    const status = getRecurringStatus(r, db.transactions, month)
    return (
      <div className="gl prow" key={r.id}>
        <div className="grow">
          <div className="aname">{recurringTitle(r, lang)}</div>
          <div className="atype">{recurringDaysLabel(r.daysOfMonth, lang)}</div>
        </div>
        <div className="r">
          <div className="m num" style={r.type === 'income' ? { color: 'var(--aqua-d)' } : undefined}>{sign}{formatMoney(r.amountKrw, displayCurrency, fxRate)}</div>
          {status === 'due' ? (
            <button className="edit" style={{ border: 0 }} onClick={() => apply(r.id)}>{tUi('schedule.apply', lang)}</button>
          ) : (
            <span className={'st ' + status}>{recurringStatusLabel(status, lang)}</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <section className={'screen' + (active ? ' active' : '')} id="schedule">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>{tUi('schedule.title', lang)}</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={() => onGo('recurringSettings')}>{tUi('common.manage', lang)}</span>
        </div>

        <div>
          <div className="sect">{tUi('schedule.income', lang)}</div>
          <div className="prows">{incomes.length ? incomes.map(row) : <div className="cap">{tUi('schedule.noIncome', lang)}</div>}</div>
        </div>

        <div>
          <div className="sect">{tUi('schedule.outgoing', lang)}</div>
          <div className="prows">{expenses.length ? expenses.map(row) : <div className="cap">{tUi('schedule.noExpense', lang)}</div>}</div>
        </div>

        {transfers.length > 0 && (
          <div>
            <div className="sect">{tUi('schedule.savings', lang)}</div>
            <div className="prows">{transfers.map(row)}</div>
          </div>
        )}
      </div>
    </section>
  )
}
