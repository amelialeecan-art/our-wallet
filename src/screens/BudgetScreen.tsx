import { useRef, useState } from 'react'
import CurrencyToggle from '../components/CurrencyToggle.tsx'
import { triggerSaved } from '../lib/feedback.ts'
import { useScreenAnimations } from '../lib/useScreenAnimations.ts'
import { parseAmount, sanitizeAmountInput } from '../lib/amountInput.ts'
import { useWallet } from '../store/WalletProvider.tsx'
import {
  formatMoney,
  getActiveMonth,
  getBudgetUsageRate,
  getBudgetUsedByCategory,
  getMonthlyExpenseTotal,
} from '../domain/calculations.ts'
import { categoryLabel, tUi } from '../i18n/labels.ts'

const inputStyle: React.CSSProperties = {
  font: 'inherit',
  border: 0,
  borderRadius: 12,
  padding: '10px 12px',
  background: 'rgba(255,255,255,.45)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.35)',
  color: 'var(--ink)',
  width: '55%',
  textAlign: 'right',
}

export default function BudgetScreen({ active }: { active: boolean }) {
  const ref = useRef<HTMLElement>(null)
  useScreenAnimations(ref, active)

  const { db, displayCurrency, fxRate, lang, setDisplayCurrency, setMonthlyBudget } = useWallet()
  const month = getActiveMonth(db)

  const total = db.settings.monthlyBudgetKrw ?? 0
  const used = getMonthlyExpenseTotal(db.transactions, month)
  const usagePct = Math.round(getBudgetUsageRate(total, db.transactions, month) * 100)
  const byCat = getBudgetUsedByCategory(db.transactions, db.categories, month)
    .slice()
    .sort((a, b) => b.rate - a.rate)

  const [raw, setRaw] = useState('')

  function saveBudget() {
    const n = parseAmount(raw)
    const krw = displayCurrency === 'USD' ? Math.round(n * fxRate) : Math.round(n)
    setMonthlyBudget(krw)
    setRaw('')
    triggerSaved(tUi('budget.saved', lang))
  }

  return (
    <section ref={ref} className={'screen' + (active ? ' active' : '')} id="budget">
      <div className="stack">
        <div className="head">{tUi('budget.title', lang)}</div>

        {/* 총 예산 설정 (직관적 입력, 달러/원 전환 가능) */}
        <div className="gl pod">
          <div className="between" style={{ marginBottom: 8 }}>
            <span className="label">{tUi('budget.total', lang)}</span>
            <CurrencyToggle cur={displayCurrency} setCur={setDisplayCurrency} variant="text" />
          </div>
          <div className="frow" style={{ paddingTop: 0 }}>
            <span className="fv muted">{tUi('budget.current', lang)} · {total > 0 ? formatMoney(total, displayCurrency, fxRate) : tUi('budget.none', lang)}</span>
            <input
              type="text"
              inputMode="decimal"
              value={raw}
              placeholder={displayCurrency === 'USD' ? '$0' : '₩0'}
              onChange={(e) => setRaw(sanitizeAmountInput(e.target.value, displayCurrency))}
              style={inputStyle}
            />
          </div>
          <button className="btn block" style={{ padding: 13, marginTop: 4 }} onClick={saveBudget}><span>{tUi('budget.set', lang)}</span></button>
        </div>

        <div className="gl hero ctr">
          <div className="label">{tUi('budget.usageRate', lang)}</div>
          <div className="pct num">{usagePct}%</div>
          <div className="cap">{formatMoney(used, displayCurrency, fxRate)} / {formatMoney(total, displayCurrency, fxRate)}</div>
        </div>

        <div className="gl pod">
          <div className="sect" style={{ padding: 0, marginBottom: 6 }}>{tUi('budget.byCategory', lang)}</div>
          {byCat.length === 0 && <div className="cap">{tUi('budget.catOptional', lang)}</div>}
          {byCat.map((c) => {
            const pct = Math.round(c.rate * 100)
            const over = pct > 100
            return (
              <div className="fillrow" key={c.categoryId}>
                <div className="fillhead">
                  <span>{categoryLabel(c.categoryId, db.categories, lang)} {over && <span className="tagover">{tUi('budget.over', lang)}</span>}</span>
                  <span className="pct">{pct}%</span>
                </div>
                <div className="track"><div className={'fill' + (over ? ' over' : '')} data-w={Math.min(100, pct)}></div></div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
