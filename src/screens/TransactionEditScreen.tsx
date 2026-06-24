import { useState } from 'react'
import CurrencyToggle from '../components/CurrencyToggle.tsx'
import { showToast, triggerSaved } from '../lib/feedback.ts'
import { useWallet } from '../store/WalletProvider.tsx'
import { colorClass, paymentSourceTitle, tEnum } from '../i18n/labels.ts'
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
            <div className="head" style={{ padding: 0 }}>거래 수정</div>
            <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={onDone}>닫기</span>
          </div>
          <div className="cap">기록을 찾을 수 없어요</div>
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
      showToast(lang === 'en' ? 'Enter an amount' : '금액을 입력해주세요')
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
      showToast(lang === 'en' ? "Couldn't save" : '저장에 실패했어요')
      return
    }
    triggerSaved(lang === 'en' ? 'Updated' : '수정됐어요')
    onDone()
  }

  function doDelete() {
    const ok = deleteTransaction(tx!.id)
    showToast(ok ? (lang === 'en' ? 'Deleted' : '삭제됐어요') : (lang === 'en' ? "Couldn't delete" : '삭제에 실패했어요'))
    onDone()
  }

  return (
    <section className={'screen' + (active ? ' active' : '')} id="txedit">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>거래 수정</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={onDone}>닫기</span>
        </div>

        <div className="gl pod">
          <div className="between" style={{ marginBottom: 2 }}>
            <span className="label">금액</span>
            <CurrencyToggle cur={currency} setCur={setCurrency} variant="text" />
          </div>
          <div className={'amount' + (n === 0 ? ' empty' : '')} onClick={() => setKeypadOpen((o) => !o)}>
            <span className="cur">{amtCur}</span>
            <span className="val num">{amtVal}</span>
          </div>
          <div className="hint">금액을 눌러 수정</div>
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
          <div className="sect">사용대상</div>
          <div className="seg3" id="who">
            {USED_FOR.map((v) => (
              <button key={v} className={usedFor === v ? 'sel ' + colorClass(v) : ''} onClick={() => setUsedFor(v)}>
                {tEnum('usedFor', v, lang)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="sect">카테고리</div>
          <div className="chips">
            {db.categories.map((c) => (
              <button key={c.id} className={'chip' + (catId === c.id ? ' sel' : '')} onClick={() => setCatId(c.id)}>
                {tEnum('category', c.id, lang)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="sect">결제 통로</div>
          <div className="chips">
            {db.paymentSources.map((p) => (
              <button key={p.id} className={'chip' + (paymentSourceId === p.id ? ' sel' : '')} onClick={() => setPaymentSourceId(p.id)}>
                {paymentSourceTitle(p, lang)}
              </button>
            ))}
          </div>
        </div>

        <div className="gl pod">
          <div className="frow"><span>날짜</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} /></div>
          <div className="frow"><span>메모</span><input type="text" value={memo} placeholder="없음" onChange={(e) => setMemo(e.target.value)} style={{ ...inputStyle, width: '60%' }} /></div>
        </div>

        <button className="btn block" onClick={save} style={{ padding: 16, fontSize: 16 }}><span>저장</span></button>

        {!confirmDelete ? (
          <div className="cap" style={{ textAlign: 'center', cursor: 'pointer', color: '#cf743d' }} onClick={() => setConfirmDelete(true)}>
            이 기록 삭제
          </div>
        ) : (
          <div className="gl pod" style={{ textAlign: 'center' }}>
            <div className="label" style={{ marginBottom: 12 }}>이 기록을 삭제할까요?</div>
            <div className="seg3">
              <button onClick={() => setConfirmDelete(false)}>취소</button>
              <button className="sel ta" style={{ color: '#cf743d' }} onClick={doDelete}>삭제</button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
