import { useRef, useState } from 'react'
import { useWallet } from '../store/WalletProvider.tsx'
import { showToast, triggerSaved } from '../lib/feedback.ts'
import { downloadText } from '../lib/download.ts'
import { backupFilename, csvFilename, validateBackup } from '../domain/backup.ts'
import type { ScreenId } from '../types'

interface Props {
  active: boolean
  onGo: (id: ScreenId) => void
}

export default function DataSettingsScreen({ active, onGo }: Props) {
  const { exportBackupString, exportTransactionsCsv, replaceDatabaseFromBackup, resetDatabaseToSeed } = useWallet()
  const fileRef = useRef<HTMLInputElement>(null)

  const [includeDevice, setIncludeDevice] = useState(false)
  const [pendingBackup, setPendingBackup] = useState<unknown>(null) // 복원 확인 대기
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0)
  const [resetWord, setResetWord] = useState('')

  function doExportBackup() {
    const ok = downloadText(backupFilename(), exportBackupString(includeDevice), 'application/json')
    showToast(ok ? '백업 파일을 저장했어요' : '저장에 실패했어요')
  }

  function doExportCsv() {
    const ok = downloadText(csvFilename(), exportTransactionsCsv(), 'text/csv')
    showToast(ok ? 'CSV를 저장했어요' : '저장에 실패했어요')
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일 다시 선택 가능하도록
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        const result = validateBackup(parsed)
        if (!result.ok) {
          showToast(result.reason)
          return
        }
        setPendingBackup(parsed) // 복원 확인 단계로
      } catch {
        showToast('백업 파일을 읽을 수 없어요')
      }
    }
    reader.onerror = () => showToast('백업 파일을 읽을 수 없어요')
    reader.readAsText(file)
  }

  function confirmRestore() {
    const ok = replaceDatabaseFromBackup(pendingBackup)
    setPendingBackup(null)
    if (ok) {
      triggerSaved('복원됐어요')
      onGo('home')
    } else {
      showToast('복원에 실패했어요')
    }
  }

  function confirmReset() {
    resetDatabaseToSeed()
    setResetStep(0)
    setResetWord('')
    triggerSaved('초기화됐어요')
    onGo('home')
  }

  return (
    <section className={'screen' + (active ? ' active' : '')} id="dataSettings">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>백업 · 복원 · 초기화</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={() => onGo('settings')}>닫기</span>
        </div>

        <div className="gl pod">
          <div className="cap" style={{ marginTop: 0 }}>현재 데이터는 이 기기의 브라우저 저장소에 보관돼요.</div>
          <div className="cap">휴대폰 변경, 브라우저 캐시 삭제 전에는 백업 파일을 저장해두세요.</div>
          <div className="cap">백업 파일에는 자산·지출 정보가 들어 있으니 안전한 곳에 보관하세요.</div>
        </div>

        {/* 백업 */}
        <div>
          <div className="sect">백업</div>
          <div className="gl pod">
            <div className="between" style={{ marginBottom: 12 }}>
              <span className="label">기기 설정(역할·언어·통화) 포함</span>
              <div className="seg">
                <button className={!includeDevice ? 'on' : ''} onClick={() => setIncludeDevice(false)}>제외</button>
                <button className={includeDevice ? 'on' : ''} onClick={() => setIncludeDevice(true)}>포함</button>
              </div>
            </div>
            <button className="btn block" style={{ padding: 14 }} onClick={doExportBackup}><span>백업 파일 저장 (JSON)</span></button>
            <div style={{ height: 10 }} />
            <button className="btn block" style={{ padding: 14 }} onClick={doExportCsv}><span>거래내역 CSV 저장</span></button>
          </div>
        </div>

        {/* 복원 */}
        <div>
          <div className="sect">복원</div>
          <div className="gl pod">
            <div className="cap" style={{ marginTop: 0, marginBottom: 12 }}>백업 파일을 불러오면 현재 데이터가 바뀝니다.</div>
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={onPickFile} style={{ display: 'none' }} />
            {!pendingBackup ? (
              <button className="btn block" style={{ padding: 14 }} onClick={() => fileRef.current?.click()}><span>백업 파일 불러오기</span></button>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div className="label" style={{ marginBottom: 12 }}>현재 데이터가 백업 파일 내용으로 바뀝니다. 계속할까요?</div>
                <div className="seg3">
                  <button onClick={() => setPendingBackup(null)}>취소</button>
                  <button className="sel us" onClick={confirmRestore}>복원</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 초기화 */}
        <div>
          <div className="sect">초기화</div>
          <div className="gl pod">
            <div className="cap" style={{ marginTop: 0, marginBottom: 12 }}>모든 데이터가 처음(예시) 상태로 돌아갑니다. 역할 설정은 유지돼요.</div>
            {resetStep === 0 && (
              <div className="cap" style={{ textAlign: 'center', cursor: 'pointer', color: '#cf743d' }} onClick={() => setResetStep(1)}>처음 상태로 초기화</div>
            )}
            {resetStep === 1 && (
              <div style={{ textAlign: 'center' }}>
                <div className="label" style={{ marginBottom: 12 }}>정말 초기화할까요? 되돌릴 수 없어요.</div>
                <div className="seg3">
                  <button onClick={() => setResetStep(0)}>취소</button>
                  <button className="sel ta" style={{ color: '#cf743d' }} onClick={() => setResetStep(2)}>계속</button>
                </div>
              </div>
            )}
            {resetStep === 2 && (
              <div style={{ textAlign: 'center' }}>
                <div className="label" style={{ marginBottom: 10 }}>확인을 위해 <b>초기화</b> 라고 입력해주세요.</div>
                <input
                  type="text"
                  value={resetWord}
                  placeholder="초기화"
                  onChange={(e) => setResetWord(e.target.value)}
                  style={{ font: 'inherit', border: 0, borderRadius: 12, padding: '10px 12px', background: 'rgba(255,255,255,.45)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.35)', color: 'var(--ink)', textAlign: 'center', marginBottom: 12 }}
                />
                <div className="seg3">
                  <button onClick={() => { setResetStep(0); setResetWord('') }}>취소</button>
                  <button className="sel ta" style={{ color: resetWord.trim() === '초기화' ? '#cf743d' : 'var(--ink3)' }} disabled={resetWord.trim() !== '초기화'} onClick={confirmReset}>초기화</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
