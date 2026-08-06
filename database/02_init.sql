-- ================================================================
-- FOOD SUPPLY MANAGEMENT SYSTEM — COMPLETE DATABASE SCRIPT
-- ================================================================
-- Database : food_supply
-- User     : satish / SatishDATAbase
-- Admin    : satish / Satishfood_supply@2025  (created via Python)
-- Engine   : InnoDB (for FK support & transactions)
-- Charset  : utf8mb4 (supports emojis & all languages)
-- ================================================================

-- ────────────────────────────────────────────
-- 0. CREATE DATABASE
-- ────────────────────────────────────────────
-- User creation for Docker is handled by docker_create_user.sql.
-- For local setup, run docker_create_user.sql as MySQL root after this script.

CREATE DATABASE IF NOT EXISTS food_supply
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE food_supply;

-- ────────────────────────────────────────────
-- 1. USERS TABLE (Authentication)
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS Users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(100),
    email         VARCHAR(100),
    role          ENUM('admin', 'manager', 'viewer') DEFAULT 'viewer',
    is_active     TINYINT(1)   DEFAULT 1,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_username (username),
    INDEX idx_users_role     (role)
) ENGINE=InnoDB;

-- ────────────────────────────────────────────
-- 2. CATEGORY TABLE (NEW — normalized from Product)
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS Category (
    Category_ID   INT AUTO_INCREMENT PRIMARY KEY,
    Category_Name VARCHAR(100) NOT NULL UNIQUE,
    Description   TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_category_name (Category_Name)
) ENGINE=InnoDB;

-- ────────────────────────────────────────────
-- 3. SUPPLIER TABLE
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS Supplier (
    Supplier_ID   INT PRIMARY KEY,
    Supplier_Name VARCHAR(100) NOT NULL,
    City          VARCHAR(50),
    Contact_No    VARCHAR(15),
    Email         VARCHAR(100),
    Address       TEXT,
    Status        ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_supplier_city   (City),
    INDEX idx_supplier_status (Status)
) ENGINE=InnoDB;

-- ────────────────────────────────────────────
-- 4. PRODUCT TABLE
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS Product (
    Product_ID    INT PRIMARY KEY,
    Product_Name  VARCHAR(100) NOT NULL,
    Category      VARCHAR(50),
    Category_ID   INT          NULL,
    Price         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    Unit          VARCHAR(20)  DEFAULT 'kg',
    Supplier_ID   INT          NULL,
    Status        ENUM('available', 'out_of_stock', 'discontinued') DEFAULT 'available',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_product_category   (Category),
    INDEX idx_product_category_id(Category_ID),
    INDEX idx_product_supplier   (Supplier_ID),
    INDEX idx_product_status     (Status),

    FOREIGN KEY (Supplier_ID) REFERENCES Supplier(Supplier_ID)
        ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (Category_ID) REFERENCES Category(Category_ID)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ────────────────────────────────────────────
-- 5. WAREHOUSE TABLE
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS Warehouse (
    Warehouse_ID   INT PRIMARY KEY,
    Warehouse_Name VARCHAR(100) NOT NULL,
    City           VARCHAR(50),
    Address        TEXT,
    Capacity_Tons  DECIMAL(10,2) DEFAULT 0.00,
    Manager_Name   VARCHAR(100),
    Contact_No     VARCHAR(15),
    Status         ENUM('operational', 'maintenance', 'closed') DEFAULT 'operational',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_warehouse_city   (City),
    INDEX idx_warehouse_status (Status)
) ENGINE=InnoDB;

-- ────────────────────────────────────────────
-- 6. INVENTORY TABLE (NEW — tracks stock in warehouses)
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS Inventory (
    Inventory_ID   INT AUTO_INCREMENT PRIMARY KEY,
    Product_ID     INT NOT NULL,
    Warehouse_ID   INT NOT NULL,
    Quantity       INT NOT NULL DEFAULT 0,
    Reorder_Level  INT DEFAULT 10,
    Last_Restocked DATE,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_product_warehouse (Product_ID, Warehouse_ID),
    INDEX idx_inventory_product   (Product_ID),
    INDEX idx_inventory_warehouse (Warehouse_ID),

    FOREIGN KEY (Product_ID)   REFERENCES Product(Product_ID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Warehouse_ID) REFERENCES Warehouse(Warehouse_ID)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ────────────────────────────────────────────
-- 7. DISTRIBUTOR TABLE
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS Distributor (
    Distributor_ID   INT PRIMARY KEY,
    Distributor_Name VARCHAR(100) NOT NULL,
    City             VARCHAR(50),
    Contact_No       VARCHAR(15),
    Email            VARCHAR(100),
    Region           VARCHAR(100),
    Vehicle_Count    INT DEFAULT 0,
    Status           ENUM('active', 'inactive') DEFAULT 'active',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_distributor_city   (City),
    INDEX idx_distributor_region (Region),
    INDEX idx_distributor_status (Status)
) ENGINE=InnoDB;

-- ────────────────────────────────────────────
-- 8. CUSTOMER TABLE
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS Customer (
    Customer_ID    INT PRIMARY KEY,
    Customer_Name  VARCHAR(100) NOT NULL,
    City           VARCHAR(50) DEFAULT 'Mumbai',
    Contact_No     VARCHAR(15),
    Email          VARCHAR(100),
    Address        TEXT,
    Customer_Type  ENUM('retail', 'wholesale', 'institutional') DEFAULT 'retail',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_customer_city (City),
    INDEX idx_customer_type (Customer_Type)
) ENGINE=InnoDB;

-- ────────────────────────────────────────────
-- 9. ORDER DETAILS TABLE
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS OrderDetails (
    Order_ID       INT PRIMARY KEY,
    Customer_ID    INT,
    Product_ID     INT,
    Quantity       INT NOT NULL DEFAULT 1,
    Unit_Price     DECIMAL(10,2) DEFAULT 0.00,
    Total_Amount   DECIMAL(12,2) GENERATED ALWAYS AS (Quantity * Unit_Price) STORED,
    Distributor_ID INT,
    Warehouse_ID   INT,
    Order_Date     DATE NOT NULL,
    Delivery_Date  DATE,
    Status         ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    Notes          TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_order_date       (Order_Date),
    INDEX idx_order_customer   (Customer_ID),
    INDEX idx_order_product    (Product_ID),
    INDEX idx_order_status     (Status),
    INDEX idx_order_delivery   (Delivery_Date),

    FOREIGN KEY (Customer_ID)    REFERENCES Customer(Customer_ID)
        ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (Product_ID)     REFERENCES Product(Product_ID)
        ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (Distributor_ID) REFERENCES Distributor(Distributor_ID)
        ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (Warehouse_ID)   REFERENCES Warehouse(Warehouse_ID)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ────────────────────────────────────────────
-- 10. PAYMENT TABLE (NEW — tracks payments)
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS Payment (
    Payment_ID     INT AUTO_INCREMENT PRIMARY KEY,
    Order_ID       INT NOT NULL,
    Amount         DECIMAL(12,2) NOT NULL,
    Payment_Date   DATE NOT NULL,
    Payment_Method ENUM('cash', 'card', 'upi', 'bank_transfer', 'cheque') DEFAULT 'cash',
    Payment_Status ENUM('pending', 'completed', 'failed', 'refunded')     DEFAULT 'pending',
    Transaction_Ref VARCHAR(100),
    Notes          TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_payment_order  (Order_ID),
    INDEX idx_payment_date   (Payment_Date),
    INDEX idx_payment_status (Payment_Status),

    FOREIGN KEY (Order_ID) REFERENCES OrderDetails(Order_ID)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ────────────────────────────────────────────
-- 11. AUDIT LOG TABLE (NEW — tracks all changes)
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS AuditLog (
    Log_ID      INT AUTO_INCREMENT PRIMARY KEY,
    Table_Name  VARCHAR(50)  NOT NULL,
    Record_ID   INT          NOT NULL,
    Action      ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    Changed_By  VARCHAR(50),
    Old_Values  JSON,
    New_Values  JSON,
    Change_Time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_audit_table  (Table_Name),
    INDEX idx_audit_action (Action),
    INDEX idx_audit_time   (Change_Time)
) ENGINE=InnoDB;


-- ================================================================
-- ENTITY RELATIONSHIP SUMMARY
-- ================================================================
--
--  Category 1──M Product M──1 Supplier
--                  │
--                  │ (tracked in)
--                  ▼
--              Inventory M──1 Warehouse
--
--  Customer 1──M OrderDetails M──1 Product
--                    │    │
--                    │    └──── M──1 Distributor
--                    │    └──── M──1 Warehouse
--                    │
--                    ▼
--                 Payment
--
--  AuditLog (independent — logs all changes)
--  Users    (independent — authentication)
--
-- Total: 11 Tables, 12 Foreign Keys
-- ================================================================


-- ================================================================
-- SAMPLE DATA INSERTS
-- ================================================================

-- Categories
INSERT INTO Category (Category_Name, Description) VALUES
('Grains',      'Rice, wheat, barley, and other cereal grains'),
('Dairy',       'Milk, cheese, butter, and dairy products'),
('Fruits',      'Fresh and processed fruits'),
('Vegetables',  'Fresh and frozen vegetables'),
('Spices',      'Indian and international spices'),
('Beverages',   'Juices, soft drinks, and water'),
('Snacks',      'Packaged snacks and ready-to-eat items'),
('Oils',        'Cooking oils and ghee'),
('Pulses',      'Lentils, chickpeas, and beans'),
('Frozen Foods','Frozen meals and ingredients');

-- Suppliers
INSERT INTO Supplier (Supplier_ID, Supplier_Name, City, Contact_No, Email, Address, Status) VALUES
(1, 'Agro Fresh Pvt Ltd',     'Mumbai',    '9876543210', 'contact@agrofresh.in',   '12, APMC Market, Vashi, Navi Mumbai',  'active'),
(2, 'Farm Direct Foods',      'Pune',      '9876543211', 'info@farmdirect.co.in',  '45, Market Yard, Pune',                'active'),
(3, 'Spice World Trading',    'Kochi',     '9876543212', 'sales@spiceworld.in',    '78, Spice Market, Mattancherry',       'active'),
(4, 'Dairy Best Suppliers',   'Amul Nagar','9876543213', 'orders@dairybest.in',    'Dairy Complex, Anand, Gujarat',        'active'),
(5, 'Green Valley Organics',  'Nashik',    '9876543214', 'hello@greenvalley.org',  '23, Organic Farm Road, Nashik',        'active');

-- Products
INSERT INTO Product (Product_ID, Product_Name, Category, Category_ID, Price, Unit, Supplier_ID, Status) VALUES
(1,  'Basmati Rice (Premium)',  'Grains',     1,  85.00,  'kg',     1, 'available'),
(2,  'Whole Wheat Flour',       'Grains',     1,  42.00,  'kg',     1, 'available'),
(3,  'Amul Butter (500g)',      'Dairy',      2, 270.00,  'pack',   4, 'available'),
(4,  'Fresh Paneer',            'Dairy',      2, 320.00,  'kg',     4, 'available'),
(5,  'Alphonso Mango',          'Fruits',     3, 600.00,  'dozen',  2, 'available'),
(6,  'Organic Tomatoes',        'Vegetables', 4,  35.00,  'kg',     5, 'available'),
(7,  'Kashmiri Red Chilli',     'Spices',     5, 450.00,  'kg',     3, 'available'),
(8,  'Turmeric Powder',         'Spices',     5, 180.00,  'kg',     3, 'available'),
(9,  'Sunflower Oil (5L)',      'Oils',       8, 520.00,  'can',    2, 'available'),
(10, 'Toor Dal (Arhar)',        'Pulses',     9, 130.00,  'kg',     1, 'available');

-- Warehouses
INSERT INTO Warehouse (Warehouse_ID, Warehouse_Name, City, Address, Capacity_Tons, Manager_Name, Contact_No, Status) VALUES
(1, 'Mumbai Central Warehouse',  'Mumbai',     'Plot 5, JNPT Area, Nhava Sheva',     5000.00, 'Rajesh Sharma',   '9988776601', 'operational'),
(2, 'Pune Cold Storage',         'Pune',       'Hinjewadi Phase 3, Pune',             3000.00, 'Suresh Patil',    '9988776602', 'operational'),
(3, 'Delhi NCR Hub',             'New Delhi',  'Sector 18, Gurgaon',                  8000.00, 'Amit Kumar',      '9988776603', 'operational'),
(4, 'Chennai Distribution Center','Chennai',   'Ambattur Industrial Estate',           4500.00, 'Karthik Rajan',   '9988776604', 'operational'),
(5, 'Kolkata Godown',            'Kolkata',    'Salt Lake, Sector V',                 2500.00, 'Debashis Roy',    '9988776605', 'maintenance');

-- Inventory
INSERT INTO Inventory (Product_ID, Warehouse_ID, Quantity, Reorder_Level, Last_Restocked) VALUES
(1,  1,  500,  50,  '2025-01-10'),
(2,  1, 1000, 100,  '2025-01-12'),
(3,  2,  200,  30,  '2025-01-08'),
(4,  2,  150,  20,  '2025-01-15'),
(5,  1,  300,  25,  '2025-01-05'),
(6,  3,  800,  80,  '2025-01-18'),
(7,  1,  100,  15,  '2025-01-11'),
(8,  4,  250,  30,  '2025-01-14'),
(9,  3,  400,  40,  '2025-01-09'),
(10, 1,  600,  60,  '2025-01-16');

-- Distributors
INSERT INTO Distributor (Distributor_ID, Distributor_Name, City, Contact_No, Email, Region, Vehicle_Count, Status) VALUES
(1, 'Swift Logistics India',    'Mumbai',    '9112233441', 'dispatch@swiftlog.in',    'Western Maharashtra',  25, 'active'),
(2, 'Blue Dart Express',        'New Delhi', '9112233442', 'ops@bluedart.in',         'North India',          50, 'active'),
(3, 'Delhivery Supply Chain',   'Bangalore', '9112233443', 'supply@delhivery.com',    'South India',          40, 'active'),
(4, 'XpressBees Distribution',  'Pune',      '9112233444', 'biz@xpressbees.in',       'Pune & Suburbs',       18, 'active'),
(5, 'Ecom Express Pvt Ltd',     'Chennai',   '9112233445', 'connect@ecomexpress.in',  'Tamil Nadu & Kerala',  30, 'active');

-- Customers
INSERT INTO Customer (Customer_ID, Customer_Name, City, Contact_No, Email, Address, Customer_Type) VALUES
(1, 'Reliance Fresh Stores',     'Mumbai',    '9223344551', 'procurement@reliancefresh.in',  'Bandra West, Mumbai',           'wholesale'),
(2, 'DMart Retail Pvt Ltd',      'Pune',      '9223344552', 'buying@dmart.in',               'Hinjewadi, Pune',               'wholesale'),
(3, 'Hotel Taj Catering',        'New Delhi', '9223344553', 'kitchen@tajhotels.com',          'Mansingh Road, New Delhi',      'institutional'),
(4, 'Swiggy Instamart',          'Bangalore', '9223344554', 'sourcing@swiggy.in',            'Koramangala, Bangalore',        'wholesale'),
(5, 'Local Kirana - Sharma Ji',  'Mumbai',    '9223344555', 'sharma.kirana@gmail.com',       '15, Hill Road, Bandra',         'retail'),
(6, 'Zomato Hyperpure',          'Mumbai',    '9223344556', 'hyperpure@zomato.com',          'Andheri East, Mumbai',          'wholesale'),
(7, 'ITC Hotels Kitchen',        'Chennai',   '9223344557', 'purchase@itchotels.in',         'Guindy, Chennai',               'institutional'),
(8, 'BigBasket Warehouse',       'Bangalore', '9223344558', 'supply@bigbasket.com',          'Electronic City, Bangalore',    'wholesale');

-- Orders
INSERT INTO OrderDetails (Order_ID, Customer_ID, Product_ID, Quantity, Unit_Price, Distributor_ID, Warehouse_ID, Order_Date, Delivery_Date, Status, Notes) VALUES
(1,  1, 1,  200,  85.00, 1, 1, '2025-01-15', '2025-01-18', 'delivered',  'Urgent bulk order'),
(2,  2, 2,  500,  42.00, 4, 2, '2025-01-16', '2025-01-19', 'delivered',  'Monthly stock refill'),
(3,  3, 4,   50, 320.00, 2, 3, '2025-01-17', '2025-01-20', 'delivered',  'Hotel kitchen order'),
(4,  4, 6,  300,  35.00, 3, 1, '2025-01-18', '2025-01-21', 'shipped',    'Instamart fresh produce'),
(5,  5, 10,  20, 130.00, 1, 1, '2025-01-19', NULL,         'confirmed',  'Small retail order'),
(6,  1, 3,  100, 270.00, 1, 2, '2025-01-20', NULL,         'pending',    'Dairy product order'),
(7,  6, 7,   80, 450.00, 1, 1, '2025-01-21', NULL,         'pending',    'Spice procurement'),
(8,  7, 8,  150, 180.00, 5, 4, '2025-01-22', '2025-01-25', 'delivered',  'Bulk turmeric for hotel'),
(9,  8, 9,  200, 520.00, 3, 3, '2025-01-23', NULL,         'confirmed',  'Oil stock for warehouse'),
(10, 2, 5,   60, 600.00, 4, 2, '2025-01-24', NULL,         'pending',    'Seasonal mango order');

-- Payments
INSERT INTO Payment (Order_ID, Amount, Payment_Date, Payment_Method, Payment_Status, Transaction_Ref, Notes) VALUES
(1, 17000.00, '2025-01-18', 'bank_transfer', 'completed', 'TXN-20250118-001', 'Full payment received'),
(2, 21000.00, '2025-01-19', 'cheque',        'completed', 'CHQ-4456789',      'Cheque cleared'),
(3, 16000.00, '2025-01-20', 'bank_transfer', 'completed', 'TXN-20250120-003', 'Wire transfer received'),
(4,  5250.00, '2025-01-21', 'upi',           'completed', 'UPI-SWIGGY-004',   'UPI payment'),
(5,  2600.00, '2025-01-19', 'cash',          'completed', NULL,               'Cash on delivery'),
(8, 27000.00, '2025-01-25', 'bank_transfer', 'completed', 'TXN-20250125-008', 'ITC Hotels payment');


-- ================================================================
-- VIEWS (Virtual tables for common queries)
-- ================================================================

-- View: Complete order details with all names
CREATE OR REPLACE VIEW vw_OrderSummary AS
SELECT
    od.Order_ID,
    c.Customer_Name,       c.City AS Customer_City,    c.Customer_Type,
    p.Product_Name,        p.Category,                 p.Price AS Unit_Price_Catalog,
    od.Quantity,           od.Unit_Price,               od.Total_Amount,
    d.Distributor_Name,    d.Region,
    w.Warehouse_Name,      w.City AS Warehouse_City,
    od.Order_Date,         od.Delivery_Date,            od.Status AS Order_Status,
    od.Notes
FROM OrderDetails od
LEFT JOIN Customer    c ON od.Customer_ID    = c.Customer_ID
LEFT JOIN Product     p ON od.Product_ID     = p.Product_ID
LEFT JOIN Distributor d ON od.Distributor_ID = d.Distributor_ID
LEFT JOIN Warehouse   w ON od.Warehouse_ID   = w.Warehouse_ID;

-- View: Inventory with product and warehouse names
CREATE OR REPLACE VIEW vw_InventoryStatus AS
SELECT
    i.Inventory_ID,
    p.Product_Name,    p.Category,    p.Price,
    w.Warehouse_Name,  w.City AS Warehouse_City,
    i.Quantity,        i.Reorder_Level,
    CASE
        WHEN i.Quantity <= 0               THEN 'OUT OF STOCK'
        WHEN i.Quantity <= i.Reorder_Level THEN 'LOW STOCK'
        ELSE                                    'IN STOCK'
    END AS Stock_Status,
    i.Last_Restocked
FROM Inventory i
JOIN Product   p ON i.Product_ID   = p.Product_ID
JOIN Warehouse w ON i.Warehouse_ID = w.Warehouse_ID;

-- View: Payment summary per order
CREATE OR REPLACE VIEW vw_PaymentSummary AS
SELECT
    od.Order_ID,
    c.Customer_Name,
    od.Total_Amount  AS Order_Total,
    COALESCE(SUM(py.Amount), 0) AS Paid_Amount,
    od.Total_Amount - COALESCE(SUM(py.Amount), 0) AS Balance_Due,
    CASE
        WHEN COALESCE(SUM(py.Amount), 0) >= od.Total_Amount THEN 'Fully Paid'
        WHEN COALESCE(SUM(py.Amount), 0) > 0                THEN 'Partially Paid'
        ELSE                                                      'Unpaid'
    END AS Payment_Status
FROM OrderDetails od
LEFT JOIN Customer c  ON od.Customer_ID = c.Customer_ID
LEFT JOIN Payment  py ON od.Order_ID    = py.Order_ID AND py.Payment_Status = 'completed'
GROUP BY od.Order_ID, c.Customer_Name, od.Total_Amount;

-- View: Supplier performance
CREATE OR REPLACE VIEW vw_SupplierPerformance AS
SELECT
    s.Supplier_ID,    s.Supplier_Name,    s.City,    s.Status,
    COUNT(DISTINCT p.Product_ID)   AS Total_Products,
    COUNT(DISTINCT od.Order_ID)    AS Total_Orders,
    COALESCE(SUM(od.Total_Amount), 0) AS Total_Revenue
FROM Supplier s
LEFT JOIN Product      p  ON s.Supplier_ID = p.Supplier_ID
LEFT JOIN OrderDetails od ON p.Product_ID  = od.Product_ID
GROUP BY s.Supplier_ID, s.Supplier_Name, s.City, s.Status;


-- ================================================================
-- STORED PROCEDURES
-- ================================================================

DELIMITER //

-- Procedure: Place a new order with auto inventory update
CREATE PROCEDURE sp_PlaceOrder(
    IN p_Order_ID INT,
    IN p_Customer_ID INT,
    IN p_Product_ID INT,
    IN p_Quantity INT,
    IN p_Distributor_ID INT,
    IN p_Warehouse_ID INT,
    IN p_Order_Date DATE
)
BEGIN
    DECLARE v_price DECIMAL(10,2);
    DECLARE v_stock INT;

    -- Get product price
    SELECT Price INTO v_price FROM Product WHERE Product_ID = p_Product_ID;

    -- Check inventory
    SELECT Quantity INTO v_stock FROM Inventory
    WHERE Product_ID = p_Product_ID AND Warehouse_ID = p_Warehouse_ID;

    IF v_stock IS NULL OR v_stock < p_Quantity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient stock in warehouse';
    ELSE
        -- Insert order
        INSERT INTO OrderDetails (Order_ID, Customer_ID, Product_ID, Quantity, Unit_Price,
                                  Distributor_ID, Warehouse_ID, Order_Date, Status)
        VALUES (p_Order_ID, p_Customer_ID, p_Product_ID, p_Quantity, v_price,
                p_Distributor_ID, p_Warehouse_ID, p_Order_Date, 'confirmed');

        -- Reduce inventory
        UPDATE Inventory
        SET Quantity = Quantity - p_Quantity
        WHERE Product_ID = p_Product_ID AND Warehouse_ID = p_Warehouse_ID;
    END IF;
END //

-- Procedure: Get dashboard statistics
CREATE PROCEDURE sp_DashboardStats()
BEGIN
    SELECT
        (SELECT COUNT(*) FROM Supplier   WHERE Status = 'active')      AS active_suppliers,
        (SELECT COUNT(*) FROM Product    WHERE Status = 'available')   AS available_products,
        (SELECT COUNT(*) FROM Customer)                                AS total_customers,
        (SELECT COUNT(*) FROM OrderDetails)                            AS total_orders,
        (SELECT COUNT(*) FROM Warehouse  WHERE Status = 'operational') AS active_warehouses,
        (SELECT COUNT(*) FROM Distributor WHERE Status = 'active')     AS active_distributors,
        (SELECT COALESCE(SUM(Total_Amount), 0) FROM OrderDetails)      AS total_revenue,
        (SELECT COUNT(*) FROM OrderDetails WHERE Status = 'pending')   AS pending_orders,
        (SELECT COUNT(*) FROM Inventory WHERE Quantity <= Reorder_Level) AS low_stock_items;
END //

-- Procedure: Monthly sales report
CREATE PROCEDURE sp_MonthlySalesReport(IN p_year INT, IN p_month INT)
BEGIN
    SELECT
        p.Product_Name,
        p.Category,
        SUM(od.Quantity)     AS Units_Sold,
        SUM(od.Total_Amount) AS Revenue,
        COUNT(od.Order_ID)   AS Order_Count
    FROM OrderDetails od
    JOIN Product p ON od.Product_ID = p.Product_ID
    WHERE YEAR(od.Order_Date) = p_year AND MONTH(od.Order_Date) = p_month
    GROUP BY p.Product_ID, p.Product_Name, p.Category
    ORDER BY Revenue DESC;
END //

DELIMITER ;


-- ================================================================
-- TRIGGERS
-- ================================================================

DELIMITER //

-- Trigger: Log order inserts to AuditLog
CREATE TRIGGER trg_order_insert
AFTER INSERT ON OrderDetails
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (Table_Name, Record_ID, Action, New_Values)
    VALUES ('OrderDetails', NEW.Order_ID, 'INSERT',
        JSON_OBJECT('Customer_ID', NEW.Customer_ID, 'Product_ID', NEW.Product_ID,
                     'Quantity', NEW.Quantity, 'Status', NEW.Status));
END //

-- Trigger: Log order status changes
CREATE TRIGGER trg_order_update
AFTER UPDATE ON OrderDetails
FOR EACH ROW
BEGIN
    IF OLD.Status <> NEW.Status THEN
        INSERT INTO AuditLog (Table_Name, Record_ID, Action, Old_Values, New_Values)
        VALUES ('OrderDetails', NEW.Order_ID, 'UPDATE',
            JSON_OBJECT('Status', OLD.Status),
            JSON_OBJECT('Status', NEW.Status));
    END IF;
END //

-- Trigger: Log order deletions
CREATE TRIGGER trg_order_delete
BEFORE DELETE ON OrderDetails
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (Table_Name, Record_ID, Action, Old_Values)
    VALUES ('OrderDetails', OLD.Order_ID, 'DELETE',
        JSON_OBJECT('Customer_ID', OLD.Customer_ID, 'Product_ID', OLD.Product_ID,
                     'Quantity', OLD.Quantity, 'Total_Amount', OLD.Total_Amount));
END //

DELIMITER ;


-- Reference queries (Q1–Q50) are in queries_reference.sql for documentation.
-- ================================================================
-- Default admin account (username: admin, password: admin123).
-- werkzeug scrypt hash - verified by backend/src/middleware/auth.ts
-- Uses INSERT IGNORE so it is idempotent on re-runs.
INSERT IGNORE INTO Users (username, password_hash, full_name, email, role, is_active)
VALUES ('admin', 'scrypt:32768:8:1$XSDP0vP4XtBSmXYW$e7dd96325a4d699036136c6dfe2407d69baab013f2a07b91cb08b9cd7995f08cae8a1d576a2a3551cdca2e1817a29567600f088bfb4faa3c7a22fcbde33f7676', 'Administrator', 'admin@foodsupply.com', 'admin', 1);

-- SETUP COMPLETE
-- ================================================================
