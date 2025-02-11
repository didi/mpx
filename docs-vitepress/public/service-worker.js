// force an unregister
// see https://discord.com/channels/325477692906536972/790509637598314527/1032614068164493402
self.addEventListener('install', function (e) {
    console.log('[old service-worker] install', e)
    self.skipWaiting()
})
self.addEventListener('activate', function (e) {
    console.log('[old service-worker] activate', e)
    self.registration
        .unregister()
        .then(function () {
            return self.clients.matchAll()
        })
        .then(function (clients) {
            clients.forEach((client) => client.navigate(client.url))
        })
})
