"""
One-time migration: adds missing columns (role, is_active, updated_at)
to the Users table and sets the admin user's role.
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
    ("role",       "ALTER TABLE Users ADD COLUMN role ENUM('admin','manager','viewer') DEFAULT 'viewer'"),
    ("is_active",  "ALTER TABLE Users ADD COLUMN is_active TINYINT(1) DEFAULT 1"),
    ("updated_at", "ALTER TABLE Users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
]

for col, sql in migrations:
    try:
        cur.execute(sql)
        print(f"[OK] Added column: {col}")
    except Exception as e:
        print(f"[SKIP] {col} already exists or error: {e}")

# Make sure the admin user has role=admin and is active
cur.execute("UPDATE Users SET role='admin', is_active=1 WHERE username='admin'")
print(f"[OK] Admin user role/is_active updated (rows: {cur.rowcount})")

conn.commit()
cur.close()
conn.close()
print("[OK] Migration complete!")
