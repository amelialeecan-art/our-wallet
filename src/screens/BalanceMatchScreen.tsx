import { useState } from 'react'
import { showToast, triggerSaved } from '../lib/feedback.ts'
import { useWallet } from '../store/WalletProvider.tsx'
import { formatMoney } from '../domain/calculations.ts'
import { accountSubtitle, accountTitle, tUi } from '../i18n/labels.ts'

interface Props {
  active: boolean
  accountId: string | null
  onDone: () => void
}

const inputStyle: React.CSSProperties = {
  font: 'inherit',
  border: 0,
  borderRadius: 12,
  padding: '10px 12px',
  background: 'rgba(255,255,255,.45)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.35)',
  color: 'var(--ink)',
  width: '55%',
}

export default function BalanceMatchScreen({ active, accountId, onDone }: Props) {
  const { db, lang, fxRate, displayCurrency, adjustAccountBalance } = useWallet()
  const acc = db.accounts.find((a) => a.id === accountId)
  const [actual, setActual] = useState(acc ? String(acc.balanceOriginal) : '')

  if (!acc) {
    return (
      <section className={'screen' + (active ? ' active' : '')} id="balanceMatch">
        <div className="stack">
          <div className="between" style={{ padding: '0 4px' }}>
            <div className="head" style={{ padding: 0 }}>{tUi('balance.title', lang)}</div>
            <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={onDone}>{tUi('common.close', lang)}</span>
          </div>
          <div className="cap">{tUi('balance.notFound', lang)}</div>
        </div>
      </section>
    )
  }

  function save() {
    const num = actual === '' ? NaN : Number(actual)
    if (!Number.isFinite(num) || num < 0) {
      showToast(tUi('balance.invalid', lang))
      return
    }
    const ok = adjustAccountBalance(acc!.id, num)
    if (!ok) {
      showToast(tUi('toast.saveFailed', lang))
      return
    }
    triggerSaved(tUi('balance.matched', lang))
    onDone()
  }

  return (
    <section className={'screen' + (active ? ' active' : '')} id="balanceMatch">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>{tUi('balance.title', lang)}</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={onDone}>{tUi('common.close', lang)}</span>
        </div>
        <div className="cap" style={{ padding: '0 6px' }}>{tUi('balance.note', lang)}</div>

        <div className="gl pod">
          <div className="aname" style={{ fontSize: 15.5, fontWeight: 800 }}>{accountTitle(acc, lang)}</div>
          <div className="atype" style={{ marginBottom: 12 }}>{accountSubtitle(acc, lang)}</div>
          <div className="frow"><span>{tUi('balance.appBalance', lang)}</span><span className="fv num">{formatMoney(acc.balanceKrw, displayCurrency, fxRate)}</span></div>
          <div className="frow"><span>{tUi('balance.actualBalance', lang)} ({acc.currency})</span><input type="number" inputMode="numeric" min={0} value={actual} placeholder="0" onChange={(e) => setActual(e.target.value)} style={inputStyle} /></div>
        </div>

        <button className="btn block" onClick={save} style={{ padding: 16, fontSize: 16 }}><span>{tUi('balance.save', lang)}</span></button>
      </div>
    </section>
  )
}
