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
    """
    if DB_MODE == "postgresql":
        import psycopg2
        try:
            connection = psycopg2.connect(Config.DATABASE_URL)
            connection.autocommit = False
            return connection
        except Exception as e:
            print(f"[DB ERROR] Failed to connect to PostgreSQL: {e}")
            raise
    else:
        import mysql.connector
        try:
            connection = mysql.connector.connect(
                host=Config.DB_HOST,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD,
                database=Config.DB_NAME,
            )
            return connection
        except Exception as e:
            print(f"[DB ERROR] Failed to connect to MySQL: {e}")
            raise


def get_dict_cursor(connection):
    """
    Return a cursor that returns rows as dictionaries.
    Works with both MySQL and PostgreSQL.
    """
    if DB_MODE == "postgresql":
        import psycopg2.extras
        return connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    else:
        return connection.cursor(dictionary=True)


def get_last_id(cursor, connection, table_name):
    """
    Get the last inserted ID. Works with both MySQL and PostgreSQL.
    """
    if DB_MODE == "postgresql":
        # PostgreSQL: use currval of the sequence
        cur = connection.cursor()
        cur.execute(f"SELECT currval(pg_get_serial_sequence('{table_name}', 'id'))")
        result = cur.fetchone()[0]
        cur.close()
        return result
    else:
        return cursor.lastrowid


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
