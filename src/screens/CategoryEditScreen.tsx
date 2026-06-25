import { useState } from 'react'
import { showToast, triggerSaved } from '../lib/feedback.ts'
import { useWallet } from '../store/WalletProvider.tsx'

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
  const { db, addCategory, updateCategory, setCategoryActive, deleteCategory } = useWallet()
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
            <div className="head" style={{ padding: 0 }}>카테고리 수정</div>
            <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={onDone}>닫기</span>
          </div>
          <div className="cap">카테고리를 찾을 수 없어요</div>
        </div>
      </section>
    )
  }

  function save() {
    if (!nameKo.trim() && !nameEn.trim()) {
      showToast('카테고리 이름을 입력해주세요')
      return
    }
    const num = budget.trim() === '' ? undefined : Number(budget)
    if (num != null && (!Number.isFinite(num) || num < 0)) {
      showToast('예산을 올바르게 입력해주세요')
      return
    }
    const input = { nameKo, nameEn, budgetMonthly: num, isActive }
    const ok = isNew ? addCategory(input) : updateCategory(categoryId!, input)
    if (!ok) {
      showToast('저장에 실패했어요')
      return
    }
    triggerSaved(isNew ? '추가됐어요' : '수정됐어요')
    onDone()
  }

  function doDelete() {
    const res = deleteCategory(categoryId!)
    if (res === 'deleted') {
      showToast('삭제됐어요')
      onDone()
    } else if (res === 'used-in-tx') {
      // 거래에서 쓰는 카테고리는 삭제 대신 숨김으로 안전 처리
      setCategoryActive(categoryId!, false)
      showToast('사용 중이라 숨김 처리했어요')
      onDone()
    } else {
      showToast('삭제에 실패했어요')
      setConfirmDelete(false)
    }
  }

  return (
    <section className={'screen' + (active ? ' active' : '')} id="categoryEdit">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>{isNew ? '카테고리 추가' : '카테고리 수정'}</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={onDone}>닫기</span>
        </div>

        <div className="gl pod">
          <div className="frow"><span>이름</span><input type="text" value={nameKo} placeholder="예: 반려동물" onChange={(e) => setNameKo(e.target.value)} style={inputStyle} /></div>
          <div className="frow"><span>English</span><input type="text" value={nameEn} placeholder="e.g. Pet" onChange={(e) => setNameEn(e.target.value)} style={inputStyle} /></div>
          <div className="frow"><span>월 예산 (₩, 선택)</span><input type="number" inputMode="numeric" min={0} value={budget} placeholder="없음" onChange={(e) => setBudget(e.target.value)} style={inputStyle} /></div>
        </div>

        <div className="gl pod">
          <div className="between">
            <span className="label">입력 목록에 표시</span>
            <div className="seg">
              <button className={isActive ? 'on' : ''} onClick={() => setIsActive(true)}>표시</button>
              <button className={!isActive ? 'on' : ''} onClick={() => setIsActive(false)}>숨김</button>
            </div>
          </div>
          <div className="cap">숨겨도 과거 거래의 라벨은 그대로 보여요</div>
        </div>

        <button className="btn block" onClick={save} style={{ padding: 16, fontSize: 16 }}><span>저장</span></button>

        {!isNew && (!confirmDelete ? (
          <div className="cap" style={{ textAlign: 'center', cursor: 'pointer', color: '#cf743d' }} onClick={() => setConfirmDelete(true)}>이 카테고리 삭제</div>
        ) : (
          <div className="gl pod" style={{ textAlign: 'center' }}>
            <div className="label" style={{ marginBottom: 12 }}>이 카테고리를 삭제할까요? (사용 중이면 숨김 처리돼요)</div>
            <div className="seg3">
              <button onClick={() => setConfirmDelete(false)}>취소</button>
              <button className="sel ta" style={{ color: '#cf743d' }} onClick={doDelete}>삭제</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
