const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_12345';

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// Admin Middleware
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied, admin only' });
  }
};

// Customer: Place an order
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, totalPrice } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required' });
    }

    const userId = req.user.id;
    const query = db.getQuery();
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create order
      const orderResult = await client.query(
        'INSERT INTO orders (user_id, total_price) VALUES ($1, $2) RETURNING id',
        [userId, totalPrice]
      );
      const orderId = orderResult.rows[0].id;

      // Add order items
      for (const item of items) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [orderId, item.productId, item.quantity, item.price]
        );
      }

      await client.query('COMMIT');
      res.status(201).json({ message: 'Order placed successfully', orderId });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Get all orders
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const query = db.getQuery();
    
    const [orders] = await query(`
      SELECT o.id, o.total_price, o.status, o.created_at, u.name as customer_name, u.email as customer_email 
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC
    `);

    // Fetch items for each order
    for (const order of orders) {
      const [items] = await query(`
        SELECT oi.quantity, oi.price, p.name 
        FROM order_items oi 
        JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = $1
      `, [order.id]);
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Customer: Get my orders
router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const query = db.getQuery();
    const [orders] = await query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);

    for (const order of orders) {
      const [items] = await query(`
        SELECT oi.quantity, oi.price, p.name 
        FROM order_items oi 
        JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = $1
      `, [order.id]);
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    console.error('Fetch my orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
