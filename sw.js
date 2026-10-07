const PROXY_PREFIX = '/proxy?url=';
const TARGET_HOST = 'https://roblox.com';

self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // Skip tracking requests originating from your own Render console controls
    if (requestUrl.pathname === '/' || requestUrl.pathname === '/index.html' || requestUrl.pathname === '/sw.js') {
        return;
    }

    // Fix 1: If the request is a relative path (pointing to your Render domain), force it to point to Roblox
    let cleanTargetUrl = event.request.url;
    if (requestUrl.origin === self.location.origin && !requestUrl.pathname.startsWith('/proxy')) {
        cleanTargetUrl = TARGET_HOST + requestUrl.pathname + requestUrl.search;
    }

    // Fix 2: If the request is heading to Roblox or its asset delivery networks, tunnel it through your proxy route
    if (cleanTargetUrl.includes('roblox.com') || cleanTargetUrl.includes('rbxcdn.com')) {
        const secureProxyUrl = `${self.location.origin}${PROXY_PREFIX}${encodeURIComponent(cleanTargetUrl)}`;
        
        event.respondWith(
            fetch(secureProxyUrl, {
                method: event.request.method,
                headers: event.request.headers,
                credentials: 'omit'
            }).catch(() => {
                return fetch(event.request);
            })
        );
    }
});
