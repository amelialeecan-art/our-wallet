import { useWallet } from '../store/WalletProvider'
import { tEnum, tUi } from '../i18n/labels'
import type { ScreenId } from '../types'

export default function SettingsScreen({ active, onGo }: { active: boolean; onGo: (id: ScreenId) => void }) {
  const { role, lang, displayCurrency, fxRate, setLang, setDisplayCurrency, clearRole } = useWallet()

  return (
    <section className={'screen' + (active ? ' active' : '')} id="settings">
      <div className="stack">
        <div className="head">{tUi('settings.title', lang)}</div>
        <div className="prows">
          <div className="gl prow">
            <div className="grow"><div className="st-t">{tUi('settings.role', lang)}</div></div>
            <span className="mini">{role ? tEnum('role', role, lang) : '-'}</span>
            <span className="edit" style={{ marginLeft: 10 }} onClick={clearRole}>{tUi('settings.change', lang)}</span>
          </div>
          <div className="gl prow">
            <div className="grow"><div className="st-t">{tUi('settings.language', lang)}</div></div>
            <div className="seg">
              <button className={lang === 'ko' ? 'on' : ''} onClick={() => setLang('ko')}>한국어</button>
              <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>English</button>
            </div>
          </div>
          <div className="gl prow">
            <div className="grow"><div className="st-t">{tUi('settings.defaultCurrency', lang)}</div></div>
            <div className="seg">
              <button className={displayCurrency === 'KRW' ? 'on' : ''} onClick={() => setDisplayCurrency('KRW')}>KRW</button>
              <button className={displayCurrency === 'USD' ? 'on' : ''} onClick={() => setDisplayCurrency('USD')}>USD</button>
            </div>
          </div>
          <div className="gl prow"><div className="grow"><div className="st-t">{tUi('settings.fixedRate', lang)}</div></div><span className="mini num">$1 = ₩{fxRate.toLocaleString('ko-KR')}</span></div>
        </div>
        <div>
          <div className="sect">{tUi('settings.assetGroup', lang)}</div>
          <div className="prows">
            <div className="gl prow" onClick={() => onGo('accountsSettings')}><div className="st-t">{tUi('settings.accounts', lang)}</div><span className="chev">›</span></div>
            <div className="gl prow" onClick={() => onGo('paymentSourcesSettings')}><div className="st-t">{tUi('settings.payments', lang)}</div><span className="chev">›</span></div>
            <div className="gl prow" onClick={() => onGo('defaultsSettings')}><div className="st-t">{tUi('settings.defaults', lang)}</div><span className="chev">›</span></div>
            <div className="gl prow" onClick={() => onGo('categoriesSettings')}><div className="st-t">{tUi('settings.categories', lang)}</div><span className="chev">›</span></div>
            <div className="gl prow" onClick={() => onGo('quickActionsSettings')}><div className="st-t">{tUi('settings.quicks', lang)}</div><span className="chev">›</span></div>
          </div>
        </div>
        <div>
          <div className="sect">{tUi('settings.recurringGroup', lang)}</div>
          <div className="prows">
            <div className="gl prow" onClick={() => onGo('recurringSettings')}><div className="st-t">{tUi('settings.recurring', lang)}</div><span className="chev">›</span></div>
          </div>
        </div>
        <div>
          <div className="sect">{tUi('settings.shareGroup', lang)}</div>
          <div className="prows">
            <div className="gl prow" onClick={() => onGo('shareSettings')}><div className="st-t">{tUi('settings.share', lang)}</div><span className="chev">›</span></div>
          </div>
        </div>
        <div>
          <div className="sect">{tUi('settings.dataGroup', lang)}</div>
          <div className="prows">
            <div className="gl prow" onClick={() => onGo('dataSettings')}><div className="st-t">{tUi('settings.data', lang)}</div><span className="chev">›</span></div>
          </div>
        </div>
      </div>
    </section>
  )
}
