import { useState } from 'react'
import { useWallet, type SyncStatus } from '../store/WalletProvider.tsx'
import { showToast, triggerSaved } from '../lib/feedback.ts'
import { tEnum, tUi } from '../i18n/labels.ts'
import type { ScreenId } from '../types'

interface Props {
  active: boolean
  onGo: (id: ScreenId) => void
}

function statusKey(status: SyncStatus): string {
  return `share.status.${status}`
}

export default function ShareSettingsScreen({ active, onGo }: Props) {
  const {
    lang,
    role,
    firebaseReady,
    walletId,
    shareUrl,
    syncStatus,
    createSharedWallet,
    uploadToShared,
    reloadFromShared,
  } = useWallet()

  const [confirmReload, setConfirmReload] = useState(false)
  const [confirmUpload, setConfirmUpload] = useState(false)

  const shared = Boolean(walletId)

  async function copyLink() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      showToast(tUi('share.copied', lang))
    } catch {
      // 클립보드 차단 시 안내만 (링크는 화면에 보임)
      showToast(tUi('share.copyFailed', lang))
    }
  }

  function doCreate() {
    createSharedWallet()
    triggerSaved(tUi('share.created', lang))
  }

  function doUpload() {
    setConfirmUpload(false)
    uploadToShared()
    showToast(tUi('share.uploaded', lang))
  }

  function doReload() {
    setConfirmReload(false)
    reloadFromShared()
    showToast(tUi('share.reloaded', lang))
  }

  return (
    <section className={'screen' + (active ? ' active' : '')} id="shareSettings">
      <div className="stack">
        <div className="between" style={{ padding: '0 4px' }}>
          <div className="head" style={{ padding: 0 }}>{tUi('share.title', lang)}</div>
          <span className="label" style={{ color: 'var(--aqua-d)', cursor: 'pointer' }} onClick={() => onGo('settings')}>{tUi('common.close', lang)}</span>
        </div>

        <div className="gl pod">
          <div className="cap" style={{ marginTop: 0 }}>{tUi('share.intro', lang)}</div>
        </div>

        {/* Firebase 미설정 안내 */}
        {!firebaseReady && (
          <div className="gl pod">
            <div className="cap" style={{ marginTop: 0 }}>{tUi('share.unavailable', lang)}</div>
            <div className="cap">{tUi('share.setupHint', lang)}</div>
          </div>
        )}

        {/* 현재 상태 */}
        <div>
          <div className="sect">{tUi('share.status', lang)}</div>
          <div className="prows">
            <div className="gl prow">
              <div className="grow"><div className="st-t">{tUi('share.mode', lang)}</div></div>
              <span className="mini">{shared ? tUi('share.mode.shared', lang) : tUi('share.mode.local', lang)}</span>
            </div>
            <div className="gl prow">
              <div className="grow"><div className="st-t">{tUi('share.status', lang)}</div></div>
              <span className="mini">{tUi(statusKey(syncStatus), lang)}</span>
            </div>
            <div className="gl prow">
              <div className="grow"><div className="st-t">{tUi('share.role', lang)}</div></div>
              <span className="mini">{role ? tEnum('role', role, lang) : '-'}</span>
            </div>
          </div>
        </div>

        {/* 공동지갑이 있을 때: 링크 / ID / 공유 */}
        {firebaseReady && shared && (
          <>
            <div>
              <div className="sect">{tUi('share.link', lang)}</div>
              <div className="gl pod">
                <div className="cap" style={{ marginTop: 0, marginBottom: 12 }}>{tUi('share.already', lang)}</div>
                <div className="cap" style={{ marginTop: 0, marginBottom: 6 }}>{tUi('share.walletId', lang)}</div>
                <div className="num" style={{ wordBreak: 'break-all', fontSize: 13, marginBottom: 12, color: 'var(--ink2)' }}>{walletId}</div>
                <div
                  className="num"
                  style={{ wordBreak: 'break-all', fontSize: 12, marginBottom: 12, color: 'var(--ink3)', background: 'rgba(255,255,255,.4)', borderRadius: 12, padding: '10px 12px' }}
                >
                  {shareUrl}
                </div>
                <button className="btn block" style={{ padding: 14 }} onClick={copyLink}><span>{tUi('share.copyLink', lang)}</span></button>
              </div>
            </div>

            <div className="gl pod" style={{ background: 'rgba(207,116,61,.08)' }}>
              <div className="cap" style={{ marginTop: 0, color: '#cf743d' }}>{tUi('share.warn', lang)}</div>
            </div>

            {/* 데이터 방향 */}
            <div>
              <div className="sect">{tUi('common.manage', lang)}</div>
              <div className="gl pod">
                <div className="cap" style={{ marginTop: 0, marginBottom: 12 }}>{tUi('share.reloadNote', lang)}</div>
                {!confirmReload ? (
                  <button className="btn block" style={{ padding: 14 }} onClick={() => setConfirmReload(true)}><span>{tUi('share.reload', lang)}</span></button>
                ) : (
                  <div className="seg3">
                    <button onClick={() => setConfirmReload(false)}>{tUi('common.cancel', lang)}</button>
                    <button className="sel us" onClick={doReload}>{tUi('share.reload', lang)}</button>
                  </div>
                )}
                <div style={{ height: 14 }} />
                <div className="cap" style={{ marginTop: 0, marginBottom: 12 }}>{tUi('share.uploadNote', lang)}</div>
                {!confirmUpload ? (
                  <button className="btn block" style={{ padding: 14 }} onClick={() => setConfirmUpload(true)}><span>{tUi('share.upload', lang)}</span></button>
                ) : (
                  <div className="seg3">
                    <button onClick={() => setConfirmUpload(false)}>{tUi('common.cancel', lang)}</button>
                    <button className="sel ta" style={{ color: '#cf743d' }} onClick={doUpload}>{tUi('share.upload', lang)}</button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* 공동지갑이 없을 때: 만들기 */}
        {firebaseReady && !shared && (
          <div>
            <div className="sect">{tUi('share.create', lang)}</div>
            <div className="gl pod">
              <div className="cap" style={{ marginTop: 0, marginBottom: 12 }}>{tUi('share.createNote', lang)}</div>
              <button className="btn block" style={{ padding: 14 }} onClick={doCreate}><span>{tUi('share.create', lang)}</span></button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
