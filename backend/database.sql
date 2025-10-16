-- Create database (run this first in your PostgreSQL client)
CREATE DATABASE agg_mvp;

-- Connect to agg_mvp database and run:

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    stall_id INTEGER,
    role VARCHAR(20) DEFAULT 'user'
);

-- Inventory table
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    stall_id INTEGER NOT NULL,
    material_name VARCHAR(100) NOT NULL,
    current_level DECIMAL(10,2) DEFAULT 0,
    alert_level DECIMAL(10,2) DEFAULT 5
);

-- Sales table
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    stall_id INTEGER NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    quantity INTEGER DEFAULT 1,
    price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipes table
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    material_name VARCHAR(100) NOT NULL,
    quantity_used DECIMAL(10,2) NOT NULL
);

-- Insert sample data
INSERT INTO users (username, password, stall_id, role) VALUES 
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 0, 'admin'), -- password: password
('stall_01', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 'user'),
('stall_02', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2, 'user');

-- Insert initial inventory
INSERT INTO inventory (stall_id, material_name, current_level, alert_level) VALUES 
(1, 'Chicken', 20, 5),
(1, 'Flour', 15, 3),
(1, 'Oil', 30, 10),
(2, 'Chicken', 18, 5),
(2, 'Flour', 12, 3),
(2, 'Oil', 25, 10);

-- Insert recipes
INSERT INTO recipes (item_name, material_name, quantity_used) VALUES 
('Regular AGG', 'Chicken', 0.25),
('Regular AGG', 'Flour', 0.1),
('Regular AGG', 'Oil', 0.05),
('Spicy AGG', 'Chicken', 0.25),
('Spicy AGG', 'Flour', 0.1),
('Spicy AGG', 'Oil', 0.05);