const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');

async function setupDatabase() {
  try {
    console.log('Setting up SQLite database...');
    
    // Open SQLite database (creates file if doesn't exist)
    const db = await open({
      filename: path.join(__dirname, 'agg_mvp.db'),
      driver: sqlite3.Database
    });

    console.log('✅ SQLite database connected');

    // Create tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        stall_id INTEGER,
        role TEXT DEFAULT 'user'
      );

      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stall_id INTEGER NOT NULL,
        material_name TEXT NOT NULL,
        current_level REAL DEFAULT 0,
        alert_level REAL DEFAULT 5,
        UNIQUE(stall_id, material_name)  -- Add unique constraint
      );

      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stall_id INTEGER NOT NULL,
        item_name TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        price REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_name TEXT NOT NULL,
        material_name TEXT NOT NULL,
        quantity_used REAL NOT NULL,
        UNIQUE(item_name, material_name)  -- Add unique constraint
      );
    `);

    console.log('✅ Tables created');

    // Hash password for demo users
    const hashedPassword = await bcrypt.hash('password', 10);

    // Insert sample users (using INSERT OR IGNORE to avoid duplicates)
    await db.run(`
      INSERT OR IGNORE INTO users (username, password, stall_id, role) VALUES 
      (?, ?, ?, ?)
    `, ['admin', hashedPassword, 0, 'admin']);

    await db.run(`
      INSERT OR IGNORE INTO users (username, password, stall_id, role) VALUES 
      (?, ?, ?, ?)
    `, ['stall_01', hashedPassword, 1, 'user']);

    await db.run(`
      INSERT OR IGNORE INTO users (username, password, stall_id, role) VALUES 
      (?, ?, ?, ?)
    `, ['stall_02', hashedPassword, 2, 'user']);

    // Clear existing inventory to avoid duplicates
    await db.run('DELETE FROM inventory');

    // Insert sample inventory (one entry per material per stall)
    const inventoryData = [
      [1, 'Chicken', 20, 5],
      [1, 'Flour', 15, 3],
      [1, 'Oil', 30, 10],
      [2, 'Chicken', 18, 5],
      [2, 'Flour', 12, 3],
      [2, 'Oil', 25, 10]
    ];

    for (const item of inventoryData) {
      await db.run(`
        INSERT INTO inventory (stall_id, material_name, current_level, alert_level) 
        VALUES (?, ?, ?, ?)
      `, item);
    }

    // Clear existing recipes
    await db.run('DELETE FROM recipes');

    // Insert recipes (complete set for all menu items)
    const recipesData = [
      // Regular AGG
      ['Regular AGG', 'Chicken', 0.25],
      ['Regular AGG', 'Flour', 0.1],
      ['Regular AGG', 'Oil', 0.05],
      
      // Spicy AGG
      ['Spicy AGG', 'Chicken', 0.25],
      ['Spicy AGG', 'Flour', 0.1],
      ['Spicy AGG', 'Oil', 0.05],
      
      // Large AGG
      ['Large AGG', 'Chicken', 0.4],
      ['Large AGG', 'Flour', 0.15],
      ['Large AGG', 'Oil', 0.08],
      
      // Family Pack
      ['Family Pack', 'Chicken', 1.0],
      ['Family Pack', 'Flour', 0.3],
      ['Family Pack', 'Oil', 0.15]
    ];

    for (const recipe of recipesData) {
      await db.run(`
        INSERT INTO recipes (item_name, material_name, quantity_used) 
        VALUES (?, ?, ?)
      `, recipe);
    }

    console.log('✅ Sample data inserted');
    console.log('');
    console.log('📋 Demo Accounts:');
    console.log('   Admin:    username: "admin", password: "password"');
    console.log('   Stall 01: username: "stall_01", password: "password"');
    console.log('   Stall 02: username: "stall_02", password: "password"');
    console.log('');
    console.log('📦 Inventory per stall:');
    console.log('   Each stall has: Chicken, Flour, Oil');
    console.log('');
    console.log('🍗 Menu Items with Recipes:');
    console.log('   Regular AGG, Spicy AGG, Large AGG, Family Pack');
    console.log('');
    console.log('✅ Database setup completed successfully!');
    console.log('📁 Database file: agg_mvp.db');

    await db.close();
  } catch (error) {
    console.error('❌ Database setup error:', error);
  }
}

setupDatabase();