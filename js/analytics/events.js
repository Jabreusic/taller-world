(function () {
    function obtenerEstadoNarrativo() {
        window.TallerApp = window.TallerApp || {};
        window.TallerApp.state = window.TallerApp.state || {};
        var state = window.TallerApp.state;
        if (!Array.isArray(state.eventosNarrativos)) state.eventosNarrativos = [];
        if (!state.memoriaNarrativa || typeof state.memoriaNarrativa !== 'object') state.memoriaNarrativa = {};
        return state;
    }

    function registrarEventoNarrativo(tipo, detalles) {
        var state = obtenerEstadoNarrativo();
        var evento = {
            id: String(tipo || 'evento') + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
            tipo: String(tipo || 'evento'),
            detalles: detalles && typeof detalles === 'object' ? Object.assign({}, detalles) : {},
            casos: Math.max(0, Math.round(Number(window.resumenCasos && window.resumenCasos.totalCasosJugados) || 0)),
            dia: Math.max(1, Math.round(Number(window.dia) || 1)),
            creadoEn: new Date().toISOString()
        };
        state.eventosNarrativos.push(evento);
        if (state.eventosNarrativos.length > 100) state.eventosNarrativos.splice(0, state.eventosNarrativos.length - 100);
        if (typeof window.actualizarPerfilNarrativoDesdeEvento === 'function') {
            window.actualizarPerfilNarrativoDesdeEvento(evento);
        }
        if (typeof window.actualizarMemoriaNarrativaDesdeEvento === 'function') {
            window.actualizarMemoriaNarrativaDesdeEvento(evento);
        }
        if (typeof window.actualizarMisionNarrativa === 'function' && (evento.tipo !== 'caso_resuelto' || evento.casos <= 1 || evento.casos % 3 === 0)) {
            window.actualizarMisionNarrativa();
        }
        if (typeof window.emitirReaccionNarrativa === 'function') {
            window.emitirReaccionNarrativa(evento);
        }
        return evento;
    }

    function obtenerEventosNarrativos() {
        return obtenerEstadoNarrativo().eventosNarrativos.slice();
    }

    window.registrarEventoNarrativo = registrarEventoNarrativo;
    window.obtenerEventosNarrativos = obtenerEventosNarrativos;
    window.TallerApp.analyticsEvents = { register: registrarEventoNarrativo, list: obtenerEventosNarrativos };
})();
