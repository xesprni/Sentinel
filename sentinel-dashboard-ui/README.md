# Sentinel Dashboard UI

React 19 + TypeScript implementation of the Sentinel dashboard frontend.

## Development

Install dependencies and start the Vite development server:

```bash
pnpm install
pnpm dev
```

The development server listens on `http://localhost:5173` and proxies dashboard API requests to `http://localhost:8080` by default. To use a dashboard backend on another address:

```bash
VITE_PROXY_TARGET=http://localhost:8862 pnpm dev
```

`VITE_PROXY_TARGET` is only used by the development proxy. For a separately hosted production frontend, set `VITE_API_BASE_URL` to the dashboard API base URL and configure CORS or a same-origin reverse proxy.

## Verification

```bash
pnpm lint
pnpm build
```

The production bundle is written to `dist/`.
