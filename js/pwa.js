(function registrarPWA() {
  if (!('serviceWorker' in navigator)) return;
  var protocol = (window.location && window.location.protocol) ? String(window.location.protocol) : '';
  if (protocol !== 'http:' && protocol !== 'https:') return;

  var refreshing = false;
  var registration = null;
  var updateTimer = null;

  function soportaNotificacionesSistema() {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  function obtenerEstadoNotificacionesSistema() {
    if (!soportaNotificacionesSistema()) return 'unsupported';
    return Notification.permission || 'default';
  }

  window.obtenerEstadoNotificacionesSistema = obtenerEstadoNotificacionesSistema;

  window.enviarNotificacionSistema = function(titulo, opciones) {
    var title = String(titulo || 'Taller World');
    if (!soportaNotificacionesSistema()) return Promise.resolve(false);
    if (Notification.permission !== 'granted') return Promise.resolve(false);

    var payload = Object.assign({
      body: '',
      icon: './img/icon/icon-192.png',
      badge: './img/icon/icon-192.png',
      tag: 'tw-notificacion',
      renotify: false,
      data: { url: './' }
    }, opciones || {});

    if ('serviceWorker' in navigator && navigator.serviceWorker && typeof navigator.serviceWorker.getRegistration === 'function') {
      return navigator.serviceWorker.getRegistration().then(function(reg) {
        if (reg && typeof reg.showNotification === 'function') {
          return reg.showNotification(title, payload).then(function() { return true; });
        }
        try {
          new Notification(title, payload);
          return true;
        } catch (_err) {
          return false;
        }
      }).catch(function() {
        try {
          new Notification(title, payload);
          return true;
        } catch (_err) {
          return false;
        }
      });
    }

    try {
      new Notification(title, payload);
      return Promise.resolve(true);
    } catch (_err) {
      return Promise.resolve(false);
    }
  };

  window.solicitarPermisoNotificaciones = function() {
    if (!soportaNotificacionesSistema()) return Promise.resolve('unsupported');
    var actual = obtenerEstadoNotificacionesSistema();
    if (actual === 'granted' || actual === 'denied') return Promise.resolve(actual);
    return Notification.requestPermission().then(function(permiso) {
      return permiso;
    }).catch(function() {
      return 'default';
    });
  };

  function activarNuevaVersion(reg) {
    if (reg && reg.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', function() {
    navigator.serviceWorker
      .register('./service-worker.js', { updateViaCache: 'none' })
      .then(function(reg) {
        registration = reg;
        activarNuevaVersion(reg);

        reg.addEventListener('updatefound', function() {
          var installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', function() {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              activarNuevaVersion(reg);
            }
          });
        });

        function actualizarRegistro() {
          if (document.visibilityState === 'hidden' || !navigator.onLine) return;
          reg.update().catch(function() {});
        }

        function programarActualizaciones() {
          if (updateTimer) clearInterval(updateTimer);
          updateTimer = setInterval(actualizarRegistro, 120000);
        }

        setTimeout(actualizarRegistro, 1500);
        programarActualizaciones();
        document.addEventListener('visibilitychange', function() {
          if (document.visibilityState === 'visible') actualizarRegistro();
          programarActualizaciones();
        });

      })
      .catch(function(err) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('No se pudo registrar service worker:', err);
        }
      });
  });

  var deferredPrompt = null;
  var installBtn = document.getElementById('pwa-install-btn');
  var connectionStatus = document.getElementById('app-connection-status');

  function actualizarEstadoConexion() {
    var online = navigator.onLine !== false;
    document.body.classList.toggle('is-offline', !online);
    if (connectionStatus) connectionStatus.textContent = online ? 'En línea' : 'Sin conexión';
  }

  actualizarEstadoConexion();
  window.addEventListener('online', actualizarEstadoConexion);
  window.addEventListener('offline', actualizarEstadoConexion);

  if (installBtn) {
    installBtn.addEventListener('click', function() {
      window.promptInstallApp();
    });
  }

  window.addEventListener('beforeinstallprompt', function(event) {
    event.preventDefault();
    deferredPrompt = event;
    window.deferredInstallPrompt = event;
    document.documentElement.classList.add('pwa-installable');
    if (installBtn) installBtn.classList.remove('hidden');
  });

  window.addEventListener('appinstalled', function() {
    deferredPrompt = null;
    window.deferredInstallPrompt = null;
    document.documentElement.classList.remove('pwa-installable');
    if (installBtn) installBtn.classList.add('hidden');
  });

  window.promptInstallApp = async function() {
    var promptEvent = deferredPrompt || window.deferredInstallPrompt;
    if (!promptEvent) return false;
    promptEvent.prompt();
    var choice = await promptEvent.userChoice;
    if (choice && choice.outcome === 'accepted') {
      deferredPrompt = null;
      window.deferredInstallPrompt = null;
      if (installBtn) installBtn.classList.add('hidden');
      return true;
    }
    return false;
  };
})();
