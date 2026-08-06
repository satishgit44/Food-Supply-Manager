"""
Food Supply Management System — Production Flask Application
"""
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, g
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import mysql.connector
from mysql.connector import Error
import os
import time
from dotenv import load_dotenv
from functools import wraps
import decimal
import datetime

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")

CORS(app, resources={r"/api/*": {"origins": os.getenv("CORS_ORIGINS", "*").split(",")}})

app.config.update(
    SESSION_COOKIE_SECURE=os.getenv("SESSION_COOKIE_SECURE", "False").lower() == "true",
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE=os.getenv("SESSION_COOKIE_SAMESITE", "Lax"),
)

ALLOW_REGISTRATION = os.getenv("ALLOW_REGISTRATION", "False").lower() == "true"
WRITE_ROLES = frozenset({"admin", "manager"})
ADMIN_ONLY = frozenset({"admin"})


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def serialize_db_rows(data):
    """Convert MySQL types to JSON-friendly types."""
    if isinstance(data, list):
        return [serialize_db_rows(row) for row in data]
    if isinstance(data, dict):
        clean = {}
        for k, v in data.items():
            if isinstance(v, decimal.Decimal):
                clean[k] = float(v)
            elif isinstance(v, (datetime.date, datetime.datetime)):
                clean[k] = v.isoformat()
            else:
                clean[k] = v
        return clean
    return data


def get_db_connection(retries=5, delay=2):
    for attempt in range(retries):
        try:
            return mysql.connector.connect(
                host=os.getenv("MYSQL_HOST", "localhost"),
                user=os.getenv("MYSQL_USER", "satish"),
                password=os.getenv("MYSQL_PASSWORD", "SatishDATAbase"),
                database=os.getenv("MYSQL_DATABASE", "food_supply"),
                port=int(os.getenv("MYSQL_PORT", 3306)),
            )
        except Error as e:
            if attempt < retries - 1:
                time.sleep(delay)
            else:
                print("DB connection error:", e)
                return None


def db_execute(query, params=None, fetchone=False, fetchall=False, commit=False):
    conn = get_db_connection()
    if not conn:
        return None, "Database connection failed"
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(query, params or ())
        result = None
        if fetchone:
            result = cur.fetchone()
        elif fetchall:
            result = cur.fetchall()
        if commit:
            conn.commit()
        cur.close()
        conn.close()
        return result, None
    except Error as e:
        try:
            conn.rollback()
            conn.close()
        except Error:
            pass
        return None, str(e)


# ---------------------------------------------------------------------------
# Auth decorators
# ---------------------------------------------------------------------------

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            if request.path.startswith("/api/"):
                return jsonify({"error": "Unauthorized"}), 401
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated


def write_required(f):
    @wraps(f)
    def inner(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Unauthorized"}), 401
        if session.get("role") not in WRITE_ROLES:
            return jsonify({"error": "Forbidden — manager or admin role required"}), 403
        return f(*args, **kwargs)
    return inner


def admin_required(f):
    @wraps(f)
    def inner(*args, **kwargs):
        if "user_id" not in session:
            if request.path.startswith("/api/"):
                return jsonify({"error": "Unauthorized"}), 401
            return redirect(url_for("login"))
        if session.get("role") not in ADMIN_ONLY:
            if request.path.startswith("/api/"):
                return jsonify({"error": "Forbidden — admin role required"}), 403
            return redirect(url_for("dashboard"))
        return f(*args, **kwargs)
    return inner


@app.context_processor
def inject_user():
    return {
        "current_user": {
            "username": session.get("username", "Guest"),
            "role": session.get("role", "viewer"),
        },
        "can_write": session.get("role") in WRITE_ROLES,
        "is_admin": session.get("role") in ADMIN_ONLY,
    }


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return redirect(url_for("dashboard") if "user_id" in session else url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        data = request.get_json() or {}
        username = (data.get("username") or "").strip()
        password = data.get("password") or ""

        user, err = db_execute(
            "SELECT * FROM Users WHERE username=%s AND is_active=1",
            (username,),
            fetchone=True,
        )
        if err:
            return jsonify({"success": False, "message": err}), 500
        if user and check_password_hash(user["password_hash"], password):
            session["user_id"] = user["id"]
            session["username"] = user["username"]
            session["role"] = user.get("role", "viewer")
            return jsonify({"success": True})

        return jsonify({"success": False, "message": "Invalid credentials"}), 401

    return render_template("login.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    if not ALLOW_REGISTRATION:
        if request.method == "POST":
            return jsonify({"success": False, "message": "Registration is disabled"}), 403
        return render_template("register.html", registration_disabled=True)

    if request.method == "POST":
        data = request.get_json() or {}
        username = (data.get("username") or "").strip()
        password = data.get("password") or ""

        if not username or not password:
            return jsonify({"success": False, "message": "Missing fields"}), 400

        existing, err = db_execute(
            "SELECT id FROM Users WHERE username=%s", (username,), fetchone=True
        )
        if err:
            return jsonify({"success": False, "message": err}), 500
        if existing:
            return jsonify({"success": False, "message": "Username already exists"}), 409

        _, err = db_execute(
            "INSERT INTO Users (username, password_hash, role) VALUES (%s, %s, 'viewer')",
            (username, generate_password_hash(password)),
            commit=True,
        )
        if err:
            return jsonify({"success": False, "message": err}), 500
        return jsonify({"success": True})

    return render_template("register.html", registration_disabled=False)


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


# ---------------------------------------------------------------------------
# Page routes
# ---------------------------------------------------------------------------

PAGES = [
    ("dashboard", "dashboard.html"),
    ("suppliers", "suppliers.html"),
    ("products", "products.html"),
    ("categories", "categories.html"),
    ("warehouses", "warehouses.html"),
    ("inventory", "inventory.html"),
    ("distributors", "distributors.html"),
    ("customers", "customers.html"),
    ("orders", "orders.html"),
    ("payments", "payments.html"),
    ("reports", "reports.html"),
    ("users", "users.html"),
]

for route_name, template in PAGES:
    def make_view(tmpl=template):
        @login_required
        def view():
            if tmpl == "users.html" and session.get("role") not in ADMIN_ONLY:
                return redirect(url_for("dashboard"))
            return render_template(tmpl)
        return view

    endpoint = route_name
    app.add_url_rule(f"/{route_name}", endpoint, make_view(), methods=["GET"])


# ---------------------------------------------------------------------------
# Dashboard & reports API
# ---------------------------------------------------------------------------

@app.route("/api/dashboard-stats")
@login_required
def dashboard_stats():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    try:
        cur = conn.cursor(dictionary=True)
        cur.callproc("sp_DashboardStats")
        stats = {}
        for result in cur.stored_results():
            row = result.fetchone()
            if row:
                stats = serialize_db_rows(row)
        cur.close()
        conn.close()
        return jsonify(stats)
    except Error:
        # Fallback if stored procedure unavailable
        counts = {}
        for table, key in [
            ("Supplier", "active_suppliers"),
            ("Product", "available_products"),
            ("Customer", "total_customers"),
            ("OrderDetails", "total_orders"),
            ("Warehouse", "active_warehouses"),
            ("Distributor", "active_distributors"),
        ]:
            row, _ = db_execute(f"SELECT COUNT(*) AS c FROM {table}", fetchone=True)
            counts[key] = row["c"] if row else 0
        rev, _ = db_execute(
            "SELECT COALESCE(SUM(Total_Amount), 0) AS t FROM OrderDetails", fetchone=True
        )
        counts["total_revenue"] = float(rev["t"]) if rev else 0
        pending, _ = db_execute(
            "SELECT COUNT(*) AS c FROM OrderDetails WHERE Status='pending'", fetchone=True
        )
        counts["pending_orders"] = pending["c"] if pending else 0
        low, _ = db_execute(
            "SELECT COUNT(*) AS c FROM Inventory WHERE Quantity <= Reorder_Level", fetchone=True
        )
        counts["low_stock_items"] = low["c"] if low else 0
        return jsonify(counts)


@app.route("/api/reports/inventory-status")
@login_required
def report_inventory():
    rows, err = db_execute("SELECT * FROM vw_InventoryStatus ORDER BY Stock_Status, Product_Name", fetchall=True)
    if err:
        return jsonify({"error": err}), 500
    return jsonify(serialize_db_rows(rows))


@app.route("/api/reports/payment-summary")
@login_required
def report_payments():
    rows, err = db_execute("SELECT * FROM vw_PaymentSummary ORDER BY Order_ID", fetchall=True)
    if err:
        return jsonify({"error": err}), 500
    return jsonify(serialize_db_rows(rows))


@app.route("/api/reports/supplier-performance")
@login_required
def report_suppliers():
    rows, err = db_execute(
        "SELECT * FROM vw_SupplierPerformance ORDER BY Total_Revenue DESC", fetchall=True
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify(serialize_db_rows(rows))


@app.route("/api/reports/revenue-by-category")
@login_required
def report_revenue_category():
    rows, err = db_execute(
        """
        SELECT p.Category, COUNT(od.Order_ID) AS Orders,
               SUM(od.Quantity) AS Units_Sold,
               COALESCE(SUM(od.Total_Amount), 0) AS Revenue
        FROM OrderDetails od
        JOIN Product p ON od.Product_ID = p.Product_ID
        GROUP BY p.Category
        ORDER BY Revenue DESC
        """,
        fetchall=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify(serialize_db_rows(rows))


@app.route("/api/reports/top-customers")
@login_required
def report_top_customers():
    rows, err = db_execute(
        """
        SELECT c.Customer_Name, c.City, c.Customer_Type,
               COUNT(od.Order_ID) AS Total_Orders,
               COALESCE(SUM(od.Total_Amount), 0) AS Total_Spent
        FROM Customer c
        JOIN OrderDetails od ON c.Customer_ID = od.Customer_ID
        GROUP BY c.Customer_ID, c.Customer_Name, c.City, c.Customer_Type
        ORDER BY Total_Spent DESC
        LIMIT 10
        """,
        fetchall=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify(serialize_db_rows(rows))


@app.route("/api/reports/monthly-sales")
@login_required
def report_monthly_sales():
    year = request.args.get("year", datetime.date.today().year, type=int)
    month = request.args.get("month", datetime.date.today().month, type=int)
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    try:
        cur = conn.cursor(dictionary=True)
        cur.callproc("sp_MonthlySalesReport", (year, month))
        rows = []
        for result in cur.stored_results():
            rows = result.fetchall()
        cur.close()
        conn.close()
        return jsonify(serialize_db_rows(rows))
    except Error as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Users API
# ---------------------------------------------------------------------------

@app.route("/api/users")
@admin_required
def get_users():
    rows, err = db_execute(
        "SELECT id, username, role, is_active, created_at FROM Users ORDER BY id", fetchall=True
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify(serialize_db_rows(rows))


@app.route("/api/users/<int:user_id>", methods=["PUT"])
@admin_required
def update_user(user_id):
    data = request.get_json() or {}
    role = data.get("role")
    is_active = data.get("is_active")
    if role and role not in ("admin", "manager", "viewer"):
        return jsonify({"error": "Invalid role"}), 400
    _, err = db_execute(
        "UPDATE Users SET role=COALESCE(%s, role), is_active=COALESCE(%s, is_active) WHERE id=%s",
        (role, is_active, user_id),
        commit=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


@app.route("/api/users/<int:user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    if user_id == session.get("user_id"):
        return jsonify({"error": "You cannot delete yourself"}), 403
    _, err = db_execute("DELETE FROM Users WHERE id=%s", (user_id,), commit=True)
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


@app.route("/api/users/me/password", methods=["PUT"])
@login_required
def change_my_password():
    data = request.get_json() or {}
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    
    if not current_password or not new_password:
        return jsonify({"error": "Missing fields"}), 400
        
    user_id = session.get("user_id")
    user, err = db_execute("SELECT password_hash FROM Users WHERE id=%s", (user_id,), fetchone=True)
    if err or not user:
        return jsonify({"error": "User not found"}), 404
        
    if not check_password_hash(user["password_hash"], current_password):
        return jsonify({"error": "Incorrect current password"}), 400
        
    _, err = db_execute(
        "UPDATE Users SET password_hash=%s WHERE id=%s",
        (generate_password_hash(new_password), user_id),
        commit=True
    )
    if err:
        return jsonify({"error": err}), 500
        
    return jsonify({"success": True})



# ---------------------------------------------------------------------------
# Categories API
# ---------------------------------------------------------------------------

@app.route("/api/categories")
@login_required
def get_categories():
    rows, err = db_execute("SELECT * FROM Category ORDER BY Category_Name", fetchall=True)
    if err:
        return jsonify({"error": err}), 500
    return jsonify(serialize_db_rows(rows))


@app.route("/api/categories", methods=["POST"])
@write_required
def add_category():
    data = request.get_json() or {}
    _, err = db_execute(
        "INSERT INTO Category (Category_Name, Description) VALUES (%s, %s)",
        (data.get("Category_Name"), data.get("Description")),
        commit=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


@app.route("/api/categories/<int:cat_id>", methods=["PUT"])
@write_required
def update_category(cat_id):
    data = request.get_json() or {}
    _, err = db_execute(
        "UPDATE Category SET Category_Name=%s, Description=%s WHERE Category_ID=%s",
        (data.get("Category_Name"), data.get("Description"), cat_id),
        commit=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


@app.route("/api/categories/<int:cat_id>", methods=["DELETE"])
@write_required
def delete_category(cat_id):
    _, err = db_execute("DELETE FROM Category WHERE Category_ID=%s", (cat_id,), commit=True)
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


# ---------------------------------------------------------------------------
# Suppliers API
# ---------------------------------------------------------------------------

@app.route("/api/suppliers")
@login_required
def get_suppliers():
    rows, err = db_execute("SELECT * FROM Supplier ORDER BY Supplier_ID", fetchall=True)
    if err:
        return jsonify({"error": err}), 500
    return jsonify(serialize_db_rows(rows))


@app.route("/api/suppliers", methods=["POST"])
@write_required
def add_supplier():
    data = request.get_json() or {}
    _, err = db_execute(
        """
        INSERT INTO Supplier (Supplier_ID, Supplier_Name, City, Contact_No, Email, Address, Status)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (
            data["Supplier_ID"], data["Supplier_Name"], data.get("City"),
            data.get("Contact_No"), data.get("Email"), data.get("Address"),
            data.get("Status", "active"),
        ),
        commit=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


@app.route("/api/suppliers/<int:s_id>", methods=["PUT"])
@write_required
def update_supplier(s_id):
    data = request.get_json() or {}
    _, err = db_execute(
        """
        UPDATE Supplier SET Supplier_Name=%s, City=%s, Contact_No=%s,
               Email=%s, Address=%s, Status=%s WHERE Supplier_ID=%s
        """,
        (
            data["Supplier_Name"], data.get("City"), data.get("Contact_No"),
            data.get("Email"), data.get("Address"), data.get("Status", "active"), s_id,
        ),
        commit=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


@app.route("/api/suppliers/<int:s_id>", methods=["DELETE"])
@write_required
def delete_supplier(s_id):
    _, err = db_execute("DELETE FROM Supplier WHERE Supplier_ID=%s", (s_id,), commit=True)
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


# ---------------------------------------------------------------------------
# Products API
# ---------------------------------------------------------------------------

@app.route("/api/products")
@login_required
def get_products():
    rows, err = db_execute(
        """
        SELECT p.*, s.Supplier_Name, c.Category_Name
        FROM Product p
        LEFT JOIN Supplier s ON p.Supplier_ID = s.Supplier_ID
        LEFT JOIN Category c ON p.Category_ID = c.Category_ID
        ORDER BY p.Product_ID
        """,
        fetchall=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify(serialize_db_rows(rows))


@app.route("/api/products", methods=["POST"])
@write_required
def add_product():
    data = request.get_json() or {}
    cat_id = data.get("Category_ID")
    category_name = data.get("Category")
    if cat_id and not category_name:
        cat, _ = db_execute(
            "SELECT Category_Name FROM Category WHERE Category_ID=%s", (cat_id,), fetchone=True
        )
        category_name = cat["Category_Name"] if cat else category_name
    _, err = db_execute(
        """
        INSERT INTO Product (Product_ID, Product_Name, Category, Category_ID, Price, Unit, Supplier_ID, Status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            data["Product_ID"], data["Product_Name"], category_name, cat_id,
            data.get("Price", 0), data.get("Unit", "kg"),
            data.get("Supplier_ID"), data.get("Status", "available"),
        ),
        commit=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


@app.route("/api/products/<int:p_id>", methods=["PUT"])
@write_required
def update_product(p_id):
    data = request.get_json() or {}
    cat_id = data.get("Category_ID")
    category_name = data.get("Category")
    if cat_id:
        cat, _ = db_execute(
            "SELECT Category_Name FROM Category WHERE Category_ID=%s", (cat_id,), fetchone=True
        )
        if cat:
            category_name = cat["Category_Name"]
    _, err = db_execute(
        """
        UPDATE Product SET Product_Name=%s, Category=%s, Category_ID=%s, Price=%s,
               Unit=%s, Supplier_ID=%s, Status=%s WHERE Product_ID=%s
        """,
        (
            data["Product_Name"], category_name, cat_id, data.get("Price"),
            data.get("Unit", "kg"), data.get("Supplier_ID"),
            data.get("Status", "available"), p_id,
        ),
        commit=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


@app.route("/api/products/<int:p_id>", methods=["DELETE"])
@write_required
def delete_product(p_id):
    _, err = db_execute("DELETE FROM Product WHERE Product_ID=%s", (p_id,), commit=True)
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


# ---------------------------------------------------------------------------
# Warehouses API
# ---------------------------------------------------------------------------

@app.route("/api/warehouses")
@login_required
def get_warehouses():
    rows, err = db_execute("SELECT * FROM Warehouse ORDER BY Warehouse_ID", fetchall=True)
    if err:
        return jsonify({"error": err}), 500
    return jsonify(serialize_db_rows(rows))


@app.route("/api/warehouses", methods=["POST"])
@write_required
def add_warehouse():
    data = request.get_json() or {}
    _, err = db_execute(
        """
        INSERT INTO Warehouse (Warehouse_ID, Warehouse_Name, City, Address, Capacity_Tons,
                               Manager_Name, Contact_No, Status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            data["Warehouse_ID"], data["Warehouse_Name"], data.get("City"),
            data.get("Address"), data.get("Capacity_Tons", 0),
            data.get("Manager_Name"), data.get("Contact_No"),
            data.get("Status", "operational"),
        ),
        commit=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


@app.route("/api/warehouses/<int:w_id>", methods=["PUT"])
@write_required
def update_warehouse(w_id):
    data = request.get_json() or {}
    _, err = db_execute(
        """
        UPDATE Warehouse SET Warehouse_Name=%s, City=%s, Address=%s, Capacity_Tons=%s,
               Manager_Name=%s, Contact_No=%s, Status=%s WHERE Warehouse_ID=%s
        """,
        (
            data["Warehouse_Name"], data.get("City"), data.get("Address"),
            data.get("Capacity_Tons"), data.get("Manager_Name"),
            data.get("Contact_No"), data.get("Status", "operational"), w_id,
        ),
        commit=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


@app.route("/api/warehouses/<int:w_id>", methods=["DELETE"])
@write_required
def delete_warehouse(w_id):
    _, err = db_execute("DELETE FROM Warehouse WHERE Warehouse_ID=%s", (w_id,), commit=True)
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


# ---------------------------------------------------------------------------
# Inventory API
# ---------------------------------------------------------------------------

@app.route("/api/inventory")
@login_required
def get_inventory():
    rows, err = db_execute("SELECT * FROM vw_InventoryStatus ORDER BY Product_Name", fetchall=True)
    if err:
        return jsonify({"error": err}), 500
    return jsonify(serialize_db_rows(rows))


@app.route("/api/inventory/low-stock")
@login_required
def get_low_stock():
    rows, err = db_execute(
        "SELECT * FROM vw_InventoryStatus WHERE Stock_Status IN ('LOW STOCK', 'OUT OF STOCK')",
        fetchall=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify(serialize_db_rows(rows))


@app.route("/api/inventory", methods=["POST"])
@write_required
def add_inventory():
    data = request.get_json() or {}
    _, err = db_execute(
        """
        INSERT INTO Inventory (Product_ID, Warehouse_ID, Quantity, Reorder_Level, Last_Restocked)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (
            data["Product_ID"], data["Warehouse_ID"], data.get("Quantity", 0),
            data.get("Reorder_Level", 10), data.get("Last_Restocked"),
        ),
        commit=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


@app.route("/api/inventory/<int:inv_id>", methods=["PUT"])
@write_required
def update_inventory(inv_id):
    data = request.get_json() or {}
    _, err = db_execute(
        """
        UPDATE Inventory SET Quantity=%s, Reorder_Level=%s, Last_Restocked=%s
        WHERE Inventory_ID=%s
        """,
        (data.get("Quantity"), data.get("Reorder_Level"), data.get("Last_Restocked"), inv_id),
        commit=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


@app.route("/api/inventory/<int:inv_id>", methods=["DELETE"])
@write_required
def delete_inventory(inv_id):
    _, err = db_execute("DELETE FROM Inventory WHERE Inventory_ID=%s", (inv_id,), commit=True)
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


# ---------------------------------------------------------------------------
# Distributors API
# ---------------------------------------------------------------------------

@app.route("/api/distributors")
@login_required
def get_distributors():
    rows, err = db_execute("SELECT * FROM Distributor ORDER BY Distributor_ID", fetchall=True)
    if err:
        return jsonify({"error": err}), 500
    return jsonify(serialize_db_rows(rows))


@app.route("/api/distributors", methods=["POST"])
@write_required
def add_distributor():
    data = request.get_json() or {}
    _, err = db_execute(
        """
        INSERT INTO Distributor (Distributor_ID, Distributor_Name, City, Contact_No,
                                 Email, Region, Vehicle_Count, Status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            data["Distributor_ID"], data["Distributor_Name"], data.get("City"),
            data.get("Contact_No"), data.get("Email"), data.get("Region"),
            data.get("Vehicle_Count", 0), data.get("Status", "active"),
        ),
        commit=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


@app.route("/api/distributors/<int:d_id>", methods=["PUT"])
@write_required
def update_distributor(d_id):
    data = request.get_json() or {}
    _, err = db_execute(
        """
        UPDATE Distributor SET Distributor_Name=%s, City=%s, Contact_No=%s,
               Email=%s, Region=%s, Vehicle_Count=%s, Status=%s
        WHERE Distributor_ID=%s
        """,
        (
            data["Distributor_Name"], data.get("City"), data.get("Contact_No"),
            data.get("Email"), data.get("Region"), data.get("Vehicle_Count"),
            data.get("Status", "active"), d_id,
        ),
        commit=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


@app.route("/api/distributors/<int:d_id>", methods=["DELETE"])
@write_required
def delete_distributor(d_id):
    _, err = db_execute("DELETE FROM Distributor WHERE Distributor_ID=%s", (d_id,), commit=True)
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


# ---------------------------------------------------------------------------
# Customers API
# ---------------------------------------------------------------------------

@app.route("/api/customers")
@login_required
def get_customers():
    rows, err = db_execute("SELECT * FROM Customer ORDER BY Customer_ID", fetchall=True)
    if err:
        return jsonify({"error": err}), 500
    return jsonify(serialize_db_rows(rows))


@app.route("/api/customers", methods=["POST"])
@write_required
def add_customer():
    data = request.get_json() or {}
    city = (data.get("City") or "").strip() or "Mumbai"
    _, err = db_execute(
        """
        INSERT INTO Customer (Customer_ID, Customer_Name, City, Contact_No, Email, Address, Customer_Type)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (
            data["Customer_ID"], data["Customer_Name"], city,
            data.get("Contact_No"), data.get("Email"), data.get("Address"),
            data.get("Customer_Type", "retail"),
        ),
        commit=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


@app.route("/api/customers/<int:c_id>", methods=["PUT"])
@write_required
def update_customer(c_id):
    data = request.get_json() or {}
    city = (data.get("City") or "").strip() or "Mumbai"
    _, err = db_execute(
        """
        UPDATE Customer SET Customer_Name=%s, City=%s, Contact_No=%s,
               Email=%s, Address=%s, Customer_Type=%s WHERE Customer_ID=%s
        """,
        (
            data["Customer_Name"], city, data.get("Contact_No"),
            data.get("Email"), data.get("Address"),
            data.get("Customer_Type", "retail"), c_id,
        ),
        commit=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


@app.route("/api/customers/<int:c_id>", methods=["DELETE"])
@write_required
def delete_customer(c_id):
    _, err = db_execute("DELETE FROM Customer WHERE Customer_ID=%s", (c_id,), commit=True)
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


# ---------------------------------------------------------------------------
# Orders API (uses sp_PlaceOrder for stock-aware placement)
# ---------------------------------------------------------------------------

@app.route("/api/orders")
@login_required
def get_orders():
    rows, err = db_execute(
        """
        SELECT od.*, c.Customer_Name, p.Product_Name,
               d.Distributor_Name, w.Warehouse_Name
        FROM OrderDetails od
        LEFT JOIN Customer c ON od.Customer_ID = c.Customer_ID
        LEFT JOIN Product p ON od.Product_ID = p.Product_ID
        LEFT JOIN Distributor d ON od.Distributor_ID = d.Distributor_ID
        LEFT JOIN Warehouse w ON od.Warehouse_ID = w.Warehouse_ID
        ORDER BY od.Order_ID DESC
        """,
        fetchall=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify(serialize_db_rows(rows))


@app.route("/api/orders", methods=["POST"])
@write_required
def add_order():
    data = request.get_json() or {}
    use_proc = data.get("use_inventory_check", True)

    if use_proc and data.get("Warehouse_ID"):
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        try:
            cur = conn.cursor()
            cur.callproc(
                "sp_PlaceOrder",
                (
                    data["Order_ID"], data["Customer_ID"], data["Product_ID"],
                    data["Quantity"], data["Distributor_ID"],
                    data["Warehouse_ID"], data["Order_Date"],
                ),
            )
            conn.commit()
            cur.close()
            conn.close()
            return jsonify({"success": True, "message": "Order placed with inventory update"})
        except Error as e:
            return jsonify({"error": str(e)}), 400

    product, _ = db_execute(
        "SELECT Price FROM Product WHERE Product_ID=%s", (data.get("Product_ID"),), fetchone=True
    )
    unit_price = data.get("Unit_Price") or (product["Price"] if product else 0)
    _, err = db_execute(
        """
        INSERT INTO OrderDetails (Order_ID, Customer_ID, Product_ID, Quantity, Unit_Price,
                                  Distributor_ID, Warehouse_ID, Order_Date, Delivery_Date,
                                  Status, Notes)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            data["Order_ID"], data["Customer_ID"], data["Product_ID"],
            data["Quantity"], unit_price, data.get("Distributor_ID"),
            data.get("Warehouse_ID"), data["Order_Date"],
            data.get("Delivery_Date"), data.get("Status", "pending"),
            data.get("Notes"),
        ),
        commit=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


@app.route("/api/orders/<int:o_id>", methods=["PUT"])
@write_required
def update_order(o_id):
    data = request.get_json() or {}
    _, err = db_execute(
        """
        UPDATE OrderDetails SET Customer_ID=%s, Product_ID=%s, Quantity=%s, Unit_Price=%s,
               Distributor_ID=%s, Warehouse_ID=%s, Order_Date=%s, Delivery_Date=%s,
               Status=%s, Notes=%s WHERE Order_ID=%s
        """,
        (
            data["Customer_ID"], data["Product_ID"], data["Quantity"],
            data.get("Unit_Price"), data.get("Distributor_ID"),
            data.get("Warehouse_ID"), data["Order_Date"],
            data.get("Delivery_Date"), data.get("Status"),
            data.get("Notes"), o_id,
        ),
        commit=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


@app.route("/api/orders/<int:o_id>", methods=["DELETE"])
@write_required
def delete_order(o_id):
    _, err = db_execute("DELETE FROM OrderDetails WHERE Order_ID=%s", (o_id,), commit=True)
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


# ---------------------------------------------------------------------------
# Payments API
# ---------------------------------------------------------------------------

@app.route("/api/payments")
@login_required
def get_payments():
    rows, err = db_execute(
        """
        SELECT py.*, od.Total_Amount AS Order_Total, c.Customer_Name
        FROM Payment py
        JOIN OrderDetails od ON py.Order_ID = od.Order_ID
        LEFT JOIN Customer c ON od.Customer_ID = c.Customer_ID
        ORDER BY py.Payment_Date DESC
        """,
        fetchall=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify(serialize_db_rows(rows))


@app.route("/api/payments", methods=["POST"])
@write_required
def add_payment():
    data = request.get_json() or {}
    _, err = db_execute(
        """
        INSERT INTO Payment (Order_ID, Amount, Payment_Date, Payment_Method,
                             Payment_Status, Transaction_Ref, Notes)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (
            data["Order_ID"], data["Amount"], data["Payment_Date"],
            data.get("Payment_Method", "cash"), data.get("Payment_Status", "completed"),
            data.get("Transaction_Ref"), data.get("Notes"),
        ),
        commit=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


@app.route("/api/payments/<int:pay_id>", methods=["PUT"])
@write_required
def update_payment(pay_id):
    data = request.get_json() or {}
    _, err = db_execute(
        """
        UPDATE Payment SET Amount=%s, Payment_Date=%s, Payment_Method=%s,
               Payment_Status=%s, Transaction_Ref=%s, Notes=%s
        WHERE Payment_ID=%s
        """,
        (
            data["Amount"], data["Payment_Date"], data.get("Payment_Method"),
            data.get("Payment_Status"), data.get("Transaction_Ref"),
            data.get("Notes"), pay_id,
        ),
        commit=True,
    )
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


@app.route("/api/payments/<int:pay_id>", methods=["DELETE"])
@write_required
def delete_payment(pay_id):
    _, err = db_execute("DELETE FROM Payment WHERE Payment_ID=%s", (pay_id,), commit=True)
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"success": True})


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=os.getenv("FLASK_DEBUG", "True") == "True")
