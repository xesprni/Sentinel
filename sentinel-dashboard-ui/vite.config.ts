import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/v1": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/v2": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/metric": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/resource": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/app": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/cluster": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/gateway": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/system": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/degrade": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/authority": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/paramFlow": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/registry": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
