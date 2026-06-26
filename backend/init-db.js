const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function init() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'cashier',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const bcrypt = require('bcryptjs');
    const hashed = bcrypt.hashSync('admin123', 10);
    await client.query(`
      INSERT INTO users (username, password, role)
      VALUES ('admin', $1, 'super_super_admin')
      ON CONFLICT (username) DO NOTHING
    `, [hashed]);
    console.log('✅ Database initialized');
  } catch (err) {
    console.error('❌ Init error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

init();