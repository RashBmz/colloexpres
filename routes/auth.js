const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../models/db');
const { createRateLimiter, getClientKey } = require('../middleware/security');
const { cleanName, cleanPhone, cleanRole, cleanString } = require('../utils/input');

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  methods: ['POST'],
  keyFn: (req) => `login:${getClientKey(req)}:${cleanPhone(req.body.phone || '')}`,
  message: 'Trop de tentatives de connexion, patientez 15 minutes',
});

const registerLimiter = createRateLimiter({
  windowMs: 30 * 60 * 1000,
  max: 6,
  methods: ['POST'],
  keyFn: (req) => `register:${getClientKey(req)}:${cleanPhone(req.body.phone || '')}`,
  message: 'Trop de creations de compte, patientez un peu',
});

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('auth/login', { role: cleanRole(req.query.role || 'client') });
});

router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('auth/register');
});

router.post('/login', loginLimiter, async (req, res) => {
  const phone = cleanPhone(req.body.phone);
  const password = cleanString(req.body.password, 128);
  const role = cleanRole(req.body.role);

  try {
    const user = await db.findUserByPhone(phone);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      req.flash('error', 'Identifiant ou mot de passe incorrect');
      return res.redirect(`/auth/login?role=${role}`);
    }
    if (user.role !== role) {
      req.flash('error', `Ce compte n'est pas un compte ${role}`);
      return res.redirect(`/auth/login?role=${role}`);
    }

    req.session.regenerate((error) => {
      if (error) {
        console.error(error);
        req.flash('error', 'Erreur serveur');
        return res.redirect(`/auth/login?role=${role}`);
      }

      req.session.user = { id: user._id, name: user.name, phone: user.phone, role: user.role };
      req.flash('success', `Bienvenue ${user.name} !`);
      return res.redirect(`/${user.role}/dashboard`);
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Erreur serveur');
    res.redirect(`/auth/login?role=${role}`);
  }
});

router.post('/register', registerLimiter, async (req, res) => {
  const name = cleanName(req.body.name);
  const phone = cleanPhone(req.body.phone);
  const password = cleanString(req.body.password, 128);
  const confirmPassword = cleanString(req.body.confirm_password, 128);

  if (!name || !phone || !password) {
    req.flash('error', 'Tous les champs sont obligatoires');
    return res.redirect('/auth/register');
  }
  if (password !== confirmPassword) {
    req.flash('error', 'Les mots de passe ne correspondent pas');
    return res.redirect('/auth/register');
  }
  if (password.length < 6) {
    req.flash('error', 'Mot de passe trop court (min 6 caracteres)');
    return res.redirect('/auth/register');
  }

  try {
    const existing = await db.findUserByPhone(phone);
    if (existing) {
      req.flash('error', 'Ce numero est deja utilise');
      return res.redirect('/auth/register');
    }

    const user = await db.createUser({ name, phone, password: bcrypt.hashSync(password, 10), role: 'client' });
    req.session.regenerate((error) => {
      if (error) {
        console.error(error);
        req.flash('error', 'Erreur serveur');
        return res.redirect('/auth/login?role=client');
      }

      req.session.user = { id: user._id, name, phone, role: 'client' };
      req.flash('success', `Compte cree ! Bienvenue ${name}`);
      return res.redirect('/client/dashboard');
    });
  } catch (error) {
    req.flash('error', error.errorType === 'uniqueViolated' ? 'Ce numero est deja utilise' : 'Erreur lors de la creation');
    res.redirect('/auth/register');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('colloexpress.sid');
    res.redirect('/');
  });
});

module.exports = router;
