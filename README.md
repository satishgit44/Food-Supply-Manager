# Food Supply Management System

A complete professional web application for managing food supply operations.

## Full-stack architecture (React + Express + MySQL)

The project has been migrated to a modern full-stack split while **reusing the
existing MySQL schema** (`database/02_init.sql`) and its business rules (views,
stored procedures) as the source of truth:

```
.
├── backend/                  # Express + TypeScript + MySQL2 REST API
├── frontend/                 # React + Vite + Tailwind CSS + React Router
├── database/
│   ├── 01_docker_create_user.sql
│   └── 02_init.sql           # source-of-truth schema (unchanged)
├── docker-compose.yml        # MySQL + API for local dev
└── app.py                    # original Flask app (kept as reference)
```

- **Backend**: Express + TypeScript, `mysql2` pool, JWT in httpOnly cookies,
  bcrypt password hashing, role-based middleware (`admin` / `manager` / `viewer`),
  centralized error handling. Default `admin` / `admin123`.
- **Frontend**: React + Vite + Tailwind, protected routes, sidebar navigation,
  generic CRUD screens, dashboard KPIs, and reports.
- **Database**: unchanged. Runs `02_init.sql` on first boot via Docker Compose.

### Run the full stack

```bash
# 1) Start MySQL (or point .env files at an existing instance)
docker compose up -d db

# 2) Backend
cd backend && cp .env.example .env && npm install && npm run dev     # :5001

# 3) Frontend (separate terminal)
cd frontend && npm install && npm run dev                            # :5173
```

Then open http://localhost:5173 and sign in with `admin` / `admin123`.

See `backend/README.md` and `frontend/README.md` for detailed setup and the
complete API reference.

---

## Original Flask application

The original Flask + MySQL build is preserved in `app.py` and can still be run as-is:

- **Backend**: Flask (Python)
- **Database**: MySQL
- **Frontend**: HTML5, Tailwind CSS, JavaScript (server-rendered templates)

### Features

- **User Authentication**: Secure login system with password hashing
- **Dashboard**: Real-time metrics and statistics
- **Supplier Management**: Complete CRUD operations for suppliers
- **Product Management**: Track products, categories, pricing, and inventory
- **Warehouse Management**: Manage warehouse facilities and capacity
- **Distributor Management**: Handle distributor network and regions
- **Customer Management**: Maintain customer database
- **Order Management**: Process and track customer orders
- **Search & Filter**: Quick search functionality across all entities
- **Responsive Design**: Modern UI with Tailwind CSS

## Technology Stack

- **Backend**: Flask (Python)
- **Database**: MySQL
- **Frontend**: HTML5, Tailwind CSS, JavaScript
- **Authentication**: Session-based with password hashing (Werkzeug)

## Installation & Setup

### Prerequisites

- Python 3.10+
- MySQL database server
- Replit account (for hosting)

### Environment Variables

Set up the following environment variables in Replit Secrets:

```
MYSQL_HOST=your_mysql_host
MYSQL_USER=your_mysql_username
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=food_supply
MYSQL_PORT=3306
SECRET_KEY=your_secret_key_for_sessions
```

### Initial Setup

1. **Create the Users table and admin account**:
   ```bash
   python setup_users.py
   ```

   This creates or repairs the Users table and resets the default admin account to:
   - Username: `admin`
   - Password: `admin123`

   **⚠️ IMPORTANT**: Change the admin password after first login!

2. **Initialize the database schema and objects**:
   ```bash
   python run_db_init.py
   python create_views_and_procedures.py
   ```

3. **Start the application**:
   ```bash
   python app.py
   ```
   Then open http://127.0.0.1:5000.

## Database Schema

The application works with the following tables:

- **Users**: Authentication and user management
- **Supplier**: Supplier information
- **Product**: Product catalog
- **Warehouse**: Warehouse facilities
- **Distributor**: Distribution network
- **Customer**: Customer accounts
- **OrderDetails**: Order tracking

## Usage

### Login

1. Navigate to the application URL
2. Login with the default credentials (or your created user)
3. You'll be redirected to the dashboard

### Managing Data

- Use the sidebar navigation to access different sections
- Click "Add" buttons to create new records
- Use the search bar to filter data
- Click edit/delete icons in tables to modify records

### Dashboard

The dashboard displays real-time statistics:
- Total Suppliers
- Total Products
- Total Customers
- Total Orders
- Total Warehouses
- Total Distributors

## Security Features

- ✅ Password hashing using Werkzeug
- ✅ Session-based authentication
- ✅ SQL injection protection (parameterized queries)
- ✅ Environment variables for sensitive data
- ✅ Login required decorators for protected routes

## API Endpoints

### Authentication
- `POST /login` - User login
- `GET /logout` - User logout

### Dashboard
- `GET /api/dashboard-stats` - Get dashboard statistics

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `POST /api/suppliers` - Add new supplier
- `PUT /api/suppliers/<id>` - Update supplier
- `DELETE /api/suppliers/<id>` - Delete supplier

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Add new product
- `PUT /api/products/<id>` - Update product
- `DELETE /api/products/<id>` - Delete product

### Warehouses
- `GET /api/warehouses` - Get all warehouses
- `POST /api/warehouses` - Add new warehouse
- `PUT /api/warehouses/<id>` - Update warehouse
- `DELETE /api/warehouses/<id>` - Delete warehouse

### Distributors
- `GET /api/distributors` - Get all distributors
- `POST /api/distributors` - Add new distributor
- `PUT /api/distributors/<id>` - Update distributor
- `DELETE /api/distributors/<id>` - Delete distributor

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Add new customer
- `PUT /api/customers/<id>` - Update customer
- `DELETE /api/customers/<id>` - Delete customer

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Add new order
- `PUT /api/orders/<id>` - Update order
- `DELETE /api/orders/<id>` - Delete order

## File Structure

```
.
├── app.py                      # Main Flask application
├── setup_users.py              # Database setup script
├── requirements.txt            # Python dependencies
├── .env.example               # Environment variables template
├── static/
│   ├── css/
│   │   └── custom.css         # Custom styles
│   └── js/
│       ├── main.js            # Toast notifications
│       └── dashboard.js       # Dashboard logic
└── templates/
    ├── base.html              # Base template
    ├── login.html             # Login page
    ├── dashboard.html         # Dashboard page
    ├── sidebar.html           # Sidebar component
    ├── suppliers.html         # Suppliers management
    ├── products.html          # Products management
    ├── warehouses.html        # Warehouses management
    ├── distributors.html      # Distributors management
    ├── customers.html         # Customers management
    └── orders.html            # Orders management
```

## Development

The application runs in debug mode during development. For production deployment:

1. Set `FLASK_ENV=production` in environment variables
2. Use a production WSGI server (Gunicorn recommended)
3. Change the default admin password
4. Use HTTPS for secure connections

## Support

For issues or questions, please check the database connection settings and ensure all environment variables are properly configured.

## License

This project is for educational and commercial use.
