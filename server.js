const http = require('http');
const fs = require('fs');
const path = require('path');
const httpProxy = require('http-proxy');

// Advanced proxy instance to seamlessly handle redirection and asset headers
const proxy = httpProxy.createProxyServer({
    changeOrigin: true,
    autoRewrite: true,
    followRedirects: true,
    ssl: { rejectUnauthorized: false }
});

// Intercept target site responses to strip anti-framing and security protocols live
proxy.on('proxyRes', function (proxyRes, req, res) {
    // Erase security headers preventing embedded framework loading
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
    
    // Inject flexible cross-origin sharing access parameters
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'X-Requested-With, Content-Type, Authorization';
});

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    // Enable core routing options for local assets
    if (req.url === '/' || req.url === '/index.html') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading dashboard assets.');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content);
            }
        });
    } 
    // Deliver the service worker asset-interceptor layer
    else if (req.url === '/sw.js') {
        fs.readFile(path.join(__dirname, 'sw.js'), (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading service worker schema.');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/javascript' });
                res.end(content);
            }
        });
    }
    // Parse proxy query strings and scrub the outbound request configurations
    else if (req.url.startsWith('/proxy')) {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        let targetUrl = urlParams.searchParams.get('url');

        if (targetUrl) {
            // Guarantee unified URL schema formatting 
            if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
                targetUrl = 'https://' + targetUrl;
            }

            console.log(`[Tunnel Relay] Fetching target layout data for: ${targetUrl}`);
            
            proxy.web(req, res, { target: targetUrl }, (error) => {
                res.writeHead(500);
                res.end('Handshake timed out or rejected by destination host.');
            });
        } else {
            res.writeHead(400);
            res.end('Missing core gateway destination parameter.');
        }
    } else {
        res.writeHead(404);
        res.end('Route Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Bypasser portal running smoothly on port ${PORT}`);
});
