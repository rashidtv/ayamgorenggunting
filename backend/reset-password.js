const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'agg_mvp.db');
const db = new sqlite3.Database(dbPath);

const username = process.argv[2] || 'stall_01';
const newPassword = process.argv[3] || 'admin123';

const hashedPassword = bcrypt.hashSync(newPassword, 10);

db.run(
  'UPDATE users SET password = ? WHERE username = ?',
  [hashedPassword, username],
  function(err) {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log(`✅ Password updated for ${username}`);
      console.log(`📝 New password: ${newPassword}`);
    }
    db.close();
  }
);
