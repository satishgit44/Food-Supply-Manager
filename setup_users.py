"""
Setup script to create Users table and add default admin user
Run this once to initialize authentication in your MySQL database
"""
from werkzeug.security import generate_password_hash
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

def setup_users_table():
    """Create Users table and add default admin user"""
    try:
        connection = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD', '1234'),
            database=os.getenv('MYSQL_DATABASE', 'food_supply'),
            port=int(os.getenv('MYSQL_PORT', 3306))
        )

        cursor = connection.cursor()

        create_table_query = """
        CREATE TABLE IF NOT EXISTS Users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(100),
            email VARCHAR(100),
            role ENUM('admin', 'manager', 'viewer') DEFAULT 'viewer',
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        """

        cursor.execute(create_table_query)
        print("[OK] Users table created successfully")

        cursor.execute("SELECT id, password_hash FROM Users WHERE username = 'admin'")
        admin_row = cursor.fetchone()

        admin_password_hash = generate_password_hash('admin123')
        if not admin_row:
            insert_admin_query = """
            INSERT INTO Users (username, password_hash, full_name, email, role, is_active)
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_admin_query, ('admin', admin_password_hash, 'Administrator', 'admin@foodsupply.com', 'admin', 1))
            print("[OK] Default admin user created (username: admin, password: admin123)")
        else:
            cursor.execute(
                "UPDATE Users SET password_hash=%s, role='admin', is_active=1, full_name=COALESCE(full_name, 'Administrator'), email=COALESCE(email, 'admin@foodsupply.com') WHERE username='admin'",
                (admin_password_hash,),
            )
            print("[OK] Default admin user password reset to admin123")

        connection.commit()
        print("[!!] IMPORTANT: Please change the admin password after first login!")

        cursor.close()
        connection.close()
        print("\n[OK] Setup completed successfully!")

    except Error as e:
        print(f"[ERROR] Error during setup: {e}")
        return False

    return True

if __name__ == '__main__':
    print("Setting up Users table for authentication...\n")
    setup_users_table()
