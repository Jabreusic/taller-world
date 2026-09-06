(function () {
    var PERFIL_BASE = {
        tecnico: 0,
        velocidad: 0,
        dinero: 0,
        social: 0,
        riesgo: 0,
        legalidad: 0,
        liderazgo: 0
    };

    function obtenerPerfilNarrativo() {
        var state = window.TallerApp && window.TallerApp.state;
        if (!state) return Object.assign({}, PERFIL_BASE);
        if (!state.perfilNarrativo || typeof state.perfilNarrativo !== 'object') state.perfilNarrativo = Object.assign({}, PERFIL_BASE);
        Object.keys(PERFIL_BASE).forEach(function (clave) {
            if (!Number.isFinite(Number(state.perfilNarrativo[clave]))) state.perfilNarrativo[clave] = 0;
            state.perfilNarrativo[clave] = Math.max(-100, Math.min(100, Math.round(Number(state.perfilNarrativo[clave]))));
        });
        return state.perfilNarrativo;
    }

    function sumarPerfilNarrativo(cambios) {
        var perfil = obtenerPerfilNarrativo();
        Object.keys(cambios || {}).forEach(function (clave) {
            if (Object.prototype.hasOwnProperty.call(PERFIL_BASE, clave)) perfil[clave] += Number(cambios[clave]) || 0;
        });
        return obtenerPerfilNarrativo();
    }

    function actualizarPerfilNarrativoDesdeEvento(evento) {
        var detalles = evento.detalles || {};
        var cambios = {};
        if (evento.tipo === 'caso_resuelto') {
            if (detalles.resultado === 'exitoso') cambios.tecnico = 2;
            if (detalles.resultado === 'fallido') cambios.tecnico = -1;
            if (detalles.tiempo && Number(detalles.tiempo) <= 3) cambios.velocidad = 1;
            if (detalles.especialidad === 'hibrido' || detalles.especialidad === 'diagnostico_avanzado') cambios.tecnico = (cambios.tecnico || 0) + 1;
            if (detalles.cliente === 'conocido' || detalles.cliente === 'fiel') cambios.social = 1;
        } else if (evento.tipo === 'caja_b_usada' || evento.tipo === 'prestamo_solicitado') {
            cambios.riesgo = 3;
            cambios.legalidad = -2;
        } else if (evento.tipo === 'control_inspector') {
            cambios.legalidad = detalles.resultado === 'transparente' ? 3 : -3;
        } else if (evento.tipo === 'mejora_comprada') {
            cambios.dinero = 1;
            cambios.liderazgo = detalles.area === 'equipo' ? 2 : 1;
        } else if (evento.tipo === 'cliente_rechazado') {
            cambios.social = -2;
            cambios.velocidad = 1;
        } else if (evento.tipo === 'cliente_recurrente') {
            cambios.social = 2;
        } else if (evento.tipo === 'mecanico_contratado') {
            cambios.liderazgo = 2;
            cambios.social = 1;
        } else if (evento.tipo === 'delivery_usado') {
            cambios.velocidad = 1;
            cambios.tecnico = 1;
        } else if (evento.tipo === 'zona_desbloqueada') {
            cambios.dinero = 1;
        } else if (evento.tipo === 'solicitud_mecanico_atendida') {
            cambios.social = 2;
            cambios.liderazgo = 2;
        } else if (evento.tipo === 'deuda_pagada') {
            cambios.dinero = 2;
            cambios.legalidad = 2;
        }
        return sumarPerfilNarrativo(cambios);
    }

    function obtenerEstiloNarrativoDominante() {
        var perfil = obtenerPerfilNarrativo();
        var claves = Object.keys(PERFIL_BASE);
        return claves.reduce(function (mejor, clave) {
            return perfil[clave] > perfil[mejor] ? clave : mejor;
        }, claves[0]);
    }

    window.obtenerPerfilNarrativo = obtenerPerfilNarrativo;
    window.actualizarPerfilNarrativoDesdeEvento = actualizarPerfilNarrativoDesdeEvento;
    window.obtenerEstiloNarrativoDominante = obtenerEstiloNarrativoDominante;
    window.TallerApp.playerProfile = { get: obtenerPerfilNarrativo, dominant: obtenerEstiloNarrativoDominante };
})();
