# Food Supply Manager — Frontend

React + Vite + Tailwind CSS + React Router single-page app for the Food Supply
Management System. It talks to the Express API in `../backend` (cookie-based auth).

## Setup

```bash
cd frontend
npm install
npm run dev        # starts Vite on :5173, proxies /api -> http://localhost:5001
```

Make sure the backend is running on `:5001` (see `../backend/README.md`), the
MySQL `food_supply` database is initialized, and an admin user exists
(`admin` / `admin123`).

## Production build

```bash
npm run build      # outputs to dist/
npm run preview
```

## Structure

```
frontend/
├─ index.html
├─ vite.config.ts         # /api proxy to backend
├─ tailwind.config.js
└─ src/
   ├─ main.tsx            # entry + AuthProvider + router
   ├─ App.tsx             # routes with protected layout
   ├─ api/client.ts       # fetch wrapper (credentials = httpOnly cookie)
   ├─ context/AuthContext.tsx
   ├─ components/
   │  ├─ Layout.tsx       # sidebar + topbar navigation
   │  ├─ CrudPage.tsx     # generic CRUD (table + add/edit modal)
   │  └─ ui.tsx           # Badge, Modal, Spinner, StatusBadge
   └─ pages/              # Login, Dashboard, Suppliers, Products, Categories,
                          # Inventory, Warehouses, Distributors, Customers,
                          # Orders, Payments, Reports, Users (admin)
```

Most CRUD screens share the generic `CrudPage` component, configured with the
columns to display and a form-field schema (including dropdown options loaded
from the API).
