# Food Supply Manager — Backend API

Express + TypeScript REST API backed by the existing MySQL `food_supply` database
(the schema in `database/02_init.sql` is the source of truth).

## Stack

- **Node.js + Express + TypeScript**
- **MySQL2** (raw SQL) — reuses the existing schema, views, and stored procedures
  (`sp_PlaceOrder`, `sp_DashboardStats`, `sp_MonthlySalesReport`) so all business
  rules from the original Flask `app.py` are preserved.
- **Auth**: JWT stored in an **httpOnly cookie** + `bcryptjs` password hashing.

## Setup

```bash
cd backend
npm install
cp .env.example .env      # then edit credentials / JWT secret
npm run dev               # ts-node-dev (hot reload) on :5001
# or
npm run build && npm start
```

Ensure the `food_supply` database exists with the schema from `database/02_init.sql`
and that an admin user is present (run the Python `setup_users.py` if needed, or the
existing `02_init.sql` Users table). Default credentials: `admin` / `admin123`.

## Environment variables (see `.env.example`)

| Variable          | Default                | Description                     |
| ----------------- | ---------------------- | ------------------------------- |
| `PORT`            | `5001`                 | API port                        |
| `MYSQL_HOST`      | `localhost`            | MySQL host                      |
| `MYSQL_USER`      | `root`                 | MySQL user                      |
| `MYSQL_PASSWORD`  | `1234`                 | MySQL password                  |
| `MYSQL_DATABASE`  | `food_supply`          | Database name                   |
| `MYSQL_PORT`      | `3306`                 | MySQL port                      |
| `JWT_SECRET`      | `dev-secret-change-me` | JWT signing secret              |
| `CORS_ORIGIN`     | `http://localhost:5173`| Allowed React origin (cookies)  |
| `ALLOW_REGISTRATION` | `true`              | Enable self-registration        |

## API Endpoints

All endpoints below (except auth) require the auth cookie. Write operations
require `admin` or `manager`; user management requires `admin`.

### Auth
| Method | Path            | Description                          |
| ------ | --------------- | ------------------------------------ |
| POST   | `/api/auth/login` | Login, sets httpOnly cookie          |
| POST   | `/api/auth/register` | Create a viewer account (if enabled) |
| POST   | `/api/auth/logout` | Clear cookie                        |
| GET    | `/api/auth/me`   | Current user                         |

### Dashboard & Reports
| Method | Path                            | Description                |
| ------ | ------------------------------- | -------------------------- |
| GET    | `/api/dashboard/stats`          | KPI dashboard stats        |
| GET    | `/api/reports/inventory-status` | Inventory report           |
| GET    | `/api/reports/payment-summary`  | Payment summary report     |
| GET    | `/api/reports/supplier-performance` | Supplier report        |
| GET    | `/api/reports/revenue-by-category` | Revenue by category     |
| GET    | `/api/reports/top-customers`    | Top customers              |
| GET    | `/api/reports/monthly-sales?year=&month=` | Monthly sales report |

### CRUD modules
Standard `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` for:
`/api/categories`, `/api/suppliers`, `/api/products`, `/api/warehouses`,
`/api/inventory` (plus `/low-stock`), `/api/distributors`, `/api/customers`,
`/api/orders`, `/api/payments`.

### Users (admin)
| Method | Path                  | Description              |
| ------ | --------------------- | ------------------------ |
| GET    | `/api/users`          | List users               |
| PUT    | `/api/users/:id`      | Update role / active     |
| DELETE | `/api/users/:id`      | Delete user              |
| PUT    | `/api/users/me/password` | Change own password    |

> Note: orders created with a `Warehouse_ID` use the `sp_PlaceOrder` stored
> procedure, which validates available stock and decrements inventory. Sending
> `use_inventory_check: false` bypasses the check (direct insert), matching the
> original application behaviour.

## Project layout

```
backend/
├─ src/
│  ├─ index.ts                 # Express app + route mounting
│  ├─ config/index.ts          # environment config
│  ├─ db/index.ts              # MySQL2 pool + query helpers
│  ├─ middleware/
│  │  ├─ auth.ts               # JWT cookie auth + role guards
│  │  └─ error.ts              # centralized error handler
│  ├─ controllers/             # request handlers per module
│  └─ routes/                  # Express routers per module
├─ Dockerfile
└─ .env.example
```
