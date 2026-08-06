# Food Supply Manager

A full-stack **Food Supply Chain Management** application for managing suppliers, products,
warehouses, inventory, distributors, customers, orders/payments and reporting — with an
analytics dashboard and role-based access control.

> ⚠️ **Note on the migration:** this repository was migrated from a Flask/Jinja + server-rendered
> template stack to a **Node.js (Express) API + React (Vite/Tailwind) SPA**. The original
> Flask runtime files have been removed from the tree; the MySQL schema, views, stored
> procedures, triggers and default-admin bootstrap are preserved (see *Database* below).
> Existing user password hashes are Werkzeug `scrypt`/`pbkdf2` hashes, which the new Node
> backend verifies directly — **no password reset required**.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express, TypeScript, `mysql2`, JWT (httpOnly cookies), bcryptjs |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, React Router v6 |
| Database | MySQL 8 (tables + views + stored procedures + audit triggers) |
| Auth | bcrypt for new accounts; Werkzeug `scrypt`/`pbkdf2` verified for legacy users |
| Roles | `admin` / `manager` / `viewer` (RBAC middleware) |

## Project structure

```
FoodSupplyManager/
├── backend/                 # Node.js API (Express + TypeScript)
│   ├── src/
│   │   ├── config/          # Environment configuration
│   │   ├── controllers/     # Per-domain route handlers (CRUD + reports)
│   │   ├── db/              # mysql2 connection pool
│   │   ├── middleware/      # auth (JWT + Werkzeug verification), roles, errors
│   │   ├── routes/          # API route mounting (/api/*)
│   │   ├── utils/           # Helpers (serialization, etc.)
│   │   └── index.ts         # Express app entry point
│   ├── Dockerfile           # Production Node image
│   ├── package.json  •tsconfig.json
│   └── .env.example
├── frontend/                # React single-page application (Vite + Tailwind)
│   ├── src/
│   │   ├── api/             # Axios client (baseURL /api, credentials: include)
│   │   ├── components/      # Layout, CrudPage, ui primitives
│   │   ├── context/         # AuthContext (httpOnly-cookie session)
│   │   ├── pages/           # Login, Dashboard, + one CRUD page per domain
│   │   ├── App.tsx  •main.tsx  •index.css
│   ├── Dockerfile           # Production nginx static build
│   ├── vite.config.ts  •tailwind.config.js  •postcss.config.js
│   └── package.json  •tsconfig.json
├── database/
│   ├── 01_docker_create_user.sql   # MySQL user/role for containers
│   └── 02_init.sql                 # Schema + views + procs + triggers + seed + admin
├── setup_users.py                  # Bootstrap default admin user (Python tooling)
├── create_views_and_procedures.py  # Ensure views/procedures/triggers exist
├── run_db_init.py                  # Run database/02_init.sql against a local MySQL
├── requirements-bootstrap.txt      # Python deps for the bootstrap scripts only
├── docker-compose.yml
└── .gitignore
```

## Prerequisites

- **Docker + Docker Compose** (recommended — brings up MySQL + API together), **or**
- **MySQL 8** reachable locally **and**
- **Node.js 20+** + **npm**
- (Optional) **Python 3** + packages in `requirements-bootstrap.txt` — only needed for local
  database bootstrapping. The application server itself is pure Node.

## Quick start (Docker)

```bash
# 1. Backend config (copy the example, tweak if needed)
cp backend/.env.example backend/.env

# 2. Start MySQL + the API
docker compose up -d

# 3. Start the frontend (dev server with Vite)
cd frontend && npm install && npm run dev
# → http://localhost:5173   (proxies /api to http://localhost:5001)
```

Sign in with the seeded default account:

| Username | Password |
|----------|----------|
| `admin`  | `admin123` |

> **Security:** change the admin password (or set `JWT_SECRET` / `MYSQL_PASSWORD` /
> `CORS_ORIGIN`) before exposing the stack publicly.

## Local development (without Docker)

```bash
# Backend (port 5001)
cp backend/.env.example backend/.env
cd backend && npm install && npm run dev

# Frontend (port 5173) — Vite proxies /api to the backend
cd frontend && npm install && npm run dev
```
## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `5001` | Backend listen port |
| `MYSQL_HOST` | `localhost` | MySQL host (use `db` inside Docker Compose) |
| `MYSQL_USER` / `MYSQL_PASSWORD` | `root` / `1234` | MySQL credentials |
| `MYSQL_DATABASE` | `food_supply` | Database name |
| `MYSQL_PORT` | `3306` | MySQL port |
| `JWT_SECRET` | `dev-secret-change-me` | JWT signing key (**set in production**) |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |
| `ALLOW_REGISTRATION` | `true` | Permit self-registration (viewer role) |

See `backend/.env.example` for the full list.

## Database setup

The single source of truth for the schema is `database/02_init.sql` (tables, lookup seed
data, views, stored procedures, triggers, and the default `admin` account).

- **Via Docker Compose** — MySQL auto-runs `02_init.sql` on first start, including the
  `admin` / `admin123` seed account.
- **Local MySQL (no Docker)** — bootstrap with the Python tooling:

```bash
pip install -r requirements-bootstrap.txt
python run_db_init.py            # creates schema + views + procs + seed data
python setup_users.py            # ensures the admin user exists
```

Key stored procedures used by the API:

| Procedure | Used by | Returns |
|-----------|---------|---------|
| `sp_DashboardStats` | `GET /api/dashboard/stats` | KPI counters + total revenue |
| `sp_MonthlySalesReport` | `GET /api/reports/monthly-sales` | Revenue / units / orders per product |
| `sp_PlaceOrder` | `POST /api/orders` | Places an order (checks stock, decrements inventory) |

Audit triggers (`trg_order_insert/update/delete`) record all order mutations in `AuditLog`.

## API reference

Full endpoint list: see [`backend/README.md`](backend/README.md).
Frontend usage: see [`frontend/README.md`](frontend/README.md).

## Production build

```bash
# Backend
cd backend && npm run build && npm start      # runs node dist/index.js

# Frontend (static assets, served by nginx)
cd frontend && npm run build && docker build -t food-supply-frontend -f Dockerfile .

# Or everything with Compose (MySQL + API):
docker compose up -d
```

## Key files

- `backend/src/middleware/auth.ts` — JWT auth + Werkzeug hash verification
  (`verifyPassword` accepts both bcrypt and legacy Werkzeug `pbkdf2`/`scrypt` hashes).
- `backend/src/controllers/dashboard.controller.ts` — dashboard KPIs.
- `frontend/src/pages/Dashboard.tsx` — dashboard UI.
- `frontend/src/components/CrudPage.tsx` — generic CRUD table used by all module pages.
- `frontend/src/context/AuthContext.tsx` — auth state backed by the httpOnly cookie.
