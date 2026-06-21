require('dotenv').config();

const path = require('path');
const Datastore = require('nedb-promises');
const pgDb = require('../models/database-pg');

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('[YOUR-PASSWORD]')) {
  console.error('DATABASE_URL manquante ou invalide dans .env');
  process.exit(1);
}

async function readLocalDatastore(filename) {
  const store = Datastore.create({ filename, autoload: true });
  return store.find({});
}

(async () => {
  await pgDb.ready;

  const dataDir = path.join(__dirname, '../data');
  const localUsers = await readLocalDatastore(path.join(dataDir, 'users.db'));
  const localOrders = await readLocalDatastore(path.join(dataDir, 'orders.db'));
  const localNotifs = await readLocalDatastore(path.join(dataDir, 'notifs.db'));

  let usersCount = 0;
  let ordersCount = 0;
  let notifsCount = 0;

  for (const user of localUsers) {
    await pgDb.upsertUser(user);
    usersCount += 1;
  }

  for (const order of localOrders) {
    await pgDb.upsertOrder(order);
    ordersCount += 1;
  }

  for (const notif of localNotifs) {
    await pgDb.upsertNotif(notif);
    notifsCount += 1;
  }

  console.log(`Migration terminee: ${usersCount} utilisateurs, ${ordersCount} commandes, ${notifsCount} notifications.`);
  process.exit(0);
})().catch((error) => {
  console.error('Erreur de migration:', error);
  process.exit(1);
});
