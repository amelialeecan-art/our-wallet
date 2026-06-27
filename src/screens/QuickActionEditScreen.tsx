import { useState } from 'react'
import CurrencyToggle from '../components/CurrencyToggle.tsx'
import { showToast, triggerSaved } from '../lib/feedback.ts'
import { useWallet } from '../store/WalletProvider.tsx'
import { categoryLabel, colorClass, paymentSourceTitle, tEnum, tUi } from '../i18n/labels.ts'
import type { Currency } from '../types'
import type { UsedFor } from '../domain/types'

interface Props {
  active: boolean
  quickActionId: string | null // null이면 새 빠른버튼
  onDone: () => void
}

const USED_FOR: UsedFor[] = ['shared', 'hyeonsu', 'tanner']

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

export default function QuickActionEditScreen({ active, quickActionId, onDone }: Props) {
  const { db, lang, defaultPaymentSourceId, addQuickAction, updateQuickAction, deleteQuickAction } = useWallet()
  const existing = quickActionId ? db.quickActions.find((q) => q.id === quickActionId) : undefined
  const isNew = !quickActionId

  const [titleKo, setTitleKo] = useState(existing?.titleKo ?? '')
  const [titleEn, setTitleEn] = useState(existing?.titleEn ?? '')
  const [amount, setAmount] = useState(existing ? String(existing.amountOriginal) : '')
  const [currency, setCurrency] = useState<Currency>(existing?.currency ?? 'KRW')
  const [catId, setCatId] = useState<string>(existing?.categoryId ?? 'other')
  const [usedFor, setUsedFor] = useState<UsedFor>(existing?.usedFor ?? 'shared')
  const [paymentSourceId, setPaymentSourceId] = useState<string>(existing?.paymentSourceId ?? defaultPaymentSourceId ?? '')
  const [memo, setMemo] = useState(existing?.memo ?? '')
  const [isActive, setIsActive] = useState(existing?.isActive ?? true)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // 새로 만들 땐 active만, 수정 땐 현재 선택값도 포함
  const catOptions = db.categories.filter((c) => c.isActive !== false || c.id === catId)
  const psOptions = db.paymentSources.filter((p) => p.isActive !== false || p.id === paymentSourceId)

  if (!isNew && !existing) {
    return (
      <section className={'screen' + (active ? ' active' : '')} id="quickActionEdit">
        <div className="stack">
          <div className="between" style={{ padding: '0 4px' }}>
            <div className="head" style={{ padding: 0 }}>{tUi('qa.editTitle', lang)}</div>
            <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={onDone}>{tUi('common.close', lang)}</span>
          </div>
          <div className="cap">{tUi('qa.notFound', lang)}</div>
        </div>
      </section>
    )
  }

  function save() {
    if (!titleKo.trim() && !titleEn.trim()) {
      showToast(tUi('qa.nameRequired', lang))
      return
    }
    const num = amount === '' ? 0 : Number(amount)
    if (!Number.isFinite(num) || num <= 0) {
      showToast(tUi('qa.amountInvalid', lang))
      return
    }
    const input = { titleKo, titleEn, amountOriginal: num, currency, categoryId: catId, usedFor, paymentSourceId: paymentSourceId || undefined, memo, isActive }
    const ok = isNew ? addQuickAction(input) : updateQuickAction(quickActionId!, input)
    if (!ok) {
      showToast(tUi('toast.saveFailed', lang))
      return
    }
    triggerSaved(isNew ? tUi('toast.added', lang) : tUi('toast.updated', lang))
    onDone()
  }

  function doDelete() {
    const ok = deleteQuickAction(quickActionId!)
    showToast(ok ? tUi('toast.deleted', lang) : tUi('toast.deleteFailed', lang))
    if (ok) onDone()
    else setConfirmDelete(false)
  }

  return (
    <section className={'screen' + (active ? ' active' : '')} id="quickActionEdit">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>{isNew ? tUi('qa.addTitle', lang) : tUi('qa.editTitle', lang)}</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={onDone}>{tUi('common.close', lang)}</span>
        </div>

        <div className="gl pod">
          <div className="frow"><span>{tUi('acc.name', lang)}</span><input type="text" value={titleKo} placeholder={lang === 'ko' ? '예: 점심' : 'e.g. Lunch'} onChange={(e) => setTitleKo(e.target.value)} style={inputStyle} /></div>
          <div className="frow"><span>English</span><input type="text" value={titleEn} placeholder="e.g. Lunch" onChange={(e) => setTitleEn(e.target.value)} style={inputStyle} /></div>
          <div className="between" style={{ marginTop: 6 }}>
            <span className="label">{tUi('acc.currency', lang)}</span>
            <CurrencyToggle cur={currency} setCur={setCurrency} variant="text" />
          </div>
          <div className="frow"><span>{tUi('rec.amount', lang)} ({currency})</span><input type="number" inputMode="numeric" min={0} value={amount} placeholder="0" onChange={(e) => setAmount(e.target.value)} style={inputStyle} /></div>
        </div>

        <div>
          <div className="sect">{tUi('add.forWhom', lang)}</div>
          <div className="seg3">
            {USED_FOR.map((v) => (
              <button key={v} className={usedFor === v ? 'sel ' + colorClass(v) : ''} onClick={() => setUsedFor(v)}>{tEnum('usedFor', v, lang)}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="sect">{tUi('add.category', lang)}</div>
          <div className="chips">
            {catOptions.map((c) => (
              <button key={c.id} className={'chip' + (catId === c.id ? ' sel' : '')} onClick={() => setCatId(c.id)}>{categoryLabel(c.id, db.categories, lang)}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="sect">{tUi('add.paidWith', lang)}</div>
          <div className="chips">
            {psOptions.map((p) => (
              <button key={p.id} className={'chip' + (paymentSourceId === p.id ? ' sel' : '')} onClick={() => setPaymentSourceId(p.id)}>{paymentSourceTitle(p, lang)}</button>
            ))}
          </div>
        </div>

        <div className="gl pod">
          <div className="frow"><span>{tUi('add.memo', lang)}</span><input type="text" value={memo} placeholder={tUi('common.none', lang)} onChange={(e) => setMemo(e.target.value)} style={inputStyle} /></div>
          <div className="between" style={{ marginTop: 6 }}>
            <span className="label">{tUi('qa.showInAdd', lang)}</span>
            <div className="seg">
              <button className={isActive ? 'on' : ''} onClick={() => setIsActive(true)}>{tUi('common.show', lang)}</button>
              <button className={!isActive ? 'on' : ''} onClick={() => setIsActive(false)}>{tUi('common.hide', lang)}</button>
            </div>
          </div>
        </div>

        <button className="btn block" onClick={save} style={{ padding: 16, fontSize: 16 }}><span>{tUi('common.save', lang)}</span></button>

        {!isNew && (!confirmDelete ? (
          <div className="cap" style={{ textAlign: 'center', cursor: 'pointer', color: '#cf743d' }} onClick={() => setConfirmDelete(true)}>{tUi('qa.deleteOne', lang)}</div>
        ) : (
          <div className="gl pod" style={{ textAlign: 'center' }}>
            <div className="label" style={{ marginBottom: 12 }}>{tUi('qa.confirmDelete', lang)}</div>
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
