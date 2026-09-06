function asegurarHistorialClientes() {
    if (!historialClientes || typeof historialClientes !== 'object') historialClientes = {};
    return historialClientes;
}

function obtenerClaveHistorialCliente(cliente) {
    if (!cliente || typeof cliente !== 'object') return '';
    const nombre = String(cliente.personaNombre || cliente.clienteNombre || '').trim().toLowerCase();
    if (!nombre) return '';
    return nombre;
}

function obtenerRegistroHistorialCliente(cliente, crearSiNoExiste = true) {
    const key = obtenerClaveHistorialCliente(cliente);
    if (!key) return null;
    const mapa = asegurarHistorialClientes();
    if (!mapa[key] && crearSiNoExiste) {
        mapa[key] = {
            key: key,
            nombre: cliente.personaNombre || cliente.clienteNombre || 'Cliente',
            visitas: 0,
            ordenesCompletadas: 0,
            ordenesFallidas: 0,
            rechazos: 0,
            casosGarantia: 0,
            ultimaVisitaDia: 0,
            ultimoResultado: 'sin_historial'
        };
    }
    return mapa[key] || null;
}

function calcularEstrellasFidelidadCliente(registro) {
    if (!registro) return 1;
    const visitas = Math.max(0, registro.visitas || 0);
    const completadas = Math.max(0, registro.ordenesCompletadas || 0);
    const fallidas = Math.max(0, registro.ordenesFallidas || 0);
    const rechazos = Math.max(0, registro.rechazos || 0);
    const score = (completadas * 2.2) + (visitas * 0.35) - (fallidas * 1.5) - (rechazos * 0.9);
    return Math.max(1, Math.min(5, Math.round(2.2 + (score / 4.5))));
}

function obtenerEtiquetaPerfilCliente(registro) {
    if (!registro) return 'nuevo';
    const visitas = Math.max(0, registro.visitas || 0);
    const problematico = (registro.rechazos || 0) >= 2 || (registro.ordenesFallidas || 0) >= 2;
    if (problematico) return 'problematico';
    if (visitas <= 1) return 'nuevo';
    return 'conocido';
}

function formatearEstrellas(valor) {
    const n = Math.max(1, Math.min(5, Math.round(valor || 1)));
    return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
}

function registrarVisitaCliente(cliente) {
    const reg = obtenerRegistroHistorialCliente(cliente, true);
    if (!reg) return null;
    reg.nombre = cliente.personaNombre || reg.nombre || 'Cliente';
    reg.visitas = Math.max(0, reg.visitas || 0) + 1;
    reg.ultimaVisitaDia = Math.max(0, dia || 0);
    if (cliente && cliente.miniHistoriaTipo === 'garantia_falsa') {
        reg.casosGarantia = Math.max(0, reg.casosGarantia || 0) + 1;
    }
    if (reg.visitas > 1 && typeof registrarEventoNarrativo === 'function') {
        registrarEventoNarrativo('cliente_recurrente', {
            nombre: reg.nombre,
            visitas: reg.visitas,
            perfil: obtenerEtiquetaPerfilCliente(reg)
        });
    }
    return reg;
}

function registrarResultadoVisitaCliente(cliente, resultado, extras) {
    const reg = obtenerRegistroHistorialCliente(cliente, true);
    if (!reg) return null;
    const r = String(resultado || '').toLowerCase();
    if (r === 'completado') {
        reg.ordenesCompletadas = Math.max(0, reg.ordenesCompletadas || 0) + 1;
    } else if (r === 'fallido') {
        reg.ordenesFallidas = Math.max(0, reg.ordenesFallidas || 0) + 1;
    } else if (r === 'rechazado') {
        reg.rechazos = Math.max(0, reg.rechazos || 0) + 1;
    }
    if (extras && extras.esGarantia) {
        reg.casosGarantia = Math.max(0, reg.casosGarantia || 0) + 1;
    }
    reg.ultimoResultado = r || reg.ultimoResultado || 'seguimiento';
    reg.ultimaVisitaDia = Math.max(0, dia || reg.ultimaVisitaDia || 0);
    if (r === 'rechazado' && typeof registrarEventoNarrativo === 'function') {
        registrarEventoNarrativo('cliente_rechazado', { nombre: reg.nombre, motivo: extras && extras.motivo || '' });
    }
    return reg;
}

function obtenerClaveVehiculoExperiencia(vehiculo) {
    const limpio = String(vehiculo || '').trim();
    if (!limpio) return 'GEN';
    const clave = limpio.split(/\s+/)[0] || limpio;
    return clave.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'GEN';
}

function obtenerNivelExperienciaVehiculo(vehiculo) {
    const mapa = (experienciaVehiculoDx && typeof experienciaVehiculoDx === 'object') ? experienciaVehiculoDx : {};
    const key = obtenerClaveVehiculoExperiencia(vehiculo);
    return Math.max(0, Math.round(mapa[key] || 0));
}

function registrarExperienciaVehiculo(vehiculo, puntos) {
    if (!experienciaVehiculoDx || typeof experienciaVehiculoDx !== 'object') experienciaVehiculoDx = {};
    const key = obtenerClaveVehiculoExperiencia(vehiculo);
    const actual = Math.max(0, Math.round(experienciaVehiculoDx[key] || 0));
    experienciaVehiculoDx[key] = Math.max(0, Math.min(120, actual + Math.max(0, Math.round(puntos || 0))));
    return experienciaVehiculoDx[key];
}
