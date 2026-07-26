// backend/db.js
const { Pool } = require('pg');

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create connection pool with production settings
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { 
    rejectUnauthorized: false, // Required for Render PostgreSQL
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection fails
  keepAlive: true,
});

// Force UTC timezone on all connections
pool.on('connect', (client) => {
  client.query("SET TIMEZONE TO 'UTC'");
});

pool.on('acquire', (client) => {
  client.query("SET TIMEZONE TO 'UTC'");
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err.message);
  // Don't exit process on pool errors, let it recover
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    // Don't crash the app, but log the error
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Closing database pool...');
  await pool.end();
  console.log('✅ Database pool closed');
});

module.exports = pool;