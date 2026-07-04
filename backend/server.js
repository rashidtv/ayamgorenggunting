const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

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

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `menu-${unique}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed (JPEG, PNG, WebP, GIF)'));
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

// ==================== AUTH ROUTES ====================

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = userRes.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

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

// ==================== STALL SALES STATISTICS ====================
app.get('/api/stall-sales-stats', authenticateToken, async (req, res) => {
  try {
    const stallId = req.query.stallId ? parseInt(req.query.stallId) : null;
    if (!stallId) return res.status(400).json({ error: 'stallId required' });

    const allowed = await userCanAccessStall(req.user.id, stallId);
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const todayRes = await pool.query(`
      SELECT COALESCE(SUM(price), 0) as total
      FROM sales
      WHERE stall_id = $1 AND DATE(created_at) = CURRENT_DATE
    `, [stallId]);

    const weekRes = await pool.query(`
      SELECT COALESCE(SUM(price), 0) as total
      FROM sales
      WHERE stall_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    `, [stallId]);

    const monthRes = await pool.query(`
      SELECT COALESCE(SUM(price), 0) as total
      FROM sales
      WHERE stall_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    `, [stallId]);

    const quarterRes = await pool.query(`
      SELECT COALESCE(SUM(price), 0) as total
      FROM sales
      WHERE stall_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '90 days'
    `, [stallId]);

    const yearRes = await pool.query(`
      SELECT COALESCE(SUM(price), 0) as total
      FROM sales
      WHERE stall_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '365 days'
    `, [stallId]);

    res.json({
      today: parseFloat(todayRes.rows[0]?.total || 0),
      week: parseFloat(weekRes.rows[0]?.total || 0),
      month: parseFloat(monthRes.rows[0]?.total || 0),
      quarter: parseFloat(quarterRes.rows[0]?.total || 0),
      year: parseFloat(yearRes.rows[0]?.total || 0)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stall sales stats' });
  }
});

// ==================== SALES ANALYTICS (Enhanced) ====================
app.get('/api/sales-analytics', authenticateToken, async (req, res) => {
  try {
    const { stallId, days } = req.query;
    let targetStallId = stallId ? parseInt(stallId) : null;
    let dayRange = days ? parseInt(days) : 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dayRange);

    // For super_admin, get all stalls in their company
    if (req.user.role === 'super_admin' || req.user.role === 'super_super_admin') {
      let companyId = req.user.company_id;
      if (req.user.role === 'super_super_admin') {
        // Get first company if none specified
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

      // Get daily sales for all stalls
      const dailyRes = await pool.query(`
        SELECT 
          DATE(created_at) as date, 
          COALESCE(SUM(price), 0) as revenue, 
          COUNT(*) as items
        FROM sales
        WHERE stall_id = ANY($1::int[]) AND created_at >= $2
        GROUP BY DATE(created_at)
        ORDER BY date
      `, [stallIds, startDate]);

      // Get product sales breakdown
      const productRes = await pool.query(`
        SELECT 
          item_name, 
          COUNT(*) as quantity,
          COALESCE(SUM(price), 0) as revenue
        FROM sales
        WHERE stall_id = ANY($1::int[]) AND created_at >= $2
        GROUP BY item_name
        ORDER BY quantity DESC
      `, [stallIds, startDate]);

      const productSales = {};
      productRes.rows.forEach(row => {
        productSales[row.item_name] = {
          quantity: parseInt(row.quantity),
          revenue: parseFloat(row.revenue)
        };
      });

      // Get total items and revenue for the period
      const totalRes = await pool.query(`
        SELECT 
          COALESCE(SUM(price), 0) as total_revenue,
          COUNT(*) as total_items
        FROM sales
        WHERE stall_id = ANY($1::int[]) AND created_at >= $2
      `, [stallIds, startDate]);

      // Get top performing stall
      const topStallRes = await pool.query(`
        SELECT 
          s.name as stall_name,
          COALESCE(SUM(sales.price), 0) as revenue
        FROM sales
        JOIN stalls s ON sales.stall_id = s.id
        WHERE sales.stall_id = ANY($1::int[]) AND sales.created_at >= $2
        GROUP BY s.name
        ORDER BY revenue DESC
        LIMIT 1
      `, [stallIds, startDate]);

      return res.json({
        dailySales: dailyRes.rows,
        productSales: productSales,
        totalItems: parseInt(totalRes.rows[0]?.total_items || 0),
        totalRevenue: parseFloat(totalRes.rows[0]?.total_revenue || 0),
        topStall: topStallRes.rows[0]?.stall_name || '-'
      });
    }

    // For single stall (stall_admin or cashier)
    if (!targetStallId) {
      targetStallId = req.user.assigned_stalls?.[0]?.id;
    }
    if (!targetStallId) {
      return res.json({ dailySales: [], productSales: {}, totalItems: 0, totalRevenue: 0, topStall: '-' });
    }

    const allowed = await userCanAccessStall(req.user.id, targetStallId);
    if (!allowed) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const dailyRes = await pool.query(`
      SELECT 
        DATE(created_at) as date, 
        COALESCE(SUM(price), 0) as revenue, 
        COUNT(*) as items
      FROM sales
      WHERE stall_id = $1 AND created_at >= $2
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [targetStallId, startDate]);

    const productRes = await pool.query(`
      SELECT 
        item_name, 
        COUNT(*) as quantity,
        COALESCE(SUM(price), 0) as revenue
      FROM sales
      WHERE stall_id = $1 AND created_at >= $2
      GROUP BY item_name
      ORDER BY quantity DESC
    `, [targetStallId, startDate]);

    const productSales = {};
    productRes.rows.forEach(row => {
      productSales[row.item_name] = {
        quantity: parseInt(row.quantity),
        revenue: parseFloat(row.revenue)
      };
    });

    const totalRes = await pool.query(`
      SELECT 
        COALESCE(SUM(price), 0) as total_revenue,
        COUNT(*) as total_items
      FROM sales
      WHERE stall_id = $1 AND created_at >= $2
    `, [targetStallId, startDate]);

    res.json({
      dailySales: dailyRes.rows,
      productSales: productSales,
      totalItems: parseInt(totalRes.rows[0]?.total_items || 0),
      totalRevenue: parseFloat(totalRes.rows[0]?.total_revenue || 0),
      topStall: '-'
    });
  } catch (err) {
    console.error('Sales analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics', details: err.message });
  }
});

// ==================== COMPANY MANAGEMENT ====================

// IMPORTANT: Specific company routes MUST come BEFORE generic /api/companies routes

// ==================== COMPANY STALLS ====================
app.get('/api/companies/:companyId/stalls', authenticateToken, async (req, res) => {
  const companyId = parseInt(req.params.companyId);
  if (isNaN(companyId)) return res.status(400).json({ error: 'Invalid company ID' });
  
  if (!userCanAccessCompany(req.user, companyId) && req.user.role !== 'stall_admin') {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to access this company' });
  }
  
  const result = await pool.query('SELECT * FROM stalls WHERE company_id = $1 ORDER BY name', [companyId]);
  res.json(result.rows);
});

app.post('/api/companies/:companyId/stalls', authenticateToken, async (req, res) => {
  const companyId = parseInt(req.params.companyId);
  if (isNaN(companyId)) return res.status(400).json({ error: 'Invalid company ID' });
  if (!isCompanyAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
  const { name, code, location } = req.body;
  await pool.query(
    'INSERT INTO stalls (company_id, name, code, location) VALUES ($1, $2, $3, $4)',
    [companyId, name, code, location]
  );
  res.json({ success: true });
});

// ==================== COMPANY USERS ====================
app.get('/api/companies/:companyId/users', authenticateToken, async (req, res) => {
  const companyId = parseInt(req.params.companyId);
  if (isNaN(companyId)) return res.status(400).json({ error: 'Invalid company ID' });
  
  if (!userCanAccessCompany(req.user, companyId) && req.user.role !== 'stall_admin') {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to access this company' });
  }

  let query = `
    SELECT u.id, u.username, u.full_name, u.role, u.is_active,
      COALESCE(
        (SELECT json_agg(json_build_object('id', s.id, 'name', s.name))
         FROM user_stall_assignments usa
         JOIN stalls s ON usa.stall_id = s.id
         WHERE usa.user_id = u.id),
        '[]'
      ) as assigned_stalls
    FROM users u
    WHERE u.company_id = $1
  `;

  if (req.user.role === 'stall_admin') {
    const userStalls = await pool.query('SELECT stall_id FROM user_stall_assignments WHERE user_id = $1', [req.user.id]);
    const allowedStallIds = userStalls.rows.map(r => r.stall_id);
    query += ` AND (u.role = 'cashier' OR EXISTS (SELECT 1 FROM user_stall_assignments usa2 WHERE usa2.user_id = u.id AND usa2.stall_id = ANY($2::int[])))`;
    const result = await pool.query(query, [companyId, allowedStallIds]);
    return res.json(result.rows);
  }

  const result = await pool.query(query, [companyId]);
  res.json(result.rows);
});

app.post('/api/companies/:companyId/users', authenticateToken, async (req, res) => {
  const companyId = parseInt(req.params.companyId);
  if (isNaN(companyId)) return res.status(400).json({ error: 'Invalid company ID' });

  const { username, password, full_name, role, stall_ids } = req.body;

  if (req.user.role === 'stall_admin' && role !== 'cashier') {
    return res.status(403).json({ error: 'Stall Admin can only create Cashiers' });
  }
  if (req.user.role === 'stall_admin') {
    const userStalls = await pool.query('SELECT stall_id FROM user_stall_assignments WHERE user_id = $1', [req.user.id]);
    const allowedStallIds = userStalls.rows.map(r => r.stall_id);
    if (stall_ids && stall_ids.some(id => !allowedStallIds.includes(parseInt(id)))) {
      return res.status(403).json({ error: 'You can only assign stalls that you manage' });
    }
  }
  if (req.user.role === 'cashier') {
    return res.status(403).json({ error: 'Cashier cannot create users' });
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
app.get('/api/companies', authenticateToken, async (req, res) => {
  if (!isCompanyAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
  const result = await pool.query('SELECT * FROM companies ORDER BY name');
  res.json(result.rows);
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
  if (!isCompanyAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
  const stall = await pool.query('SELECT is_active FROM stalls WHERE id = $1', [req.params.stallId]);
  if (!stall.rows[0]) return res.status(404).json({ error: 'Stall not found' });
  await pool.query('UPDATE stalls SET is_active = $1 WHERE id = $2', [!stall.rows[0].is_active, req.params.stallId]);
  res.json({ success: true });
});

// ==================== STALL DELETE ====================
app.delete('/api/stalls/:id', authenticateToken, async (req, res) => {
  if (!isCompanyAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
  const stallId = parseInt(req.params.id);
  if (isNaN(stallId)) return res.status(400).json({ error: 'Invalid stall ID' });

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
    const { days } = req.query;
    let dayRange = days ? parseInt(days) : 7;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dayRange);
    
    let query = `
      SELECT item_name, COUNT(*) as quantity, SUM(price) as revenue
      FROM sales
      WHERE created_at >= $1
    `;
    
    if (req.user.role === 'super_admin') {
      query += ` AND stall_id IN (SELECT id FROM stalls WHERE company_id = $2)`;
      const result = await pool.query(query + ` GROUP BY item_name ORDER BY quantity DESC`, [startDate, req.user.company_id]);
      return res.json(result.rows);
    }
    
    query += ` GROUP BY item_name ORDER BY quantity DESC`;
    const result = await pool.query(query, [startDate]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/menu-performance:', err);
    res.status(500).json({ error: 'Failed to fetch menu performance', details: err.message });
  }
});

// ==================== STALL PERFORMANCE ====================
app.get('/api/stall-performance', authenticateToken, async (req, res) => {
  try {
    const { days } = req.query;
    let dayRange = days ? parseInt(days) : 1;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dayRange);

    if (req.user.role === 'super_admin' || req.user.role === 'super_super_admin') {
      let companyId = req.user.company_id;
      if (req.user.role === 'super_super_admin') {
        const companyRes = await pool.query('SELECT id FROM companies LIMIT 1');
        if (companyRes.rows[0]) {
          companyId = companyRes.rows[0].id;
        }
      }
      
      if (!companyId) {
        return res.json([]);
      }

      const result = await pool.query(`
        SELECT 
          s.id,
          s.name,
          s.is_active,
          COALESCE(SUM(sales.price), 0) as revenue,
          COUNT(sales.id) as items_sold,
          COALESCE(AVG(sales.price), 0) as avg_transaction
        FROM stalls s
        LEFT JOIN sales ON sales.stall_id = s.id AND sales.created_at >= $2
        WHERE s.company_id = $1
        GROUP BY s.id, s.name, s.is_active
        ORDER BY revenue DESC
      `, [companyId, startDate]);

      const performance = result.rows.map(row => {
        return {
          id: row.id,
          name: row.name,
          is_active: row.is_active,
          revenue: parseFloat(row.revenue),
          items: parseInt(row.items_sold),
          avgTransaction: parseFloat(row.avg_transaction),
          growth: 0
        };
      });

      return res.json(performance);
    }

    res.json([]);
  } catch (err) {
    console.error('Stall performance error:', err);
    res.status(500).json({ error: 'Failed to fetch stall performance' });
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

module.exports = app;