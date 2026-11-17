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

// Daily practice reminders sent by the API (see server/utils/dailyPush.js).
self.addEventListener('push', event => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { body: event.data?.text() } }
  event.waitUntil(self.registration.showNotification(data.title || 'Time for Chinese practice', {
    body: data.body || 'A few minutes of practice keeps your Chinese growing.',
    icon: '/pwa/icon-192.png?v=xiao-logo-2',
    badge: '/pwa/icon-192.png?v=xiao-logo-2',
    tag: data.tag || 'daily-practice',
    renotify: false,
    data: { url: typeof data.url === 'string' && data.url.startsWith('/') && !data.url.startsWith('//') ? data.url : '/' },
  }))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const open = windows.find(client => new URL(client.url).origin === self.location.origin)
    if (open) {
      await open.focus()
      if ('navigate' in open && open.url !== target) await open.navigate(target).catch(() => {})
      return
    }
    await self.clients.openWindow(target)
  })())
})
