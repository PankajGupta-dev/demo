const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 8080,
  logLevel: process.env.LOG_LEVEL || 'info',
  db: {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT, 10) || 5432,
    user: process.env.PGUSER || 'checkout_user',
    password: process.env.PGPASSWORD || 'checkout_password',
    database: process.env.PGDATABASE || 'checkout_db',
    max: parseInt(process.env.PGMAX, 10) || 20,
    idleTimeoutMillis: parseInt(process.env.PGIDLETIMEOUTMS, 10) || 30000,
    connectionTimeoutMillis: parseInt(process.env.PGCONNECTIONTIMEOUTMS, 10) || 5000,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
  },
};

module.exports = config;
