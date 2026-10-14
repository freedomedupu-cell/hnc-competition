import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

// Trigger non-blocking build if dist directory is missing
if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  console.log('dist/index.html not found. Triggering background build...');
  exec('npm run build', (err, stdout, stderr) => {
    if (err) {
      console.error('Background build error:', err);
    } else {
      console.log('Background build completed successfully.');
    }
  });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

const server = http.createServer((req, res) => {
  // Health check endpoints for Cloud Run & load balancers
  const urlPath = (req.url || '/').split('?')[0];
  if (
    urlPath === '/healthz' ||
    urlPath === '/_health' ||
    urlPath === '/health' ||
    urlPath === '/ping' ||
    urlPath === '/api/health'
  ) {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('OK');
    return;
  }

  // Safe path parsing
  let reqPath = '/index.html';
  try {
    const rawPath = decodeURIComponent(urlPath);
    reqPath = rawPath === '/' ? '/index.html' : rawPath;
  } catch (e) {
    reqPath = urlPath === '/' ? '/index.html' : urlPath;
  }

  const filePath = path.join(DIST_DIR, reqPath);

  // Security check: ensure path is within DIST_DIR
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const isAsset = reqPath.startsWith('/assets/');

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': isAsset
          ? 'public, max-age=31536000, immutable'
          : 'no-cache, no-store, must-revalidate',
      });

      fs.createReadStream(filePath).pipe(res);
    } else {
      // Fallback to index.html for SPA client-side routing
      const indexPath = path.join(DIST_DIR, 'index.html');
      fs.stat(indexPath, (indexErr, indexStats) => {
        if (!indexErr && indexStats.isFile()) {
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          });
          fs.createReadStream(indexPath).pipe(res);
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<!DOCTYPE html><html><body><h1>HNC Competition App</h1></body></html>');
        }
      });
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});

// Global error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle graceful shutdown for Cloud Run
const shutdown = () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server shut down cleanly');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
