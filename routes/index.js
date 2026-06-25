const express = require('express');
const router = express.Router();
const { setLang } = require('../utils/i18n');

router.get('/lang/:lang', (req, res) => {
  setLang(req, res, req.params.lang);
  res.redirect(req.get('referer') || '/');
});

router.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect(`/${req.session.user.role}/dashboard`);
  }
  res.render('landing');
});

module.exports = router;
