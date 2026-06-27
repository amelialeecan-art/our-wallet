import { useState } from 'react'
import CurrencyToggle from '../components/CurrencyToggle.tsx'
import { showToast, triggerSaved } from '../lib/feedback.ts'
import { useWallet } from '../store/WalletProvider.tsx'
import { accountTitle, categoryLabel, paymentSourceTitle, tEnum, tUi } from '../i18n/labels.ts'
import type { Currency } from '../types'
import type { RecurringType } from '../domain/types'

interface Props {
  active: boolean
  recurringId: string | null // null이면 새 항목
  onDone: () => void
}

const TYPES: RecurringType[] = ['income', 'expense', 'transfer']

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

export default function RecurringEditScreen({ active, recurringId, onDone }: Props) {
  const { db, lang, addRecurringItem, updateRecurringItem, deleteRecurringItem } = useWallet()
  const existing = recurringId ? db.recurringItems.find((r) => r.id === recurringId) : undefined
  const isNew = !recurringId

  const [titleKo, setTitleKo] = useState(existing?.titleKo ?? '')
  const [titleEn, setTitleEn] = useState(existing?.titleEn ?? '')
  const [type, setType] = useState<RecurringType>(existing?.type ?? 'expense')
  const [currency, setCurrency] = useState<Currency>(existing?.currency ?? 'KRW')
  const [amount, setAmount] = useState(existing ? String(existing.amountOriginal) : '')
  const [days, setDays] = useState(existing ? existing.daysOfMonth.join(', ') : '')
  const [categoryId, setCategoryId] = useState<string>(existing?.categoryId ?? '')
  const [paymentSourceId, setPaymentSourceId] = useState<string>(existing?.paymentSourceId ?? '')
  const [accountId, setAccountId] = useState<string>(existing?.accountId ?? '')
  const [isActive, setIsActive] = useState(existing?.active ?? true)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // 새로 만들 땐 active만, 수정 땐 현재 선택값도 포함
  const catOptions = db.categories.filter((c) => c.isActive !== false || c.id === categoryId)
  const psOptions = db.paymentSources.filter((p) => p.isActive !== false || p.id === paymentSourceId)

  if (!isNew && !existing) {
    return (
      <section className={'screen' + (active ? ' active' : '')} id="recurringEdit">
        <div className="stack">
          <div className="between" style={{ padding: '0 4px' }}>
            <div className="head" style={{ padding: 0 }}>{tUi('rec.editTitle', lang)}</div>
            <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={onDone}>{tUi('common.close', lang)}</span>
          </div>
          <div className="cap">{tUi('rec.notFound', lang)}</div>
        </div>
      </section>
    )
  }

  function save() {
    if (!titleKo.trim() && !titleEn.trim()) {
      showToast(tUi('rec.nameRequired', lang))
      return
    }
    const num = amount === '' ? 0 : Number(amount)
    if (!Number.isFinite(num) || num <= 0) {
      showToast(tUi('rec.amountInvalid', lang))
      return
    }
    const daysArr = days.split(/[^\d]+/).filter(Boolean).map(Number)
    if (!daysArr.some((d) => d >= 1 && d <= 31)) {
      showToast(tUi('rec.daysInvalid', lang))
      return
    }
    const input = {
      type,
      titleKo,
      titleEn,
      amountOriginal: num,
      currency,
      daysOfMonth: daysArr,
      categoryId: categoryId || undefined,
      paymentSourceId: paymentSourceId || undefined,
      accountId: accountId || undefined,
      active: isActive,
    }
    const ok = isNew ? addRecurringItem(input) : updateRecurringItem(recurringId!, input)
    if (!ok) {
      showToast(tUi('toast.saveFailed', lang))
      return
    }
    triggerSaved(isNew ? tUi('toast.added', lang) : tUi('toast.updated', lang))
    onDone()
  }

  function doDelete() {
    const res = deleteRecurringItem(recurringId!)
    if (res === 'deleted') showToast(tUi('toast.deleted', lang))
    else if (res === 'hidden') showToast(tUi('rec.hidden', lang))
    else showToast(tUi('toast.deleteFailed', lang))
    if (res === 'deleted' || res === 'hidden') onDone()
    else setConfirmDelete(false)
  }

  return (
    <section className={'screen' + (active ? ' active' : '')} id="recurringEdit">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>{isNew ? tUi('rec.addTitle', lang) : tUi('rec.editTitle', lang)}</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={onDone}>{tUi('common.close', lang)}</span>
        </div>

        <div>
          <div className="sect">{tUi('rec.kind', lang)}</div>
          <div className="seg3">
            {TYPES.map((t) => (
              <button key={t} className={type === t ? (t === 'income' ? 'sel us' : t === 'transfer' ? 'sel hy' : 'sel ta') : ''} onClick={() => setType(t)}>{tEnum('recurringType', t, lang)}</button>
            ))}
          </div>
        </div>

        <div className="gl pod">
          <div className="frow"><span>{tUi('rec.name', lang)}</span><input type="text" value={titleKo} placeholder={lang === 'ko' ? '예: 월세' : 'e.g. Rent'} onChange={(e) => setTitleKo(e.target.value)} style={inputStyle} /></div>
          <div className="frow"><span>English</span><input type="text" value={titleEn} placeholder="e.g. Rent" onChange={(e) => setTitleEn(e.target.value)} style={inputStyle} /></div>
          <div className="between" style={{ marginTop: 6 }}>
            <span className="label">{tUi('acc.currency', lang)}</span>
            <CurrencyToggle cur={currency} setCur={setCurrency} variant="text" />
          </div>
          <div className="frow"><span>{tUi('rec.amount', lang)} ({currency})</span><input type="number" inputMode="numeric" min={0} value={amount} placeholder="0" onChange={(e) => setAmount(e.target.value)} style={inputStyle} /></div>
          <div className="frow"><span>{tUi('rec.days', lang)}</span><input type="text" inputMode="numeric" value={days} placeholder="25" onChange={(e) => setDays(e.target.value)} style={inputStyle} /></div>
        </div>

        <div>
          <div className="sect">{tUi('rec.category', lang)} {type === 'expense' ? '' : tUi('common.optional', lang)}</div>
          <div className="chips">
            <button className={'chip' + (categoryId === '' ? ' sel' : '')} onClick={() => setCategoryId('')}>{tUi('common.none', lang)}</button>
            {catOptions.map((c) => (
              <button key={c.id} className={'chip' + (categoryId === c.id ? ' sel' : '')} onClick={() => setCategoryId(c.id)}>{categoryLabel(c.id, db.categories, lang)}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="sect">{tUi('rec.payment', lang)} {tUi('common.optional', lang)}</div>
          <div className="chips">
            <button className={'chip' + (paymentSourceId === '' ? ' sel' : '')} onClick={() => setPaymentSourceId('')}>{tUi('common.none', lang)}</button>
            {psOptions.map((p) => (
              <button key={p.id} className={'chip' + (paymentSourceId === p.id ? ' sel' : '')} onClick={() => setPaymentSourceId(p.id)}>{paymentSourceTitle(p, lang)}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="sect">{tUi('rec.account', lang)} {tUi('common.optional', lang)}</div>
          <div className="chips">
            <button className={'chip' + (accountId === '' ? ' sel' : '')} onClick={() => setAccountId('')}>{tUi('common.none', lang)}</button>
            {db.accounts.map((a) => (
              <button key={a.id} className={'chip' + (accountId === a.id ? ' sel' : '')} onClick={() => setAccountId(a.id)}>{accountTitle(a, lang)}</button>
            ))}
          </div>
        </div>

        <div className="gl pod">
          <div className="between">
            <span className="label">{tUi('rec.showInSchedule', lang)}</span>
            <div className="seg">
              <button className={isActive ? 'on' : ''} onClick={() => setIsActive(true)}>{tUi('common.show', lang)}</button>
              <button className={!isActive ? 'on' : ''} onClick={() => setIsActive(false)}>{tUi('common.hide', lang)}</button>
            </div>
          </div>
        </div>

        <button className="btn block" onClick={save} style={{ padding: 16, fontSize: 16 }}><span>{tUi('common.save', lang)}</span></button>

        {!isNew && (!confirmDelete ? (
          <div className="cap" style={{ textAlign: 'center', cursor: 'pointer', color: '#cf743d' }} onClick={() => setConfirmDelete(true)}>{tUi('rec.deleteOne', lang)}</div>
        ) : (
          <div className="gl pod" style={{ textAlign: 'center' }}>
            <div className="label" style={{ marginBottom: 12 }}>{tUi('rec.confirmDelete', lang)}</div>
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
