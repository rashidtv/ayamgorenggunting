const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// Initialize database
const dbPath = path.join(__dirname, 'agg_mvp.db');
const db = new Database(dbPath);

console.log('🚀 Setting up AGG MVP Database...');

// Enable better performance settings
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    stall_id INTEGER,
    role TEXT NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stall_id INTEGER NOT NULL,
    material_name TEXT NOT NULL,
    current_level REAL NOT NULL DEFAULT 0,
    alert_level REAL NOT NULL DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stall_id, material_name)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stall_id INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    material_name TEXT NOT NULL,
    quantity_used REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert demo users
const hashedPassword = bcrypt.hashSync('password', 10);

db.prepare(`
  INSERT OR IGNORE INTO users (username, password, stall_id, role) 
  VALUES (?, ?, ?, ?)
`).run(['admin', hashedPassword, null, 'admin']);

db.prepare(`
  INSERT OR IGNORE INTO users (username, password, stall_id, role) 
  VALUES (?, ?, ?, ?)
`).run(['stall_01', hashedPassword, 1, 'user']);

db.prepare(`
  INSERT OR IGNORE INTO users (username, password, stall_id, role) 
  VALUES (?, ?, ?, ?)
`).run(['stall_02', hashedPassword, 2, 'user']);

// Insert sample inventory
const inventoryItems = [
  [1, 'Chicken', 50, 10],
  [1, 'Flour', 20, 5],
  [1, 'Oil', 30, 8],
  [2, 'Chicken', 45, 10],
  [2, 'Flour', 25, 5],
  [2, 'Oil', 35, 8]
];

const inventoryStmt = db.prepare(`
  INSERT OR IGNORE INTO inventory (stall_id, material_name, current_level, alert_level)
  VALUES (?, ?, ?, ?)
`);

inventoryItems.forEach(item => {
  inventoryStmt.run(item);
});

// Insert sample recipes
const recipes = [
  ['Regular AGG', 'Chicken', 0.2],
  ['Regular AGG', 'Flour', 0.05],
  ['Regular AGG', 'Oil', 0.1],
  ['Spicy AGG', 'Chicken', 0.2],
  ['Spicy AGG', 'Flour', 0.05],
  ['Spicy AGG', 'Oil', 0.1],
  ['Large AGG', 'Chicken', 0.3],
  ['Large AGG', 'Flour', 0.08],
  ['Large AGG', 'Oil', 0.15],
  ['Family Pack', 'Chicken', 0.8],
  ['Family Pack', 'Flour', 0.2],
  ['Family Pack', 'Oil', 0.3]
];

const recipeStmt = db.prepare(`
  INSERT OR IGNORE INTO recipes (item_name, material_name, quantity_used)
  VALUES (?, ?, ?)
`);

recipes.forEach(recipe => {
  recipeStmt.run(recipe);
});

console.log('✅ Database setup completed!');
console.log('📋 Demo accounts created:');
console.log('   👑 Admin: admin / password');
console.log('   🏪 Stall 01: stall_01 / password');
console.log('   🏪 Stall 02: stall_02 / password');

db.close();