export default function SettingsScreen({ active }) {
  return (
    <section className={'screen' + (active ? ' active' : '')} id="settings">
      <div className="stack">
        <div className="head">설정</div>
        <div className="prows">
          <div className="gl prow"><div className="grow"><div className="st-t">언어</div></div><div className="seg"><button className="on">한국어</button><button>English</button></div></div>
          <div className="gl prow"><div className="grow"><div className="st-t">기본 통화</div></div><div className="seg"><button className="on">KRW</button><button>USD</button></div></div>
          <div className="gl prow"><div className="grow"><div className="st-t">고정환율</div></div><span className="mini num">$1 = ₩1,500</span></div>
        </div>
        <div>
          <div className="sect">우리 자산 구성</div>
          <div className="prows">
            <div className="gl prow"><div className="st-t">계좌 관리</div><span className="chev">›</span></div>
            <div className="gl prow"><div className="st-t">카드 관리</div><span className="chev">›</span></div>
            <div className="gl prow"><div className="st-t">카테고리 관리</div><span className="chev">›</span></div>
            <div className="gl prow"><div className="st-t">사용대상 관리</div><span className="chev">›</span></div>
            <div className="gl prow"><div className="st-t">빠른 버튼 관리</div><span className="chev">›</span></div>
          </div>
        </div>
        <div>
          <div className="sect">반복 항목</div>
          <div className="prows">
            <div className="gl prow"><div className="st-t">월급일 설정</div><span className="chev">›</span></div>
            <div className="gl prow"><div className="st-t">고정지출 설정</div><span className="chev">›</span></div>
          </div>
        </div>
      </div>
    </section>
  )
}
