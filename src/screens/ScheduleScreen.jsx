export default function ScheduleScreen({ active }) {
  return (
    <section className={'screen' + (active ? ' active' : '')} id="schedule">
      <div className="stack">
        <div className="head">우리 수입과 고정지출</div>

        <div>
          <div className="sect">들어오는 우리 수입</div>
          <div className="prows">
            <div className="gl prow"><div className="grow"><div className="aname">Tanner Pay</div><div className="atype">매월 1·15일</div></div><div className="r"><div className="m num" style={{ color: 'var(--aqua-d)' }}>+₩2,700,000</div><span className="st due">예정</span></div></div>
            <div className="gl prow"><div className="grow"><div className="aname">현수 월급</div><div className="atype">매월 25일</div></div><div className="r"><div className="m num" style={{ color: 'var(--aqua-d)' }}>+₩3,200,000</div><span className="st due">예정</span></div></div>
          </div>
        </div>

        <div>
          <div className="sect">나가는 돈</div>
          <div className="prows">
            <div className="gl prow"><div className="grow"><div className="aname">월세</div><div className="atype">매월 1일</div></div><div className="r"><div className="m num">−₩900,000</div><span className="st due">예정</span></div></div>
            <div className="gl prow"><div className="grow"><div className="aname">관리비</div><div className="atype">매월 5일</div></div><div className="r"><div className="m num">−₩180,000</div><span className="st due">예정</span></div></div>
            <div className="gl prow"><div className="grow"><div className="aname">넷플릭스</div><div className="atype">매월 15일</div></div><div className="r"><div className="m num">−₩17,000</div><span className="edit">금액 수정</span></div></div>
            <div className="gl prow"><div className="grow"><div className="aname">카드값</div><div className="atype">매월 12일</div></div><div className="r"><div className="m num">−₩1,400,000</div><span className="st done">완료</span></div></div>
            <div className="gl prow"><div className="grow"><div className="aname">적금 이체</div><div className="atype">매월 25일</div></div><div className="r"><div className="m num">−₩500,000</div><span className="st skip">건너뜀</span></div></div>
          </div>
        </div>
      </div>
    </section>
  )
}
