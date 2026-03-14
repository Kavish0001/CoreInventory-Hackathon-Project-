const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const requestId = require('./middleware/requestId');
const errorHandler = require('./middleware/errorHandler');
const { getConfig } = require('./utils/env');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const reportRoutes = require('./routes/reportRoutes');

function createApp() {
  const app = express();
  const config = getConfig();

  app.disable('x-powered-by');
  app.use(requestId);
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 10_000 : 300,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 10_000 : 25,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(generalLimiter);

  app.use(cors({
    origin: (origin, callback) => {
      const allowed = config.corsOrigin;
      if (!origin) return callback(null, true);
      if (allowed === '*' || allowed === origin) return callback(null, true);
      return callback(new Error('CORS not allowed'));
    },
    credentials: true,
  }));

  app.use(express.json({ limit: '1mb' }));

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/warehouses', warehouseRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/reports', reportRoutes);

  app.get('/', (req, res) => {
    res.send('CoreInventory API is running...');
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', request_id: req.requestId });
  });

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

