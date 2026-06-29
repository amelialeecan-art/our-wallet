// 공동지갑 id: URL ?wallet= 에서 읽고, 충분히 긴 랜덤 id 생성.

export function genWalletId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto
  if (c?.randomUUID) return 'w_' + c.randomUUID().replace(/-/g, '')
  return 'w_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 14)
}

export function walletIdFromUrl(): string | null {
  try {
    const raw = new URLSearchParams(window.location.search).get('wallet')
    const id = raw?.trim()
    // 빈 문자열(?wallet=)은 없는 것으로 취급 → lastWalletId 폴백이 작동하도록
    return id ? id : null
  } catch {
    return null
  }
}

// 최초 연결할 공동지갑 id 결정: URL 우선, 없으면 마지막으로 연결했던 지갑.
// (PWA/홈화면은 start_url이 './'라 wallet 파라미터가 없으므로 lastWalletId로 복구)
export function resolveInitialWalletId(lastWalletId: string | null | undefined): string | null {
  const fromUrl = walletIdFromUrl()
  if (fromUrl) return fromUrl
  const last = lastWalletId?.trim()
  return last ? last : null
}

// 주소창 쿼리에 wallet id 반영 (히스토리 추가 없이)
export function setWalletIdInUrl(walletId: string | null): void {
  try {
    const url = new URL(window.location.href)
    if (walletId) url.searchParams.set('wallet', walletId)
    else url.searchParams.delete('wallet')
    window.history.replaceState({}, '', url.toString())
  } catch {
    // 무시
  }
}

export function buildShareUrl(walletId: string): string {
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`
  return `${base}?wallet=${encodeURIComponent(walletId)}`
}
