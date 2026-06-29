// 공용 UI 타입. (도메인 데이터 타입은 1단계에서 별도 추가 예정)

// 표시 통화
export type Currency = 'KRW' | 'USD'

// 화면 식별자 (하단 탭 + 서브 화면)
export type ScreenId =
  | 'home'
  | 'add'
  | 'assets'
  | 'spending'
  | 'budget'
  | 'schedule'
  | 'settings'
  | 'transactions'
  | 'txedit'
  | 'accountsSettings'
  | 'accountEdit'
  | 'paymentSourcesSettings'
  | 'paymentSourceEdit'
  | 'defaultsSettings'
  | 'categoriesSettings'
  | 'categoryEdit'
  | 'quickActionsSettings'
  | 'quickActionEdit'
  | 'recurringSettings'
  | 'recurringEdit'
  | 'dataSettings'
  | 'shareSettings'
  | 'balanceMatch'
