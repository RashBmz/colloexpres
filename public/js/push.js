(function () {
  const isSecure = window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (!isSecure) return;

  const PUSH_PERMISSION_STATE_KEY = 'kolo_go_push_permission_state_v1';
  const PUSH_PERMISSION_LAST_ATTEMPT_KEY = 'kolo_go_push_permission_last_attempt_v1';

  function isStandalonePwa() {
    return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function getWebPushPlatform() {
    const ua = navigator.userAgent || '';
    const prefix = isStandalonePwa() ? 'pwa' : 'web';
    if (/iPad|iPhone|iPod/i.test(ua)) return prefix + '-ios';
    if (/Android/i.test(ua)) return prefix + '-android';
    return prefix;
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i += 1) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  function getStoredPushState() {
    try {
      return localStorage.getItem(PUSH_PERMISSION_STATE_KEY) || '';
    } catch {
      return '';
    }
  }

  function setStoredPushState(state) {
    try {
      localStorage.setItem(PUSH_PERMISSION_STATE_KEY, state);
    } catch {}
  }

  async function postJson(url, body) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('push_post_failed');
    return response.json();
  }

  async function getConfig() {
    const response = await fetch('/push/config', { credentials: 'same-origin' });
    if (!response.ok) return null;
    return response.json();
  }

  function markPermissionAttempt() {
    try {
      localStorage.setItem(PUSH_PERMISSION_LAST_ATTEMPT_KEY, String(Date.now()));
    } catch {}
  }

  function wasPermissionAttempted() {
    try {
      return Boolean(localStorage.getItem(PUSH_PERMISSION_LAST_ATTEMPT_KEY));
    } catch {
      return false;
    }
  }

  async function checkNativePushPermission() {
    const capacitor = window.Capacitor;
    const pushPlugin = capacitor?.Plugins?.PushNotifications;
    if (!capacitor?.isNativePlatform?.() || !pushPlugin?.checkPermissions) return '';
    try {
      const permission = await pushPlugin.checkPermissions();
      return permission.receive || '';
    } catch {
      return '';
    }
  }

  async function registerNativePush() {
    const capacitor = window.Capacitor;
    const pushPlugin = capacitor?.Plugins?.PushNotifications;
    if (!capacitor?.isNativePlatform?.() || !pushPlugin) return false;

    const permission = await pushPlugin.requestPermissions();
    if (permission.receive !== 'granted') {
      setStoredPushState('denied');
      return false;
    }

    setStoredPushState('granted');

    if (capacitor.getPlatform?.() === 'android' && pushPlugin.createChannel) {
      await pushPlugin.createChannel({
        id: 'collo_orders',
        name: 'Commandes Koloo Go',
        description: 'Alertes de commandes et livraisons',
        importance: 5,
        visibility: 1,
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: '#ff7a1a',
      }).catch(() => null);
    }

    await pushPlugin.addListener('registration', (token) => {
      postJson('/push/native-token', {
        token: token.value,
        platform: capacitor.getPlatform?.() || 'android',
      }).catch(() => null);
    });

    await pushPlugin.addListener('pushNotificationActionPerformed', (event) => {
      const url = event.notification?.data?.url || '/';
      window.location.href = url;
    });

    await pushPlugin.register();
    return true;
  }

  async function registerWebPush(config) {
    if (!config?.webPushEnabled || !config.vapidPublicKey) return false;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setStoredPushState(permission === 'denied' ? 'denied' : 'prompted');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey),
      });
    }

    await postJson('/push/subscribe', {
      subscription,
      platform: getWebPushPlatform(),
    });
    setStoredPushState('granted');
    return true;
  }

  async function activate(config) {
    try {
      const isNative = window.Capacitor?.isNativePlatform?.();
      markPermissionAttempt();
      if (isNative) await registerNativePush();
      else await registerWebPush(config);
    } catch {
      setStoredPushState('prompted');
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const config = await getConfig().catch(() => null);
    if (!config) return;

    const isNative = window.Capacitor?.isNativePlatform?.();
    const isPwa = isStandalonePwa();
    if (isNative && !config.nativePushEnabled) return;
    if (!isNative && !config.webPushEnabled) return;

    const nativePermission = await checkNativePushPermission();
    if (nativePermission === 'granted') {
      setStoredPushState('granted');
      activate(config);
      return;
    }

    const storedState = getStoredPushState();
    if (storedState === 'granted') {
      activate(config);
      return;
    }
    if (storedState === 'denied' || storedState === 'prompted' || wasPermissionAttempted()) return;

    window.setTimeout(() => activate(config), 900);
  });
})();
