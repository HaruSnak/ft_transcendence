import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5174;

console.log('🚀 Starting frontend server...');
console.log('📁 Server root directory:', __dirname);

// Proxy API requests
app.use('/api/auth', createProxyMiddleware({ target: 'http://localhost:3003', changeOrigin: true }));
app.use('/api/chat', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
app.use('/api/game', createProxyMiddleware({ target: 'http://localhost:3002', changeOrigin: true }));
app.use('/api/user', createProxyMiddleware({ target: 'http://localhost:3003', changeOrigin: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`🎉 Server running at http://localhost:${port}/`);
  console.log('📋 Available routes:');
  console.log('   - / : index.html');
  console.log('   - /public/* : static files');
  console.log('   - /api/* : proxied to backends');
});