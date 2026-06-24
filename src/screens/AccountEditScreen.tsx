import { useState } from 'react'
import CurrencyToggle from '../components/CurrencyToggle.tsx'
import { showToast, triggerSaved } from '../lib/feedback.ts'
import { useWallet } from '../store/WalletProvider.tsx'
import { colorClass, tEnum } from '../i18n/labels.ts'
import type { Currency } from '../types'
import type { AccountKind, AssetTier, HolderLabel } from '../domain/types'

interface Props {
  active: boolean
  accountId: string | null // null이면 새 계좌
  onDone: () => void
}

const HOLDERS: HolderLabel[] = ['shared', 'hyeonsu', 'tanner']
const KINDS: AccountKind[] = ['cash', 'checking', 'savings', 'deposit', 'installment', 'investment', 'other']

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

export default function AccountEditScreen({ active, accountId, onDone }: Props) {
  const { db, lang, addAccount, updateAccount, deleteAccount } = useWallet()
  const existing = accountId ? db.accounts.find((a) => a.id === accountId) : undefined
  const isNew = !accountId

  const [nameKo, setNameKo] = useState(existing?.nameKo ?? '')
  const [nameEn, setNameEn] = useState(existing?.nameEn ?? '')
  const [holder, setHolder] = useState<HolderLabel>(existing?.holder ?? 'shared')
  const [kind, setKind] = useState<AccountKind>(existing?.kind ?? 'deposit')
  const [tier, setTier] = useState<AssetTier>(existing?.tier ?? 'spendable')
  const [currency, setCurrency] = useState<Currency>(existing?.currency ?? 'KRW')
  const [balance, setBalance] = useState(existing ? String(existing.balanceOriginal) : '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!isNew && !existing) {
    return (
      <section className={'screen' + (active ? ' active' : '')} id="accountEdit">
        <div className="stack">
          <div className="between" style={{ padding: '0 4px' }}>
            <div className="head" style={{ padding: 0 }}>계좌 수정</div>
            <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={onDone}>닫기</span>
          </div>
          <div className="cap">계좌를 찾을 수 없어요</div>
        </div>
      </section>
    )
  }

  function save() {
    if (!nameKo.trim()) {
      showToast('계좌 이름을 입력해주세요')
      return
    }
    const num = balance === '' ? 0 : Number(balance)
    if (!Number.isFinite(num) || num < 0) {
      showToast('잔액을 올바르게 입력해주세요')
      return
    }
    const input = { nameKo, nameEn, holder, kind, tier, currency, balanceOriginal: num }
    const ok = isNew ? addAccount(input) : updateAccount(accountId!, input)
    if (!ok) {
      showToast('저장에 실패했어요')
      return
    }
    triggerSaved(isNew ? '추가됐어요' : '수정됐어요')
    onDone()
  }

  function doDelete() {
    const res = deleteAccount(accountId!)
    if (res === 'deleted') {
      showToast('삭제됐어요')
      onDone()
    } else if (res === 'linked-payment') {
      showToast('이 계좌를 쓰는 결제통로가 있어 삭제할 수 없어요')
      setConfirmDelete(false)
    } else if (res === 'used-in-tx') {
      showToast('이 계좌를 쓰는 거래가 있어 삭제할 수 없어요')
      setConfirmDelete(false)
    } else {
      showToast('삭제에 실패했어요')
      setConfirmDelete(false)
    }
  }

  return (
    <section className={'screen' + (active ? ' active' : '')} id="accountEdit">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>{isNew ? '계좌 추가' : '계좌 수정'}</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={onDone}>닫기</span>
        </div>

        <div className="gl pod">
          <div className="frow"><span>이름</span><input type="text" value={nameKo} placeholder="예: 현수 계좌" onChange={(e) => setNameKo(e.target.value)} style={inputStyle} /></div>
          <div className="frow"><span>English</span><input type="text" value={nameEn} placeholder="e.g. Hyeonsu Account" onChange={(e) => setNameEn(e.target.value)} style={inputStyle} /></div>
        </div>

        <div>
          <div className="sect">보관 위치</div>
          <div className="seg3">
            {HOLDERS.map((h) => (
              <button key={h} className={holder === h ? 'sel ' + colorClass(h) : ''} onClick={() => setHolder(h)}>{tEnum('usedFor', h, lang)}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="sect">종류</div>
          <div className="chips">
            {KINDS.map((k) => (
              <button key={k} className={'chip' + (kind === k ? ' sel' : '')} onClick={() => setKind(k)}>{tEnum('accountKind', k, lang)}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="sect">자산 구분</div>
          <div className="seg3">
            <button className={tier === 'spendable' ? 'sel us' : ''} onClick={() => setTier('spendable')}>쓸 수 있는 돈</button>
            <button className={tier === 'saving' ? 'sel ta' : ''} onClick={() => setTier('saving')}>모으는·불리는 돈</button>
          </div>
        </div>

        <div className="gl pod">
          <div className="between" style={{ marginBottom: 10 }}>
            <span className="label">통화</span>
            <CurrencyToggle cur={currency} setCur={setCurrency} variant="text" />
          </div>
          <div className="frow"><span>잔액 ({currency})</span><input type="number" inputMode="numeric" min={0} value={balance} placeholder="0" onChange={(e) => setBalance(e.target.value)} style={inputStyle} /></div>
          {currency === 'USD' && <div className="cap">고정환율 1 USD = ₩1,500 기준으로 환산돼요</div>}
        </div>

        <button className="btn block" onClick={save} style={{ padding: 16, fontSize: 16 }}><span>저장</span></button>

        {!isNew && (!confirmDelete ? (
          <div className="cap" style={{ textAlign: 'center', cursor: 'pointer', color: '#cf743d' }} onClick={() => setConfirmDelete(true)}>이 계좌 삭제</div>
        ) : (
          <div className="gl pod" style={{ textAlign: 'center' }}>
            <div className="label" style={{ marginBottom: 12 }}>이 계좌를 삭제할까요?</div>
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
