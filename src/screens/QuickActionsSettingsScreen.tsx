import { useWallet } from '../store/WalletProvider.tsx'
import { formatMoney } from '../domain/calculations.ts'
import { categoryLabel, paymentSourceTitle, quickActionTitle, tEnum, tUi } from '../i18n/labels.ts'
import type { ScreenId } from '../types'

interface Props {
  active: boolean
  onGo: (id: ScreenId) => void
  onEdit: (id: string | null) => void
}

export default function QuickActionsSettingsScreen({ active, onGo, onEdit }: Props) {
  const { db, displayCurrency, fxRate, lang, moveQuickAction } = useWallet()
  const psById = new Map(db.paymentSources.map((p) => [p.id, p]))

  const sorted = db.quickActions.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  return (
    <section className={'screen' + (active ? ' active' : '')} id="quickActionsSettings">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>{tUi('qa.title', lang)}</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={() => onGo('settings')}>{tUi('common.close', lang)}</span>
        </div>
        <div className="cap" style={{ padding: '0 6px' }}>{tUi('qa.note', lang)}</div>

        <div className="prows">
          {sorted.map((q, i) => {
            const ps = q.paymentSourceId ? psById.get(q.paymentSourceId) : undefined
            const sub = [
              categoryLabel(q.categoryId, db.categories, lang),
              tEnum('usedFor', q.usedFor ?? 'shared', lang),
              ps ? paymentSourceTitle(ps, lang) : null,
            ]
              .filter(Boolean)
              .join(' · ')
            return (
              <div className="gl prow" key={q.id}>
                <div className="grow" onClick={() => onEdit(q.id)}>
                  <div className="aname">{quickActionTitle(q, lang)}{q.isActive === false && <span className="muted"> · {tUi('common.hide', lang)}</span>}</div>
                  <div className="atype">{formatMoney(q.amountKrw, displayCurrency, fxRate)} · {sub}</div>
                </div>
                <div className="r" style={{ display: 'flex', flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <button className="edit" style={{ border: 0, opacity: i === 0 ? 0.4 : 1 }} onClick={(e) => { e.stopPropagation(); moveQuickAction(q.id, 'up') }}>↑</button>
                  <button className="edit" style={{ border: 0, opacity: i === sorted.length - 1 ? 0.4 : 1 }} onClick={(e) => { e.stopPropagation(); moveQuickAction(q.id, 'down') }}>↓</button>
                </div>
              </div>
            )
          })}
        </div>

        <button className="btn block" style={{ padding: 15 }} onClick={() => onEdit(null)}><span>{tUi('qa.add', lang)}</span></button>
      </div>
    </section>
  )
}
