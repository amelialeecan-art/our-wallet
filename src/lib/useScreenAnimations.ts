import { useEffect } from 'react'
import type { RefObject } from 'react'

// 화면이 활성화될 때 물줄기 바(.fill)와 액체 기둥(.lq)을 0에서 목표치로 채운다.
// 프로토타입의 animateFills 동작을 React로 옮긴 것.
export function useScreenAnimations(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
): void {
  useEffect(() => {
    if (!active || !ref.current) return
    const root = ref.current
    const timer = setTimeout(() => {
      root.querySelectorAll<HTMLElement>('.fill[data-w]').forEach((f) => {
        f.style.width = '0%'
        requestAnimationFrame(() => {
          setTimeout(() => {
            f.style.width = f.dataset.w + '%'
          }, 40)
        })
      })
      root.querySelectorAll<HTMLElement>('.lq[data-h]').forEach((l) => {
        l.style.height = '0%'
        requestAnimationFrame(() => {
          setTimeout(() => {
            l.style.height = l.dataset.h + '%'
          }, 40)
        })
      })
    }, 120)
    return () => clearTimeout(timer)
  }, [active, ref])
}
