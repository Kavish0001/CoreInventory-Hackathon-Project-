const dotenv = require('dotenv');
const { getConfig } = require('./utils/env');
const { createApp } = require('./app');

dotenv.config();
const config = getConfig();
const PORT = config.port;
const app = createApp();

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
