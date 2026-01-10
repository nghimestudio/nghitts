import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    tailwindcss(), 
    vue(),
    {
      name: 'onnx-wasm-plugin',
      configureServer(server) {
        // Local development API middleware - only active in dev mode
        // This middleware intercepts /api requests and serves from local filesystem
        // In production, requests will pass through to Cloudflare Pages Functions
        server.middlewares.use('/api', async (req, res, next) => {
          const url = req.url || '';
          
          // Handle /api/models endpoint
          if (url === '/models' || url === '/models/') {
            try {
              const modelsDir = path.join(__dirname, 'public', 'tts-model');
              
              // Check if directory exists
              if (!fs.existsSync(modelsDir)) {
                res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({ models: [] }));
                return;
              }

              // Read directory and find all .onnx.json files
              const files = fs.readdirSync(modelsDir);
              const models = files
                .filter(file => file.endsWith('.onnx.json'))
                .map(file => file.replace('.onnx.json', ''))
                .filter(name => name.length > 0)
                .sort();

              res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
              res.end(JSON.stringify({ models }));
            } catch (error) {
              console.error('Error listing local models:', error);
              res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
              res.end(JSON.stringify({ error: 'Failed to list models', message: error.message }));
            }
            return;
          }

          // Handle /api/model/[name] endpoint
          const modelMatch = url.match(/^\/model\/(.+)$/);
          if (modelMatch) {
            try {
              const fileName = decodeURIComponent(modelMatch[1]);
              const modelsDir = path.join(__dirname, 'public', 'tts-model');
              const filePath = path.join(modelsDir, fileName);

              // Security check: ensure file is within models directory
              const resolvedPath = path.resolve(filePath);
              const resolvedDir = path.resolve(modelsDir);
              if (!resolvedPath.startsWith(resolvedDir)) {
                res.writeHead(403, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({ error: 'Access denied' }));
                return;
              }

              // Check if file exists
              if (!fs.existsSync(filePath)) {
                res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({ error: 'Model file not found' }));
                return;
              }

              // Determine content type
              let contentType = 'application/octet-stream';
              if (fileName.endsWith('.json')) {
                contentType = 'application/json';
              } else if (fileName.endsWith('.onnx')) {
                contentType = 'application/octet-stream';
              }

              // Read and serve file
              const fileStats = fs.statSync(filePath);
              const fileContent = fs.readFileSync(filePath);

              res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': fileStats.size.toString(),
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=31536000, immutable',
              });
              res.end(fileContent);
            } catch (error) {
              console.error('Error serving model file:', error);
              res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
              res.end(JSON.stringify({ error: 'Failed to serve model file', message: error.message }));
            }
            return;
          }

          // If no match, pass through (for production/Cloudflare Pages Functions)
          next();
        });

        server.middlewares.use('/onnx-runtime', (req, res, next) => {
          // Strip ?import parameter from ONNX requests
          if (req.url.includes('?import')) {
            req.url = req.url.replace('?import', '');
          }
          if (req.url.endsWith('.mjs')) {
            res.setHeader('Content-Type', 'application/javascript');
            res.setHeader('Access-Control-Allow-Origin', '*');
          }
          next();
        });
        
        // Add caching for model files
        server.middlewares.use('/tts-model', (req, res, next) => {
          // Cache model files for 7 days (604800 seconds)
          res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
          res.setHeader('ETag', `"model-v1"`);
          next();
        });
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  worker: { format: "es" },
  build: {
    target: "esnext",
  },
  assetsInclude: ['**/*.wasm'],
  logLevel: "info",
});