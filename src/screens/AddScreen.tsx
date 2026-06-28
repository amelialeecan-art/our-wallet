import { useEffect, useState } from 'react'
import CurrencyToggle from '../components/CurrencyToggle.tsx'
import { showToast, triggerSaved } from '../lib/feedback.ts'
import { useWallet } from '../store/WalletProvider.tsx'
import { formatMoney } from '../domain/calculations.ts'
import { accountTitle, categoryLabel, colorClass, paymentSourceTitle, quickActionTitle, tEnum, tUi } from '../i18n/labels.ts'
import type { Currency } from '../types'
import type { TransactionType, UsedFor } from '../domain/types'

interface Props {
  active: boolean
  cur: Currency
  setCur: (c: Currency) => void
}

const USED_FOR: UsedFor[] = ['shared', 'hyeonsu', 'tanner']
const TYPES: Extract<TransactionType, 'expense' | 'income' | 'transfer'>[] = ['expense', 'income', 'transfer']

export default function AddScreen({ active, cur, setCur }: Props) {
  const { db, lang, fxRate, defaultPaymentSourceId, addTransaction } = useWallet()

  const firstSpendable = db.accounts.find((a) => a.tier === 'spendable')?.id ?? db.accounts[0]?.id ?? ''
  const firstSaving = db.accounts.find((a) => a.tier === 'saving')?.id ?? db.accounts[0]?.id ?? ''

  const [txType, setTxType] = useState<'expense' | 'income' | 'transfer'>('expense')
  const [raw, setRaw] = useState('')
  const [keypadOpen, setKeypadOpen] = useState(false)
  const [usedFor, setUsedFor] = useState<UsedFor>('shared')
  const [catId, setCatId] = useState<string | null>(null)
  const [paymentSourceId, setPaymentSourceId] = useState<string | null>(defaultPaymentSourceId)
  const [depositId, setDepositId] = useState<string>(firstSpendable) // income 입금 계좌
  const [fromId, setFromId] = useState<string>(firstSpendable) // transfer 출발
  const [toId, setToId] = useState<string>(firstSaving) // transfer 도착
  const [memo, setMemo] = useState('')

  useEffect(() => {
    if (!paymentSourceId && defaultPaymentSourceId) setPaymentSourceId(defaultPaymentSourceId)
  }, [defaultPaymentSourceId, paymentSourceId])

  const n = raw === '' ? 0 : parseInt(raw, 10)
  const amtCur = cur === 'KRW' ? '₩' : '$'
  const amtVal = n.toLocaleString(cur === 'KRW' ? 'ko-KR' : 'en-US')

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

  const activeCategories = db.categories.filter((c) => c.isActive !== false)
  const activeQuickActions = db.quickActions
    .filter((q) => q.isActive !== false)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  function pickQuick(q: (typeof db.quickActions)[number]) {
    setRaw(String(q.amountOriginal))
    if (q.currency !== cur) setCur(q.currency)
    setCatId(q.categoryId)
    if (q.usedFor) setUsedFor(q.usedFor)
    if (q.paymentSourceId) setPaymentSourceId(q.paymentSourceId)
    setMemo(q.memo ?? quickActionTitle(q, lang))
    setKeypadOpen(false)
  }

  function resetInputs() {
    setRaw('')
    setMemo('')
    setCatId(null)
    setUsedFor('shared')
    setPaymentSourceId(defaultPaymentSourceId)
    setKeypadOpen(false)
  }

  function save() {
    if (n <= 0) {
      showToast(tUi('toast.enterAmount', lang))
      return
    }
    let input
    if (txType === 'income') {
      if (!depositId) { showToast(tUi('add.pickAccount', lang)); return }
      input = { type: 'income' as const, amountOriginal: n, currency: cur, categoryId: 'other', usedFor: 'shared' as const, toAccountId: depositId, memo }
    } else if (txType === 'transfer') {
      if (!fromId || !toId) { showToast(tUi('add.pickAccount', lang)); return }
      if (fromId === toId) { showToast(tUi('add.transferSame', lang)); return }
      input = { type: 'transfer' as const, amountOriginal: n, currency: cur, categoryId: 'other', usedFor: 'shared' as const, fromAccountId: fromId, toAccountId: toId, memo }
    } else {
      input = { type: 'expense' as const, amountOriginal: n, currency: cur, categoryId: catId ?? 'other', usedFor, paymentSourceId: paymentSourceId ?? undefined, memo }
    }
    if (!addTransaction(input)) {
      showToast(tUi('toast.saveFailed', lang))
      return
    }
    triggerSaved(tUi('toast.saved', lang))
    resetInputs()
  }

  const accountChips = (selected: string, onPick: (id: string) => void) => (
    <div className="chips">
      {db.accounts.map((a) => (
        <button key={a.id} className={'chip' + (selected === a.id ? ' sel' : '')} onClick={() => onPick(a.id)}>{accountTitle(a, lang)}</button>
      ))}
    </div>
  )

  return (
    <section className={'screen' + (active ? ' active' : '')} id="add">
      <div className="stack">
        <div className="head">{tUi('add.title', lang)}</div>

        <div className="seg3">
          {TYPES.map((t) => (
            <button key={t} className={txType === t ? 'sel us' : ''} onClick={() => setTxType(t)}>{tUi('add.type.' + t, lang)}</button>
          ))}
        </div>

        <div className="gl pod">
          <div className="between" style={{ marginBottom: 2 }}>
            <span className="label">{tUi('add.amount', lang)}</span>
            <CurrencyToggle cur={cur} setCur={setCur} variant="text" />
          </div>
          <div className={'amount' + (n === 0 ? ' empty' : '')} onClick={() => setKeypadOpen((o) => !o)}>
            <span className="cur">{amtCur}</span>
            <span className="val num">{amtVal}</span>
          </div>
          <div className="hint">{tUi('add.tapToEnter', lang)}</div>
          <div className={'keypad' + (keypadOpen ? '' : ' hidden')}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button key={d} onClick={() => pressKey(d)}>{d}</button>
            ))}
            <button onClick={() => pressKey('00')}>00</button>
            <button onClick={() => pressKey('0')}>0</button>
            <button onClick={() => pressKey('del')}>⌫</button>
          </div>
        </div>

        {txType === 'expense' && (
          <>
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
              <div className="sect">{tUi('add.frequent', lang)}</div>
              <div className="quick">
                {activeQuickActions.map((q) => (
                  <button key={q.id} className="gl qbtn" onClick={() => pickQuick(q)}>
                    <div className="qn">{quickActionTitle(q, lang)}</div>
                    <div className="qa num">{formatMoney(q.amountKrw, q.currency, fxRate)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="sect">{tUi('add.category', lang)}</div>
              <div className="chips">
                {activeCategories.map((c) => (
                  <button key={c.id} className={'chip' + (catId === c.id ? ' sel' : '')} onClick={() => setCatId(c.id)}>
                    {categoryLabel(c.id, db.categories, lang)}
                  </button>
                ))}
              </div>
            </div>

            <details className="gl details">
              <summary><span>{tUi('add.moreDetails', lang)}</span><span className="muted">＋</span></summary>
              <div className="body">
                <div className="frow" style={{ display: 'block' }}>
                  <span>{tUi('add.paidWith', lang)}</span>
                  <div className="chips" style={{ marginTop: 10 }}>
                    {db.paymentSources.filter((p) => p.isActive !== false).map((p) => (
                      <button key={p.id} className={'chip' + (paymentSourceId === p.id ? ' sel' : '')} onClick={() => setPaymentSourceId(p.id)}>
                        {paymentSourceTitle(p, lang)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="frow"><span>{tUi('add.date', lang)}</span><span className="fv">{tUi('common.today', lang)}</span></div>
                <div className="frow"><span>{tUi('add.memo', lang)}</span><span className={'fv' + (memo ? '' : ' muted')}>{memo || tUi('common.none', lang)}</span></div>
              </div>
            </details>
          </>
        )}

        {txType === 'income' && (
          <div>
            <div className="sect">{tUi('add.depositAccount', lang)}</div>
            {accountChips(depositId, setDepositId)}
          </div>
        )}

        {txType === 'transfer' && (
          <>
            <div>
              <div className="sect">{tUi('add.fromAccount', lang)}</div>
              {accountChips(fromId, setFromId)}
            </div>
            <div>
              <div className="sect">{tUi('add.toAccount', lang)}</div>
              {accountChips(toId, setToId)}
            </div>
          </>
        )}

        <button className="btn block" onClick={save} style={{ padding: 16, fontSize: 16 }}>
          <span>{tUi('common.save', lang)}</span>
        </button>
      </div>
    </section>
  )
}
