/**
 * ColloExpress — Base de données NeDB
 * NeDB = 100% JavaScript, zéro compilation, fonctionne sur Windows/Mac/Linux
 */
const Datastore = require('nedb-promises');
const bcrypt = require('bcryptjs');
const path = require('path');
const crypto = require('crypto');
const DEFAULT_RESTAURANTS = require('../data/restaurants');

const dbDir = path.join(__dirname, '../data');
require('fs').mkdirSync(dbDir, { recursive: true });

// ─── COLLECTIONS ─────────────────────────────────────
const users  = Datastore.create({ filename: path.join(dbDir, 'users.db'),  autoload: true });
const orders = Datastore.create({ filename: path.join(dbDir, 'orders.db'), autoload: true });
const notifs = Datastore.create({ filename: path.join(dbDir, 'notifs.db'), autoload: true });
const restaurants = Datastore.create({ filename: path.join(dbDir, 'restaurants.db'), autoload: true });
const pushSubscriptions = Datastore.create({ filename: path.join(dbDir, 'push_subscriptions.db'), autoload: true });
const driverSettlements = Datastore.create({ filename: path.join(dbDir, 'driver_settlements.db'), autoload: true });

users.ensureIndex({ fieldName: 'phone', unique: true });
restaurants.ensureIndex({ fieldName: 'id', unique: true });
pushSubscriptions.ensureIndex({ fieldName: 'endpoint', sparse: true });
pushSubscriptions.ensureIndex({ fieldName: 'token', sparse: true });
driverSettlements.ensureIndex({ fieldName: 'period_key', unique: true });
driverSettlements.ensureIndex({ fieldName: 'livreur_id' });

const normalizeOrder = (order) => (order ? { ...order, id: order.id || order._id } : order);
const normalizeRestaurant = (restaurant) => (restaurant ? { ...restaurant, id: restaurant.id || restaurant._id } : restaurant);
const normalizeSettlement = (settlement) => (settlement ? { ...settlement, id: settlement.id || settlement._id } : settlement);
const getOrderGain = (order = {}) => Number(order.delivery_fee ?? ((order.subtotal != null && order.price != null) ? (order.price - order.subtotal) : order.price ?? 0));
const getOrderCollected = (order = {}) => Number(order.price ?? getOrderGain(order));
const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function uid() {
  return crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : `${Date.now()}${Math.random().toString(16).slice(2)}`;
}

function roundMoney(value) {
  return Math.max(0, Math.round(Number(value || 0)));
}

function normalizeRate(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value || 0) * 100) / 100));
}

function getSettlementPeriodKey(livreurId, periodStart, periodEnd, commissionRate) {
  return `${livreurId}|${new Date(periodStart).toISOString()}|${new Date(periodEnd).toISOString()}|${normalizeRate(commissionRate)}`;
}

function buildAccountingRows(livreurs, deliveredOrders, settlements, periodStart, periodEnd, commissionRate) {
  const rate = normalizeRate(commissionRate);
  const startIso = new Date(periodStart).toISOString();
  const endIso = new Date(periodEnd).toISOString();
  const periodSettlements = settlements.filter((settlement) => (
    new Date(settlement.period_start).toISOString() === startIso &&
    new Date(settlement.period_end).toISOString() === endIso &&
    normalizeRate(settlement.commission_rate) === rate
  ));

  const rows = livreurs.map((livreur) => {
    const livreurId = livreur._id || livreur.id;
    const orderList = deliveredOrders.filter((order) => order.livreur_id === livreurId);
    const deliveryTotal = roundMoney(orderList.reduce((sum, order) => sum + getOrderGain(order), 0));
    const collectedTotal = roundMoney(orderList.reduce((sum, order) => sum + getOrderCollected(order), 0));
    const commissionDue = roundMoney(deliveryTotal * rate / 100);
    const paidRecords = periodSettlements.filter((settlement) => settlement.livreur_id === livreurId);
    const paidAmount = roundMoney(paidRecords.reduce((sum, settlement) => sum + Number(settlement.amount_paid || 0), 0));
    const remainingDue = Math.max(commissionDue - paidAmount, 0);
    const latestSettlement = paidRecords
      .slice()
      .sort((a, b) => new Date(b.paid_at || b.created_at) - new Date(a.paid_at || a.created_at))[0] || null;

    return {
      livreur,
      livreur_id: livreurId,
      delivered_count: orderList.length,
      delivery_total: deliveryTotal,
      collected_total: collectedTotal,
      commission_due: commissionDue,
      paid_amount: paidAmount,
      remaining_due: remainingDue,
      latest_settlement: latestSettlement,
      status: commissionDue === 0 ? 'empty' : remainingDue === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
    };
  });

  return rows.sort((a, b) => (
    b.remaining_due - a.remaining_due ||
    b.commission_due - a.commission_due ||
    String(a.livreur.name || '').localeCompare(String(b.livreur.name || ''), 'fr')
  ));
}

function buildDriverAccountingDetail(livreur, deliveredOrders, settlements, commissionRate) {
  const rate = normalizeRate(commissionRate);
  const sortedOrders = deliveredOrders
    .slice()
    .sort((a, b) => new Date(b.delivered_at || b.updated_at || b.created_at) - new Date(a.delivered_at || a.updated_at || a.created_at));
  const sortedSettlements = settlements
    .slice()
    .sort((a, b) => new Date(b.paid_at || b.created_at) - new Date(a.paid_at || a.created_at));
  const deliveryTotal = roundMoney(sortedOrders.reduce((sum, order) => sum + getOrderGain(order), 0));
  const collectedTotal = roundMoney(sortedOrders.reduce((sum, order) => sum + getOrderCollected(order), 0));
  const commissionDue = roundMoney(deliveryTotal * rate / 100);
  const paidAmount = roundMoney(sortedSettlements.reduce((sum, settlement) => sum + Number(settlement.amount_paid || 0), 0));
  const remainingDue = Math.max(commissionDue - paidAmount, 0);
  const now = new Date();
  const periods = [7, 10, 30].map((days) => {
    const start = new Date(now);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);
    const periodOrders = sortedOrders.filter((order) => {
      const deliveredAt = new Date(order.delivered_at || order.updated_at || order.created_at);
      return !Number.isNaN(deliveredAt.getTime()) && deliveredAt >= start;
    });
    const periodDeliveryTotal = roundMoney(periodOrders.reduce((sum, order) => sum + getOrderGain(order), 0));
    return {
      days,
      delivered_count: periodOrders.length,
      delivery_total: periodDeliveryTotal,
      collected_total: roundMoney(periodOrders.reduce((sum, order) => sum + getOrderCollected(order), 0)),
      commission_due: roundMoney(periodDeliveryTotal * rate / 100),
    };
  });

  return {
    livreur,
    commission_rate: rate,
    totals: {
      delivered_count: sortedOrders.length,
      delivery_total: deliveryTotal,
      collected_total: collectedTotal,
      commission_due: commissionDue,
      paid_amount: paidAmount,
      remaining_due: remainingDue,
    },
    periods,
    orders: sortedOrders.slice(0, 80).map((order) => ({
      ...order,
      delivery_gain: roundMoney(getOrderGain(order)),
      collected_amount: roundMoney(getOrderCollected(order)),
      commission_amount: roundMoney(getOrderGain(order) * rate / 100),
    })),
    settlements: sortedSettlements,
  };
}

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
  users, orders, notifs, restaurants, pushSubscriptions, driverSettlements,

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
  async getDriverSettlements(limit = 40) {
    const list = await driverSettlements.find({});
    const withLivreurs = await Promise.all(list.map(async (settlement) => {
      const livreur = await users.findOne({ _id: settlement.livreur_id });
      return normalizeSettlement({ ...settlement, livreur_name: livreur?.name || 'Livreur supprime' });
    }));
    return withLivreurs
      .sort((a, b) => new Date(b.paid_at || b.created_at) - new Date(a.paid_at || a.created_at))
      .slice(0, Math.max(1, Number(limit || 40)));
  },

  async getDriverAccounting({ periodStart, periodEnd, commissionRate }) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const livreurs = await this.getLivreurs();
    const allOrders = await orders.find({ status: 'delivered' });
    const deliveredOrders = allOrders.filter((order) => {
      const deliveredAt = new Date(order.delivered_at || order.updated_at || order.created_at);
      return order.livreur_id && !Number.isNaN(deliveredAt.getTime()) && deliveredAt >= start && deliveredAt <= end;
    });
    const settlements = await driverSettlements.find({});
    const rows = buildAccountingRows(livreurs, deliveredOrders, settlements, start, end, commissionRate);
    const totals = rows.reduce((acc, row) => ({
      delivered_count: acc.delivered_count + row.delivered_count,
      delivery_total: acc.delivery_total + row.delivery_total,
      collected_total: acc.collected_total + row.collected_total,
      commission_due: acc.commission_due + row.commission_due,
      paid_amount: acc.paid_amount + row.paid_amount,
      remaining_due: acc.remaining_due + row.remaining_due,
    }), { delivered_count: 0, delivery_total: 0, collected_total: 0, commission_due: 0, paid_amount: 0, remaining_due: 0 });

    return {
      period_start: start.toISOString(),
      period_end: end.toISOString(),
      commission_rate: normalizeRate(commissionRate),
      rows,
      totals,
      settlements: await this.getDriverSettlements(30),
    };
  },

  async getDriverAccountingDetail(livreurId, { commissionRate = 20 } = {}) {
    const livreur = await users.findOne({ _id: String(livreurId), role: 'livreur' });
    if (!livreur) return null;
    const deliveredOrders = await orders.find({ livreur_id: livreur._id, status: 'delivered' });
    const withClients = await Promise.all(deliveredOrders.map(async (order) => {
      const client = await users.findOne({ _id: order.client_id });
      return normalizeOrder({ ...order, client_name: client?.name || '', client_phone: client?.phone || '' });
    }));
    const livreurSettlements = await driverSettlements.find({ livreur_id: livreur._id });
    return buildDriverAccountingDetail(normalizeSettlement(livreur), withClients, livreurSettlements.map(normalizeSettlement), commissionRate);
  },

  async createDriverSettlement(data) {
    const livreurId = String(data.livreur_id || '');
    const periodStart = new Date(data.period_start);
    const periodEnd = new Date(data.period_end);
    const commissionRate = normalizeRate(data.commission_rate);
    const periodKey = getSettlementPeriodKey(livreurId, periodStart, periodEnd, commissionRate);
    const payload = {
      livreur_id: livreurId,
      period_key: periodKey,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      commission_rate: commissionRate,
      delivered_count: roundMoney(data.delivered_count),
      delivery_total: roundMoney(data.delivery_total),
      collected_total: roundMoney(data.collected_total),
      commission_due: roundMoney(data.commission_due),
      amount_paid: roundMoney(data.amount_paid ?? data.commission_due),
      notes: String(data.notes || '').slice(0, 400),
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const existing = await driverSettlements.findOne({ period_key: periodKey });
    if (existing) {
      const nextPaidAmount = Math.min(
        roundMoney(payload.commission_due),
        roundMoney(existing.amount_paid) + roundMoney(payload.amount_paid)
      );
      await driverSettlements.update({ _id: existing._id }, { $set: { ...payload, amount_paid: nextPaidAmount } });
      return normalizeSettlement(await driverSettlements.findOne({ _id: existing._id }));
    }
    return normalizeSettlement(await driverSettlements.insert({ _id: uid(), ...payload, created_at: new Date().toISOString() }));
  },

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
  async saveWebPushSubscription(userId, subscription, userAgent = '') {
    const endpoint = String(subscription?.endpoint || '').slice(0, 1200);
    const p256dh = String(subscription?.keys?.p256dh || '').slice(0, 300);
    const auth = String(subscription?.keys?.auth || '').slice(0, 300);
    if (!userId || !endpoint || !p256dh || !auth) return null;
    const payload = {
      user_id: userId,
      type: 'web',
      endpoint,
      p256dh,
      auth,
      token: null,
      platform: 'web',
      user_agent: String(userAgent || '').slice(0, 300),
      updated_at: new Date().toISOString(),
    };
    const existing = await pushSubscriptions.findOne({ endpoint });
    if (existing) {
      await pushSubscriptions.update({ _id: existing._id }, { $set: payload });
      return pushSubscriptions.findOne({ _id: existing._id });
    }
    return pushSubscriptions.insert({ ...payload, created_at: new Date().toISOString() });
  },
  async saveNativePushToken(userId, token, platform = 'android', userAgent = '') {
    const safeToken = String(token || '').slice(0, 1200);
    if (!userId || !safeToken) return null;
    const payload = {
      user_id: userId,
      type: 'native',
      endpoint: null,
      p256dh: null,
      auth: null,
      token: safeToken,
      platform: String(platform || 'android').slice(0, 40),
      user_agent: String(userAgent || '').slice(0, 300),
      updated_at: new Date().toISOString(),
    };
    const existing = await pushSubscriptions.findOne({ token: safeToken });
    if (existing) {
      await pushSubscriptions.update({ _id: existing._id }, { $set: payload });
      return pushSubscriptions.findOne({ _id: existing._id });
    }
    return pushSubscriptions.insert({ ...payload, created_at: new Date().toISOString() });
  },
  async getPushTargetsForUsers(userIds = []) {
    const ids = [...new Set(userIds.filter(Boolean).map(String))];
    if (!ids.length) return [];
    return pushSubscriptions.find({ user_id: { $in: ids } });
  },
  async getPushTargetsByRole(role) {
    const roleUsers = await users.find({ role });
    if (!roleUsers.length) return [];
    return this.getPushTargetsForUsers(roleUsers.map((user) => user._id));
  },
  async removePushTarget(id) {
    if (!id) return 0;
    return pushSubscriptions.remove({ _id: id }, {});
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
