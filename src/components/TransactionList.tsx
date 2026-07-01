// 거래 목록 렌더 (Spending 거래내역 탭에서 사용).
// 행 표시 로직 한 곳에서 관리. 집계/저장 로직은 건드리지 않는다.
import { useWallet } from '../store/WalletProvider.tsx'
import { formatMoney } from '../domain/calculations.ts'
import { categoryLabel, colorClass, formatDateLabel, paymentSourceTitle, tEnum, tUi } from '../i18n/labels.ts'
import type { Transaction } from '../domain/types'

export default function TransactionList({
  rows,
  onEdit,
  emptyText,
}: {
  rows: Transaction[]
  onEdit: (id: string) => void
  emptyText?: string // 빈 상태 문구 (미지정 시 기본 'tx.empty')
}) {
  const { db, displayCurrency, fxRate, lang } = useWallet()
  const psById = new Map(db.paymentSources.map((p) => [p.id, p]))

  if (rows.length === 0) return <div className="cap">{emptyText ?? tUi('tx.empty', lang)}</div>

  const typeSign = (t: Transaction) => {
    if (t.type === 'income') return '+'
    if (t.type === 'expense') return '−'
    if (t.type === 'adjustment') return t.toAccountId ? '+' : '−'
    return '' // transfer
  }

  return (
    <>
      {rows.map((t) => {
        const ps = psById.get(t.paymentSourceId)
        const cls = colorClass(t.usedFor)
        const cat = categoryLabel(t.categoryId, db.categories, lang)
        let leadLabel: string
        if (t.sourceKind === 'recurring') {
          leadLabel = t.type === 'income' ? tUi('tx.recurringIncome', lang) : t.type === 'transfer' ? tUi('tx.savingsTransfer', lang) : tUi('tx.fixedExpense', lang)
        } else if (t.type === 'adjustment') {
          leadLabel = tUi('tx.adjustment', lang)
        } else if (t.type === 'income') {
          leadLabel = tUi('tx.income', lang)
        } else if (t.type === 'transfer') {
          leadLabel = tUi('tx.transfer', lang)
        } else {
          leadLabel = cat
        }
        const sub = [
          leadLabel,
          t.type === 'expense' && ps ? paymentSourceTitle(ps, lang) : null,
          tEnum('recordedBy', t.recordedBy, lang),
          formatDateLabel(t.date, lang),
        ]
          .filter(Boolean)
          .join(' · ')
        const origSmall = t.currency !== 'KRW'
          ? `${t.currency === 'USD' ? '$' + t.amountOriginal.toLocaleString('en-US') : t.amountOriginal} · ₩${t.amountKrw.toLocaleString('ko-KR')}`
          : null
        return (
          <div className="gl prow" key={t.id} onClick={() => onEdit(t.id)}>
            <div className="grow">
              <div className="aname">{t.memo || leadLabel}</div>
              <div className="atype">{sub}</div>
            </div>
            <div className="r">
              <div className="m num">{typeSign(t)}{formatMoney(t.amountKrw, displayCurrency, fxRate)}</div>
              {origSmall ? <div className="atype" style={{ textAlign: 'right' }}>{origSmall}</div> : <span className={'who ' + cls}><i></i>{tEnum('usedFor', t.usedFor, lang)}</span>}
            </div>
          </div>
        )
      })}
    </>
  )
}
