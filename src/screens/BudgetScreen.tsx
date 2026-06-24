import { useRef } from 'react'
import { useScreenAnimations } from '../lib/useScreenAnimations.ts'
import { useWallet } from '../store/WalletProvider.tsx'
import {
  formatMoney,
  getActiveMonth,
  getBudgetTotal,
  getBudgetUsageRate,
  getBudgetUsedByCategory,
  getMonthlyExpenseTotal,
} from '../domain/calculations.ts'
import { tEnum } from '../i18n/labels.ts'

export default function BudgetScreen({ active }: { active: boolean }) {
  const ref = useRef<HTMLElement>(null)
  useScreenAnimations(ref, active)

  const { db, displayCurrency, fxRate, lang } = useWallet()
  const month = getActiveMonth(db)

  const total = getBudgetTotal(db.budgets, month)
  const used = getMonthlyExpenseTotal(db.transactions, month)
  const usagePct = Math.round(getBudgetUsageRate(db.budgets, db.transactions, month) * 100)
  const byCat = getBudgetUsedByCategory(db.transactions, db.budgets, month)
    .slice()
    .sort((a, b) => b.rate - a.rate)

  return (
    <section ref={ref} className={'screen' + (active ? ' active' : '')} id="budget">
      <div className="stack">
        <div className="head">이번 달 예산</div>

        <div className="gl hero ctr">
          <div className="label">사용률</div>
          <div className="pct num">{usagePct}%</div>
          <div className="cap">{formatMoney(used, displayCurrency, fxRate)} / {formatMoney(total, displayCurrency, fxRate)}</div>
        </div>

        <div className="gl pod">
          <div className="sect" style={{ padding: 0, marginBottom: 6 }}>카테고리별 사용률</div>
          {byCat.length === 0 && <div className="cap">설정된 카테고리 예산이 없어요</div>}
          {byCat.map((c) => {
            const pct = Math.round(c.rate * 100)
            const over = pct > 100
            return (
              <div className="fillrow" key={c.categoryId}>
                <div className="fillhead">
                  <span>{tEnum('category', c.categoryId, lang)} {over && <span className="tagover">초과</span>}</span>
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
