import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  
  build: {
    outDir: "dist",
    rollupOptions: {
      input: "index.html",
    },
  },

  server: {
    port: 5173, 
    strictPort: true,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://fastify_backend:3000",
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      "/ws": {
        target: "http://fastify_backend:3000",
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws/, '/ws'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('websocket proxy error', err);
          });
          proxy.on('proxyReqWs', (proxyReq, req, socket, options, head) => {
            console.log('Websocket connection attempt:', req.url);
          });
          proxy.on('open', (proxySocket) => {
            console.log('Websocket connection open');
          });
          proxy.on('close', (proxyRes, proxySocket, proxyHead) => {
            console.log('Websocket connection closed');
          });
        },
      },
    },
  },

  preview: {
    port: 5173,
    strictPort: true,
    host: "0.0.0.0",
  },
});
