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
import RoleSelectScreen from './screens/RoleSelectScreen.tsx'
import { WalletProvider, useWallet } from './store/WalletProvider.tsx'
import type { ScreenId } from './types'

function AppInner() {
  // 표시 통화는 이제 store(기기 상태)에서 온다.
  const { role, displayCurrency, setDisplayCurrency } = useWallet()
  const [screen, setScreen] = useState<ScreenId>('home')

  function go(id: ScreenId) {
    setScreen(id)
    const el = document.getElementById(id)
    if (el) el.scrollTop = 0
  }

  // 역할 미선택 시 역할 선택 화면 (탭바 없이)
  if (!role) return <RoleSelectScreen />

  return (
    <>
      <HomeScreen active={screen === 'home'} cur={displayCurrency} setCur={setDisplayCurrency} onGo={go} />
      <AddScreen active={screen === 'add'} cur={displayCurrency} setCur={setDisplayCurrency} />
      <AssetsScreen active={screen === 'assets'} cur={displayCurrency} />
      <SpendingScreen active={screen === 'spending'} />
      <BudgetScreen active={screen === 'budget'} />
      <ScheduleScreen active={screen === 'schedule'} />
      <SettingsScreen active={screen === 'settings'} />

      <TabBar screen={screen} onGo={go} />
      <div className="toast" id="toast">저장됐어요</div>
    </>
  )
}

export default function App() {
  return (
    <WalletProvider>
      <PhoneFrame>
        <AppInner />
      </PhoneFrame>
    </WalletProvider>
  )
}
