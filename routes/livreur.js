const express = require('express');
const router = express.Router();
const db = require('../models/db');
const push = require('../services/push');
const { createRateLimiter, getClientKey } = require('../middleware/security');
const { cleanString } = require('../utils/input');

const livreurWriteLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 160,
  methods: ['POST'],
  keyFn: (req) => `livreur:${getClientKey(req)}`,
  message: 'Trop d actions livreur en peu de temps, reessayez dans quelques minutes',
});

const STATUS_TRANSITIONS = {
  accepted: 'picked_up',
  picked_up: 'delivering',
  delivering: 'delivered',
};

const getLivreurGain = (order = {}) => Number(order.delivery_fee ?? ((order.subtotal != null && order.price != null) ? (order.price - order.subtotal) : order.price ?? 0));
const getCollectedAmount = (order = {}) => Number(order.price ?? getLivreurGain(order));

router.get('/dashboard', async (req, res) => {
  const livreurId = req.session.user.id;
  const livreur = await db.findUserById(livreurId);
  const activeOrders = await db.getActiveOrdersByLivreur(livreurId);
  const todayOrders = await db.getTodayOrdersByLivreur(livreurId);
  const todayEarnings = todayOrders.reduce((sum, order) => sum + getLivreurGain(order), 0);
  const todayCollected = todayOrders.reduce((sum, order) => sum + getCollectedAmount(order), 0);
  const performance = await db.getLivreurPerformance(livreurId);
  const unreadNotifs = await db.countUnreadNotifs(livreurId);
  res.render('livreur/dashboard', { livreur, activeOrders, todayOrders, todayEarnings, todayCollected, performance, unreadNotifs });
});

router.post('/disponibilite', livreurWriteLimiter, async (req, res) => {
  try {
    const livreurId = req.session.user.id;
    const io = req.app.get('io');
    const isAvail = cleanString(req.body.available, 10) === '1' || cleanString(req.body.available, 10) === 'true';

    await db.updateUser(livreurId, { available: isAvail });
    io.to('admin_room').emit('livreur:status_changed', { livreurId, available: isAvail });
    res.json({ success: true, available: isAvail });
  } catch (error) {
    console.error('Erreur disponibilite livreur:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

router.get('/commandes', async (req, res) => {
  const pendingOrders = await db.getPendingOrders();
  res.render('livreur/available-orders', { pendingOrders });
});

router.get('/livraisons', async (req, res) => {
  const livreurId = req.session.user.id;
  const activeOrders = await db.getActiveOrdersByLivreur(livreurId);
  const activeCollected = activeOrders.reduce((sum, order) => sum + getCollectedAmount(order), 0);
  res.render('livreur/livraisons', { activeOrders, activeCollected });
});

router.post('/commandes/:id/accepter', livreurWriteLimiter, async (req, res) => {
  const orderId = cleanString(req.params.id, 80);
  const livreurId = req.session.user.id;
  const io = req.app.get('io');

  try {
    const updated = await db.acceptOrder(orderId, livreurId);
    if (!updated) {
      req.flash('error', 'Cette commande a deja ete prise par un autre livreur');
      return res.redirect('/livreur/commandes');
    }

    const livreur = await db.findUserById(livreurId);
    io.emit('order:taken', { orderId, livreurId });
    io.to(`order_${orderId}`).emit('order:accepted', { livreurId, livreurName: livreur.name });
    io.to('admin_room').emit('order:status_changed', { order: updated });
    await push.sendToUsers([updated.client_id], {
      title: 'Commande acceptee',
      body: `${livreur.name} prend votre commande en charge`,
      url: `/client/commandes/${orderId}`,
      tag: `order-${orderId}`,
      orderId,
      type: 'order_accepted',
    });

    await db.markNotifReadForOrder(orderId, livreurId);

    req.flash('success', 'Livraison acceptee ! En route');
    res.redirect(`/livreur/commandes/${orderId}`);
  } catch (error) {
    console.error('Erreur acceptation livraison:', error);
    req.flash('error', 'Impossible d accepter cette livraison');
    res.redirect('/livreur/commandes');
  }
});

router.get('/commandes/:id', async (req, res) => {
  const livreurId = req.session.user.id;
  const order = await db.findOrderWithUsers(cleanString(req.params.id, 80));
  if (!order) {
    req.flash('error', 'Commande introuvable');
    return res.redirect('/livreur/dashboard');
  }
  if (order.livreur_id && order.livreur_id !== livreurId) {
    req.flash('error', 'Cette commande appartient a un autre livreur');
    return res.redirect('/livreur/dashboard');
  }
  res.render('livreur/order-detail', { order });
});

router.post('/commandes/:id/annuler', livreurWriteLimiter, async (req, res) => {
  const orderId = cleanString(req.params.id, 80);
  const livreurId = req.session.user.id;
  const io = req.app.get('io');
  const order = await db.findOrderWithUsers(orderId);

  if (!order) {
    req.flash('error', 'Commande introuvable');
    return res.redirect('/livreur/livraisons');
  }

  if (order.livreur_id !== livreurId || !['accepted', 'picked_up', 'delivering'].includes(order.status)) {
    req.flash('error', 'Cette livraison ne peut pas etre annulee');
    return res.redirect(`/livreur/commandes/${orderId}`);
  }

  const updatedOrder = await db.updateOrder(orderId, {
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancelled_by: 'livreur',
    payment_status: 'cancelled',
  });

  io.to(`order_${orderId}`).emit('order:status_update', { status: 'cancelled', order: updatedOrder });
  io.to('admin_room').emit('order:status_changed', { order: updatedOrder });
  await push.sendToUsers([order.client_id], {
    title: 'Livraison annulee',
    body: 'Votre livreur a annule la livraison',
    url: `/client/commandes/${orderId}`,
    tag: `order-${orderId}`,
    orderId,
    type: 'order_cancelled',
  });

  req.flash('success', 'Livraison annulee');
  res.redirect(`/livreur/commandes/${orderId}`);
});

router.post('/commandes/:id/statut', livreurWriteLimiter, async (req, res) => {
  try {
    const status = cleanString(req.body.status, 40);
    const orderId = cleanString(req.params.id, 80);
    const livreurId = req.session.user.id;
    const io = req.app.get('io');

    if (!['picked_up', 'delivering', 'delivered'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Statut invalide' });
    }

    const existingOrder = await db.findOrderWithUsers(orderId);
    if (!existingOrder) {
      return res.status(404).json({ success: false, error: 'Commande introuvable' });
    }
    if (existingOrder.livreur_id !== livreurId) {
      return res.status(403).json({ success: false, error: 'Cette commande ne vous appartient pas' });
    }

    const expectedNextStatus = STATUS_TRANSITIONS[existingOrder.status];
    if (expectedNextStatus !== status) {
      return res.status(400).json({ success: false, error: 'Transition de statut invalide' });
    }

    const extra = status === 'delivered'
      ? { delivered_at: new Date().toISOString(), payment_status: 'collected' }
      : {};
    const order = await db.updateOrder(orderId, { status, ...extra });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande introuvable' });
    }

    if (status === 'delivered') {
      await db.incrementLivreurTotals(livreurId, 1, getLivreurGain(order));
    }

    io.to(`order_${orderId}`).emit('order:status_update', { status, order });
    io.to('admin_room').emit('order:status_changed', { order });
    const statusLabel = {
      picked_up: 'Commande recuperee',
      delivering: 'Commande en route',
      delivered: 'Commande livree',
    }[status] || 'Commande mise a jour';
    await push.sendToUsers([order.client_id], {
      title: statusLabel,
      body: status === 'delivered' ? 'Bon appetit, merci pour votre commande' : 'Votre commande avance',
      url: `/client/commandes/${orderId}`,
      tag: `order-${orderId}`,
      orderId,
      type: 'order_status',
    });
    res.json({ success: true, status });
  } catch (error) {
    console.error('Erreur mise a jour statut livreur:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

router.get('/historique', async (req, res) => {
  const orders = await db.getOrdersByLivreur(req.session.user.id);
  const deliveredOrders = orders.filter((order) => order.status === 'delivered');
  const totalEarnings = deliveredOrders.reduce((sum, order) => sum + getLivreurGain(order), 0);
  const totalCollected = deliveredOrders.reduce((sum, order) => sum + getCollectedAmount(order), 0);
  res.render('livreur/historique', { orders, totalEarnings, totalCollected });
});

router.get('/stats', async (req, res) => {
  const livreurId = req.session.user.id;
  const livreur = await db.findUserById(livreurId);
  const performance = await db.getLivreurPerformance(livreurId);
  const orders = await db.getOrdersByLivreur(livreurId);
  const deliveredOrders = orders.filter((order) => order.status === 'delivered').slice(0, 10);
  res.render('livreur/stats', { livreur, performance, deliveredOrders });
});

router.get('/notifications', async (req, res) => {
  const livreurId = req.session.user.id;
  const notifications = await db.getNotifsByUser(livreurId);
  await db.markNotifsRead(livreurId);
  res.render('livreur/notifications', { notifications });
});

module.exports = router;
