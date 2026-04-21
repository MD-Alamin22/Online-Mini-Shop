const bcrypt = require('bcryptjs');
const db = require('./db.js');

async function seedAdmin() {
  await db.init();
  const query = db.getQuery();
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('admin123', salt);
  
  const [users] = await query('SELECT * FROM users WHERE email = ?', ['admin@store.com']);
  if (users.length === 0) {
    await query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', ['Admin', 'admin@store.com', hash, 'admin']);
    console.log('Admin user created successfully: admin@store.com / admin123');
  } else {
    await query('UPDATE users SET role = ?, password = ? WHERE email = ?', ['admin', hash, 'admin@store.com']);
    console.log('Admin user updated successfully: admin@store.com / admin123');
  }
  process.exit(0);
}

seedAdmin();
