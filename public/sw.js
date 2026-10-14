const CACHE = 'civicwise-shell-v2'
const APP_SHELL = ['/', '/manifest.webmanifest', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter(
                (key) =>
                  key !== CACHE &&
                  (key.startsWith('civic-ledger-shell-') ||
                    key.startsWith('civicwise-shell-')),
              )
              .map((key) => caches.delete(key)),
          ),
        ),
      self.clients.claim(),
    ]),
  )
})
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  // Keep live records and Next.js navigation responses on the network.
  if (
    url.pathname.startsWith('/api/') ||
    request.headers.get('RSC') === '1' ||
    url.searchParams.has('_rsc')
  )
    return
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            event.waitUntil(
              caches.open(CACHE).then((cache) => cache.put(request, copy)),
            )
          }
          return response
        })
        .catch(
          async () =>
            (await caches.match(request)) ||
            (await caches.match('/')) ||
            Response.error(),
        ),
    )
    return
  }
  if (
    url.pathname.startsWith('/_next/static/') ||
    ['/manifest.webmanifest', '/icon.svg', '/apple-icon.png'].includes(
      url.pathname,
    )
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone()
              event.waitUntil(
                caches.open(CACHE).then((cache) => cache.put(request, copy)),
              )
            }
            return response
          }),
      ),
    )
  }
})
