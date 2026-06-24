// 저장 피드백: 물방울이 튀어오르고 토스트가 뜬다. (프로토타입 동작 보존)
let toastTimer

export function triggerSaved(message = '저장됐어요') {
  const phone = document.getElementById('phone')
  if (phone) {
    const s = document.createElement('div')
    s.className = 'splash'
    phone.appendChild(s)
    setTimeout(() => s.remove(), 900)
  }
  const toast = document.getElementById('toast')
  if (toast) {
    toast.textContent = message
    toast.classList.add('show')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800)
  }
}
