"""
Smart Store - Database Connection Handler
============================================
Handles database connections, table initialization,
and provides reusable helpers. Supports PostgreSQL (Vercel)
and MySQL (local development).
"""

from config import Config

# Determine database mode
DB_MODE = Config.DB_MODE


def get_connection():
    """
    Create and return a new database connection.
    Uses PostgreSQL when DATABASE_URL is set, otherwise MySQL.
    """
    if DB_MODE == "postgresql":
        import psycopg2
        try:
            conn = psycopg2.connect(Config.DATABASE_URL)
            conn.autocommit = False
            return conn
        except Exception as e:
            print(f"[DB ERROR] PostgreSQL connection failed: {e}")
            raise
    else:
        import mysql.connector
        try:
            conn = mysql.connector.connect(
                host=Config.DB_HOST,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD,
                database=Config.DB_NAME,
            )
            return conn
        except Exception as e:
            print(f"[DB ERROR] MySQL connection failed: {e}")
            raise


def get_dict_cursor(connection):
    """
    Return a cursor that yields rows as dictionaries.
    """
    if DB_MODE == "postgresql":
        import psycopg2.extras
        return connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    else:
        return connection.cursor(dictionary=True)


def get_last_id(cursor, connection, table_name):
    """
    Get the last inserted row ID (works for both MySQL and PostgreSQL).
    """
    if DB_MODE == "postgresql":
        cur = connection.cursor()
        cur.execute(
            f"SELECT currval(pg_get_serial_sequence('{table_name}', 'id'))"
        )
        result = cur.fetchone()[0]
        cur.close()
        return result
    else:
        return cursor.lastrowid


def init_db():
    """
    Create required tables if they don't already exist.
    Called once on application startup.
    """
    try:
        connection = get_connection()
        cursor = connection.cursor()

        if DB_MODE == "postgresql":
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(256) DEFAULT '',
                    provider VARCHAR(20) DEFAULT 'email',
                    provider_id VARCHAR(100) DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
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
                    cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
                    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
                    unit VARCHAR(20) DEFAULT 'kg',
                    is_available BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (owner_id) REFERENCES business_owner(id)
                        ON DELETE CASCADE
                )
            """)
        else:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(256) DEFAULT '',
                    provider VARCHAR(20) DEFAULT 'email',
                    provider_id VARCHAR(100) DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
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
                    cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
                    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
                    unit VARCHAR(20) DEFAULT 'kg',
                    is_available BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (owner_id) REFERENCES business_owner(id)
                        ON DELETE CASCADE
                )
            """)

        connection.commit()
        cursor.close()
        connection.close()
        print("[DB] Tables initialized successfully.")
    except Exception as e:
        print(f"[DB ERROR] Init failed: {e}")
        print("[DB WARNING] Server will start but DB operations may fail.")
