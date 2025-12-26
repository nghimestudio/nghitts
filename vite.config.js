import path from "path";

import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    tailwindcss(), 
    vue(),
    {
      name: 'onnx-wasm-plugin',
      configureServer(server) {
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
  logLevel: process.env.NODE_ENV === "development" ? "error" : "info",
});