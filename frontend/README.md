# Frontend

React single-page application for the Food Supply Manager, built with **Vite**, **TypeScript**,
**Tailwind CSS** and **React Router v6**.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server (port 5173) with an `/api` proxy to the backend. |
| `npm run build` | Type-check + production build → `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm run typecheck` | `tsc --noEmit`. |

## Quick start

```bash
npm install
npm run dev
# open http://localhost:5173
# default login: admin / admin123
```

The dev server proxies `/api` requests to `http://localhost:5173` → backend `:5001`
(see `vite.config.ts`), so there is **no CORS** during development.

## How auth works

Authentication is cookie-based (httpOnly JWT). The Axios client
(`src/api/client.ts`) sends `credentials: include` on every request, so once you log in
the session cookie is forwarded automatically to protected API endpoints.

- `src/context/AuthContext.tsx` — exposes `user`, `loading`, `login()`, `logout()`.
- `src/components/Layout.tsx` — sidebar + navigation (role-aware).
- `src/pages/Login.tsx` — login screen; defaults shown for convenience.

## Routing

| Path | Page |
|------|------|
| `/login` | Login |
| `/` | Dashboard (KPIs + low-stock alerts) |
| `/suppliers`, `/products`, `/warehouses`, `/inventory`, `/distributors`, `/customers`, `/orders`, `/payments`, `/categories`, `/users` | CRUD pages (generic `CrudPage`) |
| `/reports` | Monthly sales report |

## Project layout

```
src/
├── api/client.ts            # axios instance (baseURL /api, credentials: include)
├── components/              # Layout, CrudPage, ui primitives
├── context/AuthContext.tsx  # auth state
├── pages/                   # one page per route
├── App.tsx                  # router + protected-route guards
├── main.tsx
└── index.css
```

## Building for production

```bash
npm run build
# dist/ can be served by any static server (e.g. nginx via ./Dockerfile)
```

`tailwind.config.js` uses the default `content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]`.
