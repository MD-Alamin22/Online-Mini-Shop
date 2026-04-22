const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
require('dotenv').config();

let dbClient;
const isProduction = process.env.NODE_ENV === 'production';

async function init() {
  if (isProduction) {
    // --- PostgreSQL Setup for Render ---
    const connectionString = process.env.DATABASE_URL;
    dbClient = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await dbClient.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'customer',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await dbClient.query(`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10, 2) NOT NULL,
          image_url VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await dbClient.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL,
          total_price DECIMAL(10, 2) NOT NULL,
          status VARCHAR(50) DEFAULT 'Pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
      await dbClient.query(`
        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id INT NOT NULL,
          product_id INT NOT NULL,
          quantity INT NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );
      `);
      console.log('PostgreSQL Database initialized successfully (Production Mode).');
    } catch (err) {
      console.error('Error initializing PostgreSQL tables:', err);
      throw err;
    }
  } else {
    // --- SQLite Setup for Local Development ---
    try {
      dbClient = await open({
        filename: path.join(__dirname, 'database.sqlite'),
        driver: sqlite3.Database
      });

      await dbClient.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'customer',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await dbClient.exec(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          price DECIMAL(10, 2) NOT NULL,
          image_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await dbClient.exec(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          total_price DECIMAL(10, 2) NOT NULL,
          status TEXT DEFAULT 'Pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
      await dbClient.exec(`
        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );
      `);
      console.log('SQLite Database initialized successfully (Local Mode).');
    } catch (err) {
      console.error('Error initializing SQLite tables:', err);
      throw err;
    }
  }
}

function getQuery() {
  return async (sql, params = []) => {
    if (isProduction) {
      const result = await dbClient.query(sql, params);
      return [result.rows, result.fields, result];
    } else {
      const sqliteSql = sql.replace(/\$\d+/g, '?');
      const rows = await dbClient.all(sqliteSql, params);
      return [rows, [], { rows }];
    }
  };
}

module.exports = {
  init,
  getQuery
};
