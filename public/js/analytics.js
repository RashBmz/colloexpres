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

  let timer = null;

  function start() {
    if (timer) return;
    timer = setInterval(ping, 60000);
  }

  function stop() {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else {
      ping();
      start();
    }
  });

  if (!document.hidden) start();
})();
