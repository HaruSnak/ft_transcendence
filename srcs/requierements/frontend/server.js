import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting frontend server...');
console.log('📁 Server root directory:', __dirname);

const server = http.createServer((req, res) => {
  console.log(`📨 Request: ${req.method} ${req.url}`);

  // Remove query string from URL
  const url = req.url.split('?')[0];
  let filePath;

  // Handle public files
  if (url.startsWith('/public/')) {
    filePath = path.join(__dirname, url);
  } else if (url === '/' || url === '/index.html') {
    filePath = path.join(__dirname, 'index.html');
  } else if (url === '/favicon.ico') {
    filePath = path.join(__dirname, 'public', 'favicon.ico');
  } else {
    filePath = path.join(__dirname, url);
  }

  console.log(`📁 Resolved file path: ${filePath}`);

  const ext = path.extname(filePath);
  let contentType = 'text/html';

  switch (ext) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
      contentType = 'image/jpg';
      break;
    case '.ico':
      contentType = 'image/x-icon';
      break;
  }

  console.log(`📄 Content type: ${contentType}`);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error(`❌ Error reading file ${filePath}:`, err.message);
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      console.log(`✅ File served: ${filePath} (${data.length} bytes)`);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

server.listen(8081, () => {
  console.log('🎉 Server running at http://localhost:8081/');
  console.log('📋 Available routes:');
  console.log('   - / : index.html');
  console.log('   - /public/* : static files');
  console.log('   - /favicon.ico : favicon');
});