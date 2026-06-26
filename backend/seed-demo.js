const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  const client = await pool.connect();
  try {
    // Insert a company
    await client.query(`
      INSERT INTO companies (name, code) VALUES ('AGG Holdings', 'AGG001')
      ON CONFLICT (code) DO NOTHING;
    `);

    // Get company id
    const companyRes = await client.query(`SELECT id FROM companies WHERE code = 'AGG001'`);
    const companyId = companyRes.rows[0].id;

    // Insert stalls
    await client.query(`
      INSERT INTO stalls (company_id, name, code) VALUES
      ($1, 'AGG Cheras', 'CHR001'),
      ($1, 'AGG Kajang', 'KJG001')
      ON CONFLICT (code) DO NOTHING;
    `, [companyId]);

    // Insert users with hashed passwords
    const hashed = bcrypt.hashSync('password', 10);
    await client.query(`
      INSERT INTO users (username, password, full_name, role, company_id, can_manage_multiple_stalls) VALUES
      ('ssa', $1, 'Super Super Admin', 'super_super_admin', NULL, false),
      ('sa', $1, 'Super Admin', 'super_admin', $2, true),
      ('sta1', $1, 'Stall Admin Cheras', 'stall_admin', $2, true),
      ('sta2', $1, 'Stall Admin Kajang', 'stall_admin', $2, true),
      ('cashier1', $1, 'Cashier Cheras', 'cashier', $2, false)
      ON CONFLICT (username) DO NOTHING;
    `, [hashed, companyId]);

    // Assign stall admins to stalls
    const users = await client.query(`SELECT id, username FROM users WHERE username IN ('sta1', 'sta2')`);
    const stalls = await client.query(`SELECT id, code FROM stalls WHERE code IN ('CHR001', 'KJG001')`);
    for (const user of users.rows) {
      const stallCode = user.username === 'sta1' ? 'CHR001' : 'KJG001';
      const stall = stalls.rows.find(s => s.code === stallCode);
      if (stall) {
        await client.query(`
          INSERT INTO user_stall_assignments (user_id, stall_id, is_primary)
          VALUES ($1, $2, true)
          ON CONFLICT DO NOTHING;
        `, [user.id, stall.id]);
      }
    }

    console.log('✅ Demo data seeded');
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
