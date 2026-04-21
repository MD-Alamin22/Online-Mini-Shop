const bcrypt = require('bcryptjs');
const db = require('./db.js');

async function fixAdmin() {
  await db.init();
  const query = db.getQuery();
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('admin', salt);
  await query('UPDATE users SET password = ? WHERE email = ?', [hash, 'admin@store.com']);
  console.log('Admin password fixed to "admin"');
  process.exit(0);
}

fixAdmin();
