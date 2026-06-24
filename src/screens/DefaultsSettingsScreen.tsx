import { useWallet } from '../store/WalletProvider.tsx'
import { paymentSourceTitle, tEnum } from '../i18n/labels.ts'
import type { ScreenId } from '../types'
import type { Role } from '../domain/types'

interface Props {
  active: boolean
  onGo: (id: ScreenId) => void
}

const ROLES: Role[] = ['hyeonsu', 'tanner']

export default function DefaultsSettingsScreen({ active, onGo }: Props) {
  const { db, lang, fxRate, updatePersonDefaults } = useWallet()
  const activeSources = db.paymentSources.filter((p) => p.isActive !== false)

  return (
    <section className={'screen' + (active ? ' active' : '')} id="defaultsSettings">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>기본 입력값</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={() => onGo('settings')}>닫기</span>
        </div>
        <div className="cap" style={{ padding: '0 6px' }}>역할은 소유권이 아니라 기본 입력값/보기 설정이에요</div>

        {ROLES.map((role) => {
          const d = db.settings.personDefaults[role]
          return (
            <div key={role}>
              <div className="sect">{tEnum('role', role, lang)} 기본값</div>
              <div className="gl pod">
                <div className="label" style={{ marginBottom: 8 }}>기본 결제통로</div>
                <div className="chips">
                  {activeSources.map((p) => (
                    <button
                      key={p.id}
                      className={'chip' + (d.paymentSourceId === p.id ? ' sel' : '')}
                      onClick={() => updatePersonDefaults(role, { paymentSourceId: p.id })}
                    >
                      {paymentSourceTitle(p, lang)}
                    </button>
                  ))}
                </div>

                <div className="between" style={{ marginTop: 14 }}>
                  <span className="label">기본 통화</span>
                  <div className="seg">
                    <button className={d.currency === 'KRW' ? 'on' : ''} onClick={() => updatePersonDefaults(role, { currency: 'KRW' })}>KRW</button>
                    <button className={d.currency === 'USD' ? 'on' : ''} onClick={() => updatePersonDefaults(role, { currency: 'USD' })}>USD</button>
                  </div>
                </div>

                <div className="between" style={{ marginTop: 12 }}>
                  <span className="label">기본 언어</span>
                  <div className="seg">
                    <button className={d.lang === 'ko' ? 'on' : ''} onClick={() => updatePersonDefaults(role, { lang: 'ko' })}>한국어</button>
                    <button className={d.lang === 'en' ? 'on' : ''} onClick={() => updatePersonDefaults(role, { lang: 'en' })}>English</button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        <div className="gl prow"><div className="grow"><div className="st-t">고정환율</div></div><span className="mini num">$1 = ₩{fxRate.toLocaleString('ko-KR')}</span></div>
      </div>
    </section>
  )
}
