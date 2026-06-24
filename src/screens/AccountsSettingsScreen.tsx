import { useWallet } from '../store/WalletProvider.tsx'
import { formatMoney } from '../domain/calculations.ts'
import { accountSubtitle, accountTitle, colorClass } from '../i18n/labels.ts'
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
          <div className="head" style={{ padding: 0 }}>계좌 관리</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={() => onGo('settings')}>닫기</span>
        </div>
        <div className="cap" style={{ padding: '0 6px' }}>계좌는 우리 돈이 있는 보관 위치예요</div>

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

        <button className="btn block" style={{ padding: 15 }} onClick={() => onEdit(null)}><span>＋ 계좌 추가</span></button>
      </div>
    </section>
  )
}
