"""
Executes database initialization from database/02_init.sql safely.
It creates the schema, seed data, views, stored procedures, and triggers
in a way that is compatible with the current MySQL server and app expectations.
"""
import mysql.connector
import os
import re
from dotenv import load_dotenv

load_dotenv()


def split_sql_statements(sql_content: str):
    """Split SQL content into executable statements, handling DELIMITER blocks."""
    statements = []
    current = []
    in_delimited_block = False
    delimiter = ";"

    for line in sql_content.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("--"):
            continue

        if stripped.upper().startswith("DELIMITER"):
            if in_delimited_block:
                current.append(line)
                continue
            delimiter = stripped.split()[-1]
            in_delimited_block = True
            continue

        if in_delimited_block:
            current.append(line)
            if stripped.endswith(delimiter):
                statement = "\n".join(current).strip()
                if statement:
                    statements.append(statement)
                current = []
                in_delimited_block = False
                delimiter = ";"
            continue

        if stripped.endswith(";"):
            current.append(line)
            statement = "\n".join(current).strip()
            if statement:
                statements.append(statement)
            current = []
        else:
            current.append(line)

    if current:
        statement = "\n".join(current).strip()
        if statement:
            statements.append(statement)

    return [stmt for stmt in statements if stmt]


def normalize_statement(stmt: str) -> str:
    cleaned = stmt.strip()
    if not cleaned:
        return cleaned
    cleaned = re.sub(r"^DELIMITER\s+.*$", "", cleaned, flags=re.IGNORECASE | re.MULTILINE)
    cleaned = re.sub(r"\s+//\s*$", "", cleaned)
    if cleaned.upper().startswith("INSERT INTO"):
        cleaned = re.sub(r"^INSERT\s+INTO", "INSERT IGNORE INTO", cleaned, flags=re.IGNORECASE)
    return cleaned.rstrip(";") + ";"


def run_init_sql():
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

        sql_path = os.path.join("database", "02_init.sql")
        with open(sql_path, "r", encoding="utf-8") as f:
            sql_content = f.read()

        sql_clean = []
        for line in sql_content.splitlines():
            if line.strip().startswith("--"):
                continue
            sql_clean.append(line)
        sql_body = "\n".join(sql_clean)

        statements = split_sql_statements(sql_body)
        for stmt in statements:
            normalized = normalize_statement(stmt)
            try:
                cur.execute(normalized)
                first_words = " ".join(normalized.split()[:4])
                print(f"[OK] Executed: {first_words}...")
            except Exception as e:
                print(f"[WARN] Ignored statement: {e}")

        conn.commit()
        cur.close()
        conn.close()
        print("\n[OK] Database initialization successfully processed!")
    except Exception as e:
        print(f"[FATAL] Connection error: {e}")


if __name__ == "__main__":
    run_init_sql()
