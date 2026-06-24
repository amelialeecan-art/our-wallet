// ===== 저장소 어댑터 =====
// localStorage 접근을 한 겹 감싼다. 나중에 Firebase로 갈아끼우기 쉽도록
// 앱의 나머지 부분은 이 인터페이스만 의존한다.

export interface StorageAdapter {
  read(key: string): string | null
  write(key: string, value: string): void
  remove(key: string): void
}

// localStorage 사용 불가(프라이빗 모드 등) 시에도 앱이 죽지 않도록 메모리 폴백.
function createLocalStorageAdapter(): StorageAdapter {
  const memory = new Map<string, string>()
  let available = false
  try {
    const probe = '__ourwallet_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    available = true
  } catch {
    available = false
  }

  return {
    read(key) {
      try {
        return available ? window.localStorage.getItem(key) : (memory.get(key) ?? null)
      } catch {
        return memory.get(key) ?? null
      }
    },
    write(key, value) {
      try {
        if (available) window.localStorage.setItem(key, value)
        else memory.set(key, value)
      } catch {
        memory.set(key, value)
      }
    },
    remove(key) {
      try {
        if (available) window.localStorage.removeItem(key)
        else memory.delete(key)
      } catch {
        memory.delete(key)
      }
    },
  }
}

export const storage: StorageAdapter = createLocalStorageAdapter()
