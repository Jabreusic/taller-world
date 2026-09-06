function obtenerFichaVehiculoParaRepuesto(caso) {
    if (caso && caso.fichaVehiculo) return caso.fichaVehiculo;
    if (typeof construirFichaVehiculoProcedural === 'function') {
        return construirFichaVehiculoProcedural((caso && caso.vehiculo) || 'Vehiculo sin ficha');
    }
    return { clase: 'particular', calidadObjetivo: 'estandar' };
}

function esRepuestoCompatibleConVehiculo(pieza, caso) {
    if (!pieza) return false;
    const ficha = obtenerFichaVehiculoParaRepuesto(caso);
    const calidad = pieza.calidad || 'basica';
    if ((ficha.clase === 'premium' || ficha.clase === 'proyecto') && calidad === 'basica') return false;
    return true;
}

function seleccionarRepuestosCompatibles(caso, especialidad, cantidad) {
    const ficha = obtenerFichaVehiculoParaRepuesto(caso);
    const rank = { basica: 1, estandar: 2, premium: 3 };
    const objetivo = ficha.calidadObjetivo || 'estandar';
    const pool = (ECONOMY_DATA.catalogoRepuestos || []).filter(function(p) {
        return p && p.especialidad === especialidad && esRepuestoCompatibleConVehiculo(p, caso);
    });
    return pool.sort(function(a, b) {
        const distanciaA = Math.abs((rank[a.calidad] || 1) - (rank[objetivo] || 2));
        const distanciaB = Math.abs((rank[b.calidad] || 1) - (rank[objetivo] || 2));
        return distanciaA - distanciaB || (rank[b.calidad] || 0) - (rank[a.calidad] || 0);
    }).slice(0, Math.max(1, cantidad || 1));
}

function construirSolicitudPiezasContinuacion(rep) {
    const pool = seleccionarRepuestosCompatibles(rep, rep.especialidadIdeal, 99);
    if (!pool.length) {
        return [{ id: '', nombre: `pieza de ${rep.especialidadIdeal}`, especialidad: rep.especialidadIdeal, calidad: 'estandar' }];
    }

    const umbralDosPiezas = (typeof modoNivelesActivo === 'function' && modoNivelesActivo()) ? 90 : 6;
    const requiereDos = (rep.tiempoTotal || 0) >= umbralDosPiezas || Math.random() < 0.35;
    const total = requiereDos ? Math.min(2, pool.length) : 1;
    return pool.slice(0, total).map(function(p) {
        return { id: p.id, nombre: p.nombre, especialidad: p.especialidad, calidad: p.calidad || 'estandar' };
    });
}

function obtenerCostoCatalogoRepuesto(idRepuesto) {
    var id = String(idRepuesto || '').trim();
    if (!id) return 0;
    var data = (ECONOMY_DATA.catalogoRepuestos || []).find(function(p) {
        return p && p.id === id;
    });
    return data ? Math.max(0, Math.round((data.costo || 0) * 0.90)) : 0;
}

function obtenerCostoPiezasReparacion(rep) {
    if (!rep || typeof rep !== 'object') return 0;
    var total = 0;
    var agregar = function(p) {
        if (!p || typeof p !== 'object') return;
        var costo = Math.max(0, Math.round(p.costo || 0));
        if (!costo) costo = obtenerCostoCatalogoRepuesto(p.id);
        total += costo;
    };

    if (rep.piezaInstalada) agregar(rep.piezaInstalada);
    if (Array.isArray(rep.piezasContinuacionEntregadas)) {
        rep.piezasContinuacionEntregadas.forEach(agregar);
    }
    return Math.max(0, Math.round(total));
}
