(function () {
  function ping() {
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/analytics/ping', new Blob(['{}'], { type: 'application/json' }));
        return;
      }
      fetch('/analytics/ping', { method: 'POST', keepalive: true }).catch(function () {});
    } catch (_) {}
  }

  ping();
  setInterval(ping, 60000);
})();
