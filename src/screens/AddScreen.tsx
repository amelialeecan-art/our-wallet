import { useState } from 'react'
import CurrencyToggle from '../components/CurrencyToggle.tsx'
import { showToast, triggerSaved } from '../lib/feedback.ts'
import { useWallet } from '../store/WalletProvider.tsx'
import { formatMoney } from '../domain/calculations.ts'
import { parseAmount, formatAmountDisplay, pressAmountKey, convertRaw } from '../lib/amountInput.ts'
import { accountChipLabel, categoryLabel, colorClass, paymentSourceTitle, quickActionTitle, tEnum, tUi } from '../i18n/labels.ts'
import type { Currency } from '../types'
import type { UsedFor } from '../domain/types'

interface Props {
  active: boolean
  cur: Currency
  setCur: (c: Currency) => void
}

type Mode = 'expense' | 'income' | 'transfer' | 'adjust'
const MODES: Mode[] = ['expense', 'income', 'transfer', 'adjust']
const USED_FOR: UsedFor[] = ['shared', 'hyeonsu', 'tanner']

export default function AddScreen({ active, cur, setCur }: Props) {
  const { db, lang, fxRate, defaultPaymentSourceId, addTransaction, adjustAccountBalance } = useWallet()

  const firstSpendable = db.accounts.find((a) => a.tier === 'spendable')?.id ?? db.accounts[0]?.id ?? ''
  const firstSaving = db.accounts.find((a) => a.tier === 'saving')?.id ?? db.accounts[0]?.id ?? ''

  const [mode, setMode] = useState<Mode>('expense')
  const [raw, setRaw] = useState('')
  const [keypadOpen, setKeypadOpen] = useState(false)
  const [usedFor, setUsedFor] = useState<UsedFor>('shared')
  const [catId, setCatId] = useState<string | null>(null)
  const [paymentSourceId, setPaymentSourceId] = useState<string | null>(defaultPaymentSourceId)
  const [depositId, setDepositId] = useState<string>(firstSpendable)
  const [fromId, setFromId] = useState<string>(firstSpendable)
  const [toId, setToId] = useState<string>(firstSaving)
  const [adjustId, setAdjustId] = useState<string>(firstSpendable)
  const [memo, setMemo] = useState('')

  // 잔액 맞추기 모드는 선택 계좌 통화로 입력, 그 외는 표시통화(cur)
  const adjustAcc = db.accounts.find((a) => a.id === adjustId)
  const inputCur: Currency = mode === 'adjust' ? (adjustAcc?.currency ?? 'KRW') : cur

  const n = parseAmount(raw)
  const amtCur = inputCur === 'KRW' ? '₩' : '$'
  const amtVal = formatAmountDisplay(raw, inputCur)

  function pressKey(k: string) {
    setRaw((prev) => pressAmountKey(prev, k, inputCur))
  }

  // 통화 토글: 입력값을 환산해서 바꾼다 (1500 KRW = 1 USD)
  function changeCur(next: Currency) {
    if (next === cur) return
    setRaw((prev) => convertRaw(prev, cur, next, fxRate))
    setCur(next)
  }

  function switchMode(m: Mode) {
    setMode(m)
    setRaw('')
    setKeypadOpen(false)
  }

  const activeQuickActions = db.quickActions
    .filter((q) => q.isActive !== false)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  function pickQuick(q: (typeof db.quickActions)[number]) {
    setRaw(q.currency === cur ? String(q.amountOriginal) : convertRaw(String(q.amountOriginal), q.currency, cur, fxRate))
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
    if (mode === 'adjust') {
      if (!adjustId) { showToast(tUi('add.pickAccount', lang)); return }
      if (!adjustAccountBalance(adjustId, n)) { showToast(tUi('toast.saveFailed', lang)); return }
      triggerSaved(tUi('balance.matched', lang))
      setRaw('')
      return
    }
    let input
    if (mode === 'income') {
      if (!depositId) { showToast(tUi('add.pickAccount', lang)); return }
      input = { type: 'income' as const, amountOriginal: n, currency: cur, categoryId: 'other', usedFor: 'shared' as const, toAccountId: depositId, memo }
    } else if (mode === 'transfer') {
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
        <button key={a.id} className={'chip' + (selected === a.id ? ' sel' : '')} onClick={() => onPick(a.id)}>{accountChipLabel(a, lang)}</button>
      ))}
    </div>
  )

  return (
    <section className={'screen' + (active ? ' active' : '')} id="add">
      <div className="stack">
        <div className="head">{tUi('add.title', lang)}</div>

        <div className="seg3">
          {MODES.map((m) => (
            <button key={m} className={mode === m ? 'sel us' : ''} onClick={() => switchMode(m)}>{tUi('add.type.' + m, lang)}</button>
          ))}
        </div>

        <div className="gl pod">
          <div className="between" style={{ marginBottom: 2 }}>
            <span className="label">{mode === 'adjust' ? tUi('add.actualBalance', lang) : tUi('add.amount', lang)}</span>
            {mode !== 'adjust' && <CurrencyToggle cur={cur} setCur={changeCur} variant="text" />}
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
            {inputCur === 'USD' ? <button onClick={() => pressKey('.')}>.</button> : <button onClick={() => pressKey('00')}>00</button>}
            <button onClick={() => pressKey('0')}>0</button>
            <button onClick={() => pressKey('del')}>⌫</button>
          </div>
        </div>

        {mode === 'expense' && (
          <>
            <div>
              <div className="sect">{tUi('add.forWhom', lang)}</div>
              <div className="seg3" id="who">
                {USED_FOR.map((v) => (
                  <button key={v} className={usedFor === v ? 'sel ' + colorClass(v) : ''} onClick={() => setUsedFor(v)}>{tEnum('usedFor', v, lang)}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="sect">{tUi('add.category', lang)}</div>
              <div className="chips">
                {db.categories.filter((c) => c.isActive !== false).map((c) => (
                  <button key={c.id} className={'chip' + (catId === c.id ? ' sel' : '')} onClick={() => setCatId(c.id)}>{categoryLabel(c.id, db.categories, lang)}</button>
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
                      <button key={p.id} className={'chip' + (paymentSourceId === p.id ? ' sel' : '')} onClick={() => setPaymentSourceId(p.id)}>{paymentSourceTitle(p, lang)}</button>
                    ))}
                  </div>
                </div>
              </div>
            </details>
          </>
        )}

        {mode === 'income' && (
          <div>
            <div className="sect">{tUi('add.depositAccount', lang)}</div>
            {accountChips(depositId, setDepositId)}
          </div>
        )}

        {mode === 'transfer' && (
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

        {mode === 'adjust' && (
          <div>
            <div className="sect">{tUi('add.account', lang)}</div>
            {accountChips(adjustId, setAdjustId)}
          </div>
        )}

        <button className="btn block" onClick={save} style={{ padding: 16, fontSize: 16 }}>
          <span>{mode === 'adjust' ? tUi('balance.save', lang) : tUi('common.save', lang)}</span>
        </button>

        {/* 자주 쓰는 항목: 접힌 상태, 저장보다 아래 */}
        {mode === 'expense' && activeQuickActions.length > 0 && (
          <details className="gl details">
            <summary><span>{tUi('add.quick', lang)}</span><span className="muted">＋</span></summary>
            <div className="body">
              <div className="quick" style={{ marginTop: 4 }}>
                {activeQuickActions.map((q) => (
                  <button key={q.id} className="gl qbtn" onClick={() => pickQuick(q)}>
                    <div className="qn">{quickActionTitle(q, lang)}</div>
                    <div className="qa num">{formatMoney(q.amountKrw, q.currency, fxRate)}</div>
                  </button>
                ))}
              </div>
            </div>
          </details>
        )}
      </div>
    </section>
  )
}
