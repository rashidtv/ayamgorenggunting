// routes/shifts.js
const express = require('express')
const router = express.Router()
const db = require('../db') // Adjust based on your DB connection
const { authenticate } = require('../middleware/auth')

// ============================================
// GET /api/shifts/current - Get current open shift
// ============================================
router.get('/current', authenticate, async (req, res) => {
  const { stallId } = req.query
  
  if (!stallId) {
    return res.status(400).json({ error: 'stallId is required' })
  }
  
  try {
    // Get current open shift
    const result = await db.query(
      `SELECT 
         s.*,
         u1.username as opened_by_name
       FROM shifts s
       LEFT JOIN users u1 ON s.opened_by = u1.id
       WHERE s.stall_id = $1 AND s.status = 'open'
       ORDER BY s.opened_at DESC LIMIT 1`,
      [stallId]
    )
    
    if (result.rows.length === 0) {
      return res.json(null)
    }
    
    const shift = result.rows[0]
    
    // Get shift stats (revenue, transaction count)
    const stats = await db.query(
      `SELECT 
         COALESCE(SUM(total_amount), 0) as revenue,
         COUNT(*) as transaction_count
       FROM transactions 
       WHERE shift_id = $1`,
      [shift.id]
    )
    
    shift.revenue = parseFloat(stats.rows[0].revenue) || 0
    shift.transaction_count = parseInt(stats.rows[0].transaction_count) || 0
    
    res.json(shift)
  } catch (err) {
    console.error('Error fetching current shift:', err)
    res.status(500).json({ error: 'Failed to fetch current shift' })
  }
})

// ============================================
// POST /api/shifts/open - Open a new shift
// ============================================
router.post('/open', authenticate, async (req, res) => {
  const { stallId, startingFloat, notes } = req.body
  const userId = req.user.id
  
  if (!stallId) {
    return res.status(400).json({ error: 'stallId is required' })
  }
  
  try {
    // Check if there's already an open shift
    const existing = await db.query(
      'SELECT id FROM shifts WHERE stall_id = $1 AND status = $2',
      [stallId, 'open']
    )
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'A shift is already open for this stall' })
    }
    
    const result = await db.query(
      `INSERT INTO shifts (stall_id, opened_by, starting_float, notes, status)
       VALUES ($1, $2, $3, $4, 'open')
       RETURNING *`,
      [stallId, userId, startingFloat || 0, notes || '']
    )
    
    res.json(result.rows[0])
  } catch (err) {
    console.error('Error opening shift:', err)
    res.status(500).json({ error: 'Failed to open shift' })
  }
})

// ============================================
// POST /api/shifts/close - Close a shift
// ============================================
router.post('/close', authenticate, async (req, res) => {
  const { shiftId, endingCash, notes } = req.body
  const userId = req.user.id
  
  if (!shiftId) {
    return res.status(400).json({ error: 'shiftId is required' })
  }
  
  try {
    // Get the shift
    const shiftResult = await db.query(
      `SELECT * FROM shifts WHERE id = $1 AND status = 'open'`,
      [shiftId]
    )
    
    if (shiftResult.rows.length === 0) {
      return res.status(400).json({ error: 'Shift not found or already closed' })
    }
    
    const shift = shiftResult.rows[0]
    
    // Get shift revenue
    const stats = await db.query(
      `SELECT 
         COALESCE(SUM(total_amount), 0) as revenue,
         COUNT(*) as transaction_count
       FROM transactions 
       WHERE shift_id = $1`,
      [shiftId]
    )
    
    const revenue = parseFloat(stats.rows[0].revenue) || 0
    const transactionCount = parseInt(stats.rows[0].transaction_count) || 0
    const startingFloat = parseFloat(shift.starting_float) || 0
    const expectedCash = startingFloat + revenue
    const actualEndingCash = endingCash || 0
    const variance = actualEndingCash - expectedCash
    
    const result = await db.query(
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
    )
    
    res.json(result.rows[0])
  } catch (err) {
    console.error('Error closing shift:', err)
    res.status(500).json({ error: 'Failed to close shift' })
  }
})

// ============================================
// GET /api/shifts/history - Get shift history for a stall
// ============================================
router.get('/history', authenticate, async (req, res) => {
  const { stallId, limit = 50, offset = 0, from, to, status } = req.query
  
  if (!stallId) {
    return res.status(400).json({ error: 'stallId is required' })
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
    `
    const params = [stallId]
    let paramIndex = 2
    
    if (status && status !== 'all') {
      queryText += ` AND s.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }
    
    if (from) {
      queryText += ` AND s.opened_at >= $${paramIndex}`
      params.push(from)
      paramIndex++
    }
    
    if (to) {
      queryText += ` AND s.opened_at <= $${paramIndex}`
      params.push(to)
      paramIndex++
    }
    
    queryText += ` ORDER BY s.opened_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)
    
    const result = await db.query(queryText, params)
    
    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM shifts WHERE stall_id = $1`,
      [stallId]
    )
    
    res.json({
      shifts: result.rows,
      total: parseInt(countResult.rows[0].count) || 0
    })
  } catch (err) {
    console.error('Error fetching shift history:', err)
    res.status(500).json({ error: 'Failed to fetch shift history' })
  }
})

// ============================================
// GET /api/shifts/history/all - Get all shifts (admin)
// ============================================
router.get('/history/all', authenticate, async (req, res) => {
  const { limit = 100, offset = 0, from, to, status } = req.query
  
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
    `
    const params = []
    let paramIndex = 1
    
    if (status && status !== 'all') {
      queryText += ` AND s.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }
    
    if (from) {
      queryText += ` AND s.opened_at >= $${paramIndex}`
      params.push(from)
      paramIndex++
    }
    
    if (to) {
      queryText += ` AND s.opened_at <= $${paramIndex}`
      params.push(to)
      paramIndex++
    }
    
    queryText += ` ORDER BY s.opened_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)
    
    const result = await db.query(queryText, params)
    
    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM shifts`,
      []
    )
    
    res.json({
      shifts: result.rows,
      total: parseInt(countResult.rows[0].count) || 0
    })
  } catch (err) {
    console.error('Error fetching all shifts:', err)
    res.status(500).json({ error: 'Failed to fetch shifts' })
  }
})

// ============================================
// GET /api/shifts/:shiftId - Get shift details
// ============================================
router.get('/:shiftId', authenticate, async (req, res) => {
  const { shiftId } = req.params
  
  try {
    const shiftResult = await db.query(
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
    )
    
    if (shiftResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shift not found' })
    }
    
    const shift = shiftResult.rows[0]
    
    // Get transactions for this shift
    const txResult = await db.query(
      `SELECT * FROM transactions WHERE shift_id = $1 ORDER BY created_at DESC`,
      [shiftId]
    )
    
    shift.transactions = txResult.rows
    
    res.json(shift)
  } catch (err) {
    console.error('Error fetching shift details:', err)
    res.status(500).json({ error: 'Failed to fetch shift details' })
  }
})

module.exports = router