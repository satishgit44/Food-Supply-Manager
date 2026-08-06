"""
Migration script to add missing columns to existing tables:
supplier, warehouse, orderdetails, customer, distributor, product.
"""
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def run_migrations():
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

        migrations = {
            "supplier": [
                "ALTER TABLE supplier ADD COLUMN Email VARCHAR(100) NULL",
                "ALTER TABLE supplier ADD COLUMN Address TEXT NULL",
                "ALTER TABLE supplier ADD COLUMN Status ENUM('active', 'inactive', 'suspended') DEFAULT 'active'",
                "ALTER TABLE supplier ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
                "ALTER TABLE supplier ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
            ],
            "warehouse": [
                "ALTER TABLE warehouse ADD COLUMN Address TEXT NULL",
                "ALTER TABLE warehouse ADD COLUMN Manager_Name VARCHAR(100) NULL",
                "ALTER TABLE warehouse ADD COLUMN Contact_No VARCHAR(15) NULL",
                "ALTER TABLE warehouse ADD COLUMN Status ENUM('operational', 'maintenance', 'closed') DEFAULT 'operational'",
                "ALTER TABLE warehouse ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
                "ALTER TABLE warehouse ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
            ],
            "customer": [
                "ALTER TABLE customer ADD COLUMN Email VARCHAR(100) NULL",
                "ALTER TABLE customer ADD COLUMN Address TEXT NULL",
                "ALTER TABLE customer ADD COLUMN Customer_Type ENUM('retail', 'wholesale', 'institutional') DEFAULT 'retail'",
                "ALTER TABLE customer ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
                "ALTER TABLE customer ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
            ],
            "distributor": [
                "ALTER TABLE distributor ADD COLUMN Email VARCHAR(100) NULL",
                "ALTER TABLE distributor ADD COLUMN Region VARCHAR(100) NULL",
                "ALTER TABLE distributor ADD COLUMN Vehicle_Count INT DEFAULT 0",
                "ALTER TABLE distributor ADD COLUMN Status ENUM('active', 'inactive') DEFAULT 'active'",
                "ALTER TABLE distributor ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
                "ALTER TABLE distributor ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
            ],
            "orderdetails": [
                "ALTER TABLE orderdetails ADD COLUMN Unit_Price DECIMAL(10,2) DEFAULT 0.00",
                "ALTER TABLE orderdetails ADD COLUMN Total_Amount DECIMAL(12,2) GENERATED ALWAYS AS (Quantity * Unit_Price) STORED",
                "ALTER TABLE orderdetails ADD COLUMN Delivery_Date DATE NULL",
                "ALTER TABLE orderdetails ADD COLUMN Status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending'",
                "ALTER TABLE orderdetails ADD COLUMN Notes TEXT NULL",
                "ALTER TABLE orderdetails ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
                "ALTER TABLE orderdetails ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
            ]
        }

        for table, queries in migrations.items():
            print(f"\nMigrating table: {table}")
            for q in queries:
                try:
                    cur.execute(q)
                    print(f"  [OK] Executed: {q[:50]}...")
                except Exception as e:
                    print(f"  [SKIP] {e}")

        conn.commit()
        cur.close()
        conn.close()
        print("\n[OK] Database table migrations complete!")
    except Exception as e:
        print(f"[FATAL] Migration error: {e}")

if __name__ == "__main__":
    run_migrations()
