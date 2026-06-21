require('dotenv').config({ quiet: true });

module.exports = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('[YOUR-PASSWORD]')
  ? require('./database-pg')
  : require('./database');

