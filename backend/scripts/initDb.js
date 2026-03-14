const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const db = require('../utils/db');

dotenv.config({ override: true, path: path.join(__dirname, '..', '.env') });

async function main() {
  const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  try {
    await db.query(schema);
    console.log('Database schema applied successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to apply schema:', error);
    process.exit(1);
  }
}

main();
