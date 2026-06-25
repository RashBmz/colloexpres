const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { createRateLimiter, getClientKey } = require('../middleware/security');
const { cleanString, cleanTextBlock, toSafeNumber } = require('../utils/input');

const clientWriteLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 120,
  methods: ['POST'],
  keyFn: (req) => `client:${getClientKey(req)}`,
  message: 'Trop d actions en peu de temps, reessayez dans quelques minutes',
});

const DELIVERY_PRICES = { petit: 150, moyen: 250, grand: 400 };
const ALLOWED_PARCEL_SIZES = new Set(Object.keys(DELIVERY_PRICES));
const ALLOWED_REQUEST_KINDS = new Set(['colis', 'courses']);

function clampCoord(value, min, max) {
  const num = toSafeNumber(value, Number.NaN);
  if (!Number.isFinite(num)) return null;
  return Math.max(min, Math.min(max, num));
}

function sanitizeAddress(value) {
  return cleanString(value, 180);
}

function sanitizeQuarter(value) {
  return cleanString(value, 80);
}

function sanitizeId(value) {
  return cleanString(value, 80);
}

function buildRestaurantItemIndex(resto) {
  const items = new Map();
  for (const category of Object.values(resto.menu || {})) {
    for (const item of category.items || []) {
      items.set(String(item.id), item);
    }
  }
  return items;
}

function normalizeSelectedOptions(raw) {
  if (!Array.isArray(raw)) return new Map();
  const selected = new Map();
  for (const entry of raw) {
    const group = cleanString(entry?.group, 40);
    const optionId = cleanString(entry?.optionId || entry?.id, 64);
    if (!group || !optionId || selected.has(group)) continue;
    selected.set(group, optionId);
  }
  return selected;
}

function sanitizeFoodCart(resto, rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: 'Panier vide' };
  }
  if (rawItems.length > 25) {
    return { error: 'Panier trop volumineux' };
  }

  const itemIndex = buildRestaurantItemIndex(resto);
  const items = [];

  for (const rawItem of rawItems) {
    const itemId = sanitizeId(rawItem?.id);
    const menuItem = itemIndex.get(itemId);
    if (!menuItem) {
      return { error: 'Un article du panier est invalide' };
    }

    const qty = Math.max(1, Math.min(20, Math.floor(toSafeNumber(rawItem?.qty, 0))));
    if (!qty) {
      return { error: 'Quantite invalide dans le panier' };
    }

    const selectedOptions = normalizeSelectedOptions(rawItem?.selectedOptions);
    let unitPrice = Number(menuItem.basePrice || 0);
    const optionLabels = [];
    const safeSelections = [];

    for (const [groupKey, optionConfig] of Object.entries(menuItem.options || {})) {
      const selectedId = selectedOptions.get(groupKey);

      if (optionConfig.type === 'checkbox') {
        if (selectedId) {
          unitPrice += Number(optionConfig.price || 0);
          optionLabels.push(optionConfig.label);
          safeSelections.push({ group: groupKey, optionId: groupKey });
        } else if (optionConfig.required) {
          return { error: `Option requise manquante pour ${menuItem.name}` };
        }
        continue;
      }

      if (!Array.isArray(optionConfig.choices)) {
        continue;
      }

      if (!selectedId) {
        if (optionConfig.required) {
          return { error: `Choix requis manquant pour ${menuItem.name}` };
        }
        continue;
      }

      const selectedChoice = optionConfig.choices.find((choice) => String(choice.id) === selectedId);
      if (!selectedChoice) {
        return { error: `Choix invalide pour ${menuItem.name}` };
      }

      unitPrice += Number(selectedChoice.price || 0);
      optionLabels.push(selectedChoice.label);
      safeSelections.push({ group: groupKey, optionId: String(selectedChoice.id) });
    }

    const safeUnitPrice = Math.round(unitPrice);
    items.push({
      id: String(menuItem.id),
      name: menuItem.name,
      unitPrice: safeUnitPrice,
      qty,
      total: safeUnitPrice * qty,
      options: optionLabels.join(', '),
      selectedOptions: safeSelections,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  return { items, subtotal };
}

router.get('/dashboard', async (req, res) => {
  const userId = req.session.user.id;
  const orders = await db.getOrdersByClient(userId);
  const stats = {
    total: orders.length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    pending: orders.filter((o) => ['pending', 'accepted', 'picked_up', 'delivering'].includes(o.status)).length,
  };
  const unreadNotifs = await db.countUnreadNotifs(userId);
  res.render('client/dashboard', { orders: orders.slice(0, 10), stats, unreadNotifs });
});

router.get('/nouvelle-commande', (req, res) => {
  res.render('client/new-order');
});

router.get('/restaurants', async (req, res) => {
  const restaurants = await db.getRestaurants();
  res.render('client/restaurants', { restaurants });
});

router.get('/restaurants/:id', async (req, res) => {
  const resto = await db.findRestaurantById(sanitizeId(req.params.id));
  if (!resto) {
    req.flash('error', 'Restaurant introuvable');
    return res.redirect('/client/restaurants');
  }
  res.render('client/restaurant-menu', { resto });
});

router.post('/commandes/food', clientWriteLimiter, async (req, res) => {
  const restoId = sanitizeId(req.body.resto_id);
  const toAddress = sanitizeAddress(req.body.to_address);
  const toQuarter = sanitizeQuarter(req.body.to_quarter);
  const toLat = clampCoord(req.body.to_lat, -90, 90);
  const toLng = clampCoord(req.body.to_lng, -180, 180);
  const notes = cleanTextBlock(req.body.notes, 500);
  const userId = req.session.user.id;
  const io = req.app.get('io');

  const resto = await db.findRestaurantById(restoId);
  if (!resto) {
    req.flash('error', 'Restaurant introuvable');
    return res.redirect('/client/restaurants');
  }
  if (!toAddress) {
    req.flash('error', 'Adresse de livraison requise');
    return res.redirect(`/client/restaurants/${restoId}`);
  }

  let rawItems;
  try {
    rawItems = JSON.parse(req.body.items_json || '[]');
  } catch {
    rawItems = [];
  }

  const cartResult = sanitizeFoodCart(resto, rawItems);
  if (cartResult.error) {
    req.flash('error', cartResult.error);
    return res.redirect(`/client/restaurants/${restoId}`);
  }

  if (cartResult.subtotal < Number(resto.minOrder || 0)) {
    req.flash('error', `Commande minimum: ${resto.minOrder} DA`);
    return res.redirect(`/client/restaurants/${restoId}`);
  }

  const total = cartResult.subtotal + Number(resto.deliveryFee || 0);
  const client = await db.findUserById(userId);
  const order = await db.createOrder({
    client_id: userId,
    type: 'food',
    resto_id: restoId,
    resto_name: resto.name,
    from_address: resto.address,
    from_quarter: 'Restaurant',
    from_lat: resto.lat,
    from_lng: resto.lng,
    to_address: toAddress,
    to_quarter: toQuarter,
    to_lat: toLat,
    to_lng: toLng,
    description: cartResult.items.map((item) => `${item.qty}x ${item.name}${item.options ? ` (${item.options})` : ''}`).join(', '),
    items: cartResult.items,
    notes,
    size: 'moyen',
    price: total,
    subtotal: cartResult.subtotal,
    delivery_fee: Number(resto.deliveryFee || 0),
  });

  const orderOut = { ...order, client_name: client.name, client_phone: client.phone };
  io.emit('new_order', { order: orderOut });

  const livreurs = await db.getAvailableLivreurs();
  for (const livreur of livreurs) {
    await db.createNotif({
      user_id: livreur._id,
      type: 'new_order',
      title: `Commande ${resto.name}`,
      message: `${cartResult.items.length} article(s) -> ${toAddress} - ${total} DA`,
      order_id: order._id,
    });
  }

  req.flash('success', `Commande chez ${resto.name} envoyee !`);
  res.redirect(`/client/commandes/${order._id}`);
});

router.post('/commandes', clientWriteLimiter, async (req, res) => {
  const rawRequestKind = cleanString(req.body.request_kind, 20).toLowerCase();
  const fromAddress = sanitizeAddress(req.body.from_address);
  const fromQuarter = sanitizeQuarter(req.body.from_quarter);
  const toAddress = sanitizeAddress(req.body.to_address);
  const toQuarter = sanitizeQuarter(req.body.to_quarter);
  const description = cleanTextBlock(req.body.description, 500);
  const size = cleanString(req.body.size, 20).toLowerCase();
  const userId = req.session.user.id;
  const io = req.app.get('io');

  if (rawRequestKind && !ALLOWED_REQUEST_KINDS.has(rawRequestKind)) {
    req.flash('error', 'Type de demande invalide');
    return res.redirect('/client/nouvelle-commande');
  }

  const inferredCourses = !fromAddress && Boolean(toAddress) && Boolean(description);
  let requestKind = rawRequestKind === 'courses' ? 'courses' : 'colis';
  if (requestKind === 'colis' && inferredCourses) {
    requestKind = 'courses';
  }
  if (!toAddress) {
    req.flash('error', 'L adresse de livraison est obligatoire');
    return res.redirect('/client/nouvelle-commande');
  }
  if (requestKind === 'colis' && !fromAddress) {
    req.flash('error', 'Le point de ramassage est obligatoire pour un colis. Pour une pharmacie, une superette ou une quincaillerie, choisissez bien "Demander des courses".');
    return res.redirect('/client/nouvelle-commande');
  }
  if (requestKind === 'courses' && !description) {
    req.flash('error', 'Decrivez la course ou les achats a effectuer');
    return res.redirect('/client/nouvelle-commande');
  }
  if (!ALLOWED_PARCEL_SIZES.has(size)) {
    req.flash('error', 'Taille de colis invalide');
    return res.redirect('/client/nouvelle-commande');
  }

  const price = DELIVERY_PRICES[size] || DELIVERY_PRICES.petit;
  const client = await db.findUserById(userId);
  const isCourses = requestKind === 'courses';
  const order = await db.createOrder({
    client_id: userId,
    type: isCourses ? 'courses' : 'colis',
    from_address: isCourses ? 'Courses / achats a effectuer' : fromAddress,
    from_quarter: isCourses ? '' : fromQuarter,
    from_lat: isCourses ? null : clampCoord(req.body.from_lat, -90, 90),
    from_lng: isCourses ? null : clampCoord(req.body.from_lng, -180, 180),
    to_address: toAddress,
    to_quarter: toQuarter,
    to_lat: clampCoord(req.body.to_lat, -90, 90),
    to_lng: clampCoord(req.body.to_lng, -180, 180),
    description,
    size,
    price,
    subtotal: 0,
    delivery_fee: price,
  });

  const orderOut = { ...order, client_name: client.name, client_phone: client.phone };
  io.emit('new_order', { order: orderOut });

  const livreurs = await db.getAvailableLivreurs();
  for (const livreur of livreurs) {
    await db.createNotif({
      user_id: livreur._id,
      type: 'new_order',
      title: isCourses ? 'Nouvelle course !' : 'Nouvelle livraison !',
      message: isCourses ? `Course vers ${toAddress} - ${price} DA` : `De ${fromAddress} -> ${toAddress} - ${price} DA`,
      order_id: order._id,
    });
  }

  req.flash('success', isCourses ? 'Demande de course envoyee ! Un livreur va vous contacter.' : 'Commande envoyee ! Un livreur va accepter tres bientot.');
  res.redirect(`/client/commandes/${order._id}`);
});

router.get('/commandes', async (req, res) => {
  const orders = await db.getOrdersByClient(req.session.user.id);
  res.render('client/orders', { orders });
});

router.post('/commandes/:id/annuler', clientWriteLimiter, async (req, res) => {
  const orderId = sanitizeId(req.params.id);
  const userId = req.session.user.id;
  const io = req.app.get('io');
  const order = await db.findOrderWithUsers(orderId);

  if (!order || order.client_id !== userId) {
    req.flash('error', 'Commande introuvable');
    return res.redirect('/client/commandes');
  }

  if (order.status !== 'pending') {
    req.flash('error', 'Vous ne pouvez annuler que tant qu aucun livreur n a pris la commande');
    return res.redirect(`/client/commandes/${orderId}`);
  }

  const updatedOrder = await db.updateOrder(orderId, {
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancelled_by: 'client',
    payment_status: 'cancelled',
  });

  io.to(`order_${orderId}`).emit('order:status_update', { status: 'cancelled', order: updatedOrder });
  io.to('admin_room').emit('order:status_changed', { order: updatedOrder });

  req.flash('success', 'Commande annulee');
  res.redirect(`/client/commandes/${orderId}`);
});

router.get('/commandes/:id', async (req, res) => {
  const order = await db.findOrderWithUsers(sanitizeId(req.params.id));
  if (!order || order.client_id !== req.session.user.id) {
    req.flash('error', 'Commande introuvable');
    return res.redirect('/client/dashboard');
  }
  res.render('client/order-detail', { order });
});

module.exports = router;
