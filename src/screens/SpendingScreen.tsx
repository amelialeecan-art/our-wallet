import { useEffect, useRef, useState } from 'react'
import { useWallet } from '../store/WalletProvider.tsx'
import {
  formatMoney,
  getSpendingByAccount,
  getSpendingByCategory,
  getSpendingByCurrency,
  getSpendingByPaymentSource,
  getSpendingByUsedFor,
  getTransactionsForMonth,
} from '../domain/calculations.ts'
import TransactionList from '../components/TransactionList.tsx'
import {
  accountTitle,
  categoryLabel,
  colorClass,
  paymentSourceTitle,
  tEnum,
  tUi,
} from '../i18n/labels.ts'
import type { Breakdown } from '../domain/calculations.ts'
import type { Currency } from '../types'
import type { Lang } from '../domain/types'

type TabKey = 'records' | 'who' | 'cat' | 'pay' | 'acc' | 'cur'

const TABS: TabKey[] = ['records', 'who', 'cat', 'pay', 'acc', 'cur']

// 현재 달력 월 'YYYY-MM'
function currentMonthStr(): string {
  return new Date().toISOString().slice(0, 7)
}

// 'YYYY-MM'을 delta개월 이동
function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const EN_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// 표시 라벨: ko '2026년 7월' / en 'July 2026'
function monthLabel(month: string, lang: Lang): string {
  const [y, m] = month.split('-').map(Number)
  if (lang === 'ko') return `${y}년 ${m}월`
  return `${EN_MONTH_NAMES[m - 1] ?? ''} ${y}`
}

export default function SpendingScreen({ active, onEdit }: { active: boolean; onEdit: (id: string) => void }) {
  const ref = useRef<HTMLElement>(null)
  const [tab, setTab] = useState<TabKey>('records')
  // 화면에서 보고 있는 월 (기본: 현재 달력 월). 저장/동기화와 무관한 화면 전용 state.
  const [month, setMonth] = useState<string>(() => currentMonthStr())

  const { db, lang, displayCurrency, fxRate } = useWallet()
  const thisMonth = currentMonthStr()

  // 거래내역 탭: 이번 달 전체 거래, 최신순
  const records = getTransactionsForMonth(db.transactions, month)
    .slice()
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt))

  const byUsedFor = getSpendingByUsedFor(db.transactions, month)
  const byCategory = getSpendingByCategory(db.transactions, month)
  const byPay = getSpendingByPaymentSource(db.transactions, db.paymentSources, month)
  const byAccount = getSpendingByAccount(db.transactions, db.paymentSources, db.accounts, month)
  const byCurrency = getSpendingByCurrency(db.transactions, month)

  const psById = new Map(db.paymentSources.map((p) => [p.id, p]))
  const accById = new Map(db.accounts.map((a) => [a.id, a]))

  // 사용대상 비율/금액 (없으면 0 → NaN 방어)
  const pctOf = (key: string) => byUsedFor.find((b) => b.key === key)?.pct ?? 0
  const krwOf = (key: string) => byUsedFor.find((b) => b.key === key)?.krw ?? 0
  const sharedPct = pctOf('shared')
  const hyeonsuPct = pctOf('hyeonsu')
  const tannerPct = pctOf('tanner')
  // 액체 기둥은 누적 높이로 쌓는다 (디자인과 동일)
  const hUs = Math.round(sharedPct)
  const hHy = Math.round(sharedPct + hyeonsuPct)
  const hTa = Math.round(sharedPct + hyeonsuPct + tannerPct)

  // 화면 활성화 또는 탭 전환 시 켜진 패널의 막대/액체를 다시 채운다.
  useEffect(() => {
    if (!active || !ref.current) return
    const panel = ref.current.querySelector('.panel.on')
    if (!panel) return
    const t = setTimeout(() => {
      panel.querySelectorAll<HTMLElement>('.fill[data-w]').forEach((f) => {
        f.style.width = '0%'
        requestAnimationFrame(() => setTimeout(() => (f.style.width = f.dataset.w + '%'), 40))
      })
      panel.querySelectorAll<HTMLElement>('.lq[data-h]').forEach((l) => {
        l.style.height = '0%'
        requestAnimationFrame(() => setTimeout(() => (l.style.height = l.dataset.h + '%'), 40))
      })
    }, 60)
    return () => clearTimeout(t)
  }, [active, tab, db, month])

  return (
    <section ref={ref} className={'screen' + (active ? ' active' : '')} id="spending">
      <div className="stack">
        <div className="head">{tUi('spending.title', lang)}</div>

        {/* 월 네비게이션: 선택한 월 기준으로 아래 모든 탭이 필터링된다 */}
        <div className="between" style={{ padding: '2px 4px', alignItems: 'center' }}>
          <button className="chip" style={{ minWidth: 40 }} onClick={() => setMonth((m) => shiftMonth(m, -1))} aria-label="previous month">‹</button>
          <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{monthLabel(month, lang)}</div>
            {month !== thisMonth && (
              <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer', fontSize: 12 }} onClick={() => setMonth(thisMonth)}>{tUi('spending.thisMonth', lang)}</span>
            )}
          </div>
          <button className="chip" style={{ minWidth: 40 }} onClick={() => setMonth((m) => shiftMonth(m, 1))} aria-label="next month">›</button>
        </div>

        <div className="tabs" id="spendTabs">
          {TABS.map((t) => (
            <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{tUi('spending.tab.' + t, lang)}</button>
          ))}
        </div>

        <div className={'panel' + (tab === 'records' ? ' on' : '')}>
          <div className="prows">
            <TransactionList rows={records} onEdit={onEdit} emptyText={tUi('spending.noRecordsMonth', lang)} />
          </div>
        </div>

        <div className={'panel' + (tab === 'who' ? ' on' : '')}>
          <div className="gl pod">
            <div className="sect" style={{ padding: 0, marginBottom: 14 }}>{tUi('spending.whoTitle', lang)}</div>
            <div className="liquid-wrap">
              <div className="liquid">
                <div className="lq ta" data-h={hTa}></div>
                <div className="lq hy" data-h={hHy}></div>
                <div className="lq us" data-h={hUs}></div>
              </div>
              <div className="legend">
                <div className="lg"><span className="k" style={{ background: 'var(--us)' }}></span>{tEnum('usedFor', 'shared', lang)}<span className="p num">{formatMoney(krwOf('shared'), displayCurrency, fxRate)} · {Math.round(sharedPct)}%</span></div>
                <div className="lg"><span className="k" style={{ background: 'var(--hyun)' }}></span>{tEnum('usedFor', 'hyeonsu', lang)}<span className="p num">{formatMoney(krwOf('hyeonsu'), displayCurrency, fxRate)} · {Math.round(hyeonsuPct)}%</span></div>
                <div className="lg"><span className="k" style={{ background: 'var(--tan)' }}></span>{tEnum('usedFor', 'tanner', lang)}<span className="p num">{formatMoney(krwOf('tanner'), displayCurrency, fxRate)} · {Math.round(tannerPct)}%</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className={'panel' + (tab === 'cat' ? ' on' : '')}>
          <div className="gl pod">
            <div className="sect" style={{ padding: 0, marginBottom: 6 }}>{tUi('spending.catTitle', lang)}</div>
            <BreakdownList
              lang={lang}
              cur={displayCurrency}
              fx={fxRate}
              rows={byCategory}
              labelOf={(b) => categoryLabel(b.key, db.categories, lang)}
            />
          </div>
        </div>

        <div className={'panel' + (tab === 'pay' ? ' on' : '')}>
          <div className="gl pod">
            <div className="sect" style={{ padding: 0, marginBottom: 6 }}>{tUi('spending.payTitle', lang)}</div>
            <BreakdownList
              lang={lang}
              cur={displayCurrency}
              fx={fxRate}
              rows={byPay}
              labelOf={(b) => { const ps = psById.get(b.key); return ps ? paymentSourceTitle(ps, lang) : b.key }}
              colorOf={(b) => { const ps = psById.get(b.key); return ps ? colorClass(ps.holder) : undefined }}
            />
          </div>
        </div>

        <div className={'panel' + (tab === 'acc' ? ' on' : '')}>
          <div className="gl pod">
            <div className="sect" style={{ padding: 0, marginBottom: 6 }}>{tUi('spending.accTitle', lang)}</div>
            <BreakdownList
              lang={lang}
              cur={displayCurrency}
              fx={fxRate}
              rows={byAccount}
              labelOf={(b) => { const a = accById.get(b.key); return a ? accountTitle(a, lang) : b.key }}
              colorOf={(b) => { const a = accById.get(b.key); return a ? colorClass(a.holder) : undefined }}
            />
          </div>
        </div>

        <div className={'panel' + (tab === 'cur' ? ' on' : '')}>
          <div className="gl pod">
            <div className="sect" style={{ padding: 0, marginBottom: 6 }}>{tUi('spending.curTitle', lang)}</div>
            <BreakdownList
              lang={lang}
              cur={displayCurrency}
              fx={fxRate}
              rows={byCurrency}
              labelOf={(b) => tEnum('currency', b.key, lang)}
              colorOf={(b) => (b.key === 'USD' ? 'ta' : undefined)}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function BreakdownList({
  rows,
  labelOf,
  colorOf,
  lang,
  cur,
  fx,
}: {
  rows: Breakdown[]
  labelOf: (b: Breakdown) => string
  colorOf?: (b: Breakdown) => 'us' | 'hy' | 'ta' | undefined
  lang: Lang
  cur: Currency
  fx: number
}) {
  if (rows.length === 0) return <div className="cap">{tUi('spending.empty', lang)}</div>
  return (
    <>
      {rows.map((b) => {
        const color = colorOf?.(b)
        const pct = Math.round(b.pct)
        return (
          <div className="fillrow" key={b.key}>
            <div className="fillhead"><span>{labelOf(b)}</span><span className="pct">{formatMoney(b.krw, cur, fx)} · {pct}%</span></div>
            <div className="track"><div className={'fill' + (color ? ' ' + color : '')} data-w={Math.min(100, pct)}></div></div>
          </div>
        )
      })}
    </>
  )
}
