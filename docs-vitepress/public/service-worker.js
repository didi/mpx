// force clearing previous service worker
// see https://discord.com/channels/325477692906536972/790509637598314527/1032614068164493402
// see https://vite-pwa-org-zh.netlify.app/guide/unregister-service-worker
self.addEventListener('install', (e) => {
  console.log('[old service-worker] install', e)
  self.skipWaiting()
})
self.addEventListener('activate', (e) => {
  console.log('[old service-worker] activate', e)
  self.registration
      .unregister()
      .then(() => self.clients.matchAll())
      .then((clients) => {
          clients.forEach((client) => {
              if (client && client.navigate && client.url) {
                  client.navigate(client.url)
              }
          })
          return Promise.resolve()
      })
      .then(() => {
          self.caches.keys().then((cacheNames) => {
              Promise.all(
                  cacheNames.map((cacheName) => {
                      return self.caches.delete(cacheName)
                  })
              )
          })
      })
})
