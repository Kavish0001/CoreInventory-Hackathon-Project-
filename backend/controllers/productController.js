const db = require('../utils/db');

exports.getProducts = async (req, res) => {
  try {
    const products = await db.query('SELECT * FROM products');
    res.json(products.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.createProduct = async (req, res) => {
  const { name, sku, category, unit, per_unit_cost, reorder_level } = req.body;

  try {
    const newProduct = await db.query(
      'INSERT INTO products (name, sku, category, unit, per_unit_cost, reorder_level) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, sku, category, unit, per_unit_cost || 0, reorder_level || 0]
    );
    res.status(201).json(newProduct.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, sku, category, unit, per_unit_cost, reorder_level } = req.body;

  try {
    const updatedProduct = await db.query(
      'UPDATE products SET name = $1, sku = $2, category = $3, unit = $4, per_unit_cost = $5, reorder_level = $6 WHERE id = $7 RETURNING *',
      [name, sku, category, unit, per_unit_cost || 0, reorder_level, id]
    );
    res.json(updatedProduct.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (product.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
