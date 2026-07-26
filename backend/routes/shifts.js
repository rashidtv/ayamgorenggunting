// backend/routes/shifts.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get shift statistics (revenue, transaction count)
 */
async function getShiftStats(shiftId) {
  const stats = await pool.query(
    `SELECT 
       COALESCE(SUM(total_amount), 0) as revenue,
       COUNT(*) as transaction_count
     FROM orders 
     WHERE shift_id = $1`,
    [shiftId]
  );
  return {
    revenue: parseFloat(stats.rows[0].revenue) || 0,
    transactionCount: parseInt(stats.rows[0].transaction_count) || 0
  };
}

/**
 * Check if a shift exists and is open
 */
async function getOpenShift(stallId) {
  const result = await pool.query(
    `SELECT * FROM shifts 
     WHERE stall_id = $1 AND status = 'open'
     ORDER BY opened_at DESC LIMIT 1`,
    [stallId]
  );
  return result.rows[0] || null;
}

// ============================================
// SHIFT ROUTES
// ============================================

/**
 * GET /api/shifts/current
 * Get current open shift for a stall
 */
router.get('/current', authenticateToken, async (req, res) => {
  const { stallId } = req.query;
  
  if (!stallId) {
    return res.status(400).json({ 
      error: 'stallId is required',
      code: 'MISSING_STALL_ID'
    });
  }

  try {
    // Get current open shift
    const result = await pool.query(
      `SELECT 
         s.*,
         u1.username as opened_by_name
       FROM shifts s
       LEFT JOIN users u1 ON s.opened_by = u1.id
       WHERE s.stall_id = $1 AND s.status = 'open'
       ORDER BY s.opened_at DESC LIMIT 1`,
      [stallId]
    );
    
    if (result.rows.length === 0) {
      return res.json(null);
    }
    
    const shift = result.rows[0];
    const stats = await getShiftStats(shift.id);
    
    shift.revenue = stats.revenue;
    shift.transaction_count = stats.transactionCount;
    
    res.json(shift);
  } catch (err) {
    console.error('❌ Error fetching current shift:', err.message);
    res.status(500).json({ 
      error: 'Failed to fetch current shift',
      code: 'FETCH_SHIFT_ERROR'
    });
  }
});

/**
 * POST /api/shifts/open
 * Open a new shift
 */
router.post('/open', authenticateToken, async (req, res) => {
  const { stallId, startingFloat, notes } = req.body;
  const userId = req.user.id;
  
  if (!stallId) {
    return res.status(400).json({ 
      error: 'stallId is required',
      code: 'MISSING_STALL_ID'
    });
  }

  try {
    // Check if there's already an open shift
    const existing = await getOpenShift(stallId);
    
    if (existing) {
      return res.status(400).json({ 
        error: 'A shift is already open for this stall',
        code: 'SHIFT_ALREADY_OPEN',
        shiftId: existing.id,
        openedAt: existing.opened_at
      });
    }
    
    const result = await pool.query(
      `INSERT INTO shifts (stall_id, opened_by, starting_float, notes, status)
       VALUES ($1, $2, $3, $4, 'open')
       RETURNING *`,
      [stallId, userId, startingFloat || 0, notes || '']
    );
    
    console.log(`✅ Shift opened for stall ${stallId} by user ${userId}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error opening shift:', err.message);
    res.status(500).json({ 
      error: 'Failed to open shift',
      code: 'OPEN_SHIFT_ERROR'
    });
  }
});

/**
 * POST /api/shifts/close
 * Close an open shift
 */
router.post('/close', authenticateToken, async (req, res) => {
  const { shiftId, endingCash, notes } = req.body;
  const userId = req.user.id;
  
  if (!shiftId) {
    return res.status(400).json({ 
      error: 'shiftId is required',
      code: 'MISSING_SHIFT_ID'
    });
  }

  try {
    // Get the shift
    const shiftResult = await pool.query(
      `SELECT * FROM shifts WHERE id = $1 AND status = 'open'`,
      [shiftId]
    );
    
    if (shiftResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Shift not found or already closed',
        code: 'SHIFT_NOT_FOUND'
      });
    }
    
    const shift = shiftResult.rows[0];
    const stats = await getShiftStats(shiftId);
    
    const revenue = stats.revenue;
    const transactionCount = stats.transactionCount;
    const startingFloat = parseFloat(shift.starting_float) || 0;
    const expectedCash = startingFloat + revenue;
    const actualEndingCash = endingCash || 0;
    const variance = actualEndingCash - expectedCash;
    
    const result = await pool.query(
      `UPDATE shifts 
       SET closed_at = NOW(),
           closed_by = $1,
           ending_cash = $2,
           expected_cash = $3,
           variance = $4,
           revenue = $5,
           transaction_count = $6,
           closing_notes = $7,
           status = 'closed'
       WHERE id = $8
       RETURNING *`,
      [userId, actualEndingCash, expectedCash, variance, revenue, transactionCount, notes || '', shiftId]
    );
    
    console.log(`✅ Shift ${shiftId} closed by user ${userId}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error closing shift:', err.message);
    res.status(500).json({ 
      error: 'Failed to close shift',
      code: 'CLOSE_SHIFT_ERROR'
    });
  }
});

/**
 * GET /api/shifts/history
 * Get shift history for a stall with pagination and filtering
 */
router.get('/history', authenticateToken, async (req, res) => {
  const { 
    stallId, 
    limit = 50, 
    offset = 0, 
    from, 
    to, 
    status 
  } = req.query;
  
  if (!stallId) {
    return res.status(400).json({ 
      error: 'stallId is required',
      code: 'MISSING_STALL_ID'
    });
  }

  try {
    let queryText = `
      SELECT 
        s.*,
        u1.username as opened_by_name,
        u2.username as closed_by_name
      FROM shifts s
      LEFT JOIN users u1 ON s.opened_by = u1.id
      LEFT JOIN users u2 ON s.closed_by = u2.id
      WHERE s.stall_id = $1
    `;
    const params = [stallId];
    let paramIndex = 2;
    
    if (status && status !== 'all') {
      queryText += ` AND s.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (from) {
      queryText += ` AND s.opened_at >= $${paramIndex}`;
      params.push(from);
      paramIndex++;
    }
    
    if (to) {
      queryText += ` AND s.opened_at <= $${paramIndex}`;
      params.push(to);
      paramIndex++;
    }
    
    queryText += ` ORDER BY s.opened_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(queryText, params);
    
    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM shifts WHERE stall_id = $1`,
      [stallId]
    );
    
    res.json({
      shifts: result.rows,
      total: parseInt(countResult.rows[0].count) || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('❌ Error fetching shift history:', err.message);
    res.status(500).json({ 
      error: 'Failed to fetch shift history',
      code: 'HISTORY_FETCH_ERROR'
    });
  }
});

/**
 * GET /api/shifts/history/all
 * Get all shifts across all stalls (Super Admin only)
 */
router.get('/history/all', authenticateToken, async (req, res) => {
  // Only super_admin and super_super_admin can view all shifts
  if (req.user.role !== 'super_admin' && req.user.role !== 'super_super_admin') {
    return res.status(403).json({ 
      error: 'Forbidden - Admin access required',
      code: 'ADMIN_ONLY'
    });
  }
  
  const { limit = 100, offset = 0, from, to, status } = req.query;
  
  try {
    let queryText = `
      SELECT 
        s.*,
        u1.username as opened_by_name,
        u2.username as closed_by_name,
        st.name as stall_name
      FROM shifts s
      LEFT JOIN users u1 ON s.opened_by = u1.id
      LEFT JOIN users u2 ON s.closed_by = u2.id
      LEFT JOIN stalls st ON s.stall_id = st.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (status && status !== 'all') {
      queryText += ` AND s.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (from) {
      queryText += ` AND s.opened_at >= $${paramIndex}`;
      params.push(from);
      paramIndex++;
    }
    
    if (to) {
      queryText += ` AND s.opened_at <= $${paramIndex}`;
      params.push(to);
      paramIndex++;
    }
    
    queryText += ` ORDER BY s.opened_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(queryText, params);
    
    const countResult = await pool.query(`SELECT COUNT(*) FROM shifts`);
    
    res.json({
      shifts: result.rows,
      total: parseInt(countResult.rows[0].count) || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('❌ Error fetching all shifts:', err.message);
    res.status(500).json({ 
      error: 'Failed to fetch shifts',
      code: 'ADMIN_HISTORY_ERROR'
    });
  }
});

/**
 * GET /api/shifts/:shiftId
 * Get detailed shift information with transactions
 */
router.get('/:shiftId', authenticateToken, async (req, res) => {
  const { shiftId } = req.params;
  
  // Validate shiftId
  if (!shiftId || isNaN(parseInt(shiftId))) {
    return res.status(400).json({ 
      error: 'Valid shiftId is required',
      code: 'INVALID_SHIFT_ID'
    });
  }
  
  try {
    const shiftResult = await pool.query(
      `SELECT 
         s.*,
         u1.username as opened_by_name,
         u2.username as closed_by_name,
         st.name as stall_name
       FROM shifts s
       LEFT JOIN users u1 ON s.opened_by = u1.id
       LEFT JOIN users u2 ON s.closed_by = u2.id
       LEFT JOIN stalls st ON s.stall_id = st.id
       WHERE s.id = $1`,
      [shiftId]
    );
    
    if (shiftResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Shift not found',
        code: 'SHIFT_NOT_FOUND'
      });
    }
    
    const shift = shiftResult.rows[0];
    
    // Get transactions for this shift
    const txResult = await pool.query(
      `SELECT 
         id, order_number, total_amount, item_count, 
         status, created_at, user_id
       FROM orders 
       WHERE shift_id = $1 
       ORDER BY created_at DESC
       LIMIT 100`,
      [shiftId]
    );
    
    shift.transactions = txResult.rows;
    
    res.json(shift);
  } catch (err) {
    console.error('❌ Error fetching shift details:', err.message);
    res.status(500).json({ 
      error: 'Failed to fetch shift details',
      code: 'DETAIL_FETCH_ERROR'
    });
  }
});

module.exports = router;