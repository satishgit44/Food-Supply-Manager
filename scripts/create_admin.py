#!/usr/bin/env python3
"""
One-off script to create or update the admin user 'satish' with a secure hashed password.
Run after the DB is initialized and reachable.
"""
import os
import sys
from mysql.connector import connect, Error
from werkzeug.security import generate_password_hash

DB_HOST = os.getenv('MYSQL_HOST', 'localhost')
DB_USER = os.getenv('MYSQL_ADMIN_USER', 'root')
DB_PASS = os.getenv('MYSQL_ADMIN_PASS', '')
DB_NAME = os.getenv('MYSQL_DATABASE', 'food_supply')

ADMIN_USER = os.getenv('ADMIN_USER', 'satish')
ADMIN_PW = os.getenv('ADMIN_PW', 'Satishfood_supply@2025')


def main():
    try:
        conn = connect(host=DB_HOST, user=DB_USER, password=DB_PASS, database=DB_NAME)
        cur = conn.cursor()

        pw_hash = generate_password_hash(ADMIN_PW)

        cur.execute("SELECT id FROM Users WHERE username=%s", (ADMIN_USER,))
        row = cur.fetchone()
        if row:
            cur.execute("UPDATE Users SET password_hash=%s, role=%s, is_active=1 WHERE id=%s", (pw_hash, 'admin', row[0]))
            print(f"Updated existing user {ADMIN_USER}")
        else:
            cur.execute("INSERT INTO Users (username, password_hash, role, is_active) VALUES (%s,%s,%s,1)", (ADMIN_USER, pw_hash, 'admin'))
            print(f"Created admin user {ADMIN_USER}")

        conn.commit()
        cur.close()
        conn.close()
    except Error as e:
        print("DB error:", e)
        sys.exit(2)


if __name__ == '__main__':
    main()
