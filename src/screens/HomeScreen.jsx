import { useEffect, useRef, useState } from 'react'
import CurrencyToggle from '../components/CurrencyToggle.jsx'
import { useScreenAnimations } from '../lib/useScreenAnimations.js'
import { formatMoney } from '../lib/money.js'

export default function HomeScreen({ active, cur, setCur, onGo }) {
  const ref = useRef(null)
  useScreenAnimations(ref, active)

  // 히어로 카운트업 (화면 활성화 시 0 → 목표)
  const heroKrw = 29000000
  const [heroDisplay, setHeroDisplay] = useState(heroKrw)
  useEffect(() => {
    if (!active) return
    let raf
    const dur = 900
    let t0 = null
    const step = (ts) => {
      if (!t0) t0 = ts
      const p = Math.min((ts - t0) / dur, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setHeroDisplay(heroKrw * e)
      if (p < 1) raf = requestAnimationFrame(step)
      else setHeroDisplay(heroKrw)
    }
    const timer = setTimeout(() => {
      raf = requestAnimationFrame(step)
    }, 120)
    return () => {
      clearTimeout(timer)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [active, cur])

  return (
    <section ref={ref} className={'screen' + (active ? ' active' : '')} id="home">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
            <b style={{ fontSize: 19, fontWeight: 800 }}>우리지갑</b>
            <span style={{ fontSize: 12, color: 'var(--ink3)', fontWeight: 600 }}>우리 돈은 하나</span>
          </div>
          <CurrencyToggle cur={cur} setCur={setCur} variant="symbol" />
        </div>

        <div className="gl hero">
          <div className="label">쓸 수 있는 돈</div>
          <div className="big num">{formatMoney(heroDisplay, cur)}</div>
          <div className="cap">묶인 돈 ₩19,000,000 · $1 = ₩1,500</div>
        </div>

        <div className="gl pod" data-go="budget" onClick={() => onGo('budget')}>
          <div className="between" style={{ marginBottom: 13 }}>
            <div>
              <div className="label">이번 달 우리 지출</div>
              <div className="num" style={{ fontSize: 27, fontWeight: 800, marginTop: 3 }}>₩1,820,000</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="label">남은 예산</div>
              <div className="num" style={{ fontSize: 17, fontWeight: 800, color: 'var(--aqua-d)', marginTop: 3 }}>₩1,180,000</div>
            </div>
          </div>
          <div className="track"><div className="fill" data-w="61"></div></div>
          <div className="cap">예산 ₩3,000,000 중 61% 사용</div>
        </div>

        <div>
          <div className="sect">우리 돈이 있는 곳</div>
          <div className="prows">
            <div className="gl prow"><span className="dot hy"></span><div className="grow"><div className="aname">현수 계좌</div><div className="atype">예금</div></div><div className="aval num">{formatMoney(18000000, cur)}</div></div>
            <div className="gl prow"><span className="dot ta"></span><div className="grow"><div className="aname">태너 계좌</div><div className="atype">예금 · USD</div></div><div className="aval num">{formatMoney(9000000, cur)}</div></div>
            <div className="gl prow"><span className="dot us"></span><div className="grow"><div className="aname">현금</div><div className="atype">우리 보관</div></div><div className="aval num">{formatMoney(2000000, cur)}</div></div>
            <div className="gl prow held" data-go="assets" onClick={() => onGo('assets')}><span className="dot" style={{ background: '#aec8d0' }}></span><div className="grow"><div className="aname">모으는·불리는 돈</div><div className="atype">적금 · 투자</div></div><div className="aval num">{formatMoney(19000000, cur)}</div></div>
          </div>
        </div>

        <div>
          <div className="between" style={{ padding: '0 6px', marginBottom: 9 }}>
            <div className="sect" style={{ margin: 0, padding: 0 }}>오늘 예정</div>
            <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={() => onGo('schedule')}>일정 보기</span>
          </div>
          <div className="hscroll">
            <div className="gl due"><div className="wh">오늘 · 매월 1·15일</div><div className="nm">Tanner Pay</div><div className="m num m-in">+₩2,700,000</div></div>
            <div className="gl due"><div className="wh">오늘 · 매월 1일</div><div className="nm">월세</div><div className="m num m-out">−₩900,000</div></div>
            <div className="gl due"><div className="wh">매월 15일</div><div className="nm">넷플릭스</div><div className="m num m-out">−₩17,000</div></div>
          </div>
        </div>

        <div>
          <div className="sect">최근 우리 지출</div>
          <div className="prows">
            <div className="gl prow"><div className="grow"><div className="aname">점심</div><div className="atype">식비 · 현수카드</div></div><div className="r"><div className="m num">₩12,000</div><span className="who us"><i></i>우리</span></div></div>
            <div className="gl prow"><div className="grow"><div className="aname">카페</div><div className="atype">카페 · Tanner Card</div></div><div className="r"><div className="m num">₩6,000</div><span className="who us"><i></i>우리</span></div></div>
            <div className="gl prow"><div className="grow"><div className="aname">간식</div><div className="atype">식비 · Tanner Card</div></div><div className="r"><div className="m num">₩10,000</div><span className="who ta"><i></i>태너</span></div></div>
          </div>
        </div>
      </div>
    </section>
  )
}
