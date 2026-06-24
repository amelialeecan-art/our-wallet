import { useState } from 'react'
import CurrencyToggle from '../components/CurrencyToggle.jsx'
import { triggerSaved } from '../lib/feedback.js'

const QUICK = [
  { name: '점심', amt: 12000, cat: '식비' },
  { name: '카페', amt: 6000, cat: '카페' },
  { name: '지하철', amt: 1500, cat: '교통' },
  { name: '쿠팡', amt: 25000, cat: '쇼핑' },
  { name: '태너 간식', amt: 10000, cat: '식비', who: 'ta' },
  { name: '데이트 식비', amt: 50000, cat: '데이트' },
]
const CATS = ['식비', '카페', '교통', '데이트', '쇼핑', '집/생활', '기타']

export default function AddScreen({ active, cur, setCur }) {
  const [raw, setRaw] = useState('')
  const [keypadOpen, setKeypadOpen] = useState(false)
  const [who, setWho] = useState('us')
  const [cat, setCat] = useState(null)

  const n = raw === '' ? 0 : parseInt(raw, 10)
  const amtCur = cur === 'KRW' ? '₩' : '$'
  const amtVal = n.toLocaleString(cur === 'KRW' ? 'ko-KR' : 'en-US')

  function pressKey(k) {
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

  function pickQuick(q) {
    setRaw(String(q.amt))
    setCat(q.cat)
    if (q.who) setWho(q.who)
    setKeypadOpen(false)
  }

  function save() {
    triggerSaved()
    setRaw('')
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
            <button className={who === 'us' ? 'sel us' : ''} onClick={() => setWho('us')}>우리</button>
            <button className={who === 'hy' ? 'sel hy' : ''} onClick={() => setWho('hy')}>현수</button>
            <button className={who === 'ta' ? 'sel ta' : ''} onClick={() => setWho('ta')}>태너</button>
          </div>
        </div>

        <div>
          <div className="sect">자주 쓰는 항목</div>
          <div className="quick">
            {QUICK.map((q) => (
              <button key={q.name} className="gl qbtn" onClick={() => pickQuick(q)}>
                <div className="qn">{q.name}</div>
                <div className="qa num">₩{q.amt.toLocaleString('ko-KR')}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="sect">카테고리</div>
          <div className="chips">
            {CATS.map((c) => (
              <button key={c} className={'chip' + (cat === c ? ' sel' : '')} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
        </div>

        <details className="gl details">
          <summary><span>자세히 입력하기</span><span className="muted">＋</span></summary>
          <div className="body">
            <div className="frow"><span>결제 통로</span><span className="fv">현수카드</span></div>
            <div className="frow"><span>날짜</span><span className="fv">오늘</span></div>
            <div className="frow"><span>메모</span><span className="fv muted">없음</span></div>
          </div>
        </details>

        <button className="btn block" onClick={save} style={{ padding: 16, fontSize: 16 }}><span>저장</span></button>
      </div>
    </section>
  )
}
