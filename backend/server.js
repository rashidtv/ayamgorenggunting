const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Database connection
let db;

// Create tables function - MUST BE DEFINED FIRST
const createTables = () => {
  try {
    // Users table
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

    // Inventory table
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

    // Sales table
    db.exec(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stall_id INTEGER NOT NULL,
        item_name TEXT NOT NULL,
        price REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Recipes table
    db.exec(`
      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_name TEXT NOT NULL,
        material_name TEXT NOT NULL,
        quantity_used REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables verified/created');
    return true;
  } catch (error) {
    console.error('❌ Table creation failed:', error);
    return false;
  }
};

// Initialize database
const initializeDatabase = () => {
  try {
    // For Render: use different path that's writable
    const dbPath = process.env.NODE_ENV === 'production' 
      ? '/tmp/agg_mvp.db'
      : path.join(__dirname, 'agg_mvp.db');
    
    db = new Database(dbPath);
    
    // Enable better performance settings
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    
    console.log('✅ SQLite database connected with better-sqlite3');
    
    // Test connection
    const result = db.prepare('SELECT datetime(\'now\') as current_time').get();
    console.log('Database time:', result.current_time);
    
    // CREATE TABLES
    createTables();
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_for_development', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ==================== ROUTES ====================

// Test route
app.get('/api/test', (req, res) => {
  try {
    if (!db) {
      return res.json({ 
        message: 'Backend is working! But database is not connected.',
        status: 'Backend OK - Database Disconnected'
      });
    }

    const result = db.prepare('SELECT datetime(\'now\') as time').get();
    res.json({ 
      message: 'Backend is working!', 
      databaseTime: result.time,
      status: 'Backend & Database OK'
    });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({ 
      error: 'Database connection failed',
      details: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'AGG MVP Backend',
    database: db ? 'Connected' : 'Disconnected',
    port: port
  });
});

// Login route
app.post('/api/login', (req, res) => {
  console.log('Login attempt for:', req.body.username);
  
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const user = db.prepare(
      'SELECT * FROM users WHERE username = ?'
    ).get([username]);

    if (!user) {
      console.log('User not found:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('User found:', user.username, 'Role:', user.role);
    
    // Check password - for demo, also accept "password" without hashing
    let validPassword = false;
    if (password === 'password') {
      validPassword = true;
    } else {
      validPassword = bcrypt.compareSync(password, user.password);
    }

    if (!validPassword) {
      console.log('Invalid password for user:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        stall_id: user.stall_id, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback_secret_key_for_development',
      { expiresIn: '24h' }
    );

    console.log('Login successful for:', username);
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        stall_id: user.stall_id,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error during login',
      details: error.message 
    });
  }
});

// Get stall inventory
app.get('/api/inventory', authenticateToken, (req, res) => {
  try {
    const stallId = req.user.stall_id;
    
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const inventory = db.prepare(
      'SELECT * FROM inventory WHERE stall_id = ? ORDER BY material_name'
    ).all([stallId]);

    res.json(inventory);
  } catch (error) {
    console.error('Inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Sell item
app.post('/api/sell', authenticateToken, (req, res) => {
  try {
    const { itemName, price } = req.body;
    const stallId = req.user.stall_id;

    console.log(`Selling ${itemName} for stall ${stallId} at price ${price}`);

    if (!itemName || !price) {
      return res.status(400).json({ error: 'Item name and price are required' });
    }

    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    // Start transaction
    const transaction = db.transaction(() => {
      // Record sale
      const saleResult = db.prepare(
        'INSERT INTO sales (stall_id, item_name, price) VALUES (?, ?, ?)'
      ).run([stallId, itemName, price]);

      console.log('Sale recorded with ID:', saleResult.lastInsertRowid);

      // Update inventory based on recipe
      const recipes = db.prepare(
        'SELECT * FROM recipes WHERE item_name = ?'
      ).all([itemName]);

      console.log('Recipes found:', recipes.length);

      if (recipes.length === 0) {
        throw new Error(`No recipe found for ${itemName}`);
      }

      // Update each inventory item
      for (const recipe of recipes) {
        console.log(`Updating ${recipe.material_name} by ${recipe.quantity_used}`);
        
        const updateResult = db.prepare(
          'UPDATE inventory SET current_level = current_level - ?, updated_at = datetime("now") WHERE stall_id = ? AND material_name = ?'
        ).run([recipe.quantity_used, stallId, recipe.material_name]);

        if (updateResult.changes === 0) {
          console.warn(`No inventory found for ${recipe.material_name} in stall ${stallId}`);
        }
      }

      return { success: true };
    });

    transaction();

    res.json({ 
      success: true, 
      message: `Sold ${itemName} successfully for RM ${price.toFixed(2)}!` 
    });
  } catch (error) {
    console.error('Sell error:', error);
    res.status(500).json({ 
      error: 'Failed to process sale',
      details: error.message,
      suggestion: 'Check if recipes are properly set up in database'
    });
  }
});

// Get today's sales for stall
app.get('/api/stall-today-sales', authenticateToken, (req, res) => {
  try {
    const stallId = req.user.stall_id;
    
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const result = db.prepare(
      `SELECT COUNT(*) as items_sold, COALESCE(SUM(price), 0) as total_revenue 
       FROM sales 
       WHERE stall_id = ? AND DATE(created_at) = DATE('now')`
    ).get([stallId]);

    res.json(result);
  } catch (error) {
    console.error('Sales error:', error);
    res.status(500).json({ error: 'Failed to fetch sales data' });
  }
});

// ==================== ADMIN ROUTES ====================

// Get today's overall stats
app.get('/api/admin/today-stats', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const result = db.prepare(
      `SELECT COUNT(*) as total_items, 
              COALESCE(SUM(price), 0) as total_revenue,
              COUNT(DISTINCT stall_id) as active_stalls
       FROM sales 
       WHERE DATE(created_at) = DATE('now')`
    ).get();

    res.json(result);
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// Get low stock alerts
app.get('/api/admin/low-stock', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const alerts = db.prepare(
      `SELECT stall_id, material_name, current_level, alert_level 
       FROM inventory 
       WHERE current_level <= alert_level
       ORDER BY stall_id, material_name`
    ).all();

    res.json(alerts);
  } catch (error) {
    console.error('Low stock error:', error);
    res.status(500).json({ error: 'Failed to fetch low stock alerts' });
  }
});

// Update inventory levels
app.post('/api/inventory/update', authenticateToken, (req, res) => {
  try {
    const { materialName, newLevel } = req.body;
    const stallId = req.user.stall_id;

    console.log(`Updating inventory: ${materialName} to ${newLevel} for stall ${stallId}`);

    if (!materialName || newLevel === undefined) {
      return res.status(400).json({ error: 'Material name and new level are required' });
    }

    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const result = db.prepare(
      'UPDATE inventory SET current_level = ?, updated_at = datetime("now") WHERE stall_id = ? AND material_name = ?'
    ).run([newLevel, stallId, materialName]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json({ 
      success: true, 
      message: `Updated ${materialName} to ${newLevel}kg` 
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

// Get sales analytics for charts
app.get('/api/sales-analytics', authenticateToken, (req, res) => {
  try {
    const stallId = req.user.stall_id;
    const isAdmin = req.user.role === 'admin';
    
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    let query = `
      SELECT 
        DATE(created_at) as date,
        item_name,
        COUNT(*) as quantity,
        SUM(price) as revenue
      FROM sales 
      WHERE created_at >= DATE('now', '-7 days')
    `;

    const params = [];
    
    if (!isAdmin) {
      query += ' AND stall_id = ?';
      params.push(stallId);
    }

    query += ' GROUP BY DATE(created_at), item_name ORDER BY date';

    const analytics = db.prepare(query).all(params);
    
    // Format for charts
    const dailySales = {};
    const productSales = {};
    
    analytics.forEach(row => {
      // Daily sales
      if (!dailySales[row.date]) {
        dailySales[row.date] = 0;
      }
      dailySales[row.date] += row.revenue;
      
      // Product sales
      if (!productSales[row.item_name]) {
        productSales[row.item_name] = 0;
      }
      productSales[row.item_name] += row.quantity;
    });

    res.json({
      dailySales: Object.entries(dailySales).map(([date, revenue]) => ({ date, revenue })),
      productSales: Object.entries(productSales).map(([product, quantity]) => ({ product, quantity }))
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get all stalls for admin
app.get('/api/admin/stalls', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const stalls = db.prepare(`
      SELECT DISTINCT stall_id 
      FROM inventory 
      ORDER BY stall_id
    `).all();

    res.json(stalls.map(s => s.stall_id));
  } catch (error) {
    console.error('Stalls error:', error);
    res.status(500).json({ error: 'Failed to fetch stalls' });
  }
});

// Get stall performance
app.get('/api/admin/stall-performance', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const performance = db.prepare(
      `SELECT stall_id, 
              COUNT(*) as items_sold, 
              COALESCE(SUM(price), 0) as total_revenue 
       FROM sales 
       WHERE DATE(created_at) = DATE('now') 
       GROUP BY stall_id 
       ORDER BY total_revenue DESC`
    ).all();

    res.json(performance);
  } catch (error) {
    console.error('Performance error:', error);
    res.status(500).json({ error: 'Failed to fetch stall performance' });
  }
});

// Initialize database route (for testing)
app.post('/api/init-db', (req, res) => {
  try {
    initializeDatabase();
    res.json({ message: 'Database initialized successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initialize database' });
  }
});

// Start server
const startServer = () => {
  const dbConnected = initializeDatabase();
  
  if (!dbConnected) {
    console.log('⚠️  Starting server without database... Some features may not work.');
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 AGG MVP Backend Server running on port ${port}`);
    console.log(`📍 Local: http://localhost:${port}`);
    console.log(`🩺 Health check: http://localhost:${port}/api/health`);
    console.log(`🧪 Test endpoint: http://localhost:${port}/api/test`);
    console.log('');
    console.log('📋 Demo Accounts:');
    console.log('   Admin:    username: "admin", password: "password"');
    console.log('   Stall 01: username: "stall_01", password: "password"');
    console.log('   Stall 02: username: "stall_02", password: "password"');
  });
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  if (db) {
    db.close();
    console.log('✅ Database connection closed');
  }
  process.exit(0);
});

// Start the server
startServer();