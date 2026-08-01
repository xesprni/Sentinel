import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const proxyTarget = process.env.VITE_PROXY_TARGET || loadEnv(mode, __dirname, "").VITE_PROXY_TARGET || "http://localhost:8080";
  const proxyConfig = {
    target: proxyTarget,
    changeOrigin: true,
    // Spring rejects the browser's Vite origin even though the request is same-origin from the UI.
    headers: { origin: proxyTarget },
  };

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      proxy: Object.fromEntries(
        ["/v1", "/v2", "/auth", "/metric", "/resource", "/app", "/cluster", "/gateway", "/system", "/degrade", "/authority", "/paramFlow", "/registry"]
          .map((route) => [route, proxyConfig]),
      ),
    },
  };
});
