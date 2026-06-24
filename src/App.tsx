import { useState } from 'react'
import PhoneFrame from './components/PhoneFrame.tsx'
import TabBar from './components/TabBar.tsx'
import HomeScreen from './screens/HomeScreen.tsx'
import AddScreen from './screens/AddScreen.tsx'
import AssetsScreen from './screens/AssetsScreen.tsx'
import SpendingScreen from './screens/SpendingScreen.tsx'
import BudgetScreen from './screens/BudgetScreen.tsx'
import ScheduleScreen from './screens/ScheduleScreen.tsx'
import SettingsScreen from './screens/SettingsScreen.tsx'
import type { Currency, ScreenId } from './types'

export default function App() {
  // 현재 화면과 전역 표시 통화. (다음 단계에서 Context/localStorage로 승격 예정)
  const [screen, setScreen] = useState<ScreenId>('home')
  const [cur, setCur] = useState<Currency>('KRW')

  function go(id: ScreenId) {
    setScreen(id)
    // 화면 전환 시 스크롤 최상단으로
    const el = document.getElementById(id)
    if (el) el.scrollTop = 0
  }

  return (
    <PhoneFrame>
      <HomeScreen active={screen === 'home'} cur={cur} setCur={setCur} onGo={go} />
      <AddScreen active={screen === 'add'} cur={cur} setCur={setCur} />
      <AssetsScreen active={screen === 'assets'} cur={cur} />
      <SpendingScreen active={screen === 'spending'} />
      <BudgetScreen active={screen === 'budget'} />
      <ScheduleScreen active={screen === 'schedule'} />
      <SettingsScreen active={screen === 'settings'} />

      <TabBar screen={screen} onGo={go} />
      <div className="toast" id="toast">저장됐어요</div>
    </PhoneFrame>
  )
}
