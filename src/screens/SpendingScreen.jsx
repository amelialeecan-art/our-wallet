import { useEffect, useRef, useState } from 'react'

const TABS = [
  { key: 'who', label: '사용대상별' },
  { key: 'cat', label: '카테고리별' },
  { key: 'pay', label: '결제수단별' },
  { key: 'acc', label: '계좌별' },
  { key: 'cur', label: '통화별' },
]

export default function SpendingScreen({ active }) {
  const ref = useRef(null)
  const [tab, setTab] = useState('who')

  // 화면 활성화 또는 탭 전환 시 켜진 패널의 막대/액체를 다시 채운다.
  useEffect(() => {
    if (!active || !ref.current) return
    const panel = ref.current.querySelector('.panel.on')
    if (!panel) return
    const t = setTimeout(() => {
      panel.querySelectorAll('.fill[data-w]').forEach((f) => {
        f.style.width = '0%'
        requestAnimationFrame(() => setTimeout(() => (f.style.width = f.dataset.w + '%'), 40))
      })
      panel.querySelectorAll('.lq[data-h]').forEach((l) => {
        l.style.height = '0%'
        requestAnimationFrame(() => setTimeout(() => (l.style.height = l.dataset.h + '%'), 40))
      })
    }, 60)
    return () => clearTimeout(t)
  }, [active, tab])

  return (
    <section ref={ref} className={'screen' + (active ? ' active' : '')} id="spending">
      <div className="stack">
        <div className="head">누구를 위한 지출이었나요?</div>
        <div className="tabs" id="spendTabs">
          {TABS.map((t) => (
            <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>

        <div className={'panel' + (tab === 'who' ? ' on' : '')}>
          <div className="gl pod">
            <div className="sect" style={{ padding: 0, marginBottom: 14 }}>우리 지출의 사용대상</div>
            <div className="liquid-wrap">
              <div className="liquid"><div className="lq ta" data-h="100"></div><div className="lq hy" data-h="80"></div><div className="lq us" data-h="52"></div></div>
              <div className="legend">
                <div className="lg"><span className="k" style={{ background: 'var(--us)' }}></span>공동<span className="p num">52%</span></div>
                <div className="lg"><span className="k" style={{ background: 'var(--hyun)' }}></span>현수<span className="p num">28%</span></div>
                <div className="lg"><span className="k" style={{ background: 'var(--tan)' }}></span>태너<span className="p num">20%</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className={'panel' + (tab === 'cat' ? ' on' : '')}>
          <div className="gl pod">
            <div className="sect" style={{ padding: 0, marginBottom: 6 }}>카테고리별</div>
            <FillRow label="식비" pct={32} />
            <FillRow label="데이트" pct={22} />
            <FillRow label="쇼핑" pct={18} />
            <FillRow label="카페" pct={10} />
            <FillRow label="집/생활" pct={9} />
            <FillRow label="교통" pct={6} />
            <FillRow label="기타" pct={3} />
          </div>
        </div>

        <div className={'panel' + (tab === 'pay' ? ' on' : '')}>
          <div className="gl pod">
            <div className="sect" style={{ padding: 0, marginBottom: 6 }}>우리 지출이 나간 통로</div>
            <FillRow label="현수카드" pct={58} color="hy" />
            <FillRow label="Tanner Card" pct={34} color="ta" />
            <FillRow label="현수 계좌 이체" pct={8} />
          </div>
        </div>

        <div className={'panel' + (tab === 'acc' ? ' on' : '')}>
          <div className="gl pod">
            <div className="sect" style={{ padding: 0, marginBottom: 6 }}>계좌별</div>
            <FillRow label="현수 계좌" pct={62} color="hy" />
            <FillRow label="태너 계좌" pct={38} color="ta" />
          </div>
        </div>

        <div className={'panel' + (tab === 'cur' ? ' on' : '')}>
          <div className="gl pod">
            <div className="sect" style={{ padding: 0, marginBottom: 6 }}>통화별</div>
            <FillRow label="원화 KRW" pct={81} />
            <FillRow label="달러 USD" pct={19} color="ta" />
          </div>
        </div>
      </div>
    </section>
  )
}

function FillRow({ label, pct, color }) {
  return (
    <div className="fillrow">
      <div className="fillhead"><span>{label}</span><span className="pct">{pct}%</span></div>
      <div className="track"><div className={'fill' + (color ? ' ' + color : '')} data-w={pct}></div></div>
    </div>
  )
}
