const path = require('node:path');
const dotenv = require('dotenv');

function loadEnv() {
  dotenv.config({
    override: true,
    path: path.join(__dirname, '..', '.env'),
  });
}

module.exports = { loadEnv };

