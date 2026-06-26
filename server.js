require('dotenv').config({ quiet: true });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');
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

app.set('io', io);
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === 'false' ? false : 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(securityHeaders);
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  lastModified: true,
  maxAge: '7d',
  setHeaders(res, filePath) {
    if (filePath.endsWith(`${path.sep}sw.js`) || filePath.endsWith(`${path.sep}manifest.webmanifest`)) {
      res.setHeader('Cache-Control', 'no-cache');
      return;
    }
    if (/\.(css|js|svg|png|jpg|jpeg|webp|gif|ico)$/i.test(filePath)) {
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

app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
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
      console.log(`\nColloExpress demarre sur http://localhost:${PORT}`);
      console.log(`Stockage actif: ${db.isPostgres ? 'Supabase/PostgreSQL' : 'Local NeDB'}`);
      console.log(`Sessions: ${hasRemoteDatabase ? 'PostgreSQL' : 'MemoryStore local'}`);
      console.log('Socket.IO pret\n');
    });
  } catch (error) {
    console.error('\nImpossible de demarrer ColloExpress.');
    console.error('Verifiez DATABASE_URL / DATABASE_SSL sur Render et Supabase.');
    console.error(error);
    process.exit(1);
  }
}

startServer();
