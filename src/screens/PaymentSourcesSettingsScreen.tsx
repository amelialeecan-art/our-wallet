import { useWallet } from '../store/WalletProvider.tsx'
import { accountTitle, colorClass, paymentSourceTitle, tEnum, tUi } from '../i18n/labels.ts'
import type { ScreenId } from '../types'

interface Props {
  active: boolean
  onGo: (id: ScreenId) => void
  onEdit: (id: string | null) => void
}

export default function PaymentSourcesSettingsScreen({ active, onGo, onEdit }: Props) {
  const { db, lang } = useWallet()
  const accById = new Map(db.accounts.map((a) => [a.id, a]))

  return (
    <section className={'screen' + (active ? ' active' : '')} id="paymentSourcesSettings">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>{tUi('pay.title', lang)}</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={() => onGo('settings')}>{tUi('common.close', lang)}</span>
        </div>
        <div className="cap" style={{ padding: '0 6px' }}>{tUi('pay.note', lang)}</div>

        <div className="prows">
          {db.paymentSources.map((p) => {
            const acc = p.linkedAccountId ? accById.get(p.linkedAccountId) : undefined
            const sub = [tEnum('paymentKind', p.kind, lang), acc ? accountTitle(acc, lang) : null, p.currency]
              .filter(Boolean)
              .join(' · ')
            return (
              <div className="gl prow" key={p.id} onClick={() => onEdit(p.id)}>
                <span className={'dot ' + colorClass(p.holder)}></span>
                <div className="grow">
                  <div className="aname">{paymentSourceTitle(p, lang)}{p.isActive === false && <span className="muted"> · {tUi('common.hide', lang)}</span>}</div>
                  <div className="atype">{sub}</div>
                </div>
                <span className="chev">›</span>
              </div>
            )
          })}
        </div>

        <button className="btn block" style={{ padding: 15 }} onClick={() => onEdit(null)}><span>{tUi('pay.add', lang)}</span></button>
      </div>
    </section>
  )
}
