import { useWallet } from '../store/WalletProvider'
import { tEnum, tUi } from '../i18n/labels'

export default function SettingsScreen({ active }: { active: boolean }) {
  const { role, lang, displayCurrency, fxRate, setLang, setDisplayCurrency, clearRole } = useWallet()

  return (
    <section className={'screen' + (active ? ' active' : '')} id="settings">
      <div className="stack">
        <div className="head">설정</div>
        <div className="prows">
          <div className="gl prow">
            <div className="grow"><div className="st-t">{tUi('settings.role', lang)}</div></div>
            <span className="mini">{role ? tEnum('role', role, lang) : '-'}</span>
            <span className="edit" style={{ marginLeft: 10 }} onClick={clearRole}>{tUi('settings.change', lang)}</span>
          </div>
          <div className="gl prow">
            <div className="grow"><div className="st-t">언어</div></div>
            <div className="seg">
              <button className={lang === 'ko' ? 'on' : ''} onClick={() => setLang('ko')}>한국어</button>
              <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>English</button>
            </div>
          </div>
          <div className="gl prow">
            <div className="grow"><div className="st-t">기본 통화</div></div>
            <div className="seg">
              <button className={displayCurrency === 'KRW' ? 'on' : ''} onClick={() => setDisplayCurrency('KRW')}>KRW</button>
              <button className={displayCurrency === 'USD' ? 'on' : ''} onClick={() => setDisplayCurrency('USD')}>USD</button>
            </div>
          </div>
          <div className="gl prow"><div className="grow"><div className="st-t">고정환율</div></div><span className="mini num">$1 = ₩{fxRate.toLocaleString('ko-KR')}</span></div>
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
