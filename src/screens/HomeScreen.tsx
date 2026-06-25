import { useEffect, useRef, useState } from 'react'
import CurrencyToggle from '../components/CurrencyToggle.tsx'
import { useScreenAnimations } from '../lib/useScreenAnimations.ts'
import { useWallet } from '../store/WalletProvider.tsx'
import {
  formatMoney,
  getActiveMonth,
  getBudgetRemaining,
  getBudgetTotal,
  getBudgetUsageRate,
  getLiquidAssets,
  getLockedAssets,
  getMonthlyExpenseTotal,
  getMonthlyOutlook,
  getPendingRecurring,
  getRecentExpenses,
} from '../domain/calculations.ts'
import {
  accountSubtitle,
  accountTitle,
  categoryLabel,
  colorClass,
  paymentSourceTitle,
  recurringTitle,
  tEnum,
} from '../i18n/labels.ts'
import type { Currency, ScreenId } from '../types'

interface Props {
  active: boolean
  cur: Currency
  setCur: (c: Currency) => void
  onGo: (id: ScreenId) => void
  onEdit: (id: string) => void
}

export default function HomeScreen({ active, cur, setCur, onGo, onEdit }: Props) {
  const ref = useRef<HTMLElement>(null)
  useScreenAnimations(ref, active)

  const { db, fxRate, lang } = useWallet()
  const month = getActiveMonth(db)

  const liquid = getLiquidAssets(db.accounts)
  const locked = getLockedAssets(db.accounts)
  const monthlyExpense = getMonthlyExpenseTotal(db.transactions, month)
  const budgetTotal = getBudgetTotal(db.budgets, month)
  const remaining = getBudgetRemaining(db.budgets, db.transactions, month)
  const usagePct = Math.round(getBudgetUsageRate(db.budgets, db.transactions, month) * 100)

  const spendableAccounts = db.accounts.filter((a) => a.tier === 'spendable')
  const recent = getRecentExpenses(db.transactions, 3)
  const psById = new Map(db.paymentSources.map((p) => [p.id, p]))
  const pending = getPendingRecurring(db, month).slice(0, 3)
  const outlook = getMonthlyOutlook(db, month)

  // 히어로 카운트업 (쓸 수 있는 돈, 화면 활성화 시 0 → 목표)
  const [heroDisplay, setHeroDisplay] = useState(liquid)
  useEffect(() => {
    if (!active) {
      setHeroDisplay(liquid)
      return
    }
    let raf = 0
    const dur = 900
    let t0: number | null = null
    const step = (ts: number) => {
      if (t0 === null) t0 = ts
      const p = Math.min((ts - t0) / dur, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setHeroDisplay(liquid * e)
      if (p < 1) raf = requestAnimationFrame(step)
      else setHeroDisplay(liquid)
    }
    const timer = setTimeout(() => {
      raf = requestAnimationFrame(step)
    }, 120)
    return () => {
      clearTimeout(timer)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [active, cur, liquid])

  return (
    <section ref={ref} className={'screen' + (active ? ' active' : '')} id="home">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
            <b style={{ fontSize: 19, fontWeight: 800 }}>우리지갑</b>
            <span style={{ fontSize: 12, color: 'var(--ink3)', fontWeight: 600 }}>우리 돈은 하나</span>
          </div>
          <CurrencyToggle cur={cur} setCur={setCur} variant="symbol" />
        </div>

        <div className="gl hero">
          <div className="label">쓸 수 있는 돈</div>
          <div className="big num">{formatMoney(heroDisplay, cur, fxRate)}</div>
          <div className="cap">묶인 돈 {formatMoney(locked, cur, fxRate)} · $1 = ₩{fxRate.toLocaleString('ko-KR')}</div>
        </div>

        <div className="gl pod" data-go="budget" onClick={() => onGo('budget')}>
          <div className="between" style={{ marginBottom: 13 }}>
            <div>
              <div className="label">이번 달 우리 지출</div>
              <div className="num" style={{ fontSize: 27, fontWeight: 800, marginTop: 3 }}>{formatMoney(monthlyExpense, cur, fxRate)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="label">남은 예산</div>
              <div className="num" style={{ fontSize: 17, fontWeight: 800, color: 'var(--aqua-d)', marginTop: 3 }}>{formatMoney(remaining, cur, fxRate)}</div>
            </div>
          </div>
          <div className="track"><div className={'fill' + (usagePct > 100 ? ' over' : '')} data-w={Math.min(100, usagePct)}></div></div>
          <div className="cap">예산 {formatMoney(budgetTotal, cur, fxRate)} 중 {usagePct}% 사용</div>
        </div>

        <div className="gl pod">
          <div className="label">이번 달 예상으로 남길 수 있는 돈</div>
          <div className="num" style={{ fontSize: 24, fontWeight: 800, marginTop: 3 }}>{formatMoney(outlook.maxSavings, cur, fxRate)}</div>
          <div className="between" style={{ marginTop: 12 }}>
            <div>
              <div className="label">아직 반영 안 된 수입</div>
              <div className="num" style={{ fontWeight: 800, color: 'var(--aqua-d)', marginTop: 3 }}>+{formatMoney(outlook.pendingIncome, cur, fxRate)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="label">아직 나갈 예정인 돈</div>
              <div className="num" style={{ fontWeight: 800, color: '#cf743d', marginTop: 3 }}>−{formatMoney(outlook.pendingExpense, cur, fxRate)}</div>
            </div>
          </div>
          {outlook.pendingSavingTransfer > 0 && <div className="cap">예정 저축 이체 {formatMoney(outlook.pendingSavingTransfer, cur, fxRate)}</div>}
        </div>

        <div>
          <div className="sect">우리 돈이 있는 곳</div>
          <div className="prows">
            {spendableAccounts.map((a) => (
              <div className="gl prow" key={a.id}>
                <span className={'dot ' + colorClass(a.holder)}></span>
                <div className="grow">
                  <div className="aname">{accountTitle(a, lang)}</div>
                  <div className="atype">{accountSubtitle(a, lang)}</div>
                </div>
                <div className="aval num">{formatMoney(a.balanceKrw, cur, fxRate)}</div>
              </div>
            ))}
            <div className="gl prow held" data-go="assets" onClick={() => onGo('assets')}>
              <span className="dot" style={{ background: '#aec8d0' }}></span>
              <div className="grow">
                <div className="aname">모으는·불리는 돈</div>
                <div className="atype">{lang === 'ko' ? '적금 · 투자' : 'Savings · Invest'}</div>
              </div>
              <div className="aval num">{formatMoney(locked, cur, fxRate)}</div>
            </div>
          </div>
        </div>

        <div>
          <div className="between" style={{ padding: '0 6px', marginBottom: 9 }}>
            <div className="sect" style={{ margin: 0, padding: 0 }}>오늘 예정</div>
            <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={() => onGo('schedule')}>일정 보기</span>
          </div>
          <div className="hscroll">
            {pending.length === 0 && <div className="cap">이번 달 예정 항목을 모두 반영했어요</div>}
            {pending.map((r) => {
              const sign = r.type === 'income' ? '+' : r.type === 'transfer' ? '→' : '−'
              return (
                <div className="gl due" key={r.id} onClick={() => onGo('schedule')}>
                  <div className="wh">{lang === 'ko' ? `매월 ${r.daysOfMonth.join('·')}일` : `Monthly ${r.daysOfMonth.join(', ')}`}</div>
                  <div className="nm">{recurringTitle(r, lang)}</div>
                  <div className={'m num ' + (r.type === 'income' ? 'm-in' : 'm-out')}>{sign}{formatMoney(r.amountKrw, cur, fxRate)}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <div className="between" style={{ padding: '0 6px', marginBottom: 9 }}>
            <div className="sect" style={{ margin: 0, padding: 0 }}>최근 우리 지출</div>
            <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={() => onGo('transactions')}>전체 보기</span>
          </div>
          <div className="prows">
            {recent.length === 0 && <div className="cap">아직 기록이 없어요</div>}
            {recent.map((t) => {
              const ps = psById.get(t.paymentSourceId)
              const cls = colorClass(t.usedFor)
              return (
                <div className="gl prow" key={t.id} onClick={() => onEdit(t.id)}>
                  <div className="grow">
                    <div className="aname">{t.memo || categoryLabel(t.categoryId, db.categories, lang)}</div>
                    <div className="atype">{categoryLabel(t.categoryId, db.categories, lang)}{ps ? ' · ' + paymentSourceTitle(ps, lang) : ''}</div>
                  </div>
                  <div className="r">
                    <div className="m num">{formatMoney(t.amountKrw, cur, fxRate)}</div>
                    <span className={'who ' + cls}><i></i>{tEnum('usedFor', t.usedFor, lang)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
