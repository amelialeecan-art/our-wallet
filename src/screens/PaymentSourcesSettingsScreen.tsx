import { useWallet } from '../store/WalletProvider.tsx'
import { accountTitle, colorClass, paymentSourceTitle, tEnum } from '../i18n/labels.ts'
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
          <div className="head" style={{ padding: 0 }}>카드 · 결제통로 관리</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={() => onGo('settings')}>닫기</span>
        </div>
        <div className="cap" style={{ padding: '0 6px' }}>결제통로는 우리 돈이 나가는 길이에요</div>

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
                  <div className="aname">{paymentSourceTitle(p, lang)}{p.isActive === false && <span className="muted"> · 숨김</span>}</div>
                  <div className="atype">{sub}</div>
                </div>
                <span className="chev">›</span>
              </div>
            )
          })}
        </div>

        <button className="btn block" style={{ padding: 15 }} onClick={() => onEdit(null)}><span>＋ 결제통로 추가</span></button>
      </div>
    </section>
  )
}
