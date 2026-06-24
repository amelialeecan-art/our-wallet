// 저장/안내 토스트. (프로토타입 동작 보존)
let toastTimer: ReturnType<typeof setTimeout>

// 토스트만 띄운다 (안내·경고용)
export function showToast(message: string): void {
  const toast = document.getElementById('toast')
  if (toast) {
    toast.textContent = message
    toast.classList.add('show')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800)
  }
}

// 저장 성공: 물방울 splash + 토스트
export function triggerSaved(message = '저장됐어요'): void {
  const phone = document.getElementById('phone')
  if (phone) {
    const s = document.createElement('div')
    s.className = 'splash'
    phone.appendChild(s)
    setTimeout(() => s.remove(), 900)
  }
  showToast(message)
}
