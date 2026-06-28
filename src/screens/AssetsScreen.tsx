import { useWallet } from '../store/WalletProvider.tsx'
import {
  formatMoney,
  getLiquidAssets,
  getLockedAssets,
  getTotalAssets,
} from '../domain/calculations.ts'
import { accountSubtitle, accountTitle, colorClass, tUi } from '../i18n/labels.ts'
import type { Currency } from '../types'
import type { Account } from '../domain/types'

interface Props {
  active: boolean
  cur: Currency
  onAdjust: (accountId: string) => void
}

export default function AssetsScreen({ active, cur, onAdjust }: Props) {
  const { db, fxRate, lang } = useWallet()

  const total = getTotalAssets(db.accounts)
  const liquid = getLiquidAssets(db.accounts)
  const locked = getLockedAssets(db.accounts)
  const spendable = db.accounts.filter((a) => a.tier === 'spendable')
  const saving = db.accounts.filter((a) => a.tier === 'saving')

  const row = (a: Account) => (
    <div className="gl prow" key={a.id} onClick={() => onAdjust(a.id)}>
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
        <div className="head">{tUi('assets.title', lang)}</div>

        <div className="gl hero sm">
          <div className="label">{tUi('assets.total', lang)}</div>
          <div className="big num" style={{ fontSize: 34 }}>{formatMoney(total, cur, fxRate)}</div>
          <div className="cap">{tUi('assets.available', lang)} {formatMoney(liquid, cur, fxRate)} · {tUi('home.setAside', lang)} {formatMoney(locked, cur, fxRate)}</div>
        </div>

        <div>
          <div className="sect">{tUi('assets.available', lang)}</div>
          <div className="prows">{spendable.map(row)}</div>
        </div>

        <div>
          <div className="sect">{tUi('assets.saving', lang)}</div>
          <div className="prows">{saving.map(row)}</div>
        </div>

        <div className="cap" style={{ padding: '0 6px' }}>{tUi('assets.adjustHint', lang)}</div>
      </div>
    </section>
  )
}
