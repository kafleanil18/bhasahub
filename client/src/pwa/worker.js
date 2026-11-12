/* global self, caches */
const CACHE = 'xiaoao-offline-__BUILD_ID__'
const OFFLINE = '/offline.html'

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.add(new Request(OFFLINE, { cache: 'reload' }))))
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('xiaoao-offline-') && key !== CACHE) await caches.delete(key)
    }
    await self.clients.claim()
  })())
})

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting())
})

// Only document navigations receive the fallback. Never cache APIs, account
// data, audio, or failed requests as HTML.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate' ||
      url.origin !== self.location.origin || /^\/(api|uploads)(\/|$)/.test(url.pathname)) return
  event.respondWith(fetch(event.request).catch(async () => {
    const cache = await caches.open(CACHE)
    return (await cache.match(OFFLINE)) || Response.error()
  }))
})
