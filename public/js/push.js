(function () {
  const isSecure = window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (!isSecure) return;

  function toUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
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

  async function registerWebPush(config) {
    if (!config?.webPushEnabled || !config.vapidPublicKey || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toUint8Array(config.vapidPublicKey),
      });
    }
    await postJson('/push/subscribe', { subscription });
    return true;
  }

  async function registerNativePush() {
    const capacitor = window.Capacitor;
    const pushPlugin = capacitor?.Plugins?.PushNotifications;
    if (!capacitor?.isNativePlatform?.() || !pushPlugin) return false;

    const permission = await pushPlugin.requestPermissions();
    if (permission.receive !== 'granted') return false;

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

  async function activate(config) {
    try {
      await registerNativePush();
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
      }
      if (!('Notification' in window) || Notification.permission === 'granted') {
        await registerWebPush(config);
      }
      document.querySelector('.push-permission-btn')?.remove();
    } catch {
      document.querySelector('.push-permission-btn')?.remove();
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const config = await getConfig().catch(() => null);
    if (!config) return;

    const isNative = window.Capacitor?.isNativePlatform?.();
    if (isNative) {
      buildButton(() => activate(config));
      return;
    }

    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      activate(config);
    } else if (Notification.permission === 'default' && config.webPushEnabled) {
      buildButton(() => activate(config));
    }
  });
})();
