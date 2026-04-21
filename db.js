const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');

let dbInstance = null;

async function init() {
  dbInstance = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);
  console.log('SQLite Database initialized successfully.');
}

// Wrapper to mimic mysql2's API for the existing routes
function getQuery() {
  return async (sql, params = []) => {
    // Replace MySQL '?' with correct positional or keeping '?' works in SQLite too
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
    
    if (isSelect) {
      const rows = await dbInstance.all(sql, params);
      return [rows]; // Mimic [rows, fields]
    } else {
      const result = await dbInstance.run(sql, params);
      // SQLite run result has .lastID and .changes
      return [{ insertId: result.lastID, affectedRows: result.changes }];
    }
  };
}

module.exports = { 
  init, 
  getQuery, 
  pool: { 
    getConnection: async () => {
      // Mocking MySQL transaction for orders.js
      return {
        query: async (sql, params) => {
          if(sql.startsWith('USE')) return [];
          const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
          if (isSelect) {
            const rows = await dbInstance.all(sql, params);
            return [rows];
          } else {
            const result = await dbInstance.run(sql, params);
            return [{ insertId: result.lastID, affectedRows: result.changes }];
          }
        },
        beginTransaction: async () => await dbInstance.run('BEGIN TRANSACTION'),
        commit: async () => await dbInstance.run('COMMIT'),
        rollback: async () => await dbInstance.run('ROLLBACK'),
        release: () => {}
      };
    }
  } 
};
