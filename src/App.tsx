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
import TransactionsScreen from './screens/TransactionsScreen.tsx'
import TransactionEditScreen from './screens/TransactionEditScreen.tsx'
import AccountsSettingsScreen from './screens/AccountsSettingsScreen.tsx'
import AccountEditScreen from './screens/AccountEditScreen.tsx'
import PaymentSourcesSettingsScreen from './screens/PaymentSourcesSettingsScreen.tsx'
import PaymentSourceEditScreen from './screens/PaymentSourceEditScreen.tsx'
import DefaultsSettingsScreen from './screens/DefaultsSettingsScreen.tsx'
import CategoriesSettingsScreen from './screens/CategoriesSettingsScreen.tsx'
import CategoryEditScreen from './screens/CategoryEditScreen.tsx'
import QuickActionsSettingsScreen from './screens/QuickActionsSettingsScreen.tsx'
import QuickActionEditScreen from './screens/QuickActionEditScreen.tsx'
import { WalletProvider, useWallet } from './store/WalletProvider.tsx'
import type { ScreenId } from './types'

function AppInner() {
  // 표시 통화는 store(기기 상태)에서 온다.
  const { role, displayCurrency, setDisplayCurrency } = useWallet()
  const [screen, setScreen] = useState<ScreenId>('home')
  const [editingTxId, setEditingTxId] = useState<string | null>(null)
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
  const [editingPsId, setEditingPsId] = useState<string | null>(null)
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editingQaId, setEditingQaId] = useState<string | null>(null)

  function go(id: ScreenId) {
    setScreen(id)
    const el = document.getElementById(id)
    if (el) el.scrollTop = 0
  }

  function openEdit(id: string) {
    setEditingTxId(id)
    go('txedit')
  }
  function openAccountEdit(id: string | null) {
    setEditingAccountId(id)
    go('accountEdit')
  }
  function openPsEdit(id: string | null) {
    setEditingPsId(id)
    go('paymentSourceEdit')
  }
  function openCatEdit(id: string | null) {
    setEditingCatId(id)
    go('categoryEdit')
  }
  function openQaEdit(id: string | null) {
    setEditingQaId(id)
    go('quickActionEdit')
  }

  // 역할 미선택 시 역할 선택 화면 (탭바 없이)
  if (!role) return <RoleSelectScreen />

  return (
    <>
      <HomeScreen active={screen === 'home'} cur={displayCurrency} setCur={setDisplayCurrency} onGo={go} onEdit={openEdit} />
      <AddScreen active={screen === 'add'} cur={displayCurrency} setCur={setDisplayCurrency} />
      <AssetsScreen active={screen === 'assets'} cur={displayCurrency} />
      <SpendingScreen active={screen === 'spending'} />
      <BudgetScreen active={screen === 'budget'} />
      <ScheduleScreen active={screen === 'schedule'} />
      <SettingsScreen active={screen === 'settings'} onGo={go} />
      <TransactionsScreen active={screen === 'transactions'} onGo={go} onEdit={openEdit} />
      <TransactionEditScreen key={'tx-' + (editingTxId ?? 'none')} active={screen === 'txedit'} txId={editingTxId} onDone={() => go('transactions')} />

      <AccountsSettingsScreen active={screen === 'accountsSettings'} onGo={go} onEdit={openAccountEdit} />
      <AccountEditScreen key={'acc-' + (editingAccountId ?? 'new')} active={screen === 'accountEdit'} accountId={editingAccountId} onDone={() => go('accountsSettings')} />
      <PaymentSourcesSettingsScreen active={screen === 'paymentSourcesSettings'} onGo={go} onEdit={openPsEdit} />
      <PaymentSourceEditScreen key={'ps-' + (editingPsId ?? 'new')} active={screen === 'paymentSourceEdit'} paymentSourceId={editingPsId} onDone={() => go('paymentSourcesSettings')} />
      <DefaultsSettingsScreen active={screen === 'defaultsSettings'} onGo={go} />
      <CategoriesSettingsScreen active={screen === 'categoriesSettings'} onGo={go} onEdit={openCatEdit} />
      <CategoryEditScreen key={'cat-' + (editingCatId ?? 'new')} active={screen === 'categoryEdit'} categoryId={editingCatId} onDone={() => go('categoriesSettings')} />
      <QuickActionsSettingsScreen active={screen === 'quickActionsSettings'} onGo={go} onEdit={openQaEdit} />
      <QuickActionEditScreen key={'qa-' + (editingQaId ?? 'new')} active={screen === 'quickActionEdit'} quickActionId={editingQaId} onDone={() => go('quickActionsSettings')} />

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
