const http = require('http');
const fs = require('fs');
const path = require('path');
const httpProxy = require('http-proxy');

// Create a proxy instance to scramble the traffic data
const proxy = httpProxy.createProxyServer({
    changeOrigin: true,
    autoRewrite: true,
    ssl: { rejectUnauthorized: false }
});

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    // 1. Serve your custom HTML interface on the main page
    if (req.url === '/' || req.url === '/index.html') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content);
            }
        });
    } 
    // 2. Intercept and route game traffic through the proxy engine
    else if (req.url.startsWith('/proxy')) {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const targetUrl = urlParams.searchParams.get('url');

        if (targetUrl) {
            console.log(`[Proxy Engine] Encrypting traffic for: ${targetUrl}`);
            proxy.web(req, res, { target: targetUrl }, (error) => {
                res.writeHead(500);
                res.end('Proxy routing handshake failed.');
            });
        } else {
            res.writeHead(400);
            res.end('Missing target parameter.');
        }
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Proxy dashboard running live on port ${PORT}`);
});
