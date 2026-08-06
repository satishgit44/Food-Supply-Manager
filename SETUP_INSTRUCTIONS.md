# Setup Instructions - Food Supply Management System

## Current Status

Your Flask application is **fully built and running**! However, it cannot connect to the MySQL database yet.

## The Issue

The application is trying to connect to MySQL on `localhost:3306`, but the connection is being refused:
```
Error: 2003 (HY000): Can't connect to MySQL server on 'localhost:3306' (99)
```

## Two Possible Solutions

### Option 1: Start MySQL Locally (If You Have MySQL on Replit)

If you have MySQL installed locally in your Replit environment, you need to start the MySQL server first:

```bash
# Check if MySQL is installed
mysql --version

# If installed, you may need to start the service
# (This depends on your Replit configuration)
```

### Option 2: Use a Remote MySQL Database (Recommended)

If your MySQL database is hosted externally (e.g., on a cloud provider, another server, or a MySQL hosting service), you need to update the connection settings:

1. **Update your Replit Secrets** with the correct MySQL host:
   - Go to Replit Secrets (🔒 icon in the sidebar)
   - Update `MYSQL_HOST` to your actual MySQL server address (e.g., `mysql.example.com` or an IP address like `192.168.1.100`)
   - Update `MYSQL_PORT` if it's not 3306
   - Ensure `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DATABASE` are correct

2. **Make sure your remote MySQL server allows connections from Replit**:
   - Your MySQL server needs to allow remote connections
   - Firewall rules should allow incoming connections on port 3306
   - MySQL user needs remote access permissions

### Option 3: Use PostgreSQL Instead (Alternative)

Since Replit has built-in PostgreSQL support, you could switch to PostgreSQL, which would be much simpler:
- I can convert the application to use PostgreSQL if you prefer
- This would eliminate external database connectivity issues

## Once MySQL Connection Works

After your MySQL database is accessible, run this setup command **once**:

```bash
python setup_users.py
```

This will:
1. Create a `Users` table for authentication
2. Create a default admin user
   - Username: `admin`
   - Password: `admin123`

## Testing the Application

1. Open the webview (it should show the login page)
2. Run the setup script first: `python setup_users.py`
3. Login with: `admin` / `admin123`
4. You'll see the dashboard with all management features

## What's Already Built

✅ **Complete Flask Backend**
- User authentication with password hashing
- All CRUD API endpoints for:
  - Suppliers
  - Products
  - Warehouses
  - Distributors
  - Customers
  - Orders

✅ **Professional Frontend**
- Modern responsive dashboard
- Data tables with search/filter
- Modal-based forms
- Toast notifications
- Clean navigation

✅ **Security Features**
- Password hashing (Werkzeug)
- SQL injection protection
- Session-based authentication
- Environment variable configuration

## File Structure

```
.
├── app.py                    # Main Flask application
├── setup_users.py            # Database setup script
├── requirements.txt          # Python dependencies
├── README.md                # Full documentation
├── SETUP_INSTRUCTIONS.md    # This file
├── static/
│   ├── css/custom.css       # Custom styling
│   └── js/
│       ├── main.js          # Toast notifications
│       └── dashboard.js     # Dashboard logic
└── templates/
    ├── base.html            # Base template
    ├── login.html           # Login page
    ├── dashboard.html       # Dashboard
    ├── sidebar.html         # Sidebar navigation
    ├── suppliers.html       # Supplier management
    ├── products.html        # Product management
    ├── warehouses.html      # Warehouse management
    ├── distributors.html    # Distributor management
    ├── customers.html       # Customer management
    └── orders.html          # Order management
```

## Next Steps

1. **Verify MySQL Connection**: Make sure your MySQL database is accessible
2. **Run Setup Script**: Execute `python setup_users.py` to create the Users table
3. **Login**: Access the application and login with the default credentials
4. **Change Password**: Immediately change the admin password for security

## Need Help?

If you're still having connection issues, let me know:
- Where is your MySQL database hosted?
- Do you want me to convert this to PostgreSQL instead?
- Do you need help configuring the database connection?
