/* =============================================================
   SCREEN LOADER
   Inyecta el HTML de cada pantalla en su contenedor.
   Se ejecuta despues de cargar todos los screen-*.js.
   ============================================================= */
(function () {
    var SCREENS = ['taller', 'oficina', 'exterior', 'mapa', 'telefono', 'configuracion'];

    SCREENS.forEach(function (id) {
        var html = window.SCREEN_HTML && window.SCREEN_HTML[id];
        if (!html) return;
        var el = document.getElementById('screen-' + id);
        if (el) el.innerHTML = html;
    });

    // Limpieza: liberar memoria de las plantillas
    if (window.SCREEN_HTML) {
        window.SCREEN_HTML = null;
    }
})();
