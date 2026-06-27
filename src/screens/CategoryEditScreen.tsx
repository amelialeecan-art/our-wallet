import { useState } from 'react'
import { showToast, triggerSaved } from '../lib/feedback.ts'
import { useWallet } from '../store/WalletProvider.tsx'
import { tUi } from '../i18n/labels.ts'

interface Props {
  active: boolean
  categoryId: string | null // null이면 새 카테고리
  onDone: () => void
}

const inputStyle: React.CSSProperties = {
  font: 'inherit',
  border: 0,
  borderRadius: 12,
  padding: '10px 12px',
  background: 'rgba(255,255,255,.45)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.35)',
  color: 'var(--ink)',
  width: '60%',
}

export default function CategoryEditScreen({ active, categoryId, onDone }: Props) {
  const { db, lang, addCategory, updateCategory, setCategoryActive, deleteCategory } = useWallet()
  const existing = categoryId ? db.categories.find((c) => c.id === categoryId) : undefined
  const isNew = !categoryId

  const [nameKo, setNameKo] = useState(existing?.nameKo ?? '')
  const [nameEn, setNameEn] = useState(existing?.nameEn ?? '')
  const [budget, setBudget] = useState(existing?.budgetMonthly != null ? String(existing.budgetMonthly) : '')
  const [isActive, setIsActive] = useState(existing?.isActive ?? true)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!isNew && !existing) {
    return (
      <section className={'screen' + (active ? ' active' : '')} id="categoryEdit">
        <div className="stack">
          <div className="between" style={{ padding: '0 4px' }}>
            <div className="head" style={{ padding: 0 }}>{tUi('cat.editTitle', lang)}</div>
            <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={onDone}>{tUi('common.close', lang)}</span>
          </div>
          <div className="cap">{tUi('cat.notFound', lang)}</div>
        </div>
      </section>
    )
  }

  function save() {
    if (!nameKo.trim() && !nameEn.trim()) {
      showToast(tUi('cat.nameRequired', lang))
      return
    }
    const num = budget.trim() === '' ? undefined : Number(budget)
    if (num != null && (!Number.isFinite(num) || num < 0)) {
      showToast(tUi('cat.budgetInvalid', lang))
      return
    }
    const input = { nameKo, nameEn, budgetMonthly: num, isActive }
    const ok = isNew ? addCategory(input) : updateCategory(categoryId!, input)
    if (!ok) {
      showToast(tUi('toast.saveFailed', lang))
      return
    }
    triggerSaved(isNew ? tUi('toast.added', lang) : tUi('toast.updated', lang))
    onDone()
  }

  function doDelete() {
    const res = deleteCategory(categoryId!)
    if (res === 'deleted') {
      showToast(tUi('toast.deleted', lang))
      onDone()
    } else if (res === 'used-in-tx') {
      // 거래에서 쓰는 카테고리는 삭제 대신 숨김으로 안전 처리
      setCategoryActive(categoryId!, false)
      showToast(tUi('cat.hidden', lang))
      onDone()
    } else {
      showToast(tUi('toast.deleteFailed', lang))
      setConfirmDelete(false)
    }
  }

  return (
    <section className={'screen' + (active ? ' active' : '')} id="categoryEdit">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>{isNew ? tUi('cat.addTitle', lang) : tUi('cat.editTitle', lang)}</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={onDone}>{tUi('common.close', lang)}</span>
        </div>

        <div className="gl pod">
          <div className="frow"><span>{tUi('acc.name', lang)}</span><input type="text" value={nameKo} placeholder={lang === 'ko' ? '예: 반려동물' : 'e.g. Pet'} onChange={(e) => setNameKo(e.target.value)} style={inputStyle} /></div>
          <div className="frow"><span>English</span><input type="text" value={nameEn} placeholder="e.g. Pet" onChange={(e) => setNameEn(e.target.value)} style={inputStyle} /></div>
          <div className="frow"><span>{tUi('cat.budget', lang)}</span><input type="number" inputMode="numeric" min={0} value={budget} placeholder={tUi('common.none', lang)} onChange={(e) => setBudget(e.target.value)} style={inputStyle} /></div>
        </div>

        <div className="gl pod">
          <div className="between">
            <span className="label">{tUi('cat.showInAdd', lang)}</span>
            <div className="seg">
              <button className={isActive ? 'on' : ''} onClick={() => setIsActive(true)}>{tUi('common.show', lang)}</button>
              <button className={!isActive ? 'on' : ''} onClick={() => setIsActive(false)}>{tUi('common.hide', lang)}</button>
            </div>
          </div>
          <div className="cap">{tUi('cat.hideNote', lang)}</div>
        </div>

        <button className="btn block" onClick={save} style={{ padding: 16, fontSize: 16 }}><span>{tUi('common.save', lang)}</span></button>

        {!isNew && (!confirmDelete ? (
          <div className="cap" style={{ textAlign: 'center', cursor: 'pointer', color: '#cf743d' }} onClick={() => setConfirmDelete(true)}>{tUi('cat.deleteOne', lang)}</div>
        ) : (
          <div className="gl pod" style={{ textAlign: 'center' }}>
            <div className="label" style={{ marginBottom: 12 }}>{tUi('cat.confirmDelete', lang)}</div>
            <div className="seg3">
              <button onClick={() => setConfirmDelete(false)}>{tUi('common.cancel', lang)}</button>
              <button className="sel ta" style={{ color: '#cf743d' }} onClick={doDelete}>{tUi('common.delete', lang)}</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
