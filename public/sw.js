/* 우리지갑 서비스워커 — 앱 껍데기 오프라인 로딩용 (데이터 동기화 아님)
 * - 내비게이션: network-first → 오프라인이면 캐시된 index로 폴백 (새 배포 반영 위해)
 * - 정적 에셋(해시 파일명): stale-while-revalidate
 * - 새 버전 배포 시 CACHE 버전을 올려 옛 캐시를 정리
 * localStorage 데이터는 건드리지 않는다. 백업 다운로드(Blob)는 fetch가 아니라 영향 없음.
 */
const CACHE = 'ourwallet-shell-v1'
const SCOPE = self.registration.scope

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(caches.open(CACHE).then((c) => c.add(SCOPE)).catch(() => {}))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    e.respondWith(
      (async () => {
        try {
          const net = await fetch(req)
          const c = await caches.open(CACHE)
          c.put(SCOPE, net.clone())
          return net
        } catch {
          const c = await caches.open(CACHE)
          return (await c.match(SCOPE)) || (await c.match(req)) || Response.error()
        }
      })(),
    )
    return
  }

  e.respondWith(
    (async () => {
      const c = await caches.open(CACHE)
      const cached = await c.match(req)
      const network = fetch(req)
        .then((net) => {
          if (net && net.ok) c.put(req, net.clone())
          return net
        })
        .catch(() => null)
      return cached || (await network) || Response.error()
    })(),
  )
})
