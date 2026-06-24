import { useRef } from 'react'
import { useScreenAnimations } from '../lib/useScreenAnimations.js'

export default function BudgetScreen({ active }) {
  const ref = useRef(null)
  useScreenAnimations(ref, active)

  return (
    <section ref={ref} className={'screen' + (active ? ' active' : '')} id="budget">
      <div className="stack">
        <div className="head">이번 달 예산</div>

        <div className="gl hero ctr">
          <div className="label">사용률</div>
          <div className="pct num">61%</div>
          <div className="cap">₩1,820,000 / ₩3,000,000</div>
        </div>

        <div className="gl pod">
          <div className="sect" style={{ padding: 0, marginBottom: 6 }}>카테고리별 사용률</div>
          <div className="fillrow"><div className="fillhead"><span>데이트 <span className="tagover">초과</span></span><span className="pct">105%</span></div><div className="track"><div className="fill over" data-w="100"></div></div></div>
          <div className="fillrow"><div className="fillhead"><span>식비</span><span className="pct">97%</span></div><div className="track"><div className="fill" data-w="97"></div></div></div>
          <div className="fillrow"><div className="fillhead"><span>쇼핑</span><span className="pct">83%</span></div><div className="track"><div className="fill" data-w="83"></div></div></div>
          <div className="fillrow"><div className="fillhead"><span>카페</span><span className="pct">73%</span></div><div className="track"><div className="fill" data-w="73"></div></div></div>
          <div className="fillrow"><div className="fillhead"><span>교통</span><span className="pct">58%</span></div><div className="track"><div className="fill" data-w="58"></div></div></div>
          <div className="fillrow"><div className="fillhead"><span>집/생활</span><span className="pct">32%</span></div><div className="track"><div className="fill" data-w="32"></div></div></div>
        </div>
      </div>
    </section>
  )
}
