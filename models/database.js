/**
 * ColloExpress — Base de données NeDB
 * NeDB = 100% JavaScript, zéro compilation, fonctionne sur Windows/Mac/Linux
 */
const Datastore = require('nedb-promises');
const bcrypt = require('bcryptjs');
const path = require('path');
const DEFAULT_RESTAURANTS = require('../data/restaurants');

const dbDir = path.join(__dirname, '../data');
require('fs').mkdirSync(dbDir, { recursive: true });

// ─── COLLECTIONS ─────────────────────────────────────
const users  = Datastore.create({ filename: path.join(dbDir, 'users.db'),  autoload: true });
const orders = Datastore.create({ filename: path.join(dbDir, 'orders.db'), autoload: true });
const notifs = Datastore.create({ filename: path.join(dbDir, 'notifs.db'), autoload: true });
const restaurants = Datastore.create({ filename: path.join(dbDir, 'restaurants.db'), autoload: true });

users.ensureIndex({ fieldName: 'phone', unique: true });
restaurants.ensureIndex({ fieldName: 'id', unique: true });

const normalizeOrder = (order) => (order ? { ...order, id: order.id || order._id } : order);
const normalizeRestaurant = (restaurant) => (restaurant ? { ...restaurant, id: restaurant.id || restaurant._id } : restaurant);
const getOrderGain = (order = {}) => Number(order.delivery_fee ?? ((order.subtotal != null && order.price != null) ? (order.price - order.subtotal) : order.price ?? 0));
const getOrderCollected = (order = {}) => Number(order.price ?? getOrderGain(order));
const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function startOfToday(baseDate = new Date()) {
  const date = new Date(baseDate);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfWeek(baseDate = new Date()) {
  const date = startOfToday(baseDate);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function startOfMonth(baseDate = new Date()) {
  const date = startOfToday(baseDate);
  date.setDate(1);
  return date;
}

function startOfYear(baseDate = new Date()) {
  const date = startOfToday(baseDate);
  date.setMonth(0, 1);
  return date;
}

function summarizeDeliveredOrders(ordersList) {
  return {
    count: ordersList.length,
    gains: ordersList.reduce((sum, order) => sum + getOrderGain(order), 0),
    collected: ordersList.reduce((sum, order) => sum + getOrderCollected(order), 0),
  };
}

function buildLivreurPeriodStats(ordersList, baseDate = new Date()) {
  const deliveredOrders = ordersList
    .filter((order) => order.status === 'delivered' && order.delivered_at)
    .map((order) => ({ ...order, deliveredDate: new Date(order.delivered_at) }))
    .filter((order) => !Number.isNaN(order.deliveredDate.getTime()));

  const today = startOfToday(baseDate);
  const week = startOfWeek(baseDate);
  const month = startOfMonth(baseDate);
  const year = startOfYear(baseDate);

  return {
    day: summarizeDeliveredOrders(deliveredOrders.filter((order) => order.deliveredDate >= today)),
    week: summarizeDeliveredOrders(deliveredOrders.filter((order) => order.deliveredDate >= week)),
    month: summarizeDeliveredOrders(deliveredOrders.filter((order) => order.deliveredDate >= month)),
    year: summarizeDeliveredOrders(deliveredOrders.filter((order) => order.deliveredDate >= year)),
    all: summarizeDeliveredOrders(deliveredOrders),
  };
}

// ─── DB HELPER ───────────────────────────────────────
const db = {
  users, orders, notifs, restaurants,

  // ── Users ──────────────────────────────────────────
  async findUserByPhone(phone) {
    return users.findOne({ phone });
  },
  async findUserById(id) {
    return users.findOne({ _id: id });
  },
  async createUser(data) {
    return users.insert({ ...data, created_at: new Date().toISOString() });
  },
  async updateUser(id, data) {
    await users.update({ _id: id }, { $set: data });
    return users.findOne({ _id: id });
  },
  async getLivreurs() {
    const all = await users.find({ role: 'livreur' });
    return all.sort((a,b) => (b.total_deliveries||0) - (a.total_deliveries||0));
  },
  async getAvailableLivreurs() {
    return users.find({ role: 'livreur', available: true });
  },
  async getClients() {
    const clients = await users.find({ role: 'client' });
    return Promise.all(clients.map(async c => {
      const count = await orders.count({ client_id: c._id });
      return { ...c, order_count: count };
    }));
  },
  async deleteLivreur(id) {
    return users.remove({ _id: id, role: 'livreur' }, {});
  },

  // ── Orders ─────────────────────────────────────────
  async createOrder(data) {
    return normalizeOrder(await orders.insert({
      ...data,
      status: 'pending',
      payment_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  },
  async findOrderById(id) {
    return normalizeOrder(await orders.findOne({ _id: id }));
  },
  async findOrderWithUsers(id) {
    const order = await orders.findOne({ _id: id });
    if (!order) return null;
    const client  = await users.findOne({ _id: order.client_id });
    const livreur = order.livreur_id ? await users.findOne({ _id: order.livreur_id }) : null;
    return normalizeOrder({ ...order, client_name: client?.name, client_phone: client?.phone, livreur_name: livreur?.name, livreur_phone: livreur?.phone, livreur_vehicle: livreur?.vehicle });
  },
  async getOrdersByClient(clientId) {
    const list = await orders.find({ client_id: clientId });
    list.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    return Promise.all(list.map(async o => {
      const l = o.livreur_id ? await users.findOne({ _id: o.livreur_id }) : null;
      return normalizeOrder({ ...o, livreur_name: l?.name, livreur_phone: l?.phone });
    }));
  },
  async getOrdersByLivreur(livreurId) {
    const list = await orders.find({ livreur_id: livreurId });
    list.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    return Promise.all(list.slice(0,50).map(async o => {
      const c = await users.findOne({ _id: o.client_id });
      return normalizeOrder({ ...o, client_name: c?.name, client_phone: c?.phone });
    }));
  },
  async getActiveOrdersByLivreur(livreurId) {
    const list = await orders.find({ livreur_id: livreurId, status: { $in: ['accepted','picked_up','delivering'] } });
    return Promise.all(list.map(async o => {
      const c = await users.findOne({ _id: o.client_id });
      return normalizeOrder({ ...o, client_name: c?.name, client_phone: c?.phone });
    }));
  },
  async getTodayOrdersByLivreur(livreurId) {
    const today = new Date(); today.setHours(0,0,0,0);
    const list = await orders.find({ livreur_id: livreurId, status: 'delivered' });
    const todayList = list.filter(o => o.delivered_at && new Date(o.delivered_at) >= today);
    todayList.sort((a,b) => new Date(b.delivered_at) - new Date(a.delivered_at));
    return Promise.all(todayList.map(async o => {
      const c = await users.findOne({ _id: o.client_id });
      return normalizeOrder({ ...o, client_name: c?.name });
    }));
  },
  async getPendingOrders() {
    const list = await orders.find({ status: 'pending' });
    list.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    return Promise.all(list.map(async o => {
      const c = await users.findOne({ _id: o.client_id });
      return normalizeOrder({ ...o, client_name: c?.name, client_phone: c?.phone });
    }));
  },
  async getAllOrders(filter = {}) {
    let query = {};
    if (filter.status && filter.status !== 'all') query.status = filter.status;
    let list = await orders.find(query);
    if (filter.search) {
      const re = new RegExp(escapeRegExp(filter.search), 'i');
      list = list.filter(o => re.test(o.from_address) || re.test(o.to_address));
    }
    list.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    return Promise.all(list.map(async o => {
      const c = await users.findOne({ _id: o.client_id });
      const l = o.livreur_id ? await users.findOne({ _id: o.livreur_id }) : null;
      return normalizeOrder({ ...o, client_name: c?.name, client_phone: c?.phone, livreur_name: l?.name });
    }));
  },
  async updateOrder(id, data) {
    await orders.update({ _id: id }, { $set: { ...data, updated_at: new Date().toISOString() } });
    return normalizeOrder(await orders.findOne({ _id: id }));
  },
  async acceptOrder(orderId, livreurId) {
    // Atomic: only update if still pending
    const n = await orders.update(
      { _id: orderId, status: 'pending' },
      { $set: { status: 'accepted', livreur_id: livreurId, accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() } }
    );
    if (!n) return null;
    return normalizeOrder(await orders.findOne({ _id: orderId }));
  },
  async cancelOrder(id) {
    await orders.update({ _id: id }, { $set: { status: 'cancelled', payment_status: 'cancelled', cancelled_at: new Date().toISOString(), cancelled_by: 'admin', updated_at: new Date().toISOString() } });
  },
  async deleteOrder(id) {
    await notifs.remove({ order_id: id }, { multi: true });
    return orders.remove({ _id: id }, {});
  },

  // ── Stats ──────────────────────────────────────────
  async getStats() {
    const now = new Date();
    const today = startOfToday(now);
    const week = startOfWeek(now);
    const month = startOfMonth(now);
    const allOrders = await orders.find({});
    const allUsers = await users.find({});
    const livreurs = allUsers.filter(u => u.role === 'livreur');
    const clients = allUsers.filter(u => u.role === 'client');
    const deliveredOrders = allOrders.filter(o => o.status === 'delivered');
    const todayDone = deliveredOrders.filter(o => o.delivered_at && new Date(o.delivered_at) >= today);
    const createdToday = allOrders.filter(o => o.created_at && new Date(o.created_at) >= today);
    const createdWeek = allOrders.filter(o => o.created_at && new Date(o.created_at) >= week);
    const createdMonth = allOrders.filter(o => o.created_at && new Date(o.created_at) >= month);
    const accepted = allOrders.filter(o => o.status === 'accepted').length;
    const pickedUp = allOrders.filter(o => o.status === 'picked_up').length;
    const delivering = allOrders.filter(o => o.status === 'delivering').length;
    const cancelled = allOrders.filter(o => o.status === 'cancelled').length;
    const deliveryGainsTotal = deliveredOrders.reduce((sum, order) => sum + getOrderGain(order), 0);
    const revenueTotal = deliveredOrders.reduce((sum, order) => sum + getOrderCollected(order), 0);
    const deliveryGainsToday = todayDone.reduce((sum, order) => sum + getOrderGain(order), 0);
    const revenueToday = todayDone.reduce((sum, order) => sum + getOrderCollected(order), 0);
    const foodOrders = allOrders.filter(o => o.type === 'food').length;
    const packageOrders = allOrders.filter(o => o.type !== 'food').length;
    const activeLivreurs = livreurs.filter(l => l.available).length;

    return {
      total_orders: allOrders.length,
      orders_today: createdToday.length,
      orders_week: createdWeek.length,
      orders_month: createdMonth.length,
      pending: allOrders.filter(o => o.status === 'pending').length,
      accepted,
      picked_up: pickedUp,
      delivering,
      active_deliveries: accepted + pickedUp + delivering,
      delivered_today: todayDone.length,
      delivered_total: deliveredOrders.length,
      cancelled,
      delivery_gains_today: deliveryGainsToday,
      delivery_gains_total: deliveryGainsTotal,
      revenue_today: revenueToday,
      revenue_total: revenueTotal,
      average_delivery_gain: deliveredOrders.length ? Math.round(deliveryGainsTotal / deliveredOrders.length) : 0,
      average_ticket: deliveredOrders.length ? Math.round(revenueTotal / deliveredOrders.length) : 0,
      food_orders: foodOrders,
      package_orders: packageOrders,
      active_livreurs: activeLivreurs,
      offline_livreurs: Math.max(livreurs.length - activeLivreurs, 0),
      total_livreurs: livreurs.length,
      total_clients: clients.length,
    };
  },
  async getLivreurPerformance(livreurId) {
    const list = await orders.find({ livreur_id: livreurId });
    const delivered = list.filter((order) => order.status === 'delivered');
    const active = list.filter((order) => ['accepted','picked_up','delivering'].includes(order.status));
    return {
      active_count: active.length,
      active_collected: active.reduce((sum, order) => sum + getOrderCollected(order), 0),
      period_stats: buildLivreurPeriodStats(delivered),
    };
  },
  async getLivreursWithPerformance() {
    const livreurs = await this.getLivreurs();
    const deliveredOrders = await orders.find({ status: 'delivered' });
    return livreurs.map((livreur) => {
      const livreurOrders = deliveredOrders.filter((order) => order.livreur_id === livreur._id);
      return {
        ...livreur,
        period_stats: buildLivreurPeriodStats(livreurOrders),
      };
    });
  },

  // ── Notifications ──────────────────────────────────
  async createNotif(data) {
    return notifs.insert({ ...data, read: false, created_at: new Date().toISOString() });
  },
  async getNotifsByUser(userId) {
    const list = await notifs.find({ user_id: userId });
    return list.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,30);
  },
  async markNotifsRead(userId) {
    return notifs.update({ user_id: userId }, { $set: { read: true } }, { multi: true });
  },
  async countUnreadNotifs(userId) {
    return notifs.count({ user_id: userId, read: false });
  },
  async markNotifReadForOrder(orderId, userId) {
    return notifs.update({ order_id: orderId, user_id: userId }, { $set: { read: true } }, { multi: true });
  },
  async incrementLivreurTotals(livreurId, deliveredCount, earningAmount) {
    const livreur = await users.findOne({ _id: livreurId });
    return users.update(
      { _id: livreurId },
      {
        $set: {
          total_deliveries: (livreur?.total_deliveries || 0) + Number(deliveredCount || 0),
          total_earnings: (livreur?.total_earnings || 0) + Number(earningAmount || 0),
        }
      }
    );
  },

  async getRestaurants() {
    const list = await restaurants.find({});
    return list
      .map(normalizeRestaurant)
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'fr'));
  },
  async findRestaurantById(id) {
    return normalizeRestaurant(await restaurants.findOne({ id }));
  },
  async createRestaurant(data) {
    return normalizeRestaurant(await restaurants.insert({
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  },
  async updateRestaurant(id, data) {
    await restaurants.update({ id }, { $set: { ...data, updated_at: new Date().toISOString() } });
    return this.findRestaurantById(id);
  },
  async deleteRestaurant(id) {
    return restaurants.remove({ id }, {});
  },
};

// ─── SEED ────────────────────────────────────────────
(async () => {
  const restaurantCount = await restaurants.count({});
  if (restaurantCount === 0) {
    const nowIso = new Date().toISOString();
    for (const restaurant of DEFAULT_RESTAURANTS) {
      await restaurants.insert({
        ...restaurant,
        created_at: nowIso,
        updated_at: nowIso,
      });
    }
  }

  const count = await users.count({});
  if (count > 0) return;
  console.log('🌱 Création des données de démonstration...');
  const h = p => bcrypt.hashSync(p, 10);
  const now = () => new Date().toISOString();

  await users.insert({ name: 'Admin ColloExpress', phone: 'admin', password: h('admin123'), role: 'admin', available: false, created_at: now() });

  for (const [name, phone, deliveries, earnings, rating, vehicle] of [
    ['Mohamed Khelil','livreur01',47,11750,4.9,'moto'],
    ['Amine Benhamed','livreur02',32,8000,4.8,'moto'],
    ['Sofiane Tabet',  'livreur03',28,7000,4.7,'voiture'],
    ['Riad Mansouri',  'livreur04',51,12750,4.9,'moto'],
    ['Walid Aichour',  'livreur05',19,4750,4.6,'vélo'],
    ['Nabil Hamdi',    'livreur06',8,2000,4.5,'moto'],
  ]) {
    await users.insert({ name, phone, password: h('1234'), role: 'livreur', available: true, total_deliveries: deliveries, total_earnings: earnings, rating, vehicle, created_at: now() });
  }

  const client = await users.insert({ name: 'Ahmed Belarbi', phone: '0555000001', password: h('1234'), role: 'client', created_at: now() });
  const lv = await users.find({ role: 'livreur' });

  await orders.insert({ client_id: client._id, livreur_id: lv[0]._id, from_address: 'Rue Didouche Mourad', from_quarter: 'Centre-ville', to_address: 'Cité El Wiam', to_quarter: 'Ouest', description: 'Documents', size: 'petit', price: 150, status: 'delivered', payment_status: 'collected', created_at: now(), accepted_at: now(), delivered_at: now(), updated_at: now() });
  await orders.insert({ client_id: client._id, livreur_id: lv[1]._id, from_address: 'Marché Central', from_quarter: 'Centre', to_address: 'Plage Stora', to_quarter: 'Stora', description: 'Vêtements', size: 'moyen', price: 250, status: 'delivering', payment_status: 'pending', created_at: now(), accepted_at: now(), updated_at: now() });
  await orders.insert({ client_id: client._id, from_address: 'Zone Industrielle', from_quarter: 'Zone Ind.', to_address: 'Cité 500 Logts', to_quarter: 'Nord', description: 'Equipement', size: 'grand', price: 400, status: 'pending', payment_status: 'pending', created_at: now(), updated_at: now() });

  console.log('✅ Données de démonstration créées !');
})();

module.exports = db;
