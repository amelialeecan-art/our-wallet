import { useWallet } from '../store/WalletProvider.tsx'
import { formatMoney } from '../domain/calculations.ts'
import { accountTitle, categoryLabel, paymentSourceTitle, recurringDaysLabel, recurringTitle } from '../i18n/labels.ts'
import type { RecurringItem } from '../domain/types'
import type { ScreenId } from '../types'

interface Props {
  active: boolean
  onGo: (id: ScreenId) => void
  onEdit: (id: string | null) => void
}

export default function RecurringSettingsScreen({ active, onGo, onEdit }: Props) {
  const { db, displayCurrency, fxRate, lang } = useWallet()
  const psById = new Map(db.paymentSources.map((p) => [p.id, p]))
  const accById = new Map(db.accounts.map((a) => [a.id, a]))

  const incomes = db.recurringItems.filter((r) => r.type === 'income')
  const expenses = db.recurringItems.filter((r) => r.type === 'expense')
  const transfers = db.recurringItems.filter((r) => r.type === 'transfer')

  const row = (r: RecurringItem) => {
    const sign = r.type === 'income' ? '+' : r.type === 'transfer' ? '→' : '−'
    const ps = r.paymentSourceId ? psById.get(r.paymentSourceId) : undefined
    const acc = r.accountId ? accById.get(r.accountId) : undefined
    const sub = [
      recurringDaysLabel(r.daysOfMonth, lang),
      r.categoryId ? categoryLabel(r.categoryId, db.categories, lang) : null,
      ps ? paymentSourceTitle(ps, lang) : null,
      acc ? accountTitle(acc, lang) : null,
    ]
      .filter(Boolean)
      .join(' · ')
    return (
      <div className="gl prow" key={r.id} onClick={() => onEdit(r.id)}>
        <div className="grow">
          <div className="aname">{recurringTitle(r, lang)}{r.active === false && <span className="muted"> · 숨김</span>}</div>
          <div className="atype">{sub}</div>
        </div>
        <div className="r">
          <div className="m num" style={r.type === 'income' ? { color: 'var(--aqua-d)' } : undefined}>{sign}{formatMoney(r.amountKrw, displayCurrency, fxRate)}</div>
        </div>
      </div>
    )
  }

  return (
    <section className={'screen' + (active ? ' active' : '')} id="recurringSettings">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>반복 수입·고정지출</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={() => onGo('settings')}>닫기</span>
        </div>
        <div className="cap" style={{ padding: '0 6px' }}>예정표예요. 실제 거래는 일정 화면에서 ‘반영’할 때 생겨요</div>

        <div>
          <div className="sect">우리 수입</div>
          <div className="prows">{incomes.length ? incomes.map(row) : <div className="cap">없어요</div>}</div>
        </div>
        <div>
          <div className="sect">나가는 돈</div>
          <div className="prows">{expenses.length ? expenses.map(row) : <div className="cap">없어요</div>}</div>
        </div>
        <div>
          <div className="sect">저축 · 이체</div>
          <div className="prows">{transfers.length ? transfers.map(row) : <div className="cap">없어요</div>}</div>
        </div>

        <button className="btn block" style={{ padding: 15 }} onClick={() => onEdit(null)}><span>＋ 반복 항목 추가</span></button>
      </div>
    </section>
  )
}
