# Project Structure

## Root
```
/                   # Frontend (Vite + React + TS)
/server/            # Backend (Express + SQLite)
/dist/              # Production build output (served by Express in prod)
/public/            # Static assets (favicon, icons, logo)
```

## Frontend — `src/`

| Path | Purpose |
|---|---|
| `src/main.tsx` | Entry point, mounts `<App>` inside `<BrowserRouter>` |
| `src/App.tsx` | Root layout, route definitions, `AuthProvider` wrapper |
| `src/App.css` | Global styles — all `zoe-*` CSS classes live here |
| `src/pages/` | Page-level components, one file per section |
| `src/components/` | Shared layout components (`ZoeHeader`, `ZoeFooter`, `ZoeSidebar`, etc.) |
| `src/admin/` | Admin back office layout and pages |
| `src/auth/` | `AuthContext` (login/register/logout state) and `ProtectedRoute` |
| `src/api/` | API client utilities (`client.ts` = base fetcher, `dragon.ts` = Dragon API) |
| `src/lib/` | Business logic, type definitions, localStorage helpers |
| `src/data/` | Static JSON data and loaders |
| `src/assets/` | Image assets |

## Backend — `server/`

| Path | Purpose |
|---|---|
| `server/index.js` | Express app entry, middleware, route mounting |
| `server/db.js` | SQLite connection and schema initialization |
| `server/seed.js` | Seeds default admin user on startup |
| `server/routes/auth.js` | `/api/auth` — register, login, me |
| `server/routes/finance.js` | `/api/finance` — balance, history, transactions |
| `server/routes/dragon.js` | `/api/dragon` — Dragon gaming API integration |
| `server/.env` | Local environment variables (not committed) |

## Conventions

- All components are named exports (no default exports from component files except `App.tsx`)
- Component filenames use PascalCase prefixed with `Zoe` for shared components (e.g. `ZoeHeader`)
- CSS classes use the `zoe-` prefix with BEM-like modifiers (`zoe-btn--primary`, `zoe-nav-link--active`)
- `src/lib/types.ts` is the single source of truth for shared TypeScript types
- `src/lib/storage.ts` wraps all `localStorage` access via `readJson` / `writeJson`
- `src/lib/seed.ts` defines `KEYS` constants used for localStorage keys
- Admin role is granted only to `admin@zoebet.com`; role check happens in both `AuthContext` and server-side JWT
- Server routes use synchronous better-sqlite3 calls (no async/await needed for DB queries)
