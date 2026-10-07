// Active Service Worker to intercept subresources and direct them through the proxy route
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // Filter requests targeting Roblox infrastructure or core asset CDNs
    if (requestUrl.href.includes('roblox.com') || requestUrl.href.includes('rbxcdn.com')) {
        // Intercept asset fetching and force mapping onto your Render server runtime instead
        const secureProxyUrl = `${self.location.origin}/proxy?url=${encodeURIComponent(event.request.url)}`;
        
        event.respondWith(
            fetch(secureProxyUrl, {
                method: event.request.method,
                headers: event.request.headers,
                mode: 'cors',
                credentials: 'omit'
            }).catch(() => {
                // Fail-safe fall back parameter if background streaming disconnects
                return fetch(event.request);
            })
        );
    }
});
