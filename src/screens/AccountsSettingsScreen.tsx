import { useWallet } from '../store/WalletProvider.tsx'
import { formatMoney } from '../domain/calculations.ts'
import { accountSubtitle, accountTitle, colorClass, tUi } from '../i18n/labels.ts'
import type { ScreenId } from '../types'

interface Props {
  active: boolean
  onGo: (id: ScreenId) => void
  onEdit: (id: string | null) => void
}

export default function AccountsSettingsScreen({ active, onGo, onEdit }: Props) {
  const { db, displayCurrency, fxRate, lang } = useWallet()

  return (
    <section className={'screen' + (active ? ' active' : '')} id="accountsSettings">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>{tUi('acc.title', lang)}</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={() => onGo('settings')}>{tUi('common.close', lang)}</span>
        </div>
        <div className="cap" style={{ padding: '0 6px' }}>{tUi('acc.note', lang)}</div>

        <div className="prows">
          {db.accounts.map((a) => (
            <div className="gl prow" key={a.id} onClick={() => onEdit(a.id)}>
              <span className={'dot ' + colorClass(a.holder)}></span>
              <div className="grow">
                <div className="aname">{accountTitle(a, lang)}</div>
                <div className="atype">{accountSubtitle(a, lang)}</div>
              </div>
              <div className="r">
                <div className="m num">{formatMoney(a.balanceKrw, displayCurrency, fxRate)}</div>
                {a.currency === 'USD' && <div className="atype" style={{ textAlign: 'right' }}>${a.balanceOriginal.toLocaleString('en-US')}</div>}
              </div>
            </div>
          ))}
        </div>

        <button className="btn block" style={{ padding: 15 }} onClick={() => onEdit(null)}><span>{tUi('acc.add', lang)}</span></button>
      </div>
    </section>
  )
}
