const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5001; // Changed to 5001

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
let db;

// Initialize database
const initializeDatabase = async () => {
  try {
    db = await open({
      filename: path.join(__dirname, 'agg_mvp.db'),
      driver: sqlite3.Database
    });
    console.log('✅ SQLite database connected');
    
    // Enable foreign keys and WAL mode for better performance
    await db.exec('PRAGMA foreign_keys = ON');
    await db.exec('PRAGMA journal_mode = WAL');
    
    // Test connection
    await db.get('SELECT datetime("now") as current_time');
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
app.get('/api/test', async (req, res) => {
  try {
    if (!db) {
      return res.json({ 
        message: 'Backend is working! But database is not connected.',
        status: 'Backend OK - Database Disconnected'
      });
    }

    const result = await db.get('SELECT datetime("now") as time');
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
app.post('/api/login', async (req, res) => {
  console.log('Login attempt for:', req.body.username);
  
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const user = await db.get(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

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
      validPassword = await bcrypt.compare(password, user.password);
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
app.get('/api/inventory', authenticateToken, async (req, res) => {
  try {
    const stallId = req.user.stall_id;
    
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const inventory = await db.all(
      'SELECT * FROM inventory WHERE stall_id = ? ORDER BY material_name',
      [stallId]
    );

    res.json(inventory);
  } catch (error) {
    console.error('Inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Sell item - FIXED VERSION
app.post('/api/sell', authenticateToken, async (req, res) => {
  let client;
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

    // Get a connection for transaction
    client = await db;

    // Start transaction
    await client.run('BEGIN TRANSACTION');

    try {
      // Record sale
      const saleResult = await client.run(
        'INSERT INTO sales (stall_id, item_name, price) VALUES (?, ?, ?)',
        [stallId, itemName, price]
      );

      console.log('Sale recorded:', saleResult);

      // Update inventory based on recipe
      const recipes = await client.all(
        'SELECT * FROM recipes WHERE item_name = ?',
        [itemName]
      );

      console.log('Recipes found:', recipes);

      if (recipes.length === 0) {
        throw new Error(`No recipe found for ${itemName}`);
      }

      for (const recipe of recipes) {
        console.log(`Updating inventory: ${recipe.material_name} -${recipe.quantity_used}`);
        const updateResult = await client.run(
          'UPDATE inventory SET current_level = current_level - ? WHERE stall_id = ? AND material_name = ?',
          [recipe.quantity_used, stallId, recipe.material_name]
        );
        console.log('Inventory update result:', updateResult);
      }

      await client.run('COMMIT');

      res.json({ 
        success: true, 
        message: `Sold ${itemName} successfully for RM ${price.toFixed(2)}!` 
      });
    } catch (error) {
      await client.run('ROLLBACK');
      throw error;
    }
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
app.get('/api/stall-today-sales', authenticateToken, async (req, res) => {
  try {
    const stallId = req.user.stall_id;
    
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const result = await db.get(
      `SELECT COUNT(*) as items_sold, COALESCE(SUM(price), 0) as total_revenue 
       FROM sales 
       WHERE stall_id = ? AND DATE(created_at) = DATE('now')`,
      [stallId]
    );

    res.json(result);
  } catch (error) {
    console.error('Sales error:', error);
    res.status(500).json({ error: 'Failed to fetch sales data' });
  }
});

// ==================== ADMIN ROUTES ====================

// Get today's overall stats
app.get('/api/admin/today-stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const result = await db.get(
      `SELECT COUNT(*) as total_items, 
              COALESCE(SUM(price), 0) as total_revenue,
              COUNT(DISTINCT stall_id) as active_stalls
       FROM sales 
       WHERE DATE(created_at) = DATE('now')`
    );

    res.json(result);
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// Get low stock alerts
app.get('/api/admin/low-stock', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const alerts = await db.all(
      `SELECT stall_id, material_name, current_level, alert_level 
       FROM inventory 
       WHERE current_level <= alert_level
       ORDER BY stall_id, material_name`
    );

    res.json(alerts);
  } catch (error) {
    console.error('Low stock error:', error);
    res.status(500).json({ error: 'Failed to fetch low stock alerts' });
  }
});

// Add these routes before the server startup section
// Update inventory levels (for adding stock)
app.post('/api/inventory/update', authenticateToken, async (req, res) => {
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

    const result = await db.run(
      'UPDATE inventory SET current_level = ? WHERE stall_id = ? AND material_name = ?',
      [newLevel, stallId, materialName]
    );

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

// Enhanced sell route with better error handling
app.post('/api/sell', authenticateToken, async (req, res) => {
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
    await db.run('BEGIN TRANSACTION');

    try {
      // Record sale
      const saleResult = await db.run(
        'INSERT INTO sales (stall_id, item_name, price) VALUES (?, ?, ?)',
        [stallId, itemName, price]
      );

      console.log('Sale recorded with ID:', saleResult.lastID);

      // Update inventory based on recipe
      const recipes = await db.all(
        'SELECT * FROM recipes WHERE item_name = ?',
        [itemName]
      );

      console.log('Recipes found:', recipes.length);

      if (recipes.length === 0) {
        // If no recipes found, rollback and return error
        await db.run('ROLLBACK');
        return res.status(400).json({ 
          error: `No recipe found for ${itemName}`,
          suggestion: 'Please add recipes to the database first'
        });
      }

      // Update each inventory item
      for (const recipe of recipes) {
        console.log(`Updating ${recipe.material_name} by ${recipe.quantity_used}`);
        
        const updateResult = await db.run(
          'UPDATE inventory SET current_level = current_level - ? WHERE stall_id = ? AND material_name = ?',
          [recipe.quantity_used, stallId, recipe.material_name]
        );

        if (updateResult.changes === 0) {
          console.warn(`No inventory found for ${recipe.material_name} in stall ${stallId}`);
        }
      }

      await db.run('COMMIT');

      res.json({ 
        success: true, 
        message: `Sold ${itemName} successfully for RM ${price.toFixed(2)}!` 
      });
    } catch (error) {
      await db.run('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Sell error:', error);
    res.status(500).json({ 
      error: 'Failed to process sale',
      details: error.message
    });
  }
});
// Get sales analytics for charts
app.get('/api/sales-analytics', authenticateToken, async (req, res) => {
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

    const analytics = await db.all(query, params);
    
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
app.get('/api/admin/stalls', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const stalls = await db.all(`
      SELECT DISTINCT stall_id 
      FROM inventory 
      ORDER BY stall_id
    `);

    res.json(stalls.map(s => s.stall_id));
  } catch (error) {
    console.error('Stalls error:', error);
    res.status(500).json({ error: 'Failed to fetch stalls' });
  }
});
// Get stall performance
app.get('/api/admin/stall-performance', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const performance = await db.all(
      `SELECT stall_id, 
              COUNT(*) as items_sold, 
              COALESCE(SUM(price), 0) as total_revenue 
       FROM sales 
       WHERE DATE(created_at) = DATE('now') 
       GROUP BY stall_id 
       ORDER BY total_revenue DESC`
    );

    res.json(performance);
  } catch (error) {
    console.error('Performance error:', error);
    res.status(500).json({ error: 'Failed to fetch stall performance' });
  }
});

// Initialize database route (for testing)
app.post('/api/init-db', async (req, res) => {
  try {
    await initializeDatabase();
    res.json({ message: 'Database initialized successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initialize database' });
  }
});

// Start server
const startServer = async () => {
  const dbConnected = await initializeDatabase();
  
  if (!dbConnected) {
    console.log('⚠️  Starting server without database... Some features may not work.');
  }

  app.listen(port, () => {
    console.log(`🚀 AGG MVP Backend Server running on port ${port}`);
    console.log(`📍 Local: http://localhost:${port}`);
    console.log(`🩺 Health check: http://localhost:${port}/api/health`);
    console.log(`🧪 Test endpoint: http://localhost:${port}/api/test`);
    console.log(`🗄️  Database file: ${path.join(__dirname, 'agg_mvp.db')}`);
    console.log('');
    console.log('📋 Demo Accounts:');
    console.log('   Admin:    username: "admin", password: "password"');
    console.log('   Stall 01: username: "stall_01", password: "password"');
    console.log('   Stall 02: username: "stall_02", password: "password"');
  });
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server gracefully...');
  if (db) {
    await db.close();
    console.log('✅ Database connection closed');
  }
  process.exit(0);
});

// Start the server
startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});