// ===== i18n 라벨 매핑 =====
// 저장은 영문 키, 표시는 여기서만 한글/영어로 변환한다.
// (전체 UI 번역은 2단계에서 확장. 1단계는 enum 라벨 + 새로 추가된 화면 문구만.)

import type {
  Account,
  Category,
  HolderLabel,
  Lang,
  PaymentSource,
  QuickAction,
  RecurringItem,
  RecurringStatus,
  UsedFor,
} from '../domain/types'

type Pair = { ko: string; en: string }
type Group = Record<string, Pair>

// enum / id → 표시 라벨
const ENUMS: Record<string, Group> = {
  usedFor: {
    shared: { ko: '우리', en: 'Shared' },
    hyeonsu: { ko: '현수', en: 'Hyeonsu' },
    tanner: { ko: '태너', en: 'Tanner' },
  },
  recordedBy: {
    hyeonsu: { ko: '현수', en: 'Hyeonsu' },
    tanner: { ko: '태너', en: 'Tanner' },
  },
  role: {
    hyeonsu: { ko: '현수', en: 'Hyeonsu' },
    tanner: { ko: '태너', en: 'Tanner' },
  },
  category: {
    food: { ko: '식비', en: 'Food' },
    cafe: { ko: '카페', en: 'Cafe' },
    transport: { ko: '교통', en: 'Transport' },
    date: { ko: '데이트', en: 'Date' },
    shopping: { ko: '쇼핑', en: 'Shopping' },
    home: { ko: '집/생활', en: 'Home' },
    other: { ko: '기타', en: 'Other' },
  },
  txType: {
    expense: { ko: '지출', en: 'Expense' },
    income: { ko: '수입', en: 'Income' },
    transfer: { ko: '이체', en: 'Transfer' },
    adjustment: { ko: '조정', en: 'Adjustment' },
  },
  accountKind: {
    cash: { ko: '현금', en: 'Cash' },
    checking: { ko: '입출금', en: 'Checking' },
    savings: { ko: '저축예금', en: 'Savings' },
    deposit: { ko: '예금', en: 'Deposit' },
    installment: { ko: '적금', en: 'Installment' },
    investment: { ko: '주식 · 투자', en: 'Stocks · Invest' },
    other: { ko: '기타', en: 'Other' },
  },
  paymentKind: {
    card: { ko: '카드', en: 'Card' },
    account: { ko: '계좌 이체', en: 'Transfer' },
    cash: { ko: '현금', en: 'Cash' },
  },
  tier: {
    spendable: { ko: '쓸 수 있는 돈', en: 'Spendable' },
    saving: { ko: '모으는·불리는 돈', en: 'Saving' },
  },
  recurringStatus: {
    due: { ko: '예정', en: 'Due' },
    done: { ko: '완료', en: 'Done' },
    skip: { ko: '건너뜀', en: 'Skipped' },
  },
  recurringType: {
    income: { ko: '수입', en: 'Income' },
    expense: { ko: '지출', en: 'Expense' },
    transfer: { ko: '이체', en: 'Transfer' },
  },
  currency: {
    KRW: { ko: '원화 KRW', en: 'KRW' },
    USD: { ko: '달러 USD', en: 'USD' },
  },
}

// 기본 제공 빠른 입력 / 반복 항목 라벨 (labelKey 로 참조)
const KEYS: Group = {
  'quick.lunch': { ko: '점심', en: 'Lunch' },
  'quick.cafe': { ko: '카페', en: 'Cafe' },
  'quick.subway': { ko: '지하철', en: 'Subway' },
  'quick.coupang': { ko: '쿠팡', en: 'Coupang' },
  'quick.tanner_snack': { ko: '태너 간식', en: 'Tanner snack' },
  'quick.date_meal': { ko: '데이트 식비', en: 'Date meal' },
  'recurring.tanner_pay': { ko: 'Tanner Pay', en: 'Tanner Pay' },
  'recurring.hyeonsu_salary': { ko: '현수 월급', en: 'Hyeonsu salary' },
  'recurring.rent': { ko: '월세', en: 'Rent' },
  'recurring.maintenance': { ko: '관리비', en: 'Maintenance' },
  'recurring.netflix': { ko: '넷플릭스', en: 'Netflix' },
  'recurring.card_bill': { ko: '카드값', en: 'Card bill' },
  'recurring.savings_transfer': { ko: '적금 이체', en: 'Savings transfer' },
}

// 앱 전체 UI 문자열 (화면 라벨만. 저장값은 영문 key 유지)
const UI: Group = {
  // 공통
  'common.close': { ko: '닫기', en: 'Close' },
  'common.save': { ko: '저장', en: 'Save' },
  'common.cancel': { ko: '취소', en: 'Cancel' },
  'common.delete': { ko: '삭제', en: 'Delete' },
  'common.manage': { ko: '관리', en: 'Manage' },
  'common.none': { ko: '없음', en: 'None' },
  'common.today': { ko: '오늘', en: 'Today' },
  'common.add': { ko: '추가', en: 'Add' },
  'common.show': { ko: '표시', en: 'Show' },
  'common.hide': { ko: '숨김', en: 'Hidden' },
  'common.optional': { ko: '(선택)', en: '(optional)' },
  // 토스트
  'toast.saved': { ko: '저장됐어요', en: 'Saved' },
  'toast.added': { ko: '추가됐어요', en: 'Added' },
  'toast.updated': { ko: '수정됐어요', en: 'Updated' },
  'toast.deleted': { ko: '삭제됐어요', en: 'Deleted' },
  'toast.saveFailed': { ko: '저장에 실패했어요', en: "Couldn't save" },
  'toast.deleteFailed': { ko: '삭제에 실패했어요', en: "Couldn't delete" },
  'toast.enterAmount': { ko: '금액을 입력해주세요', en: 'Enter an amount' },
  // 앱/역할
  'app.name': { ko: '우리지갑', en: 'Our Wallet' },
  'app.tagline': { ko: '우리 돈은 하나', en: 'One shared wallet' },
  'role.title': { ko: '이 기기에서 누구로 사용할까요?', en: 'Who is using this device?' },
  'role.useHyeonsu': { ko: '현수로 사용', en: 'Use as Hyeonsu' },
  'role.useTanner': { ko: '태너로 사용', en: 'Use as Tanner' },
  'role.note': {
    ko: '역할은 소유권이 아니에요. 누구로 들어와도 우리 전체 자산과 전체 지출을 함께 봅니다.',
    en: 'A role is not ownership. Either way you both see all our assets and spending.',
  },
  // 홈
  'home.available': { ko: '쓸 수 있는 돈', en: 'Available money' },
  'home.setAside': { ko: '묶인 돈', en: 'Set aside' },
  'home.spendingThisMonth': { ko: '이번 달 우리 지출', en: 'Our spending this month' },
  'home.budgetLeft': { ko: '남은 예산', en: 'Budget left' },
  'home.budget': { ko: '예산', en: 'Budget' },
  'home.used': { ko: '사용', en: 'used' },
  'home.expectedLeft': { ko: '이번 달 예상으로 남길 수 있는 돈', en: 'Expected money left this month' },
  'home.pendingIncome': { ko: '아직 반영 안 된 수입', en: 'Income not added yet' },
  'home.pendingExpense': { ko: '아직 나갈 예정인 돈', en: 'Still to go out' },
  'home.pendingTransfer': { ko: '예정 저축 이체', en: 'Planned savings transfer' },
  'home.savingMoney': { ko: '모으는·불리는 돈', en: 'Saving & growing' },
  'home.savingsInvest': { ko: '적금 · 투자', en: 'Savings · Invest' },
  'home.whereMoney': { ko: '우리 돈이 있는 곳', en: 'Where our money is' },
  'home.upcoming': { ko: '오늘 예정', en: 'Upcoming' },
  'home.viewSchedule': { ko: '일정 보기', en: 'View schedule' },
  'home.allApplied': { ko: '이번 달 예정 항목을 모두 반영했어요', en: 'All upcoming items added this month' },
  'home.recent': { ko: '최근 우리 지출', en: 'Recent spending' },
  'home.viewAll': { ko: '전체 보기', en: 'View all' },
  'home.noRecords': { ko: '아직 기록이 없어요', en: 'No records yet' },
  // 입력
  'add.title': { ko: '빠른 입력', en: 'Quick add' },
  'add.type.expense': { ko: '지출', en: 'Spend' },
  'add.type.income': { ko: '수입', en: 'Income' },
  'add.type.transfer': { ko: '이체', en: 'Move' },
  'add.type.adjust': { ko: '맞추기', en: 'Match' },
  'add.account': { ko: '계좌', en: 'Account' },
  'add.actualBalance': { ko: '실제 잔액', en: 'Actual balance' },
  'add.quick': { ko: '자주 쓰는 항목', en: 'Frequent items' },
  'add.enterAmountHint': { ko: '금액을 입력하세요', en: 'Enter an amount' },
  'add.payImmediate': { ko: '저장하면 연결 계좌에서 바로 차감돼요', en: 'This will update the linked account balance' },
  'add.payDeferred': { ko: '신용카드라 계좌 잔액은 아직 줄지 않아요', en: "Credit card spending won't reduce cash balance yet" },
  'add.payNone': { ko: '잔액에는 반영되지 않아요', en: "This won't change account balances" },
  'add.noPayment': { ko: '결제통로를 추가해주세요', en: 'Add a payment method first' },
  'add.depositAccount': { ko: '입금 계좌', en: 'Deposit to' },
  'add.fromAccount': { ko: '보내는 계좌', en: 'From account' },
  'add.toAccount': { ko: '받는 계좌', en: 'To account' },
  'add.transferSame': { ko: '보내는/받는 계좌가 같아요', en: 'From and to accounts are the same' },
  'add.pickAccount': { ko: '계좌를 선택해주세요', en: 'Pick an account' },
  'add.amount': { ko: '금액', en: 'Amount' },
  'add.tapToEnter': { ko: '금액을 눌러 직접 입력', en: 'Tap the amount to type' },
  'add.forWhom': { ko: '사용대상', en: 'For whom' },
  'add.frequent': { ko: '자주 쓰는 항목', en: 'Frequent items' },
  'add.category': { ko: '카테고리', en: 'Category' },
  'add.moreDetails': { ko: '자세히 입력하기', en: 'More details' },
  'add.paidWith': { ko: '결제 통로', en: 'Paid with' },
  'add.date': { ko: '날짜', en: 'Date' },
  'add.memo': { ko: '메모', en: 'Memo' },
  // 자산
  'assets.title': { ko: '우리 돈이 있는 곳', en: 'Where our money is' },
  'assets.total': { ko: '우리 총자산', en: 'Our total assets' },
  'assets.available': { ko: '쓸 수 있는 돈', en: 'Available money' },
  'assets.saving': { ko: '모으는·불리는 돈', en: 'Saving & growing' },
  'assets.adjustHint': { ko: '계좌를 눌러 실제 잔액과 맞출 수 있어요', en: 'Tap an account to match its real balance' },
  // 잔액 맞추기
  'balance.title': { ko: '잔액 맞추기', en: 'Balance match' },
  'balance.note': { ko: '앱 잔액과 실제 은행/현금 잔액이 다를 때 맞춰요', en: 'Use this when the app balance differs from your real balance' },
  'balance.appBalance': { ko: '앱 잔액', en: 'App balance' },
  'balance.actualBalance': { ko: '실제 잔액', en: 'Actual balance' },
  'balance.save': { ko: '잔액 맞추기', en: 'Match balance' },
  'balance.notFound': { ko: '계좌를 찾을 수 없어요', en: 'Account not found' },
  'balance.matched': { ko: '맞췄어요', en: 'Matched' },
  'balance.invalid': { ko: '잔액을 올바르게 입력해주세요', en: 'Enter a valid balance' },
  // 결제통로 정산 방식
  'pay.settlement': { ko: '정산 방식', en: 'Settlement' },
  'pay.settlement.immediate': { ko: '즉시 차감', en: 'Immediate' },
  'pay.settlement.deferred': { ko: '나중에(카드값)', en: 'Deferred' },
  'pay.settlement.none': { ko: '영향 없음', en: 'None' },
  'pay.settlementNote': { ko: '신용카드는 ‘나중에’, 체크카드·현금·이체는 ‘즉시 차감’', en: 'Credit card = Deferred; debit/cash/transfer = Immediate' },
  // 지출 분석
  'spending.title': { ko: '누구를 위한 지출이었나요?', en: 'Who was the spending for?' },
  'spending.tab.who': { ko: '사용대상별', en: 'By whom' },
  'spending.tab.cat': { ko: '카테고리별', en: 'By category' },
  'spending.tab.pay': { ko: '결제수단별', en: 'By payment' },
  'spending.tab.acc': { ko: '계좌별', en: 'By account' },
  'spending.tab.cur': { ko: '통화별', en: 'By currency' },
  'spending.whoTitle': { ko: '우리 지출의 사용대상', en: 'Who our spending was for' },
  'spending.catTitle': { ko: '카테고리별', en: 'By category' },
  'spending.payTitle': { ko: '우리 지출이 나간 통로', en: 'How our money went out' },
  'spending.accTitle': { ko: '계좌별', en: 'By account' },
  'spending.curTitle': { ko: '통화별', en: 'By currency' },
  'spending.empty': { ko: '아직 지출 기록이 없어요', en: 'No spending yet' },
  // 예산
  'budget.title': { ko: '이번 달 예산', en: "This month's budget" },
  'budget.usageRate': { ko: '사용률', en: 'Usage' },
  'budget.byCategory': { ko: '카테고리별 사용률', en: 'Usage by category' },
  'budget.empty': { ko: '설정된 카테고리 예산이 없어요', en: 'No category budgets set' },
  'budget.over': { ko: '초과', en: 'Over' },
  // 일정
  'schedule.title': { ko: '우리 수입과 고정지출', en: 'Our income & fixed costs' },
  'schedule.income': { ko: '들어오는 우리 수입', en: 'Our income' },
  'schedule.outgoing': { ko: '나가는 돈', en: 'Money going out' },
  'schedule.savings': { ko: '저축 · 이체', en: 'Savings / transfer' },
  'schedule.noIncome': { ko: '등록된 수입이 없어요', en: 'No income set' },
  'schedule.noExpense': { ko: '등록된 고정지출이 없어요', en: 'No fixed costs set' },
  'schedule.apply': { ko: '반영', en: 'Add' },
  'toast.applied': { ko: '반영됐어요', en: 'Applied' },
  'toast.alreadyApplied': { ko: '이미 반영됐어요', en: 'Already applied' },
  'toast.applyFailed': { ko: '반영에 실패했어요', en: "Couldn't apply" },
  // 설정
  'settings.title': { ko: '설정', en: 'Settings' },
  'settings.role': { ko: '사용 역할', en: 'Role' },
  'settings.change': { ko: '변경', en: 'Change' },
  'settings.language': { ko: '언어', en: 'Language' },
  'settings.defaultCurrency': { ko: '기본 통화', en: 'Default currency' },
  'settings.fixedRate': { ko: '고정환율', en: 'Fixed rate' },
  'settings.assetGroup': { ko: '우리 자산 구성', en: 'Our setup' },
  'settings.recurringGroup': { ko: '반복 항목', en: 'Recurring' },
  'settings.dataGroup': { ko: '데이터', en: 'Data' },
  'settings.accounts': { ko: '계좌 관리', en: 'Accounts' },
  'settings.payments': { ko: '카드 · 결제통로 관리', en: 'Cards & payment methods' },
  'settings.defaults': { ko: '기본 입력값 설정', en: 'Input defaults' },
  'settings.categories': { ko: '카테고리 관리', en: 'Categories' },
  'settings.quicks': { ko: '빠른 버튼 관리', en: 'Quick buttons' },
  'settings.recurring': { ko: '반복 수입·고정지출 관리', en: 'Recurring income & costs' },
  'settings.data': { ko: '백업 · 복원 · 초기화', en: 'Backup, restore & reset' },
  // 거래내역
  'tx.title': { ko: '거래 내역', en: 'Transactions' },
  'tx.filterAll': { ko: '전체', en: 'All' },
  'tx.filterExpense': { ko: '지출', en: 'Expense' },
  'tx.filterIncome': { ko: '수입', en: 'Income' },
  'tx.empty': { ko: '아직 기록이 없어요', en: 'No records yet' },
  'tx.recurringIncome': { ko: '반복수입', en: 'Recurring income' },
  'tx.fixedExpense': { ko: '고정지출', en: 'Fixed expense' },
  'tx.savingsTransfer': { ko: '저축 이체', en: 'Savings transfer' },
  'tx.adjustment': { ko: '잔액 맞추기', en: 'Balance match' },
  'tx.transfer': { ko: '이체', en: 'Transfer' },
  'tx.income': { ko: '수입', en: 'Income' },
  // 거래 수정
  'txedit.title': { ko: '거래 수정', en: 'Edit transaction' },
  'txedit.notFound': { ko: '기록을 찾을 수 없어요', en: 'Record not found' },
  'txedit.tapToEdit': { ko: '금액을 눌러 수정', en: 'Tap the amount to edit' },
  'txedit.deleteOne': { ko: '이 기록 삭제', en: 'Delete this record' },
  'txedit.confirmDelete': { ko: '이 기록을 삭제할까요?', en: 'Delete this record?' },
  // 계좌 관리
  'acc.title': { ko: '계좌 관리', en: 'Accounts' },
  'acc.note': { ko: '계좌는 우리 돈이 있는 보관 위치예요', en: 'Accounts are where our money is kept' },
  'acc.add': { ko: '＋ 계좌 추가', en: '＋ Add account' },
  'acc.addTitle': { ko: '계좌 추가', en: 'Add account' },
  'acc.editTitle': { ko: '계좌 수정', en: 'Edit account' },
  'acc.notFound': { ko: '계좌를 찾을 수 없어요', en: 'Account not found' },
  'acc.name': { ko: '이름', en: 'Name' },
  'acc.holder': { ko: '보관 위치', en: 'Held by' },
  'acc.kind': { ko: '종류', en: 'Type' },
  'acc.tier': { ko: '자산 구분', en: 'Asset group' },
  'acc.currency': { ko: '통화', en: 'Currency' },
  'acc.balance': { ko: '잔액', en: 'Balance' },
  'acc.usdNote': { ko: '고정환율 1 USD = ₩1,500 기준으로 환산돼요', en: 'Converted at 1 USD = ₩1,500' },
  'acc.nameRequired': { ko: '계좌 이름을 입력해주세요', en: 'Enter an account name' },
  'acc.balanceInvalid': { ko: '잔액을 올바르게 입력해주세요', en: 'Enter a valid balance' },
  'acc.deleteOne': { ko: '이 계좌 삭제', en: 'Delete this account' },
  'acc.confirmDelete': { ko: '이 계좌를 삭제할까요?', en: 'Delete this account?' },
  'acc.blockedPayment': { ko: '이 계좌를 쓰는 결제통로가 있어 삭제할 수 없어요', en: "A payment method uses this account, so it can't be deleted" },
  'acc.blockedTx': { ko: '이 계좌를 쓰는 거래가 있어 삭제할 수 없어요', en: "A transaction uses this account, so it can't be deleted" },
  'acc.tier.spendable': { ko: '쓸 수 있는 돈', en: 'Available money' },
  'acc.tier.saving': { ko: '모으는·불리는 돈', en: 'Saving & growing' },
  // 결제통로 관리
  'pay.title': { ko: '카드 · 결제통로 관리', en: 'Cards & payment methods' },
  'pay.note': { ko: '결제통로는 우리 돈이 나가는 길이에요', en: 'A payment method is how our money goes out' },
  'pay.add': { ko: '＋ 결제통로 추가', en: '＋ Add payment method' },
  'pay.addTitle': { ko: '결제통로 추가', en: 'Add payment method' },
  'pay.editTitle': { ko: '결제통로 수정', en: 'Edit payment method' },
  'pay.notFound': { ko: '결제통로를 찾을 수 없어요', en: 'Payment method not found' },
  'pay.kind': { ko: '종류', en: 'Type' },
  'pay.holder': { ko: '통로 위치', en: 'Belongs to' },
  'pay.linkedAccount': { ko: '연결 계좌 (선택)', en: 'Linked account (optional)' },
  'pay.showInAdd': { ko: '입력 목록에 표시', en: 'Show in quick add' },
  'pay.nameRequired': { ko: '결제통로 이름을 입력해주세요', en: 'Enter a name' },
  'pay.deleteOne': { ko: '이 결제통로 삭제', en: 'Delete this payment method' },
  'pay.confirmDelete': { ko: '이 결제통로를 삭제할까요?', en: 'Delete this payment method?' },
  'pay.blockedTx': { ko: '이 결제통로를 쓰는 거래가 있어 삭제할 수 없어요', en: "A transaction uses this, so it can't be deleted" },
  'pay.blockedDefault': { ko: '기본 결제통로라 삭제할 수 없어요', en: "It's a default, so it can't be deleted" },
  // 기본값 설정
  'defaults.title': { ko: '기본 입력값', en: 'Input defaults' },
  'defaults.note': { ko: '역할은 소유권이 아니라 기본 입력값/보기 설정이에요', en: 'A role is just input/view defaults, not ownership' },
  'defaults.defaultPayment': { ko: '기본 결제통로', en: 'Default payment method' },
  'defaults.defaultCurrency': { ko: '기본 통화', en: 'Default currency' },
  'defaults.defaultLang': { ko: '기본 언어', en: 'Default language' },
  'defaults.suffix': { ko: '기본값', en: 'defaults' },
  // 카테고리 관리
  'cat.title': { ko: '카테고리 관리', en: 'Categories' },
  'cat.note': { ko: '우리 지출을 이해하기 위한 분류예요', en: 'A way to understand our spending' },
  'cat.add': { ko: '＋ 카테고리 추가', en: '＋ Add category' },
  'cat.addTitle': { ko: '카테고리 추가', en: 'Add category' },
  'cat.editTitle': { ko: '카테고리 수정', en: 'Edit category' },
  'cat.notFound': { ko: '카테고리를 찾을 수 없어요', en: 'Category not found' },
  'cat.budget': { ko: '월 예산 (₩, 선택)', en: 'Monthly budget (₩, optional)' },
  'cat.budgetNone': { ko: '예산 없음', en: 'No budget' },
  'cat.budgetPrefix': { ko: '예산', en: 'Budget' },
  'cat.showInAdd': { ko: '입력 목록에 표시', en: 'Show in quick add' },
  'cat.hideNote': { ko: '숨겨도 과거 거래의 라벨은 그대로 보여요', en: 'Past records keep their label even when hidden' },
  'cat.nameRequired': { ko: '카테고리 이름을 입력해주세요', en: 'Enter a category name' },
  'cat.budgetInvalid': { ko: '예산을 올바르게 입력해주세요', en: 'Enter a valid budget' },
  'cat.deleteOne': { ko: '이 카테고리 삭제', en: 'Delete this category' },
  'cat.confirmDelete': { ko: '이 카테고리를 삭제할까요? (사용 중이면 숨김 처리돼요)', en: 'Delete this category? (hidden if in use)' },
  'cat.hidden': { ko: '사용 중이라 숨김 처리했어요', en: 'In use — hidden instead' },
  // 빠른버튼 관리
  'qa.title': { ko: '빠른 버튼 관리', en: 'Quick buttons' },
  'qa.note': { ko: '매일 3~5초 입력을 가능하게 하는 버튼이에요', en: 'Buttons that make daily entry take seconds' },
  'qa.add': { ko: '＋ 빠른 버튼 추가', en: '＋ Add quick button' },
  'qa.addTitle': { ko: '빠른 버튼 추가', en: 'Add quick button' },
  'qa.editTitle': { ko: '빠른 버튼 수정', en: 'Edit quick button' },
  'qa.notFound': { ko: '빠른 버튼을 찾을 수 없어요', en: 'Quick button not found' },
  'qa.nameRequired': { ko: '버튼 이름을 입력해주세요', en: 'Enter a button name' },
  'qa.amountInvalid': { ko: '금액을 올바르게 입력해주세요', en: 'Enter a valid amount' },
  'qa.showInAdd': { ko: '입력 화면에 표시', en: 'Show in quick add' },
  'qa.deleteOne': { ko: '이 빠른 버튼 삭제', en: 'Delete this quick button' },
  'qa.confirmDelete': { ko: '이 빠른 버튼을 삭제할까요?', en: 'Delete this quick button?' },
  // 반복항목 관리
  'rec.title': { ko: '반복 수입·고정지출', en: 'Recurring income & costs' },
  'rec.note': { ko: '예정표예요. 실제 거래는 일정 화면에서 ‘반영’할 때 생겨요', en: 'A schedule — real records appear when you tap Add on the schedule' },
  'rec.income': { ko: '우리 수입', en: 'Our income' },
  'rec.outgoing': { ko: '나가는 돈', en: 'Money going out' },
  'rec.savings': { ko: '저축 · 이체', en: 'Savings / transfer' },
  'rec.emptyShort': { ko: '없어요', en: 'None' },
  'rec.add': { ko: '＋ 반복 항목 추가', en: '＋ Add recurring item' },
  'rec.addTitle': { ko: '반복 항목 추가', en: 'Add recurring item' },
  'rec.editTitle': { ko: '반복 항목 수정', en: 'Edit recurring item' },
  'rec.notFound': { ko: '항목을 찾을 수 없어요', en: 'Item not found' },
  'rec.kind': { ko: '종류', en: 'Type' },
  'rec.name': { ko: '이름', en: 'Name' },
  'rec.amount': { ko: '금액', en: 'Amount' },
  'rec.days': { ko: '매월 며칠 (예: 1, 15)', en: 'Days of month (e.g. 1, 15)' },
  'rec.category': { ko: '카테고리', en: 'Category' },
  'rec.payment': { ko: '결제 통로', en: 'Paid with' },
  'rec.account': { ko: '입금·보관 계좌', en: 'Deposit / hold account' },
  'rec.showInSchedule': { ko: '일정에 표시', en: 'Show in schedule' },
  'rec.nameRequired': { ko: '이름을 입력해주세요', en: 'Enter a name' },
  'rec.amountInvalid': { ko: '금액을 올바르게 입력해주세요', en: 'Enter a valid amount' },
  'rec.daysInvalid': { ko: '반복일을 1~31 사이로 입력해주세요', en: 'Enter days between 1 and 31' },
  'rec.deleteOne': { ko: '이 항목 삭제', en: 'Delete this item' },
  'rec.confirmDelete': { ko: '이 항목을 삭제할까요? (반영된 적 있으면 숨김 처리돼요)', en: 'Delete this item? (hidden if already used)' },
  'rec.hidden': { ko: '반영된 적 있어 숨김 처리했어요', en: 'Used before — hidden instead' },
  // 데이터
  'data.title': { ko: '백업 · 복원 · 초기화', en: 'Backup, restore & reset' },
  'data.info1': { ko: '현재 데이터는 이 기기의 브라우저 저장소에 보관돼요.', en: 'Your data lives in this browser on this device.' },
  'data.info2': { ko: '휴대폰 변경, 브라우저 캐시 삭제 전에는 백업 파일을 저장해두세요.', en: 'Save a backup before switching phones or clearing the cache.' },
  'data.info3': { ko: '백업 파일에는 자산·지출 정보가 들어 있으니 안전한 곳에 보관하세요.', en: 'A backup holds your money info — keep it somewhere safe.' },
  'data.backup': { ko: '백업', en: 'Backup' },
  'data.includeDevice': { ko: '기기 설정(역할·언어·통화) 포함', en: 'Include device settings (role, language, currency)' },
  'data.saveBackup': { ko: '백업 파일 저장 (JSON)', en: 'Save backup file (JSON)' },
  'data.saveCsv': { ko: '거래내역 CSV 저장', en: 'Export transactions CSV' },
  'data.restore': { ko: '복원', en: 'Restore' },
  'data.restoreNote': { ko: '백업 파일을 불러오면 현재 데이터가 바뀝니다.', en: 'Loading a backup replaces your current data.' },
  'data.loadBackup': { ko: '백업 파일 불러오기', en: 'Load backup file' },
  'data.restoreConfirm': { ko: '현재 데이터가 백업 파일 내용으로 바뀝니다. 계속할까요?', en: 'This replaces your current data with the backup. Continue?' },
  'data.restoreBtn': { ko: '복원', en: 'Restore' },
  'data.reset': { ko: '초기화', en: 'Reset' },
  'data.resetNote': { ko: '모든 데이터가 처음(예시) 상태로 돌아갑니다. 역할 설정은 유지돼요.', en: 'All data returns to the starter state. Your role stays.' },
  'data.resetStart': { ko: '처음 상태로 초기화', en: 'Reset to starter data' },
  'data.resetConfirm1': { ko: '정말 초기화할까요? 되돌릴 수 없어요.', en: 'Are you sure you want to reset? This cannot be undone.' },
  'data.resetContinue': { ko: '계속', en: 'Continue' },
  'data.resetTypeWord': { ko: '확인을 위해 초기화 라고 입력해주세요.', en: 'Type RESET to confirm.' },
  'data.resetWord': { ko: '초기화', en: 'RESET' },
  'data.savedBackup': { ko: '백업 파일을 저장했어요', en: 'Backup file saved' },
  'data.savedCsv': { ko: 'CSV를 저장했어요', en: 'CSV saved' },
  'data.exportFailed': { ko: '저장에 실패했어요', en: "Couldn't save" },
  'data.readFailed': { ko: '백업 파일을 읽을 수 없어요', en: 'Could not read backup file' },
  'data.restored': { ko: '복원됐어요', en: 'Restored' },
  'data.restoreFailed': { ko: '복원에 실패했어요', en: "Couldn't restore" },
  'data.resetDone': { ko: '초기화됐어요', en: 'Reset done' },
  // 앱 설치 안내
  'install.title': { ko: '앱처럼 설치하기', en: 'Install like an app' },
  'install.note': { ko: '휴대폰 홈 화면에 추가하면 앱처럼 사용할 수 있어요.', en: 'Add to your home screen to use it like an app.' },
  'install.ios': { ko: 'iPhone Safari: 공유 버튼 → ‘홈 화면에 추가’', en: 'iPhone Safari: Share → "Add to Home Screen"' },
  'install.android': { ko: 'Android Chrome: 메뉴 → ‘앱 설치’ 또는 ‘홈 화면에 추가’', en: 'Android Chrome: Menu → "Install app" / "Add to Home screen"' },
}

export function tEnum(group: keyof typeof ENUMS | string, key: string, lang: Lang): string {
  const g = ENUMS[group as string]
  return g?.[key]?.[lang] ?? key
}

export function tKey(labelKey: string, lang: Lang): string {
  return KEYS[labelKey]?.[lang] ?? labelKey
}

export function tUi(key: string, lang: Lang): string {
  return UI[key]?.[lang] ?? key
}

// labelKey 또는 자유 텍스트 label 을 가진 항목의 표시 이름
export function tItemLabel(item: { labelKey?: string; label?: string }, lang: Lang): string {
  if (item.label) return item.label
  if (item.labelKey) return tKey(item.labelKey, lang)
  return ''
}

// ----- 색상 클래스 (디자인의 us/hy/ta 점·바 색을 그대로 사용) -----
// shared → us, hyeonsu → hy, tanner → ta
export function colorClass(key: UsedFor | HolderLabel): 'us' | 'hy' | 'ta' {
  if (key === 'hyeonsu') return 'hy'
  if (key === 'tanner') return 'ta'
  return 'us'
}

export function recurringStatusLabel(status: RecurringStatus, lang: Lang): string {
  return tEnum('recurringStatus', status, lang)
}

// ----- 계좌/결제통로 표시 이름 (사용자가 지정한 nameKo/nameEn 사용) -----
export function accountTitle(acc: Account, lang: Lang): string {
  return (lang === 'ko' ? acc.nameKo : acc.nameEn) || acc.nameKo || acc.nameEn || ''
}

// 계좌 부제: 종류(+USD 통화 표시)
export function accountSubtitle(acc: Account, lang: Lang): string {
  const kind = acc.kind === 'cash' ? (lang === 'ko' ? '우리 보관' : 'Our cash') : tEnum('accountKind', acc.kind, lang)
  return acc.currency === 'USD' ? `${kind} · USD` : kind
}

export function paymentSourceTitle(ps: PaymentSource, lang: Lang): string {
  return (lang === 'ko' ? ps.nameKo : ps.nameEn) || ps.nameKo || ps.nameEn || ''
}

// 계좌 선택용: 이름 + 종류를 함께 (같은 이름 계좌 구분)
export function accountChipLabel(acc: Account, lang: Lang): string {
  return `${accountTitle(acc, lang)} · ${accountSubtitle(acc, lang)}`
}

// 카테고리 라벨: 저장된 이름 우선, 없으면 기본 카테고리 i18n, 그것도 없으면 id.
// 숨겨진(inactive) 카테고리도 과거 거래 표시를 위해 라벨이 나와야 한다.
export function categoryLabel(categoryId: string, categories: Category[], lang: Lang): string {
  const c = categories.find((x) => x.id === categoryId)
  if (c && (c.nameKo || c.nameEn)) return (lang === 'ko' ? c.nameKo : c.nameEn) || c.nameKo || c.nameEn || categoryId
  return tEnum('category', categoryId, lang)
}

// 빠른버튼 이름: titleKo/En 우선, 없으면 구버전 labelKey/label
export function quickActionTitle(q: QuickAction, lang: Lang): string {
  if (q.titleKo || q.titleEn) return (lang === 'ko' ? q.titleKo : q.titleEn) || q.titleKo || q.titleEn || ''
  return tItemLabel(q, lang)
}

// 반복항목 이름: titleKo/En 우선, 없으면 구버전 labelKey/label
export function recurringTitle(r: RecurringItem, lang: Lang): string {
  if (r.titleKo || r.titleEn) return (lang === 'ko' ? r.titleKo : r.titleEn) || r.titleKo || r.titleEn || ''
  return tItemLabel(r, lang)
}

// 반복 항목 날짜 표기: [1,15] → '매월 1·15일'
export function recurringDaysLabel(days: number[], lang: Lang): string {
  if (lang === 'ko') return `매월 ${days.join('·')}일`
  return `Monthly: ${days.map((d) => 'day ' + d).join(', ')}`
}

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// 'YYYY-MM-DD' → ko '6월 25일' / en 'Jun 25'
export function formatDateLabel(date: string, lang: Lang): string {
  const parts = date.split('-')
  if (parts.length < 3) return date
  const m = parseInt(parts[1], 10)
  const d = parseInt(parts[2], 10)
  if (!m || !d) return date
  return lang === 'ko' ? `${m}월 ${d}일` : `${EN_MONTHS[m - 1] ?? ''} ${d}`
}
