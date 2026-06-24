import { formatMoney } from '../lib/money.js'

export default function AssetsScreen({ active, cur }) {
  return (
    <section className={'screen' + (active ? ' active' : '')} id="assets">
      <div className="stack">
        <div className="head">우리 돈이 있는 곳</div>

        <div className="gl hero sm">
          <div className="label">우리 총자산</div>
          <div className="big num" style={{ fontSize: 34 }}>{formatMoney(48000000, cur)}</div>
          <div className="cap">쓸 수 있는 돈 2,900만 · 묶인 돈 1,900만</div>
        </div>

        <div>
          <div className="sect">쓸 수 있는 돈</div>
          <div className="prows">
            <div className="gl prow"><span className="dot hy"></span><div className="grow"><div className="aname">현수 계좌</div><div className="atype">예금</div></div><div className="aval num">{formatMoney(18000000, cur)}</div></div>
            <div className="gl prow"><span className="dot ta"></span><div className="grow"><div className="aname">태너 계좌</div><div className="atype">예금 · USD</div></div><div className="aval num">{formatMoney(9000000, cur)}</div></div>
            <div className="gl prow"><span className="dot us"></span><div className="grow"><div className="aname">현금</div><div className="atype">우리 보관</div></div><div className="aval num">{formatMoney(2000000, cur)}</div></div>
          </div>
        </div>

        <div>
          <div className="sect">모으는·불리는 돈</div>
          <div className="prows">
            <div className="gl prow"><span className="dot hy"></span><div className="grow"><div className="aname">현수 계좌</div><div className="atype">적금</div></div><div className="aval num">{formatMoney(8000000, cur)}</div></div>
            <div className="gl prow"><span className="dot ta"></span><div className="grow"><div className="aname">태너 계좌</div><div className="atype">주식 · 투자</div></div><div className="aval num">{formatMoney(11000000, cur)}</div></div>
          </div>
        </div>

        <div className="between" style={{ padding: '0 6px' }}>
          <span className="cap" style={{ margin: 0 }}>마지막 업데이트 · 2일 전</span>
          <button className="btn"><span>잔액 업데이트</span></button>
        </div>
      </div>
    </section>
  )
}
