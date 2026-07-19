const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL manquant');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }
});

(async () => {
  try {
    const { rows } = await pool.query('SELECT menu_json FROM restaurants ORDER BY name ASC');
    const counts = {};
    for (const row of rows) {
      for (const category of Object.values(row.menu_json || {})) {
        for (const item of category.items || []) {
          const image = String(item.image || '');
          if (image.startsWith('/images/food/generated/') && image.endsWith('.png')) {
            counts[image] = (counts[image] || 0) + 1;
          }
        }
      }
    }
    console.log(JSON.stringify(counts, null, 2));
  } finally {
    await pool.end();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
