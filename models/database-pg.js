
require('dotenv').config({ quiet: true });

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Pool } = require('pg');
const DEFAULT_RESTAURANTS = require('../data/restaurants');

function uid() {
  return crypto.randomUUID().replace(/-/g, '');
}

function toIso(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeUser(row) {
  if (!row) return null;
  return {
    ...row,
    id: row.id || row._id,
    _id: row._id || row.id,
    available: Boolean(row.available),
    total_deliveries: Number(row.total_deliveries || 0),
    total_earnings: Number(row.total_earnings || 0),
    rating: Number(row.rating || 0),
    created_at: toIso(row.created_at),
  };
}

function normalizeOrder(row) {
  if (!row) return null;
  return {
    ...row,
    id: row.id || row._id,
    _id: row._id || row.id,
    items: Array.isArray(row.items_json) ? row.items_json : Array.isArray(row.items) ? row.items : [],
    subtotal: row.subtotal == null ? null : Number(row.subtotal),
    delivery_fee: row.delivery_fee == null ? null : Number(row.delivery_fee),
    price: Number(row.price || 0),
    from_lat: row.from_lat == null ? null : Number(row.from_lat),
    from_lng: row.from_lng == null ? null : Number(row.from_lng),
    to_lat: row.to_lat == null ? null : Number(row.to_lat),
    to_lng: row.to_lng == null ? null : Number(row.to_lng),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
    accepted_at: toIso(row.accepted_at),
    delivered_at: toIso(row.delivered_at),
    cancelled_at: toIso(row.cancelled_at),
  };
}

function normalizeNotif(row) {
  if (!row) return null;
  return {
    ...row,
    id: row.id || row._id,
    _id: row._id || row.id,
    read: Boolean(row.read),
    created_at: toIso(row.created_at),
  };
}

function normalizeRestaurant(row) {
  if (!row) return null;
  return {
    ...row,
    id: row.id || row._id,
    _id: row._id || row.id,
    open: Boolean(row.open),
    rating: Number(row.rating || 0),
    deliveryFee: Number(row.delivery_fee ?? row.deliveryFee ?? 0),
    minOrder: Number(row.min_order ?? row.minOrder ?? 0),
    deliveryTime: row.delivery_time ?? row.deliveryTime ?? '',
    coverImage: row.cover_image ?? row.coverImage ?? '',
    tags: Array.isArray(row.tags_json) ? row.tags_json : Array.isArray(row.tags) ? row.tags : [],
    menu: row.menu_json && typeof row.menu_json === 'object' ? row.menu_json : row.menu || {},
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

function normalizeSettlement(row) {
  if (!row) return null;
  return {
    ...row,
    id: row.id || row._id,
    _id: row._id || row.id,
    commission_rate: Number(row.commission_rate || 0),
    delivered_count: Number(row.delivered_count || 0),
    delivery_total: Number(row.delivery_total || 0),
    collected_total: Number(row.collected_total || 0),
    commission_due: Number(row.commission_due || 0),
    amount_paid: Number(row.amount_paid || 0),
    period_start: toIso(row.period_start),
    period_end: toIso(row.period_end),
    paid_at: toIso(row.paid_at),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

const getOrderGain = (order = {}) => Number(order.delivery_fee ?? ((order.subtotal != null && order.price != null) ? (order.price - order.subtotal) : order.price ?? 0));
const getOrderCollected = (order = {}) => Number(order.price ?? getOrderGain(order));

function roundMoney(value) {
  return Math.max(0, Math.round(Number(value || 0)));
}

function normalizeRate(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value || 0) * 100) / 100));
}

function getSettlementPeriodKey(livreurId, periodStart, periodEnd, commissionRate) {
  return `${livreurId}|${new Date(periodStart).toISOString()}|${new Date(periodEnd).toISOString()}|${normalizeRate(commissionRate)}`;
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

function uniqueError(error) {
  if (error && error.code === '23505') {
    error.errorType = 'uniqueViolated';
  }
  return error;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 10000),
  connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 10000),
  keepAlive: true,
  maxUses: Number(process.env.PG_MAX_USES || 7500),
  allowExitOnIdle: false,
  application_name: 'colloexpress',
  statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 10000),
  query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS || 10000),
});

const ready = (async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      vehicle TEXT,
      available BOOLEAN NOT NULL DEFAULT FALSE,
      total_deliveries INTEGER NOT NULL DEFAULT 0,
      total_earnings INTEGER NOT NULL DEFAULT 0,
      rating NUMERIC(4,2) NOT NULL DEFAULT 5,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      livreur_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      type TEXT,
      resto_id TEXT,
      resto_name TEXT,
      from_address TEXT NOT NULL,
      from_quarter TEXT,
      from_lat DOUBLE PRECISION,
      from_lng DOUBLE PRECISION,
      to_address TEXT NOT NULL,
      to_quarter TEXT,
      to_lat DOUBLE PRECISION,
      to_lng DOUBLE PRECISION,
      description TEXT,
      items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      notes TEXT,
      size TEXT,
      price INTEGER NOT NULL DEFAULT 0,
      subtotal INTEGER,
      delivery_fee INTEGER,
      status TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      accepted_at TIMESTAMPTZ,
      delivered_at TIMESTAMPTZ,
      cancelled_at TIMESTAMPTZ,
      cancelled_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT,
      title TEXT,
      message TEXT,
      order_id TEXT,
      read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      description TEXT,
      address TEXT,
      lat DOUBLE PRECISION,
      lng DOUBLE PRECISION,
      rating NUMERIC(4,2) NOT NULL DEFAULT 5,
      delivery_time TEXT,
      delivery_fee INTEGER NOT NULL DEFAULT 0,
      min_order INTEGER NOT NULL DEFAULT 0,
      open BOOLEAN NOT NULL DEFAULT TRUE,
      tags_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      image TEXT,
      cover_image TEXT,
      menu_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      endpoint TEXT,
      p256dh TEXT,
      auth TEXT,
      token TEXT,
      platform TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS driver_settlements (
      id TEXT PRIMARY KEY,
      livreur_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      period_key TEXT NOT NULL UNIQUE,
      period_start TIMESTAMPTZ NOT NULL,
      period_end TIMESTAMPTZ NOT NULL,
      commission_rate NUMERIC(5,2) NOT NULL,
      delivered_count INTEGER NOT NULL DEFAULT 0,
      delivery_total INTEGER NOT NULL DEFAULT 0,
      collected_total INTEGER NOT NULL DEFAULT 0,
      commission_due INTEGER NOT NULL DEFAULT 0,
      amount_paid INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_livreur_id ON orders(livreur_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON orders(delivered_at DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_livreur_status ON orders(livreur_id, status, created_at DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created_at ON notifications(user_id, read, created_at DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_users_role_available ON users(role, available)');
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint) WHERE endpoint IS NOT NULL');
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_token ON push_subscriptions(token) WHERE token IS NOT NULL');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_push_subscriptions_type ON push_subscriptions(type)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_restaurants_open ON restaurants(open)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_driver_settlements_livreur_id ON driver_settlements(livreur_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_driver_settlements_period ON driver_settlements(period_start DESC, period_end DESC)');

  const existingRestaurants = await pool.query('SELECT COUNT(*)::int AS total FROM restaurants');
  if (Number(existingRestaurants.rows[0]?.total || 0) === 0) {
    for (const restaurant of DEFAULT_RESTAURANTS) {
      await pool.query(
        `INSERT INTO restaurants (
          id, name, category, description, address, lat, lng, rating, delivery_time, delivery_fee,
          min_order, open, tags_json, image, cover_image, menu_json, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13::jsonb, $14, $15, $16::jsonb, $17, $18
        )
        ON CONFLICT (id) DO NOTHING`,
        [
          restaurant.id,
          restaurant.name,
          restaurant.category || '',
          restaurant.description || '',
          restaurant.address || '',
          restaurant.lat == null ? null : Number(restaurant.lat),
          restaurant.lng == null ? null : Number(restaurant.lng),
          Number(restaurant.rating || 5),
          restaurant.deliveryTime || '',
          Number(restaurant.deliveryFee || 0),
          Number(restaurant.minOrder || 0),
          Boolean(restaurant.open),
          JSON.stringify(restaurant.tags || []),
          restaurant.image || '',
          restaurant.coverImage || restaurant.image || '',
          JSON.stringify(restaurant.menu || {}),
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );
    }
  }

  const existingAdmin = await pool.query('SELECT id FROM users WHERE phone = $1 LIMIT 1', ['admin']);
  if (existingAdmin.rowCount === 0) {
    await pool.query(
      'INSERT INTO users (id, name, phone, password, role, available, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [uid(), 'Admin ColloExpress', 'admin', bcrypt.hashSync('admin123', 10), 'admin', false, new Date().toISOString()]
    );
  }
})();

async function ensureReady() {
  await ready;
}
const db = {
  isPostgres: true,
  ready,

  async findUserByPhone(phone) {
    await ensureReady();
    const { rows } = await pool.query('SELECT * FROM users WHERE phone = $1 LIMIT 1', [phone]);
    return normalizeUser(rows[0]);
  },

  async findUserById(id) {
    await ensureReady();
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    return normalizeUser(rows[0]);
  },

  async createUser(data) {
    await ensureReady();
    try {
      const { rows } = await pool.query(
        `INSERT INTO users (id, name, phone, password, role, vehicle, available, total_deliveries, total_earnings, rating, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          data._id || data.id || uid(),
          data.name,
          data.phone,
          data.password,
          data.role,
          data.vehicle || null,
          Boolean(data.available),
          Number(data.total_deliveries || 0),
          Number(data.total_earnings || 0),
          Number(data.rating ?? 5),
          data.created_at || new Date().toISOString(),
        ]
      );
      return normalizeUser(rows[0]);
    } catch (error) {
      throw uniqueError(error);
    }
  },

  async updateUser(id, data) {
    await ensureReady();
    const allowed = ['name', 'phone', 'password', 'role', 'vehicle', 'available', 'total_deliveries', 'total_earnings', 'rating', 'created_at'];
    const entries = Object.entries(data).filter(([key, value]) => allowed.includes(key) && value !== undefined);
    if (!entries.length) return this.findUserById(id);
    const values = entries.map(([, value]) => value);
    const clause = entries.map(([key], index) => `${key} = $${index + 1}`).join(', ');
    const { rows } = await pool.query(`UPDATE users SET ${clause} WHERE id = $${values.length + 1} RETURNING *`, [...values, id]);
    return normalizeUser(rows[0]);
  },

  async getLivreurs() {
    await ensureReady();
    const { rows } = await pool.query("SELECT * FROM users WHERE role = 'livreur' ORDER BY total_deliveries DESC, created_at DESC");
    return rows.map(normalizeUser);
  },

  async getAvailableLivreurs() {
    await ensureReady();
    const { rows } = await pool.query("SELECT * FROM users WHERE role = 'livreur' AND available = TRUE ORDER BY total_deliveries DESC");
    return rows.map(normalizeUser);
  },

  async getClients() {
    await ensureReady();
    const { rows } = await pool.query(`
      SELECT u.*, COUNT(o.id)::int AS order_count
      FROM users u
      LEFT JOIN orders o ON o.client_id = u.id
      WHERE u.role = 'client'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    return rows.map((row) => ({ ...normalizeUser(row), order_count: Number(row.order_count || 0) }));
  },

  async deleteLivreur(id) {
    await ensureReady();
    const result = await pool.query("DELETE FROM users WHERE id = $1 AND role = 'livreur'", [id]);
    return result.rowCount;
  },

  async createOrder(data) {
    await ensureReady();
    const { rows } = await pool.query(
      `INSERT INTO orders (
        id, client_id, livreur_id, type, resto_id, resto_name, from_address, from_quarter, from_lat, from_lng,
        to_address, to_quarter, to_lat, to_lng, description, items_json, notes, size, price, subtotal,
        delivery_fee, status, payment_status, accepted_at, delivered_at, cancelled_at, cancelled_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16::jsonb, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29
      ) RETURNING *`,
      [
        data._id || data.id || uid(),
        data.client_id,
        data.livreur_id || null,
        data.type || null,
        data.resto_id || null,
        data.resto_name || null,
        data.from_address,
        data.from_quarter || '',
        data.from_lat == null ? null : Number(data.from_lat),
        data.from_lng == null ? null : Number(data.from_lng),
        data.to_address,
        data.to_quarter || '',
        data.to_lat == null ? null : Number(data.to_lat),
        data.to_lng == null ? null : Number(data.to_lng),
        data.description || '',
        JSON.stringify(data.items || []),
        data.notes || '',
        data.size || null,
        Number(data.price || 0),
        data.subtotal == null ? null : Number(data.subtotal),
        data.delivery_fee == null ? null : Number(data.delivery_fee),
        data.status || 'pending',
        data.payment_status || 'pending',
        data.accepted_at || null,
        data.delivered_at || null,
        data.cancelled_at || null,
        data.cancelled_by || null,
        data.created_at || new Date().toISOString(),
        data.updated_at || data.created_at || new Date().toISOString(),
      ]
    );
    return normalizeOrder(rows[0]);
  },

  async findOrderById(id) {
    await ensureReady();
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1 LIMIT 1', [id]);
    return normalizeOrder(rows[0]);
  },

  async findOrderWithUsers(id) {
    await ensureReady();
    const { rows } = await pool.query(`
      SELECT o.*, c.name AS client_name, c.phone AS client_phone, l.name AS livreur_name, l.phone AS livreur_phone, l.vehicle AS livreur_vehicle
      FROM orders o
      LEFT JOIN users c ON c.id = o.client_id
      LEFT JOIN users l ON l.id = o.livreur_id
      WHERE o.id = $1
      LIMIT 1
    `, [id]);
    return normalizeOrder(rows[0]);
  },

  async getOrdersByClient(clientId) {
    await ensureReady();
    const { rows } = await pool.query(`
      SELECT o.*, l.name AS livreur_name, l.phone AS livreur_phone
      FROM orders o
      LEFT JOIN users l ON l.id = o.livreur_id
      WHERE o.client_id = $1
      ORDER BY o.created_at DESC
    `, [clientId]);
    return rows.map(normalizeOrder);
  },

  async getOrdersByLivreur(livreurId) {
    await ensureReady();
    const { rows } = await pool.query(`
      SELECT o.*, c.name AS client_name, c.phone AS client_phone
      FROM orders o
      LEFT JOIN users c ON c.id = o.client_id
      WHERE o.livreur_id = $1
      ORDER BY o.created_at DESC
      LIMIT 50
    `, [livreurId]);
    return rows.map(normalizeOrder);
  },
  async getActiveOrdersByLivreur(livreurId) {
    await ensureReady();
    const { rows } = await pool.query(`
      SELECT o.*, c.name AS client_name, c.phone AS client_phone
      FROM orders o
      LEFT JOIN users c ON c.id = o.client_id
      WHERE o.livreur_id = $1 AND o.status = ANY($2)
      ORDER BY o.created_at DESC
    `, [livreurId, ['accepted', 'picked_up', 'delivering']]);
    return rows.map(normalizeOrder);
  },

  async getTodayOrdersByLivreur(livreurId) {
    await ensureReady();
    const { rows } = await pool.query(`
      SELECT o.*, c.name AS client_name
      FROM orders o
      LEFT JOIN users c ON c.id = o.client_id
      WHERE o.livreur_id = $1 AND o.status = 'delivered' AND o.delivered_at >= $2
      ORDER BY o.delivered_at DESC
    `, [livreurId, startOfToday().toISOString()]);
    return rows.map(normalizeOrder);
  },

  async getPendingOrders() {
    await ensureReady();
    const { rows } = await pool.query(`
      SELECT o.*, c.name AS client_name, c.phone AS client_phone
      FROM orders o
      LEFT JOIN users c ON c.id = o.client_id
      WHERE o.status = 'pending'
      ORDER BY o.created_at DESC
    `);
    return rows.map(normalizeOrder);
  },

  async getAllOrders(filter = {}) {
    await ensureReady();
    const conditions = [];
    const values = [];
    if (filter.status && filter.status !== 'all') {
      values.push(filter.status);
      conditions.push(`o.status = $${values.length}`);
    }
    if (filter.search) {
      values.push(`%${filter.search}%`);
      conditions.push(`(o.from_address ILIKE $${values.length} OR o.to_address ILIKE $${values.length} OR COALESCE(o.description, '') ILIKE $${values.length})`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(`
      SELECT o.*, c.name AS client_name, c.phone AS client_phone, l.name AS livreur_name
      FROM orders o
      LEFT JOIN users c ON c.id = o.client_id
      LEFT JOIN users l ON l.id = o.livreur_id
      ${where}
      ORDER BY o.created_at DESC
    `, values);
    return rows.map(normalizeOrder);
  },

  async updateOrder(id, data) {
    await ensureReady();
    const nextData = { ...data, updated_at: new Date().toISOString() };
    if (nextData.items) {
      nextData.items_json = JSON.stringify(nextData.items);
      delete nextData.items;
    }
    const allowed = [
      'client_id', 'livreur_id', 'type', 'resto_id', 'resto_name', 'from_address', 'from_quarter', 'from_lat', 'from_lng',
      'to_address', 'to_quarter', 'to_lat', 'to_lng', 'description', 'items_json', 'notes', 'size', 'price', 'subtotal',
      'delivery_fee', 'status', 'payment_status', 'accepted_at', 'delivered_at', 'cancelled_at', 'cancelled_by', 'created_at', 'updated_at'
    ];
    const entries = Object.entries(nextData).filter(([key, value]) => allowed.includes(key) && value !== undefined);
    if (!entries.length) return this.findOrderById(id);
    const values = entries.map(([, value]) => value);
    const clause = entries.map(([key], index) => key === 'items_json' ? `${key} = $${index + 1}::jsonb` : `${key} = $${index + 1}`).join(', ');
    const { rows } = await pool.query(`UPDATE orders SET ${clause} WHERE id = $${values.length + 1} RETURNING *`, [...values, id]);
    return normalizeOrder(rows[0]);
  },

  async acceptOrder(orderId, livreurId) {
    await ensureReady();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `UPDATE orders
         SET status = 'accepted', livreur_id = $2, accepted_at = $3, updated_at = $3
         WHERE id = $1 AND status = 'pending'
         RETURNING *`,
        [orderId, livreurId, new Date().toISOString()]
      );
      await client.query('COMMIT');
      if (!result.rowCount) return null;
      return normalizeOrder(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async cancelOrder(id) {
    await ensureReady();
    const now = new Date().toISOString();
    await pool.query(
      `UPDATE orders
       SET status = $2,
           payment_status = $3,
           cancelled_at = $4,
           cancelled_by = $5,
           updated_at = $4
       WHERE id = $1`,
      [id, 'cancelled', 'cancelled', now, 'admin']
    );
  },

  async deleteOrder(id) {
    await ensureReady();
    await pool.query('DELETE FROM notifications WHERE order_id = $1', [id]);
    const result = await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    return result.rowCount;
  },

  async createNotif(data) {
    await ensureReady();
    const { rows } = await pool.query(
      `INSERT INTO notifications (id, user_id, type, title, message, order_id, read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [data._id || data.id || uid(), data.user_id, data.type || null, data.title || '', data.message || '', data.order_id || null, Boolean(data.read), data.created_at || new Date().toISOString()]
    );
    return normalizeNotif(rows[0]);
  },

  async getNotifsByUser(userId) {
    await ensureReady();
    const { rows } = await pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30', [userId]);
    return rows.map(normalizeNotif);
  },

  async markNotifsRead(userId) {
    await ensureReady();
    await pool.query('UPDATE notifications SET read = TRUE WHERE user_id = $1', [userId]);
  },

  async countUnreadNotifs(userId) {
    await ensureReady();
    const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM notifications WHERE user_id = $1 AND read = FALSE', [userId]);
    return Number(rows[0]?.total || 0);
  },

  async markNotifReadForOrder(orderId, userId) {
    await ensureReady();
    await pool.query('UPDATE notifications SET read = TRUE WHERE order_id = $1 AND user_id = $2', [orderId, userId]);
  },

  async saveWebPushSubscription(userId, subscription, userAgent = '') {
    await ensureReady();
    const endpoint = String(subscription?.endpoint || '').slice(0, 1200);
    const p256dh = String(subscription?.keys?.p256dh || '').slice(0, 300);
    const auth = String(subscription?.keys?.auth || '').slice(0, 300);
    if (!userId || !endpoint || !p256dh || !auth) return null;
    const { rows } = await pool.query(
      `INSERT INTO push_subscriptions (
        id, user_id, type, endpoint, p256dh, auth, token, platform, user_agent, created_at, updated_at
      ) VALUES (
        $1, $2, 'web', $3, $4, $5, NULL, 'web', $6, NOW(), NOW()
      )
      ON CONFLICT (endpoint) WHERE endpoint IS NOT NULL DO UPDATE SET
        user_id = EXCLUDED.user_id,
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        user_agent = EXCLUDED.user_agent,
        updated_at = NOW()
      RETURNING *`,
      [uid(), userId, endpoint, p256dh, auth, String(userAgent || '').slice(0, 300)]
    );
    return rows[0] || null;
  },

  async saveNativePushToken(userId, token, platform = 'android', userAgent = '') {
    await ensureReady();
    const safeToken = String(token || '').slice(0, 1200);
    if (!userId || !safeToken) return null;
    const { rows } = await pool.query(
      `INSERT INTO push_subscriptions (
        id, user_id, type, endpoint, p256dh, auth, token, platform, user_agent, created_at, updated_at
      ) VALUES (
        $1, $2, 'native', NULL, NULL, NULL, $3, $4, $5, NOW(), NOW()
      )
      ON CONFLICT (token) WHERE token IS NOT NULL DO UPDATE SET
        user_id = EXCLUDED.user_id,
        platform = EXCLUDED.platform,
        user_agent = EXCLUDED.user_agent,
        updated_at = NOW()
      RETURNING *`,
      [uid(), userId, safeToken, String(platform || 'android').slice(0, 40), String(userAgent || '').slice(0, 300)]
    );
    return rows[0] || null;
  },

  async getPushTargetsForUsers(userIds = []) {
    await ensureReady();
    const ids = [...new Set(userIds.filter(Boolean).map(String))];
    if (!ids.length) return [];
    const { rows } = await pool.query('SELECT * FROM push_subscriptions WHERE user_id = ANY($1::text[])', [ids]);
    return rows;
  },

  async getPushTargetsByRole(role) {
    await ensureReady();
    const { rows } = await pool.query(
      `SELECT ps.*
       FROM push_subscriptions ps
       JOIN users u ON u.id = ps.user_id
       WHERE u.role = $1`,
      [role]
    );
    return rows;
  },

  async removePushTarget(id) {
    await ensureReady();
    const result = await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [id]);
    return result.rowCount;
  },

  async incrementLivreurTotals(livreurId, deliveredCount, earningAmount) {
    await ensureReady();
    await pool.query(
      `UPDATE users
       SET total_deliveries = COALESCE(total_deliveries, 0) + $2,
           total_earnings = COALESCE(total_earnings, 0) + $3
       WHERE id = $1`,
      [livreurId, Number(deliveredCount || 0), Number(earningAmount || 0)]
    );
  },

  async getRestaurants() {
    await ensureReady();
    const { rows } = await pool.query('SELECT * FROM restaurants ORDER BY name ASC');
    return rows.map(normalizeRestaurant);
  },

  async findRestaurantById(id) {
    await ensureReady();
    const { rows } = await pool.query('SELECT * FROM restaurants WHERE id = $1 LIMIT 1', [id]);
    return normalizeRestaurant(rows[0]);
  },

  async createRestaurant(data) {
    await ensureReady();
    const { rows } = await pool.query(
      `INSERT INTO restaurants (
        id, name, category, description, address, lat, lng, rating, delivery_time, delivery_fee,
        min_order, open, tags_json, image, cover_image, menu_json, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13::jsonb, $14, $15, $16::jsonb, $17, $18
      ) RETURNING *`,
      [
        data.id,
        data.name,
        data.category || '',
        data.description || '',
        data.address || '',
        data.lat == null ? null : Number(data.lat),
        data.lng == null ? null : Number(data.lng),
        Number(data.rating || 5),
        data.deliveryTime || '',
        Number(data.deliveryFee || 0),
        Number(data.minOrder || 0),
        Boolean(data.open),
        JSON.stringify(data.tags || []),
        data.image || '',
        data.coverImage || data.image || '',
        JSON.stringify(data.menu || {}),
        new Date().toISOString(),
        new Date().toISOString(),
      ]
    );
    return normalizeRestaurant(rows[0]);
  },

  async updateRestaurant(id, data) {
    await ensureReady();
    const values = [
      data.name,
      data.category || '',
      data.description || '',
      data.address || '',
      data.lat == null ? null : Number(data.lat),
      data.lng == null ? null : Number(data.lng),
      Number(data.rating || 5),
      data.deliveryTime || '',
      Number(data.deliveryFee || 0),
      Number(data.minOrder || 0),
      Boolean(data.open),
      JSON.stringify(data.tags || []),
      data.image || '',
      data.coverImage || data.image || '',
      JSON.stringify(data.menu || {}),
      new Date().toISOString(),
      id,
    ];
    const { rows } = await pool.query(
      `UPDATE restaurants
       SET name = $1,
           category = $2,
           description = $3,
           address = $4,
           lat = $5,
           lng = $6,
           rating = $7,
           delivery_time = $8,
           delivery_fee = $9,
           min_order = $10,
           open = $11,
           tags_json = $12::jsonb,
           image = $13,
           cover_image = $14,
           menu_json = $15::jsonb,
           updated_at = $16
       WHERE id = $17
       RETURNING *`,
      values
    );
    return normalizeRestaurant(rows[0]);
  },

  async deleteRestaurant(id) {
    await ensureReady();
    const result = await pool.query('DELETE FROM restaurants WHERE id = $1', [id]);
    return result.rowCount;
  },

  async getStats() {
    const allOrders = await this.getAllOrders();
    const livreurs = await this.getLivreurs();
    const clients = await this.getClients();
    const today = startOfToday();
    const week = startOfWeek();
    const month = startOfMonth();
    const deliveredOrders = allOrders.filter((order) => order.status === 'delivered');
    const todayDone = deliveredOrders.filter((order) => order.delivered_at && new Date(order.delivered_at) >= today);
    const createdToday = allOrders.filter((order) => order.created_at && new Date(order.created_at) >= today);
    const createdWeek = allOrders.filter((order) => order.created_at && new Date(order.created_at) >= week);
    const createdMonth = allOrders.filter((order) => order.created_at && new Date(order.created_at) >= month);
    const accepted = allOrders.filter((order) => order.status === 'accepted').length;
    const pickedUp = allOrders.filter((order) => order.status === 'picked_up').length;
    const delivering = allOrders.filter((order) => order.status === 'delivering').length;
    const cancelled = allOrders.filter((order) => order.status === 'cancelled').length;
    const deliveryGainsTotal = deliveredOrders.reduce((sum, order) => sum + getOrderGain(order), 0);
    const revenueTotal = deliveredOrders.reduce((sum, order) => sum + getOrderCollected(order), 0);
    const deliveryGainsToday = todayDone.reduce((sum, order) => sum + getOrderGain(order), 0);
    const revenueToday = todayDone.reduce((sum, order) => sum + getOrderCollected(order), 0);
    const foodOrders = allOrders.filter((order) => order.type === 'food').length;
    const packageOrders = allOrders.filter((order) => order.type !== 'food').length;
    const activeLivreurs = livreurs.filter((livreur) => livreur.available).length;

    return {
      total_orders: allOrders.length,
      orders_today: createdToday.length,
      orders_week: createdWeek.length,
      orders_month: createdMonth.length,
      pending: allOrders.filter((order) => order.status === 'pending').length,
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
    const list = await this.getOrdersByLivreur(livreurId);
    const delivered = list.filter((order) => order.status === 'delivered');
    const active = list.filter((order) => ['accepted', 'picked_up', 'delivering'].includes(order.status));
    return {
      active_count: active.length,
      active_collected: active.reduce((sum, order) => sum + getOrderCollected(order), 0),
      period_stats: buildLivreurPeriodStats(delivered),
    };
  },

  async getLivreursWithPerformance() {
    const livreurs = await this.getLivreurs();
    const deliveredOrders = (await this.getAllOrders()).filter((order) => order.status === 'delivered');
    return livreurs.map((livreur) => ({
      ...livreur,
      period_stats: buildLivreurPeriodStats(deliveredOrders.filter((order) => order.livreur_id === livreur._id)),
    }));
  },

  async getDriverSettlements(limit = 40) {
    await ensureReady();
    const { rows } = await pool.query(
      `SELECT ds.*, u.name AS livreur_name
         FROM driver_settlements ds
         LEFT JOIN users u ON u.id = ds.livreur_id
        ORDER BY ds.paid_at DESC, ds.created_at DESC
        LIMIT $1`,
      [Math.max(1, Number(limit || 40))]
    );
    return rows.map((row) => normalizeSettlement({ ...row, livreur_name: row.livreur_name || 'Livreur supprime' }));
  },

  async getDriverAccounting({ periodStart, periodEnd, commissionRate }) {
    await ensureReady();
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const livreurs = await this.getLivreurs();
    const allOrders = await this.getAllOrders();
    const deliveredOrders = allOrders.filter((order) => {
      const deliveredAt = new Date(order.delivered_at || order.updated_at || order.created_at);
      return order.status === 'delivered' && order.livreur_id && !Number.isNaN(deliveredAt.getTime()) && deliveredAt >= start && deliveredAt <= end;
    });
    const { rows: settlementRows } = await pool.query('SELECT * FROM driver_settlements');
    const settlements = settlementRows.map(normalizeSettlement);
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
    await ensureReady();
    const livreur = await this.findUserById(String(livreurId));
    if (!livreur || livreur.role !== 'livreur') return null;
    const allOrders = await this.getAllOrders();
    const deliveredOrders = allOrders.filter((order) => order.livreur_id === livreur._id && order.status === 'delivered');
    const { rows } = await pool.query(
      'SELECT * FROM driver_settlements WHERE livreur_id = $1 ORDER BY paid_at DESC, created_at DESC',
      [livreur._id]
    );
    return buildDriverAccountingDetail(livreur, deliveredOrders, rows.map(normalizeSettlement), commissionRate);
  },

  async createDriverSettlement(data) {
    await ensureReady();
    const livreurId = String(data.livreur_id || '');
    const periodStart = new Date(data.period_start);
    const periodEnd = new Date(data.period_end);
    const commissionRate = normalizeRate(data.commission_rate);
    const periodKey = getSettlementPeriodKey(livreurId, periodStart, periodEnd, commissionRate);
    const values = [
      data.id || data._id || uid(),
      livreurId,
      periodKey,
      periodStart.toISOString(),
      periodEnd.toISOString(),
      commissionRate,
      roundMoney(data.delivered_count),
      roundMoney(data.delivery_total),
      roundMoney(data.collected_total),
      roundMoney(data.commission_due),
      roundMoney(data.amount_paid ?? data.commission_due),
      String(data.notes || '').slice(0, 400),
      new Date().toISOString(),
    ];
    const { rows } = await pool.query(
      `INSERT INTO driver_settlements (
        id, livreur_id, period_key, period_start, period_end, commission_rate, delivered_count,
        delivery_total, collected_total, commission_due, amount_paid, notes, paid_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, NOW(), NOW()
      )
      ON CONFLICT (period_key) DO UPDATE SET
        delivered_count = EXCLUDED.delivered_count,
        delivery_total = EXCLUDED.delivery_total,
        collected_total = EXCLUDED.collected_total,
        commission_due = EXCLUDED.commission_due,
        amount_paid = LEAST(EXCLUDED.commission_due, driver_settlements.amount_paid + EXCLUDED.amount_paid),
        notes = EXCLUDED.notes,
        paid_at = EXCLUDED.paid_at,
        updated_at = NOW()
      RETURNING *`,
      values
    );
    return normalizeSettlement(rows[0]);
  },

  async upsertUser(data) {
    await ensureReady();
    try {
      const existing = await pool.query('SELECT id FROM users WHERE id = $1 OR phone = $2 LIMIT 1', [data._id || data.id || '', data.phone]);
      if (existing.rowCount) {
        const existingId = existing.rows[0].id;
        const { rows } = await pool.query(
          `UPDATE users
             SET name = $1,
                 phone = $2,
                 password = $3,
                 role = $4,
                 vehicle = $5,
                 available = $6,
                 total_deliveries = $7,
                 total_earnings = $8,
                 rating = $9,
                 created_at = $10
           WHERE id = $11
           RETURNING *`,
          [
            data.name,
            data.phone,
            data.password,
            data.role,
            data.vehicle || null,
            Boolean(data.available),
            Number(data.total_deliveries || 0),
            Number(data.total_earnings || 0),
            Number(data.rating ?? 5),
            data.created_at || new Date().toISOString(),
            existingId,
          ]
        );
        return normalizeUser(rows[0]);
      }

      const { rows } = await pool.query(
        `INSERT INTO users (id, name, phone, password, role, vehicle, available, total_deliveries, total_earnings, rating, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [data._id || data.id || uid(), data.name, data.phone, data.password, data.role, data.vehicle || null, Boolean(data.available), Number(data.total_deliveries || 0), Number(data.total_earnings || 0), Number(data.rating ?? 5), data.created_at || new Date().toISOString()]
      );
      return normalizeUser(rows[0]);
    } catch (error) {
      throw uniqueError(error);
    }
  },

  async upsertOrder(data) {
    await ensureReady();
    const { rows } = await pool.query(
      `INSERT INTO orders (
        id, client_id, livreur_id, type, resto_id, resto_name, from_address, from_quarter, from_lat, from_lng,
        to_address, to_quarter, to_lat, to_lng, description, items_json, notes, size, price, subtotal,
        delivery_fee, status, payment_status, accepted_at, delivered_at, cancelled_at, cancelled_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16::jsonb, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29
      )
      ON CONFLICT (id) DO UPDATE SET
        client_id = EXCLUDED.client_id,
        livreur_id = EXCLUDED.livreur_id,
        type = EXCLUDED.type,
        resto_id = EXCLUDED.resto_id,
        resto_name = EXCLUDED.resto_name,
        from_address = EXCLUDED.from_address,
        from_quarter = EXCLUDED.from_quarter,
        from_lat = EXCLUDED.from_lat,
        from_lng = EXCLUDED.from_lng,
        to_address = EXCLUDED.to_address,
        to_quarter = EXCLUDED.to_quarter,
        to_lat = EXCLUDED.to_lat,
        to_lng = EXCLUDED.to_lng,
        description = EXCLUDED.description,
        items_json = EXCLUDED.items_json,
        notes = EXCLUDED.notes,
        size = EXCLUDED.size,
        price = EXCLUDED.price,
        subtotal = EXCLUDED.subtotal,
        delivery_fee = EXCLUDED.delivery_fee,
        status = EXCLUDED.status,
        payment_status = EXCLUDED.payment_status,
        accepted_at = EXCLUDED.accepted_at,
        delivered_at = EXCLUDED.delivered_at,
        cancelled_at = EXCLUDED.cancelled_at,
        cancelled_by = EXCLUDED.cancelled_by,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at
      RETURNING *`,
      [
        data._id || data.id || uid(), data.client_id, data.livreur_id || null, data.type || null, data.resto_id || null, data.resto_name || null,
        data.from_address, data.from_quarter || '', data.from_lat == null ? null : Number(data.from_lat), data.from_lng == null ? null : Number(data.from_lng),
        data.to_address, data.to_quarter || '', data.to_lat == null ? null : Number(data.to_lat), data.to_lng == null ? null : Number(data.to_lng),
        data.description || '', JSON.stringify(data.items || []), data.notes || '', data.size || null, Number(data.price || 0), data.subtotal == null ? null : Number(data.subtotal),
        data.delivery_fee == null ? null : Number(data.delivery_fee), data.status || 'pending', data.payment_status || 'pending', data.accepted_at || null, data.delivered_at || null,
        data.cancelled_at || null, data.cancelled_by || null, data.created_at || new Date().toISOString(), data.updated_at || data.created_at || new Date().toISOString(),
      ]
    );
    return normalizeOrder(rows[0]);
  },

  async upsertNotif(data) {
    await ensureReady();
    const { rows } = await pool.query(
      `INSERT INTO notifications (id, user_id, type, title, message, order_id, read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         type = EXCLUDED.type,
         title = EXCLUDED.title,
         message = EXCLUDED.message,
         order_id = EXCLUDED.order_id,
         read = EXCLUDED.read,
         created_at = EXCLUDED.created_at
       RETURNING *`,
      [data._id || data.id || uid(), data.user_id, data.type || null, data.title || '', data.message || '', data.order_id || null, Boolean(data.read), data.created_at || new Date().toISOString()]
    );
    return normalizeNotif(rows[0]);
  },
};

module.exports = db;
