const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Email service
const {
  sendRegistrationReceived,
  sendRegistrationApproved,
  sendRegistrationRejected,
  sendNewUserCreated,
  sendPasswordReset,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation
} = require('./emails/resend');

const app = express();
const port = process.env.PORT || 10000;

// ============ INCREASE PAYLOAD SIZE LIMITS ============
app.use(express.json({ 
  limit: '50mb',  // Allow up to 50MB for JSON payloads
  verify: (req, res, buf) => {
    req.rawBody = buf.toString()
  }
}));
app.use(express.urlencoded({ 
  limit: '50mb', 
  extended: true 
}));

// ============ CORS ============
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://agg-frontend.onrender.com', 'https://chickoryhub.com', 'https://www.chickoryhub.com']
  : ['http://localhost:5173', 'http://localhost:10000', 'https://*.preview.app.github.dev'];

app.use(cors({ 
  origin: allowedOrigins, 
  credentials: true,
  optionsSuccessStatus: 200
}));

// ============ DATABASE ============
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  keepAlive: true,
});

// Handle pool errors without crashing
pool.on('error', (err) => {
  console.error('Unexpected database error:', err.message);
});

// ============ FILE UPLOAD CONFIGURATION ============

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads (including PDF)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `receipt-${unique}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  }
});

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// ==================== PERMISSION HELPERS ====================

const isCompanyAdmin = (req) => {
  if (!req.user) return false;
  if (req.user.role === 'super_super_admin' || req.user.role === 'super_admin') {
    return true;
  }
  if (req.user.company_id) {
    return true;
  }
  return false;
};

const userCanAccessCompany = (user, companyId) => {
  if (!user) return false;
  if (user.role === 'super_super_admin') return true;
  if (user.role === 'super_admin' && user.company_id === companyId) return true;
  if (user.company_id === companyId) return true;
  return false;
};

// ==================== HELPER FUNCTIONS ====================

function getUnit(materialName) {
  // Only Chicken exists now, always return 'pieces'
  return 'pieces';
}

async function getUserById(id) {
  try {
    const res = await pool.query(`
      SELECT u.*, c.name as company_name,
        COALESCE(
          (SELECT json_agg(json_build_object('id', s.id, 'name', s.name, 'code', s.code))
           FROM user_stall_assignments usa
           JOIN stalls s ON usa.stall_id = s.id
           WHERE usa.user_id = u.id),
          '[]'
        ) as assigned_stalls
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.id = $1
    `, [id]);
    return res.rows[0];
  } catch (err) {
    console.error('getUserById error:', err.message);
    throw err;
  }
}

async function userCanAccessStall(userId, stallId) {
  const user = await getUserById(userId);
  if (!user) return false;
  if (user.role === 'super_super_admin' || user.role === 'super_admin') return true;
  const assRes = await pool.query('SELECT 1 FROM user_stall_assignments WHERE user_id = $1 AND stall_id = $2', [userId, stallId]);
  return assRes.rowCount > 0;
}

// ==================== AUTHENTICATION ====================

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', async (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    const user = await getUserById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    // Ensure company_id is set for admin users if missing
    if (!user.company_id && (user.role === 'super_admin' || user.role === 'super_super_admin')) {
      const companyRes = await pool.query('SELECT id FROM companies LIMIT 1');
      if (companyRes.rows[0]) {
        user.company_id = companyRes.rows[0].id;
        await pool.query('UPDATE users SET company_id = $1 WHERE id = $2', [user.company_id, user.id]);
        console.log(`✅ Updated company_id for user ${user.username} to ${user.company_id}`);
      }
    }
    
    req.user = user;
    next();
  });
};

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = userRes.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // ✅ ADD THIS - First login check
    if (user.is_first_login === true) {
      return res.json({
        requiresReset: true,
        userId: user.id,
        username: user.username,
        full_name: user.full_name || user.username,
        email: user.email || ''
      });
    }

    // ✅ EXISTING CODE - Token generation (unchanged)
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    const fullUser = await getUserById(user.id);
    res.json({
      token,
      user: {
        id: fullUser.id,
        username: fullUser.username,
        full_name: fullUser.full_name,
        role: fullUser.role,
        company_id: fullUser.company_id,
        company_name: fullUser.company_name,
        assigned_stalls: fullUser.assigned_stalls || []
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ==================== FIRST LOGIN RESET ====================
app.post('/api/auth/first-login-reset', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  
  // Validate new password
  if (!/^[a-zA-Z0-9]+$/.test(newPassword)) {
    return res.status(400).json({ error: 'Password must contain only letters and numbers' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }
  
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Verify current password
    const valid = bcrypt.compareSync(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    
    // Hash new password
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    
    // Update password and set is_first_login to false
    await pool.query(
      'UPDATE users SET password = $1, is_first_login = false WHERE id = $2',
      [hashedPassword, userId]
    );
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('First login reset error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ==================== IMAGE UPLOAD ROUTE ====================

app.post('/api/upload/menu-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    
    // Get the base URL
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    res.json({ 
      success: true, 
      imageUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload image: ' + err.message });
  }
});

// ==================== INVENTORY ROUTES ====================

app.get('/api/inventory', authenticateToken, async (req, res) => {
  try {
    let stallIds = [];
    const requestedStallId = req.query.stallId ? parseInt(req.query.stallId) : null;

    if (requestedStallId) {
      const allowed = await userCanAccessStall(req.user.id, requestedStallId);
      if (!allowed) return res.status(403).json({ error: 'Access denied' });
      stallIds = [requestedStallId];
    } else if (req.user.role === 'super_super_admin') {
      const stallsRes = await pool.query('SELECT id FROM stalls');
      stallIds = stallsRes.rows.map(r => r.id);
    } else if (req.user.role === 'super_admin') {
      const stallsRes = await pool.query('SELECT id FROM stalls WHERE company_id = $1', [req.user.company_id]);
      stallIds = stallsRes.rows.map(r => r.id);
    } else if (req.user.role === 'stall_admin') {
      const assRes = await pool.query('SELECT stall_id FROM user_stall_assignments WHERE user_id = $1', [req.user.id]);
      stallIds = assRes.rows.map(r => r.stall_id);
    } else if (req.user.role === 'cashier') {
      const assRes = await pool.query('SELECT stall_id FROM user_stall_assignments WHERE user_id = $1 LIMIT 1', [req.user.id]);
      if (assRes.rows[0]) stallIds = [assRes.rows[0].stall_id];
    }

    if (stallIds.length === 0) return res.json([]);
    const inventoryRes = await pool.query(
      'SELECT * FROM inventory WHERE stall_id = ANY($1::int[]) ORDER BY material_name',
      [stallIds]
    );
    
    // Ensure alert_level is set to 10 for Chicken if not set
    const results = inventoryRes.rows.map(item => ({
      ...item,
      alert_level: item.material_name === 'Chicken' ? (item.alert_level || 10) : item.alert_level
    }));
    
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});


// ==================== INVENTORY UPDATE ROUTE ====================
app.post('/api/inventory/update', authenticateToken, async (req, res) => {
  const { materialName, newLevel, stallId, alertLevel } = req.body;
  let targetStallId = stallId ? parseInt(stallId) : null;

  if (!targetStallId) {
    if (req.user.role === 'super_super_admin') {
      return res.status(400).json({ error: 'stallId required' });
    }
    targetStallId = req.user.assigned_stalls?.[0]?.id;
  }

  if (!targetStallId) return res.status(400).json({ error: 'No stall specified' });

  const allowed = await userCanAccessStall(req.user.id, targetStallId);
  if (!allowed) return res.status(403).json({ error: 'Access denied' });

  try {
    // Always use alert level 10 for Chicken
    const finalAlertLevel = materialName === 'Chicken' ? 10 : (alertLevel || 10);

    const checkRes = await pool.query(
      'SELECT id FROM inventory WHERE stall_id = $1 AND material_name = $2',
      [targetStallId, materialName]
    );

    if (checkRes.rows.length === 0) {
      await pool.query(
        `INSERT INTO inventory (stall_id, material_name, current_level, alert_level) 
         VALUES ($1, $2, $3, $4)`,
        [targetStallId, materialName, newLevel, finalAlertLevel]
      );
    } else {
      await pool.query(
        `UPDATE inventory SET current_level = $1, alert_level = $2, updated_at = CURRENT_TIMESTAMP
         WHERE stall_id = $3 AND material_name = $4`,
        [newLevel, finalAlertLevel, targetStallId, materialName]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Inventory update error:', err);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

// ==================== SALES ROUTES ====================

app.post('/api/sell', authenticateToken, async (req, res) => {
  const { itemName, price, stallId } = req.body;
  let targetStallId = stallId ? parseInt(stallId) : null;

  if (!targetStallId) {
    targetStallId = req.user.assigned_stalls?.[0]?.id;
  }
  if (!targetStallId) return res.status(400).json({ error: 'No stall selected' });

  const allowed = await userCanAccessStall(req.user.id, targetStallId);
  if (!allowed) return res.status(403).json({ error: 'Access denied' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Insert the sale
    await client.query(
      'INSERT INTO sales (stall_id, item_name, price) VALUES ($1, $2, $3)',
      [targetStallId, itemName, price]
    );
    
    // Check for recipe
    const recipeRes = await client.query('SELECT material_name, quantity_used FROM recipes WHERE item_name = $1', [itemName]);
    
    // If recipe exists, update inventory
    if (recipeRes.rows.length > 0) {
      for (const recipe of recipeRes.rows) {
        await client.query(
          `UPDATE inventory SET current_level = current_level - $1, updated_at = CURRENT_TIMESTAMP
           WHERE stall_id = $2 AND material_name = $3`,
          [recipe.quantity_used, targetStallId, recipe.material_name]
        );
      }
      console.log(`✅ Sold ${itemName}, updated inventory for ${recipeRes.rows.length} ingredients`);
    } else {
      // No recipe found - just log (don't throw error)
      console.log(`ℹ️ ${itemName} sold (no recipe, inventory not updated)`);
    }
    
    await client.query('COMMIT');
    res.json({ success: true, message: `Sold ${itemName}` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Sell error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ==================== STALL TODAY SALES ====================
app.get('/api/stall-today-sales', authenticateToken, async (req, res) => {
  let targetStallId = req.query.stallId ? parseInt(req.query.stallId) : null;
  if (!targetStallId) {
    targetStallId = req.user.assigned_stalls?.[0]?.id;
  }
  if (!targetStallId) {
    if (req.user.role === 'super_admin') {
      const result = await pool.query(`
        SELECT COUNT(*) as items_sold, COALESCE(SUM(price), 0) as total_revenue
        FROM sales
        WHERE stall_id IN (SELECT id FROM stalls WHERE company_id = $1) AND DATE(created_at) = CURRENT_DATE
      `, [req.user.company_id]);
      return res.json(result.rows[0]);
    }
    return res.json({ items_sold: 0, total_revenue: 0 });
  }

  const allowed = await userCanAccessStall(req.user.id, targetStallId);
  if (!allowed) return res.status(403).json({ error: 'Access denied' });

  const result = await pool.query(
    `SELECT COUNT(*) as items_sold, COALESCE(SUM(price), 0) as total_revenue
     FROM sales
     WHERE stall_id = $1 AND DATE(created_at) = CURRENT_DATE`,
    [targetStallId]
  );
  res.json(result.rows[0]);
});

app.get('/api/sales-analytics', authenticateToken, async (req, res) => {
  try {
    const { stallId, days } = req.query;
    let targetStallId = stallId ? parseInt(stallId) : null;
    let dayRange = days ? parseInt(days) : 7;

    let startDate;
    let endDate;
    let useDateRange = false;
    
    // ============================================================
    // ✅ FIX: Only change the week (days=7) logic
    // ============================================================
    if (dayRange === 7) {
      // Calculate Monday-Sunday of current week in UTC
      const now = new Date();
      const currentDay = now.getUTCDay();
      const daysToMonday = (currentDay === 0) ? 6 : (currentDay - 1);
      
      const monday = new Date(now);
      monday.setUTCDate(now.getUTCDate() - daysToMonday);
      monday.setUTCHours(0, 0, 0, 0);
      
      const sunday = new Date(monday);
      sunday.setUTCDate(monday.getUTCDate() + 6);
      sunday.setUTCHours(23, 59, 59, 999);
      
      startDate = monday;
      endDate = sunday;
      useDateRange = true;
      console.log('📊 Week range (UTC):', startDate.toISOString(), 'to', endDate.toISOString());
    } else if (dayRange === 1) {
      // Today view - keep existing logic
      const now = new Date();
      const malaysiaToday = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
      malaysiaToday.setHours(0, 0, 0, 0);
      startDate = new Date(malaysiaToday.getTime() - (8 * 60 * 60 * 1000));
    } else {
      // Other views - keep existing logic
      startDate = new Date();
      startDate.setDate(startDate.getDate() - dayRange);
    }

    // ============================================================
    // SUPER ADMIN / SUPER SUPER ADMIN
    // ============================================================
    if (req.user.role === 'super_admin' || req.user.role === 'super_super_admin') {
      let companyId = req.user.company_id;
      if (req.user.role === 'super_super_admin') {
        const companyRes = await pool.query('SELECT id FROM companies LIMIT 1');
        if (companyRes.rows[0]) {
          companyId = companyRes.rows[0].id;
        }
      }
      
      if (!companyId) {
        return res.json({ dailySales: [], productSales: {} });
      }

      const stallIdsRes = await pool.query('SELECT id FROM stalls WHERE company_id = $1', [companyId]);
      const stallIds = stallIdsRes.rows.map(r => r.id);
      
      if (stallIds.length === 0) {
        return res.json({ dailySales: [], productSales: {} });
      }

      // ✅ Build query with date filtering
      let dailyQuery = `
        SELECT 
          DATE(created_at) as date, 
          COALESCE(SUM(price), 0) as revenue, 
          COUNT(*) as items
        FROM sales
        WHERE stall_id = ANY($1::int[])
      `;
      
      let productQuery = `
        SELECT 
          item_name, 
          COUNT(*) as quantity,
          COALESCE(SUM(price), 0) as revenue
        FROM sales
        WHERE stall_id = ANY($1::int[])
      `;
      
      let totalQuery = `
        SELECT 
          COALESCE(SUM(price), 0) as total_revenue,
          COUNT(*) as total_items
        FROM sales
        WHERE stall_id = ANY($1::int[])
      `;
      
      let topStallQuery = `
        SELECT 
          s.name as stall_name,
          COALESCE(SUM(sales.price), 0) as revenue
        FROM sales
        JOIN stalls s ON sales.stall_id = s.id
        WHERE sales.stall_id = ANY($1::int[])
      `;
      
      const params = [stallIds];
      let paramCount = 2;
      
      // ✅ FIX: Always have a valid date condition
      if (useDateRange && startDate && endDate) {
        const dateCondition = ` AND created_at >= $${paramCount} AND created_at <= $${paramCount + 1}`;
        dailyQuery += dateCondition;
        productQuery += dateCondition;
        totalQuery += dateCondition;
        topStallQuery += dateCondition;
        params.push(startDate.toISOString(), endDate.toISOString());
      } else if (startDate) {
        const dateCondition = ` AND created_at >= $${paramCount}`;
        dailyQuery += dateCondition;
        productQuery += dateCondition;
        totalQuery += dateCondition;
        topStallQuery += dateCondition;
        params.push(startDate.toISOString());
      } else {
        // ✅ FALLBACK: If no date condition, use last 7 days
        const fallbackDate = new Date();
        fallbackDate.setDate(fallbackDate.getDate() - 7);
        const dateCondition = ` AND created_at >= $${paramCount}`;
        dailyQuery += dateCondition;
        productQuery += dateCondition;
        totalQuery += dateCondition;
        topStallQuery += dateCondition;
        params.push(fallbackDate.toISOString());
      }
      
      dailyQuery += ` GROUP BY DATE(created_at) ORDER BY date`;
      productQuery += ` GROUP BY item_name ORDER BY quantity DESC`;
      topStallQuery += ` GROUP BY s.name ORDER BY revenue DESC LIMIT 1`;
      
      // ✅ Execute all queries
      const [dailyRes, productRes, totalRes, topStallRes] = await Promise.all([
        pool.query(dailyQuery, params),
        pool.query(productQuery, params),
        pool.query(totalQuery, params),
        pool.query(topStallQuery, params)
      ]);

      const productSales = {};
      productRes.rows.forEach(row => {
        productSales[row.item_name] = {
          quantity: parseInt(row.quantity),
          revenue: parseFloat(row.revenue)
        };
      });

      return res.json({
        dailySales: dailyRes.rows,
        productSales: productSales,
        totalItems: parseInt(totalRes.rows[0]?.total_items || 0),
        totalRevenue: parseFloat(totalRes.rows[0]?.total_revenue || 0),
        topStall: topStallRes.rows[0]?.stall_name || '-'
      });
    }

    // ============================================================
    // STALL ADMIN / CASHIER - SAME FIX APPLIED
    // ============================================================
    let stallIds = req.user.assigned_stalls?.map(s => s.id) || [];
    
    if (stallIds.length === 0) {
      const assRes = await pool.query('SELECT stall_id FROM user_stall_assignments WHERE user_id = $1', [req.user.id]);
      stallIds = assRes.rows.map(r => r.stall_id);
    }
    
    if (stallIds.length === 0) {
      return res.json({ dailySales: [], productSales: {}, totalItems: 0, totalRevenue: 0, topStall: '-' });
    }
    
    if (targetStallId) {
      if (!stallIds.includes(targetStallId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      stallIds = [targetStallId];
    }

    // ✅ Build queries with date filtering (same pattern)
    let dailyQuery = `
      SELECT 
        DATE(created_at) as date, 
        COALESCE(SUM(price), 0) as revenue, 
        COUNT(*) as items
      FROM sales
      WHERE stall_id = ANY($1::int[])
    `;
    
    let productQuery = `
      SELECT 
        item_name, 
        COUNT(*) as quantity,
        COALESCE(SUM(price), 0) as revenue
      FROM sales
      WHERE stall_id = ANY($1::int[])
    `;
    
    let totalQuery = `
      SELECT 
        COALESCE(SUM(price), 0) as total_revenue,
        COUNT(*) as total_items
      FROM sales
      WHERE stall_id = ANY($1::int[])
    `;
    
    let topStallQuery = `
      SELECT 
        s.name as stall_name,
        COALESCE(SUM(sales.price), 0) as revenue
      FROM sales
      JOIN stalls s ON sales.stall_id = s.id
      WHERE sales.stall_id = ANY($1::int[])
    `;
    
    const params2 = [stallIds];
    let paramCount2 = 2;
    
    if (useDateRange && startDate && endDate) {
      const dateCondition = ` AND created_at >= $${paramCount2} AND created_at <= $${paramCount2 + 1}`;
      dailyQuery += dateCondition;
      productQuery += dateCondition;
      totalQuery += dateCondition;
      topStallQuery += dateCondition;
      params2.push(startDate.toISOString(), endDate.toISOString());
    } else if (startDate) {
      const dateCondition = ` AND created_at >= $${paramCount2}`;
      dailyQuery += dateCondition;
      productQuery += dateCondition;
      totalQuery += dateCondition;
      topStallQuery += dateCondition;
      params2.push(startDate.toISOString());
    } else {
      // ✅ FALLBACK
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() - 7);
      const dateCondition = ` AND created_at >= $${paramCount2}`;
      dailyQuery += dateCondition;
      productQuery += dateCondition;
      totalQuery += dateCondition;
      topStallQuery += dateCondition;
      params2.push(fallbackDate.toISOString());
    }
    
    dailyQuery += ` GROUP BY DATE(created_at) ORDER BY date`;
    productQuery += ` GROUP BY item_name ORDER BY quantity DESC`;
    topStallQuery += ` GROUP BY s.name ORDER BY revenue DESC LIMIT 1`;
    
    const [dailyRes, productRes, totalRes, topStallRes] = await Promise.all([
      pool.query(dailyQuery, params2),
      pool.query(productQuery, params2),
      pool.query(totalQuery, params2),
      pool.query(topStallQuery, params2)
    ]);

    const productSales2 = {};
    productRes.rows.forEach(row => {
      productSales2[row.item_name] = {
        quantity: parseInt(row.quantity),
        revenue: parseFloat(row.revenue)
      };
    });

    res.json({
      dailySales: dailyRes.rows,
      productSales: productSales2,
      totalItems: parseInt(totalRes.rows[0]?.total_items || 0),
      totalRevenue: parseFloat(totalRes.rows[0]?.total_revenue || 0),
      topStall: topStallRes.rows[0]?.stall_name || '-'
    });
    
  } catch (err) {
    console.error('Sales analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics', details: err.message });
  }
});

// ==================== COMPANY MANAGEMENT ====================

// IMPORTANT: Specific company routes MUST come BEFORE generic /api/companies routes

// ==================== COMPANY STALLS ====================
// ============================================
// GET COMPANY STALLS
// ============================================

app.get('/api/companies/:companyId/stalls', authenticateToken, async (req, res) => {
  const companyId = parseInt(req.params.companyId);
  if (isNaN(companyId)) {
    return res.status(400).json({ error: 'Invalid company ID' });
  }

  // Super Super Admin and Super Admin can view any company's stalls
  // Stall Admin can only view their own company's stalls
  if (req.user.role === 'stall_admin') {
    const userCheck = await pool.query('SELECT company_id FROM users WHERE id = $1', [req.user.id]);
    if (userCheck.rows[0]?.company_id !== companyId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } else if (req.user.role !== 'super_super_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        s.*,
        c.name as company_name,
        COALESCE(
          (SELECT COUNT(DISTINCT usa.user_id) 
           FROM user_stall_assignments usa 
           WHERE usa.stall_id = s.id),
          0
        ) as user_count
      FROM stalls s
      LEFT JOIN companies c ON s.company_id = c.id
      WHERE s.company_id = $1
      ORDER BY s.name
    `, [companyId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Get company stalls error:', err);
    res.status(500).json({ error: 'Failed to get stalls' });
  }
});

// ============================================
// GET ALL USERS (Super Admin Only)
// ============================================

app.get('/api/users/all', authenticateToken, async (req, res) => {
  // Allow super_super_admin, super_admin, and stall_admin
  if (req.user.role !== 'super_super_admin' && req.user.role !== 'super_admin' && req.user.role !== 'stall_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    let query, params;
    
    if (req.user.role === 'stall_admin') {
      // Get company_id(s) from stalls assigned to this user
      const companyRes = await pool.query(`
        SELECT DISTINCT s.company_id 
        FROM stalls s 
        JOIN user_stall_assignments usa ON s.id = usa.stall_id 
        WHERE usa.user_id = $1
      `, [req.user.id]);
      const companyIds = companyRes.rows.map(r => r.company_id);
      
      if (companyIds.length === 0) {
        return res.json([]);
      }
      
      query = `
        SELECT 
          u.id,
          u.username,
          u.full_name,
          u.role,
          u.company_id,
          u.is_active,
          COALESCE(
            (SELECT json_agg(json_build_object('id', s.id, 'name', s.name, 'code', s.code))
             FROM user_stall_assignments usa2
             JOIN stalls s ON usa2.stall_id = s.id
             WHERE usa2.user_id = u.id),
            '[]'
          ) as assigned_stalls,
          c.name as company_name
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        WHERE u.company_id = ANY($1::int[])
        AND u.role != 'super_super_admin'
        ORDER BY u.username
      `;
      params = [companyIds];
    } else {
      // super_admin or super_super_admin – get all
      const companyFilter = req.user.role === 'super_admin' ? ' AND u.company_id = $1' : '';
      const filterParam = req.user.role === 'super_admin' ? [req.user.company_id] : [];
      
      query = `
        SELECT 
          u.id,
          u.username,
          u.full_name,
          u.role,
          u.company_id,
          u.is_active,
          COALESCE(
            (SELECT json_agg(json_build_object('id', s.id, 'name', s.name, 'code', s.code))
             FROM user_stall_assignments usa2
             JOIN stalls s ON usa2.stall_id = s.id
             WHERE usa2.user_id = u.id),
            '[]'
          ) as assigned_stalls,
          c.name as company_name
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        WHERE u.role != 'super_super_admin' ${companyFilter}
        ORDER BY u.username
      `;
      params = filterParam;
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// ============================================
// GET ALL STALLS (Super Admin Only)
// ============================================

app.get('/api/stalls/all', authenticateToken, async (req, res) => {
  if (req.user.role !== 'super_super_admin' && req.user.role !== 'super_admin' && req.user.role !== 'stall_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    let query, params;
    
    if (req.user.role === 'stall_admin') {
      // Get company_id(s) from stalls assigned to this user
      const companyRes = await pool.query(`
        SELECT DISTINCT s.company_id 
        FROM stalls s 
        JOIN user_stall_assignments usa ON s.id = usa.stall_id 
        WHERE usa.user_id = $1
      `, [req.user.id]);
      const companyIds = companyRes.rows.map(r => r.company_id);
      
      if (companyIds.length === 0) {
        return res.json([]);
      }
      
      query = `
        SELECT 
          s.*,
          c.name as company_name,
          COALESCE(
            (SELECT COUNT(DISTINCT usa2.user_id) 
             FROM user_stall_assignments usa2 
             WHERE usa2.stall_id = s.id),
            0
          ) as user_count
        FROM stalls s
        LEFT JOIN companies c ON s.company_id = c.id
        WHERE s.company_id = ANY($1::int[])
        ORDER BY s.name
      `;
      params = [companyIds];
    } else {
      // super_admin or super_super_admin – get all
      const companyFilter = req.user.role === 'super_admin' ? ' WHERE s.company_id = $1' : '';
      const filterParam = req.user.role === 'super_admin' ? [req.user.company_id] : [];
      
      query = `
        SELECT 
          s.*,
          c.name as company_name,
          COALESCE(
            (SELECT COUNT(DISTINCT usa2.user_id) 
             FROM user_stall_assignments usa2 
             WHERE usa2.stall_id = s.id),
            0
          ) as user_count
        FROM stalls s
        LEFT JOIN companies c ON s.company_id = c.id
        ${companyFilter}
        ORDER BY c.name, s.name
      `;
      params = filterParam;
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get all stalls error:', err);
    res.status(500).json({ error: 'Failed to get stalls' });
  }
});

app.post('/api/companies/:companyId/stalls', authenticateToken, async (req, res) => {
  const companyId = parseInt(req.params.companyId);
  if (isNaN(companyId)) return res.status(400).json({ error: 'Invalid company ID' });

  // Permission check
  if (req.user.role === 'stall_admin') {
    const userCompany = await pool.query('SELECT company_id FROM users WHERE id = $1', [req.user.id]);
    if (userCompany.rows[0]?.company_id !== companyId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } else if (req.user.role !== 'super_super_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { name, code, location } = req.body;
  
  const result = await pool.query(
    'INSERT INTO stalls (company_id, name, code, location) VALUES ($1, $2, $3, $4) RETURNING id',
    [companyId, name, code, location]
  );
  const stallId = result.rows[0].id;

  // ✅ If user is stall_admin, auto-assign them
  if (req.user.role === 'stall_admin') {
    await pool.query(
      'INSERT INTO user_stall_assignments (user_id, stall_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, stallId]
    );
    console.log(`✅ Auto-assigned stall_admin ${req.user.username} to new stall ${stallId}`);
  }
  
  // ✅ NEW: If user is super_admin, assign to the first stall_admin in the company
  else if (req.user.role === 'super_admin' || req.user.role === 'super_super_admin') {
    // Find the first stall_admin in this company
    const stallAdminRes = await pool.query(`
      SELECT id FROM users 
      WHERE company_id = $1 AND role = 'stall_admin' 
      ORDER BY id LIMIT 1
    `, [companyId]);
    
    if (stallAdminRes.rows.length > 0) {
      const stallAdminId = stallAdminRes.rows[0].id;
      await pool.query(
        'INSERT INTO user_stall_assignments (user_id, stall_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [stallAdminId, stallId]
      );
      console.log(`✅ Auto-assigned stall_admin (ID: ${stallAdminId}) to new stall ${stallId}`);
    } else {
      console.log(`⚠️ No stall_admin found for company ${companyId}. Stall ${stallId} has no assignment.`);
    }
  }

  res.json({ success: true, stallId });
});

// ============================================
// UPDATE STALL
// ============================================

app.put('/api/stalls/:id', authenticateToken, async (req, res) => {
  const stallId = parseInt(req.params.id);
  if (isNaN(stallId)) {
    return res.status(400).json({ error: 'Invalid stall ID' });
  }

  const { name, code, location, is_active } = req.body;

  try {
    // Check if stall exists
    const stallCheck = await pool.query('SELECT * FROM stalls WHERE id = $1', [stallId]);
    if (stallCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Stall not found' });
    }

    // Check if user has permission
    if (req.user.role === 'stall_admin') {
      const access = await userCanAccessStall(req.user.id, stallId);
      if (!access) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    } else if (req.user.role !== 'super_super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (code !== undefined) {
      updates.push(`code = $${paramCount++}`);
      values.push(code);
    }
    if (location !== undefined) {
      updates.push(`location = $${paramCount++}`);
      values.push(location);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(stallId);
    const query = `
      UPDATE stalls 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    res.json({ success: true, stall: result.rows[0] });
  } catch (err) {
    console.error('Update stall error:', err);
    res.status(500).json({ error: 'Failed to update stall' });
  }
});

// ============================================
// GET COMPANY USERS
// ============================================

app.get('/api/companies/:companyId/users', authenticateToken, async (req, res) => {
  const companyId = parseInt(req.params.companyId);
  if (isNaN(companyId)) {
    return res.status(400).json({ error: 'Invalid company ID' });
  }

  // Super Super Admin and Super Admin can view any company's users
  // Stall Admin can only view their own company's users
  if (req.user.role === 'stall_admin') {
    // Check if user belongs to this company
    const userCheck = await pool.query('SELECT company_id FROM users WHERE id = $1', [req.user.id]);
    if (userCheck.rows[0]?.company_id !== companyId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } else if (req.user.role !== 'super_super_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.full_name,
        u.role,
        u.company_id,
        u.is_active,
        COALESCE(
          (SELECT json_agg(json_build_object('id', s.id, 'name', s.name, 'code', s.code))
           FROM user_stall_assignments usa
           JOIN stalls s ON usa.stall_id = s.id
           WHERE usa.user_id = u.id),
          '[]'
        ) as assigned_stalls,
        c.name as company_name
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.company_id = $1 AND u.role != 'super_super_admin'
      ORDER BY u.username
    `, [companyId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Get company users error:', err);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

app.post('/api/companies/:companyId/users', authenticateToken, async (req, res) => {
  const companyId = parseInt(req.params.companyId);
  if (isNaN(companyId)) return res.status(400).json({ error: 'Invalid company ID' });

  const { username, password, full_name, role, stall_ids } = req.body;

  // ✅ Allow stall_admin to create users for stalls they own
  if (req.user.role === 'stall_admin') {
    // Check if user belongs to this company
    const userCompany = await pool.query('SELECT company_id FROM users WHERE id = $1', [req.user.id]);
    if (userCompany.rows[0]?.company_id !== companyId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Stall Admin can only create cashiers
    if (role !== 'cashier') {
      return res.status(403).json({ error: 'Stall Admin can only create Cashiers' });
    }
    
    // Check if they're assigning to stalls they manage
    if (stall_ids && stall_ids.length > 0) {
      const userStalls = await pool.query('SELECT stall_id FROM user_stall_assignments WHERE user_id = $1', [req.user.id]);
      const allowedStallIds = userStalls.rows.map(r => r.stall_id);
      if (stall_ids.some(id => !allowedStallIds.includes(parseInt(id)))) {
        return res.status(403).json({ error: 'You can only assign stalls that you manage' });
      }
    }
  } else if (req.user.role === 'cashier') {
    return res.status(403).json({ error: 'Cashier cannot create users' });
  }
  // ✅ Super admin can create any user (existing behavior)
  else if (req.user.role !== 'super_admin' && req.user.role !== 'super_super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const hashed = bcrypt.hashSync(password, 10);
  const userRes = await pool.query(
    'INSERT INTO users (username, password, full_name, role, company_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [username, hashed, full_name, role, companyId]
  );
  const userId = userRes.rows[0].id;

  if (stall_ids && stall_ids.length > 0) {
    for (const sid of stall_ids) {
      await pool.query('INSERT INTO user_stall_assignments (user_id, stall_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, sid]);
    }
  }

  res.json({ success: true });
});

// ==================== COMPANY LOW STOCK ====================
app.get('/api/companies/:companyId/low-stock', authenticateToken, async (req, res) => {
  const companyId = parseInt(req.params.companyId);
  if (isNaN(companyId)) return res.status(400).json({ error: 'Invalid company ID' });
  if (!isCompanyAdmin(req)) return res.status(403).json({ error: 'Forbidden' });

  const result = await pool.query(`
    SELECT s.name as stall_name, i.material_name, i.current_level, i.alert_level
    FROM inventory i
    JOIN stalls s ON i.stall_id = s.id
    WHERE s.company_id = $1 AND i.current_level <= i.alert_level
  `, [companyId]);
  res.json(result.rows);
});

// ==================== GENERIC COMPANY ROUTES ====================
// ============================================
// GET ALL COMPANIES (WITH COUNTS)
// ============================================

app.get('/api/companies', authenticateToken, async (req, res) => {
  // Only super_super_admin and super_admin can view all companies
  if (req.user.role !== 'super_super_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        COALESCE(
          (SELECT COUNT(*) FROM users WHERE company_id = c.id AND role != 'super_super_admin'),
          0
        ) as user_count,
        COALESCE(
          (SELECT COUNT(*) FROM stalls WHERE company_id = c.id),
          0
        ) as stall_count,
        rr.contact_person,
        rr.email,
        rr.phone,
        rr.ic_number,
        rr.payment_receipt,
        rr.company_name as registration_company_name
      FROM companies c
      LEFT JOIN registration_requests rr ON rr.company_name = c.name AND rr.status = 'approved'
      ORDER BY c.name
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Get companies error:', err);
    res.status(500).json({ error: 'Failed to get companies' });
  }
});

app.post('/api/companies', authenticateToken, async (req, res) => {
  if (!isCompanyAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
  const { name, code, subscription_tier, max_stalls } = req.body;
  const result = await pool.query(
    'INSERT INTO companies (name, code, subscription_tier, max_stalls, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [name, code, subscription_tier || 'basic', max_stalls || 5, req.user.id]
  );
  res.json({ id: result.rows[0].id, success: true });
});

app.put('/api/companies/:id', authenticateToken, async (req, res) => {
  if (!isCompanyAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
  const { name, subscription_tier, max_stalls, is_active } = req.body;
  await pool.query(
    'UPDATE companies SET name = COALESCE($1, name), subscription_tier = COALESCE($2, subscription_tier), max_stalls = COALESCE($3, max_stalls), is_active = COALESCE($4, is_active) WHERE id = $5',
    [name, subscription_tier, max_stalls, is_active, req.params.id]
  );
  res.json({ success: true });
});

app.delete('/api/companies/:id', authenticateToken, async (req, res) => {
  if (!isCompanyAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
  await pool.query('UPDATE companies SET is_active = false WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// ==================== STALL TOGGLE ====================
app.put('/api/stalls/:stallId/toggle', authenticateToken, async (req, res) => {
  const stallId = parseInt(req.params.stallId);
  if (isNaN(stallId)) return res.status(400).json({ error: 'Invalid stall ID' });

  // Check if user has permission
  if (req.user.role === 'stall_admin') {
    const access = await userCanAccessStall(req.user.id, stallId);
    if (!access) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } else if (req.user.role !== 'super_super_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const stall = await pool.query('SELECT is_active FROM stalls WHERE id = $1', [stallId]);
  if (!stall.rows[0]) return res.status(404).json({ error: 'Stall not found' });
  await pool.query('UPDATE stalls SET is_active = $1 WHERE id = $2', [!stall.rows[0].is_active, stallId]);
  res.json({ success: true });
});

// ==================== STALL DELETE ====================
app.delete('/api/stalls/:id', authenticateToken, async (req, res) => {
  const stallId = parseInt(req.params.id);
  if (isNaN(stallId)) return res.status(400).json({ error: 'Invalid stall ID' });

  // Check if user has permission
  if (req.user.role === 'stall_admin') {
    const access = await userCanAccessStall(req.user.id, stallId);
    if (!access) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } else if (req.user.role !== 'super_super_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const stallCheck = await pool.query('SELECT id FROM stalls WHERE id = $1', [stallId]);
  if (stallCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Stall not found' });
  }

  await pool.query('DELETE FROM user_stall_assignments WHERE stall_id = $1', [stallId]);
  await pool.query('DELETE FROM inventory WHERE stall_id = $1', [stallId]);
  await pool.query('DELETE FROM sales WHERE stall_id = $1', [stallId]);
  await pool.query('DELETE FROM stalls WHERE id = $1', [stallId]);

  res.json({ success: true });
});

// ==================== USER DELETE ====================
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  if (!isCompanyAdmin(req) && req.user.role !== 'stall_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

  if (userId === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  res.json({ success: true });
});

// ==================== USER UPDATE ====================
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  if (!isCompanyAdmin(req) && req.user.role !== 'stall_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

  const { full_name, role, stall_ids } = req.body;

  await pool.query('UPDATE users SET full_name = $1, role = $2 WHERE id = $3', [full_name, role, userId]);

  await pool.query('DELETE FROM user_stall_assignments WHERE user_id = $1', [userId]);
  if (stall_ids && stall_ids.length > 0) {
    for (const sid of stall_ids) {
      await pool.query('INSERT INTO user_stall_assignments (user_id, stall_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, sid]);
    }
  }

  res.json({ success: true });
});

// ==================== SYSTEM HEALTH (SSA only) ====================
app.get('/api/system/health', authenticateToken, async (req, res) => {
  if (req.user.role !== 'super_super_admin') return res.status(403).json({ error: 'Forbidden' });
  const totalUsers = (await pool.query('SELECT COUNT(*) FROM users')).rows[0].count;
  const totalStalls = (await pool.query('SELECT COUNT(*) FROM stalls')).rows[0].count;
  const dbSize = (await pool.query("SELECT pg_database_size(current_database()) / 1024 / 1024 as size")).rows[0].size;
  res.json({ total_users: parseInt(totalUsers), total_stalls: parseInt(totalStalls), db_size_mb: parseInt(dbSize), uptime: 99.95 });
});

// ==================== GLOBAL ANNOUNCEMENTS (SSA only) ====================
app.get('/api/announcements', authenticateToken, async (req, res) => {
  if (req.user.role !== 'super_super_admin') return res.status(403).json({ error: 'Forbidden' });
  const result = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
  res.json(result.rows);
});

app.post('/api/announcements', authenticateToken, async (req, res) => {
  if (req.user.role !== 'super_super_admin') return res.status(403).json({ error: 'Forbidden' });
  const { title, content, target_roles, end_date } = req.body;
  await pool.query(
    'INSERT INTO announcements (title, content, target_roles, end_date, created_by) VALUES ($1, $2, $3, $4, $5)',
    [title, content, target_roles, end_date, req.user.id]
  );
  res.json({ success: true });
});

app.delete('/api/announcements/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'super_super_admin') return res.status(403).json({ error: 'Forbidden' });
  await pool.query('DELETE FROM announcements WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==================== MENU MANAGEMENT ====================

// Get all menu items (with recipes) – Allow any authenticated user
app.get('/api/menu', authenticateToken, async (req, res) => {
  try {
    // First check if image column exists (for backward compatibility)
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'menu_items' AND column_name = 'image'
    `);
    
    let query;
    if (columnCheck.rows.length > 0) {
      // Image column exists - use full query
      query = `
        SELECT m.item_name, m.price, m.description, m.category, m.image,
          COALESCE(
            (SELECT json_agg(json_build_object('material_name', r.material_name, 'quantity_used', r.quantity_used))
             FROM recipes r
             WHERE r.item_name = m.item_name),
            '[]'
          ) as recipe
        FROM menu_items m
        GROUP BY m.item_name, m.price, m.description, m.category, m.image
        ORDER BY m.item_name
      `;
    } else {
      // Image column doesn't exist - use query without image
      query = `
        SELECT m.item_name, m.price, m.description, m.category,
          COALESCE(
            (SELECT json_agg(json_build_object('material_name', r.material_name, 'quantity_used', r.quantity_used))
             FROM recipes r
             WHERE r.item_name = m.item_name),
            '[]'
          ) as recipe
        FROM menu_items m
        GROUP BY m.item_name, m.price, m.description, m.category
        ORDER BY m.item_name
      `;
    }
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/menu:', err);
    res.status(500).json({ error: 'Failed to fetch menu', details: err.message });
  }
});

// Create new menu item with recipe
app.post('/api/menu', authenticateToken, async (req, res) => {
  if (!isCompanyAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
  
  const { item_name, price, description, category, recipe, image } = req.body;
  
  if (!item_name || !price) {
    return res.status(400).json({ error: 'Item name and price are required' });
  }

  // Validate image size if provided
  if (image && image.length > 5 * 1024 * 1024) { // 5MB limit
    return res.status(413).json({ error: 'Image too large. Maximum size is 5MB.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(
      `INSERT INTO menu_items (item_name, price, description, category, image) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (item_name) DO UPDATE 
       SET price = EXCLUDED.price, description = EXCLUDED.description, 
           category = EXCLUDED.category, image = COALESCE(EXCLUDED.image, menu_items.image)`,
      [item_name, price, description || '', category || 'Main', image || null]
    );
    
    await client.query('DELETE FROM recipes WHERE item_name = $1', [item_name]);
    
    if (recipe && recipe.length > 0) {
      for (const ingredient of recipe) {
        if (ingredient.material_name && ingredient.quantity_used) {
          await client.query(
            'INSERT INTO recipes (item_name, material_name, quantity_used) VALUES ($1, $2, $3)',
            [item_name, ingredient.material_name, ingredient.quantity_used]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in POST /api/menu:', err);
    res.status(500).json({ error: 'Failed to create menu item', details: err.message });
  } finally {
    client.release();
  }
});

// Update menu item
app.put('/api/menu/:itemName', authenticateToken, async (req, res) => {
  if (!isCompanyAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
  
  const { itemName } = req.params;
  const { price, description, category, recipe, image } = req.body;
  
  // Validate image size if provided
  if (image && image.length > 5 * 1024 * 1024) { // 5MB limit
    return res.status(413).json({ error: 'Image too large. Maximum size is 5MB.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(
      `UPDATE menu_items 
       SET price = $1, description = $2, category = $3, image = COALESCE($4, image)
       WHERE item_name = $5`,
      [price, description || '', category || 'Main', image || null, itemName]
    );
    
    await client.query('DELETE FROM recipes WHERE item_name = $1', [itemName]);
    if (recipe && recipe.length > 0) {
      for (const ingredient of recipe) {
        if (ingredient.material_name && ingredient.quantity_used) {
          await client.query(
            'INSERT INTO recipes (item_name, material_name, quantity_used) VALUES ($1, $2, $3)',
            [itemName, ingredient.material_name, ingredient.quantity_used]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in PUT /api/menu:', err);
    res.status(500).json({ error: 'Failed to update menu item', details: err.message });
  } finally {
    client.release();
  }
});

// Delete menu item
app.delete('/api/menu/:itemName', authenticateToken, async (req, res) => {
  if (!isCompanyAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
  
  const { itemName } = req.params;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM recipes WHERE item_name = $1', [itemName]);
    await client.query('DELETE FROM menu_items WHERE item_name = $1', [itemName]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in DELETE /api/menu:', err);
    res.status(500).json({ error: 'Failed to delete menu item', details: err.message });
  } finally {
    client.release();
  }
});

// ==================== MENU ASSIGNMENT ROUTES ====================

/**
 * GET /api/menu/assignments/:stallId
 * Get all menu items assigned to a specific stall
 */
app.get('/api/menu/assignments/:stallId', authenticateToken, async (req, res) => {
  const stallId = parseInt(req.params.stallId);
  
  if (isNaN(stallId)) {
    return res.status(400).json({ error: 'Invalid stall ID' });
  }

  // Check if user has access to this stall
  const allowed = await userCanAccessStall(req.user.id, stallId);
  if (!allowed) {
    return res.status(403).json({ error: 'Access denied to this stall' });
  }

  try {
    // Get all assigned menu items for this stall
    const result = await pool.query(
      `SELECT item_name FROM stall_menu_assignments 
       WHERE stall_id = $1 AND is_active = true
       ORDER BY item_name`,
      [stallId]
    );
    
    res.json(result.rows.map(row => row.item_name));
  } catch (err) {
    console.error('Error fetching menu assignments:', err);
    res.status(500).json({ error: 'Failed to fetch menu assignments' });
  }
});

/**
 * POST /api/menu/assignments
 * Save menu assignments for a stall
 * Body: { stallId: number, items: string[] }
 */
app.post('/api/menu/assignments', authenticateToken, async (req, res) => {
  const { stallId, items } = req.body;
  
  if (!stallId) {
    return res.status(400).json({ error: 'Stall ID is required' });
  }

  const targetStallId = parseInt(stallId);
  if (isNaN(targetStallId)) {
    return res.status(400).json({ error: 'Invalid stall ID' });
  }

  // Check if user has access to this stall
  const allowed = await userCanAccessStall(req.user.id, targetStallId);
  if (!allowed) {
    return res.status(403).json({ error: 'Access denied to this stall' });
  }

  // Validate items array
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Items must be an array' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // First, deactivate all current assignments for this stall
    await client.query(
      `UPDATE stall_menu_assignments 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP 
       WHERE stall_id = $1`,
      [targetStallId]
    );

    // If there are items to assign, activate them
    if (items.length > 0) {
      for (const itemName of items) {
        // Verify the item exists in menu_items
        const itemCheck = await client.query(
          'SELECT item_name FROM menu_items WHERE item_name = $1',
          [itemName]
        );
        
        if (itemCheck.rows.length > 0) {
          await client.query(
            `INSERT INTO stall_menu_assignments (stall_id, item_name, is_active) 
             VALUES ($1, $2, true) 
             ON CONFLICT (stall_id, item_name) 
             DO UPDATE SET is_active = true, updated_at = CURRENT_TIMESTAMP`,
            [targetStallId, itemName]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.json({ 
      success: true, 
      message: `Menu assignments saved successfully!`,
      assignedCount: items.length 
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error saving menu assignments:', err);
    res.status(500).json({ 
      error: 'Failed to save menu assignments', 
      details: err.message 
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/menu/assignments/all
 * Get all menu assignments for all stalls (Super Admin only)
 */
app.get('/api/menu/assignments/all', authenticateToken, async (req, res) => {
  // Only super_admin and super_super_admin can view all
  if (req.user.role !== 'super_admin' && req.user.role !== 'super_super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    let query = `
      SELECT s.id as stall_id, s.name as stall_name, 
             COALESCE(
               (SELECT json_agg(item_name) 
                FROM stall_menu_assignments sma 
                WHERE sma.stall_id = s.id AND sma.is_active = true),
               '[]'
             ) as assigned_items
      FROM stalls s
    `;

    // If super_admin, only show their company's stalls
    if (req.user.role === 'super_admin') {
      query += ` WHERE s.company_id = $1`;
      const result = await pool.query(query, [req.user.company_id]);
      return res.json(result.rows);
    }

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching all menu assignments:', err);
    res.status(500).json({ error: 'Failed to fetch menu assignments' });
  }
});

/**
 * DELETE /api/menu/assignments/:stallId/:itemName
 * Remove a specific menu item assignment from a stall
 */
app.delete('/api/menu/assignments/:stallId/:itemName', authenticateToken, async (req, res) => {
  const stallId = parseInt(req.params.stallId);
  const { itemName } = req.params;

  if (isNaN(stallId)) {
    return res.status(400).json({ error: 'Invalid stall ID' });
  }

  // Check if user has access to this stall
  const allowed = await userCanAccessStall(req.user.id, stallId);
  if (!allowed) {
    return res.status(403).json({ error: 'Access denied to this stall' });
  }

  try {
    await pool.query(
      `UPDATE stall_menu_assignments 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP 
       WHERE stall_id = $1 AND item_name = $2`,
      [stallId, itemName]
    );

    res.json({ success: true, message: 'Menu item unassigned from stall' });
  } catch (err) {
    console.error('Error removing menu assignment:', err);
    res.status(500).json({ error: 'Failed to remove menu assignment' });
  }
});

/**
 * POST /api/menu/assignments/bulk
 * Bulk assign menu items to multiple stalls (Super Admin only)
 */
app.post('/api/menu/assignments/bulk', authenticateToken, async (req, res) => {
  // Only super_admin and super_super_admin can do bulk operations
  if (req.user.role !== 'super_admin' && req.user.role !== 'super_super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { assignments } = req.body; // [{ stallId: 1, items: ['item1', 'item2'] }]

  if (!Array.isArray(assignments) || assignments.length === 0) {
    return res.status(400).json({ error: 'Assignments array is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const assignment of assignments) {
      const { stallId, items } = assignment;
      
      if (!stallId || !Array.isArray(items)) {
        continue;
      }

      // Deactivate all current assignments for this stall
      await client.query(
        `UPDATE stall_menu_assignments 
         SET is_active = false, updated_at = CURRENT_TIMESTAMP 
         WHERE stall_id = $1`,
        [stallId]
      );

      // Activate new assignments
      for (const itemName of items) {
        // Check if item exists
        const itemCheck = await client.query(
          'SELECT item_name FROM menu_items WHERE item_name = $1',
          [itemName]
        );
        
        if (itemCheck.rows.length > 0) {
          await client.query(
            `INSERT INTO stall_menu_assignments (stall_id, item_name, is_active) 
             VALUES ($1, $2, true) 
             ON CONFLICT (stall_id, item_name) 
             DO UPDATE SET is_active = true, updated_at = CURRENT_TIMESTAMP`,
            [stallId, itemName]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Bulk menu assignments saved successfully!' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error saving bulk menu assignments:', err);
    res.status(500).json({ error: 'Failed to save bulk menu assignments' });
  } finally {
    client.release();
  }
});

// ==================== ORDERS ROUTES ====================

/**
 * POST /api/orders
 * Create a new order with multiple items
 */
app.post('/api/orders', authenticateToken, async (req, res) => {
  const { stallId, items, total, itemCount } = req.body;
  
  // Validate required fields
  if (!stallId) {
    return res.status(400).json({ error: 'Stall ID is required' });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'At least one item is required' });
  }
  if (total === undefined || total <= 0) {
    return res.status(400).json({ error: 'Valid total amount is required' });
  }

  const targetStallId = parseInt(stallId);
  if (isNaN(targetStallId)) {
    return res.status(400).json({ error: 'Invalid stall ID' });
  }

  // Check if user has access to this stall
  const allowed = await userCanAccessStall(req.user.id, targetStallId);
  if (!allowed) {
    return res.status(403).json({ error: 'Access denied to this stall' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create the order
    const orderResult = await client.query(
      `INSERT INTO orders (stall_id, order_number, total_amount, item_count, status)
       VALUES ($1, $2, $3, $4, 'completed')
       RETURNING id, order_number, total_amount, item_count`,
      [targetStallId, orderNumber, total, itemCount || items.length]
    );
    
    const order = orderResult.rows[0];

    // Record individual sales linked to this order
    for (const item of items) {
      const quantity = item.quantity || 1;
      for (let i = 0; i < quantity; i++) {
        await client.query(
          `INSERT INTO sales (stall_id, item_name, price, order_id)
           VALUES ($1, $2, $3, $4)`,
          [targetStallId, item.itemName, item.price, order.id]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      total: parseFloat(order.total_amount),
      itemCount: parseInt(order.item_count),
      message: 'Order created successfully'
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order creation error:', err);
    res.status(500).json({ 
      error: 'Failed to create order', 
      details: err.message 
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/orders/stall/:stallId
 * Get all orders for a specific stall
 */
app.get('/api/orders/stall/:stallId', authenticateToken, async (req, res) => {
  const stallId = parseInt(req.params.stallId);
  if (isNaN(stallId)) {
    return res.status(400).json({ error: 'Invalid stall ID' });
  }

  // Check if user has access to this stall
  const allowed = await userCanAccessStall(req.user.id, stallId);
  if (!allowed) {
    return res.status(403).json({ error: 'Access denied to this stall' });
  }

  try {
    const result = await pool.query(
      `SELECT 
        o.*,
        COALESCE(
          (SELECT json_agg(json_build_object('item_name', s.item_name, 'price', s.price))
           FROM sales s
           WHERE s.order_id = o.id),
          '[]'
        ) as items
       FROM orders o
       WHERE o.stall_id = $1
       ORDER BY o.created_at DESC
       LIMIT 100`,
      [stallId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * GET /api/orders/:orderId
 * Get a specific order by ID
 */
app.get('/api/orders/:orderId', authenticateToken, async (req, res) => {
  const orderId = parseInt(req.params.orderId);
  if (isNaN(orderId)) {
    return res.status(400).json({ error: 'Invalid order ID' });
  }

  try {
    const result = await pool.query(
      `SELECT 
        o.*,
        s.name as stall_name,
        COALESCE(
          (SELECT json_agg(json_build_object('item_name', s2.item_name, 'price', s2.price, 'created_at', s2.created_at))
           FROM sales s2
           WHERE s2.order_id = o.id),
          '[]'
        ) as items
       FROM orders o
       LEFT JOIN stalls s ON o.stall_id = s.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user has access to this stall
    const order = result.rows[0];
    const allowed = await userCanAccessStall(req.user.id, order.stall_id);
    if (!allowed && req.user.role !== 'super_admin' && req.user.role !== 'super_super_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(order);
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

/**
 * GET /api/orders/today/:stallId
 * Get today's orders for a stall (including grouped total)
 */
app.get('/api/orders/today/:stallId', authenticateToken, async (req, res) => {
  const stallId = parseInt(req.params.stallId);
  if (isNaN(stallId)) {
    return res.status(400).json({ error: 'Invalid stall ID' });
  }

  const allowed = await userCanAccessStall(req.user.id, stallId);
  if (!allowed) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as order_count,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(item_count), 0) as total_items
       FROM orders
       WHERE stall_id = $1 AND DATE(created_at) = CURRENT_DATE
       AND status = 'completed'`,
      [stallId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Today orders error:', err);
    res.status(500).json({ error: 'Failed to fetch today orders' });
  }
});

// ==================== MATERIALS ====================
// Get all available materials – Allow any authenticated user
app.get('/api/materials', authenticateToken, async (req, res) => {
  try {
    // Only return Chicken as the only material
    res.json(['Chicken']);
  } catch (err) {
    console.error('Error in /api/materials:', err);
    res.json(['Chicken']);
  }
});

// ==================== MENU PERFORMANCE ====================
app.get('/api/menu-performance', authenticateToken, async (req, res) => {
  try {
    const { days, stallId, itemName, startDate: reqStartDate, endDate: reqEndDate } = req.query;
    
    // ✅ NEW: Handle exact date range
    let startDate, endDate;
    let useDateRange = false;
    
    if (reqStartDate && reqEndDate) {
      startDate = new Date(reqStartDate);
      endDate = new Date(reqEndDate);
      useDateRange = true;
    } else {
      let dayRange = days ? parseInt(days) : 7;
      startDate = new Date();
      startDate.setDate(startDate.getDate() - dayRange);
      
      // For week view, calculate Monday-Sunday
      if (dayRange === 7) {
        const now = new Date();
        const currentDay = now.getUTCDay();
        const daysToMonday = (currentDay === 0) ? 6 : (currentDay - 1);
        
        const monday = new Date(now);
        monday.setUTCDate(now.getUTCDate() - daysToMonday);
        monday.setUTCHours(0, 0, 0, 0);
        
        const sunday = new Date(monday);
        sunday.setUTCDate(monday.getUTCDate() + 6);
        sunday.setUTCHours(23, 59, 59, 999);
        
        startDate = monday;
        endDate = sunday;
        useDateRange = true;
      }
    }

    // ============================================================
    // Build query with date filtering
    // ============================================================
    let query = `
      SELECT item_name, COUNT(*) as quantity, COALESCE(SUM(price), 0) as revenue
      FROM sales
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    // Add date filtering
    if (useDateRange && startDate && endDate) {
      query += ` AND created_at >= $${paramCount} AND created_at <= $${paramCount + 1}`;
      params.push(startDate.toISOString(), endDate.toISOString());
      paramCount += 2;
    } else if (startDate) {
      query += ` AND created_at >= $${paramCount}`;
      params.push(startDate.toISOString());
      paramCount += 1;
    }
    
    // Add stall filter
    if (stallId) {
      query += ` AND stall_id = $${paramCount}`;
      params.push(parseInt(stallId));
      paramCount++;
    } else if (req.user.role === 'stall_admin' || req.user.role === 'cashier') {
      const stallIds = req.user.assigned_stalls?.map(s => s.id) || [];
      if (stallIds.length > 0) {
        query += ` AND stall_id = ANY($${paramCount}::int[])`;
        params.push(stallIds);
        paramCount++;
      } else {
        return res.json([]);
      }
    } else if (req.user.role === 'super_admin') {
      const stallIdsRes = await pool.query('SELECT id FROM stalls WHERE company_id = $1', [req.user.company_id]);
      const stallIds = stallIdsRes.rows.map(r => r.id);
      if (stallIds.length > 0) {
        query += ` AND stall_id = ANY($${paramCount}::int[])`;
        params.push(stallIds);
        paramCount++;
      } else {
        return res.json([]);
      }
    } else if (req.user.role === 'super_super_admin') {
      const stallIdsRes = await pool.query('SELECT id FROM stalls');
      const stallIds = stallIdsRes.rows.map(r => r.id);
      if (stallIds.length > 0) {
        query += ` AND stall_id = ANY($${paramCount}::int[])`;
        params.push(stallIds);
        paramCount++;
      } else {
        return res.json([]);
      }
    }
    
    // Add item name filter (for breakdown)
    if (itemName) {
      query += ` AND item_name = $${paramCount}`;
      params.push(itemName);
      paramCount++;
    }
    
    query += ` GROUP BY item_name ORDER BY quantity DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
    
  } catch (err) {
    console.error('Menu performance error:', err);
    res.status(500).json({ error: 'Failed to fetch menu performance', details: err.message });
  }
});

// ==================== STALL PERFORMANCE ====================
app.get('/api/stall-performance', authenticateToken, async (req, res) => {
  try {
    const { days, stallId, stallIds, startDate: reqStartDate, endDate: reqEndDate } = req.query;
    
    // ✅ NEW: Handle exact date range
    let startDate, endDate;
    let useDateRange = false;
    
    if (reqStartDate && reqEndDate) {
      startDate = new Date(reqStartDate);
      endDate = new Date(reqEndDate);
      useDateRange = true;
    } else {
      let dayRange = days ? parseInt(days) : 1;
      startDate = new Date();
      startDate.setDate(startDate.getDate() - dayRange);
      
      // For week view, calculate Monday-Sunday
      if (dayRange === 7) {
        const now = new Date();
        const currentDay = now.getUTCDay();
        const daysToMonday = (currentDay === 0) ? 6 : (currentDay - 1);
        
        const monday = new Date(now);
        monday.setUTCDate(now.getUTCDate() - daysToMonday);
        monday.setUTCHours(0, 0, 0, 0);
        
        const sunday = new Date(monday);
        sunday.setUTCDate(monday.getUTCDate() + 6);
        sunday.setUTCHours(23, 59, 59, 999);
        
        startDate = monday;
        endDate = sunday;
        useDateRange = true;
      }
    }

    // ============================================================
    // Build query with date filtering
    // ============================================================
    let query = `
      SELECT 
        s.id,
        s.name,
        s.is_active,
        COALESCE(SUM(sales.price), 0) as revenue,
        COUNT(sales.id) as items_sold,
        COALESCE(AVG(sales.price), 0) as avg_transaction
      FROM stalls s
      LEFT JOIN sales ON sales.stall_id = s.id
    `;
    
    const params = [];
    let paramCount = 1;
    let conditions = [];
    
    // Add date filtering
    if (useDateRange && startDate && endDate) {
      conditions.push(`(sales.created_at >= $${paramCount} AND sales.created_at <= $${paramCount + 1})`);
      params.push(startDate.toISOString(), endDate.toISOString());
      paramCount += 2;
    } else if (startDate) {
      conditions.push(`sales.created_at >= $${paramCount}`);
      params.push(startDate.toISOString());
      paramCount += 1;
    }
    
    // Add stall filters
    if (stallIds) {
      const ids = stallIds.split(',').map(Number).filter(id => !isNaN(id));
      if (ids.length > 0) {
        conditions.push(`s.id = ANY($${paramCount}::int[])`);
        params.push(ids);
        paramCount++;
      }
    } else if (stallId) {
      conditions.push(`s.id = $${paramCount}`);
      params.push(parseInt(stallId));
      paramCount++;
    } else if (req.user.role === 'stall_admin' || req.user.role === 'cashier') {
      const userStallIds = req.user.assigned_stalls?.map(s => s.id) || [];
      if (userStallIds.length > 0) {
        conditions.push(`s.id = ANY($${paramCount}::int[])`);
        params.push(userStallIds);
        paramCount++;
      } else {
        return res.json([]);
      }
    } else if (req.user.role === 'super_admin') {
      const stallIdsRes = await pool.query('SELECT id FROM stalls WHERE company_id = $1', [req.user.company_id]);
      const userStallIds = stallIdsRes.rows.map(r => r.id);
      if (userStallIds.length > 0) {
        conditions.push(`s.id = ANY($${paramCount}::int[])`);
        params.push(userStallIds);
        paramCount++;
      } else {
        return res.json([]);
      }
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` GROUP BY s.id, s.name, s.is_active ORDER BY revenue DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
    
  } catch (err) {
    console.error('Stall performance error:', err);
    res.status(500).json({ error: 'Failed to fetch stall performance', details: err.message });
  }
});

// ==================== GRACEFUL SHUTDOWN ====================

const gracefulShutdown = async () => {
  console.log('🛑 Shutting down gracefully...');
  try {
    await pool.end();
    console.log('✅ Database connections closed');
  } catch (err) {
    console.error('❌ Error closing database connections:', err.message);
  }
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown();
});

// ==================== START SERVER ====================
if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Upload directory: ${uploadDir}`);
  });
}

// =============================================
// SYSTEM BANNER ROUTES
// =============================================

// Get system banner (public - no auth required)
app.get('/api/system/banner', async (req, res) => {
  try {
    // Check if system_settings table exists, if not create it
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'system_settings'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      // Create table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS system_settings (
          id INTEGER PRIMARY KEY DEFAULT 1,
          banner_url TEXT,
          updated_by INTEGER,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      // Insert default record
      await pool.query(`INSERT INTO system_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`);
    }
    
    const result = await pool.query(
      `SELECT banner_url FROM system_settings WHERE id = 1`
    );
    res.json({ 
      bannerUrl: result.rows[0]?.banner_url || null 
    });
  } catch (err) {
    console.error('Get banner error:', err);
    res.json({ bannerUrl: null });
  }
});

// Upload system banner (Super Super Admin only)
app.post('/api/system/banner', authenticateToken, upload.single('banner'), async (req, res) => {
  if (req.user.role !== 'super_super_admin') {
    return res.status(403).json({ error: 'Only System Administrators can upload banners' });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
    const cleanBaseUrl = baseUrl.replace(/^http:\/\//, 'https://');

    // ✅ Correct URL
    const bannerUrl = `${cleanBaseUrl}/uploads/${req.file.filename}`;

    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        banner_url TEXT,
        updated_by INTEGER,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      INSERT INTO system_settings (id, banner_url, updated_by, updated_at)
      VALUES (1, $1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        banner_url = EXCLUDED.banner_url,
        updated_by = EXCLUDED.updated_by,
        updated_at = CURRENT_TIMESTAMP
    `, [bannerUrl, req.user.id]);

    res.json({ success: true, bannerUrl });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Remove system banner (Super Super Admin only)
app.delete('/api/system/banner', authenticateToken, async (req, res) => {
  // Check if user is Super Super Admin
  if (req.user.role !== 'super_super_admin') {
    return res.status(403).json({ error: 'Only System Administrators can remove banners' });
  }
  
  try {
    await pool.query(`
      UPDATE system_settings SET banner_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = 1
    `);
    res.json({ success: true });
  } catch (err) {
    console.error('Remove banner error:', err);
    res.status(500).json({ error: 'Failed to remove banner' });
  }
});

// =============================================
// REGISTRATION ROUTES
// =============================================

// server.js - Registration request route
app.post('/api/register/request', async (req, res) => {
  const { company_name, contact_person, email, phone, ic_number, payment_receipt } = req.body;
  
  // ✅ Validate required fields
  if (!company_name || !contact_person || !email || !phone || !ic_number) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  // ✅ Validate IC number format
  const icRegex = /^\d{6}-\d{2}-\d{4}$/;
  if (!icRegex.test(ic_number)) {
    return res.status(400).json({ error: 'Invalid IC number format. Use: XXXXXX-XX-XXXX' });
  }
  
  // ✅ Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  try {
    // ✅ Check if IC number already registered
    const icCheck = await pool.query(
      'SELECT id, status FROM registration_requests WHERE ic_number = $1',
      [ic_number]
    );
    if (icCheck.rows.length > 0) {
      const status = icCheck.rows[0].status;
      if (status === 'pending') {
        return res.status(400).json({ error: 'This IC number is already pending approval.' });
      } else if (status === 'approved') {
        return res.status(400).json({ error: 'This IC number is already registered. Please login.' });
      }
      // If rejected, allow resubmission
    }
    
    // ✅ Check if email already registered
    const emailCheck = await pool.query(
      'SELECT id, status FROM registration_requests WHERE email = $1',
      [email]
    );
    if (emailCheck.rows.length > 0) {
      const status = emailCheck.rows[0].status;
      if (status === 'pending') {
        return res.status(400).json({ error: 'This email is already pending approval.' });
      } else if (status === 'approved') {
        return res.status(400).json({ error: 'This email is already registered. Please login.' });
      }
    }
    
    // ✅ Check if company name already exists (case-insensitive)
    const companyCheck = await pool.query(
      'SELECT id FROM companies WHERE LOWER(name) = LOWER($1)',
      [company_name]
    );
    if (companyCheck.rows.length > 0) {
      return res.status(400).json({ error: 'This company already exists. Please contact support.' });
    }
    
    // ✅ Insert registration request
    const result = await pool.query(
      `INSERT INTO registration_requests 
       (company_name, contact_person, email, phone, ic_number, payment_receipt)
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, company_name, contact_person, email`,
      [company_name, contact_person, email, phone, ic_number, payment_receipt || null]
    );
    
    const request = result.rows[0];
    
    // Send email
    await sendRegistrationReceived(
      request.email,
      request.company_name,
      request.contact_person
    );
    
    res.json({ 
      success: true, 
      id: request.id,
      message: 'Registration submitted successfully! Please wait for approval.' 
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to submit registration' });
  }
});

// Get pending registrations (Super Admin only)
app.get('/api/register/pending', authenticateToken, async (req, res) => {
  // Only super_super_admin and super_admin can access
  if (req.user.role !== 'super_super_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  try {
    const result = await pool.query(
      `SELECT * FROM registration_requests WHERE status = 'pending' ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get pending registrations error:', err);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// server.js - Approval route (SAFE VERSION)
app.post('/api/register/approve/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'super_super_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const { id } = req.params;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get the registration request
    const requestRes = await client.query(
      'SELECT * FROM registration_requests WHERE id = $1 AND status = $2',
      [id, 'pending']
    );
    
    if (requestRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Registration request not found or already processed' });
    }
    
    const request = requestRes.rows[0];
    
    // ✅ Check if company already exists (by name, case-insensitive)
    let companyRes = await client.query(
      'SELECT id FROM companies WHERE LOWER(name) = LOWER($1)',
      [request.company_name]
    );
    
    let companyId;
    if (companyRes.rows.length > 0) {
      // Company already exists - reuse it
      companyId = companyRes.rows[0].id;
      console.log(`✅ Company "${request.company_name}" already exists, using ID: ${companyId}`);
    } else {
      // ✅ Create new company - let PostgreSQL auto-generate the ID
      // This is the ONLY change - removing the hardcoded ID
      const newCompany = await client.query(
        `INSERT INTO companies (name, created_by) VALUES ($1, $2) RETURNING id`,
        [request.company_name, req.user.id]
      );
      companyId = newCompany.rows[0].id;
      console.log(`✅ Created new company: ${request.company_name} (ID: ${companyId})`);
    }
    
    // ✅ The rest of the code stays exactly the same
    // Check if user already exists for this email
    let userRes = await client.query(
      'SELECT id, username FROM users WHERE email = $1',
      [request.email]
    );
    
    let userId;
    let username;
    let tempPassword;
    
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
      username = userRes.rows[0].username;
      
      await client.query(
        `UPDATE users 
         SET company_id = $1, is_active = true, is_first_login = true, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [companyId, userId]
      );
      
      tempPassword = Math.random().toString(36).slice(-8) + '!';
      const hashedPassword = bcrypt.hashSync(tempPassword, 10);
      await client.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, userId]
      );
      
      console.log(`✅ Updated existing user: ${username} (ID: ${userId})`);
    } else {
      // Find a unique username
      let usernameExists = true;
      let counter = companyId;
      while (usernameExists) {
        username = `admin_${counter}`;
        const checkUser = await client.query(
          'SELECT id FROM users WHERE username = $1',
          [username]
        );
        if (checkUser.rows.length === 0) {
          usernameExists = false;
        } else {
          counter++;
        }
      }
      
      tempPassword = Math.random().toString(36).slice(-8) + '!';
      const hashedPassword = bcrypt.hashSync(tempPassword, 10);
      
      const newUser = await client.query(
        `INSERT INTO users 
         (username, password, full_name, role, company_id, is_first_login, is_active, email) 
         VALUES ($1, $2, $3, $4, $5, true, true, $6) 
         RETURNING id`,
        [username, hashedPassword, request.contact_person, 'stall_admin', companyId, request.email]
      );
      userId = newUser.rows[0].id;
      console.log(`✅ Created new user: ${username} (ID: ${userId})`);
    }
    
    // Update registration request status
    await client.query(
      `UPDATE registration_requests SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );
    
    await client.query('COMMIT');
    
    // Send welcome email
    await sendRegistrationApproved(
      request.email,
      request.company_name,
      request.contact_person,
      username,
      tempPassword,
      process.env.LOGIN_URL || 'https://chickoryhub.com/#/login'
    );
    
    res.json({ 
      success: true, 
      companyId,
      userId,
      username,
      tempPassword,
      message: 'Registration approved! Welcome email sent.'
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Approval error:', err);
    
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to approve registration', details: err.message });
    }
  } finally {
    client.release();
  }
});

// ============================================
// REJECT REGISTRATION (WITH HISTORY)
// ============================================

app.post('/api/register/reject/:id', authenticateToken, async (req, res) => {
  // Only super_super_admin and super_admin can reject
  if (req.user.role !== 'super_super_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const { id } = req.params;
  const { rejection_reason } = req.body;
  
  // Validate rejection reason
  if (!rejection_reason || rejection_reason.trim() === '') {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }
  
  try {
    // Get current rejection count and history
    const currentRes = await pool.query(
      'SELECT rejection_count, rejection_history FROM registration_requests WHERE id = $1 AND status = $2',
      [id, 'pending']
    );
    
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Registration request not found or already processed' });
    }
    
    const current = currentRes.rows[0];
    const newCount = (current.rejection_count || 0) + 1;
    
    // Build new rejection history entry
    const rejectionEntry = {
      attempt: newCount,
      reason: rejection_reason.trim(),
      rejected_by: req.user.username,
      rejected_by_id: req.user.id,
      rejected_at: new Date().toISOString()
    };
    
    // Update history
    let history = current.rejection_history || [];
    if (typeof history === 'string') {
      history = JSON.parse(history);
    }
    history.push(rejectionEntry);
    
    // Update the registration request
    const result = await pool.query(
      `UPDATE registration_requests 
       SET status = 'rejected', 
           rejection_reason = $1,
           rejection_count = $2,
           rejection_history = $3,
           last_rejection_date = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND status = 'pending'
       RETURNING email, company_name, contact_person, rejection_reason, rejection_count`,
      [rejection_reason.trim(), newCount, JSON.stringify(history), id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registration request not found or already processed' });
    }
    
    const { email, company_name, contact_person, rejection_reason: savedReason, rejection_count } = result.rows[0];
    
    // Send rejection email
    await sendRegistrationRejected(
      email,
      company_name,
      contact_person || 'Customer',
      savedReason || 'No reason provided',
      rejection_count
    );
    
    res.json({ 
      success: true, 
      message: 'Registration rejected',
      rejection_count: rejection_count,
      can_resubmit: rejection_count < 3
    });
  } catch (err) {
    console.error('Rejection error:', err);
    res.status(500).json({ error: 'Failed to reject registration' });
  }
});

// ============================================
// RESUBMIT REGISTRATION - WITH FILE UPLOAD
// ============================================

app.post('/api/register/resubmit/:id', upload.single('payment_receipt'), async (req, res) => {
  const { id } = req.params;
  
  // Get fields from body
  const { company_name, contact_person, email, phone, ic_number } = req.body;
  
  try {
    // Get current registration request
    let currentRes;
    if (!isNaN(parseInt(id))) {
      currentRes = await pool.query(
        'SELECT * FROM registration_requests WHERE id = $1 AND status = $2',
        [parseInt(id), 'rejected']
      );
    } else {
      currentRes = await pool.query(
        'SELECT * FROM registration_requests WHERE email = $1 AND status = $2',
        [id, 'rejected']
      );
    }
    
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Registration request not found or not rejected' });
    }
    
    const current = currentRes.rows[0];
    const requestId = current.id;
    
    // Check if max resubmit attempts reached
    if (current.rejection_count >= 3) {
      return res.status(400).json({ 
        error: 'Maximum resubmit attempts reached. Please contact support.' 
      });
    }
    
    // Validate required fields
    if (!company_name || !contact_person || !email || !phone || !ic_number) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Validate IC number format
    const icRegex = /^\d{6}-\d{2}-\d{4}$/;
    if (!icRegex.test(ic_number)) {
      return res.status(400).json({ error: 'Invalid IC number format. Use: XXXXXX-XX-XXXX' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // ✅ Handle payment_receipt - check if file was uploaded
    let finalReceipt = current.payment_receipt;
    
    if (req.file) {
      // New file uploaded - save the path
      const baseUrl = process.env.BASE_URL || 'https://api.chickoryhub.com';
      finalReceipt = `${baseUrl}/uploads/${req.file.filename}`;
      console.log('📎 New receipt uploaded:', req.file.filename);
    } else if (req.body.payment_receipt) {
      // String receipt provided (existing receipt)
      finalReceipt = req.body.payment_receipt;
      console.log('📎 Using existing receipt (string)');
    }
    
    // ✅ Ensure we have a receipt
    if (!finalReceipt) {
      return res.status(400).json({ error: 'Payment receipt is required' });
    }
    
    // ✅ Update the registration request
    await pool.query(
      `UPDATE registration_requests 
       SET company_name = $1,
           contact_person = $2,
           email = $3,
           phone = $4,
           ic_number = $5,
           payment_receipt = $6,
           status = 'pending',
           rejection_reason = NULL,
           resubmitted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [company_name, contact_person, email, phone, ic_number, finalReceipt, requestId]
    );
    
    // Send confirmation email
    await sendRegistrationReceived(email, company_name, contact_person);
    
    res.json({ 
      success: true, 
      message: 'Registration resubmitted successfully! Please wait for approval.' 
    });
  } catch (err) {
    console.error('Resubmit error:', err);
    res.status(500).json({ error: 'Failed to resubmit registration. Please try again.' });
  }
});

// ============================================
// GET REJECTION HISTORY (PUBLIC - for email links)
// ============================================

app.get('/api/register/rejection-history/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    let result;
    if (!isNaN(parseInt(id))) {
      result = await pool.query(
        'SELECT id, rejection_count, rejection_history, last_rejection_date, company_name, contact_person, email, phone, ic_number, payment_receipt FROM registration_requests WHERE id = $1',
        [parseInt(id)]
      );
    } else {
      result = await pool.query(
        'SELECT id, rejection_count, rejection_history, last_rejection_date, company_name, contact_person, email, phone, ic_number, payment_receipt FROM registration_requests WHERE email = $1',
        [id]
      );
    }
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registration request not found' });
    }
    
    const data = result.rows[0];
    let history = data.rejection_history || [];
    if (typeof history === 'string') {
      history = JSON.parse(history);
    }
    
    res.json({
      rejection_count: data.rejection_count || 0,
      rejection_history: history,
      last_rejection_date: data.last_rejection_date,
      max_attempts: 3,
      attempts_remaining: 3 - (data.rejection_count || 0),
      original_data: {
        company_name: data.company_name || '',
        contact_person: data.contact_person || '',
        email: data.email || '',
        phone: data.phone || '',
        ic_number: data.ic_number || '',
        payment_receipt: data.payment_receipt || null
      }
    });
  } catch (err) {
    console.error('Get rejection history error:', err);
    res.status(500).json({ error: 'Failed to get rejection history' });
  }
});

// ============================================
// AUTO-DELETE REJECTED REGISTRATIONS (30 days)
// ============================================

app.delete('/api/register/cleanup', authenticateToken, async (req, res) => {
  // Only super_super_admin can trigger cleanup
  if (req.user.role !== 'super_super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // First, get the items to be deleted (for logging)
    const itemsToDelete = await pool.query(
      'SELECT id, company_name, email, updated_at FROM registration_requests WHERE status = $1 AND updated_at < $2',
      ['rejected', thirtyDaysAgo.toISOString()]
    );
    
    console.log(`🗑️ Found ${itemsToDelete.rows.length} registrations to delete`);
    
    // Delete the items
    const result = await pool.query(
      `DELETE FROM registration_requests 
       WHERE status = 'rejected' 
       AND updated_at < $1
       RETURNING id, company_name, email`,
      [thirtyDaysAgo.toISOString()]
    );
    
    res.json({ 
      success: true, 
      deleted_count: result.rows.length,
      deleted_items: result.rows
    });
  } catch (err) {
    console.error('Cleanup error:', err);
    res.status(500).json({ error: 'Failed to cleanup registrations' });
  }
});

// ==================== PASSWORD RESET ROUTES ====================

/**
 * POST /api/auth/forgot-password
 * Request password reset link
 */
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // Find user by email
    const userRes = await pool.query(
      'SELECT id, username, email FROM users WHERE email = $1',
      [email]
    );
    
    if (userRes.rows.length === 0) {
      // For security, don't reveal if email exists or not
      return res.json({ 
        success: true, 
        message: 'If an account exists with this email, a reset link has been sent.' 
      });
    }

    const user = userRes.rows[0];
    
    // Generate unique token
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiry (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    // Store token in database
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    );
    
    // Build reset URL
    const resetUrl = `${process.env.APP_URL || 'https://chickoryhub.com'}/reset-password?token=${token}`;
    
    // Send email with reset link
    await sendPasswordResetEmail(user.email, user.username, token);
    
    console.log(`🔑 Password reset link sent to ${user.email}`);
    
    res.json({ 
      success: true, 
      message: 'If an account exists with this email, a reset link has been sent.' 
    });
    
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

app.post('/api/auth/validate-reset-token', async (req, res) => {
  const { token } = req.body;
  
  console.log('🔍 Validating token:', token);
  console.log('🔍 Token length:', token?.length);
  
  if (!token) {
    console.log('❌ No token provided');
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM password_reset_tokens 
       WHERE token = $1 AND used = false AND expires_at > NOW()`,
      [token]
    );
    
    console.log('🔍 Query result rows:', result.rows.length);
    console.log('🔍 Current time:', new Date().toISOString());
    
    if (result.rows.length > 0) {
      console.log('✅ Token found:', {
        id: result.rows[0].id,
        user_id: result.rows[0].user_id,
        expires_at: result.rows[0].expires_at,
        used: result.rows[0].used
      });
    }
    
    if (result.rows.length === 0) {
      console.log('❌ No valid token found');
      return res.status(400).json({ 
        valid: false, 
        error: 'Invalid or expired token' 
      });
    }
    
    res.json({ valid: true });
    
  } catch (err) {
    console.error('❌ Validate token error:', err);
    res.status(500).json({ error: 'Failed to validate token' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password using token
 */
// ==================== PASSWORD RESET (FROM EMAIL) ====================
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }
  
  // Validate new password
  if (!/^[a-zA-Z0-9]+$/.test(newPassword)) {
    return res.status(400).json({ error: 'Password must contain only letters and numbers' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get token from database
    const tokenRes = await client.query(
      `SELECT * FROM password_reset_tokens 
       WHERE token = $1 AND used = false AND expires_at > NOW()`,
      [token]
    );
    
    if (tokenRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    const resetToken = tokenRes.rows[0];
    
    // Hash new password
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    
    // Update user password
    await client.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, resetToken.user_id]
    );
    
    // Mark token as used
    await client.query(
      'UPDATE password_reset_tokens SET used = true WHERE id = $1',
      [resetToken.id]
    );
    
    await client.query('COMMIT');
    
    // Get user email for confirmation
    const userRes = await client.query('SELECT email FROM users WHERE id = $1', [resetToken.user_id]);
    const userEmail = userRes.rows[0]?.email;
    
    // Send confirmation email
    if (userEmail) {
      await sendPasswordResetConfirmation(userEmail);
    }
    
    res.json({ success: true, message: 'Password reset successfully' });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  } finally {
    client.release();
  }
});

module.exports = app;