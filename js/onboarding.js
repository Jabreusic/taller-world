(function () {
    function obtenerObjetivoActual() {
        var pendientes = Array.isArray(window.casosPendientesDiagnostico) ? window.casosPendientesDiagnostico.length : 0;
        var cola = Array.isArray(window.clientesEnEspera) ? window.clientesEnEspera.length : 0;
        var activas = Array.isArray(window.reparacionesActivas) ? window.reparacionesActivas.length : 0;

        if (window.clienteActual) {
            return {
                titulo: 'Diagnostica el caso activo',
                detalle: 'Escucha al cliente, elige una hipótesis y confirma el diagnóstico antes de asignar un mecánico.'
            };
        }
        if (pendientes > 0) {
            return {
                titulo: 'Revisa un diagnóstico pendiente',
                detalle: pendientes + ' caso(s) esperan revisión. Abre Mi puesto para decidir el siguiente paso.'
            };
        }
        if (activas > 0) {
            return {
                titulo: 'Sigue los trabajos en curso',
                detalle: activas + ' reparación(es) están activas. Revisa Trabajos y cobra cuando estén listas.'
            };
        }
        if (cola > 0) {
            return {
                titulo: 'Atiende al siguiente cliente',
                detalle: cola + ' caso(s) esperan en la cola. Selecciona uno para abrir su expediente.'
            };
        }
        return {
            titulo: 'Recibe tu primer cliente',
            detalle: 'Abre la Cola y selecciona un caso para iniciar el flujo del taller.'
        };
    }

    function actualizarObjetivoOnboarding() {
        var objetivo = obtenerObjetivoActual();
        var titulo = document.getElementById('onboarding-objective-title');
        var detalle = document.getElementById('onboarding-objective-detail');
        if (titulo) titulo.textContent = objetivo.titulo;
        if (detalle) detalle.textContent = objetivo.detalle;
        return objetivo;
    }

    window.obtenerObjetivoActual = obtenerObjetivoActual;
    window.actualizarObjetivoOnboarding = actualizarObjetivoOnboarding;
})();
