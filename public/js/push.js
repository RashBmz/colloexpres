(function () {
  const isSecure = window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (!isSecure) return;

  const PUSH_PERMISSION_STATE_KEY = 'kolo_go_push_permission_state_v1';

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

  function buildButton(onClick) {
    if (document.querySelector('.push-permission-btn')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'push-permission-btn';
    button.textContent = window.COLLO_LANG === 'ar' ? 'تفعيل التنبيهات' : 'Activer notifications';
    button.addEventListener('click', onClick);
    document.body.appendChild(button);
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
        name: 'Commandes Kolo Go',
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

  async function activate() {
    try {
      await registerNativePush();
    } catch {
      setStoredPushState('denied');
    } finally {
      document.querySelector('.push-permission-btn')?.remove();
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const config = await getConfig().catch(() => null);
    if (!config) return;

    const isNative = window.Capacitor?.isNativePlatform?.();
    if (!isNative) return;

    const nativePermission = await checkNativePushPermission();
    if (nativePermission === 'granted') {
      setStoredPushState('granted');
      activate();
      return;
    }

    const storedState = getStoredPushState();
    if (storedState === 'granted') {
      activate();
      return;
    }
    if (storedState === 'denied') return;

    buildButton(() => activate());
  });
})();
