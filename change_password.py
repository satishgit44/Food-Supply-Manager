"""
CLI utility to change user passwords in the database directly.
Usage: python change_password.py <username> <new_password>
"""
import sys
import mysql.connector
import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

load_dotenv()

def change_password(username, new_password):
    try:
        conn = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST", "localhost"),
            user=os.getenv("MYSQL_USER", "root"),
            password=os.getenv("MYSQL_PASSWORD", "1234"),
            database=os.getenv("MYSQL_DATABASE", "food_supply"),
            port=int(os.getenv("MYSQL_PORT", 3306)),
        )
        cur = conn.cursor()
        
        # Check if user exists
        cur.execute("SELECT id FROM Users WHERE username = %s", (username,))
        row = cur.fetchone()
        if not row:
            print(f"[ERROR] User '{username}' does not exist.")
            conn.close()
            return False
            
        # Update password
        pw_hash = generate_password_hash(new_password)
        cur.execute("UPDATE Users SET password_hash = %s WHERE username = %s", (pw_hash, username))
        conn.commit()
        print(f"[OK] Password updated successfully for user '{username}'!")
        
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"[ERROR] Database error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python change_password.py <username> <new_password>")
        sys.exit(1)
        
    user = sys.argv[1]
    passwd = sys.argv[2]
    change_password(user, passwd)
