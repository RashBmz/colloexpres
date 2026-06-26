const express = require('express');
const router = express.Router();
const db = require('../models/db');
const push = require('../services/push');
const { createRateLimiter, getClientKey } = require('../middleware/security');
const { cleanString } = require('../utils/input');

const pushLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 60,
  methods: ['POST'],
  keyFn: (req) => `push:${getClientKey(req)}`,
  message: 'Trop de demandes notifications, reessayez dans quelques minutes',
});

router.get('/config', (req, res) => {
  res.json(push.getPublicConfig());
});

router.post('/subscribe', pushLimiter, async (req, res) => {
  try {
    const subscription = req.body?.subscription || req.body;
    const saved = await db.saveWebPushSubscription(
      req.session.user.id,
      subscription,
      req.get('user-agent') || ''
    );
    res.json({ success: Boolean(saved) });
  } catch (error) {
    console.error('Erreur abonnement web push:', error);
    res.status(400).json({ success: false, error: 'Abonnement invalide' });
  }
});

router.post('/native-token', pushLimiter, async (req, res) => {
  try {
    const token = cleanString(req.body?.token, 1400);
    const platform = cleanString(req.body?.platform || 'android', 40);
    const saved = await db.saveNativePushToken(
      req.session.user.id,
      token,
      platform,
      req.get('user-agent') || ''
    );
    res.json({ success: Boolean(saved) });
  } catch (error) {
    console.error('Erreur token push natif:', error);
    res.status(400).json({ success: false, error: 'Token invalide' });
  }
});

module.exports = router;
