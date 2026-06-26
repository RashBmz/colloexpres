function getForwardedIp(req) {
  const raw = req.headers['x-forwarded-for'];
  if (!raw) return '';
  return String(raw).split(',')[0].trim();
}

function getClientKey(req) {
  return String(
    req.session?.user?.id ||
    getForwardedIp(req) ||
    req.socket?.remoteAddress ||
    req.ip ||
    'anonymous'
  );
}

function createRateLimiter({ windowMs, max, keyFn, methods, message }) {
  const hits = new Map();
  const allowedMethods = methods ? new Set(methods.map((method) => method.toUpperCase())) : null;
  let lastSweepAt = 0;

  return (req, res, next) => {
    if (allowedMethods && !allowedMethods.has(req.method.toUpperCase())) {
      return next();
    }

    const now = Date.now();
    if (now - lastSweepAt > windowMs) {
      for (const [key, entry] of hits.entries()) {
        if (now > entry.resetAt) hits.delete(key);
      }
      lastSweepAt = now;
    }

    const key = keyFn ? keyFn(req) : getClientKey(req);
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      const wantsJson = req.xhr || (req.get('accept') || '').includes('application/json');
      if (wantsJson) {
        return res.status(429).json({ success: false, error: message || 'Trop de requetes' });
      }
      req.flash?.('error', message || 'Trop de requetes, veuillez patienter un instant');
      return res.status(429).redirect(req.get('referer') || '/');
    }

    return next();
  };
}

function securityHeaders(req, res, next) {
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: https://commons.wikimedia.org https://upload.wikimedia.org https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
    "script-src 'self' 'unsafe-inline' https://unpkg.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' ws: wss: https://*.supabase.co https://*.supabase.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://nominatim.openstreetmap.org",
  ].join('; ');

  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=()');
  res.setHeader('Content-Security-Policy', csp);
  next();
}

function sameOriginWriteGuard(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase())) {
    return next();
  }

  const origin = req.get('origin');
  const referer = req.get('referer');
  if (!origin && !referer) {
    return next();
  }

  const host = req.get('host');
  const allowed = [`http://${host}`, `https://${host}`];
  const source = origin || referer || '';
  if (allowed.some((prefix) => source.startsWith(prefix))) {
    return next();
  }

  req.flash?.('error', 'Requete bloquee pour securite');
  return res.status(403).send('Requete bloquee pour securite');
}

module.exports = {
  createRateLimiter,
  getClientKey,
  securityHeaders,
  sameOriginWriteGuard,
};
