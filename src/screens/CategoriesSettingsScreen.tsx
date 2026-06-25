import { useWallet } from '../store/WalletProvider.tsx'
import { formatMoney } from '../domain/calculations.ts'
import { categoryLabel } from '../i18n/labels.ts'
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
          <div className="head" style={{ padding: 0 }}>카테고리 관리</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={() => onGo('settings')}>닫기</span>
        </div>
        <div className="cap" style={{ padding: '0 6px' }}>우리 지출을 이해하기 위한 분류예요</div>

        <div className="prows">
          {db.categories.map((c) => (
            <div className="gl prow" key={c.id} onClick={() => onEdit(c.id)}>
              <div className="grow">
                <div className="aname">{categoryLabel(c.id, db.categories, lang)}{c.isActive === false && <span className="muted"> · 숨김</span>}</div>
                <div className="atype">{(c.budgetMonthly ?? 0) > 0 ? `예산 ${formatMoney(c.budgetMonthly!, displayCurrency, fxRate)}` : '예산 없음'}</div>
              </div>
              <span className="chev">›</span>
            </div>
          ))}
        </div>

        <button className="btn block" style={{ padding: 15 }} onClick={() => onEdit(null)}><span>＋ 카테고리 추가</span></button>
      </div>
    </section>
  )
}
