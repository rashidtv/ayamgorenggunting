// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const pool = require('../db'); // We'll create this next

/**
 * Get user by ID with company and stall assignments
 */
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
    console.error('❌ getUserById error:', err.message);
    throw err;
  }
}

/**
 * Authentication middleware
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'NO_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await getUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Ensure company_id is set for admin users
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
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    console.error('❌ Auth error:', err.message);
    return res.status(500).json({ 
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

module.exports = { authenticateToken };