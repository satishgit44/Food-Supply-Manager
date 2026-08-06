"""
Explicitly creates the stored procedures and triggers for the food_supply database.
Handles the DROP and CREATE statements cleanly.
"""
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def init_db_objects():
    try:
        conn = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST", "localhost"),
            user=os.getenv("MYSQL_USER", "root"),
            password=os.getenv("MYSQL_PASSWORD", "1234"),
            database=os.getenv("MYSQL_DATABASE", "food_supply"),
            port=int(os.getenv("MYSQL_PORT", 3306)),
        )
        cur = conn.cursor()
        print("[OK] Connected to database.")

        # Stored Procedures
        procedures = {
            "sp_PlaceOrder": """
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

                    SELECT Price INTO v_price FROM Product WHERE Product_ID = p_Product_ID;

                    SELECT Quantity INTO v_stock FROM Inventory
                    WHERE Product_ID = p_Product_ID AND Warehouse_ID = p_Warehouse_ID;

                    IF v_stock IS NULL OR v_stock < p_Quantity THEN
                        SIGNAL SQLSTATE '45000'
                        SET MESSAGE_TEXT = 'Insufficient stock in warehouse';
                    ELSE
                        INSERT INTO OrderDetails (Order_ID, Customer_ID, Product_ID, Quantity, Unit_Price,
                                                  Distributor_ID, Warehouse_ID, Order_Date, Status)
                        VALUES (p_Order_ID, p_Customer_ID, p_Product_ID, p_Quantity, v_price,
                                p_Distributor_ID, p_Warehouse_ID, p_Order_Date, 'confirmed');

                        UPDATE Inventory
                        SET Quantity = Quantity - p_Quantity
                        WHERE Product_ID = p_Product_ID AND Warehouse_ID = p_Warehouse_ID;
                    END IF;
                END
            """,
            "sp_DashboardStats": """
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
                END
            """,
            "sp_MonthlySalesReport": """
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
                END
            """
        }

        # Triggers
        triggers = {
            "trg_order_insert": """
                CREATE TRIGGER trg_order_insert
                AFTER INSERT ON OrderDetails
                FOR EACH ROW
                BEGIN
                    INSERT INTO AuditLog (Table_Name, Record_ID, Action, New_Values)
                    VALUES ('OrderDetails', NEW.Order_ID, 'INSERT',
                        JSON_OBJECT('Customer_ID', NEW.Customer_ID, 'Product_ID', NEW.Product_ID,
                                     'Quantity', NEW.Quantity, 'Status', NEW.Status));
                END
            """,
            "trg_order_update": """
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
                END
            """,
            "trg_order_delete": """
                CREATE TRIGGER trg_order_delete
                BEFORE DELETE ON OrderDetails
                FOR EACH ROW
                BEGIN
                    INSERT INTO AuditLog (Table_Name, Record_ID, Action, Old_Values)
                    VALUES ('OrderDetails', OLD.Order_ID, 'DELETE',
                        JSON_OBJECT('Customer_ID', OLD.Customer_ID, 'Product_ID', OLD.Product_ID,
                                     'Quantity', OLD.Quantity, 'Total_Amount', OLD.Total_Amount));
                END
            """
        }

        # Create procedures
        for name, sql in procedures.items():
            try:
                cur.execute(f"DROP PROCEDURE IF EXISTS {name}")
                cur.execute(sql)
                print(f"[OK] Created procedure: {name}")
            except Exception as e:
                print(f"[ERROR] Procedure {name} failed: {e}")

        # Create triggers
        for name, sql in triggers.items():
            try:
                cur.execute(f"DROP TRIGGER IF EXISTS {name}")
                cur.execute(sql)
                print(f"[OK] Created trigger: {name}")
            except Exception as e:
                print(f"[ERROR] Trigger {name} failed: {e}")

        conn.commit()
        cur.close()
        conn.close()
        print("[OK] Database program objects setup completed!")
    except Exception as e:
        print(f"[FATAL] Connection error: {e}")

if __name__ == "__main__":
    init_db_objects()
