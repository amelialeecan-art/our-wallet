import { useEffect, useRef, useState } from 'react'
import { useWallet } from '../store/WalletProvider.tsx'
import {
  getActiveMonth,
  getSpendingByAccount,
  getSpendingByCategory,
  getSpendingByCurrency,
  getSpendingByPaymentSource,
  getSpendingByUsedFor,
} from '../domain/calculations.ts'
import {
  accountTitle,
  categoryLabel,
  colorClass,
  paymentSourceTitle,
  tEnum,
} from '../i18n/labels.ts'
import type { Breakdown } from '../domain/calculations.ts'

type TabKey = 'who' | 'cat' | 'pay' | 'acc' | 'cur'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'who', label: '사용대상별' },
  { key: 'cat', label: '카테고리별' },
  { key: 'pay', label: '결제수단별' },
  { key: 'acc', label: '계좌별' },
  { key: 'cur', label: '통화별' },
]

export default function SpendingScreen({ active }: { active: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const [tab, setTab] = useState<TabKey>('who')

  const { db, lang } = useWallet()
  const month = getActiveMonth(db)

  const byUsedFor = getSpendingByUsedFor(db.transactions, month)
  const byCategory = getSpendingByCategory(db.transactions, month)
  const byPay = getSpendingByPaymentSource(db.transactions, db.paymentSources, month)
  const byAccount = getSpendingByAccount(db.transactions, db.paymentSources, db.accounts, month)
  const byCurrency = getSpendingByCurrency(db.transactions, month)

  const psById = new Map(db.paymentSources.map((p) => [p.id, p]))
  const accById = new Map(db.accounts.map((a) => [a.id, a]))

  // 사용대상 비율 (없으면 0 → NaN 방어)
  const pctOf = (key: string) => byUsedFor.find((b) => b.key === key)?.pct ?? 0
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
  }, [active, tab, db])

  return (
    <section ref={ref} className={'screen' + (active ? ' active' : '')} id="spending">
      <div className="stack">
        <div className="head">누구를 위한 지출이었나요?</div>
        <div className="tabs" id="spendTabs">
          {TABS.map((t) => (
            <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>

        <div className={'panel' + (tab === 'who' ? ' on' : '')}>
          <div className="gl pod">
            <div className="sect" style={{ padding: 0, marginBottom: 14 }}>우리 지출의 사용대상</div>
            <div className="liquid-wrap">
              <div className="liquid">
                <div className="lq ta" data-h={hTa}></div>
                <div className="lq hy" data-h={hHy}></div>
                <div className="lq us" data-h={hUs}></div>
              </div>
              <div className="legend">
                <div className="lg"><span className="k" style={{ background: 'var(--us)' }}></span>{tEnum('usedFor', 'shared', lang)}<span className="p num">{Math.round(sharedPct)}%</span></div>
                <div className="lg"><span className="k" style={{ background: 'var(--hyun)' }}></span>{tEnum('usedFor', 'hyeonsu', lang)}<span className="p num">{Math.round(hyeonsuPct)}%</span></div>
                <div className="lg"><span className="k" style={{ background: 'var(--tan)' }}></span>{tEnum('usedFor', 'tanner', lang)}<span className="p num">{Math.round(tannerPct)}%</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className={'panel' + (tab === 'cat' ? ' on' : '')}>
          <div className="gl pod">
            <div className="sect" style={{ padding: 0, marginBottom: 6 }}>카테고리별</div>
            <BreakdownList
              rows={byCategory}
              labelOf={(b) => categoryLabel(b.key, db.categories, lang)}
            />
          </div>
        </div>

        <div className={'panel' + (tab === 'pay' ? ' on' : '')}>
          <div className="gl pod">
            <div className="sect" style={{ padding: 0, marginBottom: 6 }}>우리 지출이 나간 통로</div>
            <BreakdownList
              rows={byPay}
              labelOf={(b) => { const ps = psById.get(b.key); return ps ? paymentSourceTitle(ps, lang) : b.key }}
              colorOf={(b) => { const ps = psById.get(b.key); return ps ? colorClass(ps.holder) : undefined }}
            />
          </div>
        </div>

        <div className={'panel' + (tab === 'acc' ? ' on' : '')}>
          <div className="gl pod">
            <div className="sect" style={{ padding: 0, marginBottom: 6 }}>계좌별</div>
            <BreakdownList
              rows={byAccount}
              labelOf={(b) => { const a = accById.get(b.key); return a ? accountTitle(a, lang) : b.key }}
              colorOf={(b) => { const a = accById.get(b.key); return a ? colorClass(a.holder) : undefined }}
            />
          </div>
        </div>

        <div className={'panel' + (tab === 'cur' ? ' on' : '')}>
          <div className="gl pod">
            <div className="sect" style={{ padding: 0, marginBottom: 6 }}>통화별</div>
            <BreakdownList
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
}: {
  rows: Breakdown[]
  labelOf: (b: Breakdown) => string
  colorOf?: (b: Breakdown) => 'us' | 'hy' | 'ta' | undefined
}) {
  if (rows.length === 0) return <div className="cap">아직 지출 기록이 없어요</div>
  return (
    <>
      {rows.map((b) => {
        const color = colorOf?.(b)
        const pct = Math.round(b.pct)
        return (
          <div className="fillrow" key={b.key}>
            <div className="fillhead"><span>{labelOf(b)}</span><span className="pct">{pct}%</span></div>
            <div className="track"><div className={'fill' + (color ? ' ' + color : '')} data-w={Math.min(100, pct)}></div></div>
          </div>
        )
      })}
    </>
  )
}
