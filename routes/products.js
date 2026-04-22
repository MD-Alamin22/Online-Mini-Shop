const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

// Get all products
router.get('/', async (req, res) => {
  try {
    const query = db.getQuery();
    const [products] = await query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Add a product
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price } = req.body;
    let image_url = req.body.image_url;

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      image_url = "data:" + req.file.mimetype + ";base64," + b64;
    }

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const query = db.getQuery();
    const [rows] = await query(
      'INSERT INTO products (name, description, price, image_url) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, description, price, image_url || 'https://via.placeholder.com/300x200']
    );

    res.status(201).json({ message: 'Product added successfully', productId: rows[0].id });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Edit a product
router.put('/:id', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price } = req.body;
    let image_url = req.body.image_url;
    
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      image_url = "data:" + req.file.mimetype + ";base64," + b64;
    }

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const query = db.getQuery();
    await query(
      'UPDATE products SET name = $1, description = $2, price = $3, image_url = $4 WHERE id = $5',
      [name, description, price, image_url, id]
    );

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Delete a product
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const query = db.getQuery();
    await query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
