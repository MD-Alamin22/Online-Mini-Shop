const bcrypt = require('bcryptjs');
const db = require('./db.js');

async function seedAdmin() {
  await db.init();
  const query = db.getQuery();
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('admin123', salt);
  
  const [users] = await query('SELECT * FROM users WHERE email = $1', ['admin@gmail.com']);
  if (users.length === 0) {
    await query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)', ['Admin', 'admin@gmail.com', hash, 'admin']);
    console.log('Admin user created successfully: admin@gmail.com / admin123');
  } else {
    await query('UPDATE users SET role = $1, password = $2 WHERE email = $3', ['admin', hash, 'admin@gmail.com']);
    console.log('Admin user updated successfully: admin@gmail.com / admin123');
  }
  process.exit(0);
}

seedAdmin();
