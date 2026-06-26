const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createSchema() {
  const client = await pool.connect();
  try {
    // Companies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Stalls table
    await client.query(`
      CREATE TABLE IF NOT EXISTS stalls (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id),
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        location TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Users table (extended)
    await client.query(`
      DROP TABLE IF EXISTS users CASCADE;
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT,
        role TEXT NOT NULL CHECK (role IN ('super_super_admin', 'super_admin', 'stall_admin', 'cashier')),
        company_id INTEGER REFERENCES companies(id),
        can_manage_multiple_stalls BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // User-Stall assignments (many-to-many)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_stall_assignments (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        stall_id INTEGER REFERENCES stalls(id) ON DELETE CASCADE,
        is_primary BOOLEAN DEFAULT false,
        PRIMARY KEY (user_id, stall_id)
      );
    `);

    // Inventory table
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        stall_id INTEGER REFERENCES stalls(id),
        material_name TEXT NOT NULL,
        current_level REAL NOT NULL DEFAULT 0,
        alert_level REAL NOT NULL DEFAULT 10,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(stall_id, material_name)
      );
    `);

    // Sales table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        stall_id INTEGER REFERENCES stalls(id),
        item_name TEXT NOT NULL,
        price REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Recipes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS recipes (
        id SERIAL PRIMARY KEY,
        item_name TEXT NOT NULL,
        material_name TEXT NOT NULL,
        quantity_used REAL NOT NULL
      );
    `);

    console.log('✅ All tables created');
  } catch (err) {
    console.error('❌ Schema creation error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

createSchema();
