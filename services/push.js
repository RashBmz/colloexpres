const db = require('../models/db');

let webpush = null;
let firebaseAdmin = null;

try {
  webpush = require('web-push');
} catch {
  webpush = null;
}

try {
  firebaseAdmin = require('firebase-admin');
} catch {
  firebaseAdmin = null;
}

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contact@colloexpress.local';

if (webpush && vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
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
  return {
    webPushEnabled: Boolean(webpush && vapidPublicKey && vapidPrivateKey),
    vapidPublicKey,
    nativePushEnabled: Boolean(firebaseAdmin),
  };
}

function normalizePayload(payload = {}) {
  return {
    title: String(payload.title || 'Collo').slice(0, 80),
    body: String(payload.body || '').slice(0, 180),
    url: String(payload.url || '/').slice(0, 300),
    tag: String(payload.tag || 'colloexpress').slice(0, 80),
    orderId: payload.orderId ? String(payload.orderId).slice(0, 80) : '',
    type: payload.type ? String(payload.type).slice(0, 60) : '',
  };
}

async function sendWeb(target, payload) {
  if (!webpush || !vapidPublicKey || !vapidPrivateKey || !target.endpoint || !target.p256dh || !target.auth) {
    return false;
  }

  try {
    await webpush.sendNotification({
      endpoint: target.endpoint,
      keys: {
        p256dh: target.p256dh,
        auth: target.auth,
      },
    }, JSON.stringify(payload));
    return true;
  } catch (error) {
    if ([404, 410].includes(Number(error.statusCode))) {
      await db.removePushTarget(target.id || target._id);
    } else {
      console.warn('Push web impossible:', error.message);
    }
    return false;
  }
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
      },
    });
    return response.successCount || 0;
  } catch (error) {
    console.warn('Push native impossible:', error.message);
    return 0;
  }
}

async function sendTargets(targets, rawPayload) {
  const payload = normalizePayload(rawPayload);
  const webTargets = targets.filter((target) => target.type === 'web');
  const nativeTokens = [...new Set(targets
    .filter((target) => target.type === 'native' && target.token)
    .map((target) => target.token))];

  const webResults = await Promise.allSettled(webTargets.map((target) => sendWeb(target, payload)));
  const webCount = webResults.filter((result) => result.status === 'fulfilled' && result.value).length;
  const nativeCount = await sendNative(nativeTokens, payload);

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
