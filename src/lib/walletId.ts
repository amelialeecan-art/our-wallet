// 공동지갑 id: URL ?wallet= 에서 읽고, 충분히 긴 랜덤 id 생성.

export function genWalletId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto
  if (c?.randomUUID) return 'w_' + c.randomUUID().replace(/-/g, '')
  return 'w_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 14)
}

export function walletIdFromUrl(): string | null {
  try {
    return new URLSearchParams(window.location.search).get('wallet')
  } catch {
    return null
  }
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
