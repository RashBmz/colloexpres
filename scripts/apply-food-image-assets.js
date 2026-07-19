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

const ASSETS = {
  brochette: '/images/food/generated/brochette.png',
  chapati: '/images/food/generated/chapati.png',
  chawarma: '/images/food/generated/chawarma.png',
  gratin: '/images/food/generated/gratin.png',
  makloub: '/images/food/generated/makloub.png',
  pasta: '/images/food/generated/pasta.png',
  plat: '/images/food/generated/plat.png',
  poutine: '/images/food/generated/poutine.png',
  souffle: '/images/food/generated/souffle.png'
};

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isImgur(url) {
  return /^https?:\/\/(i\.)?imgur\.com\//i.test(String(url || '').trim());
}

function canReplace(url) {
  return !isImgur(url);
}

function detectAsset(...parts) {
  const text = normalize(parts.join(' '));
  const itemText = normalize(parts.slice(2).join(' '));

  if (/\b(pasta|pates|bolognaise|fruit de mer)\b/.test(itemText)) return ASSETS.pasta;

  if (/\b(brochette|brochettes|grillade|grillades|barbecue|barbecues|boulette|kebab|merguez|melfouf)\b/.test(text)) {
    return ASSETS.brochette;
  }
  if (/\bchapati\b/.test(text)) return ASSETS.chapati;
  if (/\b(chawarma|shawarma|libanais|rghif|rarif)\b/.test(text)) return ASSETS.chawarma;
  if (/\b(gratin|gratins)\b/.test(text)) return ASSETS.gratin;
  if (/\b(makloub|makloubs)\b/.test(text)) return ASSETS.makloub;
  if (/\b(pasta|pates|bolognaise|fruit de mer)\b/.test(text)) return ASSETS.pasta;
  if (/\b(poutine|poutines|potine|potines)\b/.test(text)) return ASSETS.poutine;
  if (/\b(souffle|souffles|soufle|soufles)\b/.test(text)) return ASSETS.souffle;
  if (/\b(plat|plats|omelette|escalope|nuggets|steak|poulet marine|poulet crispy|viande hachee|cordon bleu|lasagne|tajine|tadjin|roulet|cuisse|chakhchoukha|fritila|kefta|ojja|safiria|kouniya|poisson)\b/.test(text)) {
    return ASSETS.plat;
  }

  return '';
}

function updateMenu(menu) {
  let changed = 0;
  const next = menu && typeof menu === 'object' && !Array.isArray(menu) ? { ...menu } : {};

  for (const [categoryKey, categoryValue] of Object.entries(next)) {
    if (!categoryValue || typeof categoryValue !== 'object') continue;

    const category = { ...categoryValue };
    const categoryAsset = detectAsset(categoryKey, category.label);
    if (categoryAsset && canReplace(category.image)) {
      category.image = categoryAsset;
      changed += 1;
    }

    if (Array.isArray(category.items)) {
      category.items = category.items.map((item) => {
        if (!item || typeof item !== 'object') return item;
        const asset = detectAsset(categoryKey, category.label, item.id, item.name, item.description);
        if (!asset || !canReplace(item.image)) return item;
        changed += 1;
        return { ...item, image: asset };
      });
    }

    next[categoryKey] = category;
  }

  return { menu: next, changed };
}

(async () => {
  try {
    const { rows } = await pool.query('SELECT id, name, menu_json FROM restaurants ORDER BY name ASC');
    let restaurantsChanged = 0;
    let imagesChanged = 0;

    for (const restaurant of rows) {
      const { menu, changed } = updateMenu(restaurant.menu_json || {});
      if (!changed) continue;
      await pool.query(
        'UPDATE restaurants SET menu_json = $2::jsonb, updated_at = NOW() WHERE id = $1',
        [restaurant.id, JSON.stringify(menu)]
      );
      restaurantsChanged += 1;
      imagesChanged += changed;
      console.log(`${restaurant.name}: ${changed} images menu mises a jour`);
    }

    console.log(`OK - ${imagesChanged} images mises a jour sur ${restaurantsChanged} restaurants`);
  } finally {
    await pool.end();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
