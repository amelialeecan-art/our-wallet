import { useWallet } from '../store/WalletProvider'
import { tUi } from '../i18n/labels'
import type { Lang } from '../domain/types'

// 첫 접속 시 이 기기에서 누구로 사용할지 고른다.
// 역할은 소유권이 아니라 기록 기본값/뷰 설정일 뿐. 디자인은 기존 글래스 언어만 사용.
export default function RoleSelectScreen() {
  const { setRole, lang } = useWallet()
  // 역할 선택 전이라 기본 언어(ko)로 안내. 두 언어를 모두 보여줘 누구나 이해되게.
  const l: Lang = lang

  return (
    <section className="screen active" id="role">
      <div className="stack" style={{ minHeight: '100%', justifyContent: 'center', gap: 18 }}>
        <div className="gl hero ctr">
          <div className="label">{tUi('app.tagline', l)}</div>
          <div className="big num" style={{ fontSize: 30 }}>{tUi('app.name', l)}</div>
        </div>

        <div className="sect" style={{ textAlign: 'center', padding: 0 }}>
          {tUi('role.title', l)}
        </div>

        <button className="btn block" style={{ padding: 16, fontSize: 16 }} onClick={() => setRole('hyeonsu')}>
          <span>{tUi('role.useHyeonsu', l)}</span>
        </button>
        <button className="btn block" style={{ padding: 16, fontSize: 16 }} onClick={() => setRole('tanner')}>
          <span>{tUi('role.useTanner', l)}</span>
        </button>

        <p className="cap" style={{ textAlign: 'center', marginTop: 4 }}>{tUi('role.note', l)}</p>
      </div>
    </section>
  )
}
