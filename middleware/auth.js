function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Veuillez vous connecter');
    return res.redirect('/auth/login');
  }
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user || req.session.user.role !== role) {
      req.flash('error', 'Accès non autorisé');
      return res.redirect('/auth/login');
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
