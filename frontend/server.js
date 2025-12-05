const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Remove query string and decode URL
  let filePath = decodeURIComponent(req.url.split('?')[0]);
  
  // Default to index.html if root
  if (filePath === '/' || filePath === '') {
    filePath = '/index.html';
  }
  
  // Remove leading slash
  if (filePath.startsWith('/')) {
    filePath = filePath.substring(1);
  }
  
  // Handle different file types
  if (filePath.startsWith('css/')) {
    // CSS files: css/pages/filename.css
    filePath = './' + filePath;
  } else if (filePath.startsWith('js/')) {
    // JS files: js/pages/filename.js or js/services/api.js
    filePath = './' + filePath;
  } else if (filePath.startsWith('assets/')) {
    // Assets: assets/images, assets/icons, etc.
    filePath = './' + filePath;
  } else if (filePath.endsWith('.html')) {
    // HTML files are in pages directory
    filePath = './pages/' + filePath;
  } else if (filePath.endsWith('.css')) {
    // Direct CSS file request (from HTML)
    const fileName = path.basename(filePath);
    // Check if it's a relative path like ../css/pages/style.css
    if (filePath.includes('../css/pages/')) {
      filePath = './css/pages/' + fileName;
    } else {
      filePath = './css/pages/' + fileName;
    }
  } else if (filePath.endsWith('.js')) {
    // Direct JS file request (from HTML)
    const fileName = path.basename(filePath);
    if (fileName === 'api.js') {
      filePath = './js/services/' + fileName;
    } else {
      filePath = './js/pages/' + fileName;
    }
  } else {
    // Try assets directory for other files
    filePath = './assets/' + filePath;
  }
  
  // Get file extension
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  // Read and serve file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        console.error(`404: File not found - ${filePath}`);
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        console.error(`500: Server error - ${err.message}`);
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Frontend Server running at http://localhost:${PORT}`);
  console.log(`📄 Login: http://localhost:${PORT}/index.html`);
  console.log(`📄 Dashboard: http://localhost:${PORT}/dashboard.html`);
  console.log(`\nPress Ctrl+C to stop the server\n`);
});
