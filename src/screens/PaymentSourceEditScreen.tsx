import { useState } from 'react'
import CurrencyToggle from '../components/CurrencyToggle.tsx'
import { showToast, triggerSaved } from '../lib/feedback.ts'
import { useWallet } from '../store/WalletProvider.tsx'
import { accountTitle, colorClass, tEnum } from '../i18n/labels.ts'
import type { Currency } from '../types'
import type { HolderLabel, PaymentKind } from '../domain/types'

interface Props {
  active: boolean
  paymentSourceId: string | null // null이면 새 결제통로
  onDone: () => void
}

const HOLDERS: HolderLabel[] = ['shared', 'hyeonsu', 'tanner']
const KINDS: PaymentKind[] = ['card', 'account', 'cash']

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
  const [isActive, setIsActive] = useState<boolean>(existing?.isActive ?? true)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!isNew && !existing) {
    return (
      <section className={'screen' + (active ? ' active' : '')} id="paymentSourceEdit">
        <div className="stack">
          <div className="between" style={{ padding: '0 4px' }}>
            <div className="head" style={{ padding: 0 }}>결제통로 수정</div>
            <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={onDone}>닫기</span>
          </div>
          <div className="cap">결제통로를 찾을 수 없어요</div>
        </div>
      </section>
    )
  }

  function save() {
    if (!nameKo.trim()) {
      showToast('결제통로 이름을 입력해주세요')
      return
    }
    const input = { nameKo, nameEn, kind, holder, currency, linkedAccountId: linkedAccountId || undefined, isActive }
    const ok = isNew ? addPaymentSource(input) : updatePaymentSource(paymentSourceId!, input)
    if (!ok) {
      showToast('저장에 실패했어요')
      return
    }
    triggerSaved(isNew ? '추가됐어요' : '수정됐어요')
    onDone()
  }

  function doDelete() {
    const res = deletePaymentSource(paymentSourceId!)
    if (res === 'deleted') {
      showToast('삭제됐어요')
      onDone()
    } else if (res === 'used-in-tx') {
      showToast('이 결제통로를 쓰는 거래가 있어 삭제할 수 없어요')
      setConfirmDelete(false)
    } else if (res === 'is-default') {
      showToast('기본 결제통로라 삭제할 수 없어요')
      setConfirmDelete(false)
    } else {
      showToast('삭제에 실패했어요')
      setConfirmDelete(false)
    }
  }

  return (
    <section className={'screen' + (active ? ' active' : '')} id="paymentSourceEdit">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>{isNew ? '결제통로 추가' : '결제통로 수정'}</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={onDone}>닫기</span>
        </div>

        <div className="gl pod">
          <div className="frow"><span>이름</span><input type="text" value={nameKo} placeholder="예: 현수카드" onChange={(e) => setNameKo(e.target.value)} style={inputStyle} /></div>
          <div className="frow"><span>English</span><input type="text" value={nameEn} placeholder="e.g. Hyeonsu Card" onChange={(e) => setNameEn(e.target.value)} style={inputStyle} /></div>
        </div>

        <div>
          <div className="sect">종류</div>
          <div className="seg3">
            {KINDS.map((k) => (
              <button key={k} className={kind === k ? 'sel us' : ''} onClick={() => setKind(k)}>{tEnum('paymentKind', k, lang)}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="sect">통로 위치</div>
          <div className="seg3">
            {HOLDERS.map((h) => (
              <button key={h} className={holder === h ? 'sel ' + colorClass(h) : ''} onClick={() => setHolder(h)}>{tEnum('usedFor', h, lang)}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="sect">연결 계좌 (선택)</div>
          <div className="chips">
            <button className={'chip' + (linkedAccountId === '' ? ' sel' : '')} onClick={() => setLinkedAccountId('')}>없음</button>
            {db.accounts.map((a) => (
              <button key={a.id} className={'chip' + (linkedAccountId === a.id ? ' sel' : '')} onClick={() => setLinkedAccountId(a.id)}>{accountTitle(a, lang)}</button>
            ))}
          </div>
        </div>

        <div className="gl pod">
          <div className="between" style={{ marginBottom: 10 }}>
            <span className="label">통화</span>
            <CurrencyToggle cur={currency} setCur={setCurrency} variant="text" />
          </div>
          <div className="between">
            <span className="label">입력 목록에 표시</span>
            <div className="seg">
              <button className={isActive ? 'on' : ''} onClick={() => setIsActive(true)}>표시</button>
              <button className={!isActive ? 'on' : ''} onClick={() => setIsActive(false)}>숨김</button>
            </div>
          </div>
        </div>

        <button className="btn block" onClick={save} style={{ padding: 16, fontSize: 16 }}><span>저장</span></button>

        {!isNew && (!confirmDelete ? (
          <div className="cap" style={{ textAlign: 'center', cursor: 'pointer', color: '#cf743d' }} onClick={() => setConfirmDelete(true)}>이 결제통로 삭제</div>
        ) : (
          <div className="gl pod" style={{ textAlign: 'center' }}>
            <div className="label" style={{ marginBottom: 12 }}>이 결제통로를 삭제할까요?</div>
            <div className="seg3">
              <button onClick={() => setConfirmDelete(false)}>취소</button>
              <button className="sel ta" style={{ color: '#cf743d' }} onClick={doDelete}>삭제</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
