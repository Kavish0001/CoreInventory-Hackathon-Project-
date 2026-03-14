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

const app = express();
const config = getConfig();
const PORT = config.port;

app.disable('x-powered-by');
app.use(requestId);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 25,
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

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

function shutdown(signal) {
  console.log(`Received ${signal}. Shutting down...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
