import { useWallet } from '../store/WalletProvider.tsx'
import { showToast } from '../lib/feedback.ts'
import { formatMoney, getActiveMonth, getRecurringStatus } from '../domain/calculations.ts'
import { recurringDaysLabel, recurringStatusLabel, tItemLabel } from '../i18n/labels.ts'
import type { RecurringItem } from '../domain/types'

export default function ScheduleScreen({ active }: { active: boolean }) {
  const { db, displayCurrency, fxRate, lang, applyRecurringItem } = useWallet()
  const month = getActiveMonth(db)

  const incomes = db.recurringItems.filter((r) => r.direction === 'income')
  const expenses = db.recurringItems.filter((r) => r.direction === 'expense')

  function apply(id: string) {
    const res = applyRecurringItem(id)
    if (res === 'applied') showToast(lang === 'en' ? 'Applied' : '반영됐어요')
    else if (res === 'already') showToast(lang === 'en' ? 'Already applied' : '이미 반영됐어요')
    else showToast(lang === 'en' ? "Couldn't apply" : '반영에 실패했어요')
  }

  const row = (r: RecurringItem) => {
    const sign = r.direction === 'income' ? '+' : '−'
    const status = getRecurringStatus(r, db.transactions, month)
    return (
      <div className="gl prow" key={r.id}>
        <div className="grow">
          <div className="aname">{tItemLabel(r, lang)}</div>
          <div className="atype">{recurringDaysLabel(r.daysOfMonth, lang)}</div>
        </div>
        <div className="r">
          <div className="m num" style={r.direction === 'income' ? { color: 'var(--aqua-d)' } : undefined}>{sign}{formatMoney(r.amountKrw, displayCurrency, fxRate)}</div>
          {status === 'due' ? (
            <button className="edit" style={{ border: 0 }} onClick={() => apply(r.id)}>반영</button>
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
        <div className="head">우리 수입과 고정지출</div>

        <div>
          <div className="sect">들어오는 우리 수입</div>
          <div className="prows">{incomes.length ? incomes.map(row) : <div className="cap">등록된 수입이 없어요</div>}</div>
        </div>

        <div>
          <div className="sect">나가는 돈</div>
          <div className="prows">{expenses.length ? expenses.map(row) : <div className="cap">등록된 고정지출이 없어요</div>}</div>
        </div>
      </div>
    </section>
  )
}
