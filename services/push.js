const db = require('../models/db');

let firebaseAdmin = null;
let webPush = null;

try {
  firebaseAdmin = require('firebase-admin');
} catch {
  firebaseAdmin = null;
}

try {
  webPush = require('web-push');
} catch {
  webPush = null;
}

function parseFirebaseCredentials() {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const rawBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (rawJson) {
    const parsed = JSON.parse(rawJson);
    if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    return parsed;
  }

  if (rawBase64) {
    const parsed = JSON.parse(Buffer.from(rawBase64, 'base64').toString('utf8'));
    if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    return parsed;
  }

  return null;
}

function getFirebaseApp() {
  if (!firebaseAdmin) return null;
  if (firebaseAdmin.apps.length) return firebaseAdmin.app();

  try {
    const serviceAccount = parseFirebaseCredentials();
    if (serviceAccount) {
      return firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(serviceAccount),
      });
    }
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      return firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.applicationDefault(),
      });
    }
  } catch (error) {
    console.warn('Push Firebase non configure:', error.message);
  }

  return null;
}

function getPublicConfig() {
  const webPushEnabled = Boolean(webPush && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
  return {
    webPushEnabled,
    vapidPublicKey: webPushEnabled ? process.env.VAPID_PUBLIC_KEY : '',
    nativePushEnabled: Boolean(firebaseAdmin),
  };
}

function normalizePayload(payload = {}) {
  return {
    title: String(payload.title || 'Koloo Go').slice(0, 80),
    body: String(payload.body || '').slice(0, 180),
    url: String(payload.url || '/').slice(0, 300),
    tag: String(payload.tag || 'colloexpress').slice(0, 80),
    orderId: payload.orderId ? String(payload.orderId).slice(0, 80) : '',
    type: payload.type ? String(payload.type).slice(0, 60) : '',
  };
}

async function sendNative(tokens, payload) {
  const app = getFirebaseApp();
  if (!app || !tokens.length) return 0;

  try {
    const messaging = firebaseAdmin.messaging(app);
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        url: payload.url,
        orderId: payload.orderId || '',
        type: payload.type || '',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'collo_orders',
          icon: 'ic_stat_collo',
          color: '#ff7a1a',
          defaultSound: true,
          defaultVibrateTimings: true,
          notificationPriority: 'PRIORITY_MAX',
          visibility: 'PUBLIC',
        },
      },
    });
    return response.successCount || 0;
  } catch (error) {
    console.warn('Push native impossible:', error.message);
    return 0;
  }
}

function configureWebPush() {
  const config = getPublicConfig();
  if (!config.webPushEnabled) return false;

  try {
    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:contact@kolo-go.app',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    return true;
  } catch (error) {
    console.warn('Web Push non configure:', error.message);
    return false;
  }
}

async function sendWeb(targets, payload) {
  if (!configureWebPush()) return 0;

  let sent = 0;
  const webTargets = targets.filter((target) => (
    target.type === 'web'
    && target.endpoint
    && target.p256dh
    && target.auth
  ));

  for (const target of webTargets) {
    try {
      await webPush.sendNotification({
        endpoint: target.endpoint,
        keys: {
          p256dh: target.p256dh,
          auth: target.auth,
        },
      }, JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url,
        tag: payload.tag,
        orderId: payload.orderId || '',
        type: payload.type || '',
        icon: '/images/icons/icon-192.png',
        badge: '/images/icons/icon-192.png',
      }));
      sent += 1;
    } catch (error) {
      const statusCode = Number(error.statusCode || error.status || 0);
      if (statusCode === 404 || statusCode === 410) {
        await db.removePushTarget(target.id || target._id).catch(() => null);
      } else {
        console.warn('Web Push impossible:', error.message);
      }
    }
  }

  return sent;
}

async function sendTargets(targets, rawPayload) {
  const payload = normalizePayload(rawPayload);
  const nativeTokens = [...new Set(targets
    .filter((target) => target.type === 'native' && target.token)
    .map((target) => target.token))];

  const [nativeCount, webCount] = await Promise.all([
    sendNative(nativeTokens, payload),
    sendWeb(targets, payload),
  ]);

  return { web: webCount, native: nativeCount };
}

async function sendToUsers(userIds, payload) {
  try {
    const targets = await db.getPushTargetsForUsers(userIds);
    return sendTargets(targets, payload);
  } catch (error) {
    console.warn('Push utilisateurs impossible:', error.message);
    return { web: 0, native: 0 };
  }
}

async function sendToRole(role, payload) {
  try {
    const targets = await db.getPushTargetsByRole(role);
    return sendTargets(targets, payload);
  } catch (error) {
    console.warn('Push role impossible:', error.message);
    return { web: 0, native: 0 };
  }
}

module.exports = {
  getPublicConfig,
  sendToUsers,
  sendToRole,
};
