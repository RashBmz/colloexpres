(function () {
  if (!('serviceWorker' in navigator)) return;

  const ACTIVE_CACHE = 'kolo-go-v5';

  window.addEventListener('load', function () {
    if (window.caches) {
      caches.keys().then(function (keys) {
        keys.forEach(function (key) {
          if ((key.indexOf('colloexpress-') === 0 || key.indexOf('kolo-go-') === 0) && key !== ACTIVE_CACHE) {
            caches.delete(key);
          }
        });
      }).catch(function () {});
    }

    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(function (registration) {
      registration.update().catch(function () {});
    }).catch(function () {
      // Installation remains optional; the site must keep working normally.
    });
  });
})();
