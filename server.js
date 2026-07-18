require('dotenv').config({ quiet: true });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const compression = require('compression');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');
const crypto = require('crypto');
const db = require('./models/db');
const { requireAuth, requireRole } = require('./middleware/auth');
const { createRateLimiter, getClientKey, securityHeaders, sameOriginWriteGuard } = require('./middleware/security');
const { i18nMiddleware } = require('./utils/i18n');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  transports: ['websocket', 'polling'],
  cors: { origin: true, credentials: true },
});

const sessionSecret = process.env.SESSION_SECRET || 'colloexpress-dev-secret-change-me';
const isProduction = process.env.NODE_ENV === 'production';
const hasRemoteDatabase = Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('[YOUR-PASSWORD]'));
const launchAt = new Date(process.env.LAUNCH_AT || '2026-07-19T09:00:00.000Z');
const launchPassword = process.env.LAUNCH_PASSWORD || 'khlcollo';
const launchModeEnabled = process.env.LAUNCH_MODE === 'true' || (process.env.LAUNCH_MODE !== 'false' && Date.now() < launchAt.getTime());

app.set('io', io);
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === 'false' ? false : 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('view cache', isProduction);
app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.path.endsWith('.apk')) return false;
    return compression.filter(req, res);
  },
}));
app.use(securityHeaders);
function sendAndroidApk(req, res) {
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="koloo-go.apk"');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(__dirname, 'downloads', 'colloexpress.apk'));
}
app.get('/downloads/kolo-go.apk', sendAndroidApk);
app.get('/downloads/koloo-go.apk', sendAndroidApk);
app.get('/downloads/colloexpress.apk', sendAndroidApk);
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  lastModified: true,
  maxAge: '7d',
  setHeaders(res, filePath) {
    if (filePath.endsWith(`${path.sep}sw.js`) || filePath.endsWith(`${path.sep}manifest.webmanifest`) || /\.(css|js)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'no-cache');
      return;
    }
    if (/\.(svg|png|jpg|jpeg|webp|gif|ico)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    }
  },
}));
app.use(express.urlencoded({ extended: true, limit: '200kb' }));
app.use(express.json({ limit: '200kb' }));
app.use(methodOverride('_method'));
app.use(sameOriginWriteGuard);
app.use(createRateLimiter({
  windowMs: 60 * 1000,
  max: 240,
  methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  keyFn: (req) => `write:${getClientKey(req)}`,
  message: 'Trop d actions en peu de temps, reessayez dans une minute',
}));

const sessionConfig = {
  name: 'colloexpress.sid',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  unset: 'destroy',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
  },
};

if (hasRemoteDatabase) {
  sessionConfig.store = new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'user_sessions',
    createTableIfMissing: true,
    pruneSessionInterval: 60 * 15,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
    errorLog: (error) => console.error('Session store PostgreSQL:', error),
  });
}

const sessionMiddleware = session(sessionConfig);
app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);

app.use(flash());
app.use(i18nMiddleware);
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currentUser = req.session.user || null;
  res.locals.isProduction = isProduction;
  next();
});

function isLaunchGateActive() {
  return launchModeEnabled && Date.now() < launchAt.getTime();
}

function parseCookies(cookieHeader = '') {
  return String(cookieHeader || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const index = part.indexOf('=');
      if (index === -1) return acc;
      acc[decodeURIComponent(part.slice(0, index))] = decodeURIComponent(part.slice(index + 1));
      return acc;
    }, {});
}

function getVisitorId(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  const existing = String(cookies.koloo_vid || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 64);
  if (existing) return existing;
  const visitorId = crypto.randomBytes(18).toString('hex');
  res.cookie('koloo_vid', visitorId, {
    maxAge: 1000 * 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
  });
  return visitorId;
}

function shouldTrackVisit(req) {
  if (req.method !== 'GET') return false;
  if (req.path.includes('.')) return false;
  if (req.path.startsWith('/socket.io')) return false;
  if (req.path.startsWith('/downloads')) return false;
  return true;
}

app.use((req, res, next) => {
  const visitorId = getVisitorId(req, res);
  req.visitorId = visitorId;
  if (shouldTrackVisit(req)) {
    db.trackSiteVisit(visitorId).catch((error) => console.error('Erreur analytics visite:', error));
  }
  next();
});

async function renderLaunch(req, res, statusCode = 200) {
  const [launchVotes, launchLikes] = await Promise.all([
    db.getLaunchPoll().catch(() => ({})),
    db.getLaunchLikes ? db.getLaunchLikes().catch(() => 0) : 0,
  ]);
  res.status(statusCode).render('launch', {
    title: 'Ouverture bientot',
    launchAtIso: launchAt.toISOString(),
    accessError: req.flash('launchError'),
    launchVotes,
    launchLikes,
    disableI18n: true,
  });
}

app.get('/launch', (req, res) => renderLaunch(req, res));
app.get('/launch-votes', async (req, res) => {
  res.json({ votes: await db.getLaunchPoll() });
});
app.post('/launch-vote', async (req, res) => {
  const allowed = new Set(['tacos', 'pizza', 'burger', 'sandwich', 'poutine', 'chawarma']);
  const choice = String(req.body.choice || '').slice(0, 40);
  if (!allowed.has(choice)) return res.status(400).json({ error: 'Choix invalide' });
  const votes = await db.voteLaunchPoll(req.visitorId, choice);
  res.json({ votes });
});
app.post('/launch-like', async (req, res) => {
  const likes = db.likeLaunch ? await db.likeLaunch(req.visitorId) : 0;
  res.json({ likes });
});
app.post('/analytics/ping', (req, res) => {
  db.trackSiteVisit(req.visitorId).catch((error) => console.error('Erreur analytics ping:', error));
  res.json({ ok: true });
});
app.post('/launch-access', (req, res) => {
  const password = String(req.body.password || '');
  if (password === launchPassword) {
    req.session.launchAccess = true;
    return res.redirect('/');
  }
  req.flash('launchError', 'Mot de passe incorrect');
  return res.redirect('/launch');
});
app.post('/launch-exit', (req, res) => {
  delete req.session.launchAccess;
  res.redirect('/launch');
});
app.use((req, res, next) => {
  if (!isLaunchGateActive()) return next();
  if (req.session.launchAccess) return next();
  if (['/launch', '/launch-access', '/launch-votes', '/launch-vote', '/launch-like', '/analytics/ping'].includes(req.path)) return next();
  return renderLaunch(req, res).catch(next);
});

app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/push', requireAuth, require('./routes/push'));
app.use('/client', requireAuth, requireRole('client'), require('./routes/client'));
app.use('/livreur', requireAuth, requireRole('livreur'), require('./routes/livreur'));
app.use('/admin', requireAuth, requireRole('admin'), require('./routes/admin'));

const connectedLivreurs = new Map();

io.on('connection', (socket) => {
  const getSocketUser = () => socket.request.session?.user || null;

  socket.on('livreur:register', () => {
    const user = getSocketUser();
    if (!user || user.role !== 'livreur') return;
    const livreurId = user.id;
    connectedLivreurs.set(String(livreurId), socket.id);
    socket.join(`livreur_${livreurId}`);
    io.to('admin_room').emit('livreur:online', { livreurId });
  });

  socket.on('admin:register', () => {
    const user = getSocketUser();
    if (!user || user.role !== 'admin') return;
    socket.join('admin_room');
    socket.emit('livreurs:connected', Array.from(connectedLivreurs.keys()));
  });

  socket.on('client:track', async (orderId) => {
    try {
      const user = getSocketUser();
      if (!user) return;
      const safeOrderId = String(orderId || '').slice(0, 80);
      const order = await db.findOrderById(safeOrderId);
      if (!order) return;
      const canTrack = user.role === 'admin'
        || (user.role === 'client' && order.client_id === user.id)
        || (user.role === 'livreur' && order.livreur_id === user.id);
      if (!canTrack) return;
      socket.join(`order_${safeOrderId}`);
    } catch (error) {
      console.error('Erreur suivi Socket.IO:', error);
    }
  });

  socket.on('livreur:availability', async ({ available }) => {
    try {
      const user = getSocketUser();
      if (!user || user.role !== 'livreur') return;
      const livreurId = user.id;
      await db.updateUser(String(livreurId), { available: Boolean(available) });
      io.to('admin_room').emit('livreur:status_changed', { livreurId, available: Boolean(available) });
    } catch (error) {
      console.error('Erreur disponibilite Socket.IO:', error);
    }
  });

  socket.on('disconnect', () => {
    for (const [livreurId, sid] of connectedLivreurs.entries()) {
      if (sid === socket.id) {
        connectedLivreurs.delete(livreurId);
        io.to('admin_room').emit('livreur:offline', { livreurId });
        break;
      }
    }
  });
});

app.set('connectedLivreurs', connectedLivreurs);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    if (db.ready) {
      await db.ready;
    }

    server.listen(PORT, () => {
      console.log(`\nKoloo Go demarre sur http://localhost:${PORT}`);
      console.log(`Stockage actif: ${db.isPostgres ? 'Supabase/PostgreSQL' : 'Local NeDB'}`);
      console.log(`Sessions: ${hasRemoteDatabase ? 'PostgreSQL' : 'MemoryStore local'}`);
      console.log('Socket.IO pret\n');
    });
  } catch (error) {
    console.error('\nImpossible de demarrer Koloo Go.');
    console.error('Verifiez DATABASE_URL / DATABASE_SSL sur Render et Supabase.');
    console.error(error);
    process.exit(1);
  }
}

startServer();
