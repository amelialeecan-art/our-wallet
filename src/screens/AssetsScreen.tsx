import { useWallet } from '../store/WalletProvider.tsx'
import {
  formatMoney,
  getLiquidAssets,
  getLockedAssets,
  getTotalAssets,
} from '../domain/calculations.ts'
import { accountSubtitle, accountTitle, colorClass } from '../i18n/labels.ts'
import type { Currency } from '../types'
import type { Account } from '../domain/types'

interface Props {
  active: boolean
  cur: Currency
}

export default function AssetsScreen({ active, cur }: Props) {
  const { db, fxRate, lang } = useWallet()

  const total = getTotalAssets(db.accounts)
  const liquid = getLiquidAssets(db.accounts)
  const locked = getLockedAssets(db.accounts)
  const spendable = db.accounts.filter((a) => a.tier === 'spendable')
  const saving = db.accounts.filter((a) => a.tier === 'saving')

  const row = (a: Account) => (
    <div className="gl prow" key={a.id}>
      <span className={'dot ' + colorClass(a.holder)}></span>
      <div className="grow">
        <div className="aname">{accountTitle(a, lang)}</div>
        <div className="atype">{accountSubtitle(a, lang)}</div>
      </div>
      <div className="aval num">{formatMoney(a.balanceKrw, cur, fxRate)}</div>
    </div>
  )

  return (
    <section className={'screen' + (active ? ' active' : '')} id="assets">
      <div className="stack">
        <div className="head">우리 돈이 있는 곳</div>

        <div className="gl hero sm">
          <div className="label">우리 총자산</div>
          <div className="big num" style={{ fontSize: 34 }}>{formatMoney(total, cur, fxRate)}</div>
          <div className="cap">쓸 수 있는 돈 {formatMoney(liquid, cur, fxRate)} · 묶인 돈 {formatMoney(locked, cur, fxRate)}</div>
        </div>

        <div>
          <div className="sect">쓸 수 있는 돈</div>
          <div className="prows">{spendable.map(row)}</div>
        </div>

        <div>
          <div className="sect">모으는·불리는 돈</div>
          <div className="prows">{saving.map(row)}</div>
        </div>

        <div className="between" style={{ padding: '0 6px' }}>
          <span className="cap" style={{ margin: 0 }}>마지막 업데이트 · 2일 전</span>
          <button className="btn"><span>잔액 업데이트</span></button>
        </div>
      </div>
    </section>
  )
}
