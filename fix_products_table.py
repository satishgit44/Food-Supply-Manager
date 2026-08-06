"""
One-time migration: adds missing columns (Category_ID, Unit, Status)
to the existing Product table so the app.py API queries work correctly.
"""
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

conn = mysql.connector.connect(
    host=os.getenv("MYSQL_HOST", "localhost"),
    user=os.getenv("MYSQL_USER", "root"),
    password=os.getenv("MYSQL_PASSWORD", "1234"),
    database=os.getenv("MYSQL_DATABASE", "food_supply"),
    port=int(os.getenv("MYSQL_PORT", 3306)),
)
cur = conn.cursor()

migrations = [
    ("Category_ID", "ALTER TABLE product ADD COLUMN Category_ID INT NULL"),
    ("Unit",        "ALTER TABLE product ADD COLUMN Unit VARCHAR(20) DEFAULT 'kg'"),
    ("Status",      "ALTER TABLE product ADD COLUMN Status ENUM('available','out_of_stock','discontinued') DEFAULT 'available'"),
    ("updated_at",  "ALTER TABLE product ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
]

for col, sql in migrations:
    try:
        cur.execute(sql)
        print(f"[OK] Added column: {col}")
    except Exception as e:
        print(f"[SKIP] {col}: {e}")

# Set all existing products to 'available' if Status is null
cur.execute("UPDATE product SET Status='available' WHERE Status IS NULL")
print(f"[OK] Set Status=available for {cur.rowcount} products")

conn.commit()
cur.close()
conn.close()
print("[OK] Product table migration complete!")
