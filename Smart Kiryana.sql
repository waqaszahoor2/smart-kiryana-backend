-- ======================================
-- Smart Store - Database Schema
-- ======================================

-- 1️⃣ Create the main database
CREATE DATABASE IF NOT EXISTS smart_kiryana;
USE smart_kiryana;

-- 2️⃣ Create business_owner table
CREATE TABLE IF NOT EXISTS business_owner (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop_name VARCHAR(100) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3️⃣ Create products (store inventory) table
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
);