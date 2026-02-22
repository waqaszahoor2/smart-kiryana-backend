"""
Smart Store - Database Connection Handler
============================================
Handles database connections, table initialization,
and provides a reusable connection getter.
Supports both MySQL (local) and PostgreSQL (Render cloud).
"""

import os
from config import Config

# Determine database mode
DB_MODE = Config.DB_MODE


def get_connection():
    """
    Create and return a new database connection.
    Uses MySQL locally, PostgreSQL on Render cloud.
    """
    if DB_MODE == "postgresql":
        import psycopg2
        try:
            connection = psycopg2.connect(Config.DATABASE_URL)
            return connection
        except Exception as e:
            print(f"[DB ERROR] Failed to connect to PostgreSQL: {e}")
            raise
    else:
        import mysql.connector
        from mysql.connector import Error
        try:
            connection = mysql.connector.connect(
                host=Config.DB_HOST,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD,
                database=Config.DB_NAME,
            )
            return connection
        except Error as e:
            print(f"[DB ERROR] Failed to connect to MySQL: {e}")
            raise


def _table_exists(cursor, table_name):
    """Check if a table exists in the database."""
    if DB_MODE == "postgresql":
        cursor.execute("""
            SELECT COUNT(*) FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = %s
        """, (table_name,))
    else:
        cursor.execute(f"""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = '{Config.DB_NAME}'
              AND TABLE_NAME = '{table_name}'
        """)
    return cursor.fetchone()[0] > 0


def _get_table_columns(cursor, table_name):
    """Get list of column names for a table."""
    if DB_MODE == "postgresql":
        cursor.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
        """, (table_name,))
        return [row[0] for row in cursor.fetchall()]
    else:
        cursor.execute(f"SHOW COLUMNS FROM {table_name}")
        return [row[0] for row in cursor.fetchall()]


def init_db():
    """
    Initialize the database by creating required tables if they don't exist.
    """
    try:
        connection = get_connection()
        cursor = connection.cursor()

        if DB_MODE == "postgresql":
            # PostgreSQL syntax
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS business_owner (
                    id SERIAL PRIMARY KEY,
                    shop_name VARCHAR(100) NOT NULL,
                    owner_name VARCHAR(100) NOT NULL,
                    phone VARCHAR(20),
                    email VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS products (
                    id SERIAL PRIMARY KEY,
                    owner_id INT NOT NULL,
                    product_name VARCHAR(100) NOT NULL,
                    category VARCHAR(50) DEFAULT 'Other',
                    price DECIMAL(10, 2) NOT NULL,
                    quantity INT NOT NULL DEFAULT 0,
                    unit VARCHAR(20) DEFAULT 'kg',
                    is_available BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (owner_id) REFERENCES business_owner(id)
                        ON DELETE CASCADE
                )
            """)
        else:
            # MySQL syntax
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS business_owner (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    shop_name VARCHAR(100) NOT NULL,
                    owner_name VARCHAR(100) NOT NULL,
                    phone VARCHAR(20),
                    email VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Check if products table has wrong schema
            REQUIRED_COLUMNS = {"id", "owner_id", "product_name", "category",
                                "price", "quantity", "unit", "is_available",
                                "created_at", "updated_at"}

            if _table_exists(cursor, "products"):
                existing_cols = set(_get_table_columns(cursor, "products"))
                missing_cols = REQUIRED_COLUMNS - existing_cols

                if missing_cols:
                    cursor.execute("SELECT COUNT(*) FROM products")
                    row_count = cursor.fetchone()[0]
                    if row_count == 0:
                        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
                        cursor.execute("DROP TABLE products")
                        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
                        print("[DB MIGRATION] Dropped empty products table with wrong schema.")

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS products (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    owner_id INT NOT NULL,
                    product_name VARCHAR(100) NOT NULL,
                    category VARCHAR(50) DEFAULT 'Other',
                    price DECIMAL(10, 2) NOT NULL,
                    quantity INT NOT NULL DEFAULT 0,
                    unit VARCHAR(20) DEFAULT 'kg',
                    is_available BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (owner_id) REFERENCES business_owner(id)
                        ON DELETE CASCADE
                )
            """)

        connection.commit()
        cursor.close()
        connection.close()
        print("[DB] Database initialized successfully (business_owner + products).")
    except Exception as e:
        print(f"[DB ERROR] Failed to initialize database: {e}")
        print("[DB WARNING] Server will start but database operations will fail.")
