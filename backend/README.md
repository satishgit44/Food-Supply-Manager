# Backend API

Express + TypeScript API for the Food Supply Manager. Runs on **Node.js** with a `mysql2`
connection pool, JWT auth in httpOnly cookies, and role-based access control.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with `ts-node-dev` (hot reload) in development. |
| `npm run build` | Compile TypeScript → `dist/` (production). |
| `npm start` | Run the compiled `dist/index.js`. |
| `npm run typecheck` | `tsc --noEmit` (type-check without emitting). |

## Quick start

```bash
cp .env.example .env        # edit if needed
npm install
npm run dev                 # http://localhost:5001
```

In Docker:

```bash
docker compose up -d
```

## Configuration

Copy `.env.example` to `.env`. The API reads:

| Variable | Default | Notes |
|----------|---------|-------|
| `PORT` | `5001` | |
| `MYSQL_HOST` | `localhost` | `db` when running under Docker Compose |
| `MYSQL_USER` | `root` | |
| `MYSQL_PASSWORD` | `1234` | |
| `MYSQL_DATABASE` | `food_supply` | |
| `MYSQL_PORT` | `3306` | |
| `JWT_SECRET` | — | **Required in production** |
| `JWT_EXPIRES_IN` | `12h` | |
| `COOKIE_SECURE` | `false` | Set `true` behind HTTPS |
| `COOKIE_SAMESITE` | `lax` | |
| `CORS_ORIGIN` | `http://localhost:5173` | |
| `ALLOW_REGISTRATION` | `true` | |

## Authentication

- `POST /api/auth/login` — verifies credentials and sets an httpOnly `token` cookie.
- `POST /api/auth/register` — self-registration (when `ALLOW_REGISTRATION=true`); new
  accounts use **bcrypt** and are assigned the `viewer` role.
- `POST /api/auth/logout` / `GET /api/auth/me` — session helpers.

**Backward compatibility:** password hashes are checked with `verifyPassword`
(`src/middleware/auth.ts`), which accepts:
- bcrypt hashes (new accounts), and
- legacy Werkzeug `pbkdf2:...` / `scrypt:...` hashes created by the original Flask app
  (`setup_users.py`). Existing users therefore keep working without a password reset.

## Routes

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | `/api/auth/login` | — | — | Login (sets httpOnly cookie) |
| POST | `/api/auth/register` | — | — | Register a new viewer |
| POST | `/api/auth/logout` | — | — | Clear cookie |
| GET | `/api/auth/me` | JWT | any | Current user |
| GET | `/api/dashboard/stats` | JWT | any | `sp_DashboardStats` KPIs |
| GET | `/api/reports/monthly-sales` | JWT | any | `sp_MonthlySalesReport` |
| POST | `/api/orders` | JWT | admin/manager | `sp_PlaceOrder` |
| CRUD | `/api/categories|suppliers|products|warehouses|inventory|distributors|customers|payments|users` | JWT | write → admin/manager | Standard CRUD |
| GET | `/api/health` | — | — | Liveness probe |

## Project layout

```
src/
├── config/index.ts
├── db/index.ts
├── index.ts
├── middleware/   auth.ts | roles.ts | error.ts
├── controllers/  auth | dashboard | orders | reports | users | … (one per domain)
├── routes/       auth | dashboard | orders | reports | users | …
└── utils/        serialize.ts
```
