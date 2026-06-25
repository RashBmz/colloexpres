const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../models/db');
const { createRateLimiter, getClientKey } = require('../middleware/security');
const { cleanName, cleanPhone, cleanString, cleanTextBlock, toSafeNumber } = require('../utils/input');

const adminWriteLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 180,
  methods: ['POST', 'PATCH', 'DELETE'],
  keyFn: (req) => `admin:${getClientKey(req)}`,
  message: 'Trop d actions admin en peu de temps, reessayez dans quelques minutes',
});

function slugify(value) {
  return cleanString(value, 80)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function parseTags(value) {
  return cleanString(value, 200)
    .split(',')
    .map((tag) => cleanString(tag, 30))
    .filter(Boolean)
    .slice(0, 10);
}

function parseMenuJson(value) {
  const raw = cleanTextBlock(value, 60000);
  if (!raw) return {};
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('MENU_JSON_INVALID');
  }
  return parsed;
}

function formatMenuJson(menu) {
  return JSON.stringify(menu || {}, null, 2);
}

function buildRestaurantPayload(body, existingId = '') {
  const name = cleanName(body.name);
  const id = existingId || slugify(body.id || name);
  const menu = parseMenuJson(body.menu_json);

  return {
    id,
    name,
    category: cleanString(body.category, 120),
    description: cleanTextBlock(body.description, 500),
    address: cleanString(body.address, 180),
    lat: body.lat === '' ? null : toSafeNumber(body.lat, null),
    lng: body.lng === '' ? null : toSafeNumber(body.lng, null),
    rating: Math.max(0, Math.min(5, toSafeNumber(body.rating, 5))),
    deliveryTime: cleanString(body.delivery_time, 40),
    deliveryFee: Math.max(0, Math.round(toSafeNumber(body.delivery_fee, 0))),
    minOrder: Math.max(0, Math.round(toSafeNumber(body.min_order, 0))),
    open: cleanString(body.open, 10) === 'true',
    tags: parseTags(body.tags),
    image: cleanString(body.image, 500),
    coverImage: cleanString(body.cover_image || body.image, 500),
    menu,
  };
}

router.get('/dashboard', async (req, res) => {
  const stats = await db.getStats();
  const recentOrders = (await db.getAllOrders()).slice(0, 8);
  const livreurs = (await db.getLivreursWithPerformance()).slice(0, 6);
  res.render('admin/dashboard', { stats, recentOrders, livreurs });
});

router.get('/commandes', async (req, res) => {
  const status = cleanString(req.query.status || 'all', 20);
  const search = cleanString(req.query.search || '', 80);
  const orders = await db.getAllOrders({ status, search });
  res.render('admin/orders', { orders, status: status || 'all', search });
});

router.get('/restaurants', async (req, res) => {
  const restaurants = await db.getRestaurants();
  res.render('admin/restaurants', { restaurants, formatMenuJson });
});

router.post('/restaurants', adminWriteLimiter, async (req, res) => {
  try {
    const payload = buildRestaurantPayload(req.body);
    if (!payload.id || !payload.name) {
      req.flash('error', 'Nom du restaurant obligatoire');
      return res.redirect('/admin/restaurants');
    }

    const existing = await db.findRestaurantById(payload.id);
    if (existing) {
      req.flash('error', 'Cet identifiant restaurant existe deja');
      return res.redirect('/admin/restaurants');
    }

    await db.createRestaurant(payload);
    req.flash('success', `Restaurant ${payload.name} ajoute`);
  } catch (error) {
    req.flash('error', error.message === 'MENU_JSON_INVALID' ? 'Menu JSON invalide' : 'Impossible d ajouter le restaurant');
  }
  res.redirect('/admin/restaurants');
});

router.post('/restaurants/:id/modifier', adminWriteLimiter, async (req, res) => {
  const restaurantId = cleanString(req.params.id, 80);
  try {
    const existing = await db.findRestaurantById(restaurantId);
    if (!existing) {
      req.flash('error', 'Restaurant introuvable');
      return res.redirect('/admin/restaurants');
    }

    const payload = buildRestaurantPayload(req.body, restaurantId);
    if (!payload.name) {
      req.flash('error', 'Nom du restaurant obligatoire');
      return res.redirect('/admin/restaurants');
    }

    await db.updateRestaurant(restaurantId, payload);
    req.flash('success', `Restaurant ${payload.name} mis a jour`);
  } catch (error) {
    req.flash('error', error.message === 'MENU_JSON_INVALID' ? 'Menu JSON invalide' : 'Impossible de modifier le restaurant');
  }
  res.redirect('/admin/restaurants');
});

router.post('/restaurants/:id/supprimer', adminWriteLimiter, async (req, res) => {
  const restaurantId = cleanString(req.params.id, 80);
  await db.deleteRestaurant(restaurantId);
  req.flash('success', 'Restaurant supprime');
  res.redirect('/admin/restaurants');
});

router.post('/commandes', adminWriteLimiter, async (req, res) => {
  const clientName = cleanName(req.body.client_name || '');
  const clientPhone = cleanPhone(req.body.client_phone || '');
  const fromAddress = cleanString(req.body.from_address, 180);
  const fromQuarter = cleanString(req.body.from_quarter, 80);
  const toAddress = cleanString(req.body.to_address, 180);
  const toQuarter = cleanString(req.body.to_quarter, 80);
  const description = cleanTextBlock(req.body.description, 400);
  const size = cleanString(req.body.size, 20);
  const deliveryPrice = toSafeNumber(req.body.delivery_price, 0);
  const io = req.app.get('io');
  const prices = { petit: 150, moyen: 250, grand: 400 };
  const price = deliveryPrice > 0 ? Math.round(deliveryPrice) : (prices[size] || 150);

  if (!clientPhone || !fromAddress || !toAddress) {
    req.flash('error', 'Client, ramassage et livraison sont obligatoires');
    return res.redirect('/admin/dashboard');
  }

  let client = await db.findUserByPhone(clientPhone);
  if (!client) {
    client = await db.createUser({
      name: clientName || `Client ${clientPhone}`,
      phone: clientPhone,
      password: bcrypt.hashSync(`tmp-${clientPhone}`, 10),
      role: 'client'
    });
  }

  const order = await db.createOrder({
    client_id: client._id,
    from_address: fromAddress,
    from_quarter: fromQuarter,
    to_address: toAddress,
    to_quarter: toQuarter,
    description,
    size,
    price,
  });

  const orderOut = { ...order, client_name: client.name, client_phone: client.phone };
  io.emit('new_order', { order: orderOut });
  req.flash('success', 'Commande creee et envoyee aux livreurs');
  res.redirect('/admin/commandes');
});

router.post('/commandes/:id/assigner', adminWriteLimiter, async (req, res) => {
  const livreurId = cleanString(req.body.livreur_id, 64);
  const orderId = cleanString(req.params.id, 64);
  const io = req.app.get('io');

  const [livreur, existingOrder] = await Promise.all([
    db.findUserById(livreurId),
    db.findOrderWithUsers(orderId),
  ]);
  if (!livreur || livreur.role !== 'livreur') {
    req.flash('error', 'Livreur introuvable');
    return res.redirect('/admin/commandes');
  }
  if (!existingOrder) {
    req.flash('error', 'Commande introuvable');
    return res.redirect('/admin/commandes');
  }
  if (['delivered', 'cancelled'].includes(existingOrder.status)) {
    req.flash('error', 'Cette commande ne peut plus etre assignee');
    return res.redirect('/admin/commandes');
  }

  await db.updateOrder(orderId, {
    livreur_id: livreurId,
    status: 'accepted',
    accepted_at: existingOrder.accepted_at || new Date().toISOString(),
  });
  const order = await db.findOrderWithUsers(orderId);
  io.to(`livreur_${livreurId}`).emit('order:assigned', { order });
  io.to(`order_${orderId}`).emit('order:accepted', { livreurId, livreurName: livreur.name });
  io.to('admin_room').emit('order:status_changed', { order });
  req.flash('success', 'Livreur assigne avec succes');
  res.redirect('/admin/commandes');
});

router.post('/commandes/:id/annuler', adminWriteLimiter, async (req, res) => {
  await db.cancelOrder(cleanString(req.params.id, 64));
  req.flash('success', 'Commande annulee');
  res.redirect('/admin/commandes');
});

async function deleteOrderHandler(req, res) {
  await db.deleteOrder(cleanString(req.params.id, 64));
  req.flash('success', 'Commande supprimee');
  res.redirect('/admin/commandes');
}

router.post('/commandes/:id/supprimer', adminWriteLimiter, deleteOrderHandler);
router.delete('/commandes/:id', adminWriteLimiter, deleteOrderHandler);

router.get('/livreurs', async (req, res) => {
  const livreurs = await db.getLivreursWithPerformance();
  res.render('admin/livreurs', { livreurs });
});

router.post('/livreurs', adminWriteLimiter, async (req, res) => {
  const name = cleanName(req.body.name);
  const phone = cleanPhone(req.body.phone);
  const password = cleanString(req.body.password, 128);
  const vehicle = cleanString(req.body.vehicle, 20) || 'moto';

  if (!name || !phone || !password) {
    req.flash('error', 'Tous les champs sont obligatoires');
    return res.redirect('/admin/livreurs');
  }
  if (password.length < 6) {
    req.flash('error', 'Mot de passe trop court (min 6 caracteres)');
    return res.redirect('/admin/livreurs');
  }

  const existing = await db.findUserByPhone(phone);
  if (existing) {
    req.flash('error', 'Ce numero existe deja');
    return res.redirect('/admin/livreurs');
  }

  await db.createUser({
    name,
    phone,
    password: bcrypt.hashSync(password, 10),
    role: 'livreur',
    vehicle,
    available: true,
    total_deliveries: 0,
    total_earnings: 0,
    rating: 5.0,
  });

  req.flash('success', `Livreur ${name} ajoute avec succes`);
  res.redirect('/admin/livreurs');
});

async function updateLivreurHandler(req, res) {
  const name = cleanName(req.body.name);
  const phone = cleanPhone(req.body.phone);
  const password = cleanString(req.body.password, 128);
  const vehicle = cleanString(req.body.vehicle, 20);
  const available = cleanString(req.body.available, 10) === 'true';
  const rating = Math.max(0, Math.min(5, toSafeNumber(req.body.rating, 5)));
  const livreurId = cleanString(req.params.id, 64);
  const livreur = await db.findUserById(livreurId);

  if (!livreur || livreur.role !== 'livreur') {
    req.flash('error', 'Livreur introuvable');
    return res.redirect('/admin/livreurs');
  }
  if (!name || !phone) {
    req.flash('error', 'Nom et identifiant sont obligatoires');
    return res.redirect('/admin/livreurs');
  }

  const existing = await db.findUserByPhone(phone);
  if (existing && existing._id !== livreurId) {
    req.flash('error', 'Cet identifiant existe deja');
    return res.redirect('/admin/livreurs');
  }

  const updateData = {
    name,
    phone,
    vehicle: vehicle || livreur.vehicle || 'moto',
    available,
    rating,
  };

  if (password) {
    if (password.length < 6) {
      req.flash('error', 'Nouveau mot de passe trop court (min 6 caracteres)');
      return res.redirect('/admin/livreurs');
    }
    updateData.password = bcrypt.hashSync(password, 10);
  }

  await db.updateUser(livreurId, updateData);
  req.flash('success', 'Profil livreur mis a jour');
  res.redirect('/admin/livreurs');
}

router.post('/livreurs/:id/modifier', adminWriteLimiter, updateLivreurHandler);
router.patch('/livreurs/:id', adminWriteLimiter, updateLivreurHandler);

async function deleteLivreurHandler(req, res) {
  await db.deleteLivreur(cleanString(req.params.id, 64));
  req.flash('success', 'Livreur supprime');
  res.redirect('/admin/livreurs');
}

router.post('/livreurs/:id/supprimer', adminWriteLimiter, deleteLivreurHandler);
router.delete('/livreurs/:id', adminWriteLimiter, deleteLivreurHandler);

router.get('/clients', async (req, res) => {
  const clients = await db.getClients();
  res.render('admin/clients', { clients });
});

module.exports = router;
