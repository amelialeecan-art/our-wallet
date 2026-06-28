import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

// 폰 외형 + 물방울 인터랙션(탭 리플, 보잉 흔들림)을 담당하는 셸.
// 프로토타입의 phone 컨테이너 스크립트를 React로 옮긴 것.
export default function PhoneFrame({ children }: { children: ReactNode }) {
  const phoneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const phone = phoneRef.current
    if (!phone) return

    // 탭한 지점에서 퍼지는 물결
    function onPointerDown(e: PointerEvent) {
      const r = phone!.getBoundingClientRect()
      const sz = 118
      const d = document.createElement('div')
      d.className = 'ripple'
      d.style.width = d.style.height = sz + 'px'
      d.style.left = e.clientX - r.left + 'px'
      d.style.top = e.clientY - r.top + 'px'
      phone!.appendChild(d)
      setTimeout(() => d.remove(), 560)
    }

    // 눌린 물방울 요소의 출렁임
    function jiggle(el: Element) {
      el.classList.remove('jiggle')
      void (el as HTMLElement).offsetWidth
      el.classList.add('jiggle')
    }
    function onClick(e: MouseEvent) {
      const target = e.target as Element | null
      const t = target?.closest(
        '.btn,.addbtn,.gl.prow,.chip,.gl.qbtn,.gl.due,.seg button,.seg3 button,#spendTabs button,.tabbar .tab,.keypad button,.gl.pod[data-go]',
      )
      if (t) jiggle(t)
    }

    phone.addEventListener('pointerdown', onPointerDown, { passive: true })
    phone.addEventListener('click', onClick)
    return () => {
      phone.removeEventListener('pointerdown', onPointerDown)
      phone.removeEventListener('click', onClick)
    }
  }, [])

  return (
    <div className="phone" id="phone" ref={phoneRef}>
      {children}
    </div>
  )
}
