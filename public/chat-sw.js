// SamInvest chat — Web Push service worker.
// Sayt yopiq bo'lsa ham operator javobini brauzer bildirishnomasi orqali ko'rsatadi.

self.addEventListener('push', (event) => {
    let data = {}
    try {
        data = event.data ? event.data.json() : {}
    } catch (e) {
        data = {}
    }

    const title = data.title || 'SamInvest'
    const options = {
        body: data.body || '',
        icon: '/android-chrome-192x192.png',
        badge: '/favicon-32x32.png',
        tag: 'saminvest-chat',
        renotify: true,
        data: { url: data.url || '/' },
    }

    event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const targetUrl = (event.notification.data && event.notification.data.url) || '/'

    event.waitUntil(
        self.clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if ('focus' in client) {
                        if ('navigate' in client) {
                            client.navigate(targetUrl).catch(() => {})
                        }
                        return client.focus()
                    }
                }
                if (self.clients.openWindow) {
                    return self.clients.openWindow(targetUrl)
                }
            })
    )
})
