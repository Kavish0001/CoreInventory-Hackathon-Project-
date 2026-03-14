const db = require('../utils/db');

exports.getWarehouses = async (req, res) => {
  try {
    const warehouses = await db.query('SELECT * FROM warehouses');
    res.json(warehouses.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.createWarehouse = async (req, res) => {
  const { name, short_code, location, address } = req.body;

  try {
    const newWarehouse = await db.query(
      'INSERT INTO warehouses (name, short_code, location, address) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, short_code?.trim() || null, location, address || null]
    );
    res.status(201).json(newWarehouse.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.getInventoryLocations = async (req, res) => {
  const { warehouse_id } = req.params;
  try {
    const locations = await db.query('SELECT * FROM inventory_locations WHERE warehouse_id = $1', [warehouse_id]);
    res.json(locations.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.createInventoryLocation = async (req, res) => {
  const { warehouse_id, location_name, short_code } = req.body;

  try {
    const newLocation = await db.query(
      'INSERT INTO inventory_locations (warehouse_id, location_name, short_code) VALUES ($1, $2, $3) RETURNING *',
      [warehouse_id, location_name, short_code?.trim() || null]
    );
    res.status(201).json(newLocation.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
