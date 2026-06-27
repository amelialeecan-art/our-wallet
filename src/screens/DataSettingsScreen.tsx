import { useRef, useState } from 'react'
import { useWallet } from '../store/WalletProvider.tsx'
import { showToast, triggerSaved } from '../lib/feedback.ts'
import { downloadText } from '../lib/download.ts'
import { backupFilename, csvFilename, validateBackup } from '../domain/backup.ts'
import { tUi } from '../i18n/labels.ts'
import type { ScreenId } from '../types'

interface Props {
  active: boolean
  onGo: (id: ScreenId) => void
}

export default function DataSettingsScreen({ active, onGo }: Props) {
  const { lang, exportBackupString, exportTransactionsCsv, replaceDatabaseFromBackup, resetDatabaseToSeed } = useWallet()
  const fileRef = useRef<HTMLInputElement>(null)

  const [includeDevice, setIncludeDevice] = useState(false)
  const [pendingBackup, setPendingBackup] = useState<unknown>(null) // 복원 확인 대기
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0)
  const [resetWord, setResetWord] = useState('')

  const RESET_WORD = tUi('data.resetWord', lang)

  function doExportBackup() {
    const ok = downloadText(backupFilename(), exportBackupString(includeDevice), 'application/json')
    showToast(ok ? tUi('data.savedBackup', lang) : tUi('data.exportFailed', lang))
  }

  function doExportCsv() {
    const ok = downloadText(csvFilename(), exportTransactionsCsv(), 'text/csv')
    showToast(ok ? tUi('data.savedCsv', lang) : tUi('data.exportFailed', lang))
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
        showToast(tUi('data.readFailed', lang))
      }
    }
    reader.onerror = () => showToast(tUi('data.readFailed', lang))
    reader.readAsText(file)
  }

  function confirmRestore() {
    const ok = replaceDatabaseFromBackup(pendingBackup)
    setPendingBackup(null)
    if (ok) {
      triggerSaved(tUi('data.restored', lang))
      onGo('home')
    } else {
      showToast(tUi('data.restoreFailed', lang))
    }
  }

  function confirmReset() {
    resetDatabaseToSeed()
    setResetStep(0)
    setResetWord('')
    triggerSaved(tUi('data.resetDone', lang))
    onGo('home')
  }

  return (
    <section className={'screen' + (active ? ' active' : '')} id="dataSettings">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>{tUi('data.title', lang)}</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={() => onGo('settings')}>{tUi('common.close', lang)}</span>
        </div>

        <div className="gl pod">
          <div className="cap" style={{ marginTop: 0 }}>{tUi('data.info1', lang)}</div>
          <div className="cap">{tUi('data.info2', lang)}</div>
          <div className="cap">{tUi('data.info3', lang)}</div>
        </div>

        {/* 앱 설치 안내 */}
        <div>
          <div className="sect">{tUi('install.title', lang)}</div>
          <div className="gl pod">
            <div className="cap" style={{ marginTop: 0 }}>{tUi('install.note', lang)}</div>
            <div className="cap">{tUi('install.ios', lang)}</div>
            <div className="cap">{tUi('install.android', lang)}</div>
          </div>
        </div>

        {/* 백업 */}
        <div>
          <div className="sect">{tUi('data.backup', lang)}</div>
          <div className="gl pod">
            <div className="between" style={{ marginBottom: 12 }}>
              <span className="label">{tUi('data.includeDevice', lang)}</span>
              <div className="seg">
                <button className={!includeDevice ? 'on' : ''} onClick={() => setIncludeDevice(false)}>{tUi('common.hide', lang)}</button>
                <button className={includeDevice ? 'on' : ''} onClick={() => setIncludeDevice(true)}>{tUi('common.show', lang)}</button>
              </div>
            </div>
            <button className="btn block" style={{ padding: 14 }} onClick={doExportBackup}><span>{tUi('data.saveBackup', lang)}</span></button>
            <div style={{ height: 10 }} />
            <button className="btn block" style={{ padding: 14 }} onClick={doExportCsv}><span>{tUi('data.saveCsv', lang)}</span></button>
          </div>
        </div>

        {/* 복원 */}
        <div>
          <div className="sect">{tUi('data.restore', lang)}</div>
          <div className="gl pod">
            <div className="cap" style={{ marginTop: 0, marginBottom: 12 }}>{tUi('data.restoreNote', lang)}</div>
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={onPickFile} style={{ display: 'none' }} />
            {!pendingBackup ? (
              <button className="btn block" style={{ padding: 14 }} onClick={() => fileRef.current?.click()}><span>{tUi('data.loadBackup', lang)}</span></button>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div className="label" style={{ marginBottom: 12 }}>{tUi('data.restoreConfirm', lang)}</div>
                <div className="seg3">
                  <button onClick={() => setPendingBackup(null)}>{tUi('common.cancel', lang)}</button>
                  <button className="sel us" onClick={confirmRestore}>{tUi('data.restoreBtn', lang)}</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 초기화 */}
        <div>
          <div className="sect">{tUi('data.reset', lang)}</div>
          <div className="gl pod">
            <div className="cap" style={{ marginTop: 0, marginBottom: 12 }}>{tUi('data.resetNote', lang)}</div>
            {resetStep === 0 && (
              <div className="cap" style={{ textAlign: 'center', cursor: 'pointer', color: '#cf743d' }} onClick={() => setResetStep(1)}>{tUi('data.resetStart', lang)}</div>
            )}
            {resetStep === 1 && (
              <div style={{ textAlign: 'center' }}>
                <div className="label" style={{ marginBottom: 12 }}>{tUi('data.resetConfirm1', lang)}</div>
                <div className="seg3">
                  <button onClick={() => setResetStep(0)}>{tUi('common.cancel', lang)}</button>
                  <button className="sel ta" style={{ color: '#cf743d' }} onClick={() => setResetStep(2)}>{tUi('data.resetContinue', lang)}</button>
                </div>
              </div>
            )}
            {resetStep === 2 && (
              <div style={{ textAlign: 'center' }}>
                <div className="label" style={{ marginBottom: 10 }}>{tUi('data.resetTypeWord', lang)}</div>
                <input
                  type="text"
                  value={resetWord}
                  placeholder={RESET_WORD}
                  onChange={(e) => setResetWord(e.target.value)}
                  style={{ font: 'inherit', border: 0, borderRadius: 12, padding: '10px 12px', background: 'rgba(255,255,255,.45)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.35)', color: 'var(--ink)', textAlign: 'center', marginBottom: 12 }}
                />
                <div className="seg3">
                  <button onClick={() => { setResetStep(0); setResetWord('') }}>{tUi('common.cancel', lang)}</button>
                  <button className="sel ta" style={{ color: resetWord.trim() === RESET_WORD ? '#cf743d' : 'var(--ink3)' }} disabled={resetWord.trim() !== RESET_WORD} onClick={confirmReset}>{tUi('data.reset', lang)}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
