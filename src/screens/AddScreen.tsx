import { useState } from 'react'
import CurrencyToggle from '../components/CurrencyToggle.tsx'
import { showToast, triggerSaved } from '../lib/feedback.ts'
import { useWallet } from '../store/WalletProvider.tsx'
import { formatMoney } from '../domain/calculations.ts'
import { parseAmount, formatAmountDisplay, sanitizeAmountInput, convertRaw } from '../lib/amountInput.ts'
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

const amountInputStyle: React.CSSProperties = {
  border: 0,
  background: 'transparent',
  outline: 'none',
  font: 'inherit',
  fontSize: 44,
  fontWeight: 800,
  textAlign: 'center',
  minWidth: '1ch',
  color: 'var(--ink)',
  padding: 0,
}

// 가로 스크롤 칩 줄
const scrollRow: React.CSSProperties = { display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 2px', margin: '0 -2px' }
const chipNoWrap: React.CSSProperties = { flex: '0 0 auto', whiteSpace: 'nowrap' }

export default function AddScreen({ active, cur, setCur }: Props) {
  const { db, lang, fxRate, defaultPaymentSourceId, addTransaction, adjustAccountBalance } = useWallet()

  const firstSpendable = db.accounts.find((a) => a.tier === 'spendable')?.id ?? db.accounts[0]?.id ?? ''
  const firstSaving = db.accounts.find((a) => a.tier === 'saving')?.id ?? db.accounts[0]?.id ?? ''
  const activePayments = db.paymentSources.filter((p) => p.isActive !== false)

  const [mode, setMode] = useState<Mode>('expense')
  const [raw, setRaw] = useState('')
  const [usedFor, setUsedFor] = useState<UsedFor>('shared')
  const [catId, setCatId] = useState<string | null>(null)
  const [paymentSourceId, setPaymentSourceId] = useState<string | null>(defaultPaymentSourceId)
  const [depositId, setDepositId] = useState<string>(firstSpendable)
  const [fromId, setFromId] = useState<string>(firstSpendable)
  const [toId, setToId] = useState<string>(firstSaving)
  const [adjustId, setAdjustId] = useState<string>(firstSpendable)
  const [memo, setMemo] = useState('')
  // 과거 입력(옵션): 빈 값이면 오늘. 지출/수입/이체에만 적용.
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState('')

  const adjustAcc = db.accounts.find((a) => a.id === adjustId)
  const inputCur: Currency = mode === 'adjust' ? (adjustAcc?.currency ?? 'KRW') : cur
  const n = parseAmount(raw)
  const amtCur = inputCur === 'KRW' ? '₩' : '$'

  const selectedPs = activePayments.find((p) => p.id === paymentSourceId) ?? activePayments.find((p) => p.id === defaultPaymentSourceId) ?? activePayments[0]
  const settlement = selectedPs?.settlementType ?? 'immediate'
  const settleHint = settlement === 'deferred' ? 'add.payDeferred' : settlement === 'none' ? 'add.payNone' : 'add.payImmediate'

  function changeCur(next: Currency) {
    if (next === cur) return
    setRaw((prev) => convertRaw(prev, cur, next, fxRate))
    setCur(next)
  }

  function switchMode(m: Mode) {
    setMode(m)
    setRaw('')
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
  }

  function resetInputs() {
    setRaw('')
    setMemo('')
    setCatId(null)
    setUsedFor('shared')
    setPaymentSourceId(defaultPaymentSourceId)
    setDate('')
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
    const onDate = date || undefined // 빈 값이면 오늘(생성 함수 기본값)
    let input
    if (mode === 'income') {
      if (!depositId) { showToast(tUi('add.pickAccount', lang)); return }
      input = { type: 'income' as const, amountOriginal: n, currency: cur, categoryId: 'other', usedFor: 'shared' as const, toAccountId: depositId, memo, date: onDate }
    } else if (mode === 'transfer') {
      if (!fromId || !toId) { showToast(tUi('add.pickAccount', lang)); return }
      if (fromId === toId) { showToast(tUi('add.transferSame', lang)); return }
      input = { type: 'transfer' as const, amountOriginal: n, currency: cur, categoryId: 'other', usedFor: 'shared' as const, fromAccountId: fromId, toAccountId: toId, memo, date: onDate }
    } else {
      if (!selectedPs) { showToast(tUi('add.noPayment', lang)); return }
      input = { type: 'expense' as const, amountOriginal: n, currency: cur, categoryId: catId ?? 'other', usedFor, paymentSourceId: selectedPs.id, memo, date: onDate }
    }
    if (!addTransaction(input)) {
      showToast(tUi('toast.saveFailed', lang))
      return
    }
    triggerSaved(tUi('toast.saved', lang))
    resetInputs()
  }

  const accountChips = (selected: string, onPick: (id: string) => void) => (
    <div style={scrollRow}>
      {db.accounts.map((a) => (
        <button key={a.id} className={'chip' + (selected === a.id ? ' sel' : '')} style={chipNoWrap} onClick={() => onPick(a.id)}>{accountChipLabel(a, lang)}</button>
      ))}
    </div>
  )

  return (
    <section className={'screen' + (active ? ' active' : '')} id="add">
      <div className="stack" style={{ paddingBottom: 4 }}>
        <div className="head">{tUi('add.title', lang)}</div>

        <div className="seg3">
          {MODES.map((m) => (
            <button key={m} className={mode === m ? 'sel us' : ''} onClick={() => switchMode(m)}>{tUi('add.type.' + m, lang)}</button>
          ))}
        </div>

        {/* 금액 */}
        <div className="gl pod">
          <div className="between" style={{ marginBottom: 2 }}>
            <span className="label">{mode === 'adjust' ? tUi('add.actualBalance', lang) : tUi('add.amount', lang)}</span>
            {mode !== 'adjust' && <CurrencyToggle cur={cur} setCur={changeCur} variant="text" />}
          </div>
          <div className="amount" style={{ cursor: 'text' }}>
            <span className="cur">{amtCur}</span>
            <input
              className="num"
              inputMode="decimal"
              value={raw}
              placeholder="0"
              size={Math.max(1, raw.length)}
              onChange={(e) => setRaw(sanitizeAmountInput(e.target.value, inputCur))}
              style={amountInputStyle}
            />
          </div>
          <div className="hint">{n > 0 ? `${amtCur}${formatAmountDisplay(raw, inputCur)}` : tUi('add.enterAmountHint', lang)}</div>
        </div>

        {/* 지출: 결제통로 먼저 */}
        {mode === 'expense' && (
          <>
            <div>
              <div className="sect">{tUi('add.paidWith', lang)}</div>
              {activePayments.length === 0 ? (
                <div className="cap">{tUi('add.noPayment', lang)}</div>
              ) : (
                <>
                  <div style={scrollRow}>
                    {activePayments.map((p) => (
                      <button key={p.id} className={'chip' + (selectedPs?.id === p.id ? ' sel' : '')} style={chipNoWrap} onClick={() => setPaymentSourceId(p.id)}>{paymentSourceTitle(p, lang)}</button>
                    ))}
                  </div>
                  <div className="cap" style={{ padding: '0 6px' }}>{tUi(settleHint, lang)}</div>
                </>
              )}
            </div>

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

        {/* 저장 버튼: 일반 흐름 — 필수 항목 바로 아래 */}
        <button className="btn block" onClick={save} style={{ padding: 16, fontSize: 16 }}>
          <span>{mode === 'adjust' ? tUi('balance.save', lang) : tUi('common.save', lang)}</span>
        </button>

        {/* 과거 입력 옵션 (저장 아래 접힘). 잔액 맞추기는 제외 */}
        {mode !== 'adjust' && (
          <details className="gl details">
            <summary><span>{tUi('add.pastDate', lang)}</span><span className="muted">＋</span></summary>
            <div className="body">
              <div className="sect" style={{ paddingTop: 4 }}>{tUi('add.memo', lang)}</div>
              <input
                type="text"
                value={memo}
                placeholder={tUi('add.memoPlaceholder', lang)}
                onChange={(e) => setMemo(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', font: 'inherit', border: 0, borderRadius: 12, padding: '10px 12px', background: 'rgba(255,255,255,.45)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.35)', color: 'var(--ink)' }}
              />
              <div className="sect" style={{ paddingTop: 12 }}>{tUi('add.date', lang)}</div>
              <input
                type="date"
                value={date || today}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                style={{ font: 'inherit', border: 0, borderRadius: 12, padding: '10px 12px', background: 'rgba(255,255,255,.45)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.35)', color: 'var(--ink)' }}
              />
            </div>
          </details>
        )}

        {/* 자주 쓰는 항목 (저장 아래 접힘) */}
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
