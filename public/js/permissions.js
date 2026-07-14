(function () {
  const GEO_ATTEMPT_KEY = 'kolo_go_geo_permission_attempted_v1';
  const GEO_DENIED_KEY = 'kolo_go_geo_permission_denied_v1';
  const GEO_LAST_POSITION_KEY = 'kolo_go_last_position_v1';

  const isSecure = window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (!isSecure || !('geolocation' in navigator)) return;

  function isAppPage() {
    return document.body && document.body.classList.contains('page-app');
  }

  function getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  }

  function removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  }

  async function canAskForGeolocation() {
    if (!navigator.permissions || !navigator.permissions.query) return true;
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'denied') {
        setItem(GEO_DENIED_KEY, '1');
        return false;
      }
      return permission.state === 'prompt';
    } catch {
      return true;
    }
  }

  function requestGeolocationOnce() {
    setItem(GEO_ATTEMPT_KEY, String(Date.now()));
    navigator.geolocation.getCurrentPosition((position) => {
      removeItem(GEO_DENIED_KEY);
      setItem(GEO_LAST_POSITION_KEY, JSON.stringify({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy || null,
        at: Date.now(),
      }));
    }, (error) => {
      if (error && error.code === 1) setItem(GEO_DENIED_KEY, '1');
    }, {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 300000,
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (!isAppPage()) return;
    if (getItem(GEO_ATTEMPT_KEY) || getItem(GEO_DENIED_KEY)) return;
    if (!(await canAskForGeolocation())) return;
    window.setTimeout(requestGeolocationOnce, 1300);
  });
})();
