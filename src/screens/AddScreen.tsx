import { useEffect, useState } from 'react'
import CurrencyToggle from '../components/CurrencyToggle.tsx'
import { showToast, triggerSaved } from '../lib/feedback.ts'
import { useWallet } from '../store/WalletProvider.tsx'
import { formatMoney } from '../domain/calculations.ts'
import { categoryLabel, colorClass, paymentSourceTitle, quickActionTitle, tEnum } from '../i18n/labels.ts'
import type { Currency } from '../types'
import type { UsedFor } from '../domain/types'

interface Props {
  active: boolean
  cur: Currency
  setCur: (c: Currency) => void
}

const USED_FOR: UsedFor[] = ['shared', 'hyeonsu', 'tanner']

export default function AddScreen({ active, cur, setCur }: Props) {
  const { db, lang, fxRate, defaultPaymentSourceId, addTransaction } = useWallet()

  const [raw, setRaw] = useState('')
  const [keypadOpen, setKeypadOpen] = useState(false)
  const [usedFor, setUsedFor] = useState<UsedFor>('shared')
  const [catId, setCatId] = useState<string | null>(null)
  const [paymentSourceId, setPaymentSourceId] = useState<string | null>(defaultPaymentSourceId)
  const [memo, setMemo] = useState('')

  // 결제통로 기본값이 정해지면(역할 기준) 채워준다.
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

  // 표시용 목록: 카테고리는 active만, 빠른버튼은 active를 sortOrder 순으로
  const activeCategories = db.categories.filter((c) => c.isActive !== false)
  const activeQuickActions = db.quickActions
    .filter((q) => q.isActive !== false)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  // 빠른 버튼: 금액·통화·카테고리·사용대상·결제통로·메모를 한 번에 채운다.
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
      showToast(lang === 'en' ? 'Enter an amount' : '금액을 입력해주세요')
      return
    }
    const ok = addTransaction({
      amountOriginal: n,
      currency: cur,
      categoryId: catId ?? 'other',
      usedFor,
      paymentSourceId: paymentSourceId ?? undefined,
      memo,
    })
    if (!ok) {
      showToast(lang === 'en' ? "Couldn't save" : '저장에 실패했어요')
      return
    }
    triggerSaved(lang === 'en' ? 'Saved' : '저장됐어요')
    resetInputs()
  }

  return (
    <section className={'screen' + (active ? ' active' : '')} id="add">
      <div className="stack">
        <div className="head">빠른 입력</div>
        <div className="gl pod">
          <div className="between" style={{ marginBottom: 2 }}>
            <span className="label">금액</span>
            <CurrencyToggle cur={cur} setCur={setCur} variant="text" />
          </div>
          <div className={'amount' + (n === 0 ? ' empty' : '')} onClick={() => setKeypadOpen((o) => !o)}>
            <span className="cur">{amtCur}</span>
            <span className="val num">{amtVal}</span>
          </div>
          <div className="hint">금액을 눌러 직접 입력</div>
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
          <div className="sect">자주 쓰는 항목</div>
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
          <div className="sect">카테고리</div>
          <div className="chips">
            {activeCategories.map((c) => (
              <button key={c.id} className={'chip' + (catId === c.id ? ' sel' : '')} onClick={() => setCatId(c.id)}>
                {categoryLabel(c.id, db.categories, lang)}
              </button>
            ))}
          </div>
        </div>

        <details className="gl details">
          <summary><span>자세히 입력하기</span><span className="muted">＋</span></summary>
          <div className="body">
            <div className="frow" style={{ display: 'block' }}>
              <span>결제 통로</span>
              <div className="chips" style={{ marginTop: 10 }}>
                {db.paymentSources.filter((p) => p.isActive !== false).map((p) => (
                  <button key={p.id} className={'chip' + (paymentSourceId === p.id ? ' sel' : '')} onClick={() => setPaymentSourceId(p.id)}>
                    {paymentSourceTitle(p, lang)}
                  </button>
                ))}
              </div>
            </div>
            <div className="frow"><span>날짜</span><span className="fv">오늘</span></div>
            <div className="frow"><span>메모</span><span className={'fv' + (memo ? '' : ' muted')}>{memo || '없음'}</span></div>
          </div>
        </details>

        <button className="btn block" onClick={save} style={{ padding: 16, fontSize: 16 }}>
          <span>저장</span>
        </button>
      </div>
    </section>
  )
}
