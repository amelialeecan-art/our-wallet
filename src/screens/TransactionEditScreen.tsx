import { useState } from 'react'
import CurrencyToggle from '../components/CurrencyToggle.tsx'
import { showToast, triggerSaved } from '../lib/feedback.ts'
import { useWallet } from '../store/WalletProvider.tsx'
import { categoryLabel, colorClass, paymentSourceTitle, tEnum, tUi } from '../i18n/labels.ts'
import type { Currency } from '../types'
import type { UsedFor } from '../domain/types'

interface Props {
  active: boolean
  txId: string | null
  onDone: () => void
}

const USED_FOR: UsedFor[] = ['shared', 'hyeonsu', 'tanner']

const inputStyle: React.CSSProperties = {
  font: 'inherit',
  border: 0,
  borderRadius: 12,
  padding: '8px 12px',
  background: 'rgba(255,255,255,.45)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.35)',
  color: 'var(--ink)',
}

export default function TransactionEditScreen({ active, txId, onDone }: Props) {
  const { db, lang, updateTransaction, deleteTransaction } = useWallet()
  const tx = db.transactions.find((t) => t.id === txId)

  // tx별로 App에서 key를 주어 remount하므로 초기값을 그대로 써도 안전하다.
  const [raw, setRaw] = useState(tx ? String(tx.amountOriginal) : '')
  const [keypadOpen, setKeypadOpen] = useState(false)
  const [currency, setCurrency] = useState<Currency>(tx ? tx.currency : 'KRW')
  const [usedFor, setUsedFor] = useState<UsedFor>(tx ? tx.usedFor : 'shared')
  const [catId, setCatId] = useState<string>(tx ? tx.categoryId : 'other')
  const [paymentSourceId, setPaymentSourceId] = useState<string>(tx ? tx.paymentSourceId : '')
  const [date, setDate] = useState<string>(tx ? tx.date : new Date().toISOString().slice(0, 10))
  const [memo, setMemo] = useState<string>(tx?.memo ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!tx) {
    return (
      <section className={'screen' + (active ? ' active' : '')} id="txedit">
        <div className="stack">
          <div className="between" style={{ padding: '0 4px' }}>
            <div className="head" style={{ padding: 0 }}>{tUi('txedit.title', lang)}</div>
            <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={onDone}>{tUi('common.close', lang)}</span>
          </div>
          <div className="cap">{tUi('txedit.notFound', lang)}</div>
        </div>
      </section>
    )
  }

  const n = raw === '' ? 0 : parseInt(raw, 10)
  const amtCur = currency === 'KRW' ? '₩' : '$'
  const amtVal = n.toLocaleString(currency === 'KRW' ? 'ko-KR' : 'en-US')

  function pressKey(k: string) {
    setRaw((prev) => {
      let next = prev
      if (k === 'del') next = prev.slice(0, -1)
      else if (k === '00') next = prev === '' ? '' : prev + '00'
      else next = prev + k
      next = next.replace(/^0+(?=\d)/, '')
      if (next.length > 9) next = next.slice(0, 9)
      return next
    })
  }

  function save() {
    if (n <= 0) {
      showToast(tUi('toast.enterAmount', lang))
      return
    }
    const ok = updateTransaction(tx!.id, {
      amountOriginal: n,
      currency,
      usedFor,
      categoryId: catId,
      paymentSourceId,
      date,
      memo,
    })
    if (!ok) {
      showToast(tUi('toast.saveFailed', lang))
      return
    }
    triggerSaved(tUi('toast.updated', lang))
    onDone()
  }

  function doDelete() {
    const ok = deleteTransaction(tx!.id)
    showToast(ok ? tUi('toast.deleted', lang) : tUi('toast.deleteFailed', lang))
    onDone()
  }

  return (
    <section className={'screen' + (active ? ' active' : '')} id="txedit">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>{tUi('txedit.title', lang)}</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={onDone}>{tUi('common.close', lang)}</span>
        </div>

        <div className="gl pod">
          <div className="between" style={{ marginBottom: 2 }}>
            <span className="label">{tUi('add.amount', lang)}</span>
            <CurrencyToggle cur={currency} setCur={setCurrency} variant="text" />
          </div>
          <div className={'amount' + (n === 0 ? ' empty' : '')} onClick={() => setKeypadOpen((o) => !o)}>
            <span className="cur">{amtCur}</span>
            <span className="val num">{amtVal}</span>
          </div>
          <div className="hint">{tUi('txedit.tapToEdit', lang)}</div>
          <div className={'keypad' + (keypadOpen ? '' : ' hidden')}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button key={d} onClick={() => pressKey(d)}>{d}</button>
            ))}
            <button onClick={() => pressKey('00')}>00</button>
            <button onClick={() => pressKey('0')}>0</button>
            <button onClick={() => pressKey('del')}>⌫</button>
          </div>
        </div>

        <div>
          <div className="sect">{tUi('add.forWhom', lang)}</div>
          <div className="seg3" id="who">
            {USED_FOR.map((v) => (
              <button key={v} className={usedFor === v ? 'sel ' + colorClass(v) : ''} onClick={() => setUsedFor(v)}>
                {tEnum('usedFor', v, lang)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="sect">{tUi('add.category', lang)}</div>
          <div className="chips">
            {db.categories.filter((c) => c.isActive !== false || c.id === catId).map((c) => (
              <button key={c.id} className={'chip' + (catId === c.id ? ' sel' : '')} onClick={() => setCatId(c.id)}>
                {categoryLabel(c.id, db.categories, lang)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="sect">{tUi('add.paidWith', lang)}</div>
          <div className="chips">
            {db.paymentSources.filter((p) => p.isActive !== false || p.id === paymentSourceId).map((p) => (
              <button key={p.id} className={'chip' + (paymentSourceId === p.id ? ' sel' : '')} onClick={() => setPaymentSourceId(p.id)}>
                {paymentSourceTitle(p, lang)}
              </button>
            ))}
          </div>
        </div>

        <div className="gl pod">
          <div className="frow"><span>{tUi('add.date', lang)}</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} /></div>
          <div className="frow"><span>{tUi('add.memo', lang)}</span><input type="text" value={memo} placeholder={tUi('common.none', lang)} onChange={(e) => setMemo(e.target.value)} style={{ ...inputStyle, width: '60%' }} /></div>
        </div>

        <button className="btn block" onClick={save} style={{ padding: 16, fontSize: 16 }}><span>{tUi('common.save', lang)}</span></button>

        {!confirmDelete ? (
          <div className="cap" style={{ textAlign: 'center', cursor: 'pointer', color: '#cf743d' }} onClick={() => setConfirmDelete(true)}>
            {tUi('txedit.deleteOne', lang)}
          </div>
        ) : (
          <div className="gl pod" style={{ textAlign: 'center' }}>
            <div className="label" style={{ marginBottom: 12 }}>{tUi('txedit.confirmDelete', lang)}</div>
            <div className="seg3">
              <button onClick={() => setConfirmDelete(false)}>{tUi('common.cancel', lang)}</button>
              <button className="sel ta" style={{ color: '#cf743d' }} onClick={doDelete}>{tUi('common.delete', lang)}</button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
