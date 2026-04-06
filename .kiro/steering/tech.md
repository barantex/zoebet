# Tech Stack

## Frontend
- **React 19** with **TypeScript**
- **React Router v7** for client-side routing
- **Vite 8** as build tool and dev server
- **ESLint** with typescript-eslint and react-hooks plugins
- No CSS framework — custom CSS classes with `zoe-` prefix (BEM-like)

## Backend
- **Node.js** with **Express 5** (CommonJS modules)
- **better-sqlite3** — synchronous SQLite driver
- **JWT** (jsonwebtoken) for auth tokens — 7-day expiry
- **dotenv** for environment config
- **cors** enabled globally

## Key Environment Variables
- `JWT_SECRET` — secret for signing JWTs (defaults to `dev_secret_key`)
- `PORT` — server port (defaults to `4000`)
- `VITE_API_URL` — API base URL on the frontend (defaults to `/api`)

## API Proxy
Vite proxies `/api` → `http://localhost:4000` in development.

## Common Commands

```bash
# Frontend dev server (run manually)
npm run dev

# Production build
npm run build

# Lint
npm run lint

# Backend server (run manually from /server)
node index.js
```

## Database
SQLite file at `server/zoebet.sqlite`. Schema is auto-initialized in `server/db.js` on startup. Tables: `users`, `wallets`, `transactions`.
