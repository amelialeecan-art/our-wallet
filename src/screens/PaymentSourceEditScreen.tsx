import { useState } from 'react'
import CurrencyToggle from '../components/CurrencyToggle.tsx'
import { showToast, triggerSaved } from '../lib/feedback.ts'
import { useWallet } from '../store/WalletProvider.tsx'
import { accountTitle, colorClass, tEnum, tUi } from '../i18n/labels.ts'
import type { Currency } from '../types'
import type { HolderLabel, PaymentKind, SettlementType } from '../domain/types'

interface Props {
  active: boolean
  paymentSourceId: string | null // null이면 새 결제통로
  onDone: () => void
}

const HOLDERS: HolderLabel[] = ['shared', 'hyeonsu', 'tanner']
const KINDS: PaymentKind[] = ['card', 'account', 'cash']
const SETTLEMENTS: SettlementType[] = ['immediate', 'deferred', 'none']

const inputStyle: React.CSSProperties = {
  font: 'inherit',
  border: 0,
  borderRadius: 12,
  padding: '10px 12px',
  background: 'rgba(255,255,255,.45)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.35)',
  color: 'var(--ink)',
  width: '60%',
}

export default function PaymentSourceEditScreen({ active, paymentSourceId, onDone }: Props) {
  const { db, lang, addPaymentSource, updatePaymentSource, deletePaymentSource } = useWallet()
  const existing = paymentSourceId ? db.paymentSources.find((p) => p.id === paymentSourceId) : undefined
  const isNew = !paymentSourceId

  const [nameKo, setNameKo] = useState(existing?.nameKo ?? '')
  const [nameEn, setNameEn] = useState(existing?.nameEn ?? '')
  const [kind, setKind] = useState<PaymentKind>(existing?.kind ?? 'card')
  const [holder, setHolder] = useState<HolderLabel>(existing?.holder ?? 'shared')
  const [currency, setCurrency] = useState<Currency>(existing?.currency ?? 'KRW')
  const [linkedAccountId, setLinkedAccountId] = useState<string>(existing?.linkedAccountId ?? '')
  const [settlementType, setSettlementType] = useState<SettlementType>(existing?.settlementType ?? (existing?.kind === 'card' ? 'deferred' : 'immediate'))
  const [isActive, setIsActive] = useState<boolean>(existing?.isActive ?? true)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!isNew && !existing) {
    return (
      <section className={'screen' + (active ? ' active' : '')} id="paymentSourceEdit">
        <div className="stack">
          <div className="between" style={{ padding: '0 4px' }}>
            <div className="head" style={{ padding: 0 }}>{tUi('pay.editTitle', lang)}</div>
            <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={onDone}>{tUi('common.close', lang)}</span>
          </div>
          <div className="cap">{tUi('pay.notFound', lang)}</div>
        </div>
      </section>
    )
  }

  function save() {
    if (!nameKo.trim()) {
      showToast(tUi('pay.nameRequired', lang))
      return
    }
    const input = { nameKo, nameEn, kind, holder, currency, linkedAccountId: linkedAccountId || undefined, settlementType, isActive }
    const ok = isNew ? addPaymentSource(input) : updatePaymentSource(paymentSourceId!, input)
    if (!ok) {
      showToast(tUi('toast.saveFailed', lang))
      return
    }
    triggerSaved(isNew ? tUi('toast.added', lang) : tUi('toast.updated', lang))
    onDone()
  }

  function doDelete() {
    const res = deletePaymentSource(paymentSourceId!)
    if (res === 'deleted') {
      showToast(tUi('toast.deleted', lang))
      onDone()
    } else if (res === 'used-in-tx') {
      showToast(tUi('pay.blockedTx', lang))
      setConfirmDelete(false)
    } else if (res === 'is-default') {
      showToast(tUi('pay.blockedDefault', lang))
      setConfirmDelete(false)
    } else {
      showToast(tUi('toast.deleteFailed', lang))
      setConfirmDelete(false)
    }
  }

  return (
    <section className={'screen' + (active ? ' active' : '')} id="paymentSourceEdit">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>{isNew ? tUi('pay.addTitle', lang) : tUi('pay.editTitle', lang)}</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={onDone}>{tUi('common.close', lang)}</span>
        </div>

        <div className="gl pod">
          <div className="frow"><span>{tUi('acc.name', lang)}</span><input type="text" value={nameKo} placeholder={lang === 'ko' ? '예: 현수카드' : 'e.g. Hyeonsu Card'} onChange={(e) => setNameKo(e.target.value)} style={inputStyle} /></div>
          <div className="frow"><span>English</span><input type="text" value={nameEn} placeholder="e.g. Hyeonsu Card" onChange={(e) => setNameEn(e.target.value)} style={inputStyle} /></div>
        </div>

        <div>
          <div className="sect">{tUi('pay.kind', lang)}</div>
          <div className="seg3">
            {KINDS.map((k) => (
              <button key={k} className={kind === k ? 'sel us' : ''} onClick={() => setKind(k)}>{tEnum('paymentKind', k, lang)}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="sect">{tUi('pay.holder', lang)}</div>
          <div className="seg3">
            {HOLDERS.map((h) => (
              <button key={h} className={holder === h ? 'sel ' + colorClass(h) : ''} onClick={() => setHolder(h)}>{tEnum('usedFor', h, lang)}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="sect">{tUi('pay.linkedAccount', lang)}</div>
          <div className="chips">
            <button className={'chip' + (linkedAccountId === '' ? ' sel' : '')} onClick={() => setLinkedAccountId('')}>{tUi('common.none', lang)}</button>
            {db.accounts.map((a) => (
              <button key={a.id} className={'chip' + (linkedAccountId === a.id ? ' sel' : '')} onClick={() => setLinkedAccountId(a.id)}>{accountTitle(a, lang)}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="sect">{tUi('pay.settlement', lang)}</div>
          <div className="seg3">
            {SETTLEMENTS.map((s) => (
              <button key={s} className={settlementType === s ? 'sel us' : ''} onClick={() => setSettlementType(s)}>{tUi('pay.settlement.' + s, lang)}</button>
            ))}
          </div>
          <div className="cap" style={{ padding: '0 6px' }}>{tUi('pay.settlementNote', lang)}</div>
        </div>

        <div className="gl pod">
          <div className="between" style={{ marginBottom: 10 }}>
            <span className="label">{tUi('acc.currency', lang)}</span>
            <CurrencyToggle cur={currency} setCur={setCurrency} variant="text" />
          </div>
          <div className="between">
            <span className="label">{tUi('pay.showInAdd', lang)}</span>
            <div className="seg">
              <button className={isActive ? 'on' : ''} onClick={() => setIsActive(true)}>{tUi('common.show', lang)}</button>
              <button className={!isActive ? 'on' : ''} onClick={() => setIsActive(false)}>{tUi('common.hide', lang)}</button>
            </div>
          </div>
        </div>

        <button className="btn block" onClick={save} style={{ padding: 16, fontSize: 16 }}><span>{tUi('common.save', lang)}</span></button>

        {!isNew && (!confirmDelete ? (
          <div className="cap" style={{ textAlign: 'center', cursor: 'pointer', color: '#cf743d' }} onClick={() => setConfirmDelete(true)}>{tUi('pay.deleteOne', lang)}</div>
        ) : (
          <div className="gl pod" style={{ textAlign: 'center' }}>
            <div className="label" style={{ marginBottom: 12 }}>{tUi('pay.confirmDelete', lang)}</div>
            <div className="seg3">
              <button onClick={() => setConfirmDelete(false)}>{tUi('common.cancel', lang)}</button>
              <button className="sel ta" style={{ color: '#cf743d' }} onClick={doDelete}>{tUi('common.delete', lang)}</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
