"""
Smart Store - Database Connection Handler
============================================
Handles database connections, table initialization,
and provides reusable helpers. Supports PostgreSQL (Vercel)
and MySQL (local development).
"""

import time
from .config import Config

# Determine database mode
DB_MODE = Config.DB_MODE

# Retry settings — helps when MySQL is still starting after a PC reboot
MAX_RETRIES = 5
RETRY_DELAY = 2  # seconds


def get_connection():
    """
    Create and return a new database connection.
    Uses PostgreSQL when DATABASE_URL is set, otherwise MySQL.
    Retries up to MAX_RETRIES times if the database is not yet ready.
    """
    if DB_MODE == "postgresql":
        try:
            import psycopg2
            conn = psycopg2.connect(Config.DATABASE_URL)
            conn.autocommit = False
            return conn
        except ImportError:
            print("[DB ERROR] psycopg2-binary is not installed. Required for PostgreSQL.")
            raise
        except Exception as e:
            print(f"[DB ERROR] PostgreSQL connection failed: {e}")
            raise
    else:
        import mysql.connector

        last_error = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                conn = mysql.connector.connect(
                    host=Config.DB_HOST,
                    user=Config.DB_USER,
                    password=Config.DB_PASSWORD,
                    database=Config.DB_NAME,
                )
                if attempt > 1:
                    print(f"[DB] Connected to MySQL on attempt {attempt}.")
                return conn
            except mysql.connector.Error as e:
                last_error = e
                print(f"[DB WARNING] MySQL connection attempt {attempt}/{MAX_RETRIES} failed: {e}")
                if attempt < MAX_RETRIES:
                    print(f"[DB] Retrying in {RETRY_DELAY}s...")
                    time.sleep(RETRY_DELAY)

        print(f"[DB ERROR] MySQL connection failed after {MAX_RETRIES} attempts.")
        raise last_error


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
                    user_id INT NOT NULL,
                    shop_name VARCHAR(100) NOT NULL,
                    owner_name VARCHAR(100) NOT NULL,
                    phone VARCHAR(20),
                    email VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
                    user_id INT NOT NULL,
                    shop_name VARCHAR(100) NOT NULL,
                    owner_name VARCHAR(100) NOT NULL,
                    phone VARCHAR(20),
                    email VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

        # Migration: Ensure user_id exists in business_owner
        try:
            if DB_MODE == "postgresql":
                cursor.execute("""
                    DO $$ 
                    BEGIN 
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                       WHERE table_name='business_owner' AND column_name='user_id') THEN
                            ALTER TABLE business_owner ADD COLUMN user_id INT;
                            -- Assign existing records to the first user if any, or just leave NULL if allowed
                            -- For safety in this app, we'll try to find the first user
                            ALTER TABLE business_owner ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
                        END IF;
                        
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                       WHERE table_name='users' AND column_name='google_credentials') THEN
                            ALTER TABLE users ADD COLUMN google_credentials TEXT;
                        END IF;
                    END $$;
                """)
            else:
                cursor.execute("SHOW COLUMNS FROM business_owner LIKE 'user_id'")
                if not cursor.fetchone():
                    cursor.execute("ALTER TABLE business_owner ADD COLUMN user_id INT NOT NULL")
                    cursor.execute("ALTER TABLE business_owner ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE")
                
                cursor.execute("SHOW COLUMNS FROM users LIKE 'google_credentials'")
                if not cursor.fetchone():
                    cursor.execute("ALTER TABLE users ADD COLUMN google_credentials TEXT")
        except Exception as migration_error:
            print(f"[DB MIGRATION WARNING] Could not add columns: {migration_error}")

        connection.commit()

        cursor.close()
        connection.close()
        print("[DB] Tables initialized successfully.")
    except Exception as e:
        print(f"[DB ERROR] Init failed: {e}")
        print("[DB WARNING] Server will start but DB operations may fail.")


