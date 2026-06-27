import { useWallet } from '../store/WalletProvider.tsx'
import { formatMoney } from '../domain/calculations.ts'
import { categoryLabel, tUi } from '../i18n/labels.ts'
import type { ScreenId } from '../types'

interface Props {
  active: boolean
  onGo: (id: ScreenId) => void
  onEdit: (id: string | null) => void
}

export default function CategoriesSettingsScreen({ active, onGo, onEdit }: Props) {
  const { db, displayCurrency, fxRate, lang } = useWallet()

  return (
    <section className={'screen' + (active ? ' active' : '')} id="categoriesSettings">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>{tUi('cat.title', lang)}</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={() => onGo('settings')}>{tUi('common.close', lang)}</span>
        </div>
        <div className="cap" style={{ padding: '0 6px' }}>{tUi('cat.note', lang)}</div>

        <div className="prows">
          {db.categories.map((c) => (
            <div className="gl prow" key={c.id} onClick={() => onEdit(c.id)}>
              <div className="grow">
                <div className="aname">{categoryLabel(c.id, db.categories, lang)}{c.isActive === false && <span className="muted"> · {tUi('common.hide', lang)}</span>}</div>
                <div className="atype">{(c.budgetMonthly ?? 0) > 0 ? `${tUi('cat.budgetPrefix', lang)} ${formatMoney(c.budgetMonthly!, displayCurrency, fxRate)}` : tUi('cat.budgetNone', lang)}</div>
              </div>
              <span className="chev">›</span>
            </div>
          ))}
        </div>

        <button className="btn block" style={{ padding: 15 }} onClick={() => onEdit(null)}><span>{tUi('cat.add', lang)}</span></button>
      </div>
    </section>
  )
}
