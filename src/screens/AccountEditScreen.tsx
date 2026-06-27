import { useState } from 'react'
import CurrencyToggle from '../components/CurrencyToggle.tsx'
import { showToast, triggerSaved } from '../lib/feedback.ts'
import { useWallet } from '../store/WalletProvider.tsx'
import { colorClass, tEnum, tUi } from '../i18n/labels.ts'
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
            <div className="head" style={{ padding: 0 }}>{tUi('acc.editTitle', lang)}</div>
            <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={onDone}>{tUi('common.close', lang)}</span>
          </div>
          <div className="cap">{tUi('acc.notFound', lang)}</div>
        </div>
      </section>
    )
  }

  function save() {
    if (!nameKo.trim()) {
      showToast(tUi('acc.nameRequired', lang))
      return
    }
    const num = balance === '' ? 0 : Number(balance)
    if (!Number.isFinite(num) || num < 0) {
      showToast(tUi('acc.balanceInvalid', lang))
      return
    }
    const input = { nameKo, nameEn, holder, kind, tier, currency, balanceOriginal: num }
    const ok = isNew ? addAccount(input) : updateAccount(accountId!, input)
    if (!ok) {
      showToast(tUi('toast.saveFailed', lang))
      return
    }
    triggerSaved(isNew ? tUi('toast.added', lang) : tUi('toast.updated', lang))
    onDone()
  }

  function doDelete() {
    const res = deleteAccount(accountId!)
    if (res === 'deleted') {
      showToast(tUi('toast.deleted', lang))
      onDone()
    } else if (res === 'linked-payment') {
      showToast(tUi('acc.blockedPayment', lang))
      setConfirmDelete(false)
    } else if (res === 'used-in-tx') {
      showToast(tUi('acc.blockedTx', lang))
      setConfirmDelete(false)
    } else {
      showToast(tUi('toast.deleteFailed', lang))
      setConfirmDelete(false)
    }
  }

  return (
    <section className={'screen' + (active ? ' active' : '')} id="accountEdit">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>{isNew ? tUi('acc.addTitle', lang) : tUi('acc.editTitle', lang)}</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={onDone}>{tUi('common.close', lang)}</span>
        </div>

        <div className="gl pod">
          <div className="frow"><span>{tUi('acc.name', lang)}</span><input type="text" value={nameKo} placeholder={lang === 'ko' ? '예: 현수 계좌' : 'e.g. Hyeonsu Account'} onChange={(e) => setNameKo(e.target.value)} style={inputStyle} /></div>
          <div className="frow"><span>English</span><input type="text" value={nameEn} placeholder="e.g. Hyeonsu Account" onChange={(e) => setNameEn(e.target.value)} style={inputStyle} /></div>
        </div>

        <div>
          <div className="sect">{tUi('acc.holder', lang)}</div>
          <div className="seg3">
            {HOLDERS.map((h) => (
              <button key={h} className={holder === h ? 'sel ' + colorClass(h) : ''} onClick={() => setHolder(h)}>{tEnum('usedFor', h, lang)}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="sect">{tUi('acc.kind', lang)}</div>
          <div className="chips">
            {KINDS.map((k) => (
              <button key={k} className={'chip' + (kind === k ? ' sel' : '')} onClick={() => setKind(k)}>{tEnum('accountKind', k, lang)}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="sect">{tUi('acc.tier', lang)}</div>
          <div className="seg3">
            <button className={tier === 'spendable' ? 'sel us' : ''} onClick={() => setTier('spendable')}>{tUi('acc.tier.spendable', lang)}</button>
            <button className={tier === 'saving' ? 'sel ta' : ''} onClick={() => setTier('saving')}>{tUi('acc.tier.saving', lang)}</button>
          </div>
        </div>

        <div className="gl pod">
          <div className="between" style={{ marginBottom: 10 }}>
            <span className="label">{tUi('acc.currency', lang)}</span>
            <CurrencyToggle cur={currency} setCur={setCurrency} variant="text" />
          </div>
          <div className="frow"><span>{tUi('acc.balance', lang)} ({currency})</span><input type="number" inputMode="numeric" min={0} value={balance} placeholder="0" onChange={(e) => setBalance(e.target.value)} style={inputStyle} /></div>
          {currency === 'USD' && <div className="cap">{tUi('acc.usdNote', lang)}</div>}
        </div>

        <button className="btn block" onClick={save} style={{ padding: 16, fontSize: 16 }}><span>{tUi('common.save', lang)}</span></button>

        {!isNew && (!confirmDelete ? (
          <div className="cap" style={{ textAlign: 'center', cursor: 'pointer', color: '#cf743d' }} onClick={() => setConfirmDelete(true)}>{tUi('acc.deleteOne', lang)}</div>
        ) : (
          <div className="gl pod" style={{ textAlign: 'center' }}>
            <div className="label" style={{ marginBottom: 12 }}>{tUi('acc.confirmDelete', lang)}</div>
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
