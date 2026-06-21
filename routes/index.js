const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect(`/${req.session.user.role}/dashboard`);
  }
  res.render('landing');
});

module.exports = router;
