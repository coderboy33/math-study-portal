const http = require('http');
const fs = require('fs');
const path = require('path');
const httpProxy = require('http-proxy');

// Advanced proxy core configured to actively rewrite security parameters
const proxy = httpProxy.createProxyServer({
    changeOrigin: true,
    autoRewrite: true,
    followRedirects: true,
    ssl: { rejectUnauthorized: false }
});

// Intercept the target site's response to strip out frame blocks live
proxy.on('proxyRes', function (proxyRes, req, res) {
    // Delete the security blocks that stop Roblox from opening in an iframe
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
    
    // Enable cross-origin permissions dynamically
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
});

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    // 1. Deliver your polished green/navy dashboard
    if (req.url === '/' || req.url === '/index.html') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end('Dashboard core asset delivery failure.');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content);
            }
        });
    } 
    // 2. Intercept and completely scrub the target site request
    else if (req.url.startsWith('/proxy')) {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        let targetUrl = urlParams.searchParams.get('url');

        if (targetUrl) {
            // Enforce clean formatting protocols
            if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
                targetUrl = 'https://' + targetUrl;
            }

            console.log(`[Tunnel Active] Overriding headers for: ${targetUrl}`);
            
            // Execute the connection redirect
            proxy.web(req, res, { target: targetUrl }, (error) => {
                res.writeHead(500);
                res.end('Proxy handshake timed out or dropped by target.');
            });
        } else {
            res.writeHead(400);
            res.end('Missing target parameter link.');
        }
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Quantum Node Gateway online on port ${PORT}`);
});
