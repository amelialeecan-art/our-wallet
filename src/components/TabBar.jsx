// 떠 있는 물방울 하단 탭바. 가운데 + 버튼은 입력 화면으로 간다.
export default function TabBar({ screen, onGo }) {
  return (
    <nav className="tabbar">
      <button className={'tab' + (screen === 'home' ? ' on' : '')} onClick={() => onGo('home')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 11.4 12 5l8 6.4" />
          <path d="M6 10.4V19h12v-8.6" />
        </svg>
        <span>Home</span>
      </button>
      <button className={'tab' + (screen === 'assets' ? ' on' : '')} onClick={() => onGo('assets')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="6.5" width="17" height="12" rx="3.6" />
          <path d="M15.5 12.5h3" />
        </svg>
        <span>Assets</span>
      </button>
      <div className="center">
        <button className="addbtn" onClick={() => onGo('add')} aria-label="추가">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 6v12M6 12h12" />
          </svg>
        </button>
      </div>
      <button className={'tab' + (screen === 'spending' ? ' on' : '')} onClick={() => onGo('spending')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 14.5V18" />
          <path d="M12 9v9" />
          <path d="M18 6v12" />
        </svg>
        <span>Spending</span>
      </button>
      <button className={'tab' + (screen === 'settings' ? ' on' : '')} onClick={() => onGo('settings')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 8h8" />
          <circle cx="17" cy="8" r="2.1" />
          <path d="M19 16h-8" />
          <circle cx="7" cy="16" r="2.1" />
        </svg>
        <span>Settings</span>
      </button>
    </nav>
  )
}
